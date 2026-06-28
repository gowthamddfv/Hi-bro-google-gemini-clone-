import React, { useState, useRef, useEffect } from 'react';
import { ModelType } from '../types';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderModelSelectorProps {
  model: ModelType;
  setModel: (m: ModelType) => void;
  thinking: boolean;
  setThinking: (t: boolean) => void;
}

export function HeaderModelSelector({ model, setModel, thinking, setThinking }: HeaderModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsThinkingOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelLabel = () => {
    if (model === 'gemini-2.5-flash') return 'Flash';
    return 'Pro';
  };

  return (
    <div className="relative z-50" ref={selectorRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-200/50 transition-colors"
      >
        <span className="font-medium text-lg text-stone-700 flex items-center gap-2">
          Nova <span className="text-stone-500 font-normal">{getModelLabel()}</span>
        </span>
        <ChevronDown size={18} className={cn("text-stone-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 w-[280px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-200 overflow-hidden"
          >
            <div className="p-2 flex flex-col gap-1">
              <button
                onClick={() => { setModel('gemini-2.5-flash'); setIsOpen(false); setIsThinkingOpen(false); }}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-stone-100 transition-colors text-left relative"
              >
                <div className="w-5 flex items-center justify-center shrink-0 mt-0.5">
                  {model === 'gemini-2.5-flash' && <Check size={16} className="text-primary" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-stone-900">Flash</span>
                  <span className="text-xs text-stone-500">Fastest answers and all-around help</span>
                </div>
              </button>

              <button
                onClick={() => { setModel('gemini-2.0-flash'); setIsOpen(false); setIsThinkingOpen(false); }}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-stone-100 transition-colors text-left relative"
              >
                <div className="w-5 flex items-center justify-center shrink-0 mt-0.5">
                  {model === 'gemini-2.0-flash' && <Check size={16} className="text-primary" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-stone-900">Pro</span>
                  <span className="text-xs text-stone-500">Advanced reasoning and complex tasks</span>
                </div>
              </button>
            </div>

            <div className="h-px bg-stone-100 w-full" />

            <div className="p-2">
              <button
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 transition-colors text-left"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-stone-900">Thinking level</span>
                  <span className="text-xs text-stone-500">{thinking ? 'Extended' : 'Standard'}</span>
                </div>
                <ChevronDown size={16} className={cn("text-stone-400 transition-transform duration-200", isThinkingOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isThinkingOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-1 p-2 bg-stone-50 rounded-xl mt-1">
                      <button
                        onClick={() => { setThinking(false); setIsOpen(false); setIsThinkingOpen(false); }}
                        className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", !thinking ? "bg-white shadow-sm font-medium text-stone-900" : "text-stone-600 hover:bg-stone-200/50")}
                      >
                        Standard
                      </button>
                      <button
                        onClick={() => { setThinking(true); setModel('gemini-2.0-flash'); setIsOpen(false); setIsThinkingOpen(false); }}
                        className={cn("w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors", thinking ? "bg-white shadow-sm font-medium text-primary" : "text-stone-600 hover:bg-stone-200/50")}
                      >
                        <Sparkles size={14} /> Extended
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
