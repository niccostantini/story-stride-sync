
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StorySession, StorySettings, AppScreen, Timer, generateId, WorkoutSet, IntervalItem } from '@/types';
import { generateStory } from '@/services/storyService';
import { useToast } from '@/hooks/use-toast';

interface StoryContextProps {
  currentScreen: AppScreen;
  session: StorySession | null;
  timer: Timer | null;
  isGenerating: boolean;
  error: string | null;
  setCurrentScreen: (screen: AppScreen) => void;
  generateStorySession: (settings: StorySettings) => Promise<void>;
  clearSession: () => void;
  setTimer: React.Dispatch<React.SetStateAction<Timer | null>>;
  discardStory: () => void;
}

const StoryContext = createContext<StoryContextProps | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.HOME);
  const [session, setSession] = useState<StorySession | null>(null);
  const [timer, setTimer] = useState<Timer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateStorySession = async (settings: StorySettings): Promise<void> => {
    try {
      setIsGenerating(true);
      setError(null);
      setCurrentScreen(AppScreen.GENERATING);

      // Calculate total target word count based on workout duration
      const totalWorkoutDuration = settings.sets.reduce((total, set) => {
        const setDuration = set.intervals.reduce((sum, interval) => sum + interval.duration, 0);
        return total + setDuration;
      }, 0);
      
      // Generate story based on the settings
      const storyResult = await generateStory(settings, totalWorkoutDuration);
      
      // Create a completed session
      const newSession: StorySession = {
        id: generateId(),
        sets: settings.sets,
        storyMode: settings.storyMode,
        genre: settings.genre,
        language: settings.language,
        storyText: storyResult.storyText,
        storyAudioUrl: storyResult.storyAudioUrl,
        wordCount: storyResult.wordCount,
        createdAt: new Date()
      };
      
      setSession(newSession);
      setCurrentScreen(AppScreen.PLAYER);
      
      toast({
        title: "Story created!",
        description: `Your ${settings.genre.join(", ")} story is ready to play.`,
      });
    } catch (error) {
      setCurrentScreen(AppScreen.HOME);
      setError(error instanceof Error ? error.message : 'Failed to generate story');
      
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearSession = () => {
    setSession(null);
    setError(null);
  };

  const discardStory = () => {
    clearSession();
    setTimer(null);
    setCurrentScreen(AppScreen.HOME);
    
    toast({
      title: "Story discarded",
      description: "You can now create a new story.",
    });
  };

  return (
    <StoryContext.Provider
      value={{
        currentScreen,
        session,
        timer,
        isGenerating,
        error,
        setCurrentScreen,
        generateStorySession,
        clearSession,
        setTimer,
        discardStory
      }}
    >
      {children}
    </StoryContext.Provider>
  );
};

export const useStory = (): StoryContextProps => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
};
