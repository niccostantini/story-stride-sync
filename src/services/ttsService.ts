
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
    console.log(`Text length: ${options.text.length} characters`);
    console.log(`Language: ${options.languageCode}, Voice: ${voiceName}`);
    
    const requestBody = {
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
    };
    
    console.log('TTS request body:', JSON.stringify(requestBody));
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`TTS API response status: ${response.status}`);
    
    // Log response headers for debugging
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('TTS API response headers:', headers);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('TTS API Error:', errorData);
      throw new Error(`Google TTS API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Validate audio content
    if (!data.audioContent) {
      console.error('TTS API returned no audio content:', data);
      throw new Error('No audio content returned from TTS API');
    }
    
    // Log success but don't log the actual audio content (too large)
    console.log('TTS API returned audio successfully, content length:', 
      data.audioContent ? data.audioContent.length : 0);
    
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
    if (!audioContent) {
      console.error('No audio content provided to createAudioUrl');
      throw new Error('No audio content provided');
    }
    
    console.log(`Creating audio URL from ${audioContent.length} characters of base64 data`);
    
    // Create the blob with proper MIME type
    const blob = base64ToBlob(audioContent, 'audio/mp3');
    console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    console.log('Created audio URL:', url);
    
    // Test the blob URL to make sure it's accessible
    // This will help debug any issues with the URL creation
    fetch(url)
      .then(response => {
        if (response.ok) {
          console.log('Blob URL is accessible', url);
        } else {
          console.error('Blob URL is not accessible:', response.statusText);
        }
      })
      .catch(error => {
        console.error('Error testing blob URL:', error);
      });
    
    // Store URL in sessionStorage to prevent browser garbage collection
    try {
      if (typeof sessionStorage !== 'undefined') {
        const urlList = JSON.parse(sessionStorage.getItem('audioUrls') || '[]');
        if (!urlList.includes(url)) {
          urlList.push(url);
          sessionStorage.setItem('audioUrls', JSON.stringify(urlList));
        }
      }
    } catch (e) {
      console.error('Error storing URL in sessionStorage:', e);
    }
    
    return url;
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
    
    // Clean the base64 string if needed (sometimes there are newlines or spaces)
    const cleanedBase64 = base64.replace(/\s/g, '');
    
    // Convert base64 to binary
    const byteCharacters = atob(cleanedBase64);
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
  console.log('Generating mock audio response');
  // This is a valid MP3 base64 string for a short notification sound
  return { 
    audioContent: 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAASAAAJGAAYGBgYJCQkJCQwMDAwMDw8PDw8SUlJSUlVVVVVVWhoaGhoc3Nzc3N/f39/f4uLi4uLl5eXl5eioqKioq6urq6uurq6urrFxcXFxdDQ0NDQ3Nzc3Nzn5+fn5/Pz8/Pz//////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAZBAAAAAAAACRjDlJxFAAAAAAD/+xBkAA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU='
  };
};

// Export a test function to check audio conversion directly
export const testAudioConversion = async (text: string = 'Testing audio playback'): Promise<string> => {
  try {
    const ttsResponse = await textToSpeech({
      text: text,
      languageCode: 'en-US'
    });
    
    const audioUrl = createAudioUrl(ttsResponse.audioContent);
    return audioUrl;
  } catch (error) {
    console.error('Audio test failed:', error);
    throw error;
  }
};
