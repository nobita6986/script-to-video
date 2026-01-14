import React, { useRef } from 'react';
import { Wand2, Upload, FileText } from 'lucide-react';

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
      const lines = content.split(/\r?\n/);
      const filteredLines = lines.filter(line => {
        if (/^\d+$/.test(line.trim())) return false;
        if (line.includes('-->')) return false;
        if (!line.trim()) return false;
        return true;
      });
      setText(filteredLines.join('\n'));
    } else {
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
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass rounded-3xl p-1 shadow-2xl border border-white/10 relative group">
      {/* Decorative gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
      
      <div className="bg-slate-900/90 rounded-[22px] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-violet-400 font-bold text-sm border border-slate-700">1</span>
            Input Script
          </h2>
          <div className="flex flex-wrap gap-3">
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
              className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all border border-slate-700 flex items-center gap-2 hover:border-violet-500/50"
            >
              <Upload className="w-3.5 h-3.5" />
              Import File
            </button>
            <button 
              onClick={handleSample}
              type="button"
              className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all border border-slate-700 flex items-center gap-2 hover:border-violet-500/50"
            >
              <FileText className="w-3.5 h-3.5" />
              Load Sample
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your movie script, narration, or story here... (We'll handle the rest!)"
            className="w-full h-56 bg-slate-950/50 text-slate-200 p-5 rounded-2xl border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none resize-y font-sans text-base leading-relaxed placeholder:text-slate-600 transition-all shadow-inner"
            disabled={isLoading}
          />
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className={`
                flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 transform
                ${!text.trim() || isLoading 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:scale-95'
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
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
    </div>
  );
};

export default ScriptInput;