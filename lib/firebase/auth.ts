'use client'

import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { auth, initializeFirebase } from "./config"
import { createUser, getUserProfile, updateUserStatus } from "./firestore"

// Helper function to check if auth is initialized
const checkAuth = async (): Promise<Auth> => {
  try {
    await initializeFirebase()
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Please refresh the page and try again.")
    }
    return auth
  } catch (error) {
    console.error("Error checking auth:", error)
    throw new Error("Failed to initialize Firebase. Please refresh the page and try again.")
  }
}

// Update the signUpWithEmail function to include phone number
export const signUpWithEmail = async (email: string, password: string, displayName: string, phoneNumber?: string) => {
  try {
    const authInstance = await checkAuth()
    console.log("Signing up with email:", email)
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password)

    // Update profile with display name
    if (authInstance.currentUser) {
      await updateProfile(authInstance.currentUser, {
        displayName,
      })
    }

    // Create user document in Firestore
    await createUser(userCredential.user.uid, {
      email,
      displayName,
      phoneNumber: phoneNumber || null,
      photoURL: null,
      createdAt: new Date(),
      online: true,
    })

    console.log("User signed up successfully:", userCredential.user.uid)
    return userCredential.user
  } catch (error) {
    console.error("Error signing up with email:", error)
    throw error
  }
}

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const authInstance = await checkAuth()
    console.log("Attempting to sign in with email:", email)
    
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password)
    const user = userCredential.user

    // Wait for user profile and status update
    try {
      const [userDoc] = await Promise.all([
        getUserProfile(user.uid),
        updateUserStatus(user.uid, true)
      ])

      const isAdmin = userDoc?.isAdmin || false
      console.log("User signed in successfully:", user.uid, "Is Admin:", isAdmin)

      // Create a plain object with only the necessary data
      const userData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified || false,
        isAdmin,
        lastLogin: new Date().toISOString()
      }

      // Return the plain object
      return userData
    } catch (profileError) {
      console.warn("Error updating user profile/status:", profileError)
      // Return a plain object with basic user data
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified || false,
        isAdmin: false,
        lastLogin: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error("Error signing in with email:", error)
    if (error instanceof Error) {
      const firebaseError = error as { code?: string; message: string }
      switch (firebaseError.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          throw new Error("Invalid email or password. Please try again.")
        case "auth/too-many-requests":
          throw new Error("Too many failed attempts. Please try again later.")
        case "auth/user-disabled":
          throw new Error("This account has been disabled. Please contact support.")
        case "auth/invalid-email":
          throw new Error("Invalid email format. Please check your email address.")
        case "auth/network-request-failed":
          throw new Error("Network error. Please check your internet connection.")
        case "auth/internal-error":
          throw new Error("An internal error occurred. Please try again later.")
        case "auth/operation-not-allowed":
          throw new Error("Email/password accounts are not enabled. Please contact support.")
        case "auth/weak-password":
          throw new Error("Password is too weak. Please use a stronger password.")
        default:
          throw new Error(firebaseError.message || "An error occurred during sign in.")
      }
    } else {
      throw new Error("An unexpected error occurred. Please try again.")
    }
  }
}

// Update the signInWithGoogle function to handle the unauthorized domain error better
export const signInWithGoogle = async () => {
  try {
    const authInstance = await checkAuth()
    console.log("Signing in with Google")
    const provider = new GoogleAuthProvider()
    provider.addScope("profile")
    provider.addScope("email")
    provider.setCustomParameters({ prompt: "select_account" })

    const result = await signInWithPopup(authInstance, provider)
    const user = result.user

    // Create or update user document in Firestore
    await createUser(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date(),
      online: true,
      lastLogin: new Date(),
      loginMethod: 'google'
    })

    console.log("User signed in with Google successfully:", user.uid)
    return user
  } catch (error) {
    console.error("Error signing in with Google:", error)
    if (error instanceof Error) {
      const firebaseError = error as { code?: string; message: string }
      switch (firebaseError.code) {
        case "auth/popup-closed-by-user":
          throw new Error("Google sign-in was cancelled. Please try again.")
        case "auth/popup-blocked":
          throw new Error("Pop-up was blocked by your browser. Please allow pop-ups for this site.")
        case "auth/unauthorized-domain":
          throw new Error("This domain is not authorized for Google sign-in. Please contact support.")
        case "auth/account-exists-with-different-credential":
          throw new Error("An account already exists with the same email address but different sign-in credentials.")
        default:
          throw new Error(firebaseError.message || "Could not sign in with Google. Please try again.")
      }
    }
    throw new Error("Could not sign in with Google. Please try again.")
  }
}

