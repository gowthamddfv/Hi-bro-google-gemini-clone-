import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { HeaderModelSelector } from './components/HeaderModelSelector';
import { ChatSession, Message, ModelType, AppTheme, Attachment } from './types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from './utils';
import { useAuth } from './AuthContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { syncSessionToFirestore, deleteSessionFromFirestore, handleFirestoreError, OperationType } from './db';
import { db } from './firebase';

export default function App() {
  const { user, login, logout, loading } = useAuth();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  const [model, setModel] = useState<ModelType>('gemini-2.5-flash');
  const [thinking, setThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('nova_theme') as AppTheme) || 'default';
  });
  const [chatStyle, setChatStyle] = useState<import('./types').ChatStyle>(() => {
    return (localStorage.getItem('nova_chat_style') as import('./types').ChatStyle) || 'claude';
  });

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Fetch sessions from Firestore
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/sessions`), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions: ChatSession[] = [];
      snapshot.forEach(doc => {
        fetchedSessions.push(doc.data() as ChatSession);
      });
      setSessions(fetchedSessions);
      
      if (fetchedSessions.length > 0) {
        setActiveSessionId(prev => {
          if (!prev || !fetchedSessions.find(s => s.id === prev)) {
            return fetchedSessions[0].id;
          }
          return prev;
        });
      } else {
        handleNewChat();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sessions`);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync to Firestore on changes
  useEffect(() => {
    if (user && sessions.length > 0) {
      const active = sessions.find(s => s.id === activeSessionId);
      if (active) {
        syncSessionToFirestore(user.uid, active);
      }
    }
  }, [sessions, activeSessionId, user]);

  useEffect(() => {
    localStorage.setItem('nova_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nova_chat_style', chatStyle);
  }, [chatStyle]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      updatedAt: Date.now(),
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    if (user) {
      syncSessionToFirestore(user.uid, newSession);
    }
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Create initial chat if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    } else if (!activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, []);

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      const newSession: ChatSession = { id: currentSessionId, title: content.slice(0, 30) || 'New Chat', updatedAt: Date.now(), messages: [] };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    } else {
      // Update title if first message
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId && s.messages.length === 0) {
          return { ...s, title: content.slice(0, 30) || 'New Chat', updatedAt: Date.now() };
        }
        return s;
      }));
    }

    const userMessage: Message = { id: uuidv4(), role: 'user', content, attachments, timestamp: Date.now() };
    const modelMessageId = uuidv4();
    const tempModelMessage: Message = { id: modelMessageId, role: 'model', content: '', timestamp: Date.now() + 1 };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, userMessage, tempModelMessage], updatedAt: Date.now() };
      }
      return s;
    }));

    try {
      const messagesToSend = [...(sessions.find(s => s.id === currentSessionId)?.messages || []), userMessage];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          model,
          thinking
        })
      });

      if (!response.ok) {
        let errorMsg = `Server error: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                fullText += `\n\n**Error**: ${data.error}`;
              } else if (data.text) {
                fullText += data.text;
              }
              
              setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map(m => m.id === modelMessageId ? { ...m, content: fullText } : m)
                  };
                }
                return s;
              }));
            } catch (e) {
              console.error('Error parsing SSE data', e, dataStr);
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: s.messages.map(m => m.id === modelMessageId ? { ...m, content: `Error: ${error.message || 'Connection failed'}` } : m)
          };
        }
        return s;
      }));
    }
  };

  return (
    <div className={`flex h-[100dvh] w-full bg-stone-50 overflow-hidden text-stone-900 relative ${theme !== 'default' ? `theme-${theme}` : ''}`}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={id => {
          setActiveSessionId(id);
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteSession={id => {
          setSessions(prev => prev.filter(s => s.id !== id));
          if (activeSessionId === id) setActiveSessionId(null);
          if (user) {
            deleteSessionFromFirestore(user.uid, id);
          }
        }}
        currentTheme={theme}
        onThemeChange={setTheme}
        currentStyle={chatStyle}
        onStyleChange={setChatStyle}
      />
      
      <main className={cn(
        "flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 overflow-hidden",
        chatStyle === 'chatgpt' ? "bg-[#212121]" :
        chatStyle === 'gemini' ? "bg-white" :
        "bg-stone-50"
      )}>
        {/* Header */}
        <header className={cn(
          "absolute top-0 left-0 right-0 h-24 flex items-start pt-4 px-4 shrink-0 z-20 pointer-events-none",
          chatStyle === 'chatgpt' ? "bg-gradient-to-b from-[#212121] via-[#212121]/80 to-transparent" :
          chatStyle === 'gemini' ? "bg-gradient-to-b from-white via-white/80 to-transparent" :
          "bg-gradient-to-b from-stone-50 via-stone-50/80 to-transparent"
        )}>
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "p-2 -ml-2 rounded-xl transition-colors mr-3 pointer-events-auto",
                chatStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" :
                chatStyle === 'gemini' ? "hover:bg-stone-100 text-stone-600" :
                "hover:bg-stone-200/50 text-stone-600"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          )}
          
          <div className="flex-1 flex items-center pointer-events-auto">
            <HeaderModelSelector 
              model={model} 
              setModel={setModel} 
              thinking={thinking} 
              setThinking={setThinking} 
            />
          </div>
          
          <div className="ml-auto flex items-center gap-2 pl-2 shrink-0 pointer-events-auto">
            {user ? (
              <button 
                onClick={logout}
                className={cn("px-3 py-1.5 rounded-xl transition-colors text-sm font-medium", 
                chatStyle === 'chatgpt' ? "bg-[#303030] hover:bg-[#404040] text-stone-200" :
                chatStyle === 'gemini' ? "bg-stone-100 hover:bg-stone-200 text-stone-700" :
                "bg-stone-200 hover:bg-stone-300 text-stone-700"
              )}>
                Sign Out
              </button>
            ) : (
              <button 
                onClick={login}
                className={cn("px-3 py-1.5 rounded-xl transition-colors text-sm font-medium text-white shadow-sm", 
                chatStyle === 'chatgpt' ? "bg-white text-black hover:bg-gray-200" :
                chatStyle === 'gemini' ? "bg-blue-600 hover:bg-blue-700" :
                "bg-primary hover:bg-primary-hover"
              )}>
                Sign In
              </button>
            )}
            <button className={cn("p-2 rounded-xl transition-colors hidden sm:flex", 
              chatStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" :
              chatStyle === 'gemini' ? "hover:bg-stone-100 text-stone-600" :
              "hover:bg-stone-200/50 text-stone-600"
            )}>
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>
            </button>
            <button className={cn("p-2 rounded-xl transition-colors", 
              chatStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" :
              chatStyle === 'gemini' ? "hover:bg-stone-100 text-stone-600" :
              "hover:bg-stone-200/50 text-stone-600"
            )}>
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </header>

        <ChatArea 
          messages={messages} 
          onSendMessage={handleSendMessage}
          chatStyle={chatStyle}
        />
      </main>
    </div>
  );
}
