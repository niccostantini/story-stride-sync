
// API Keys configuration with environment awareness
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isLovablePreview = window.location.hostname === 'preview.lovable.dev';

// Determine if we're in a supported environment (local or Lovable preview)
const isAllowedEnvironment = isLocalhost || isLovablePreview;

// Centralized API Keys
export const API_KEYS = {
  // Only provide the real API key in allowed environments
  GOOGLE_CLOUD_TTS: isAllowedEnvironment 
    ? 'AIzaSyDVlCm2qoxihp8G7G0TTdUxs1gZ5qHxsHw' 
    // Mock key for other environments
    : 'DEMO_KEY'
};

// Helper to check if we're in a development environment
export const isDevelopmentMode = isLocalhost;

// Helper to check if we're in the Lovable preview environment
export const isPreviewMode = isLovablePreview;

