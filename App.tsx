import React, { useState, useCallback } from 'react';
import ScriptInput from './components/ScriptInput';
import SegmentList from './components/SegmentList';
import ApiManagerModal from './components/ApiManagerModal';
import { ScriptSegment, ProcessingStatus, AudioProvider } from './types';
import { analyzeScript, generateGeminiSpeech } from './services/gemini';
import { generateElevenLabsSpeech } from './services/elevenlabs';
import { Github, Zap, Key } from 'lucide-react';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const handleAnalyze = async (text: string) => {
    setStatus(ProcessingStatus.ANALYZING);
    try {
      const items = await analyzeScript(text);
      
      const newSegments: ScriptSegment[] = items.map((item, index) => ({
        id: `seg-${Date.now()}-${index}`,
        originalText: item.text,
        imagePrompt: item.image_prompt,
        isGeneratingAudio: false,
        isPlaying: false
      }));

      setSegments(newSegments);
      setStatus(ProcessingStatus.COMPLETE);
    } catch (error: any) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
      if (error.message && error.message.includes('No API keys')) {
        setIsApiModalOpen(true);
        alert("Please add a Gemini API key in the settings to continue.");
      } else {
        alert(`Analysis failed: ${error.message}`);
      }
    }
  };

  const handleGenerateAudio = useCallback(async (id: string, provider: AudioProvider) => {
    const segment = segments.find(s => s.id === id);
    if (!segment) return;

    setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingAudio: true } : s));

    try {
      let wavBlob: Blob;
      
      if (provider === 'elevenlabs') {
        wavBlob = await generateElevenLabsSpeech(segment.originalText);
      } else {
        wavBlob = await generateGeminiSpeech(segment.originalText);
      }

      const url = URL.createObjectURL(wavBlob);

      setSegments(prev => prev.map(s => s.id === id ? { 
        ...s, 
        isGeneratingAudio: false,
        audioUrl: url,
        audioBlob: wavBlob,
        provider: provider
      } : s));
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('No API keys')) {
        setIsApiModalOpen(true);
      }
      alert(`Audio generation failed: ${error.message}`);
      setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingAudio: false } : s));
    }
  }, [segments]);

  const handleGenerateAllAudio = async () => {
    setGeneratingAll(true);
    // Process sequentially to avoid rate limits
    // Defaults to Gemini for bulk operations for now to save 11Labs credits
    const pendingSegments = segments.filter(s => !s.audioUrl);
    
    for (const segment of pendingSegments) {
      await handleGenerateAudio(segment.id, 'gemini');
      await new Promise(r => setTimeout(r, 200));
    }
    setGeneratingAll(false);
  };

  const handleExportExcel = () => {
    // 1. Prepare data structure: Order, Script Content, Image Prompt
    const exportData = segments.map((s, index) => ({
      "Order": index + 1,
      "Script Content": s.originalText,
      "Image Prompt": s.imagePrompt
    }));

    // 2. Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // 3. Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Script Segments");

    // 4. Adjust column widths (optional but nice)
    const wscols = [
      { wch: 10 }, // Order
      { wch: 60 }, // Script Content
      { wch: 60 }, // Image Prompt
    ];
    worksheet['!cols'] = wscols;

    // 5. Write file
    XLSX.writeFile(workbook, `script-genie-export-${Date.now()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <ApiManagerModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              ScriptGenie
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsApiModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors"
            >
              <Key className="w-4 h-4" />
              API Manager
            </button>
            <div className="h-6 w-px bg-gray-800 hidden md:block" />
            <a href="#" className="text-gray-400 hover:text-white transition-colors hidden md:block">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-white mb-4">Transform Scripts into Multimedia</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Input your script below. We'll split it into scenes, write image prompts for you, 
            and generate high-quality voiceovers using <strong>Gemini</strong> or <strong>ElevenLabs</strong>.
          </p>
        </div>

        <ScriptInput 
          onAnalyze={handleAnalyze} 
          isLoading={status === ProcessingStatus.ANALYZING} 
        />

        <SegmentList 
          segments={segments}
          onGenerateAudio={handleGenerateAudio}
          onGenerateAllAudio={handleGenerateAllAudio}
          isGeneratingAll={generatingAll}
          onExport={handleExportExcel}
        />
      </main>
    </div>
  );
};

export default App;