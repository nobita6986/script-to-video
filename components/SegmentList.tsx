import React from 'react';
import { ScriptSegment, AudioProvider } from '../types';
import SegmentItem from './SegmentItem';
import { Download, PlayCircle, Loader2, Image as ImageIcon, Music, FileImage, Layers } from 'lucide-react';

interface SegmentListProps {
  segments: ScriptSegment[];
  onGenerateAudio: (id: string, provider: AudioProvider) => void;
  onGenerateAllAudio: () => void;
  isGeneratingAll: boolean;
  onExport: () => void;
  onGenerateImage: (id: string) => void;
  onGenerateAllImages: () => void;
  isGeneratingAllImages: boolean;
  onDownloadAllImages: () => void;
  onDownloadAllAudio: () => void;
}

const SegmentList: React.FC<SegmentListProps> = ({ 
  segments, 
  onGenerateAudio, 
  onGenerateAllAudio,
  isGeneratingAll,
  onExport,
  onGenerateImage,
  onGenerateAllImages,
  isGeneratingAllImages,
  onDownloadAllImages,
  onDownloadAllAudio
}) => {
  if (segments.length === 0) return null;

  const hasImages = segments.some(s => s.imageUrl);
  const hasAudio = segments.some(s => s.audioUrl);

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header & Actions */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 sticky top-20 z-10 shadow-xl">
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
          <div className="flex items-center gap-3 mb-2 xl:mb-0">
             <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-violet-400 font-bold text-sm border border-slate-700">2</span>
             <h2 className="text-lg font-bold text-slate-100">
               Segments & Media
               <span className="text-sm font-normal text-slate-500 ml-2">({segments.length})</span>
             </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Generation Group */}
            <div className="flex flex-1 sm:flex-none gap-2">
              <button
                onClick={onGenerateAllAudio}
                disabled={isGeneratingAll || isGeneratingAllImages}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl border border-indigo-500/20 transition-all text-sm font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-900/20"
              >
                {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                <span className="whitespace-nowrap">Gen Audio</span>
              </button>

              <button
                onClick={onGenerateAllImages}
                disabled={isGeneratingAll || isGeneratingAllImages}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:text-pink-300 rounded-xl border border-pink-500/20 transition-all text-sm font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-pink-900/20"
              >
                 {isGeneratingAllImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                <span className="whitespace-nowrap">Gen Images</span>
              </button>
            </div>

            <div className="w-px bg-slate-700 hidden sm:block"></div>

            {/* Download/Export Group */}
            <div className="flex flex-1 sm:flex-none gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={onDownloadAllAudio}
                disabled={!hasAudio}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                title="Download all audio ZIP"
              >
                <Music className="w-4 h-4" />
              </button>

              <button
                onClick={onDownloadAllImages}
                disabled={!hasImages}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                title="Download all images ZIP"
              >
                <FileImage className="w-4 h-4" />
              </button>

              <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl border border-emerald-500/20 transition-colors text-sm font-medium whitespace-nowrap ml-auto sm:ml-0"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {segments.map((segment, index) => (
          <SegmentItem 
            key={segment.id} 
            segment={segment} 
            index={index}
            onGenerateAudio={onGenerateAudio}
            onGenerateImage={onGenerateImage}
          />
        ))}
      </div>
    </div>
  );
};

export default SegmentList;