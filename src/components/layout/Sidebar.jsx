import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, ClipboardList, BarChart3, Target, BookOpen, DollarSign,
  QrCode, Bot, FileText, FileDown, Download, X, Menu, GraduationCap, ChevronRight
} from 'lucide-react'

export default function Sidebar() {
  const { userData } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ]

  const academicTools = [
    { name: 'Quiz System', path: '../qindex.php', icon: ClipboardList, isExternal: true, isQuiz: true },
    { name: 'Attendance Calc', path: '../atdbms/index.html', icon: BarChart3, isExternal: true },
    { name: 'GPA Calculator', path: '../gpa/index.php', icon: Target, isExternal: true },
    { name: 'CA Calculator', path: '../ca/index.html', icon: BookOpen, isExternal: true },
    { name: 'Finance Tracker', path: '../finance/index.php', icon: DollarSign, isExternal: true },
    
    { name: 'QR Generator', path: '/dashboard/tools/qr', icon: QrCode, isInternalTool: true },
    { name: 'AI Humanizer', path: '/dashboard/tools/ai-humanizer', icon: Bot, isInternalTool: true },
    { name: 'CV Maker', path: '/dashboard/tools/cv-maker', icon: FileText, isInternalTool: true },
    { name: 'PDF Generator', path: '/dashboard/tools/pdf-tool', icon: FileDown, isInternalTool: true },
  ]

  return (
    <>
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-gray-900 text-sm tracking-wider uppercase">Uniflow</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-900 p-2 border border-gray-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1">
          {isOpen ? <><X className="w-3 h-3" /> Hide</> : <><Menu className="w-3 h-3" /> Menu</>}
        </button>
      </div>

      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-gray-200 bg-white p-5 flex flex-col justify-between transition-transform lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:static lg:h-screen sticky`}>
        
        <div className="flex flex-col gap-6 overflow-y-auto h-full pr-1">
          <div className="hidden lg:flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Digi Tools</div>
              <div className="text-[10px] tracking-wider text-indigo-600 font-semibold uppercase">Uniflow</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Main</div>
            {mainNav.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link key={item.name} to={item.path} onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Academic Tools</div>
            {academicTools.map((tool) => {
              const Icon = tool.icon
              if (tool.isQuiz && !userData?.quizEnabled) return null;

              if (tool.isInternalTool) {
                const isActive = location.pathname === tool.path
                return (
                  <Link key={tool.name} to={tool.path} onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                      isActive ? 'bg-indigo-50 border-indigo-500/30 text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-transparent'
                    } border`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="flex-1 truncate">{tool.name}</span>
                  </Link>
                )
              }

              return (
                <a key={tool.name} href={tool.path} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">
                  <Icon className="w-3.5 h-3.5 opacity-80" />
                  <span className="flex-1 truncate">{tool.name}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </a>
              )
            })}
          </div>

          <div className="mt-2">
            <a href="https://www.mediafire.com/file/9vqeagotmw7wyyg/FCBS_Digi_Kuppiya.apk/file" target="_blank" rel="noopener noreferrer" 
               className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-50 to-indigo-100/60 hover:from-indigo-100 hover:to-indigo-200/60 border border-indigo-200/50 rounded-xl p-2.5 transition text-xs font-semibold text-indigo-700 group">
              <Download className="w-4 h-4 text-indigo-500" />
              <span className="flex-1 truncate text-left">Download Android App</span>
            </a>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {userData?.firstName ? userData.firstName[0] : 'S'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{userData?.firstName || 'Student'}</p>
            <p className="text-[10px] text-gray-500 truncate capitalize">{userData?.role || 'User'}</p>
          </div>
        </div>
      </aside>

      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" />}
    </>
  )
}
