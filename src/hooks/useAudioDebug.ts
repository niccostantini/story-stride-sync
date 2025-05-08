
import { useEffect } from 'react';
import { getSilentAudioUrl } from '@/services/audioUtils';

interface UseAudioDebugProps {
  isDevMode: boolean;
  currentAudioUrl: string | null;
}

export const useAudioDebug = ({ isDevMode, currentAudioUrl }: UseAudioDebugProps) => {
  // Create visible audio element for debugging in development mode
  useEffect(() => {
    if (!isDevMode) return;
    
    const createDebugAudioElement = () => {
      // Remove any existing debug audio element
      const existingElement = document.getElementById('visible-audio-element');
      if (existingElement && existingElement.parentNode) {
        existingElement.parentNode.removeChild(existingElement);
      }
      
      // Create a new audio element for debugging
      const audioElement = document.createElement('audio');
      audioElement.id = 'visible-audio-element';
      audioElement.controls = true;
      audioElement.style.width = '100%';
      audioElement.style.marginBottom = '10px';
      audioElement.src = getSilentAudioUrl();
      
      // Add to DOM
      const container = document.querySelector('.audio-debug-container');
      if (container) {
        container.appendChild(audioElement);
        
        // Update source when our main audio changes
        if (currentAudioUrl) {
          audioElement.src = currentAudioUrl;
        }
      }
    };
    
    createDebugAudioElement();
    
    return () => {
      const elem = document.getElementById('visible-audio-element');
      if (elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    };
  }, [isDevMode, currentAudioUrl]);
};
