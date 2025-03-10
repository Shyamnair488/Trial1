'use client'

import { Analytics, getAnalytics } from "firebase/analytics"
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"
import { Auth, getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth"
import { Firestore, getFirestore } from "firebase/firestore"
import { getMessaging, Messaging } from "firebase/messaging"

// Firebase configuration
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
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null
let messaging: Messaging | null = null
let isInitialized = false

// Create a promise that resolves when Firebase is initialized
const firebaseInitPromise = new Promise<boolean>((resolve, reject) => {
  // Function to initialize Firebase
  async function initializeFirebase() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log("Not in browser environment, skipping Firebase initialization")
        resolve(false)
        return
      }

      // Initialize Firebase only if it hasn't been initialized yet
      if (!getApps().length) {
        console.log("Initializing Firebase app...")
        app = initializeApp(firebaseConfig)
        
        // Initialize auth first
        auth = getAuth(app)
        
        // Initialize other services
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
        resolve(false)
        return
      }

      // Wait for auth to be ready
      await new Promise<void>((resolveAuth) => {
        if (!auth) throw new Error("Firebase Auth is not initialized")
        const unsubscribe = onAuthStateChanged(auth, () => {
          unsubscribe()
          resolveAuth()
        })
      })

      resolve(true)
    } catch (error) {
      console.error("Firebase initialization failed:", error)
      resolve(false)
    }
  }

  // Initialize Firebase if we're in a browser environment
  if (typeof window !== 'undefined') {
    initializeFirebase()
  } else {
    resolve(false)
  }
})

// Export initialized services and the initialization promise
export { analytics, app, auth, db, firebaseInitPromise, GoogleAuthProvider, isInitialized, messaging }