export const signOut = async () => {
  try {
    const authInstance = await checkAuth()
    // Update user's online status before signing out
    if (authInstance.currentUser) {
      await updateUserStatus(authInstance.currentUser.uid, false)
    }

    await firebaseSignOut(authInstance)
    console.log("User signed out successfully")
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

// Add password reset function
export const sendPasswordResetEmail = async (email: string) => {
  try {
    const authInstance = await checkAuth()
    await firebaseSendPasswordResetEmail(authInstance, email)
    console.log("Password reset email sent to:", email)
    return true
  } catch (error) {
    console.error("Error sending password reset email:", error)
    if (error instanceof Error) {
      const firebaseError = error as { code?: string; message: string }
      if (firebaseError.code === "auth/user-not-found") {
        throw new Error("No account found with this email address.")
      } else {
        throw new Error(firebaseError.message)
      }
    } else {
      throw new Error("An unexpected error occurred. Please try again.")
    }
  }
}

// Set up presence system
export const setupPresence = () => {
  if (typeof window !== "undefined" && auth) {
    let beforeUnloadHandler: (() => void) | null = null

    // Set up the onAuthStateChanged listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        await updateUserStatus(user.uid, true)

        // Remove existing handler if any
        if (beforeUnloadHandler) {
          window.removeEventListener("beforeunload", beforeUnloadHandler)
        }

        // Create new handler
        beforeUnloadHandler = async () => {
          await updateUserStatus(user.uid, false)
        }

        // Add new handler
        window.addEventListener("beforeunload", beforeUnloadHandler)
      } else {
        // User is signed out
        if (beforeUnloadHandler) {
          window.removeEventListener("beforeunload", beforeUnloadHandler)
          beforeUnloadHandler = null
        }
      }
    })

    // Return cleanup function
    return () => {
      unsubscribe()
      if (beforeUnloadHandler) {
        window.removeEventListener("beforeunload", beforeUnloadHandler)
      }
    }
  }
}

// Add this new function
export const createAdminAccount = async (email: string, password: string) => {
  try {
    const authInstance = await checkAuth()
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password)
    const user = userCredential.user

    // Set custom claims for admin
    // Note: This requires Firebase Admin SDK and should be done on the server-side
    // For this example, we'll just add an admin field to the user document
    await createUser(user.uid, {
      email,
      displayName: "Admin",
      isAdmin: true,
      createdAt: new Date(),
      online: true,
    })

    console.log("Admin account created successfully")
    return user
  } catch (error) {
    console.error("Error creating admin account:", error)
    throw error
  }
}

// Add phone authentication functions
export const setupRecaptcha = (containerId: string): RecaptchaVerifier | null => {
  if (typeof window !== "undefined" && auth) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "normal",
      callback: () => {
        console.log("reCAPTCHA verified")
      },
      "expired-callback": () => {
        console.log("reCAPTCHA expired")
      },
    })
    return window.recaptchaVerifier
  }
  return null
}

export const sendVerificationCode = async (phoneNumber: string, recaptchaVerifier: any) => {
  try {
    const authInstance = await checkAuth()
    const provider = new PhoneAuthProvider(authInstance)
    const verificationId = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier)
    return verificationId
  } catch (error) {
    console.error("Error sending verification code:", error)
    throw error
  }
}

export const verifyPhoneNumber = async (verificationId: string, verificationCode: string) => {
  try {
    const authInstance = await checkAuth()
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode)
    const userCredential = await signInWithCredential(authInstance, credential)

    // Create user document in Firestore if it doesn't exist
    await createUser(userCredential.user.uid, {
      phoneNumber: userCredential.user.phoneNumber,
      displayName: userCredential.user.displayName || userCredential.user.phoneNumber,
      createdAt: new Date(),
      online: true,
    })

    return userCredential.user
  } catch (error) {
    console.error("Error verifying phone number:", error)
    throw error
  }
}

// Update the global Window interface
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier
    confirmationResult: any
  }
}

