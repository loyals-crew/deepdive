import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import SignIn from '../pages/SignIn'
import SignUp from '../pages/SignUp'
import Friends from '../pages/Friends'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/signin" replace />
}

function FeedPage() {
  const { user } = useAuth()
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      gap: '1rem',
      fontFamily: 'var(--font-main)',
      padding: '4rem 1.5rem',
    }}>
      <span style={{ fontSize: '3.5rem' }}>🤿</span>
      <h2 style={{ color: 'var(--color-deep)', fontWeight: 800, fontSize: '1.4rem' }}>
        Welcome back, {user?.name}!
      </h2>
      <p style={{ color: 'var(--color-muted)' }}>The feed is coming soon... stay tuned.</p>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth pages */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected pages — all wrapped in AppLayout (navbar) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/friends" element={<Friends />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
