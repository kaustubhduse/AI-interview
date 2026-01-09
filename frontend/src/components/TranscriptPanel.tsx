import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import { Bot, User as UserIcon } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TranscriptPanelProps {
  messages: Message[];
  activeTranscript?: Message | null;
}

export default function TranscriptPanel({ messages, activeTranscript }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeTranscript]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
                <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 text-sm">AI Interviewer</h3>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Live Session
                </p>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && !activeTranscript && (
          <div className="flex flex-col items-center justify-center h-[60%] text-center space-y-4 opacity-50">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border border-gray-100">
                <Bot className="w-8 h-8 text-blue-500" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Interview Ready</p>
                <p className="text-xs text-gray-500">Click the Start button to begin...</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
           const isAI = msg.role === "assistant";
           return (
            <div
                key={idx}
                className={cn(
                "flex w-full gap-4 max-w-3xl mx-auto",
                isAI ? "justify-start" : "justify-end"
                )}
            >
                {isAI && (
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                )}
                
                <div className={cn(
                    "relative px-5 py-3.5 shadow-sm text-[15px] leading-relaxed max-w-[80%]",
                    isAI 
                        ? "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none" 
                        : "bg-blue-600 text-white rounded-2xl rounded-tr-none"
                    )}
                >
                    {msg.content}
                </div>

                {!isAI && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <UserIcon className="w-5 h-5 text-blue-700" />
                    </div>
                )}
            </div>
           );
        })}

        {/* Active Typing / Partial Transcript */}
        {activeTranscript && (
           <div className={cn(
                "flex w-full gap-4 max-w-3xl mx-auto",
                activeTranscript.role === "assistant" ? "justify-start" : "justify-end"
             )}>
                {activeTranscript.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                )}

                <div className={cn(
                    "relative px-5 py-3.5 shadow-lg text-[15px] leading-relaxed max-w-[80%] opacity-90",
                    activeTranscript.role === "assistant"
                        ? "bg-white border border-blue-200 text-gray-800 rounded-2xl rounded-tl-none" 
                        : "bg-blue-500 text-white rounded-2xl rounded-tr-none"
                )}>
                    {activeTranscript.content && (
                        <span>{activeTranscript.content}</span>
                    )}
                    <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-current opacity-50 animate-pulse"></span>
                </div>

                {activeTranscript.role !== "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                         <UserIcon className="w-5 h-5 text-blue-700" />
                    </div>
                )}
           </div>
        )}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
