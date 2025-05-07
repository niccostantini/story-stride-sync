
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Timer } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AudioPlayerProps {
  audioUrl: string | null;
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
      
      // Test if blob URL is accessible
      fetch(audioRef.current.src)
        .then(response => {
          console.log('  - Blob URL fetch response:', response.status);
        })
        .catch(error => {
          console.error('  - Blob URL fetch error:', error);
        });
    }
  };
  
  // Initialize audio element when URL changes
  useEffect(() => {
    if (audioUrl) {
      console.log('Audio URL provided:', audioUrl);
      setIsLoading(true);
      setAudioError(null);
      
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      // Configure audio element
      audioRef.current.src = audioUrl;
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = 'anonymous'; // Try to avoid CORS issues
      
      // Manually attempt to load the audio
      audioRef.current.load();
      
      // After a short delay, debug the audio status
      setTimeout(debugAudio, 1000);
    } else {
      console.log('No audio URL available');
      setAudioError('No audio available');
      setIsLoading(false);
    }
  }, [audioUrl]);
  
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
      
      // Additional debug info
      debugAudio();
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
    
    return () => {
      // Remove event listeners
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [timer, onPause, toast]);
  
  // Synchronize audio with timer state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !timer) return;
    
    if (timer.isRunning && !timer.isPaused) {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
          
          // If autoplay is blocked, show a toast notification
          if (error.name === 'NotAllowedError') {
            toast({
              title: "Autoplay blocked",
              description: "Please click play to start audio playback",
              variant: "warning",
            });
          } else {
            setAudioError(`Error playing audio: ${error.message}`);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [timer?.isRunning, timer?.isPaused, timer, toast]);
  
  // Handle reset
  useEffect(() => {
    if (!timer?.isRunning && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [timer?.isRunning]);
  
  const handlePlayPause = () => {
    if (!timer) return;
    
    if (timer.isRunning && !timer.isPaused) {
      onPause();
    } else {
      // If there was an error, try to reload the audio before playing
      if (audioError && audioRef.current && audioUrl) {
        setAudioError(null);
        setIsLoading(true);
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
      onPlay();
    }
  };
  
  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onReset();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Audio status message */}
      {audioError && (
        <div className="text-destructive text-sm text-center mb-2">
          {audioError}
        </div>
      )}
      
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
              timer?.isRunning && !timer.isPaused 
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
      
      {/* Debug button in development mode */}
      {window.location.hostname === 'localhost' && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={debugAudio} 
            className="w-full text-xs"
          >
            Debug Audio
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
