import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login as loginRequest } from '../api/auth'
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getToken() !== null)

  useEffect(() => {
    // registrado una vez — api/client.ts es un módulo plano sin acceso
    // directo al context, lo llama acá cuando cualquier request admin
    // devuelve 401 (token vencido o inválido).
    setUnauthorizedHandler(() => {
      clearToken()
      setIsAuthenticated(false)
    })
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const { accessToken } = await loginRequest(email, password)
    setToken(accessToken)
    setIsAuthenticated(true)
  }

  function logout(): void {
    clearToken()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
