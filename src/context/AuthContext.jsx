import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext(null)

function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('deepdive_token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!token) return
    const decoded = decodeToken(token)
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      logout()
    } else {
      setUser(decoded)
    }
  }, [token])

  function login(jwt) {
    localStorage.setItem('deepdive_token', jwt)
    setToken(jwt)
    setUser(decodeToken(jwt))
  }

  function logout() {
    localStorage.removeItem('deepdive_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
