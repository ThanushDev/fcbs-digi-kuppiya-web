import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { logoutUser } from '../../services/auth'
import GlobalSearch from '../search/GlobalSearch'

export default function StudentLayout() {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-[#0d1117]/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">FK</div>
            <span className="text-lg font-bold text-white hidden sm:inline">FCBS Digi Kuppiya</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Home</Link>
            <Link to="/dashboard/quizzes" className="text-sm text-gray-400 hover:text-white transition">Quizzes</Link>
            <Link to="/profile" className="text-sm text-gray-400 hover:text-white transition">Profile</Link>
          </nav>
          <GlobalSearch />

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-500">{userData?.department?.toUpperCase()} | {userData?.batch}</span>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white hover:ring-2 hover:ring-indigo-400 transition">
                {userData?.firstName?.[0] || 'U'}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-40 rounded-xl border border-gray-800 bg-[#141726] py-2 shadow-xl">
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Profile</Link>
                  <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
