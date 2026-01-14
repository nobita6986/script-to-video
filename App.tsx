import React, { useState, useCallback } from 'react';
import ScriptInput from './components/ScriptInput';
import SegmentList from './components/SegmentList';
import ApiManagerModal from './components/ApiManagerModal';
import { ScriptSegment, ProcessingStatus, AudioProvider } from './types';
import { analyzeScript, generateGeminiSpeech, generateGeminiImage } from './services/gemini';
import { generateElevenLabsSpeech } from './services/elevenlabs';
import { Github, Zap, Key } from 'lucide-react';
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
    // Process sequentially to avoid rate limits
    // Defaults to Gemini for bulk operations for now to save 11Labs credits
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

    // Using a concurrency limit to speed up but not hit severe rate limits immediately
    // Or just sequential for safety. Let's do sequential for now to ensure stability.
    for (const segment of pendingSegments) {
        await handleGenerateImage(segment.id);
        // Small delay between requests
        await new Promise(r => setTimeout(r, 1000));
    }
    setGeneratingAllImages(false);
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

  const handleDownloadAllImages = async () => {
    const zip = new JSZip();
    const folder = zip.folder("images");
    let count = 0;

    segments.forEach((seg, idx) => {
      if (seg.imageUrl) {
        // seg.imageUrl is formatted as "data:image/png;base64,..."
        // Extract base64 part
        const parts = seg.imageUrl.split(',');
        if (parts.length === 2) {
            const mimeMatch = parts[0].match(/:(.*?);/);
            const extension = mimeMatch ? mimeMatch[1].split('/')[1] : 'png';
            const base64Data = parts[1];
            
            // Pad index with leading zeros for proper sorting in OS
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
        // Pad index with leading zeros for proper sorting in OS
        const paddedIndex = String(idx + 1).padStart(3, '0');
        // Determine extension based on provider or assume wav (Gemini usually WAV/PCM converted)
        // ElevenLabs is usually MP3, but our types might wrap it. 
        // pcmToWav returns type 'audio/wav'.
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