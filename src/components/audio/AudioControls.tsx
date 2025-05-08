
import React from 'react';
import { Play, Pause, SkipBack, Trash2, Volume2, VolumeX, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Timer } from '@/types';

interface AudioControlsProps {
  timer: Timer | null;
  isLoading: boolean;
  audioError: string | null;
  isMuted: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onMuteToggle: () => void;
  onDiscard: () => void;
  onDebug: () => void;
  onForcedPlay?: () => void;
  isDevMode?: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  timer,
  isLoading,
  audioError,
  isMuted,
  onPlayPause,
  onReset,
  onMuteToggle,
  onDiscard,
  onDebug,
  onForcedPlay,
  isDevMode = false
}) => {
  return (
    <>
      {/* Controls */}
      <div className="flex justify-center items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onReset}
        >
          <SkipBack className="h-5 w-5" />
          <span className="sr-only">Restart</span>
        </Button>
        
        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full bg-purple hover:bg-purple-dark"
          onClick={onPlayPause}
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
          onClick={onMuteToggle}
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
          onClick={onDebug} 
          className="w-full text-xs flex items-center justify-center gap-2"
        >
          Debug Audio <Download className="h-3 w-3 ml-1" />
        </Button>
        
        {/* Additional play button for direct audio testing */}
        {isDevMode && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onForcedPlay} 
            className="w-full text-xs mt-2"
          >
            Force Play Audio
          </Button>
        )}
      </div>
    </>
  );
};

export default AudioControls;
