import React, { useState } from 'react';
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { GENRES, LANGUAGES, StorySettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

interface StorySetupFormProps {
  onGenerateStory: (settings: StorySettings) => void;
  isGenerating: boolean;
}

const StorySetupForm: React.FC<StorySetupFormProps> = ({ onGenerateStory, isGenerating }) => {
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([GENRES[0]]);
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [isIntervalMode, setIsIntervalMode] = useState(false);
  const [intervalCount, setIntervalCount] = useState(4);
  const [intervalDurationMinutes, setIntervalDurationMinutes] = useState(1);
  const [pauseDurationSeconds, setPauseDurationSeconds] = useState(30);

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
    
    const settings: StorySettings = {
      durationMinutes,
      genre: selectedGenres,
      language,
      isIntervalMode,
      intervalCount,
      intervalDurationMinutes,
      pauseDurationSeconds
    };
    
    onGenerateStory(settings);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Story Timer</CardTitle>
        <CardDescription className="text-center">
          Set up your workout and get a custom story
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duration Selection */}
          {!isIntervalMode && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="duration">Session Duration</Label>
                <span className="font-medium text-sm">{durationMinutes} min</span>
              </div>
              <Slider
                id="duration"
                min={2}
                max={30}
                step={1}
                value={[durationMinutes]}
                onValueChange={([value]) => setDurationMinutes(value)}
                className="py-4"
              />
            </div>
          )}

          {/* Interval Mode Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="interval-mode" className="cursor-pointer">
              Interval Mode
            </Label>
            <Switch
              id="interval-mode"
              checked={isIntervalMode}
              onCheckedChange={setIsIntervalMode}
            />
          </div>

          {/* Interval Settings (conditionally rendered) */}
          {isIntervalMode && (
            <div className="space-y-4 rounded-md bg-secondary p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="interval-count">Number of Intervals</Label>
                  <span className="font-medium text-sm">{intervalCount}</span>
                </div>
                <Slider
                  id="interval-count"
                  min={2}
                  max={10}
                  step={1}
                  value={[intervalCount]}
                  onValueChange={([value]) => setIntervalCount(value)}
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="interval-duration">Interval Duration</Label>
                  <span className="font-medium text-sm">{intervalDurationMinutes} min</span>
                </div>
                <Slider
                  id="interval-duration"
                  min={1}
                  max={5}
                  step={0.5}
                  value={[intervalDurationMinutes]}
                  onValueChange={([value]) => setIntervalDurationMinutes(value)}
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="pause-duration">Pause Duration</Label>
                  <span className="font-medium text-sm">{pauseDurationSeconds} sec</span>
                </div>
                <Slider
                  id="pause-duration"
                  min={0}
                  max={60}
                  step={5}
                  value={[pauseDurationSeconds]}
                  onValueChange={([value]) => setPauseDurationSeconds(value)}
                  className="py-4"
                />
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span>Total Duration:</span>
                  <span className="font-medium">
                    {(intervalCount * intervalDurationMinutes) + 
                     ((pauseDurationSeconds / 60) * (intervalCount - 1)).toFixed(1)} min
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Genre Selection with Checkboxes */}
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

          {/* Generate Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isGenerating || selectedGenres.length === 0}
          >
            {isGenerating ? "Generating..." : "Generate My Story"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StorySetupForm;
