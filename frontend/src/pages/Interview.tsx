import { useState, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import TranscriptPanel from "../components/TranscriptPanel";
import VoiceControls from "../components/VoiceControls";
import { startVapiSession, stopVapiSession } from "../services/vapi";
import vapi from "../services/vapi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";

const useVapiEvents = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<{ role: "user" | "assistant"; content: string } | null>(null);

  useEffect(() => {
    const onCallStart = () => setIsSessionActive(true);
    const onCallEnd = () => setIsSessionActive(false);
    
    const onMessage = (message: any) => {
      if (message.type === "transcript") {
         if (message.transcriptType === "partial") {
             setActiveTranscript({ role: message.role, content: message.transcript });
         } else if (message.transcriptType === "final") {
             setActiveTranscript(null); 
             setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === message.role) {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + " " + message.transcript }
                    ];
                } else {
                    return [
                      ...prev,
                      { role: message.role, content: message.transcript },
                    ];
                }
            });
         }
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);

    return () => {
      vapi.removeListener("call-start", onCallStart);
      vapi.removeListener("call-end", onCallEnd);
      vapi.removeListener("message", onMessage);
    };
  }, []);

  const displayMessages = [...messages];
  if (activeTranscript) {
      const lastMsg = displayMessages[displayMessages.length - 1];
       if (lastMsg && lastMsg.role === activeTranscript.role) {
            displayMessages[displayMessages.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + " " + activeTranscript.content
            };
       } else {
           displayMessages.push(activeTranscript);
       }
  }

  return { isSessionActive, messages: displayMessages, activeTranscript };
};

interface Problem {
    id: string;
    title: string;
    description: string;
    examples: Array<{ input: string; output: string }>;
    starterCode: string;
    difficulty: string;
}

export default function Interview() {
  const [code, setCode] = useState("// Loading problem...");
  const { isSessionActive, messages, activeTranscript } = useVapiEvents();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

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
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/interview/start`, {
          problemId: problem.id
      });
      
      const assistantId = res.data.id; 
      
      if (assistantId) {
          await startVapiSession(assistantId);
          setSessionId(res.data.id); 
      } else {
        console.error("No Assistant ID found");
        alert("Failed to initialize voice assistant. Please try again.");
      }
      
    } catch (err) {
      console.error("Failed to start", err);
      if (axios.isAxiosError(err)) {
          const errorMessage = err.response?.data?.error || err.message;
          alert(`Failed to start interview: ${errorMessage}. Check backend logs.`);
      } else {
          alert("Failed to start interview due to a network or server error.");
      }
    } finally {
        setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    setIsEnding(true);
    stopVapiSession();
    
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
    }
  };

  const [language, setLanguage] = useState("javascript");

  let status = "Ready";
  if (isSessionActive) {
      if (activeTranscript?.role === "assistant") {
          status = "AI Speaking";
      } else if (activeTranscript?.role === "user") {
          status = "User Speaking";
      } else {
          status = "Listening...";
      }
  }
  
  if (loading) {
      return (
          <div className="flex items-center justify-center h-screen bg-[#f8f9fc]">
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                <span className="text-gray-600 font-medium">Preparing your interview environment...</span>
              </div>
          </div>
      )
  }

  if (isEnding) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fc]">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800">Analyzing your interview...</h2>
            <p className="text-gray-500 mt-2 text-lg">Our AI is generating your personalized feedback report.</p>
        </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f8f9fc] overflow-hidden font-sans">
      <div className="w-1/2 h-full flex flex-col border-r border-gray-200 shadow-xl z-20 bg-white relative">
        <div className="p-6 border-b border-gray-100 bg-white">
            <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{problem?.title}</h2>
                <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                    problem?.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200' :
                    problem?.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                }`}>
                    {problem?.difficulty}
                </span>
            </div>
            <div className="prose prose-sm max-w-none text-gray-600 mb-6 leading-relaxed">
                {problem?.description}
            </div>
            
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Test Cases</h3>
                {problem?.examples.map((ex, i) => (
                    <div key={i} className="mb-3 last:mb-0 text-sm font-mono bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-gray-800 mb-1"><span className="text-blue-600 font-semibold select-none">Input:</span> {ex.input}</div>
                        <div className="text-gray-800"><span className="text-emerald-600 font-semibold select-none">Output:</span> {ex.output}</div>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
             <CodeEditor code={code} setCode={setCode} language={language} setLanguage={setLanguage} />
        </div>
      </div>

      <div className="w-1/2 h-full flex flex-col bg-[#f8f9fc]">
        <div className="flex-1 overflow-hidden p-6">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden ring-1 ring-black/5">
                <TranscriptPanel messages={messages} />
             </div>
        </div>
        <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-10 flex flex-col gap-4">
          {isSessionActive && (
              <div className="flex justify-center items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === "AI Speaking" ? "bg-blue-600 animate-pulse" : status === "User Speaking" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
                  <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">{status}</span>
              </div>
          )}
          <VoiceControls 
            isActive={isSessionActive} 
            isStarting={isStarting}
            onStart={handleStart} 
            onEnd={handleEnd} 
          />
        </div>
      </div>
    </div>
  );
}
