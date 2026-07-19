import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { logoutUser } from '../../services/auth'
import {
  LayoutDashboard, BookOpen, BookText, FileText, FileEdit, Video, ClipboardList,
  MessageSquare, Users, UserCog, BarChart3, Settings, LogOut, User, Menu, X,
  ChevronRight, Shield
} from 'lucide-react'
import logo from '../../assets/logo.png'
import AdPopupModal from '../ads/AdPopupModal'

export default function AdminLayout() {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const isSuperAdmin = userData?.role === 'super_admin'

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

  const navItems = [
    { to: '/admin', label: 'Dashboard', show: true, icon: LayoutDashboard },
    { to: '/admin/semesters', label: 'Semesters', show: true, icon: BookOpen },
    { to: '/admin/subjects', label: 'Subjects', show: true, icon: BookText },
    { to: '/admin/chapters', label: 'Chapters', show: true, icon: FileText },
    { to: '/admin/past-papers', label: 'Past Papers', show: true, icon: FileEdit },
    { to: '/admin/short-notes', label: 'Short Notes', show: true, icon: FileEdit },
    { to: '/admin/videos', label: 'Videos', show: true, icon: Video },
    { to: '/admin/quizzes', label: 'Quizzes', show: true, icon: ClipboardList },
    { to: '/admin/ads', label: 'Ad Management', show: true, icon: BarChart3 },
    { to: '/admin/comments', label: 'Comments', show: isSuperAdmin, icon: MessageSquare },
    { to: '/admin/batches', label: 'Batches', show: isSuperAdmin, icon: Users },
    { to: '/admin/super/users', label: 'User Mgmt', show: isSuperAdmin, icon: UserCog },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/60 shadow-sm flex flex-col transition-transform duration-300 ease-out md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5 shrink-0">
          <img src={logo} alt="Logo" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-bold text-slate-900">FCBS DIGI KUPPIYA</p>
            <p className="text-[10px] font-medium text-slate-500">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 no-scrollbar">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}

          {isSuperAdmin && (
            <>
              <div className="pt-5 pb-1.5 px-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/50 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Super Admin
                </p>
              </div>
              <NavLink to="/admin/super/dashboard" onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <BarChart3 className="w-4 h-4 shrink-0" />
                Analytics
              </NavLink>
              <NavLink to="/admin/super/admins" onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Settings className="w-4 h-4 shrink-0" />
                Admin Mgmt
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-4 md:px-6 shrink-0 shadow-sm shadow-slate-100/50">
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden md:block" />

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
                  <p className="text-[11px] text-slate-500 capitalize truncate">{userData?.role?.replace('_', ' ')}</p>
                  <p className="text-[11px] text-slate-400">{userData?.department?.toUpperCase()} | Batch {userData?.batch}</p>
                </div>
                <NavLink to="/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Profile Settings</NavLink>
                <button onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <AdPopupModal />
    </div>
  )
}
