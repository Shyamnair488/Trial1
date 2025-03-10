import { app, auth, db } from '../firebase/config'

export function useFirebase() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      if (app && auth && db) {
        setIsInitialized(true)
      } else {
        setError(new Error('Firebase services not initialized'))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize Firebase'))
    }
  }, [])

  return {
    isInitialized,
    error,
    app,
    auth,
    db
  }
} 