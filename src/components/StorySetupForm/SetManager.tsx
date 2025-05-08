
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash } from 'lucide-react';
import { IntervalItem, WorkoutSet, generateId } from '@/types';
import IntervalEditor from './IntervalEditor';

interface SetManagerProps {
  workoutSets: WorkoutSet[];
  setWorkoutSets: React.Dispatch<React.SetStateAction<WorkoutSet[]>>;
  activeSetIndex: number;
  setActiveSetIndex: React.Dispatch<React.SetStateAction<number>>;
}

const DEFAULT_INTERVAL: Omit<IntervalItem, 'id'> = {
  label: "Exercise",
  duration: 60, // 1 minute
  pauseAfter: 30, // 30 seconds
};

const SetManager: React.FC<SetManagerProps> = ({ 
  workoutSets, 
  setWorkoutSets, 
  activeSetIndex, 
  setActiveSetIndex 
}) => {
  const addNewSet = () => {
    setWorkoutSets(current => [
      ...current,
      { 
        id: generateId(), 
        intervals: [
          { ...DEFAULT_INTERVAL, id: generateId(), label: "Exercise 1" },
          { ...DEFAULT_INTERVAL, id: generateId(), label: "Exercise 2" }
        ],
        restAfter: 60 
      }
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

  return (
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
                <IntervalEditor
                  set={set}
                  setIndex={setIndex}
                  addIntervalToSet={addIntervalToSet}
                  removeIntervalFromSet={removeIntervalFromSet}
                  updateIntervalProperty={updateIntervalProperty}
                  updateSetRestTime={updateSetRestTime}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SetManager;
