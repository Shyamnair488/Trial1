'use client'

import { Analytics, getAnalytics } from "firebase/analytics"
import { FirebaseApp, initializeApp } from "firebase/app"
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
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null
let messaging: Messaging | null = null

// Initialize Firebase immediately if we're in the browser
if (typeof window !== "undefined") {
  try {
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

// Export the initialized services
export { analytics, app, auth, db, messaging }

