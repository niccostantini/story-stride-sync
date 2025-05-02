
import { useState } from "react";
import { AppScreen, StorySettings } from "@/types";
import { useStorySession } from "@/hooks/useStorySession";
import { useTimer } from "@/hooks/useTimer";
import StorySetupForm from "@/components/StorySetupForm";
import GeneratingStory from "@/components/GeneratingStory";
import AudioPlayer from "@/components/AudioPlayer";
import StoryDisplay from "@/components/StoryDisplay";
import SessionComplete from "@/components/SessionComplete";
import { useToast } from "@/hooks/use-toast";
import { Container } from "@/components/ui/container";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.HOME);
  const { session, isGenerating, generateStory, clearSession } = useStorySession();
  const { timer, startTimer, pauseTimer, resumeTimer, resetTimer, formatTimeRemaining, getProgress } = useTimer(session);
  const { toast } = useToast();

  // Handle the story generation request
  const handleGenerateStory = async (settings: StorySettings) => {
    setCurrentScreen(AppScreen.GENERATING);
    
    try {
      const newSession = await generateStory(settings);
      if (newSession) {
        setCurrentScreen(AppScreen.PLAYER);
        toast({
          title: "Story created!",
          description: `Your ${settings.genre.join(", ")} story is ready to play.`,
        });
      } else {
        setCurrentScreen(AppScreen.HOME);
        toast({
          title: "Error",
          description: "Failed to generate story. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setCurrentScreen(AppScreen.HOME);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    if (timer && timer.timeRemaining <= 0) {
      setCurrentScreen(AppScreen.COMPLETED);
    }
  };

  // Monitor timer for completion
  if (timer && timer.timeRemaining === 0 && currentScreen === AppScreen.PLAYER) {
    handleTimerComplete();
  }

  // Handle starting a new session
  const handleStartNew = () => {
    clearSession();
    resetTimer();
    setCurrentScreen(AppScreen.HOME);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.HOME:
        return (
          <StorySetupForm 
            onGenerateStory={handleGenerateStory} 
            isGenerating={isGenerating} 
          />
        );
        
      case AppScreen.GENERATING:
        return (
          <GeneratingStory 
            genre={session?.genre ? session.genre.join(", ") : "custom"} 
          />
        );
        
      case AppScreen.PLAYER:
        return session ? (
          <div className="space-y-8">
            <AudioPlayer 
              audioUrl={session.storyAudioUrl}
              timer={timer}
              onPlay={startTimer}
              onPause={pauseTimer}
              onReset={resetTimer}
              formatTimeRemaining={formatTimeRemaining}
              getProgress={getProgress}
            />
            
            <StoryDisplay 
              session={session}
              timer={timer}
            />
          </div>
        ) : null;
        
      case AppScreen.COMPLETED:
        return <SessionComplete onStartNew={handleStartNew} />;
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary">
      <Container className="flex-1 flex flex-col justify-center py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple to-story-orange bg-clip-text text-transparent">
            Story Timer
          </h1>
          <p className="text-muted-foreground">
            Workout with AI-generated stories
          </p>
        </header>
        
        <main className="flex-1 flex items-center justify-center">
          {renderScreen()}
        </main>
        
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>Story Timer &copy; {new Date().getFullYear()}</p>
        </footer>
      </Container>
    </div>
  );
};

export default Index;
