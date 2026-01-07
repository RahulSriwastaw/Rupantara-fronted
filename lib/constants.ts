// App constants

export const APP_NAME = "Rupantra AI";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "AI-powered photo transformation and generation platform";

// Points constants
export const POINTS = {
  DAILY_LOGIN: 3,
  AD_WATCH: 6,
  REFERRAL_BONUS: 20,
  GENERATION_BASE: 20,
  WELCOME_BONUS: 100,
  MAX_ADS_PER_DAY: 5,
} as const;

// Limits
export const LIMITS = {
  MAX_PHOTOS_UPLOAD: 5,
  MAX_PHOTO_SIZE_MB: 10,
  MAX_PROMPT_LENGTH: 500,
  MAX_TAGS: 10,
  MIN_WITHDRAWAL: 500,
} as const;

// File types
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Quality options
export const QUALITY_OPTIONS = [
  { value: "SD", label: "SD (Standard)", cost: 0 },
  { value: "HD", label: "HD (High Definition)", cost: 5 },
  { value: "UHD", label: "UHD (Ultra HD)", cost: 10 },
  { value: "2K", label: "2K Resolution", cost: 15 },
  { value: "4K", label: "4K Resolution", cost: 20 },
  { value: "8K", label: "8K Resolution", cost: 30 },
] as const;

// Aspect ratios
export const ASPECT_RATIOS = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "4:3", label: "Standard (4:3)" },
  { value: "16:9", label: "Widescreen (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "3:4", label: "Portrait (3:4)" },
] as const;

// Categories
export const TEMPLATE_CATEGORIES = [
  "All",
  "Trending",
  "Cartoon",
  "Wedding",
  "Fashion",
  "Business",
  "Cinematic",
  "Festival",
  "Portrait",
  "Couple",
  "Traditional",
  "Modern",
] as const;

// API Base URL - uses environment variable or defaults to relative path for Next.js rewrites
const API_BASE = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL
  ? process.env.NEXT_PUBLIC_BACKEND_URL
  : '';

const getApiUrl = (path: string) => API_BASE ? `${API_BASE}${path}` : path;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: getApiUrl("/api/auth/login"),
    REGISTER: getApiUrl("/api/auth/register"),
    LOGOUT: getApiUrl("/api/auth/logout"),
  },
  TEMPLATES: {
    LIST: getApiUrl("/api/templates"),
    DETAIL: getApiUrl("/api/templates/:id"),
    SEARCH: getApiUrl("/api/templates/search"),
  },
  GENERATIONS: {
    CREATE: getApiUrl("/api/generations"),
    LIST: getApiUrl("/api/generations"),
    DETAIL: getApiUrl("/api/generations/:id"),
  },
  WALLET: {
    BALANCE: getApiUrl("/api/wallet/balance"),
    TRANSACTIONS: getApiUrl("/api/wallet/transactions"),
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTH: "rupantar-auth",
  WALLET: "rupantar-wallet",
  GENERATIONS: "rupantar-generations",
  RECENT_SEARCHES: "rupantar-recent-searches",
  THEME: "rupantar-theme",
} as const;

