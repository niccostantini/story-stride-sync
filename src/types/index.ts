
export interface IntervalItem {
  id: string;
  label: string;
  duration: number; // in seconds
  pauseAfter: number; // in seconds
}

export interface WorkoutSet {
  id: string;
  intervals: IntervalItem[];
  restAfter: number; // in seconds
}

export interface StorySession {
  id: string;
  sets: WorkoutSet[];
  storyMode: "session" | "set" | "interval";
  language: string;
  genre: string[];
  storyText: string | string[]; // Array for per-set or per-interval modes
  storyAudioUrl: string | string[] | null; // Array for per-set or per-interval modes
  wordCount: number;
  createdAt: Date;
}

export interface Timer {
  sessionId: string;
  startTime: Date | null;
  endTime: Date | null;
  currentSetIndex: number;
  currentIntervalIndex: number;
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number; // in seconds
  isInPause: boolean;
  pauseTimeRemaining: number; // in seconds
  isInRest: boolean;
  restTimeRemaining: number; // in seconds
}

export interface StorySettings {
  sets: WorkoutSet[];
  storyMode: "session" | "set" | "interval";
  language: string;
  genre: string[];
}

export const GENRES = [
  "Adventure",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Horror",
  "Romance",
  "Historical",
  "Motivational",
  "Comedy",
  "Thriller"
];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" }
];

export enum AppScreen {
  HOME = "home",
  GENERATING = "generating",
  PLAYER = "player",
  COMPLETED = "completed"
}

// Helper function to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper function to calculate total session duration in seconds
export function calculateSessionDuration(sets: WorkoutSet[]): number {
  return sets.reduce((total, set) => {
    // Sum durations of all intervals
    const intervalDuration = set.intervals.reduce((sum, interval) => {
      return sum + interval.duration + interval.pauseAfter;
    }, 0);
    
    // Add rest period after set
    return total + intervalDuration + set.restAfter;
  }, 0);
}

// Helper function to format duration in mm:ss format
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')} min ${remainingSeconds.toString().padStart(2, '0')} sec`;
}
