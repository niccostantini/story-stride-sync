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

/**
 * Generate a mock audio response for testing or when API is unavailable
 */
const generateMockAudioResponse = (): TTSResponse => {
  // This is a tiny 1-second MP3 audio file encoded as base64
  // It simply contains a beep sound to verify audio is working
  const mockAudioBase64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCIiIiIiIjAwMDAwMD4+Pj4+PkxMTExMTFpaWlpaWmhoaGhoaHZ2dnZ2doSEhISEhJKSkpKSkoaWlpaWlqampqamprKysrKysr6+vr6+vsbGxsbGxtDQ0NDQ0N7e3t7e3ura2tra2uLi4uLi4urq6urq6vLy8vLy8vr6+vr6+v///wAAADxMQVZDNTguMTMuMTAzAQAAAAAAAAAkIwznAAAAAAAAAAAAADUgsAAiAABnM+UKACgATAt6waEAAAB9MH1YIFYIFYIFYIFYIFYIFYIFYLAAAAAAWgEAAAAAAACkGBWCBWCBWCBWCBWCBWCBJP//jwAAAAAAAAAAAAAnQKFYIF7///9bAEFi////+YIL//JBUDv/6w8CQD//1eIFf//rBUCgX//KQTioX//of9xX///JmJfkChQoYfwQGCvV9Xqz1Z6vV6vd7vd7ve7/f7/gABAPoPOgAAAAE3/0IAAIPwfB8HwfB8HwfB8HwfA8Dj/wAgIBAQ/8DwECQDwfBIPg+D4Pg+D4Pg+D4HgeB9BOcAIBCJP/EOgQPAQPAeBh+D4Pg+D4Pg+D4Pg+D4HgfQfOFwEHngIHgEDwMPwfB8HwfB8HwfB8HwfA8D6DLcAgfoc+gg+Ag+D4Pg+D4Pg+D4Pg+B4HwfQeUCAQiT/xDoEDwED4Pg+D4Pg+D4Pg+D4PgeB9B54IHngEDwEDwPg+D4Pg+D4Pg+D4Pg+B4H0EZLOAIBAAAAAAAAA//MUxAUDwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
  return { audioContent: mockAudioBase64 };
};
