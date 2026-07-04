import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { logoutUser } from '../../services/auth'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '◉' },
  { to: '/admin/semesters', label: 'Semesters', icon: '⊞' },
  { to: '/admin/subjects', label: 'Subjects', icon: '⊡' },
  { to: '/admin/chapters', label: 'Chapters', icon: '▤' },
  { to: '/admin/resources', label: 'Resources', icon: '▦' },
  { to: '/admin/comments', label: 'Comments', icon: '💬' },
  { to: '/admin/batches', label: 'Batches', icon: '👥' },
  { to: '/admin/quizzes', label: 'Quizzes', icon: '📝' },
]

export default function AdminLayout() {
  const { userData, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#0d1117]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-800 bg-[#0f172a] transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0`}>
        <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">FK</div>
          <div>
            <p className="text-sm font-semibold text-white">FCBS Digi Kuppiya</p>
            <p className="text-[10px] text-gray-500">Admin Panel</p>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${isActive ? 'bg-indigo-600/20 text-indigo-400 font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`
              }>
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60 px-3">Super Admin</p>
              </div>
              <NavLink to="/admin/super/dashboard" onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${isActive ? 'bg-amber-600/20 text-amber-400 font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`
                }>
                <span className="w-5 text-center">◉</span> Analytics
              </NavLink>
              <NavLink to="/admin/super/admins" onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${isActive ? 'bg-amber-600/20 text-amber-400 font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`
                }>
                <span className="w-5 text-center">⚙</span> Admin Mgmt
              </NavLink>
              <NavLink to="/admin/super/users" onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${isActive ? 'bg-amber-600/20 text-amber-400 font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`
                }>
                <span className="w-5 text-center">⊞</span> User Mgmt
              </NavLink>
            </>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
          <div className="mb-2 flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {userData?.firstName?.[0] || 'U'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">{userData?.firstName} {userData?.lastName}</p>
              <p className="text-[10px] text-gray-500">{userData?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full rounded-lg bg-red-600/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/30 transition">
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-800 bg-[#0d1117]/80 px-6 backdrop-blur">
          <button className="md:hidden text-gray-400 text-2xl" onClick={() => setSidebarOpen(true)}>☰</button>
          <div />
          <NavLink to="/profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white hover:ring-2 hover:ring-indigo-400 transition">
            {userData?.firstName?.[0] || 'U'}
          </NavLink>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
