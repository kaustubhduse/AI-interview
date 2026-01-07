import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TranscriptPanelProps {
  messages: Message[];
}

export default function TranscriptPanel({ messages }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll logic: Instant for updates (typing effect), Smooth for new messages
  useEffect(() => {
    if (bottomRef.current) {
        // We use 'instant' behavior for partial updates to prevent "laggy" scrolling sensation
        // But we could use 'smooth' if it's a completely new bubble.
        // For simplicity and stability with high-frequency updates, 'instant' or 'auto' is often better.
        // Let's try native scrollIntoView with 'block: end'.
        bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <span className="font-semibold text-gray-800 flex items-center gap-2">
            Interview Transcript
        </span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Live</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm transition-all duration-200 ease-in-out",
              msg.role === "assistant"
                ? "bg-blue-600 text-white self-start mr-auto rounded-tl-none"
                : "bg-gray-100 text-gray-800 self-end ml-auto rounded-tr-none"
            )}
          >
            <span className={cn(
                "block text-[10px] font-bold mb-1 opacity-70 uppercase tracking-wider",
                msg.role === "assistant" ? "text-blue-100" : "text-gray-500"
            )}>
              {msg.role}
            </span>
            <span className="whitespace-pre-wrap">{msg.content}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
            </div>
            <p className="text-sm">Ready to start. Click the phone icon below.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
