import React, { useState, useRef } from 'react';
import { Attachment, ChatStyle } from '../types';
import { Send, Image as ImageIcon, Paperclip, X, File } from 'lucide-react';
import { cn } from '../utils';
import { v4 as uuidv4 } from 'uuid';

interface ChatInputProps {
  onSendMessage: (msg: string, attachments?: Attachment[]) => void;
  chatStyle: ChatStyle;
}

export function ChatInput({ onSendMessage, chatStyle }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const filePromise = new Promise<Attachment>((resolve) => {
        reader.onload = (e) => {
          resolve({
            id: uuidv4(),
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            data: e.target?.result as string,
            mimeType: file.type,
          });
        };
      });

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
      
      newAttachments.push(await filePromise);
    }
    
    setAttachments(prev => [...prev, ...newAttachments]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSend = () => {
    if (!input.trim() && attachments.length === 0) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("p-4 sticky bottom-0 z-10 pt-10", 
      chatStyle === 'chatgpt' ? "bg-gradient-to-t from-[#212121] via-[#212121] to-transparent" :
      chatStyle === 'gemini' ? "bg-gradient-to-t from-white via-white to-transparent" :
      "bg-gradient-to-t from-stone-50 via-stone-50 to-transparent"
    )}>
      <div className="max-w-4xl mx-auto">
        <div className={cn(
          "relative rounded-3xl overflow-hidden focus-within:ring-4 transition-all flex flex-col",
          chatStyle === 'chatgpt' ? "bg-[#2f2f2f] border border-[#404040] focus-within:border-[#505050] focus-within:ring-[#404040]/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)]" :
          chatStyle === 'gemini' ? "bg-[#f0f4f9] focus-within:ring-[#e8eaed]/50 shadow-none border-0" :
          "bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-stone-200/60 focus-within:border-primary/30 focus-within:ring-primary/5"
        )}>
          
          {attachments.length > 0 && (
            <div className="px-4 pt-4 flex gap-2 overflow-x-auto pb-2">
              {attachments.map(att => (
                <div key={att.id} className="relative flex-shrink-0 group">
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm",
                    chatStyle === 'chatgpt' ? "bg-[#404040] border-[#505050]" : "bg-stone-50 border-stone-200"
                  )}>
                    {att.type === 'image' ? (
                      <img src={att.data} alt={att.name} className="w-10 h-10 object-cover rounded-md" />
                    ) : (
                      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", 
                        chatStyle === 'chatgpt' ? "bg-[#505050] text-stone-300" : "bg-stone-100 text-stone-500"
                      )}>
                        <File size={20} />
                      </div>
                    )}
                    <div className="max-w-[120px] overflow-hidden">
                      <p className={cn("truncate font-medium", chatStyle === 'chatgpt' ? "text-stone-200" : "text-stone-700")}>{att.name}</p>
                      <p className={cn("text-[10px] uppercase", chatStyle === 'chatgpt' ? "text-stone-400" : "text-stone-400")}>{att.type}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="absolute -top-2 -right-2 bg-white border border-stone-200 rounded-full p-1 text-stone-500 hover:text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <textarea 
            className={cn(
              "w-full max-h-[200px] min-h-[60px] p-4 bg-transparent resize-none outline-none",
              chatStyle === 'chatgpt' ? "text-stone-200 placeholder-stone-500" : "text-stone-800 placeholder-stone-400",
              attachments.length > 0 ? "pb-14 pt-2" : "pb-14"
            )}
            placeholder="Message Nova..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.min(5, input.split('\n').length || 1)}
          />
          
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
            <input type="file" ref={imageInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={cn("p-2.5 rounded-xl transition-colors", 
                chatStyle === 'chatgpt' ? "text-stone-400 hover:text-stone-200 hover:bg-[#404040]" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              )}
            >
              <Paperclip size={18} />
            </button>
            <button 
              onClick={() => imageInputRef.current?.click()}
              className={cn("p-2.5 rounded-xl transition-colors", 
                chatStyle === 'chatgpt' ? "text-stone-400 hover:text-stone-200 hover:bg-[#404040]" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              )}
            >
              <ImageIcon size={18} />
            </button>
          </div>

          <button 
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0}
            className={cn("absolute bottom-3 right-3 p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100",
              chatStyle === 'chatgpt' ? "bg-white text-black disabled:bg-[#404040] disabled:text-stone-500" :
              chatStyle === 'gemini' ? "bg-stone-900 text-white disabled:bg-stone-200 disabled:text-stone-400" :
              "bg-primary text-white disabled:bg-stone-200 disabled:text-stone-400 hover:bg-primary-hover"
            )}
          >
            <Send size={18} className={cn((input.trim() || attachments.length > 0) ? "translate-x-0.5 -translate-y-0.5 transition-transform" : "")} />
          </button>
        </div>
        <div className={cn("text-center mt-3 text-xs", chatStyle === 'chatgpt' ? "text-stone-500" : "text-stone-400")}>
          Nova can make mistakes. Please verify important information.
        </div>
      </div>
    </div>
  );
}
