import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'

export function ProtectedRoute({ allowedRoles }) {
  const { user, userData, loading, needsProfileSetup, needsFaceVerification } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
        <div className="flex flex-col items-center gap-4">
          <div className="loader-glow" />
          <p className="text-sm font-medium text-slate-400 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (user && !userData) {
    signOut(auth);
    return <Navigate to="/login" replace />
  }

  if (needsProfileSetup || needsFaceVerification) {
    return <Navigate to="/setup" replace />
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
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
        <div className="flex flex-col items-center gap-4">
          <div className="loader-glow" />
          <p className="text-sm font-medium text-slate-400 animate-pulse">Loading...</p>
        </div>
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
