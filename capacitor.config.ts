import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rupantar.ai',
  appName: 'Rupantra AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'rupantar.ai',
    // Allow cleartext traffic for localhost (development)
    cleartext: true,
    // Allow navigation to external URLs (for OAuth and API calls)
    allowNavigation: [
      'https://accounts.google.com/*',
      'https://rupantra-ai.firebaseapp.com/*',
      'https://*.googleapis.com/*',
      'https://new-backend-g2gw.onrender.com/*',
      'https://*.onrender.com/*'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#8B5CF6",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"]
    }
  }
};

export default config;

