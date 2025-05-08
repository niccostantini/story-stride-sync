
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { GENRES } from '@/types';

interface GenreSelectorProps {
  selectedGenres: string[];
  handleGenreToggle: (genre: string) => void;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({ selectedGenres, handleGenreToggle }) => {
  return (
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
  );
};

export default GenreSelector;
