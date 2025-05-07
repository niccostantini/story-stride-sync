
// API Keys configuration with environment awareness
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const isLovablePreview = hostname === 'preview.lovable.dev';
const isCustomDomain = !isLocalhost && !isLovablePreview;

// Log the current environment for debugging
console.log(`Environment detection: hostname=${hostname}`);
console.log(`Environment status: isLocalhost=${isLocalhost}, isLovablePreview=${isLovablePreview}, isCustomDomain=${isCustomDomain}`);

// Determine if we're in a supported environment (local or Lovable preview)
const isAllowedEnvironment = isLocalhost || isLovablePreview;
console.log(`Is allowed environment for API calls: ${isAllowedEnvironment}`);

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
