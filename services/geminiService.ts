import { GoogleGenAI, Modality } from "@google/genai";
import { GEMINI_IMAGE_MODEL, GEMINI_TTS_MODEL, IMAGE_PROMPT_SUFFIX } from "../constants";

// NOTE: In a production app, API keys should not be exposed on the client.
// They should be behind a proxy or serverless function.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const VOICE_OPTIONS = [
  { id: 'Zephyr', label: 'Mujer', gender: 'female' },
  { id: 'Puck', label: 'Hombre', gender: 'male' }
];

/**
 * Generates a pictogram image based on a word using Gemini.
 */
export const generatePictogramImage = async (word: string): Promise<string> => {
  try {
    const prompt = `Dibujo de: ${word}. ${IMAGE_PROMPT_SUFFIX}`;
    
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        // Using square aspect ratio for standard pictogram cards
        imageConfig: {
            aspectRatio: "1:1", 
        }
      }
    });

    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data returned from Gemini.");
  } catch (error) {
    console.error("Error generating pictogram image:", error);
    throw error;
  }
};

/**
 * Generates audio (TTS) for the pictogram word using Gemini.
 */
export const generatePictogramAudio = async (word: string, voiceName: string = 'Zephyr'): Promise<string> => {
  try {
    // Use a directive to ensure Latin American Spanish pronunciation
    const prompt = `Di en español latinoamericano: ${word}`;

    const response = await ai.models.generateContent({
      model: GEMINI_TTS_MODEL,
      contents: [
        { parts: [{ text: prompt }] }
      ],
      config: {
        responseModalities: [Modality.AUDIO], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }, 
          },
        },
      },
    });

    // Robustly find the audio part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
            return part.inlineData.data;
        }
    }
    
    // Check if we got text error/explanation instead
    const textPart = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textPart) {
        console.warn("Gemini returned text instead of audio:", textPart);
    }
    
    throw new Error("No audio data returned from Gemini.");

  } catch (error) {
    console.error("Error generating pictogram audio:", error);
    throw error;
  }
};

// --- Audio Decoding & Playback Logic ---

let audioContext: AudioContext | null = null;

/**
 * Decodes a Base64 string into a Uint8Array of bytes.
 */
const decodeBase64 = (base64: string): Uint8Array => {
  // If it contains a data URI prefix (common in recordings), strip it
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Helper to convert a Blob (from recording) to Base64 string for storage
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Return the full Data URI or just the base64? 
            // For consistency with Gemini (raw base64), we usually strip, 
            // BUT for browser playback compatibility of WebM/Ogg, Data URI is safer 
            // if we just feed it to an Audio element or decodeAudioData.
            // We will store raw base64 to keep types consistent, but our player handles both.
            const base64 = result.split(',')[1]; 
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Manually decodes raw PCM data (16-bit Little Endian) into an AudioBuffer.
 * Used for Gemini API responses.
 */
const decodeAudioDataPCM = (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): AudioBuffer => {
  const byteLength = data.length % 2 === 0 ? data.length : data.length - 1;
  const bufferView = data.buffer.slice(data.byteOffset, data.byteOffset + byteLength);
  const dataInt16 = new Int16Array(bufferView);
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

/**
 * Plays audio from a base64 string.
 * Smartly detects if it's raw PCM (Gemini) or a browser-compatible container (Recording).
 */
export const playAudio = async (base64Audio: string) => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    try {
        const bytes = decodeBase64(base64Audio);
        
        // Try to decode as standard media file first (WebM, WAV from recording)
        try {
            const bufferCopy = bytes.buffer.slice(0);
            const audioBuffer = await audioContext.decodeAudioData(bufferCopy);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
        } catch (standardDecodeError) {
            // If standard decode fails, assume Raw PCM from Gemini
            const audioBuffer = decodeAudioDataPCM(bytes, audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
        }

    } catch (e) {
        console.error("Error playing audio", e);
        throw e;
    }
};