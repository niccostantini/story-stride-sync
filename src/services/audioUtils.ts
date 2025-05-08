
/**
 * Utility functions for audio processing and management
 */

/**
 * Convert base64 to Blob
 * @param base64 Base64 string to convert
 * @param mimeType MIME type for the resulting blob
 * @returns Blob object
 */
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  try {
    // Validate the base64 string first
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid base64 string provided');
    }
    
    // If input is a data URL, extract the base64 part
    if (base64.startsWith('data:')) {
      const parts = base64.split(',');
      if (parts.length !== 2) {
        throw new Error('Invalid data URL format');
      }
      base64 = parts[1];
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
 * Convert base64 audio to a playable audio URL
 */
export const createAudioUrl = (audioContent: string): string => {
  try {
    if (!audioContent) {
      console.error('No audio content provided to createAudioUrl');
      throw new Error('No audio content provided');
    }
    
    console.log(`Creating audio URL from ${audioContent.length} characters of base64 data`);
    
    // Check if audioContent is already a data URL
    if (audioContent.startsWith('data:audio/')) {
      console.log('Audio content is already a data URL, returning as-is');
      return audioContent;
    }
    
    // Create the blob with proper MIME type
    const blob = base64ToBlob(audioContent, 'audio/mp3');
    console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    console.log('Created audio URL:', url);
    
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
 * Generate a mock audio response for testing or when API is unavailable
 */
export const generateMockAudioResponse = (): { audioContent: string } => {
  console.log('Generating mock audio response');
  // This is a valid MP3 base64 string for a short notification sound
  return { 
    audioContent: 'SUQzAwAAAAABOlRJVDIAAAAZAAADSW5zdHJ1bWVudGFsIFNvdW5kIEZYAA==' 
  };
};

/**
 * Get a silent audio data URL for fallback situations
 */
export const getSilentAudioUrl = (): string => {
  return 'data:audio/mp3;base64,SUQzAwAAAAABOlRJVDIAAAAZAAADSW5zdHJ1bWVudGFsIFNvdW5kIEZYAA==';
};
