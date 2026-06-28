import React, { useState, useRef, useEffect, memo } from 'react';
import { Message, Attachment, ChatStyle } from '../types';
import { Send, FileText, Image as ImageIcon, Paperclip, Sparkles, Code, TerminalSquare, Copy, Check, X, File, User, Bot } from 'lucide-react';
import { cn } from '../utils';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { CodeBlock } from './CodeBlock';
import { ChatInput } from './ChatInput';
import { v4 as uuidv4 } from 'uuid';

const MessageItem = memo(({ msg, chatStyle }: { msg: Message, chatStyle: ChatStyle }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex group", msg.role === 'user' ? "justify-end" : "justify-start")}
    >
      <div 
        className={cn(
          "relative",
          chatStyle === 'claude' && cn(
            "rounded-3xl px-5 py-4",
            msg.role === 'user' 
              ? "max-w-[85%] bg-stone-100 text-stone-900 ml-12" 
              : "bg-white border border-stone-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] w-[85%] mr-12 text-stone-900"
          ),
          chatStyle === 'chatgpt' && cn(
            "rounded-2xl px-4 py-3",
            msg.role === 'user'
              ? "max-w-[70%] bg-[#2f2f2f] text-stone-200 ml-12"
              : "w-full text-stone-300"
          ),
          chatStyle === 'gemini' && cn(
            "rounded-2xl px-4 py-3",
            msg.role === 'user'
              ? "max-w-[75%] bg-[#f0f4f9] text-[#1f1f1f] ml-12"
              : "w-full flex gap-4 text-stone-900"
          )
        )}
      >
        {chatStyle === 'gemini' && msg.role === 'model' && (
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white mt-1" style={{ background: 'linear-gradient(135deg, #4285f4, #9b72cb, #d96570)' }}>
            <Sparkles size={16} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {msg.role === 'model' && (
            <div className={cn(
              "flex items-center justify-between mb-3", 
              chatStyle === 'claude' ? "text-primary" : chatStyle === 'chatgpt' ? "text-stone-400" : "text-stone-700"
            )}>
              {chatStyle !== 'gemini' && (
                <div className="flex items-center gap-2">
                  {chatStyle === 'chatgpt' ? (
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-black" />
                    </div>
                  ) : <Sparkles size={16} />}
                  <span className="text-xs font-semibold uppercase tracking-wider">{chatStyle === 'chatgpt' ? 'ChatGPT' : 'Nova'}</span>
                </div>
              )}
              {chatStyle === 'gemini' && <div></div>}
              {msg.content && (
                <button 
                  onClick={() => copyToClipboard(msg.content)}
                  className={cn("opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md",
                    chatStyle === 'chatgpt' ? "hover:bg-[#404040] text-stone-400 hover:text-stone-200" : "hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                  )}
                  title="Copy message"
                >
                  {copiedId === msg.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          )}
        {msg.role === 'user' ? (
          <div className="whitespace-pre-wrap leading-relaxed">
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {msg.attachments.map(att => (
                  <div key={att.id} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm text-sm",
                    chatStyle === 'chatgpt' ? "bg-[#404040] border-[#505050]" : "bg-white border-stone-200"
                  )}>
                    {att.type === 'image' ? (
                      <img src={att.data} alt={att.name} className="w-8 h-8 object-cover rounded" />
                    ) : (
                      <File size={16} className={cn(chatStyle === 'chatgpt' ? "text-stone-300" : "text-stone-500")} />
                    )}
                    <span className={cn("font-medium max-w-[150px] truncate", chatStyle === 'chatgpt' ? "text-stone-200" : "text-stone-700")}>{att.name}</span>
                  </div>
                ))}
              </div>
            )}
            {msg.content}
          </div>
        ) : (
          <div className="markdown-body">
            {msg.content ? (
              <Markdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children, ...props }: any) => {
                    if (React.isValidElement(children)) {
                      return <CodeBlock {...(children as any).props} />;
                    }
                    return <pre {...props}>{children}</pre>;
                  },
                  code: ({ className, children, ...props }: any) => {
                    return (
                      <code className={cn("font-mono text-[0.9em] px-1.5 py-0.5 rounded", 
                        chatStyle === 'chatgpt' ? "bg-white/10 text-stone-200" : "bg-stone-200 text-stone-800",
                        className
                      )} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {msg.content}
              </Markdown>
            ) : (
              <div className="flex gap-1.5 items-center h-6 pl-1">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-stone-300" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-stone-300" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-stone-300" 
                />
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.msg.id === nextProps.msg.id && 
         prevProps.msg.content === nextProps.msg.content && 
         prevProps.chatStyle === nextProps.chatStyle;
});

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (msg: string, attachments?: Attachment[]) => void;
  chatStyle: ChatStyle;
}

export function ChatArea({ messages, onSendMessage, chatStyle }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
      <div className="flex-1 overflow-y-auto px-4 pt-20 pb-6 md:px-8 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Sparkles size={32} />
              </div>
              <h1 className={cn("text-3xl font-serif tracking-tight", chatStyle === 'chatgpt' ? "text-stone-200" : "text-stone-800")}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}.</h1>
              <p className={cn("text-lg", chatStyle === 'chatgpt' ? "text-stone-400" : "text-stone-500")}>How can I help you today?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-8">
                {[
                  { title: 'Write a python script', icon: <Code size={18} /> },
                  { title: 'Summarize a document', icon: <FileText size={18} /> },
                  { title: 'Explain a complex concept', icon: <Sparkles size={18} /> },
                  { title: 'Analyze terminal output', icon: <TerminalSquare size={18} /> }
                ].map((preset, i) => (
                  <motion.button 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    key={preset.title}
                    onClick={() => onSendMessage(preset.title)}
                    className={cn("p-4 rounded-xl border transition-all text-left flex items-center gap-3 group", 
                      chatStyle === 'chatgpt' ? "bg-[#303030] border-[#404040] hover:bg-[#404040] text-stone-300" :
                      chatStyle === 'gemini' ? "bg-white border-stone-200 hover:bg-stone-50 text-stone-700" :
                      "bg-white border-stone-200 hover:border-primary/30 hover:shadow-sm text-stone-700 hover:text-primary"
                    )}
                  >
                    <div className={cn("transition-colors", chatStyle === 'chatgpt' ? "text-stone-500 group-hover:text-stone-300" : "text-stone-400 group-hover:text-primary")}>{preset.icon}</div>
                    <span className="font-medium text-sm">{preset.title}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 pb-12 pt-4 text-stone-900">
              {messages.map((msg) => (
                <MessageItem key={msg.id} msg={msg} chatStyle={chatStyle} />
              ))}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </AnimatePresence>
      </div>

      <ChatInput onSendMessage={onSendMessage} chatStyle={chatStyle} />
    </div>
  );
}
