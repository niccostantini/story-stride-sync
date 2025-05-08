
import React from 'react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StoryModeSelectorProps {
  storyMode: "session" | "set" | "interval";
  setStoryMode: (mode: "session" | "set" | "interval") => void;
}

const StoryModeSelector: React.FC<StoryModeSelectorProps> = ({ storyMode, setStoryMode }) => {
  return (
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
  );
};

export default StoryModeSelector;
