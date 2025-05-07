
import { API_KEYS, isDevelopmentMode, isPreviewMode } from '../config/apiKeys';

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
    
    // Check if we're in a valid environment to make API calls
    if (API_KEYS.GOOGLE_CLOUD_TTS === 'DEMO_KEY') {
      console.log('Using mock TTS in unsupported environment');
      return generateMockAudioResponse();
    }

    const apiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    const apiKey = API_KEYS.GOOGLE_CLOUD_TTS;
    
    console.log(`Making TTS request from: ${window.location.hostname}`);
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
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
      console.error('TTS API Error:', errorData);
      throw new Error(`Google TTS API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data as TTSResponse;
  } catch (error) {
    console.error('Error in text-to-speech conversion:', error);
    
    // In development or preview mode, we can fall back to mock audio
    if (isDevelopmentMode || isPreviewMode) {
      console.log('Falling back to mock audio after error');
      return generateMockAudioResponse();
    }
    
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
  try {
    const blob = base64ToBlob(audioContent, 'audio/mp3');
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating audio URL:', error);
    // Return a data URL with a silent audio clip as fallback
    return 'data:audio/mp3;base64,SUQzAwAAAAABOlRJVDIAAAAZAAADSW5zdHJ1bWVudGFsIFNvdW5kIEZYAA==';
  }
};

/**
 * Helper to convert base64 to Blob
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  try {
    // Validate the base64 string first
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid base64 string provided');
    }
    
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    // Process in chunks to avoid excessive memory usage
    const chunkSize = 512;
    for (let offset = 0; offset < byteCharacters.length; offset += chunkSize) {
      const slice = byteCharacters.slice(offset, offset + chunkSize);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    return new Blob(byteArrays, { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    // Return a minimal valid blob on error
    return new Blob([''], { type: mimeType });
  }
};

/**
 * Generate a mock audio response for testing or when API is unavailable
 */
const generateMockAudioResponse = (): TTSResponse => {
  // This is a valid, short MP3 base64 string (a small beep sound)
  // Using a verified working minimal MP3 to prevent browser freezes
  return { 
    audioContent: 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADQgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAA0L+aPYmAAAAAAAAAAAAAAAAAAAA' 
  };
};
