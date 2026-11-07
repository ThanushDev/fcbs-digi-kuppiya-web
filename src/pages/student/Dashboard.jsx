import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom' 
import { useAuth } from '../../contexts/AuthContext'
import { useAds } from '../../contexts/AdsContext'
import { getSemesters, getBatchPermission, addComment, getMentorsByDepartment, getTimetableSlots } from '../../services/firestore' 
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import {
  BookOpen, BookMarked, GraduationCap, ClipboardList, BarChart3, Calendar,
  QrCode, Bot, FileText, FileDown, Bell, X, ExternalLink, Send, ChevronRight,
  DollarSign, Target, Users, MessageSquare, Sparkles, Lightbulb, Quote,
  Upload, Download, ZoomIn, CheckCircle, AlertCircle, Info, HelpCircle,
  ArrowUpRight, Volume2, VolumeX, Video, ShieldCheck, Sun, Moon, ChevronLeft
} from 'lucide-react'
import logo from '../../assets/logo.png'
import LiveNowCard from '../../components/timetable/LiveNowCard'
import WeeklyTimetable from '../../components/timetable/WeeklyTimetable'

const semesterIcons = [BookOpen, BookMarked, GraduationCap, ClipboardList, BarChart3, Calendar, BookOpen, BookMarked]
const SEMESTER_TONES = ['indigo', 'emerald', 'rose', 'amber', 'violet', 'sky', 'teal', 'slate']

// ---- Theme tokens (light / dark). Applied via <html data-dk="light|dark"> ----
const TONES = {
  blue: ['#EFF6FF', '#2563EB', 'rgba(59,130,246,.16)', '#93C5FD'],
  emerald: ['#ECFDF5', '#059669', 'rgba(16,185,129,.16)', '#6EE7B7'],
  violet: ['#F5F3FF', '#7C3AED', 'rgba(139,92,246,.16)', '#C4B5FD'],
  amber: ['#FFFBEB', '#D97706', 'rgba(245,158,11,.16)', '#FCD34D'],
  rose: ['#FFF1F2', '#E11D48', 'rgba(244,63,94,.16)', '#FDA4AF'],
  slate: ['#F1F5F9', '#475569', 'rgba(148,163,184,.16)', '#CBD5E1'],
  fuchsia: ['#FDF4FF', '#C026D3', 'rgba(217,70,239,.16)', '#F0ABFC'],
  indigo: ['#EEF2FF', '#4F46E5', 'rgba(99,102,241,.18)', '#A5B4FC'],
  teal: ['#F0FDFA', '#0D9488', 'rgba(20,184,166,.16)', '#5EEAD4'],
  sky: ['#F0F9FF', '#0284C7', 'rgba(14,165,233,.16)', '#7DD3FC'],
}

