"use client"
import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getMessaging, getToken, onMessage } from "firebase/messaging"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBl6NLfJ_PKmbL0nrbuPeHg3gsCvZeLAvw',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'rupantra-ai.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'rupantra-ai',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'rupantra-ai.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '717770940130',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:717770940130:web:e918e9e148560f10c3c8bb',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-ZBL177LFYH',
}

const hasRequiredConfig = () => (
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId
)

// Initialize Firebase
let app
if (typeof window !== 'undefined' && hasRequiredConfig() && !getApps().length) {
  app = initializeApp(firebaseConfig)
} else if (typeof window !== 'undefined' && getApps().length) {
  app = getApps()[0]
}

// Initialize Auth
export const auth = typeof window !== 'undefined' && app ? getAuth(app) : null

// Initialize Messaging (for push notifications)
let messaging: any = null
if (typeof window !== 'undefined' && app && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.warn('Firebase Messaging not available:', error)
  }
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  if (!messaging) return null
  
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      })
      return token
    }
    return null
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages
export const onMessageListener = () => {
  if (!messaging) return Promise.resolve(null)
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}

export { messaging }
export default app

