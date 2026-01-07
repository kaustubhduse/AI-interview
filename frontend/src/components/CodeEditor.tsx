import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (language: string) => void;
}

export default function CodeEditor({ code, setCode, language, setLanguage }: CodeEditorProps) {
  return (
    <div className="h-full w-full border-r border-gray-200">
      <div className="bg-gray-100 p-2 border-b border-gray-200 font-medium text-sm text-gray-700 flex justify-between items-center px-4">
        <span>Code Editor</span>
        <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
        >
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
        </select>
      </div>
      <Editor
        height="calc(100vh - 40px)"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
