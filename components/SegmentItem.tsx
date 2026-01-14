import React, { useRef, useState, useEffect } from 'react';
import { ScriptSegment, AudioProvider } from '../types';
import { Image, Mic, Play, Pause, RefreshCw, Settings2 } from 'lucide-react';

interface SegmentItemProps {
  segment: ScriptSegment;
  index: number;
  onGenerateAudio: (id: string, provider: AudioProvider) => void;
}

const SegmentItem: React.FC<SegmentItemProps> = ({ segment, index, onGenerateAudio }) => {
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
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-indigo-900/50 transition-colors group">
      <div className="flex gap-4">
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
            {index + 1}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {/* Script Text */}
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-200 text-lg leading-relaxed font-medium">
              {segment.originalText}
            </p>
          </div>

          {/* Image Prompt Box */}
          <div className="bg-gray-950/50 rounded-lg p-3 border border-gray-800">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 mb-1">
              <Image className="w-3 h-3" />
              <span>Generated Image Prompt</span>
            </div>
            <p className="text-gray-400 text-sm italic">
              {segment.imagePrompt}
            </p>
          </div>

          {/* Audio Controls */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {!segment.audioUrl ? (
              <div className="flex items-center gap-2">
                 <div className="relative inline-block">
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as AudioProvider)}
                      className="appearance-none bg-gray-800 text-gray-300 text-xs font-medium pl-3 pr-8 py-1.5 rounded-l-md border border-gray-700 hover:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      disabled={segment.isGeneratingAudio}
                    >
                      <option value="gemini">Gemini TTS</option>
                      <option value="elevenlabs">ElevenLabs</option>
                    </select>
                    <Settings2 className="w-3 h-3 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                 </div>

                <button
                  onClick={() => onGenerateAudio(segment.id, selectedProvider)}
                  disabled={segment.isGeneratingAudio}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-r-md text-sm transition-colors border-y border-r border-indigo-600/20 ml-[-1px]"
                >
                  {segment.isGeneratingAudio ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  {segment.isGeneratingAudio ? 'Generating...' : 'Generate Voice'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full bg-gray-800/50 p-2 rounded-lg border border-gray-700/50">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                
                <div className="flex-1 h-8 flex items-center">
                   <audio ref={audioRef} src={segment.audioUrl} className="w-full h-8 block" controls /> 
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-1 bg-gray-900 rounded">
                        {segment.provider || 'Gemini'}
                    </span>
                    <button 
                    onClick={() => onGenerateAudio(segment.id, segment.provider || 'gemini')}
                    className="p-2 text-gray-500 hover:text-indigo-400 transition-colors"
                    title="Regenerate"
                    >
                    <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SegmentItem;