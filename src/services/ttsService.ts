
import { API_KEYS } from '../config/apiKeys';

interface TTSRequest {
  text: string;
  languageCode: string;
  voiceName?: string;
  speakingRate?: number;
}

export interface TTSResponse {
  audioContent: string;
}

/**
 * Converts text to speech using Google Cloud Text-to-Speech API
 * @param options TTSRequest object with text and language settings
 * @returns Promise with the audio content as a base64 string
 */
export const textToSpeech = async (options: TTSRequest): Promise<TTSResponse> => {
  try {
    const voiceName = options.voiceName || getVoiceForLanguage(options.languageCode);
    
    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + API_KEYS.GOOGLE_CLOUD_TTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          text: options.text,
        },
        voice: {
          languageCode: options.languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: options.speakingRate || 0.9, // Slightly slower for story narration
          pitch: 0,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google TTS API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data as TTSResponse;
  } catch (error) {
    console.error('Error in text-to-speech conversion:', error);
    throw error;
  }
};

/**
 * Get appropriate WaveNet voice based on language code
 */
export const getVoiceForLanguage = (languageCode: string): string => {
  // Map language codes to WaveNet voices
  const voiceMap: Record<string, string> = {
    'en': 'en-US-Wavenet-D', // Male voice for English
    'es': 'es-ES-Wavenet-C', // Female voice for Spanish
    'fr': 'fr-FR-Wavenet-D', // Male voice for French
    'de': 'de-DE-Wavenet-C', // Female voice for German
    'it': 'it-IT-Wavenet-B', // Female voice for Italian
  };
  
  // Extract base language code (e.g., 'en' from 'en-US')
  const baseLanguage = languageCode.split('-')[0];
  
  return voiceMap[baseLanguage] || 'en-US-Wavenet-D';
};

/**
 * Convert base64 audio to a playable audio URL
 */
export const createAudioUrl = (audioContent: string): string => {
  const blob = base64ToBlob(audioContent, 'audio/mp3');
  return URL.createObjectURL(blob);
};

/**
 * Helper to convert base64 to Blob
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  
  return new Blob(byteArrays, { type: mimeType });
};
