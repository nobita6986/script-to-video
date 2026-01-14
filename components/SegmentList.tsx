import React from 'react';
import { ScriptSegment, AudioProvider } from '../types';
import SegmentItem from './SegmentItem';
import { Download, PlayCircle, Loader2 } from 'lucide-react';

interface SegmentListProps {
  segments: ScriptSegment[];
  onGenerateAudio: (id: string, provider: AudioProvider) => void;
  onGenerateAllAudio: () => void;
  isGeneratingAll: boolean;
  onExport: () => void;
}

const SegmentList: React.FC<SegmentListProps> = ({ 
  segments, 
  onGenerateAudio, 
  onGenerateAllAudio,
  isGeneratingAll,
  onExport 
}) => {
  if (segments.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
          <span className="text-indigo-400">2.</span> Segments & Media
          <span className="text-sm font-normal text-gray-500 ml-2">({segments.length} items)</span>
        </h2>
        
        <div className="flex gap-3">
          <button
            onClick={onGenerateAllAudio}
            disabled={isGeneratingAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-indigo-400 hover:text-indigo-300 rounded-lg border border-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Generate All (Gemini)
          </button>
          
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-900/50 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {segments.map((segment, index) => (
          <SegmentItem 
            key={segment.id} 
            segment={segment} 
            index={index}
            onGenerateAudio={onGenerateAudio}
          />
        ))}
      </div>
    </div>
  );
};

export default SegmentList;