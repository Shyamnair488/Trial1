'use client'

import { app, auth, db } from '@/lib/firebase/config'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface FirebaseContextType {
  isInitialized: boolean
  error: Error | null
  app: any
  auth: any
  db: any
}

const FirebaseContext = createContext<FirebaseContextType>({
  isInitialized: false,
  error: null,
  app: null,
  auth: null,
  db: null,
})

export function useFirebaseContext() {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error('useFirebaseContext must be used within a FirebaseProvider')
  }
  return context
}

interface FirebaseProviderProps {
  children: ReactNode
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          return
        }

        // Wait for a short delay to ensure Firebase is initialized
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check if Firebase services are available
        if (!app || !auth || !db) {
          throw new Error('Firebase services not initialized')
        }

        // Check if environment variables are present
        const requiredEnvVars = [
          'NEXT_PUBLIC_FIREBASE_API_KEY',
          'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
          'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
          'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
          'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
          'NEXT_PUBLIC_FIREBASE_APP_ID',
          'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
        ]

        const missingEnvVars = requiredEnvVars.filter(
          (envVar) => !process.env[envVar]
        )

        if (missingEnvVars.length > 0) {
          throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
        }

        setIsInitialized(true)
      } catch (err) {
        console.error('Firebase initialization error:', err)
        setError(err instanceof Error ? err : new Error('Failed to initialize Firebase'))
      }
    }

    initializeFirebase()
  }, [])

  const value = {
    isInitialized,
    error,
    app,
    auth,
    db,
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
} 