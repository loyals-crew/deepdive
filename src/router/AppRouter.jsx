import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import SignIn from '../pages/SignIn'
import SignUp from '../pages/SignUp'
import Friends from '../pages/Friends'
import Feed from '../pages/Feed'
import LogDive from '../pages/LogDive'
import DiveLogDetail from '../pages/DiveLogDetail'
import MyDives from '../pages/MyDives'
import UserProfile from '../pages/UserProfile'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/signin" replace />
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
            <Route path="/"         element={<Feed />} />
            <Route path="/log"      element={<LogDive />} />
            <Route path="/dive/:id" element={<DiveLogDetail />} />
            <Route path="/my-dives"   element={<MyDives />} />
            <Route path="/friends"    element={<Friends />} />
            <Route path="/user/:id"   element={<UserProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
