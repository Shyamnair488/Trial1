"use client"

import { auth } from '@/lib/firebase/config'
import { onAuthStateChanged, User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          return
        }

        // Wait for a short delay to ensure Firebase is initialized
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check if auth is available
        if (!auth) {
          throw new Error('Firebase Auth not initialized')
        }

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            } as User)
          } else {
            setUser(null)
          }
          setLoading(false)
        }, (error) => {
          console.error('Auth state change error:', error)
          setError(error)
        })
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err instanceof Error ? err : new Error('Failed to initialize auth'))
        setLoading(false)
      }
    }

    initializeAuth()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

