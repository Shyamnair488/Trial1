'use client'

import {
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
  updateProfile
} from "firebase/auth"
import { auth } from "./config"
import { createUser, getUserProfile, updateUserStatus } from "./firestore"

// Update the signUpWithEmail function to include phone number
export const signUpWithEmail = async (email: string, password: string, displayName: string, phoneNumber?: string) => {
  try {
    console.log("Signing up with email:", email)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update profile with display name
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
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
    console.log("Attempting to sign in with email:", email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    // Check if the user is an admin
    const userDoc = await getUserProfile(userCredential.user.uid)
    const isAdmin = userDoc.isAdmin || false

    // Update user's online status
    await updateUserStatus(userCredential.user.uid, true)

    console.log("User signed in successfully:", userCredential.user.uid, "Is Admin:", isAdmin)
    return { user: userCredential.user, isAdmin }
  } catch (error) {
    console.error("Error signing in with email:", error)
    if (error instanceof Error) {
      const firebaseError = error as { code?: string; message: string }
      if (firebaseError.code === "auth/user-not-found" || firebaseError.code === "auth/wrong-password") {
        throw new Error("Invalid email or password. Please try again.")
      } else {
        throw new Error(firebaseError.message)
      }
    } else {
      throw new Error("An unexpected error occurred. Please try again.")
    }
  }
}

// Update the signInWithGoogle function to handle the unauthorized domain error better
export const signInWithGoogle = async () => {
  try {
    console.log("Signing in with Google")
    const provider = new GoogleAuthProvider()
    // Add scopes for better profile access
    provider.addScope("profile")
    provider.addScope("email")
    provider.setCustomParameters({ prompt: "select_account" })

    const userCredential = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(userCredential)

    // Create user document in Firestore if it doesn't exist
    await createUser(userCredential.user.uid, {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      createdAt: new Date(),
      online: true,
    })

    console.log("User signed in with Google successfully:", userCredential.user.uid)
    return userCredential.user
  } catch (error) {
    console.error("Error signing in with Google:", error)
    // Provide more specific error handling
    if (error instanceof Error) {
      const firebaseError = error as { code?: string; message: string }
      if (firebaseError.code === "auth/popup-closed-by-user") {
        throw new Error("Google sign-in was cancelled. Please try again.")
      } else if (firebaseError.code === "auth/popup-blocked") {
        throw new Error("Pop-up was blocked by your browser. Please allow pop-ups for this site.")
      } else if (firebaseError.code === "auth/unauthorized-domain") {
        throw new Error(
          "This domain is not authorized for Google sign-in. Please use email sign-in instead or contact support.",
        )
      }
    }
    throw error
  }
}

export const signOut = async () => {
  try {
    // Update user's online status before signing out
    if (auth.currentUser) {
      await updateUserStatus(auth.currentUser.uid, false)
    }

    await firebaseSignOut(auth)
    console.log("User signed out successfully")
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

// Add password reset function
export const sendPasswordResetEmail = async (email: string) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email)
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
  if (typeof window !== "undefined") {
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
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
  if (typeof window !== "undefined") {
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
    const provider = new PhoneAuthProvider(auth)
    const verificationId = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier)
    return verificationId
  } catch (error) {
    console.error("Error sending verification code:", error)
    throw error
  }
}

export const verifyPhoneNumber = async (verificationId: string, verificationCode: string) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode)
    const userCredential = await signInWithCredential(auth, credential)

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

