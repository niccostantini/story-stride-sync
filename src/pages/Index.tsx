
import { useEffect } from "react";
import { AppScreen } from "@/types";
import StorySetupForm from "@/components/StorySetupForm";
import GeneratingStory from "@/components/GeneratingStory";
import AudioPlayer from "@/components/AudioPlayer";
import StoryDisplay from "@/components/StoryDisplay";
import SessionComplete from "@/components/SessionComplete";
import { Container } from "@/components/ui/container";
import { useStory } from "@/context/StoryContext";
import { useStoryTimer } from "@/hooks/useStoryTimer";

const Index = () => {
  const { 
    currentScreen, 
    session,
    setCurrentScreen,
    generateStorySession,
    clearSession,
    discardStory
  } = useStory();

  const { 
    timer, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    formatTimeRemaining, 
    getProgress 
  } = useStoryTimer(session);

  // Handle timer completion
  useEffect(() => {
    if (timer && timer.timeRemaining === 0 && !timer.isInPause && !timer.isInRest && 
        currentScreen === AppScreen.PLAYER && !timer.isRunning) {
      setCurrentScreen(AppScreen.COMPLETED);
    }
  }, [timer, currentScreen, setCurrentScreen]);

  // Navigate to player screen after story generation is complete
  useEffect(() => {
    if (session && currentScreen === AppScreen.GENERATING) {
      console.log("Story generation complete, navigating to player screen");
      setCurrentScreen(AppScreen.PLAYER);
    }
  }, [session, currentScreen, setCurrentScreen]);

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
            onGenerateStory={generateStorySession} 
            isGenerating={false} 
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
              onDiscard={discardStory}
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
