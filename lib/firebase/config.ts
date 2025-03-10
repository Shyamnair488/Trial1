import { Analytics, getAnalytics } from "firebase/analytics"
import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, Messaging } from "firebase/messaging"

// Initialize Firebase services
let app: any = null
let auth: any = null
let db: any = null
let analytics: Analytics | null = null
let messaging: Messaging | null = null

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Initialize Firebase only if we're in a browser environment
if (isBrowser) {
  try {
    // Check if all required environment variables are present
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
    ] as const

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    )

    if (missingEnvVars.length > 0) {
      console.error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
      )
    } else {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      }

      // Initialize Firebase only if it hasn't been initialized yet
      if (!getApps().length) {
        app = initializeApp(firebaseConfig)
      } else {
        app = getApp()
      }

      // Initialize services
      auth = getAuth(app)
      db = getFirestore(app)

      // Initialize analytics and messaging only if they're supported
      if ('serviceWorker' in navigator) {
        try {
          analytics = getAnalytics(app)
          messaging = getMessaging(app)
        } catch (error) {
          console.warn("Firebase Analytics/Messaging initialization failed:", error)
        }
      }
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error)
  }
}

// Export initialized services
export { analytics, app, auth, db, messaging }

