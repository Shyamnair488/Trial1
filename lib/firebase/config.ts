'use client'

import { Analytics, getAnalytics } from "firebase/analytics"
import { FirebaseApp, initializeApp } from "firebase/app"
import { Auth, getAuth } from "firebase/auth"
import { Firestore, getFirestore } from "firebase/firestore"
import { Messaging } from "firebase/messaging"

// Define the Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDxXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqX",
  authDomain: "vibeconnect-7c0c3.firebaseapp.com",
  databaseURL: "https://vibeconnect-7c0c3-default-rtdb.firebaseio.com",
  projectId: "vibeconnect-7c0c3",
  storageBucket: "vibeconnect-7c0c3.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
}

// Initialize Firebase
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null
let messaging: Messaging | null = null

// Create a promise that resolves when Firebase is initialized
const firebaseInitPromise = new Promise<boolean>((resolve, reject) => {
  if (typeof window === "undefined") {
    console.log("Firebase initialization skipped on server side")
    resolve(false)
    return
  }

  try {
    // Check if Firebase is already initialized
    if (app) {
      console.log("Firebase already initialized")
      resolve(true)
      return
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