const DK_CSS = `
:root{--dk-bg:#F4F6FB;--dk-surface:#FFFFFF;--dk-surface2:#F8FAFC;--dk-border:#E4E8F0;--dk-border2:#CBD5E1;--dk-text:#0F172A;--dk-text2:#475569;--dk-muted:#94A3B8;--dk-brand:#4F46E5;--dk-brand-hover:#4338CA;--dk-brand-soft:#EEF2FF;--dk-brand-text:#4338CA;--dk-shadow:0 1px 2px rgba(15,23,42,.05);--dk-shadow-lg:0 10px 28px -10px rgba(15,23,42,.18);--dk-chat-head:#0F172A}
:root[data-dk="dark"]{--dk-bg:#0B1020;--dk-surface:#121829;--dk-surface2:#182036;--dk-border:#25304A;--dk-border2:#34405C;--dk-text:#E8ECF6;--dk-text2:#A5B0C8;--dk-muted:#6B7794;--dk-brand:#6366F1;--dk-brand-hover:#5558E8;--dk-brand-soft:rgba(99,102,241,.18);--dk-brand-text:#A5B4FC;--dk-shadow:0 1px 2px rgba(0,0,0,.35);--dk-shadow-lg:0 12px 30px -10px rgba(0,0,0,.6);--dk-chat-head:#182036}
.dk-page{background:var(--dk-bg);transition:background-color .3s}
.dk-card{background:var(--dk-surface);border:1px solid var(--dk-border);box-shadow:var(--dk-shadow)}
.dk-card-i{transition:border-color .2s,box-shadow .2s,transform .2s}
.dk-card-i:hover{border-color:color-mix(in srgb,var(--tone-fg,var(--dk-brand)) 40%,var(--dk-border));box-shadow:var(--dk-shadow-lg)}
.dk-card-i:active{transform:scale(.985)}
.dk-tile{background:var(--tone-bg,var(--dk-brand-soft));color:var(--tone-fg,var(--dk-brand-text))}
.dk-sub{background:var(--dk-surface2);border:1px solid var(--dk-border)}
.dk-text{color:var(--dk-text)}.dk-text2{color:var(--dk-text2)}.dk-muted{color:var(--dk-muted)}.dk-brandtext{color:var(--dk-brand-text)}
.dk-brandsoft{background:var(--dk-brand-soft);color:var(--dk-brand-text)}
.dk-divider{border-color:var(--dk-border)}
.dk-imgborder{border:1px solid var(--dk-border)}
.dk-input{background:var(--dk-surface2);border:1px solid var(--dk-border);color:var(--dk-text);transition:border-color .2s,box-shadow .2s}
.dk-input::placeholder{color:var(--dk-muted)}
.dk-input:focus{outline:none;border-color:var(--dk-brand);background:var(--dk-surface);box-shadow:0 0 0 3px color-mix(in srgb,var(--dk-brand) 25%,transparent)}
.dk-btn{background:var(--dk-brand);color:#fff;transition:background-color .2s}
.dk-btn:hover:not(:disabled){background:var(--dk-brand-hover)}
.dk-icon-btn{background:var(--dk-surface);border:1px solid var(--dk-border);color:var(--dk-text2);box-shadow:var(--dk-shadow);transition:background-color .2s,color .2s}
.dk-icon-btn:hover{background:var(--dk-surface2);color:var(--dk-text)}
.dk-ghost:hover{background:var(--dk-surface2);color:var(--dk-text)}
.dk-knob{background:var(--dk-brand-soft);box-shadow:var(--dk-shadow)}
.dk-dot{background:var(--dk-border2)}
.dk-chat-head{background:var(--dk-chat-head);color:#fff}
.dk-focus:focus-visible{outline:2px solid var(--dk-brand);outline-offset:2px}
.dk-skel{background:linear-gradient(90deg,var(--dk-surface2),var(--dk-border),var(--dk-surface2));background-size:200% 100%;animation:dk-shimmer 1.4s linear infinite}
@keyframes dk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
:root[data-dk="dark"] .dk-adapt{filter:invert(.92) hue-rotate(180deg)}
@media (prefers-reduced-motion:reduce){.dk-card-i,.dk-skel,.dk-page{transition:none;animation:none}}
${Object.entries(TONES).map(([k, [lb, lf, db, df]]) =>
  `.dk-tone-${k}{--tone-bg:${lb};--tone-fg:${lf}}:root[data-dk="dark"] .dk-tone-${k}{--tone-bg:${db};--tone-fg:${df}}`
).join('\n')}
`

const QUICK_PROMPTS = ['Explain a concept simply', 'Plan my study week', 'Tips for exam revision']

const normalizeSemName = (name) => {
  let norm = String(name || '').toUpperCase();
  norm = norm.replace(/YEAR\s*IV/g, 'Y4').replace(/YEAR\s*4/g, 'Y4')
             .replace(/YEAR\s*III/g, 'Y3').replace(/YEAR\s*3/g, 'Y3')
             .replace(/YEAR\s*II/g, 'Y2').replace(/YEAR\s*2/g, 'Y2')
             .replace(/YEAR\s*I/g, 'Y1').replace(/YEAR\s*1/g, 'Y1')
             .replace(/SEMESTER\s*II/g, 'S2').replace(/SEMESTER\s*2/g, 'S2').replace(/SEM\s*II/g, 'S2').replace(/SEM\s*2/g, 'S2')
             .replace(/SEMESTER\s*I/g, 'S1').replace(/SEMESTER\s*1/g, 'S1').replace(/SEM\s*I/g, 'S1').replace(/SEM\s*1/g, 'S1');
  return norm.replace(/\s+/g, '');
}

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

const toolIconMap = {
  'quiz': ClipboardList, 'attendance': BarChart3, 'gpa': Target, 'ca': BookOpen,
  'finance': DollarSign, 'qr': QrCode, 'ai': Bot, 'cv': FileText, 'pdf': FileDown,
  'documents': FileText
}

