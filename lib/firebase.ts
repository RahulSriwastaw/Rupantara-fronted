"use client"
import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getMessaging, getToken, onMessage } from "firebase/messaging"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCimnodSbzIYczW95Vu5pYTnPAD_P4JOFU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "rupantra-ai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "rupantra-ai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "rupantra-ai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "832796978617",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:832796978617:web:e835fbeb00304740899a68",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-PE3FK9EHYH",
}

// Initialize Firebase
let app
if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig)
} else if (typeof window !== 'undefined') {
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

