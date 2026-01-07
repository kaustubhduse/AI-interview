import { useState, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import TranscriptPanel from "../components/TranscriptPanel";
import VoiceControls from "../components/VoiceControls";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomEvent } from "livekit-client";

interface Problem {
    id: string;
    title: string;
    description: string;
    examples: Array<{ input: string; output: string }>;
    starterCode: string;
    difficulty: string;
}

// Helper to capture transcripts from LiveKit events
const TranscriptHandler = ({ setMessages, setActiveTranscript }: { setMessages: any, setActiveTranscript: any }) => {
    const room = useRoomContext();
    const [status, setStatus] = useState("Ready");

    useEffect(() => {
        const ontranscription = (segments: any[], participant: any) => {
             const segment = segments[0];
             if (!segment) return;
             
             const role = participant?.identity === "Candidate" ? "user" : "assistant";
             
             if (!segment.final) {
                 // Update active transcript with each word (don't create new messages)
                 setActiveTranscript({ role, content: segment.text });
             } else {
                 // Only when final, clear active and add to permanent messages
                 setActiveTranscript(null);
                 setMessages((prev: any) => {
                    const lastMsg = prev[prev.length - 1];
                    // If last message exists and role matches, append text
                    if (lastMsg && lastMsg.role === role) {
                        return [
                            ...prev.slice(0, -1),
                            { ...lastMsg, content: lastMsg.content + " " + segment.text }
                        ];
                    }
                    return [...prev, { role, content: segment.text }];
                 });
             }
        };

        room.on(RoomEvent.TranscriptionReceived, ontranscription);
        return () => {
            room.off(RoomEvent.TranscriptionReceived, ontranscription);
        }
    }, [room, setMessages, setActiveTranscript]);

    return null; 
}


export default function Interview() {
  const [code, setCode] = useState("// Loading problem...");
  const [language, setLanguage] = useState("javascript");
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<{ role: "user" | "assistant"; content: string } | null>(null);
  
  // LiveKit State
  const [token, setToken] = useState("");
  const [livekitUrl, setLivekitUrl] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);


  useEffect(() => {
      const fetchProblem = async () => {
          try {
              const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/interview/random-problem`);
              setProblem(res.data);
              setCode(res.data.starterCode);
          } catch (err) {
              console.error("Failed to fetch problem", err);
              setCode("// Failed to load problem. Please refresh.");
          } finally {
              setLoading(false);
          }
      };
      fetchProblem();
  }, []);

  const handleStart = async () => {
    if (!problem) return;
    setIsStarting(true);
    try {
      console.log('🚀 Starting interview with problem:', problem.id, problem.title);
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/interview/start`, {
          problemId: problem.id
      });
      
      setToken(res.data.token);
      setLivekitUrl(res.data.livekitUrl);
      setSessionId(res.data.sessionId);
      
    } catch (err) {
      console.error("Failed to start", err);
      alert("Failed to start interview. Check backend.");
    } finally {
        setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    // Logic to disconnect handled by LiveKitRoom conditional rendering? 
    // Or we explicitly disconnect. 
    // Here we just set ending state and submit.
    setIsEnding(true);
    
    try {
        const transcriptText = messages.map(m => `${m.role}: ${m.content}`).join("\n");
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/interview/end`, {
            sessionId: sessionId || "demo-session", 
            code,
            transcript: transcriptText
        });
        
        navigate("/report", { state: { report: res.data } });
    } catch (err) {
        console.error("Failed to end/evaluate", err);
        alert("Failed to submit interview. Please try again.");
    } finally {
        setIsEnding(false);
        setToken(""); // Disconnects LiveKitRoom
    }
  };

  if (loading) {
       return (
           <div className="flex items-center justify-center h-screen bg-[#f8f9fc]">
               <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
           </div>
       )
  }

  // Derived status for UI (Using activeTranscript)
  let status = "Listening...";
  if (activeTranscript?.role === "assistant") status = "AI Speaking";
  if (activeTranscript?.role === "user") status = "User Speaking";


  return (
    <div className="flex h-screen bg-[#f8f9fc] overflow-hidden font-sans">
      {/* Left: Code Editor */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-200 bg-white relative">
         <div className="p-6 border-b border-gray-100 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{problem?.title}</h2>
            <div className="prose prose-sm max-w-none text-gray-600 mb-6 leading-relaxed">
                {problem?.description}
            </div>
         </div>
         <div className="flex-1 overflow-hidden relative">
             <CodeEditor code={code} setCode={setCode} language={language} setLanguage={setLanguage} />
        </div>
      </div>

      {/* Right: LiveKit Room & Chat */}
      <div className="w-1/2 h-full flex flex-col bg-[#f8f9fc]">
        
        {/* If we have a token, we render the Room. Otherwise we show Start button in the controls area (or empty state) */}
        
        <div className="flex-1 overflow-hidden p-6">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden ring-1 ring-black/5">
                <TranscriptPanel messages={messages} activeTranscript={activeTranscript} />
             </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-200 shadow z-10 flex flex-col gap-4">
             {token && (
                 <LiveKitRoom
                    token={token}
                    serverUrl={livekitUrl}
                    connect={true}
                    audio={true}
                    video={false}
                    onDisconnected={() => setToken("")}
                    data-lk-theme="default"
                 >
                    <RoomAudioRenderer />
                    <TranscriptHandler setMessages={setMessages} setActiveTranscript={setActiveTranscript} />
                 </LiveKitRoom>
             )}

             {token && (
                  <div className="flex justify-center items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status === "AI Speaking" ? "bg-blue-600 animate-pulse" : "bg-gray-400"}`}></div>
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">{status}</span>
                  </div>
             )}

             <VoiceControls 
                isActive={!!token} 
                isStarting={isStarting} 
                onStart={handleStart} 
                onEnd={handleEnd} 
            />
        </div>
      </div>
    </div>
  );
}
