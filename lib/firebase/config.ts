'use client'

import { Analytics, getAnalytics } from "firebase/analytics"
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"
import { Auth, getAuth } from "firebase/auth"
import { Firestore, getFirestore } from "firebase/firestore"
import { Messaging } from "firebase/messaging"

// Define the Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCwt0Ng3A8KFILjAaWrXe54GIWh9cGonJg",
  authDomain: "vibe-43e20.firebaseapp.com",
  databaseURL: "https://vibe-43e20-default-rtdb.firebaseio.com",
  projectId: "vibe-43e20",
  storageBucket: "vibe-43e20.firebasestorage.app",
  messagingSenderId: "208965831638",
  appId: "1:208965831638:web:dc7f045d127e802cc9b277",
  measurementId: "G-2FT28CBDE0"
}

// Initialize Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore
let analytics: Analytics | null = null
let messaging: Messaging | null = null
let initializationPromise: Promise<void> | null = null

// Initialize Firebase
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApp()
}

// Initialize services
auth = getAuth(app)
db = getFirestore(app)

// Initialize Analytics only in production and client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  analytics = getAnalytics(app)
}

// Create a promise that resolves when Firebase is initialized
const initializeFirebase = async () => {
  if (typeof window === "undefined") {
    console.log("Firebase initialization skipped on server side")
    return
  }

  // If initialization is already in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise
  }

  // Create new initialization promise
  initializationPromise = (async () => {
    try {
      if (!messaging) {
        messaging = getMessaging(app)
      }

      console.log("Firebase initialized successfully")
    } catch (error) {
      console.error("Firebase initialization error:", error)
      throw error
    }
  })()

  return initializationPromise
}

// Initialize Firebase immediately if we're in the browser
if (typeof window !== "undefined") {
  initializeFirebase().catch(console.error)
}

// Export the initialized services and initialization promise
export { analytics, app, auth, db, initializeFirebase, messaging }


