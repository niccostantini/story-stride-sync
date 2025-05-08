
import { API_KEYS, isDevelopmentMode, isPreviewMode } from '../config/apiKeys';
import { getVoiceForLanguage } from './voiceService';
import { createAudioUrl, generateMockAudioResponse } from './audioUtils';

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
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
      },
      body: JSON.stringify(requestBody),
    });
    
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
 * Test function to check audio conversion directly
 * @param text Optional text to convert to audio
 * @returns Promise with the audio URL
 */
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

// Re-export functions that consumers might need
export { createAudioUrl } from './audioUtils';
