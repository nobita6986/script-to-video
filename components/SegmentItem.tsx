import React, { useRef, useState, useEffect } from 'react';
import { ScriptSegment, AudioProvider } from '../types';
import { Image, Mic, Play, Pause, RefreshCw, Settings2, Sparkles, Loader2, ChevronRight } from 'lucide-react';

interface SegmentItemProps {
  segment: ScriptSegment;
  index: number;
  onGenerateAudio: (id: string, provider: AudioProvider) => void;
  onGenerateImage: (id: string) => void;
}

const SegmentItem: React.FC<SegmentItemProps> = ({ segment, index, onGenerateAudio, onGenerateImage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AudioProvider>('gemini');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onplay = () => setIsPlaying(true);
    }
  }, [segment.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <div className="glass rounded-2xl p-1 border border-white/5 shadow-lg group hover:border-violet-500/30 transition-all duration-300">
      <div className="bg-slate-900/80 rounded-[18px] p-5 sm:p-6">
        
        {/* Top Section: Script Content */}
        <div className="flex gap-4 mb-6">
          <div className="shrink-0 mt-1">
             <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-slate-500 text-xs font-bold font-mono">
               {String(index + 1).padStart(2, '0')}
             </span>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-200 text-lg leading-relaxed font-medium">
              {segment.originalText}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800/80">
          
          {/* Left Column: Image Area (Spans 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Image className="w-3.5 h-3.5" />
                  <span>Visuals</span>
                </div>
             </div>

             <div className="relative group/img bg-slate-950 rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
                {!segment.imageUrl ? (
                   <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
                      <Sparkles className="w-8 h-8 text-slate-700 mb-3" />
                      <p className="text-xs text-slate-500 mb-4 px-4 line-clamp-2">{segment.imagePrompt}</p>
                      <button 
                        onClick={() => onGenerateImage(segment.id)}
                        disabled={segment.isGeneratingImage}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-pink-400 hover:text-pink-300 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-pink-500/30 shadow-lg"
                      >
                         {segment.isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5" />}
                         {segment.isGeneratingImage ? "Creating..." : "Generate Scene"}
                      </button>
                   </div>
                ) : (
                   <>
                      <img src={segment.imageUrl} alt="Generated scene" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                         <button 
                            onClick={() => window.open(segment.imageUrl, '_blank')}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
                            title="View Fullsize"
                         >
                            <Image className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => onGenerateImage(segment.id)}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
                            title="Regenerate"
                         >
                            <RefreshCw className="w-4 h-4" />
                         </button>
                      </div>
                   </>
                )}
             </div>
             
             {/* Small Prompt Preview */}
             <div className="bg-slate-950/30 rounded-lg p-2.5 border border-slate-800/50">
               <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 hover:line-clamp-none cursor-help transition-all">
                 <span className="text-slate-400 font-semibold mr-1">Prompt:</span>
                 {segment.imagePrompt}
               </p>
             </div>
          </div>

          {/* Right Column: Audio Area (Spans 7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-3">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
               <Mic className="w-3.5 h-3.5" />
               <span>Voiceover</span>
             </div>

             <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col justify-center">
                {!segment.audioUrl ? (
                   <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                      <div className="relative w-full sm:w-48">
                        <select
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value as AudioProvider)}
                          className="w-full appearance-none bg-slate-950 text-slate-300 text-sm font-medium pl-4 pr-10 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors cursor-pointer"
                          disabled={segment.isGeneratingAudio}
                        >
                          <option value="gemini">Gemini AI</option>
                          <option value="elevenlabs">ElevenLabs</option>
                        </select>
                        <Settings2 className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <button
                        onClick={() => onGenerateAudio(segment.id, selectedProvider)}
                        disabled={segment.isGeneratingAudio}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                      >
                        {segment.isGeneratingAudio ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                        {segment.isGeneratingAudio ? 'Synthesizing...' : 'Generate Voice'}
                      </button>
                   </div>
                ) : (
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                        <button
                          onClick={togglePlay}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 shrink-0"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                           <audio ref={audioRef} src={segment.audioUrl} className="w-full h-8 block opacity-80" controlsList="nodownload" controls /> 
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                             <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                segment.provider === 'elevenlabs' 
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                             }`}>
                                {segment.provider === 'elevenlabs' ? 'ElevenLabs' : 'Gemini Flash'}
                             </span>
                          </div>
                          <button 
                             onClick={() => onGenerateAudio(segment.id, segment.provider || 'gemini')}
                             className="text-xs text-slate-500 hover:text-violet-400 flex items-center gap-1 transition-colors"
                          >
                             <RefreshCw className="w-3 h-3" />
                             Regenerate
                          </button>
                      </div>
                   </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SegmentItem;