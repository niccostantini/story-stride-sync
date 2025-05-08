
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StorySession, Timer } from '@/types';
import SessionModeStory from './SessionModeStory';
import SetModeStory from './SetModeStory';
import IntervalModeStory from './IntervalModeStory';
import StoryLoader from './StoryLoader';

interface StoryDisplayProps {
  session: StorySession;
  timer: Timer | null;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ session, timer }) => {
  // Calculate total duration for session mode
  const calculateTotalDuration = () => {
    return session.sets.reduce((total, set) => {
      return total + set.intervals.reduce((sum, interval) => sum + interval.duration, 0);
    }, 0);
  };
  
  // Format story text based on the session structure and timer state
  const renderStoryContent = () => {
    if (!session.storyText) {
      return <StoryLoader />;
    }
    
    // For session mode (one continuous story)
    if (session.storyMode === "session") {
      const text = typeof session.storyText === 'string' ? session.storyText : session.storyText.join("\n\n");
      return <SessionModeStory storyText={text} timer={timer} totalDuration={calculateTotalDuration()} />;
    }
    
    // For set mode (one story per set)
    if (session.storyMode === "set") {
      const stories = Array.isArray(session.storyText) ? session.storyText : [session.storyText];
      return <SetModeStory session={session} timer={timer} stories={stories} />;
    }
    
    // For interval mode (one story per interval)
    if (session.storyMode === "interval") {
      // Flatten the stories array if it's an array of strings
      const allStories = Array.isArray(session.storyText) ? session.storyText : [session.storyText];
      return <IntervalModeStory session={session} timer={timer} stories={allStories} />;
    }
    
    return null;
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="py-4">
        <h3 className="text-xl font-semibold mb-2">Your Story</h3>
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="pr-4">
            {renderStoryContent()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StoryDisplay;
