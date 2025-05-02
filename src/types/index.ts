
export interface StorySession {
  id: string;
  durationMinutes: number;
  genre: string;
  language: string;
  storyText: string;
  storyAudioUrl: string | null;
  wordCount: number;
  isIntervalMode: boolean;
  intervalCount: number;
  intervalDurationMinutes: number;
  createdAt: Date;
}

export interface Timer {
  sessionId: string;
  startTime: Date | null;
  endTime: Date | null;
  currentInterval: number | null;
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number; // in seconds
}

export interface StorySettings {
  durationMinutes: number;
  genre: string;
  language: string;
  isIntervalMode: boolean;
  intervalCount: number;
  intervalDurationMinutes: number;
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
