import React, { useState } from 'react';
import { Check, Copy, Code, Eye, Maximize, Minimize, X } from 'lucide-react';
import { cn } from '../utils';

export function CodeBlock({ node, className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  
  const [copied, setCopied] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const isWebCode = language === 'html' || language === 'xml' || language === 'svg';
  
  return (
    <>
      <div className="my-4 flex flex-col rounded-xl overflow-hidden bg-stone-900 border border-stone-800 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-400 font-mono">{language || 'text'}</span>
            {isWebCode && (
              <div className="flex bg-stone-900 rounded p-0.5 ml-2">
                <button 
                  onClick={() => setIsPreview(false)}
                  className={cn("px-2 py-1 text-xs rounded transition-colors flex items-center gap-1.5", !isPreview ? "bg-stone-800 text-stone-200 shadow-sm" : "text-stone-500 hover:text-stone-300")}
                >
                  <Code size={12} /> Code
                </button>
                <button 
                  onClick={() => setIsPreview(true)}
                  className={cn("px-2 py-1 text-xs rounded transition-colors flex items-center gap-1.5", isPreview ? "bg-stone-800 text-stone-200 shadow-sm" : "text-stone-500 hover:text-stone-300")}
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPreview && isWebCode && (
              <button 
                onClick={() => setIsFullscreen(true)}
                className="text-stone-400 hover:text-white transition-colors p-1 rounded"
                title="Fullscreen Preview"
              >
                <Maximize size={14} />
              </button>
            )}
            <button 
              onClick={copyToClipboard}
              className="text-stone-400 hover:text-white transition-colors p-1 rounded"
              title="Copy code"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
        
        {isPreview && isWebCode ? (
          <div className="bg-white p-4 overflow-auto min-h-[200px] h-[400px]">
            <iframe 
              srcDoc={codeString} 
              title="preview"
              sandbox="allow-scripts"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto max-h-[500px]">
            <pre className="!bg-transparent !p-0 !m-0 !shadow-none">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        )}
      </div>

      {isFullscreen && isPreview && isWebCode && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="bg-white w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-[1400px] max-h-[1000px]">
            <div className="flex items-center justify-between px-4 py-3 bg-stone-100 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-600 font-medium text-sm">
                <Eye size={16} /> Preview
              </div>
              <button 
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 hover:bg-stone-200 text-stone-500 hover:text-stone-700 rounded-lg transition-colors"
                title="Close Fullscreen"
              >
                <Minimize size={18} />
              </button>
            </div>
            <div className="flex-1 bg-white p-4">
              <iframe 
                srcDoc={codeString} 
                title="preview fullscreen"
                sandbox="allow-scripts"
                className="w-full h-full border-0 rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
