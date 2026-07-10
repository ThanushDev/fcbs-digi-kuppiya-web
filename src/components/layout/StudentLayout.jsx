import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { logoutUser } from '../../services/auth'
import GlobalSearch from '../search/GlobalSearch'
import AcademicBackground from '../ui/AcademicBackground'
import logo from '../../assets/logo.png' // 🎯 Uniflow SVG ලෝගෝ එක ඉම්පෝට් කළා

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
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              
              {/* 🎯 නිල් කොටුව අයින් කරලා, රවුම් ලෝගෝ එක කෙලින්ම පේන්න හැදුවා (h-11 w-11) */}
              <div className="flex h-11 w-11 items-center justify-center bg-transparent transition-all">
                <img src={logo} alt="Uniflow Logo" className="h-full w-full object-contain" />
              </div>
              
              {/* 🎯 FCBS Digi Kuppiya වෙනුවට Uniflow ලෙස නම වෙනස් කළා */}
              <span className="text-lg font-bold text-gray-900 hidden sm:inline">FCBS DIGI KUPPIYA</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <GlobalSearch />
            <span className="hidden sm:block text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
              {userData?.department?.toUpperCase()} | {userData?.batch}
            </span>

            {/* Profile avatar dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white hover:ring-2 hover:ring-indigo-300 transition-all shadow-sm overflow-hidden focus:outline-none">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Student Profile" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userData?.firstName} {userData?.lastName}</p>
                    <p className="text-[11px] text-gray-500 capitalize truncate">Student</p>
                    <p className="text-[11px] text-gray-400">{userData?.department?.toUpperCase()} | Batch {userData?.batch}</p>
                  </div>
                  <Link to="/profile" onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">Profile Settings</Link>
                  <Link to="/dashboard/quizzes" onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">Quizzes</Link>
                  <button onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Academic background animation */}
        <AcademicBackground />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}