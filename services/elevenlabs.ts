import { keyManager } from "./keyManager";

// Default Voice ID (Rachel)
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; 

export const generateElevenLabsSpeech = async (text: string): Promise<Blob> => {
  return keyManager.executeWithRotation('elevenlabs', async (apiKey) => {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`ElevenLabs API Error: ${err.detail?.message || response.statusText}`);
    }

    return await response.blob();
  });
};