import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { logoutUser } from '../../services/auth'
import GlobalSearch from '../search/GlobalSearch'
import AcademicBackground from '../ui/AcademicBackground'
import { ChevronDown, LogOut, User, BookOpen } from 'lucide-react'
import logo from '../../assets/logo.png'
import AdPopupModal from '../ads/AdPopupModal'

export default function StudentLayout() {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setProfileOpen(false)
    await logoutUser()
    navigate('/login')
  }

  const initial = (userData?.firstName?.[0] || 'U').toUpperCase()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-4 md:px-6 shrink-0 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center transition-all">
                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-base font-bold text-slate-900 hidden sm:inline tracking-tight">FCBS DIGI KUPPIYA</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <GlobalSearch />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/50">
              <BookOpen className="w-3 h-3" />
              {userData?.department?.toUpperCase()} | {userData?.batch}
            </span>

            {/* Profile avatar dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white hover:ring-2 hover:ring-indigo-300 transition-all shadow-sm shadow-indigo-200/50 overflow-hidden focus:outline-none">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{userData?.firstName} {userData?.lastName}</p>
                    <p className="text-[11px] text-slate-500 capitalize truncate">Student</p>
                    <p className="text-[11px] text-slate-400">{userData?.department?.toUpperCase()} | Batch {userData?.batch}</p>
                  </div>
                  <Link to="/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Profile Settings</Link>
                  <Link to="/dashboard/quizzes" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Quizzes</Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <AcademicBackground />

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <AdPopupModal />
    </div>
  )
}
