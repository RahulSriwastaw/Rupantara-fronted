// Configuration for mobile and web builds
// This ensures production URLs are used in APK builds where env vars might not be available

// Production URLs (hardcoded for mobile builds)
const PRODUCTION_CONFIG_DEFAULT = {
  API_BASE_URL: 'https://new-backend-g2gw.onrender.com',
  API_URL: 'https://new-backend-g2gw.onrender.com/api',
  FRONTEND_URL: 'https://rupantara-fronted.vercel.app',
  ADMIN_PANEL_URL: 'https://new-admin-pannel-nine.vercel.app',
};

export const PRODUCTION_CONFIG = { ...PRODUCTION_CONFIG_DEFAULT };

// If running in Replit, override production URLs to use local backend
if (typeof window !== 'undefined' && window.location.origin.includes('replit.dev')) {
  PRODUCTION_CONFIG.API_BASE_URL = window.location.origin;
  PRODUCTION_CONFIG.API_URL = `${window.location.origin}/api`;
}

// Get API URL - prioritizes env vars for web, falls back to production for mobile
export function getApiBaseUrl(): string {
  // Check if we're in a mobile/Capacitor environment
  const isMobile = typeof window !== 'undefined' && (
    (window as any).Capacitor || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  // For mobile builds, always use production URL
  if (isMobile) {
    const url = PRODUCTION_CONFIG.API_BASE_URL;
    // Debug logging for mobile
    if (typeof window !== 'undefined') {
      console.log('📱 Mobile detected, using production API:', url);
    }
    return url;
  }

  // For web, try environment variables first
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (envUrl) {
    // Remove any /api/v1 or /api suffix and use base URL
    const baseUrl = envUrl.replace(/\/api\/v1.*$/, '').replace(/\/api.*$/, '').replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      console.log('🌐 Web detected, using env API:', baseUrl);
    }
    return baseUrl;
  }

  // Default to production backend base URL
  const url = PRODUCTION_CONFIG.API_BASE_URL;
  if (typeof window !== 'undefined') {
    console.log('🌐 Using default production API:', url);
  }
  return url;
}

// Get full API URL with /api suffix
export function getApiUrl(): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api`;
}

// Firebase configuration
export const FIREBASE_CONFIG = {
  authDomain: 'rupantra-ai.firebaseapp.com',
  projectId: 'rupantra-ai',
};
