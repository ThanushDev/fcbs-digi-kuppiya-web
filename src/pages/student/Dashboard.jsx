import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom' 
import { useAuth } from '../../contexts/AuthContext'
import { getSemesters, getBatchPermission, addComment } from '../../services/firestore' 
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import logo from '../../assets/logo.png' 

const semesterIcons = ['📘', '📗', '📕', '📙', '📔', '📓', '📔', '📓']
const SEMESTER_THEMES = [
  { bg: 'bg-gradient-to-br from-blue-50 to-indigo-100/40', border: 'border-blue-200/80 hover:border-blue-400', text: 'text-blue-900', iconBg: 'bg-blue-500/10 text-blue-600' },
  { bg: 'bg-gradient-to-br from-emerald-50 to-teal-100/40', border: 'border-emerald-200/80 hover:border-emerald-400', text: 'text-emerald-900', iconBg: 'bg-emerald-500/10 text-emerald-600' },
  { bg: 'bg-gradient-to-br from-rose-50 to-pink-100/40', border: 'border-rose-200/80 hover:border-rose-400', text: 'text-rose-900', iconBg: 'bg-rose-500/10 text-rose-600' },
  { bg: 'bg-gradient-to-br from-amber-50 to-orange-100/40', border: 'border-amber-200/80 hover:border-amber-400', text: 'text-amber-900', iconBg: 'bg-amber-500/10 text-amber-600' },
  { bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-100/40', border: 'border-purple-200/80 hover:border-purple-400', text: 'text-purple-900', iconBg: 'bg-purple-500/10 text-purple-600' },
  { bg: 'bg-gradient-to-br from-violet-50 to-purple-100/40', border: 'border-violet-200/80 hover:border-violet-400', text: 'text-violet-900', iconBg: 'bg-purple-500/10 text-purple-600' },
  { bg: 'bg-gradient-to-br from-cyan-50 to-blue-100/40', border: 'border-cyan-200/80 hover:border-cyan-400', text: 'text-cyan-900', iconBg: 'bg-cyan-500/10 text-cyan-600' },
  { bg: 'bg-gradient-to-br from-slate-50 to-gray-200/40', border: 'border-slate-200/80 hover:border-slate-400', text: 'text-slate-900', iconBg: 'bg-slate-500/10 text-slate-600' },
]

const MENTORS = [
  { name: "Mr.Thanush Nethsika", nickname: "සයිබර්", batch: "22/23", role: "Author of FCBS DIGI KUPPIYA", image: "https://res.cloudinary.com/ddn08cpkt/image/upload/v1783614075/cyber_jz6wx6.jpg" },
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
  const navigate = useNavigate()
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMentorIdx, setActiveMentorIdx] = useState(0)
  
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // 🔔 Notification States
  const [allNotifications, setAllNotifications] = useState([])
  const [activePopup, setActivePopup] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  // 🔄 Specialization Modal States
  const [specModalOpen, setSpecModalOpen] = useState(false)
  const [selectedSemId, setSelectedSemId] = useState('')

  // 🤖 Groq AI Chatbot States
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: 'Hi! I am the DIGI KUPPIYA AI Assistant. How can I help you with your studies today?' }])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatOpen])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMentorIdx((prev) => (prev + 1) % MENTORS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!userData) return;
      try {
        setLoading(true)
        const dept = userData?.department || ''
        const userBatch = userData?.batch ? String(userData.batch).trim() : ''

        const allSemesters = await getSemesters()
        let filtered = [];

        if (userBatch) {
          const perm = await getBatchPermission(userBatch)
          const idToNameMap = { '11': 'Y1S1', '12': 'Y1S2', '21': 'Y2S1', '22': 'Y2S2', '31': 'Y3S1', '32': 'Y3S2', '41': 'Y4S1', '42': 'Y4S2' };
          let allowedIds = [];
          if (perm && perm.semesterIds) allowedIds = perm.semesterIds;
          const allowedNames = allowedIds.map(id => idToNameMap[String(id)]).filter(Boolean);

          if (allowedNames.length > 0 && allSemesters.length >= allowedNames.length) {
            filtered = allSemesters.filter((s) => s.name ? allowedNames.includes(String(s.name).trim()) : false);
          } else {
            filtered = allSemesters.filter((s) => s.department === dept || s.department === 'both');
          }
        } else {
          filtered = allSemesters.filter((s) => s.department === dept || s.department === 'both')
        }

        filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setSemesters(filtered)

        const notifSnap = await getDocs(query(collection(db, 'global_notifications'), orderBy('createdAt', 'desc')))
        const notifList = notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        const userNotifs = notifList.filter(n => n.targetBatch === 'all' || n.targetBatch === userBatch)
        setAllNotifications(userNotifs)

        if (userNotifs.length > 0) {
          setActivePopup(userNotifs[0])
        }

      } catch (error) {
        console.error("Error loading system data:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userData?.department, userData?.batch])

  const handleSemesterClick = (s, e) => {
    const isBMS = userData?.department === 'bms'
    const isYear3or4 = s.name?.includes('Y3') || s.name?.includes('Y4')

    if (isBMS && isYear3or4) {
      e.preventDefault() 
      setSelectedSemId(s.id)
      setSpecModalOpen(true) 
    }
  }

  const handleSpecSelect = (specType) => {
    setSpecModalOpen(false)
    navigate(`/dashboard/subjects/${selectedSemId}?spec=${specType}`)
  }

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

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg = { role: 'user', text: chatInput }
    const updatedMessages = [...chatMessages, userMsg]
    setChatMessages(updatedMessages)
    setChatInput('')
    setIsChatLoading(true)

    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

    try {
      if (!groqApiKey) {
        throw new Error("Groq API Key missing! Please configure VITE_GROQ_API_KEY.");
      }

      const formattedMessages = updatedMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.text || m.content || '')
      })).filter(m => m.content.trim() !== '');

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-safeguard-20b", 
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Groq API Detailed Error:", errorData);
        throw new Error(`Groq API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.choices[0].message.content;

      setChatMessages(prev => [...prev, { role: 'assistant', text: aiText }])
    } catch (error) {
      console.error("Groq API Error:", error)
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Oops! Something went wrong with Groq. Please check your console.' }])
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <>
      {/* MAIN CONTAINER */}
      <div className="animate-fade-in space-y-8 flex flex-col min-h-screen p-2 sm:p-4 relative">
        
        {/* POPUP NOTIFICATION MODAL */}
        {activePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md p-6 bg-white/90 border border-indigo-100 rounded-2xl shadow-2xl backdrop-blur-xl animate-scale-in">
              <button onClick={() => setActivePopup(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold transition text-lg">✕</button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{activePopup.type === 'zoom' ? '📹' : activePopup.type === 'resource' ? '📁' : '📢'}</span>
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{activePopup.type}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{activePopup.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5 whitespace-pre-wrap">{activePopup.message}</p>
              {activePopup.type === 'zoom' && activePopup.zoomLink && (
                <a href={activePopup.zoomLink} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:opacity-90 transition">
                  Join Zoom Meeting Now 🚀
                </a>
              )}
              <p className="text-[10px] text-gray-400 mt-4 text-right">Published: {new Date(activePopup.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Specialization Pop-up Modal */}
        {specModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md p-6 bg-[#0b1528] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-scale-in text-center">
              <button onClick={() => setSpecModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">✕</button>
              <h3 className="text-xl font-black text-white tracking-wide mb-1"> Select Academic Path</h3>
              <p className="text-xs text-slate-400 mb-6">Choose your degree stream to map relevant subjects.</p>
              
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { type: 'all', label: 'General Degree', color: 'hover:border-slate-400 bg-slate-900/50' },
                  { type: 'accounting', label: 'Accounting Specialization', color: 'hover:border-blue-400 bg-blue-950/20' },
                  { type: 'marketing', label: 'Marketing Specialization', color: 'hover:border-emerald-400 bg-emerald-950/20' },
                  { type: 'hrm', label: 'HRM Specialization', color: 'hover:border-rose-400 bg-rose-950/20' },
                  { type: 'management', label: 'Management Specialization', color: 'hover:border-purple-400 bg-purple-950/20' },
                  { type: 'info_management', label: 'Information Management Specialization', color: 'hover:border-cyan-400 bg-cyan-950/20' },
                ].map((spec) => (
                  <button
                    key={spec.type}
                    onClick={() => handleSpecSelect(spec.type)}
                    className={`w-full py-3 px-4 rounded-xl text-left border border-white/10 text-sm font-bold text-slate-200 ${spec.color} transition duration-200 transform hover:-translate-x-1`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATION HISTORY DRAWER */}
        {showHistory && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl border-l border-gray-100 p-6 flex flex-col animate-slide-in">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">🔔 Notifications History</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>
            <div className="space-y-4 flex-grow overflow-y-auto pr-1">
              {allNotifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No notifications broadcasted yet.</p>
              ) : (
                allNotifications.map((n) => (
                  <div key={n.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase bg-white text-slate-700 px-2 py-0.5 rounded border">{n.type}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    {n.type === 'zoom' && n.zoomLink && (
                      <a href={n.zoomLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-[11px] font-bold text-blue-600 hover:underline">
                        🔗 Click here to join
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex-grow space-y-8">
          {/* Welcome Section */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {userData?.firstName || 'Student'}</h1>
              <p className="mt-1 text-sm text-gray-500">Select a semester to view your subjects and learning materials.</p>
            </div>
            <button onClick={() => setShowHistory(true)} className="relative p-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition group shrink-0">
              <span className="text-xl">🔔</span>
              {allNotifications.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
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
                      onClick={(e) => handleSemesterClick(s, e)} 
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
                  <button key={idx} onClick={() => setActiveMentorIdx(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${activeMentorIdx === idx ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`} />
                ))}
              </div>
            </div>

            <div className="relative min-h-[220px] sm:min-h-[140px] flex items-center justify-center">
              {MENTORS.map((mentor, index) => {
                const isActive = index === activeMentorIdx
                return (
                  <div key={mentor.name} className={`absolute w-full flex flex-col sm:flex-row items-center gap-6 transition-all duration-700 ease-in-out transform ${isActive ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' : 'opacity-0 scale-95 translate-x-4 pointer-events-none'}`}>
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl rotate-6 opacity-15 animate-pulse"></div>
                      <img src={mentor.image} alt={mentor.name} className="h-full w-full object-cover rounded-2xl border border-slate-100 shadow-sm relative z-10" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 justify-center sm:justify-start">
                        <h4 className="text-xl font-bold text-slate-900">{mentor.name}</h4>
                        {mentor.nickname && <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/80 text-slate-600 rounded-full w-max mx-auto sm:mx-0 border border-slate-200/50">"{mentor.nickname}"</span>}
                      </div>
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">{mentor.role}</p>
                      <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-xs font-medium text-slate-500">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/40 font-bold">Batch: {mentor.batch}</span>
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
              <textarea rows="3" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write your suggestions or feedback here mchn..." className="w-full text-sm p-3 bg-white/80 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition outline-none resize-none placeholder-gray-400 shadow-inner" maxLength={500} />
              <div className="flex justify-end">
                <button type="submit" disabled={submittingComment || !commentText.trim()} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50">
                  {submittingComment ? 'Submitting...' : 'Submit Feedback '}
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
              <span className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">FCBS DIGI KUPPIYA</span>
            </div>
            <div className="text-center md:text-right space-y-0.5">
              <p className="text-xs font-medium text-gray-400 tracking-wide">&copy; {new Date().getFullYear()} FCBS DIGI KUPPIYA. All rights reserved.</p>
              <p className="text-[11px] text-gray-400 font-medium">Developed by <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition cursor-default">Mr.Thanush</span></p>
            </div>
          </div>
        </footer>
      </div>

      {/* 🤖 GROQ POWERED AI CHATBOT UI - (Moved Outside of Main Div for Perfect Fixed Position) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        {/* Chat Window */}
        {isChatOpen && (
          <div className="mb-4 w-80 sm:w-96 h-[400px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-gray-200 flex flex-col overflow-hidden animate-scale-in origin-bottom-right pointer-events-auto">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="font-bold text-sm">DIGI KUPPIYA AI Assistant</h3>
                  <p className="text-[10px] text-orange-100">Developed by Mr.Thanush</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-orange-100 hover:text-white transition text-lg">✕</button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 text-gray-400 text-xs p-3 rounded-2xl rounded-bl-sm flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Area */}
            <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder="Ask DIGI KUPPIYA AI anything..." 
                className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                disabled={isChatLoading}
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-orange-600 text-white p-2.5 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="h-14 w-14 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-white/20 pointer-events-auto"
        >
          {isChatOpen ? (
            <svg xmlns="http://www.w3.org/2000/xl" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.84 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}