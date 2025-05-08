
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GENRES, LANGUAGES, StorySettings, WorkoutSet, IntervalItem, generateId, calculateSessionDuration, formatDuration } from '@/types';
import { Plus, Minus, Edit, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

  const addNewSet = () => {
    setWorkoutSets(current => [
      ...current,
      { ...DEFAULT_SET, id: generateId() }
    ]);
    setActiveSetIndex(workoutSets.length); // Switch to the new set
  };

  const removeSet = (setIndex: number) => {
    setWorkoutSets(current => current.filter((_, index) => index !== setIndex));
    
    // Adjust active set index if needed
    if (activeSetIndex >= setIndex && activeSetIndex > 0) {
      setActiveSetIndex(activeSetIndex - 1);
    }
  };

  const addIntervalToSet = (setIndex: number) => {
    setWorkoutSets(current => {
      const newSets = [...current];
      const newInterval = {
        id: generateId(),
        label: `Exercise ${newSets[setIndex].intervals.length + 1}`,
        duration: 60,
        pauseAfter: 30
      };
      
      newSets[setIndex] = {
        ...newSets[setIndex],
        intervals: [...newSets[setIndex].intervals, newInterval]
      };
      
      return newSets;
    });
  };

  const removeIntervalFromSet = (setIndex: number, intervalIndex: number) => {
    setWorkoutSets(current => {
      const newSets = [...current];
      
      // Don't remove if it's the only interval
      if (newSets[setIndex].intervals.length <= 1) {
        return current;
      }
      
      newSets[setIndex] = {
        ...newSets[setIndex],
        intervals: newSets[setIndex].intervals.filter((_, idx) => idx !== intervalIndex)
      };
      
      return newSets;
    });
  };

  const updateIntervalProperty = (
    setIndex: number, 
    intervalIndex: number, 
    property: keyof IntervalItem, 
    value: string | number
  ) => {
    setWorkoutSets(current => {
      const newSets = [...current];
      newSets[setIndex] = {
        ...newSets[setIndex],
        intervals: newSets[setIndex].intervals.map((interval, idx) => {
          if (idx === intervalIndex) {
            return { ...interval, [property]: value };
          }
          return interval;
        })
      };
      
      return newSets;
    });
  };

  const updateSetRestTime = (setIndex: number, seconds: number) => {
    setWorkoutSets(current => {
      const newSets = [...current];
      newSets[setIndex] = {
        ...newSets[setIndex],
        restAfter: seconds
      };
      
      return newSets;
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
          {/* Story Mode Selection */}
          <div className="space-y-2">
            <Label>Story Mode</Label>
            <Tabs defaultValue={storyMode} onValueChange={(value) => setStoryMode(value as "session" | "set" | "interval")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="session">Full Session</TabsTrigger>
                <TabsTrigger value="set">Per Set</TabsTrigger>
                <TabsTrigger value="interval">Per Interval</TabsTrigger>
              </TabsList>
              <TabsContent value="session" className="p-2 border rounded-md mt-2">
                One continuous story for the entire session
              </TabsContent>
              <TabsContent value="set" className="p-2 border rounded-md mt-2">
                One story per set with optional cliffhangers
              </TabsContent>
              <TabsContent value="interval" className="p-2 border rounded-md mt-2">
                One mini-story per interval (more fragmented)
              </TabsContent>
            </Tabs>
          </div>

          {/* Set Management */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Workout Sets</Label>
              <Button 
                type="button"
                size="sm"
                variant="outline"
                onClick={addNewSet}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Set
              </Button>
            </div>
            
            {/* Set Tabs */}
            <Tabs 
              value={`set-${activeSetIndex}`} 
              onValueChange={(value) => setActiveSetIndex(parseInt(value.replace('set-', '')))}
              className="w-full"
            >
              <TabsList className="flex overflow-auto pb-2">
                {workoutSets.map((_, index) => (
                  <TabsTrigger 
                    key={`set-tab-${index}`} 
                    value={`set-${index}`}
                    className="relative"
                  >
                    Set {index + 1}
                    {workoutSets.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSet(index);
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {workoutSets.map((set, setIndex) => (
                <TabsContent key={`set-content-${setIndex}`} value={`set-${setIndex}`} className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Set {setIndex + 1} Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Intervals in this Set */}
                      {set.intervals.map((interval, intervalIndex) => (
                        <div key={interval.id} className="border p-3 rounded-md space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">Interval {intervalIndex + 1}</div>
                            {set.intervals.length > 1 && (
                              <Button 
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removeIntervalFromSet(setIndex, intervalIndex)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          
                          {/* Interval Label */}
                          <div className="space-y-1">
                            <Label htmlFor={`interval-${setIndex}-${intervalIndex}-label`} className="text-xs">Exercise Label</Label>
                            <Input 
                              id={`interval-${setIndex}-${intervalIndex}-label`}
                              value={interval.label}
                              onChange={(e) => updateIntervalProperty(setIndex, intervalIndex, 'label', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          
                          {/* Interval Duration */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <Label htmlFor={`interval-${setIndex}-${intervalIndex}-duration`} className="text-xs">Duration</Label>
                              <span className="text-xs font-medium">{Math.floor(interval.duration / 60)}:{(interval.duration % 60).toString().padStart(2, '0')}</span>
                            </div>
                            <Slider
                              id={`interval-${setIndex}-${intervalIndex}-duration`}
                              min={10}
                              max={300}
                              step={5}
                              value={[interval.duration]}
                              onValueChange={([value]) => updateIntervalProperty(setIndex, intervalIndex, 'duration', value)}
                            />
                          </div>
                          
                          {/* Pause After Interval */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <Label htmlFor={`interval-${setIndex}-${intervalIndex}-pause`} className="text-xs">Pause After</Label>
                              <span className="text-xs font-medium">{Math.floor(interval.pauseAfter / 60)}:{(interval.pauseAfter % 60).toString().padStart(2, '0')}</span>
                            </div>
                            <Slider
                              id={`interval-${setIndex}-${intervalIndex}-pause`}
                              min={0}
                              max={120}
                              step={5}
                              value={[interval.pauseAfter]}
                              onValueChange={([value]) => updateIntervalProperty(setIndex, intervalIndex, 'pauseAfter', value)}
                            />
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Interval Button */}
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => addIntervalToSet(setIndex)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add Interval
                      </Button>
                      
                      {/* Rest After Set */}
                      <div className="border p-3 rounded-md space-y-2 mt-4">
                        <div className="text-sm font-medium">Rest After Set</div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <Label htmlFor={`set-${setIndex}-rest`} className="text-xs">Rest Duration</Label>
                            <span className="text-xs font-medium">{Math.floor(set.restAfter / 60)}:{(set.restAfter % 60).toString().padStart(2, '0')}</span>
                          </div>
                          <Slider
                            id={`set-${setIndex}-rest`}
                            min={0}
                            max={300}
                            step={10}
                            value={[set.restAfter]}
                            onValueChange={([value]) => updateSetRestTime(setIndex, value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          
          {/* Total Session Duration */}
          <div className="bg-muted p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Session Duration:</span>
              <span className="font-bold">{formatDuration(totalSessionDuration)}</span>
            </div>
          </div>

          {/* Genre Selection */}
          <div className="space-y-2">
            <Label className="block mb-2">Story Genres (max 3)</Label>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => (
                <div key={g} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`genre-${g}`} 
                    checked={selectedGenres.includes(g)} 
                    onCheckedChange={() => handleGenreToggle(g)}
                    disabled={!selectedGenres.includes(g) && selectedGenres.length >= 3}
                  />
                  <Label 
                    htmlFor={`genre-${g}`} 
                    className="text-sm cursor-pointer"
                  >
                    {g}
                  </Label>
                </div>
              ))}
            </div>
            {selectedGenres.length === 0 && (
              <p className="text-xs text-destructive mt-1">Please select at least one genre</p>
            )}
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
