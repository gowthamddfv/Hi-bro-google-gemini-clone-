import React from 'react';
import { ChatSession, AppTheme, ChatStyle } from '../types';
import { cn } from '../utils';
import { MessageSquare, Plus, PanelLeftClose, Trash2, Palette, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  currentStyle: ChatStyle;
  onStyleChange: (style: ChatStyle) => void;
}

const THEMES: { id: AppTheme; color: string }[] = [
  { id: 'default', color: 'bg-[#dd6e4c]' },
  { id: 'blue', color: 'bg-blue-500' },
  { id: 'green', color: 'bg-green-500' },
  { id: 'yellow', color: 'bg-yellow-500' },
  { id: 'red', color: 'bg-red-500' },
];

export function Sidebar({ isOpen, onClose, sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, currentTheme, onThemeChange, currentStyle, onStyleChange }: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/20 z-40 md:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside className={cn(
        "fixed md:relative inset-y-0 left-0 z-50 w-72 flex flex-col shrink-0 h-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
        isOpen ? "translate-x-0" : "-translate-x-full md:w-0 md:border-r-0 md:overflow-hidden md:opacity-0",
        currentStyle === 'chatgpt' ? "bg-[#171717] text-stone-200 border-r-0" :
        currentStyle === 'gemini' ? "bg-[#f0f4f9] text-[#1f1f1f] border-r border-transparent" :
        "bg-stone-100 text-stone-900 border-r border-stone-200/60"
      )}>
        <div className="w-72 h-full flex flex-col">
          <div className="p-3 pb-2 flex items-center justify-between">
            <button 
              onClick={onClose}
              className={cn("p-2 rounded-xl transition-colors", currentStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" : currentStyle === 'gemini' ? "hover:bg-stone-200/60 text-stone-700" : "hover:bg-stone-200 text-stone-600")}
              title="Close sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
            <button 
              onClick={onNewChat}
              className={cn("p-2 rounded-xl transition-colors flex items-center gap-1.5", currentStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-300" : currentStyle === 'gemini' ? "hover:bg-stone-200/60 text-stone-700" : "hover:bg-stone-200 text-stone-600")}
              title="New chat"
            >
              <Plus size={20} />
            </button>
          </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <div className={cn("text-xs font-medium mb-2 px-2 uppercase tracking-wider", currentStyle === 'chatgpt' ? "text-stone-500" : "text-stone-500")}>Recent Chats</div>
        <AnimatePresence>
          {sessions.map(session => (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              key={session.id}
              className={cn(
                "group flex items-center justify-between px-2 py-2.5 rounded-xl cursor-pointer transition-colors relative",
                activeSessionId === session.id 
                  ? currentStyle === 'chatgpt' ? "bg-[#212121] text-stone-100" : currentStyle === 'gemini' ? "bg-[#d3e3fd] text-[#001d35]" : "bg-stone-200/80 text-stone-900"
                  : currentStyle === 'chatgpt' ? "hover:bg-[#212121] text-stone-300" : currentStyle === 'gemini' ? "hover:bg-stone-200/50 text-stone-800" : "hover:bg-stone-200/50 text-stone-700"
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={activeSessionId === session.id ? (currentStyle === 'chatgpt' ? "text-stone-100" : currentStyle === 'gemini' ? "text-[#001d35]" : "text-stone-700") : "text-stone-400"} />
                <span className="truncate text-sm font-medium">{session.title}</span>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className={cn("opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all absolute right-2", currentStyle === 'chatgpt' ? "hover:bg-[#303030] text-stone-400 hover:text-red-400" : "hover:bg-white/80 text-stone-500 hover:text-red-500")}
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {sessions.length === 0 && (
          <div className={cn("text-sm px-2 py-4", currentStyle === 'chatgpt' ? "text-stone-500" : "text-stone-500")}>No recent chats.</div>
        )}
      </div>
      
      <div className={cn("p-4 border-t flex flex-col gap-4", currentStyle === 'chatgpt' ? "border-[#303030]" : currentStyle === 'gemini' ? "border-transparent" : "border-stone-200/60")}>
        <div className={cn("flex flex-col gap-2 text-sm font-medium", currentStyle === 'chatgpt' ? "text-stone-300" : "text-stone-700")}>
          <div className="flex items-center gap-2">
            <Layout size={16} /> Style
          </div>
          <div className={cn("flex items-center gap-1.5 p-1 rounded-lg", currentStyle === 'chatgpt' ? "bg-[#303030]" : currentStyle === 'gemini' ? "bg-stone-200/50" : "bg-stone-200/50")}>
            <button
              onClick={() => onStyleChange('claude')}
              className={cn("flex-1 px-2 py-1.5 text-xs rounded-md transition-all font-medium", 
                currentStyle === 'claude' ? "bg-white text-stone-900 shadow-sm" : 
                currentStyle === 'chatgpt' ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-700"
              )}
            >Claude</button>
            <button
              onClick={() => onStyleChange('chatgpt')}
              className={cn("flex-1 px-2 py-1.5 text-xs rounded-md transition-all font-medium", 
                currentStyle === 'chatgpt' ? "bg-[#404040] text-white shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >ChatGPT</button>
            <button
              onClick={() => onStyleChange('gemini')}
              className={cn("flex-1 px-2 py-1.5 text-xs rounded-md transition-all font-medium", 
                currentStyle === 'gemini' ? "bg-white text-stone-900 shadow-sm" : 
                currentStyle === 'chatgpt' ? "text-stone-400 hover:text-stone-200" : "text-stone-500 hover:text-stone-700"
              )}
            >Gemini</button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
           <div className={cn("flex items-center gap-2 text-sm font-medium", currentStyle === 'chatgpt' ? "text-stone-300" : "text-stone-700")}>
             <Palette size={16} /> Theme
           </div>
           <div className="flex items-center gap-1.5">
             {THEMES.map(t => (
               <button
                 key={t.id}
                 onClick={() => onThemeChange(t.id)}
                 className={cn(
                   "w-5 h-5 rounded-full border-2 transition-all hover:scale-110",
                   t.color,
                   currentTheme === t.id ? (currentStyle === 'chatgpt' ? "border-white scale-110" : "border-stone-700 scale-110") : "border-transparent"
                 )}
                 title={t.id}
               />
             ))}
           </div>
        </div>
        <div className={cn("text-xs flex justify-between items-center p-2.5 rounded-xl border", 
          currentStyle === 'chatgpt' ? "bg-[#212121] border-[#303030] text-stone-400" : 
          currentStyle === 'gemini' ? "bg-white/50 border-stone-200/30 text-stone-600" : 
          "bg-white/50 border-stone-200/50 text-stone-500")}>
          <span className="font-medium">Nova Chat Enterprise</span>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
        </div>
      </div>
        </div>
    </aside>
    </>
  );
}
