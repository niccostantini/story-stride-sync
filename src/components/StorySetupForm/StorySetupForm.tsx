import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GENRES, LANGUAGES, StorySettings, WorkoutSet, IntervalItem, generateId, calculateSessionDuration, formatDuration } from '@/types';
import StoryModeSelector from './StoryModeSelector';
import SetManager from './SetManager';
import GenreSelector from './GenreSelector';
import LanguageSelector from './LanguageSelector';
import SessionDuration from './SessionDuration';

interface StorySetupFormProps {
  onGenerateStory: (settings: StorySettings) => void;
  isGenerating: boolean;
}

const DEFAULT_INTERVAL: Omit<IntervalItem, 'id'> = {
  label: "Exercise",
  duration: 60, // 1 minute
  pauseAfter: 30, // 30 seconds
};

const DEFAULT_SET: Omit<WorkoutSet, 'id'> = {
  intervals: [
    { ...DEFAULT_INTERVAL, id: generateId(), label: "Exercise 1" },
    { ...DEFAULT_INTERVAL, id: generateId(), label: "Exercise 2" }
  ],
  restAfter: 60, // 1 minute
};

const StorySetupForm: React.FC<StorySetupFormProps> = ({ onGenerateStory, isGenerating }) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([GENRES[0]]);
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [storyMode, setStoryMode] = useState<"session" | "set" | "interval">("set");
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([
    { ...DEFAULT_SET, id: generateId() }
  ]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [totalSessionDuration, setTotalSessionDuration] = useState(0);

  // Calculate total session duration whenever workout sets change
  useEffect(() => {
    const duration = calculateSessionDuration(workoutSets);
    setTotalSessionDuration(duration);
  }, [workoutSets]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(current => {
      // If already selected, remove it
      if (current.includes(genre)) {
        return current.filter(g => g !== genre);
      }
      
      // If we already have 3 genres and trying to add more, return current
      if (current.length >= 3) {
        return current;
      }
      
      // Otherwise add the genre
      return [...current, genre];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure at least one genre is selected
    if (selectedGenres.length === 0) {
      setSelectedGenres([GENRES[0]]);
      return;
    }
    
    // Validate that each set has at least one interval
    const validSets = workoutSets.every(set => set.intervals.length > 0);
    if (!validSets) {
      // Handle validation error
      return;
    }
    
    const settings: StorySettings = {
      sets: workoutSets,
      genre: selectedGenres,
      language,
      storyMode
    };
    
    onGenerateStory(settings);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Story Timer</CardTitle>
        <CardDescription className="text-center">
          Set up your workout and get a custom story
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <StoryModeSelector
            storyMode={storyMode}
            setStoryMode={setStoryMode}
          />

          <SetManager
            workoutSets={workoutSets}
            setWorkoutSets={setWorkoutSets}
            activeSetIndex={activeSetIndex}
            setActiveSetIndex={setActiveSetIndex}
          />
          
          <SessionDuration totalSessionDuration={totalSessionDuration} />

          <GenreSelector
            selectedGenres={selectedGenres}
            handleGenreToggle={handleGenreToggle}
          />

          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
          />
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isGenerating || selectedGenres.length === 0 || workoutSets.length === 0}
          onClick={handleSubmit}
        >
          {isGenerating ? "Generating..." : "Generate My Story"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StorySetupForm;