const academicTools = [
  { name: 'Quiz System', path: '../qindex.php', iconKey: 'quiz', isExternal: true, isQuiz: true, tone: 'blue' },
  { name: 'Attendance Calc', path: '/dashboard/attendance', iconKey: 'attendance', isInternalTool: true, tone: 'emerald' },
  { name: 'GPA Calculator', path: '/dashboard/gpa', iconKey: 'gpa', isInternalTool: true, tone: 'violet' },
  { name: 'CA Calculator', path: '/dashboard/ca', iconKey: 'ca', isInternalTool: true, tone: 'amber' },
  { name: 'Finance Tracker', path: '/dashboard/finance', iconKey: 'finance', isInternalTool: true, tone: 'rose' },
  { name: 'QR Generator', path: '/dashboard/tools/qr', iconKey: 'qr', isInternalTool: true, tone: 'slate' },
  { name: 'AI Humanizer', path: '/dashboard/tools/ai-humanizer', iconKey: 'ai', isInternalTool: true, tone: 'fuchsia' },
  { name: 'CV Maker', path: 'https://digi-solutions-cv.vercel.app/', iconKey: 'cv', isExternal: true, tone: 'indigo' },
  { name: 'PDF Generator', path: '/dashboard/tools/pdf-tool', iconKey: 'pdf', isInternalTool: true, tone: 'teal' },
  { name: 'Important Documents', path: '/dashboard/documents', iconKey: 'documents', isInternalTool: true, tone: 'sky' },
]

