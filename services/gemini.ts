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
        2. For EACH segment, generate an \`image_prompt\`.
           
           **STRICT PROMPT GENERATION RULE:**
           To generate the \`image_prompt\`, you must first create a concise **Visual Metaphor** or **Concept** (describing the main character, action, or symbolic meaning) based on the segment text. 
           
           Then, insert that concept into the exact middle of the following template:

           "Modern cartoon editorial illustration in a bold flat vector style, created specifically for YouTube explainer and educational video thumbnails, wide 16:9 composition. {INSERT_VISUAL_METAPHOR_HERE}. Simplified cartoon characters with rounded proportions, minimal facial features, and clear expressive poses. Thick bold outlines, clean geometric shapes, and strong silhouette readability suitable for small-screen viewing. High-contrast layout with a limited but vibrant color palette, using saturated primary and secondary colors. Subtle glow effects, soft highlights, and minimal shadowing to add depth without realism. Abstract or smooth gradient background with simple geometric forms, motion lines, lightning shapes, or symbolic elements only. Clean, crisp digital illustration with an infographic and explainer-style look. Flat vector appearance, uncluttered composition, clear visual hierarchy. No realistic textures, no painterly effects, no photorealism, no 3D rendering. Aspect ratio 16:9, cinematic wide framing, centered or rule-of-thirds composition."

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
                image_prompt: { type: Type.STRING, description: "The full image prompt generated using the required template" }
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

/**
 * Generates an image based on the prompt using Gemini.
 */
export const generateGeminiImage = async (prompt: string): Promise<string> => {
  try {
    return await keyManager.executeWithRotation('gemini', async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      // Using gemini-2.5-flash-image for standard image generation tasks
      const modelId = "gemini-2.5-flash-image";

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
           // Explicitly requesting 16:9 to match the prompt description
           imageConfig: {
             aspectRatio: "16:9"
           }
        }
      });

      // Iterate through parts to find the image
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) throw new Error("No content generated");

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }

      throw new Error("No image data found in response.");
    });
  } catch (error: any) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};