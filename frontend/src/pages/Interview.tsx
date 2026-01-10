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
  useLocalParticipant,
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

const TranscriptHandler = ({ setMessages, setActiveTranscript }: { setMessages: any, setActiveTranscript: any }) => {
    const room = useRoomContext();


    useEffect(() => {
        const ontranscription = (segments: any[], participant: any) => {
             const segment = segments[0];
             if (!segment) return;
             
             const role = participant?.identity === "Candidate" ? "user" : "assistant";
             
             if (!segment.final) {
                 setActiveTranscript({ role, content: segment.text });
             } 
             else {
                 setActiveTranscript(null);
                 setMessages((prev: any) => {
                    const lastMsg = prev[prev.length - 1];
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

const CodeSyncHandler = ({ code }: { code: string }) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    useEffect(() => {
        if (!room || !localParticipant) return;

        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({ type: "code_update", code });
            const data = new TextEncoder().encode(payload);
            console.log("Sending code update:", code); // Log full code as requested
            localParticipant.publishData(data, { reliable: true, topic: "code_update" })
                .catch(e => console.error("Failed to publish code:", e));
        }, 1000); // Debounce 1s

        return () => clearTimeout(timeoutId);
    }, [code, room, localParticipant]);

    return null;
};


const ActiveControls = ({ onEnd }: { onEnd: () => void }) => {
    const { localParticipant } = useLocalParticipant();
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (localParticipant) {
            setIsMuted(!localParticipant.isMicrophoneEnabled);
        }
    }, [localParticipant, localParticipant?.isMicrophoneEnabled]);

    const toggleMute = async () => {
        if (!localParticipant) return;
        const newState = !localParticipant.isMicrophoneEnabled;
        if (newState) {
            await localParticipant.setMicrophoneEnabled(true);
            setIsMuted(false);
        } else {
            await localParticipant.setMicrophoneEnabled(false);
            setIsMuted(true);
        }
    };

    return (
        <VoiceControls 
            isActive={true} 
            isStarting={false} 
            onStart={() => {}} 
            onEnd={onEnd}
            isMuted={isMuted}
            onToggleMute={toggleMute}
        />
    );
};


export default function Interview() {
  const [code, setCode] = useState(`// Solve the problem here
function solution() {
  
}`);
  const [language, setLanguage] = useState("javascript");
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<{ role: "user" | "assistant"; content: string } | null>(null);
  
  const [token, setToken] = useState("");
  const [livekitUrl, setLivekitUrl] = useState("");
  const [isStarting, setIsStarting] = useState(false);

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
      console.log('Starting interview with problem:', problem.id, problem.title);
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

        setToken("");
    }
  };

  if (loading) {
       return (
           <div className="flex items-center justify-center h-screen bg-[#f8f9fc]">
               <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
           </div>
       )
  }

  let status = "Listening...";
  if (activeTranscript?.role === "assistant") status = "AI Speaking";
  if (activeTranscript?.role === "user") status = "User Speaking";


  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-[#f8f9fc] dark:bg-zinc-950 lg:overflow-hidden font-sans">
      {/* Left: Code Editor */}
      <div className="w-full lg:w-1/2 h-[600px] lg:h-full flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative shrink-0">
         <div className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">{problem?.title}</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-zinc-400 mb-6 leading-relaxed">
                {problem?.description}
            </div>
         </div>
         <div className="flex-1 overflow-hidden relative">
             <CodeEditor code={code} setCode={setCode} language={language} setLanguage={setLanguage} />
        </div>
      </div>

      {/* Right: LiveKit Room & Chat */}
      <div className="w-full lg:w-1/2 h-[500px] lg:h-full flex flex-col bg-[#f8f9fc] dark:bg-zinc-950 shrink-0">
        
        
        <div className="flex-1 overflow-hidden p-6">
             <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 h-full flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                <TranscriptPanel messages={messages} activeTranscript={activeTranscript} />
             </div>
        </div>

        {/* Floating Voice Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
             <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-700 shadow-2xl rounded-2xl p-4 ring-1 ring-black/5 dark:ring-white/10 flex flex-col gap-4 transition-all duration-300 hover:shadow-blue-500/10 hover:scale-[1.02]">
                 
                 {token && (
                     <div className="flex justify-center items-center gap-3 py-1">
                         <div className={`w-2.5 h-2.5 rounded-full ${status === "AI Speaking" ? "bg-blue-500 animate-ping" : status === "User Speaking" ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}></div>
                         <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200 tracking-wide flex items-center gap-2">
                            {status}
                            {status === "AI Speaking" && <span className="opacity-50 text-xs font-normal">(Listen...)</span>}
                            {status === "User Speaking" && <span className="opacity-50 text-xs font-normal">(You)</span>}
                         </span>
                     </div>
                 )}

                 {!token ? (
                    <VoiceControls 
                        isActive={false} 
                        isStarting={isStarting} 
                        onStart={handleStart} 
                        onEnd={handleEnd} 
                        isMuted={false}
                        onToggleMute={() => {}}
                    />
                 ) : (
                    <div className="contents">
                        <LiveKitRoom
                            token={token}
                            serverUrl={livekitUrl}
                            connect={true}
                            audio={true}
                            video={false}
                            onDisconnected={() => setToken("")}
                            className="flex flex-col gap-4"
                        >
                            <RoomAudioRenderer />
                            <CodeSyncHandler code={code} />
                            <TranscriptHandler setMessages={setMessages} setActiveTranscript={setActiveTranscript} />
                            <ActiveControls onEnd={handleEnd} />
                        </LiveKitRoom>
                    </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
}
