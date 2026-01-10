import { Button } from "./ui/button";
import { Mic, MicOff, PhoneOff, Phone, Loader2 } from "lucide-react";

interface VoiceControlsProps {
  isActive: boolean;
  isStarting: boolean;
  onStart: () => void;
  onEnd: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VoiceControls({ 
  isActive, 
  isStarting, 
  onStart, 
  onEnd,
  isMuted,
  onToggleMute 
}: VoiceControlsProps) {

  if (!isActive) {
    return (
      <div className="flex justify-center items-center h-full">
         <Button 
            onClick={onStart}
            size="lg"
            disabled={isStarting}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
          >
            {isStarting ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                </>
            ) : (
                <>
                    <Phone size={20} />
                    Start Interview
                </>
            )}
          </Button>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center gap-4 py-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMute}
        className={`h-12 w-12 rounded-full border-2 ${isMuted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-100 border-gray-200 text-gray-700'}`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </Button>

      <Button
        variant="destructive"
        onClick={onEnd}
        className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 py-6 h-auto shadow-md flex items-center gap-2"
      >
        <PhoneOff size={20} />
        End Call
      </Button>
      
      <div className="absolute right-8 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Live</span>
      </div>
    </div>
  );
}
