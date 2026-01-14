import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResponseItem } from "../types";
import { decodeAudioData, pcmToWav } from "../utils/audio";
import { keyManager } from "./keyManager";

/**
 * Splits the script and generates image prompts using Key Rotation.
 */
export const analyzeScript = async (scriptText: string): Promise<AnalysisResponseItem[]> => {
  try {
    return await keyManager.executeWithRotation('gemini', async (apiKey) => {
      // Create a fresh instance for each attempt with the specific key
      const ai = new GoogleGenAI({ apiKey });
      
      // Use gemini-3-flash-preview which is recommended for text tasks and handles larger contexts better
      const modelId = "gemini-3-flash-preview";
      
      const prompt = `
        You are an expert script assistant. 
        1. Split the following script into natural, semantic segments (sentences or short paragraphs suitable for TTS).
        2. For EACH segment, generate a detailed image prompt in the style of **"Oil painting combined with stick figures"**. 
           - The style should look like a textured, artistic oil painting.
           - The characters should be stylized, expressive stick figures integrated into this oil painting world.
           - Describe the scene visually (colors, lighting, action).
        3. Return ONLY a JSON array.
        
        Script:
        ${scriptText}
      `;

      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192, // Explicitly set high token limit to prevent JSON truncation
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The segment of the script" },
                image_prompt: { type: Type.STRING, description: "A detailed visual description for image generation (Oil painting + Stick figures style)" }
              },
              required: ["text", "image_prompt"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error("Empty response received from Gemini.");
      }

      // Try parsing with error handling for truncation
      try {
        return JSON.parse(response.text) as AnalysisResponseItem[];
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        // Check if it looks like truncation (end of string)
        throw new Error("The generated analysis was too long and got cut off. Please try inputting a shorter part of your script.");
      }
    });
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Ensure the error message bubbles up clearly
    throw error; 
  }
};

/**
 * Generates Speech for a single segment using Gemini TTS with Key Rotation.
 */
export const generateGeminiSpeech = async (text: string): Promise<Blob> => {
  try {
    return await keyManager.executeWithRotation('gemini', async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      const modelId = "gemini-2.5-flash-preview-tts"; 

      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!base64Audio) {
        throw new Error("No audio data returned from Gemini.");
      }

      const pcmData = await decodeAudioData(base64Audio, 24000);
      return pcmToWav(pcmData, 24000);
    });
  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};