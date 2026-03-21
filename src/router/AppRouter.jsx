import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from '../pages/SignIn'
import SignUp from '../pages/SignUp'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/signin" replace />
}

function FeedPlaceholder() {
  const { user, logout } = useAuth()
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      fontFamily: 'var(--font-main)',
      background: 'linear-gradient(160deg, #CAF0F8 0%, #90E0EF 30%, #FFF8F0 100%)',
    }}>
      <span style={{ fontSize: '3rem' }}>🤿</span>
      <h2 style={{ color: '#0D3B4F', fontWeight: 800 }}>Welcome, {user?.name}!</h2>
      <p style={{ color: '#7A9BAD' }}>The feed is coming soon... stay tuned.</p>
      <button
        onClick={logout}
        style={{
          marginTop: '1rem',
          padding: '0.6rem 1.5rem',
          background: '#FF6B6B',
          color: 'white',
          border: 'none',
          borderRadius: '0.75rem',
          fontFamily: 'inherit',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <FeedPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
