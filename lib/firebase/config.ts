'use client'

import { Analytics, getAnalytics } from "firebase/analytics"
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"
import { Auth, getAuth, GoogleAuthProvider } from "firebase/auth"
import { Firestore, getFirestore } from "firebase/firestore"
import { getMessaging, Messaging } from "firebase/messaging"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
}

// Initialize Firebase
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null
let messaging: Messaging | null = null
let isInitialized = false

// Function to initialize Firebase
async function initializeFirebase() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment, skipping Firebase initialization")
      return false
    }

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
      return false
    }

    // Initialize Firebase only if it hasn't been initialized yet
    if (!getApps().length) {
      console.log("Initializing Firebase app...")
      app = initializeApp(firebaseConfig)
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

      console.log("Firebase initialized successfully")
      isInitialized = true
    } else {
      console.log("Firebase app already initialized, getting existing app...")
      app = getApp()
      auth = getAuth(app)
      db = getFirestore(app)
      isInitialized = true
    }

    // Verify initialization
    if (!app || !auth || !db) {
      console.error("Firebase services not properly initialized")
      return false
    }

    return true
  } catch (error) {
    console.error("Firebase initialization failed:", error)
    return false
  }
}

// Initialize Firebase if we're in a browser environment
if (typeof window !== 'undefined') {
  // Initialize immediately
  initializeFirebase().then(success => {
    if (!success) {
      console.error("Failed to initialize Firebase")
    } else {
      console.log("Firebase initialization completed successfully")
    }
  }).catch(error => {
    console.error("Error during Firebase initialization:", error)
  })
}

// Export initialized services
export { analytics, app, auth, db, GoogleAuthProvider, isInitialized, messaging }

