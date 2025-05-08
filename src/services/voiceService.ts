
/**
 * Voice mapping and selection service
 */

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
    'ja': 'ja-JP-Wavenet-D', // Male voice for Japanese
    'ko': 'ko-KR-Wavenet-D', // Male voice for Korean
    'pt': 'pt-PT-Wavenet-C', // Female voice for Portuguese
    'ru': 'ru-RU-Wavenet-E', // Female voice for Russian
    'zh': 'cmn-CN-Wavenet-D', // Male voice for Chinese
  };
  
  // Extract base language code (e.g., 'en' from 'en-US')
  const baseLanguage = languageCode.split('-')[0];
  
  return voiceMap[baseLanguage] || 'en-US-Wavenet-D';
};
