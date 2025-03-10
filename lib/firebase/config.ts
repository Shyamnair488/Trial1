'use client'

import { Analytics, getAnalytics } from "firebase/analytics"
import { FirebaseApp, initializeApp } from "firebase/app"
import { Auth, getAuth } from "firebase/auth"
import { Firestore, getFirestore } from "firebase/firestore"
import { Messaging } from "firebase/messaging"

// Define the Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null
let messaging: Messaging | null = null

// Initialize Firebase immediately if we're in the browser
if (typeof window !== "undefined") {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)

    // Initialize Analytics only in production
    if (process.env.NODE_ENV === "production") {
      analytics = getAnalytics(app)
    }

    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Firebase initialization error:", error)
  }
}

// Create a promise that resolves when Firebase is initialized
const firebaseInitPromise = new Promise<boolean>((resolve, reject) => {
  if (typeof window === "undefined") {
    console.log("Firebase initialization skipped on server side")
    resolve(false)
    return
  }

  try {
    // Check if Firebase is already initialized
    if (app && auth) {
      console.log("Firebase already initialized")
      resolve(true)
      return
    }

    // Verify all required environment variables are present
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
    ]

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
    }

    // Initialize Firebase
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)

    // Initialize Analytics only in production
    if (process.env.NODE_ENV === "production") {
      analytics = getAnalytics(app)
    }

    console.log("Firebase initialized successfully")
    resolve(true)
  } catch (error) {
    console.error("Firebase initialization error:", error)
    reject(error)
  }
})

// Export the initialized services
export { analytics, app, auth, db, firebaseInitPromise, messaging }

