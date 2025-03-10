import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging } from "firebase/messaging"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCwt0Ng3A8KFILjAaWrXe54GIWh9cGonJg",
  authDomain: "vibe-43e20.firebaseapp.com",
  projectId: "vibe-43e20",
  storageBucket: "vibe-43e20.firebasestorage.app",
  messagingSenderId: "208965831638",
  appId: "1:208965831638:web:dc7f045d127e802cc9b277",
  measurementId: "G-2FT28CBDE0",
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Initialize Firebase Analytics and Messaging conditionally for client-side
let analytics: any = null
let messaging: any = null

if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app)
    messaging = getMessaging(app)
  } catch (error) {
    console.error("Firebase services failed to initialize:", error)
  }
}

export { app, auth, db, messaging, analytics }

