import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Editor from "@monaco-editor/react";
import { CheckCircle2, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";

export default function Report() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const report = state?.report;

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">No Report Found</h1>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  let feedbackData: any = { raw: "No feedback available." };
  try {
      if (report && report.feedback) {
        feedbackData = typeof report.feedback === 'string' 
            ? JSON.parse(report.feedback) 
            : report.feedback;
      }
  } catch (e) {
      console.error("Failed to parse feedback", e);
      feedbackData = { raw: report?.feedback || "Failed to parse feedback." };
  }

  if (!feedbackData) feedbackData = { raw: "No feedback data." };

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans">
      {/* Header / Navbar Placeholder */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
          <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    InterviewAI
                </span>
                <span className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded text-xs font-medium">Report</span>
             </div>
             <Button onClick={() => navigate("/")} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Home
             </Button>
          </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* Top Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
             {/* Score Card */}
             <Card className="md:col-span-4 lg:col-span-3 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                 <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                    <div className="relative mb-4 group">
                        {/* Conic Gradient for Score */}
                        <div 
                            className="w-40 h-40 rounded-full flex items-center justify-center relative z-10 bg-white dark:bg-zinc-900"
                            style={{
                                background: `conic-gradient(from 0deg, #2563eb ${feedbackData.score ? feedbackData.score * 3.6 : 0}deg, #eff6ff 0deg)`
                                // Note: For dark mode support on the inactive part of gradient, we might need CSS variable or just accept light blue.
                                // A transparent approach or specific dark color would be better but keeping simple for now.
                            }}
                        >
                            {/* Inner white circle to make it a donut */}
                            <div className="w-32 h-32 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-inner">
                                <span className="text-5xl font-extrabold text-blue-600 tracking-tighter">
                                    {feedbackData.score ?? "N/A"}
                                </span>
                            </div>
                        </div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity"></div>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Overall Score</h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Based on code & discussion</p>
                 </CardContent>
             </Card>

             {/* Metrics Breakdown */}
             <Card className="md:col-span-8 lg:col-span-9 border-0 shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900">
                 <CardHeader className="pb-2">
                     <CardTitle className="text-lg text-gray-800">Performance Breakdown</CardTitle>
                 </CardHeader>
                 <CardContent className="grid gap-6 md:grid-cols-3 pt-4">
                    {/* Code Quality */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-zinc-400 font-medium">Code Quality</span>
                            <span className="text-gray-900 dark:text-zinc-100 font-bold">{feedbackData.breakdown?.codeQuality ?? 0}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${feedbackData.breakdown?.codeQuality ?? 0}%` }}></div>
                        </div>
                    </div>
                    {/* Problem Solving */}
                    <div className="space-y-2">
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-zinc-400 font-medium">Problem Solving</span>
                            <span className="text-gray-900 dark:text-zinc-100 font-bold">{feedbackData.breakdown?.problemSolving ?? 0}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${feedbackData.breakdown?.problemSolving ?? 0}%` }}></div>
                        </div>
                    </div>
                    {/* Communication */}
                    <div className="space-y-2">
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-zinc-400 font-medium">Communication</span>
                            <span className="text-gray-900 dark:text-zinc-100 font-bold">{feedbackData.breakdown?.communication ?? 0}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${feedbackData.breakdown?.communication ?? 0}%` }}></div>
                        </div>
                    </div>
                 </CardContent>
             </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-auto lg:h-[calc(100vh-300px)] min-h-[600px]">
          {/* Detailed Feedback Column */}
          <div className="space-y-6 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
            {feedbackData.raw ? (
                <Card className="border-0 shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900"><CardContent className="p-6 prose dark:prose-invert">{feedbackData.raw}</CardContent></Card>
            ) : (
                <>
                  <Card className="border-0 shadow-none bg-transparent">
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm">
                            <h3 className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-400 mb-3"><CheckCircle2 className="w-5 h-5"/> What Went Well</h3>
                            <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">{feedbackData.whatWentWell}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-sm">
                             <h3 className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-400 mb-3"><AlertTriangle className="w-5 h-5"/> Areas for Improvement</h3>
                             <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">{feedbackData.improvements}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                             <h3 className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-400 mb-3"><Lightbulb className="w-5 h-5"/> Edge Cases Considered</h3>
                             <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">{feedbackData.edgeCases}</p>
                        </div>
                      </div>
                  </Card>
                </>
            )}
          </div>

          {/* Code View Column */}
          <div className="h-[500px] lg:h-full">
               <Card className="h-full border-0 shadow-lg ring-1 ring-gray-900 bg-[#1e1e1e] flex flex-col overflow-hidden rounded-xl">
                <CardHeader className="bg-[#1e1e1e] border-b border-gray-800 py-3 px-4">
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-300 text-sm font-mono flex items-center gap-2">
                          <code className="bg-gray-800 px-2 py-0.5 rounded text-xs">solution.js</code>
                          <span className="text-gray-500 text-xs">Read-only</span>
                      </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative">
                   <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={report.interview?.code || report.code || "// No code submitted"}
                    theme="vs-dark"
                    options={{ 
                        readOnly: true, 
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        padding: { top: 16 }
                    }}
                   />
                </CardContent>
              </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
