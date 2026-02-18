import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface User {
  id: string
  email: string
  [key: string]: unknown
}

interface AuthState {
  token: string | null
  user: User | null
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY_TOKEN = 'token'
const STORAGE_KEY_USER = 'user'

function loadFromStorage(): AuthState {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    const raw = localStorage.getItem(STORAGE_KEY_USER)
    const user = raw ? JSON.parse(raw) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

function saveToStorage(token: string | null, user: User | null) {
  if (token) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token)
  } else {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
  }

  if (user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY_USER)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage)

  // Sync if localStorage changes in another tab
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY_TOKEN || e.key === STORAGE_KEY_USER) {
        setState(loadFromStorage())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback((token: string, user: User) => {
    saveToStorage(token, user)
    setState({ token, user })
  }, [])

  const logout = useCallback(() => {
    saveToStorage(null, null)
    setState({ token: null, user: null })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
