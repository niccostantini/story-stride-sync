
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Timer } from '@/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AudioStatusProps {
  timer: Timer | null;
  audioError: string | null;
  isLoading: boolean;
  loadingProgress?: number;
  formatTimeRemaining: () => string;
  getProgress: () => number;
}

const AudioStatus: React.FC<AudioStatusProps> = ({
  timer,
  audioError,
  isLoading,
  loadingProgress = 0,
  formatTimeRemaining,
  getProgress
}) => {
  return (
    <>
      {/* Audio status message */}
      {audioError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {audioError}
            {audioError.includes('error') && (
              <div className="mt-1 text-sm">Story will continue without audio narration.</div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Audio loading progress */}
      {isLoading && loadingProgress > 0 && loadingProgress < 100 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Loading audio</span>
            <span>{loadingProgress}%</span>
          </div>
          <Progress value={loadingProgress} className="h-1" />
        </div>
      )}
      
      {/* Audio Debug Container (invisible in production) */}
      <div className="audio-debug-container mb-4" style={{ minHeight: '10px' }}></div>
      
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
        {isLoading && (
          <Badge variant="outline" className="animate-pulse">Loading Audio</Badge>
        )}
        {audioError && (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">Audio Unavailable</Badge>
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
              timer?.isRunning && !timer.isPaused && !timer.isInPause && !timer.isInRest && !audioError
                ? `animate-audio-wave-${i + 1}`
                : "h-1"
            )}
          />
        ))}
      </div>
      
      {/* Progress Bar */}
      <Progress value={getProgress()} className="h-2 mb-6" />
    </>
  );
};

export default AudioStatus;
