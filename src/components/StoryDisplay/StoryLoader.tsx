
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const StoryLoader: React.FC = () => {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
};

export default StoryLoader;
