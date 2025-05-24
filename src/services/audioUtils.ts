
/**
 * Utility functions for audio processing and management
 */

// Extend Window interface to include our custom property
declare global {
  interface Window {
    audioUrlRefs: string[];
  }
}

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
      console.warn('Invalid base64 string provided');
      return new Blob([''], { type: mimeType });
    }
    
    // If input is a data URL, extract the base64 part
    if (base64.startsWith('data:')) {
      const parts = base64.split(',');
      if (parts.length !== 2) {
        console.warn('Invalid data URL format');
        return new Blob([''], { type: mimeType });
      }
      base64 = parts[1];
    }
    
    // Clean the base64 string (remove whitespace)
    const cleanedBase64 = base64.replace(/\s/g, '');
    
    try {
      // Test if the base64 string is valid by attempting to decode a small portion
      atob(cleanedBase64.substring(0, Math.min(10, cleanedBase64.length)));
    } catch (e) {
      console.warn('Invalid base64 encoding detected');
      return new Blob([''], { type: mimeType });
    }
    
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
      console.warn('No audio content provided to createAudioUrl');
      return getSilentAudioUrl();
    }
    
    // If audioContent is already a URL (not a data URL or base64), return it
    if (audioContent.startsWith('http://') || audioContent.startsWith('https://') || audioContent.startsWith('blob:')) {
      return audioContent;
    }
    
    // Check if audioContent is already a data URL
    if (audioContent.startsWith('data:audio/')) {
      // Simple validation for data URL format
      return audioContent;
    }
    
    // Create the blob with proper MIME type
    const blob = base64ToBlob(audioContent, 'audio/mp3');
    
    if (blob.size <= 1) {
      console.warn('Generated blob is too small, likely invalid');
      return getSilentAudioUrl();
    }
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Store URL reference to prevent garbage collection
    try {
      if (typeof window !== 'undefined') {
        // Initialize the array if it doesn't exist
        if (!window.audioUrlRefs) {
          window.audioUrlRefs = [];
        }
        window.audioUrlRefs.push(url);
      }
    } catch (e) {
      console.error('Error storing URL reference:', e);
    }
    
    return url;
  } catch (error) {
    console.error('Error creating audio URL:', error);
    return getSilentAudioUrl();
  }
};

/**
 * Generate a mock audio response for testing or when API is unavailable
 */
export const generateMockAudioResponse = (): { audioContent: string } => {
  console.log('Generating mock audio response');
  return { 
    audioContent: getSilentAudioUrl()
  };
};

/**
 * Get a valid silent audio data URL for fallback situations
 * This is a proper 1-second silent MP3 file
 */
export const getSilentAudioUrl = (): string => {
  // A proper 1-second silent MP3 file (much more robust than the previous minimal version)
  return 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAASAAAOsAAUFBQUFBQoKCgoKCgoKCg9PT09PT09PUFBQUFBQUFBQVVVVVVVVVVVVWVVVVVVVVVVVX19fX19fX19fYWFhYWFhYWFhYWOjo6Ojo6Ojo6OlpaWlpaWlpaWlqKioqKioqKioqKurq6urq6urq6uurq6urq6urq6//////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAACQAAAAAAAAAAAazA///tSAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
};

/**
 * Safely revoke object URLs to prevent memory leaks
 */
export const revokeAudioUrl = (url: string): void => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
      
      // Remove from references if stored
      if (typeof window !== 'undefined' && window.audioUrlRefs) {
        window.audioUrlRefs = window.audioUrlRefs.filter(u => u !== url);
      }
    } catch (e) {
      console.error('Error revoking URL:', e);
    }
  }
};

// Clean up all audio URLs when needed (e.g., on component unmount)
export const cleanupAudioUrls = (): void => {
  if (typeof window !== 'undefined') {
    // Initialize the array if it doesn't exist to avoid errors
    if (!window.audioUrlRefs) {
      window.audioUrlRefs = [];
      return;
    }
    
    window.audioUrlRefs.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Error revoking URL during cleanup:', e);
      }
    });
    window.audioUrlRefs = [];
  }
};
