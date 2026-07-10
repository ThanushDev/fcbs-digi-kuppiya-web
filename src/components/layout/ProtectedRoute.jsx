import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import CompleteProfile from '../../pages/setup/CompleteProfile'

export function ProtectedRoute({ allowedRoles }) {
  const { user, userData, loading, needsProfileSetup } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (user && !userData) {
    signOut(auth);
    return <Navigate to="/login" replace />
  }

  if (needsProfileSetup) {
    return <CompleteProfile />
  }

  if (allowedRoles && !allowedRoles.includes(userData?.role)) {
    if (userData?.role === 'admin' || userData?.role === 'super_admin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (user && userData) {
    if (userData?.role === 'admin' || userData?.role === 'super_admin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  if (user && !userData) {
    signOut(auth);
  }

  return <Outlet />
}
