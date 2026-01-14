import React, { useState, useCallback } from 'react';
import ScriptInput from './components/ScriptInput';
import SegmentList from './components/SegmentList';
import ApiManagerModal from './components/ApiManagerModal';
import { ScriptSegment, ProcessingStatus, AudioProvider } from './types';
import { analyzeScript, generateGeminiSpeech, generateGeminiImage } from './services/gemini';
import { generateElevenLabsSpeech } from './services/elevenlabs';
import { Github, Zap, Key, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [generatingAllAudio, setGeneratingAllAudio] = useState(false);
  const [generatingAllImages, setGeneratingAllImages] = useState(false);
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
        isPlaying: false,
        isGeneratingImage: false
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

  const handleGenerateImage = useCallback(async (id: string) => {
    const segment = segments.find(s => s.id === id);
    if (!segment) return;

    setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingImage: true } : s));

    try {
      const imageUrl = await generateGeminiImage(segment.imagePrompt);

      setSegments(prev => prev.map(s => s.id === id ? { 
        ...s, 
        isGeneratingImage: false,
        imageUrl: imageUrl
      } : s));
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('No API keys')) {
        setIsApiModalOpen(true);
      }
      // alert(`Image generation failed: ${error.message}`);
      setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingImage: false } : s));
    }
  }, [segments]);

  const handleGenerateAllAudio = async () => {
    setGeneratingAllAudio(true);
    const pendingSegments = segments.filter(s => !s.audioUrl);
    
    for (const segment of pendingSegments) {
      await handleGenerateAudio(segment.id, 'gemini');
      await new Promise(r => setTimeout(r, 200));
    }
    setGeneratingAllAudio(false);
  };

  const handleGenerateAllImages = async () => {
    setGeneratingAllImages(true);
    const pendingSegments = segments.filter(s => !s.imageUrl);

    for (const segment of pendingSegments) {
        await handleGenerateImage(segment.id);
        await new Promise(r => setTimeout(r, 1000));
    }
    setGeneratingAllImages(false);
  };

  const handleExportExcel = () => {
    const exportData = segments.map((s, index) => ({
      "Order": index + 1,
      "Script Content": s.originalText,
      "Image Prompt": s.imagePrompt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Script Segments");
    const wscols = [{ wch: 10 }, { wch: 60 }, { wch: 60 }];
    worksheet['!cols'] = wscols;
    XLSX.writeFile(workbook, `script-genie-export-${Date.now()}.xlsx`);
  };

  const handleDownloadAllImages = async () => {
    const zip = new JSZip();
    const folder = zip.folder("images");
    let count = 0;

    segments.forEach((seg, idx) => {
      if (seg.imageUrl) {
        const parts = seg.imageUrl.split(',');
        if (parts.length === 2) {
            const mimeMatch = parts[0].match(/:(.*?);/);
            const extension = mimeMatch ? mimeMatch[1].split('/')[1] : 'png';
            const base64Data = parts[1];
            const paddedIndex = String(idx + 1).padStart(3, '0');
            folder?.file(`segment_${paddedIndex}.${extension}`, base64Data, { base64: true });
            count++;
        }
      }
    });

    if (count === 0) {
      alert("No images available to download.");
      return;
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `script-genie-images-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate zip", e);
      alert("Failed to generate zip file.");
    }
  };

  const handleDownloadAllAudio = async () => {
    const zip = new JSZip();
    const folder = zip.folder("audio");
    let count = 0;

    segments.forEach((seg, idx) => {
      if (seg.audioBlob) {
        const paddedIndex = String(idx + 1).padStart(3, '0');
        const extension = seg.provider === 'elevenlabs' ? 'mp3' : 'wav';
        folder?.file(`segment_${paddedIndex}.${extension}`, seg.audioBlob);
        count++;
      }
    });

    if (count === 0) {
      alert("No audio available to download.");
      return;
    }

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `script-genie-audio-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate zip", e);
      alert("Failed to generate zip file.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <ApiManagerModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
              ScriptGenie
            </h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsApiModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-full text-sm font-medium border border-white/10 transition-all hover:shadow-lg active:scale-95"
            >
              <Key className="w-4 h-4 text-violet-400" />
              <span className="hidden sm:inline">API Keys</span>
            </button>
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <a href="#" className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3 h-3" />
            AI-Powered Workflow
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Script to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Masterpiece</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Turn your text into a full multimedia experience. Generate scenes, vivid image prompts, and lifelike voiceovers in seconds.
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
          isGeneratingAll={generatingAllAudio}
          onExport={handleExportExcel}
          onGenerateImage={handleGenerateImage}
          onGenerateAllImages={handleGenerateAllImages}
          isGeneratingAllImages={generatingAllImages}
          onDownloadAllImages={handleDownloadAllImages}
          onDownloadAllAudio={handleDownloadAllAudio}
        />
      </main>
    </div>
  );
};

export default App;