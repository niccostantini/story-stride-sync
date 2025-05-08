
import React from 'react';
import { Timer } from '@/types';
import AudioControls from './audio/AudioControls';
import AudioStatus from './audio/AudioStatus';
import { useAudioSession } from '@/hooks/useAudioSession';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useAudioDebug } from '@/hooks/useAudioDebug';

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
  const isDevMode = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  
  // Audio session management
  const {
    audioRef,
    isLoading,
    setIsLoading,
    audioError,
    setAudioError,
    isMuted,
    setIsMuted,
    currentAudioUrl,
    resetToSilentAudio,
    errorRetryCount,
    maxRetries,
    loadingProgress
  } = useAudioSession(audioUrl, timer);
  
  // Audio playback control
  const {
    handlePlayPause,
    toggleMute,
    forcedPlay,
    debugAudio
  } = useAudioPlayback({
    audioRef,
    timer,
    isLoading,
    setIsLoading,
    audioError,
    setAudioError,
    isMuted,
    setIsMuted,
    errorRetryCount,
    maxRetries,
    resetToSilentAudio,
    onPlay,
    onPause,
    loadingProgress
  });
  
  // Debug UI (visible audio element in dev mode)
  useAudioDebug({
    isDevMode,
    currentAudioUrl
  });
  
  // Handle reset button
  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onReset();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AudioStatus
        timer={timer}
        audioError={audioError}
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        formatTimeRemaining={formatTimeRemaining}
        getProgress={getProgress}
      />
      
      <AudioControls
        timer={timer}
        isLoading={isLoading}
        audioError={audioError}
        isMuted={isMuted}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onMuteToggle={toggleMute}
        onDiscard={onDiscard}
        onDebug={debugAudio}
        onForcedPlay={forcedPlay}
        isDevMode={isDevMode}
      />
    </div>
  );
};

export default AudioPlayer;