export default function Dashboard() {
  const { userData } = useAuth()
  const { currentAd, showAdPopup, tryShowAd, dismissAd, handleAdClick, loading: adsLoading } = useAds()
  const navigate = useNavigate()
  const [semesters, setSemesters] = useState([])
  const [mentors, setMentors] = useState([])
  const [mentorsLoading, setMentorsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeMentorIdx, setActiveMentorIdx] = useState(0)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [timetableSlots, setTimetableSlots] = useState([])
  
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [allNotifications, setAllNotifications] = useState([])
  const [activePopup, setActivePopup] = useState(null)
  const [showHistory, setShowHistory] = useState(false)


  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: 'Hi! I am the DIGI KUPPIYA AI Assistant. How can I help you with your studies today?' }])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  const adTriggeredRef = useRef(false)

  const [isAdLoaded, setIsAdLoaded] = useState(false)
  const [countdown, setCountdown] = useState(7)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef(null)

  // Theme (light / dark) - applied on <html> so portals and modals inherit it
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('dk-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch (e) { /* ignore */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const isDark = theme === 'dark'
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  useLayoutEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-dk', theme)
    root.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem('dk-theme', theme) } catch (e) { /* ignore */ }
    return () => {
      root.removeAttribute('data-dk')
      root.classList.remove('dark')
    }
  }, [theme])

  // Esc closes popups, drawer and chat
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setSelectedMentor(null)
      setActivePopup(null)
      setShowHistory(false)
      setIsChatOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const userDept = (userData?.department || '').toLowerCase()
  
  // Filter mentors based on department visibility:
  // - Owner (isOwner: true) visible to ALL departments
  // - Regular mentors visible only to their department
  const displayMentors = mentors.filter(m => 
    m.isOwner || m.department === 'both' || m.department === userDept
  )

  // Fetch mentors from Firestore
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setMentorsLoading(true)
        const data = await getMentorsByDepartment(userDept)
        if (data.length > 0) {
          setMentors(data)
        }
      } catch (error) {
        console.error('Error fetching mentors:', error)
        // Keep fallback mentors on error
      } finally {
        setMentorsLoading(false)
      }
    }
    
    if (userDept) {
      fetchMentors()
    }
  }, [userDept])

  // Prevent background scrolling when mentor modal is open
  useEffect(() => {
    if (selectedMentor) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedMentor])

  useEffect(() => {
    if (showAdPopup && currentAd) {
      setCountdown(currentAd.countdownDuration || 7)
      setIsAdLoaded(false)
    }
  }, [showAdPopup, currentAd])

  useEffect(() => {
    let safetyTimer;
    if (showAdPopup && currentAd && currentAd.mediaUrl) {
      safetyTimer = setTimeout(() => {
        setIsAdLoaded(true);
      }, 1500); 
    }
    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [showAdPopup, currentAd]);

  useEffect(() => {
    if (!showAdPopup || !isAdLoaded || countdown <= 0) return

    const timerInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [showAdPopup, isAdLoaded, countdown])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatOpen])

  useEffect(() => {
    if (displayMentors.length === 0) return;
    
    let intervalId
    const advanceSlider = () => {
      setActiveMentorIdx((prev) => {
        const nextIdx = (prev + 1) % displayMentors.length
        return nextIdx
      })
    }
    
    // Auto-transition every 7 seconds (7000ms)
    intervalId = setInterval(advanceSlider, 7000)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [displayMentors.length])

  useEffect(() => {
    const load = async () => {
      if (!userData) return;
      try {
        setLoading(true)
        const dept = (userData?.department || '').toLowerCase()
        const userBatch = userData?.batch ? String(userData.batch).trim() : ''

        const allSemesters = await getSemesters()
        
        let deptFiltered = allSemesters.filter((s) => {
          const sDept = (s.department || '').toLowerCase();
          return sDept === dept || sDept === 'both';
        });

        let finalFiltered = [];

        if (userBatch) {
          const perm = await getBatchPermission(userBatch)
          
          if (perm && perm.semesterIds && perm.semesterIds.length > 0) {
            const allowedIds = perm.semesterIds.map(String);
            
            let adminFiltered = deptFiltered.filter((s) => {
              const normalized = normalizeSemName(s.name);
              let docSemId = null;
              
              if (normalized.includes('Y1') && normalized.includes('S1')) docSemId = '11';
              else if (normalized.includes('Y1') && normalized.includes('S2')) docSemId = '12';
              else if (normalized.includes('Y2') && normalized.includes('S1')) docSemId = '21';
              else if (normalized.includes('Y2') && normalized.includes('S2')) docSemId = '22';
              else if (normalized.includes('Y3') && normalized.includes('S1')) docSemId = '31';
              else if (normalized.includes('Y3') && normalized.includes('S2')) docSemId = '32';
              else if (normalized.includes('Y4') && normalized.includes('S1')) docSemId = '41';
              else if (normalized.includes('Y4') && normalized.includes('S2')) docSemId = '42';
              
              return docSemId ? allowedIds.includes(docSemId) : allowedIds.includes(String(s.id));
            });

            const uniqueSemesters = [];
            const seen = new Set();
            for (const s of adminFiltered) {
              const normName = normalizeSemName(s.name);
              const identifier = normName || String(s.id);
              if (!seen.has(identifier)) {
                seen.add(identifier);
                uniqueSemesters.push(s);
              }
            }
            finalFiltered = uniqueSemesters;

          } else {
            finalFiltered = [];
          }
        }

        finalFiltered.sort((a, b) => {
          const getWeight = (name) => {
            const normalized = normalizeSemName(name);
            if (normalized.includes('Y1') && normalized.includes('S1')) return 11;
            if (normalized.includes('Y1') && normalized.includes('S2')) return 12;
            if (normalized.includes('Y2') && normalized.includes('S1')) return 21;
            if (normalized.includes('Y2') && normalized.includes('S2')) return 22;
            if (normalized.includes('Y3') && normalized.includes('S1')) return 31;
            if (normalized.includes('Y3') && normalized.includes('S2')) return 32;
            if (normalized.includes('Y4') && normalized.includes('S1')) return 41;
            if (normalized.includes('Y4') && normalized.includes('S2')) return 42;
            return 999; 
          };
          return getWeight(a.name) - getWeight(b.name);
        })
        
        setSemesters(finalFiltered)

        const notifSnap = await getDocs(query(collection(db, 'global_notifications'), orderBy('createdAt', 'desc')))
        const notifList = notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        const userNotifs = notifList.filter(n => {
          const matchBatch = n.targetBatch === 'all' || n.targetBatch === userBatch;
          const matchDept = !n.targetDepartment || n.targetDepartment === 'all' || n.targetDepartment === dept;
          return matchBatch && matchDept;
        })
        
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

  // Fetch timetable slots for live card and weekly timetable
  useEffect(() => {
    const loadTimetable = async () => {
      if (!userData) return
      try {
        const dept = (userData?.department || '').toLowerCase()
        const batch = userData?.batch ? String(userData.batch).trim() : ''
        
        if (dept && batch) {
          const allSlots = await getTimetableSlots({ department: dept, batchYear: batch })
          setTimetableSlots(allSlots)
        } else {
          setTimetableSlots([])
        }
      } catch (error) {
        console.error('Error loading timetable:', error)
        setTimetableSlots([])
      }
    }
    loadTimetable()
  }, [userData?.department, userData?.batch])

  useEffect(() => {
    if (!loading && !adsLoading && !adTriggeredRef.current) {
      adTriggeredRef.current = true
      const timer = setTimeout(() => tryShowAd(), 800)
      return () => clearTimeout(timer)
    }
  }, [loading, adsLoading, tryShowAd])

  const handleSemesterClick = (s) => {
    navigate(`/dashboard/subjects/${s.id}`)
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
        role: userData?.role || 'student',
        userPhotoURL: userData?.photoURL || ''
      })
      setCommentText('') 
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

  // Mentor slider rendering logic
  const renderMentorSlider = () => {
    if (mentorsLoading) {
      // Skeleton Loader
      return (
        <div className="relative min-h-[260px] sm:min-h-[180px] flex items-center justify-center">
          <div className="absolute w-full flex flex-col sm:flex-row items-center gap-6">
            <div className="relative h-32 w-32 sm:h-40 sm:w-40 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl rotate-6 opacity-15"></div>
              <div className="relative z-10 h-full w-full rounded-2xl dk-imgborder dk-skel" />
            </div>
            <div className="flex-1 w-full space-y-3 flex flex-col items-center sm:items-start">
              <div className="h-6 w-48 dk-skel rounded-md" />
              <div className="h-3 w-32 dk-skel rounded-md" />
              <div className="h-6 w-24 dk-skel rounded-lg" />
            </div>
          </div>
        </div>
      )
    }

    if (displayMentors.length === 0) {
      // Empty State
      return (
        <div className="relative min-h-[260px] sm:min-h-[180px] flex items-center justify-center">
          <div className="text-center py-10 px-6">
            <span className="dk-sub dk-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <h4 className="text-sm font-semibold dk-text">No mentors available yet</h4>
            <p className="mt-1 text-sm dk-text2">Mentors for your department will show up here.</p>
          </div>
        </div>
      )
    }

    // Mentor Cards
    return (
      <div className="relative min-h-[260px] sm:min-h-[180px] flex items-center justify-center">
        {displayMentors.map((mentor, index) => {
          const isActive = index === activeMentorIdx
          return (
            <div key={mentor.name} className={`absolute w-full flex flex-col sm:flex-row items-center gap-6 transition-all duration-700 ease-in-out transform ${isActive ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' : 'opacity-0 scale-95 translate-x-4 pointer-events-none'}`}>

              <div
                onClick={() => setSelectedMentor(mentor)}
                className="relative h-32 w-32 sm:h-40 sm:w-40 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl rotate-6 opacity-15 animate-pulse"></div>
                <img src={mentor.imageUrl || mentor.image || '/default-avatar.png'} alt={mentor.name} className="h-full w-full object-cover rounded-2xl dk-imgborder shadow-sm relative z-10" />
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 justify-center sm:justify-start">
                  <h4 className="text-xl font-semibold tracking-tight dk-text">{mentor.name}</h4>
                  {mentor.nickname && (
                    <span className="dk-sub dk-text2 inline-flex items-center gap-1 w-max mx-auto sm:mx-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                      <Quote className="w-2.5 h-2.5" />{mentor.nickname}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium dk-brandtext">{mentor.role}</p>
                <div className="mt-3 flex items-center justify-center sm:justify-start">
                  <span className="dk-brandsoft inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium">
                    <Users className="w-3.5 h-3.5" /> Batch {mentor.batch}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <style>{DK_CSS}</style>
      {/* IMMERSIVE AD POPUP OVERLAY */}
      {showAdPopup && currentAd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-fade-in select-none">
          <div className="relative w-full h-full max-w-4xl max-h-[85vh] flex items-center justify-center bg-black md:rounded-2xl md:overflow-hidden p-1">
            
            {/* Ad Content Canvas */}
            <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => handleAdClick(currentAd)}>
              {currentAd.adType === 'video' ? (
                <video
                  ref={videoRef}
                  src={currentAd.mediaUrl}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onCanPlay={() => setIsAdLoaded(true)}
                  onError={() => setIsAdLoaded(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={currentAd.mediaUrl}
                  alt="Sponsored Content"
                  onLoad={() => setIsAdLoaded(true)}
                  onError={() => setIsAdLoaded(true)}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Asset Loading State Indicator */}
            {!isAdLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black space-y-3 z-10">
                <div className="w-9 h-9 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-400 tracking-wide">Loading sponsored content...</p>
              </div>
            )}

            {/* FLOATING INTERACTION OVERLAYS */}
            {isAdLoaded && (
              <>
                {/* Floating Top-Right Controls */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  {countdown > 0 ? (
                    // Circular Countdown Badge
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                      <span className="text-xs font-black text-white">{countdown}s</span>
                    </div>
                  ) : (
                    // Finished Overlay Buttons
                    <div className="flex items-center gap-2 animate-scale-in">
                      <button
                        onClick={() => handleAdClick(currentAd)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition"
                      >
                        Continue <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={dismissAd}
                        className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-xl transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom-Left Visit Advertiser Link */}
                <div 
                  onClick={() => handleAdClick(currentAd)}
                  className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-300 bg-black/40 border border-white/10 hover:border-white/20 backdrop-blur-md rounded-xl cursor-pointer transition hover:text-white"
                >
                  <ExternalLink className="w-3 h-3" /> Visit Sponsor
                </div>

                {/* Bottom-Right Media Mute Control (Videos Only) */}
                {currentAd.adType === 'video' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMuted(!isMuted)
                    }}
                    className="absolute bottom-4 right-4 p-2 text-slate-300 hover:text-white bg-black/40 border border-white/10 backdrop-blur-md rounded-xl transition z-20"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* CORE DASHBOARD CONTENT VIEW PORT */}
      <div className="dk-page animate-fade-in space-y-8 flex flex-col min-h-screen p-3 sm:p-6 relative rounded-2xl">

        {activePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div role="dialog" aria-modal="true" className="dk-card relative w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
              <button onClick={() => setActivePopup(null)} aria-label="Close" className="dk-ghost dk-muted absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="dk-brandsoft w-9 h-9 rounded-xl flex items-center justify-center">
                  {activePopup.type === 'zoom' ? <Video className="w-4 h-4" /> : activePopup.type === 'resource' ? <FileDown className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </div>
                <span className="dk-brandsoft text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">{activePopup.type}</span>
              </div>
              <h3 className="text-lg font-semibold dk-text leading-snug mb-2 pr-6">{activePopup.title}</h3>
              <p className="text-sm dk-text2 leading-relaxed mb-5 whitespace-pre-wrap">{activePopup.message}</p>
              {activePopup.type === 'zoom' && activePopup.zoomLink && (
                <a href={activePopup.zoomLink} target="_blank" rel="noopener noreferrer" className="dk-btn flex items-center justify-center gap-2 w-full py-2.5 font-medium text-sm rounded-xl shadow-sm">
                  <ExternalLink className="w-4 h-4" /> Join Zoom meeting
                </a>
              )}
              <p className="text-xs dk-muted mt-4 text-right">Published {new Date(activePopup.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="dk-card fixed inset-y-0 right-0 z-50 w-full max-w-sm shadow-2xl flex flex-col animate-slide-in !rounded-none">
            <div className="dk-divider flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-base font-semibold dk-text flex items-center gap-2">
                <Bell className="w-4 h-4 dk-muted" /> Notifications
              </h3>
              <button onClick={() => setShowHistory(false)} aria-label="Close notifications" className="dk-ghost dk-muted flex h-8 w-8 items-center justify-center rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 flex-grow overflow-y-auto p-6">
              {allNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <span className="dk-sub dk-muted mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl"><Bell className="w-5 h-5" /></span>
                  <p className="text-sm dk-text2">You're all caught up. No notifications yet.</p>
                </div>
              ) : (
                allNotifications.map((n) => (
                  <div key={n.id} className="dk-sub p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="dk-brandsoft text-xs font-medium capitalize px-2 py-0.5 rounded-md">{n.type}</span>
                      <span className="text-xs dk-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-semibold dk-text">{n.title}</h4>
                    <p className="text-sm dk-text2 leading-relaxed">{n.message}</p>
                    {n.type === 'zoom' && n.zoomLink && (
                      <a href={n.zoomLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium dk-brandtext hover:underline">
                        <ExternalLink className="w-3 h-3" /> Join meeting
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mentor Detail Popup Modal with createPortal */}
        {selectedMentor && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedMentor(null)}>
            <div className="dk-card relative max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedMentor(null)} aria-label="Close" className="absolute top-4 right-4 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full p-2 transition-all">
                <X className="w-4 h-4" />
              </button>

              <div className="w-full aspect-[4/5] relative">
                <img src={selectedMentor.imageUrl || selectedMentor.image || '/default-avatar.png'} alt={selectedMentor.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 z-10">
                  <h3 className="text-2xl font-semibold tracking-tight text-white">{selectedMentor.name}</h3>
                  {selectedMentor.nickname && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full border border-white/30">
                      <Quote className="w-3 h-3" /> {selectedMentor.nickname}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="dk-sub rounded-xl p-4 flex items-center gap-3">
                  <div className="dk-brandsoft w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs dk-muted">Role / subject</p>
                    <p className="text-sm font-semibold dk-text">{selectedMentor.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="dk-sub rounded-xl p-4">
                    <p className="text-xs dk-muted mb-0.5">Batch</p>
                    <p className="text-sm font-semibold dk-text">{selectedMentor.batch}</p>
                  </div>
                  <div className="dk-sub rounded-xl p-4">
                    <p className="text-xs dk-muted mb-0.5">Department</p>
                    <p className="text-sm font-semibold dk-text capitalize">{selectedMentor.department}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        <div className="flex-grow space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-sm dk-muted">{todayLabel}</p>
              <h1 className="mt-1 text-2xl sm:text-[28px] font-semibold tracking-tight dk-text">{greeting}, {userData?.firstName || 'Student'}</h1>
              <p className="mt-1 text-sm dk-text2">Pick a semester to open your subjects and learning materials.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Light / dark switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
                onClick={toggleTheme}
                className="dk-icon-btn dk-focus relative grid grid-cols-2 items-center h-11 w-[88px] p-1 rounded-xl"
              >
                <span aria-hidden="true" className={`dk-knob absolute top-1 left-1 h-[34px] w-[39px] rounded-lg transition-transform duration-300 ease-out ${isDark ? 'translate-x-[39px]' : 'translate-x-0'}`} />
                <span className={`relative z-10 flex h-[34px] items-center justify-center transition-colors ${!isDark ? 'dk-brandtext' : 'dk-muted'}`}><Sun className="w-[18px] h-[18px]" /></span>
                <span className={`relative z-10 flex h-[34px] items-center justify-center transition-colors ${isDark ? 'dk-brandtext' : 'dk-muted'}`}><Moon className="w-[18px] h-[18px]" /></span>
              </button>

              <button
                onClick={() => setShowHistory(true)}
                aria-label="Open notifications"
                className="dk-icon-btn dk-focus relative flex h-11 w-11 items-center justify-center rounded-xl"
              >
                <Bell className="w-5 h-5" />
                {allNotifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2" style={{ '--tw-ring-color': 'var(--dk-bg)' }}>
                    {allNotifications.length > 9 ? '9+' : allNotifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Study tools */}
          <section>
            <h2 className="mb-3 text-sm font-semibold dk-text">Study tools</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {academicTools.map((tool) => {
                if (tool.isQuiz && !userData?.quizEnabled) return null
                const IconComp = toolIconMap[tool.iconKey]
                const sharedClass = `group dk-card dk-card-i dk-focus dk-tone-${tool.tone} flex items-center gap-3 p-3 rounded-xl`
                const inner = (
                  <>
                    <span className="dk-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      {IconComp && <IconComp className="w-[18px] h-[18px]" />}
                    </span>
                    <span className="text-[13px] font-medium leading-tight dk-text">{tool.name}</span>
                    {!tool.isInternalTool && <ArrowUpRight className="ml-auto w-3.5 h-3.5 shrink-0 dk-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                  </>
                )
                if (tool.isInternalTool) {
                  return (
                    <Link key={tool.name} to={tool.path} className={sharedClass}>
                      {inner}
                    </Link>
                  )
                }
                return (
                  <a key={tool.name} href={tool.path} target="_blank" rel="noopener noreferrer" className={sharedClass}>
                    {inner}
                  </a>
                )
              })}
            </div>
          </section>

          {/* Live Lecture Card */}
          <div className="dk-adapt empty:hidden"><LiveNowCard /></div>

          {/* Weekly Timetable */}
          <div className="dk-adapt empty:hidden"><WeeklyTimetable slots={timetableSlots} /></div>

          {/* Semesters */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold dk-text">Your semesters</h2>
              {!loading && semesters.length > 0 && <span className="text-xs dk-muted">{semesters.length} available</span>}
            </div>
            {loading ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-36 rounded-2xl dk-skel" />
                ))}
              </div>
            ) : semesters.length === 0 ? (
              <div className="dk-card flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border-dashed px-6 text-center">
                <span className="dk-sub dk-muted flex h-11 w-11 items-center justify-center rounded-xl"><BookOpen className="w-5 h-5" /></span>
                <p className="text-sm dk-text2">No semesters are available for your batch or department yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {semesters.map((s, i) => {
                  const tone = SEMESTER_TONES[i % SEMESTER_TONES.length];
                  const SemIcon = semesterIcons[i % semesterIcons.length];
                  return (
                    <Link
                      key={s.id}
                      to={`/dashboard/subjects/${s.id}`}
                      onClick={(e) => handleSemesterClick(s, e)}
                      className={`group dk-card dk-card-i dk-focus dk-tone-${tone} flex flex-col justify-between min-h-[148px] p-5 rounded-2xl hover:-translate-y-0.5`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="dk-tile flex h-11 w-11 items-center justify-center rounded-xl">
                          <SemIcon className="w-5 h-5" />
                        </span>
                        <ArrowUpRight className="w-4 h-4 dk-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                      <div className="mt-5">
                        <h3 className="text-base font-semibold dk-text">{formatSemesterName(s.name)}</h3>
                        <p className="mt-1 text-xs dk-text2 capitalize">{s.department || 'Both'} department</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Mentors */}
          <section className="dk-card rounded-2xl p-6 md:p-8 overflow-hidden">
            <div className="dk-divider mb-6 border-b pb-4 flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="dk-brandsoft flex h-9 w-9 items-center justify-center rounded-xl"><Users className="w-[18px] h-[18px]" /></span>
                <div>
                  <h3 className="text-sm font-semibold dk-text">Our mentors</h3>
                  <p className="text-xs dk-text2">Learn from experienced undergraduates</p>
                </div>
              </div>
              {!mentorsLoading && displayMentors.length > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveMentorIdx((p) => (p - 1 + displayMentors.length) % displayMentors.length)} aria-label="Previous mentor" className="dk-icon-btn dk-focus hidden sm:flex h-8 w-8 items-center justify-center rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-1.5">
                    {displayMentors.map((_, idx) => (
                      <button key={idx} onClick={() => setActiveMentorIdx(idx)} aria-label={`Show mentor ${idx + 1}`} className={`h-1.5 rounded-full transition-all duration-300 ${activeMentorIdx === idx ? 'w-5 bg-indigo-500' : 'w-1.5 dk-dot'}`} />
                    ))}
                  </div>
                  <button onClick={() => setActiveMentorIdx((p) => (p + 1) % displayMentors.length)} aria-label="Next mentor" className="dk-icon-btn dk-focus hidden sm:flex h-8 w-8 items-center justify-center rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {renderMentorSlider()}
          </section>

          {/* Feedback */}
          <section className="dk-card rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="dk-brandsoft flex h-9 w-9 items-center justify-center rounded-xl"><MessageSquare className="w-[18px] h-[18px]" /></span>
              <div>
                <h3 className="text-sm font-semibold dk-text">Send feedback</h3>
                <p className="text-xs dk-text2">Share a suggestion or report an issue. It goes straight to the admin.</p>
              </div>
            </div>
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <textarea rows="3" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write your suggestion or feedback here..." className="dk-input w-full text-sm p-3.5 rounded-xl resize-none" maxLength={500} />
              <div className="flex items-center justify-between">
                <span className="text-xs dk-muted">{commentText.length}/500</span>
                <button type="submit" disabled={submittingComment || !commentText.trim()} className="dk-btn dk-focus inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {submittingComment ? 'Sending...' : 'Send feedback'} <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </section>
        </div>

        <footer className="dk-divider mt-auto pt-6 pb-4 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Uniflow Logo" className="h-7 w-auto opacity-90 object-contain" />
              <span className="text-sm font-semibold tracking-tight dk-text">FCBS DIGI KUPPIYA</span>
              <span className="h-4 w-px dk-dot" />
              <Link to="/privacy" className="flex items-center gap-1 text-xs dk-text2 hover:underline transition-colors">
                <ShieldCheck className="w-3.5 h-3.5" />
                Privacy Policy
              </Link>
            </div>
            <div className="text-center md:text-right space-y-0.5">
              <p className="text-xs dk-text2">&copy; {new Date().getFullYear()} FCBS DIGI KUPPIYA. All rights reserved.</p>
              <p className="text-xs dk-muted">Developed by <span className="font-medium dk-text2">Mr.Thanush</span></p>
            </div>
          </div>
        </footer>
      </div>

      {/* AI chat widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        {isChatOpen && (
          <div className="dk-card mb-4 w-80 sm:w-96 h-[440px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in origin-bottom-right pointer-events-auto">
            <div className="dk-chat-head px-4 py-3.5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500"><Bot className="w-5 h-5" /></span>
                <div>
                  <h3 className="font-semibold text-sm leading-tight">DIGI KUPPIYA AI Assistant</h3>
                  <p className="text-xs text-slate-400">Developed by Mr.Thanush</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} aria-label="Close chat" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ background: 'var(--dk-bg)' }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'dk-btn rounded-br-md' : 'dk-card dk-text rounded-bl-md'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatMessages.length === 1 && !isChatLoading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_PROMPTS.map((p) => (
                    <button key={p} type="button" onClick={() => setChatInput(p)} className="dk-sub dk-text2 dk-ghost rounded-full px-3 py-1.5 text-xs font-medium transition">
                      {p}
                    </button>
                  ))}
                </div>
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="dk-card dk-muted text-sm px-3.5 py-2 rounded-2xl rounded-bl-md flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="dk-divider p-3 border-t flex gap-2" style={{ background: 'var(--dk-surface)' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask DIGI KUPPIYA AI anything..."
                className="dk-input flex-1 text-sm rounded-xl px-4 py-2"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!chatInput.trim() || isChatLoading}
                className="dk-btn p-2.5 rounded-xl disabled:opacity-50 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label={isChatOpen ? 'Close chat' : 'Open AI assistant'}
          className="dk-btn dk-focus h-14 w-14 rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:scale-105 transition-transform duration-300 pointer-events-auto"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
        </button>
      </div>
    </>
  )
}