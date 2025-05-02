
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface GeneratingStoryProps {
  genre: string;
}

const GeneratingStory: React.FC<GeneratingStoryProps> = ({ genre }) => {
  const [progress, setProgress] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prevProgress + 2;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Creative loading animation */}
          <div className="relative w-24 h-24 mb-2">
            <div className="absolute inset-0 border-4 border-t-purple border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-2 border-4 border-t-purple-dark border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-4 border-4 border-t-story-orange border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '2.5s' }}></div>
          </div>
          
          <h3 className="text-xl font-medium">Creating Your Story</h3>
          
          <div className="text-center text-muted-foreground">
            <p className="mb-2">Crafting a {genre.toLowerCase()} adventure just for you...</p>
            <p className="text-sm">This might take a minute</p>
          </div>
          
          <div className="w-full space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Generating story</span>
              <span>Creating audio</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneratingStory;
