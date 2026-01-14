
export interface ScriptSegment {
  id: string;
  originalText: string;
  imagePrompt: string;
  audioUrl?: string; // Blob URL for the generated WAV
  audioBlob?: Blob;
  isGeneratingAudio: boolean;
  isPlaying: boolean;
  provider?: AudioProvider; // 'gemini' | 'elevenlabs'
  imageUrl?: string; // Base64 data URI for the image
  isGeneratingImage: boolean;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface AnalysisResponseItem {
  text: string;
  image_prompt: string;
}

export interface ExportData {
  segments: {
    text: string;
    image_prompt: string;
    audio_file_name?: string;
    provider?: string;
  }[];
}

export type AudioProvider = 'gemini' | 'elevenlabs';

export interface ApiKey {
  id: string;
  key: string;
  provider: AudioProvider;
  label?: string;
  isEnabled: boolean; // New: Manual toggle status
}
