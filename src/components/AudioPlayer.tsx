import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, Trash2, Volume2, VolumeX, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Timer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface AudioPlayerProps {
  audioUrl: string | string[] | null;
  timer: Timer | null;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onDiscard: () => void;
  formatTimeRemaining: () => string;
  getProgress: () => number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  timer,
  onPlay,
  onPause,
  onReset,
  onDiscard,
  formatTimeRemaining,
  getProgress
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  
  // Debug function to check audio element and URL
  const debugAudio = () => {
    console.log('Debug Audio Status:');
    console.log('- Audio URL:', audioUrl);
    console.log('- Audio element exists:', !!audioRef.current);
    
    if (audioRef.current) {
      console.log('- Audio element properties:');
      console.log('  - readyState:', audioRef.current.readyState);
      console.log('  - paused:', audioRef.current.paused);
      console.log('  - currentTime:', audioRef.current.currentTime);
      console.log('  - duration:', audioRef.current.duration);
      console.log('  - src:', audioRef.current.src);
      
      // Use a safe silent audio URL as fallback
      const safeAudioUrl = 'data:audio/mp3;base64,SUQzAwAAAAABOlRJVDIAAAAZAAADSW5zdHJ1bWVudGFsIFNvdW5kIEZYAA==';
      
      // Create a download link for the audio
      const blob = new Blob([''], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'story-audio.mp3';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Audio Download",
        description: "Audio file downloaded (silent placeholder)",
      });
    }
  };
  
  // Get current audio URL based on timer state and story mode
  const getCurrentAudioUrl = (): string | null => {
    if (!audioUrl) return null;
    
    // If audioUrl is a string, it's a session-mode audio file
    if (typeof audioUrl === 'string') {
      return audioUrl;
    }
    
    // If audioUrl is an array, it depends on the current set or interval
    if (Array.isArray(audioUrl) && timer) {
      const index = Math.min(timer.currentSetIndex, audioUrl.length - 1);
      return audioUrl[index] || null;
    }
    
    return null;
  };
  
  // Initialize audio element when URL changes or timer state changes
  useEffect(() => {
    const currentUrl = getCurrentAudioUrl();
    
    if (currentUrl) {
      console.log('Setting audio URL:', currentUrl);
      setIsLoading(true);
      setAudioError(null);
      
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        
        // Configure audio element
        audioRef.current.preload = 'auto';
        audioRef.current.crossOrigin = 'anonymous'; // Try to avoid CORS issues
        
        // Set the source - handle both data URLs and blob URLs
        audioRef.current.src = currentUrl;
        
        // Manually attempt to load the audio
        audioRef.current.load();
        
        // Explicitly setting volume
        audioRef.current.volume = 1.0;
      } catch (error) {
        console.error('Error setting up audio element:', error);
        setAudioError('Failed to initialize audio player');
        setIsLoading(false);
      }
    } else {
      console.log('No audio URL available');
      setAudioError('No audio available');
      setIsLoading(false);
    }
  }, [audioUrl, timer?.currentSetIndex]);
  
  // Add visible HTML audio element for debugging
  useEffect(() => {
    // Create a visible audio element for browser controls
    const createVisibleAudioElement = () => {
      const currentUrl = getCurrentAudioUrl();
      
      if (currentUrl && !document.getElementById('visible-audio-element')) {
        // Remove any existing element
        const existingElement = document.getElementById('visible-audio-element');
        if (existingElement && existingElement.parentNode) {
          existingElement.parentNode.removeChild(existingElement);
        }
        
        // Create a new audio element
        const audioElement = document.createElement('audio');
        audioElement.id = 'visible-audio-element';
        audioElement.controls = true;
        audioElement.style.width = '100%';
        audioElement.style.marginBottom = '10px';
        audioElement.style.display = 'none'; // Hide by default in production
        audioElement.src = currentUrl;
        
        // In development mode, make it visible
        if (window.location.hostname === 'localhost') {
          audioElement.style.display = 'block';
        }
        
        // Add to DOM
        const container = document.querySelector('.audio-debug-container');
        if (container) {
          container.appendChild(audioElement);
        }
      }
    };
    
    createVisibleAudioElement();
    
    return () => {
      const elem = document.getElementById('visible-audio-element');
      if (elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    };
  }, [audioUrl, timer?.currentSetIndex]);
  
  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleCanPlay = () => {
      console.log('Audio can play now');
      setIsLoading(false);
      toast({
        title: "Audio ready",
        description: "Your story audio is ready to play",
      });
    };
    
    const handleError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error('Audio playback error:', error);
      console.error('Audio src that failed:', audio.src);
      setAudioError('Failed to load audio');
      setIsLoading(false);
      
      toast({
        title: "Audio Error",
        description: `Could not play audio: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      
      // Reset to a valid silent audio clip
      audio.src = 'data:audio/mp3;base64,SUQzAwAAAAABOlRJVDIAAAAZAAADSW5zdHJ1bWVudGFsIFNvdW5kIEZYAA==';
      audio.load();
    };
    
    const handleEnded = () => {
      console.log('Audio playback ended');
      if (timer && timer.isRunning && !timer.isPaused) {
        // Only pause if timer is still running
        onPause();
      }
    };
    
    // Add event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('playing', () => console.log('Audio is playing'));
    audio.addEventListener('waiting', () => console.log('Audio is waiting'));
    audio.addEventListener('stalled', () => console.log('Audio is stalled'));
    
    return () => {
      // Remove event listeners
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('playing', () => console.log('Audio is playing'));
      audio.removeEventListener('waiting', () => console.log('Audio is waiting'));
      audio.removeEventListener('stalled', () => console.log('Audio is stalled'));
    };
  }, [timer, onPause, toast]);
  
  // Synchronize audio with timer state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !timer) return;
    
    console.log('Timer state changed:', { 
      isRunning: timer.isRunning, 
      isPaused: timer.isPaused,
      isInPause: timer.isInPause,
      isInRest: timer.isInRest
    });
    
    // Handle normal play/pause based on timer
    if (timer.isRunning && !timer.isPaused) {
      if (timer.isInPause || timer.isInRest) {
        // If we're in a pause or rest period, pause the audio
        console.log('Timer in pause or rest period, pausing audio');
        audio.pause();
      } else {
        // Play the audio if not in pause or rest
        console.log('Playing audio');
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing audio:', error);
            
            // If autoplay is blocked, show a toast notification
            if (error.name === 'NotAllowedError') {
              toast({
                  title: "Autoplay blocked",
                  description: "Please click play to start audio playback",
                  variant: "default",
              });
            } else {
              setAudioError(`Error playing audio: ${error.message}`);
            }
          });
        }
      }
    } else {
      // Pause audio if timer is paused or not running
      audio.pause();
    }
  }, [
    timer?.isRunning, 
    timer?.isPaused, 
    timer?.isInPause, 
    timer?.isInRest,
    timer?.currentSetIndex, 
    timer?.currentIntervalIndex, 
    timer, 
    toast
  ]);
  
  // Handle reset
  useEffect(() => {
    if (!timer?.isRunning && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [timer?.isRunning]);
  
  // Helper functions for audio control
  function handlePlayPause() {
    if (!timer) return;
    
    if (timer.isRunning && !timer.isPaused) {
      console.log('Pause button clicked: pausing audio and timer');
      onPause();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      console.log('Play button clicked: starting audio and timer');
      
      // If there was an error, try to reload the audio before playing
      if (audioError && audioRef.current) {
        const currentUrl = getCurrentAudioUrl();
        if (currentUrl) {
          setAudioError(null);
          setIsLoading(true);
          audioRef.current.src = currentUrl;
          audioRef.current.load();
        }
      }
      
      onPlay(); // Start the timer first
      
      // Only try to play audio if we're not in a pause or rest period
      if (audioRef.current && (!timer.isInPause && !timer.isInRest)) {
        const playPromise = audioRef.current.play();
        if (playPromise) {
          playPromise
            .then(() => {
              console.log('Audio playback started successfully');
            })
            .catch(err => {
              console.error('Failed to start audio playback:', err);
              // Even if audio fails, keep timer running
            });
        }
      }
    }
  }
  
  function handleReset() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onReset();
  }
  
  // Handle mute toggle
  function toggleMute() {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Audio status message */}
      {audioError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{audioError}</AlertDescription>
        </Alert>
      )}
      
      {/* Audio Debug Container */}
      <div className="audio-debug-container mb-4"></div>
      
      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-3 justify-center">
        {timer?.isInPause && (
          <Badge variant="secondary" className="animate-pulse">Pause</Badge>
        )}
        {timer?.isInRest && (
          <Badge variant="secondary" className="animate-pulse">Rest Period</Badge>
        )}
        {timer && !timer.isInPause && !timer.isInRest && timer.isRunning && !timer.isPaused && (
          <Badge variant="default" className="bg-purple">Active</Badge>
        )}
      </div>
      
      {/* Timer Display */}
      <div className="text-4xl font-bold text-center mb-6">
        {formatTimeRemaining()}
      </div>
      
      {/* Audio Visualization */}
      <div className="flex justify-center items-end h-16 gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 bg-purple rounded-full transition-all duration-300",
              isLoading ? "animate-pulse h-1" :
              timer?.isRunning && !timer.isPaused && !timer.isInPause && !timer.isInRest
                ? `animate-audio-wave-${i + 1}`
                : "h-1"
            )}
          />
        ))}
      </div>
      
      {/* Progress Bar */}
      <Progress value={getProgress()} className="h-2 mb-6" />
      
      {/* Controls */}
      <div className="flex justify-center items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={handleReset}
        >
          <SkipBack className="h-5 w-5" />
          <span className="sr-only">Restart</span>
        </Button>
        
        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full bg-purple hover:bg-purple-dark"
          onClick={handlePlayPause}
          disabled={isLoading || !!audioError}
        >
          {timer?.isRunning && !timer?.isPaused ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
          <span className="sr-only">
            {timer?.isRunning && !timer?.isPaused ? "Pause" : "Play"}
          </span>
        </Button>
        
        {/* Mute/Unmute Button */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
          <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
        </Button>
        
        {/* Discard Story Button */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full text-destructive hover:bg-destructive/10"
          onClick={onDiscard}
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Discard Story</span>
        </Button>
      </div>
      
      {/* Debug button with download functionality */}
      <div className="mt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={debugAudio} 
          className="w-full text-xs flex items-center justify-center gap-2"
        >
          Debug Audio <Download className="h-3 w-3 ml-1" />
        </Button>
        
        {/* Additional play button for direct audio testing */}
        {window.location.hostname === 'localhost' && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.play().catch(e => console.error('Direct play failed:', e));
              }
            }} 
            className="w-full text-xs mt-2"
          >
            Force Play Audio
          </Button>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
