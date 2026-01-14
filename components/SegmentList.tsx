import React from 'react';
import { ScriptSegment, AudioProvider } from '../types';
import SegmentItem from './SegmentItem';
import { Download, PlayCircle, Loader2, Image as ImageIcon, Music, FileImage } from 'lucide-react';

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
    <div className="w-full max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
          <span className="text-indigo-400">2.</span> Segments & Media
          <span className="text-sm font-normal text-gray-500 ml-2">({segments.length} items)</span>
        </h2>
        
        {/* Actions Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          
          {/* Generation Group */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onGenerateAllAudio}
              disabled={isGeneratingAll || isGeneratingAllImages}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded-lg border border-indigo-600/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Gen All Audio
            </button>

            <button
              onClick={onGenerateAllImages}
              disabled={isGeneratingAll || isGeneratingAllImages}
              className="flex items-center gap-2 px-3 py-2 bg-pink-600/10 hover:bg-pink-600/20 text-pink-400 hover:text-pink-300 rounded-lg border border-pink-600/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
               {isGeneratingAllImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              Gen All Images
            </button>
          </div>

          {/* Download/Export Group */}
          <div className="flex flex-wrap gap-2 md:justify-end">
            <button
              onClick={onDownloadAllAudio}
              disabled={!hasAudio}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              title="Download all generated audio as ZIP"
            >
              <Music className="w-4 h-4" />
              Save Audio
            </button>

            <button
              onClick={onDownloadAllImages}
              disabled={!hasImages}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              title="Download all generated images as ZIP"
            >
              <FileImage className="w-4 h-4" />
              Save Images
            </button>

            <div className="w-px bg-gray-700 mx-1 hidden md:block"></div>

            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-900/40 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
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