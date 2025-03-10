'use client'

import { useEffect, useState } from 'react'
import { app, auth, db } from '../firebase/config'

export function useFirebase() {
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

        if (app && auth && db) {
          setIsInitialized(true)
        } else {
          setError(new Error('Firebase services not initialized'))
        }
      } catch (err) {
        console.error('Firebase initialization error:', err)
        setError(err instanceof Error ? err : new Error('Failed to initialize Firebase'))
      }
    }

    initializeFirebase()
  }, [])

  return {
    isInitialized,
    error,
    app,
    auth,
    db
  }
} 