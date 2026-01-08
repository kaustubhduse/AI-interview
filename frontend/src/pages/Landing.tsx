import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Code, Mic, Terminal, Sparkles, Zap, ChevronRight } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/interview");
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Terminal size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              InterviewAI
            </span>
          </div>
          <div className="flex items-center gap-4">

             <Button onClick={handleStart} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6">
                Get Started
             </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Gradients & Grid */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
        </div>


        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium">
               <Sparkles size={14} />
               <span>AI-Powered Interview Practice</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
               Master your next <br />
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Tech Interview
               </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
              Experience the future of interview prep with our real-time voice AI. Practice coding, get instant feedback, and hire yourself before companies do.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                    size="lg" 
                    onClick={handleStart} 
                    className="h-14 px-8 text-lg rounded-full shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:-translate-y-1 bg-blue-600 hover:bg-blue-700 text-white border-none flex items-center gap-2"
                >
                    Start Free Interview
                    <ChevronRight size={20} />
                </Button>
            </div>
          </div>

          {/* Right: Visual Features */}
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-purple-600/5 rounded-3xl -z-10 transform rotate-3 scale-105" />
             <div className="grid gap-6 relative">
                {/* Feature 1 */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 transform hover:-translate-y-1">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Mic size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Voice Interaction</h3>
                            <p className="text-slate-600 leading-relaxed">Speak naturally. Our AI understands technical jargon and conversational nuances.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Feature 2 */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-300 transform hover:-translate-y-1 ml-8">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <Code size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Live Code Editor</h3>
                            <p className="text-slate-600 leading-relaxed">Write, run, and debug code in real-time with syntax highlighting and auto-completion.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Feature 3 */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-300 transform hover:-translate-y-1">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <Zap size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Instant Feedback</h3>
                            <p className="text-slate-600 leading-relaxed">Get a detailed score card and actionable advice on your code and communication immediately.</p>
                        </div>
                    </CardContent>
                </Card>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
