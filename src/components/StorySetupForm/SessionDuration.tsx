
import React from 'react';
import { formatDuration } from '@/types';

interface SessionDurationProps {
  totalSessionDuration: number;
}

const SessionDuration: React.FC<SessionDurationProps> = ({ totalSessionDuration }) => {
  return (
    <div className="bg-muted p-3 rounded-md">
      <div className="flex justify-between items-center">
        <span className="font-semibold">Total Session Duration:</span>
        <span className="font-bold">{formatDuration(totalSessionDuration)}</span>
      </div>
    </div>
  );
};

export default SessionDuration;
