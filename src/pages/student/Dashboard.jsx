import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
// 🎯 ඔයාගේ පරණ සර්විස් ෆන්ෂන්ස් ටික විතරක් මෙතනින් කෙලින්ම ගන්නවා
import { getSemesters, getBatchPermission, addComment } from '../../services/firestore' 
import logo from '../../assets/logo.png' 

const semesterIcons = ['📘', '📗', '📕', '📙', '📔', '📓', '📔', '📓']

const SEMESTER_THEMES = [
  { bg: 'bg-gradient-to-br from-blue-50 to-indigo-100/40', border: 'border-blue-200/80 hover:border-blue-400', text: 'text-blue-900', iconBg: 'bg-blue-500/10 text-blue-600' },
  { bg: 'bg-gradient-to-br from-emerald-50 to-teal-100/40', border: 'border-emerald-200/80 hover:border-emerald-400', text: 'text-emerald-900', iconBg: 'bg-emerald-500/10 text-emerald-600' },
  { bg: 'bg-gradient-to-br from-rose-50 to-pink-100/40', border: 'border-rose-200/80 hover:border-rose-400', text: 'text-rose-900', iconBg: 'bg-rose-500/10 text-rose-600' },
  { bg: 'bg-gradient-to-br from-amber-50 to-orange-100/40', border: 'border-amber-200/80 hover:border-amber-400', text: 'text-amber-900', iconBg: 'bg-amber-500/10 text-amber-600' },
  { bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-100/40', border: 'border-purple-200/80 hover:border-purple-400', text: 'text-purple-900', iconBg: 'bg-purple-500/10 text-purple-600' },
  { bg: 'bg-gradient-to-br from-violet-50 to-purple-100/40', border: 'border-violet-200/80 hover:border-violet-400', text: 'text-violet-900', iconBg: 'bg-violet-500/10 text-violet-600' },
  { bg: 'bg-gradient-to-br from-cyan-50 to-blue-100/40', border: 'border-cyan-200/80 hover:border-cyan-400', text: 'text-cyan-900', iconBg: 'bg-cyan-500/10 text-cyan-600' },
  { bg: 'bg-gradient-to-br from-slate-50 to-gray-200/40', border: 'border-slate-200/80 hover:border-slate-400', text: 'text-slate-900', iconBg: 'bg-slate-500/10 text-slate-600' },
]

const MENTORS = [
  { name: "Mr.Thanush Nethsika", nickname: "සයිබර්", batch: "22/23", role: "Author of Uniflow", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/cyber_jz6wx6.jpg" },
  { name: "Ms. Imalsha Sathsarani", batch: "22/23", role: "Economics", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/ima_h6xjz3.jpg" },
  { name: "Ms. Kasuni Gaurika", batch: "22/23", role: "Mathematics", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614076/nawodhya_ylxmlr.jpg" },
  { name: "Ms. Kavindi Nawodhya", batch: "22/23", role: "Mathematics", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614076/nawodhya_ylxmlr.jpg" },
  { name: "Ms. Jayathri Indrachapa", nickname: "මෙඩුසා", batch: "22/23", role: "Mathematics", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614067/chapa_drbwzz.jpg" },
  { name: "Ms. Kavithma Damindi", batch: "22/23", role: "Management", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614072/kavithma_mmfkmr.jpg" },
  { name: "Ms.Naduni Rathnayaka", batch: "22/23", role: "MIS", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614073/naduni_u9czqe.jpg" },
  { name: "Ms.Liyoni Kaushalya", nickname: "ආල්‍යා", batch: "21/22", role: "MIS", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614069/liyoni_c4yb0l.jpg" },
  { name: "Ms. Thakshila Wijesekara", nickname: "රපුන්සල්", batch: "21/22", role: "MIS", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614084/rapunsall_rbr0y0.jpg" },
  { name: "Ms. Dakshila Dilshani", batch: "22/23", role: "Accounting", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614072/dakshi_vvtivc.jpg" },
  { name: "Ms. Shashini Herath", nickname: "ශ්‍රිනී", batch: "21/22", role: "Accounting", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614078/shashini_rhwepa.jpg" },
  { name: "Ms. Lihini Himasha", nickname: "ලාරා", batch: "21/22", role: "Accounting", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614071/lihini_s8ymh1.jpg" },
  { name: "Ms. Diwangani Kavindya", nickname: "විනී", batch: "21/22", role: "Accounting", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614068/diwangani_cyokye.jpg" },
]

const formatSemesterName = (name) => {
  if (!name) return '';
  return name
    .replace(/Y1/g, 'Year I ')
    .replace(/Y2/g, 'Year II ')
    .replace(/Y3/g, 'Year III ')
    .replace(/Y4/g, 'Year IV ')
    .replace(/S1/g, 'Semester I')
    .replace(/S2/g, 'Semester II');
}

const academicTools = [
  { name: 'Quiz System', path: '../qindex.php', icon: '📝', isExternal: true, isQuiz: true, theme: 'from-blue-50 to-cyan-100/50 text-blue-700 border-blue-200' },
  { name: 'Attendance Calc', path: '/dashboard/attendance', icon: '📊', isInternalTool: true, theme: 'from-emerald-50 to-teal-100/50 text-emerald-700 border-emerald-200' },
  { name: 'GPA Calculator', path: '/dashboard/gpa', icon: '🎯', isInternalTool: true, theme: 'from-purple-50 to-indigo-100/50 text-purple-700 border-purple-200' },
  { name: 'CA Calculator', path: '/dashboard/ca', icon: '📐', isInternalTool: true, theme: 'from-amber-50 to-orange-100/50 text-amber-700 border-amber-200' },
  { name: 'Finance Tracker', path: '/dashboard/finance', icon: '💰', isInternalTool: true, theme: 'from-rose-50 to-pink-100/50 text-rose-700 border-rose-200' },
  { name: 'QR Generator', path: '/dashboard/tools/qr', icon: '🔳', isInternalTool: true, theme: 'from-slate-50 to-gray-200/50 text-slate-700 border-slate-300' },
  { name: 'AI Humanizer', path: '/dashboard/tools/ai-humanizer', icon: '🤖', isInternalTool: true, theme: 'from-violet-50 to-fuchsia-100/50 text-violet-700 border-violet-200' },
  { name: 'CV Maker', path: '/dashboard/tools/cv-maker', icon: '📄', isInternalTool: true, theme: 'from-blue-50 to-indigo-100/50 text-indigo-700 border-indigo-200' },
  { name: 'PDF Generator', path: '/dashboard/tools/pdf-tool', icon: '📁', isInternalTool: true, theme: 'from-teal-50 to-emerald-100/50 text-teal-700 border-teal-200' },
]

export default function Dashboard() {
  const { userData } = useAuth()
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMentorIdx, setActiveMentorIdx] = useState(0)
  
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMentorIdx((prev) => (prev + 1) % MENTORS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // 🔄 Safe Live Fetching Logic
  useEffect(() => {
    const load = async () => {
      if (!userData) return;
      try {
        setLoading(true)
        const dept = userData?.department || ''
        const userBatch = userData?.batch ? String(userData.batch).trim() : ''

        // 1️⃣ සර්විස් එකෙන් සෙමෙස්ටර්ස් ගන්නවා
        const allSemesters = await getSemesters()
        
        let filtered = [];

        if (userBatch) {
          // 2️⃣ ඔයාගේ සර්විස් එකේ තියෙන getBatchPermission එක රන් කරනවා
          const perm = await getBatchPermission(userBatch)
          
          const idToNameMap = {
            '11': 'Y1S1', '12': 'Y1S2',
            '21': 'Y2S1', '22': 'Y2S2',
            '31': 'Y3S1', '32': 'Y3S2',
            '41': 'Y4S1', '42': 'Y4S2'
          };

          let allowedIds = [];
          if (perm && perm.semesterIds) {
            allowedIds = perm.semesterIds;
          }

          const allowedNames = allowedIds.map(id => idToNameMap[String(id)]).filter(Boolean);

          // 💡 CRITICAL FALLBACK FIX: 
          // සෙමෙස්ටර්ස් වල 'order' නැති නිසා getSemesters() එකෙන් 2ක් විතරක් ආවොත්, 
          //Allowed Names 6ම තියෙන හින්දා ඩෑෂ්බෝඩ් එක හිස් නොවී පාලනය වෙන්න Fallback එකක් දානවා.
          if (allowedNames.length > 0 && allSemesters.length >= allowedNames.length) {
            filtered = allSemesters.filter((s) => {
              return s.name ? allowedNames.includes(String(s.name).trim()) : false;
            });
          } else {
            // Firestore එකේ order ෆීල්ඩ් එක නැති සෙමෙස්ටර්ස් ඇඩ්මින් පැනල් එකෙන් හදලා ඉවර වෙනකම් 
            // දැනට ඩිපාර්ට්මන්ට් එකට අදාළව තියෙන ඔක්කොම සෙමෙස්ටර්ස් ටික ඩෑෂ්බෝඩ් එකට මුදා හරිනවා.
            filtered = allSemesters.filter((s) => s.department === dept || s.department === 'both');
          }
        } else {
          filtered = allSemesters.filter((s) => s.department === dept || s.department === 'both')
        }

        // 3️⃣ Sorting & State Setting
        filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setSemesters(filtered)

      } catch (error) {
        console.error("Error loading semesters:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userData?.department, userData?.batch])

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    try {
      setSubmittingComment(true)
      await addComment({
        text: commentText,
        studentName: userData?.firstName || 'Student',
        studentEmail: userData?.email || 'unknown@gmail.com',
        batch: userData?.batch || 'N/A',
        department: userData?.department || 'both',
        role: userData?.role || 'student'
      })
      setCommentText('') 
      alert("Comment Posted Successfully! ")
    } catch (err) {
      alert("Error Post Comment.")
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-8 flex flex-col min-h-screen p-2 sm:p-4">
      <div className="flex-grow space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {userData?.firstName || 'Student'}</h1>
          <p className="mt-1 text-sm text-gray-500">Select a semester to view your subjects and learning materials.</p>
        </div>

        {/* Academic Tools Strip */}
        <div className="flex flex-wrap gap-2.5">
          {academicTools.map((tool) => {
            if (tool.isQuiz && !userData?.quizEnabled) return null
            const sharedClass = `px-3 py-1.5 rounded-xl text-xs font-bold transition bg-gradient-to-br ${tool.theme} border shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200 transform`
            if (tool.isInternalTool) {
              return (
                <Link key={tool.name} to={tool.path} className={sharedClass}>
                  {tool.icon} <span className="ml-0.5">{tool.name}</span>
                </Link>
              )
            }
            return (
              <a key={tool.name} href={tool.path} target="_blank" rel="noopener noreferrer" className={sharedClass}>
                {tool.icon} <span className="ml-0.5">{tool.name}</span>
              </a>
            )
          })}
        </div>

        {/* Semester Grid */}
        <div>
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : semesters.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50">
              <p className="text-sm text-gray-400">No semesters available for your batch or department yet.</p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {semesters.map((s, i) => {
                const theme = SEMESTER_THEMES[i % SEMESTER_THEMES.length];
                return (
                  <Link 
                    key={s.id} 
                    to={`/dashboard/subjects/${s.id}`}
                    className={`group p-5 flex flex-col justify-between min-h-[140px] rounded-2xl border shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${theme.bg} ${theme.border}`}
                  >
                    <div>
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xl group-hover:scale-110 transition duration-300 ${theme.iconBg}`}>
                        {semesterIcons[i % semesterIcons.length]}
                      </div>
                      <h3 className={`text-base font-bold transition duration-200 ${theme.text}`}>
                        {formatSemesterName(s.name)}
                      </h3>
                    </div>
                    <p className="mt-3 text-[10px] text-gray-600 capitalize font-bold bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-md w-fit border border-gray-200/50">
                      {s.department}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Mentors Section */}
        <div className="mt-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 overflow-hidden">
          <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Our Mentors</h3>
              <p className="text-xs text-slate-500 mt-0.5">Learn from the experienced undergraduates</p>
            </div>
            <div className="flex space-x-1.5">
              {MENTORS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMentorIdx(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeMentorIdx === idx ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative min-h-[220px] sm:min-h-[140px] flex items-center justify-center">
            {MENTORS.map((mentor, index) => {
              const isActive = index === activeMentorIdx
              return (
                <div
                  key={mentor.name}
                  className={`absolute w-full flex flex-col sm:flex-row items-center gap-6 transition-all duration-700 ease-in-out transform ${
                    isActive 
                      ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' 
                      : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
                  }`}
                >
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl rotate-6 opacity-15 animate-pulse"></div>
                    <img
                      src={mentor.image}
                      alt={mentor.name}
                      className="h-full w-full object-cover rounded-2xl border border-slate-100 shadow-sm relative z-10"
                    />
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 justify-center sm:justify-start">
                      <h4 className="text-xl font-bold text-slate-900">{mentor.name}</h4>
                      {mentor.nickname && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/80 text-slate-600 rounded-full w-max mx-auto sm:mx-0 border border-slate-200/50">
                          "{mentor.nickname}"
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">
                      {mentor.role}
                    </p>
                    <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-xs font-medium text-slate-500">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/40 font-bold">
                        Batch: {mentor.batch}
                      </span>
                      <span className="w-1 bg-slate-300 h-1 rounded-full"></span>
                      <span className="text-[11px]">Faculty Mentor</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Feedback Form Section */}
        <div className="mt-12 bg-gradient-to-br from-indigo-50/40 to-purple-50/40 rounded-2xl shadow-sm border border-indigo-100/80 p-6 md:p-8 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wide">Dashboard Feedback</h3>
            <p className="text-xs text-indigo-700/70 mt-0.5">Have suggestions or issues regarding LMS? Submit directly to admin.</p>
          </div>

          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              rows="3"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your suggestions or feedback here mchn..."
              className="w-full text-sm p-3 bg-white/80 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition outline-none resize-none placeholder-gray-400 shadow-inner"
              maxLength={500}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {submittingComment ? 'Submitting...' : 'Submit Feedback 🚀'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="mt-auto pt-8 pb-4 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Uniflow Logo" className="h-7 w-auto opacity-80 object-contain" />
            <span className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              FCBS DIGI KUPPIYA
            </span>
          </div>
          <div className="text-center md:text-right space-y-0.5">
            <p className="text-xs font-medium text-gray-400 tracking-wide">
              &copy; {new Date().getFullYear()} FCBS DIGI KUPPIYA. All rights reserved.
            </p>
            <p className="text-[11px] text-gray-400 font-medium">
              Developed by{' '}
              <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition cursor-default">
                Mr.Thanush
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}