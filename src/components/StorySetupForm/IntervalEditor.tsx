
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Plus, Trash } from 'lucide-react';
import { IntervalItem, WorkoutSet } from '@/types';

interface IntervalEditorProps {
  set: WorkoutSet;
  setIndex: number;
  addIntervalToSet: (setIndex: number) => void;
  removeIntervalFromSet: (setIndex: number, intervalIndex: number) => void;
  updateIntervalProperty: (
    setIndex: number,
    intervalIndex: number,
    property: keyof IntervalItem,
    value: string | number
  ) => void;
  updateSetRestTime: (setIndex: number, seconds: number) => void;
}

const IntervalEditor: React.FC<IntervalEditorProps> = ({
  set,
  setIndex,
  addIntervalToSet,
  removeIntervalFromSet,
  updateIntervalProperty,
  updateSetRestTime
}) => {
  return (
    <>
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
    </>
  );
};

export default IntervalEditor;
