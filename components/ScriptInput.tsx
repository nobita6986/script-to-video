import React, { useRef } from 'react';
import { Wand2, Upload } from 'lucide-react';

interface ScriptInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = React.useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyze(text);
    }
  };

  const handleSample = () => {
    setText(`The sun dipped below the horizon, painting the sky in hues of violent violet and burning orange. 
Detective Miller lit a cigarette, the flame dancing in the reflection of his weary eyes. 
"It's going to be a long night," he muttered to the empty alleyway. 
Suddenly, a metallic clang echoed from the fire escape above, shattering the silence.`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const processFileContent = (content: string, fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'srt') {
      // Basic SRT parsing: remove sequence numbers and timestamps
      const lines = content.split(/\r?\n/);
      const filteredLines = lines.filter(line => {
        // Filter out sequence numbers (just digits)
        if (/^\d+$/.test(line.trim())) return false;
        // Filter out timestamps (e.g., 00:00:00,000 --> 00:00:00,000)
        if (line.includes('-->')) return false;
        // Filter out empty lines
        if (!line.trim()) return false;
        return true;
      });
      setText(filteredLines.join('\n'));
    } else {
      // Treat as plain text
      setText(content);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processFileContent(content, file.name);
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-xl p-6 shadow-2xl border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
          <span className="text-indigo-400">1.</span> Input Script
        </h2>
        <div className="flex gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".txt,.srt" 
            className="hidden" 
          />
          <button 
            onClick={handleImportClick}
            type="button"
            className="text-xs text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            Import TXT/SRT
          </button>
          <button 
            onClick={handleSample}
            type="button"
            className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
          >
            Load Sample
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your movie script, narration, or story here..."
          className="w-full h-48 bg-gray-950 text-gray-300 p-4 rounded-lg border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y font-mono text-sm leading-relaxed"
          disabled={isLoading}
        />
        
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${!text.trim() || isLoading 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20 active:scale-95'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing Script...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Process Script
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScriptInput;