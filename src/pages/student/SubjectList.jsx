import { useState, useEffect, useLayoutEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getSubjects, getSemesters, getChapters } from '../../services/firestore'
import { ArrowLeft, BookOpen, Stars, ChevronRight, Layers, AlertCircle, Sun, Moon } from 'lucide-react'

// ---- Light / dark theme (same storage key + <html data-dk> attribute as the Dashboard, so the choice carries across pages) ----

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
.dk-btn{background:var(--dk-brand);color:#fff;transition:background-color .2s}
.dk-btn:hover:not(:disabled){background:var(--dk-brand-hover)}
.dk-icon-btn{background:var(--dk-surface);border:1px solid var(--dk-border);color:var(--dk-text2);box-shadow:var(--dk-shadow);transition:background-color .2s,color .2s}
.dk-icon-btn:hover{background:var(--dk-surface2);color:var(--dk-text)}
.dk-ghost:hover{background:var(--dk-surface2);color:var(--dk-text)}
.dk-knob{background:var(--dk-brand-soft);box-shadow:var(--dk-shadow)}
.dk-dot{background:var(--dk-border2)}
.dk-focus:focus-visible{outline:2px solid var(--dk-brand);outline-offset:2px}
.dk-skel{background:linear-gradient(90deg,var(--dk-surface2),var(--dk-border),var(--dk-surface2));background-size:200% 100%;animation:dk-shimmer 1.4s linear infinite}
@keyframes dk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.dk-card-i,.dk-skel,.dk-page{transition:none;animation:none}}
${Object.entries(TONES).map(([k, [lb, lf, db, df]]) =>
  `.dk-tone-${k}{--tone-bg:${lb};--tone-fg:${lf}}:root[data-dk="dark"] .dk-tone-${k}{--tone-bg:${db};--tone-fg:${df}}`
).join('\n')}
`

function DkStyle() {
  return <style>{DK_CSS}</style>
}

function useDkTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('dk-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch (e) { /* ignore */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

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

  return { theme, isDark: theme === 'dark', toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={onToggle}
      className="dk-icon-btn dk-focus relative grid grid-cols-2 items-center h-11 w-[88px] p-1 rounded-xl shrink-0"
    >
      <span aria-hidden="true" className={`dk-knob absolute top-1 left-1 h-[34px] w-[39px] rounded-lg transition-transform duration-300 ease-out ${isDark ? 'translate-x-[39px]' : 'translate-x-0'}`} />
      <span className={`relative z-10 flex h-[34px] items-center justify-center transition-colors ${!isDark ? 'dk-brandtext' : 'dk-muted'}`}><Sun className="w-[18px] h-[18px]" /></span>
      <span className={`relative z-10 flex h-[34px] items-center justify-center transition-colors ${isDark ? 'dk-brandtext' : 'dk-muted'}`}><Moon className="w-[18px] h-[18px]" /></span>
    </button>
  )
}

const SUBJECT_TONES = ['indigo', 'emerald', 'violet', 'sky', 'rose', 'teal', 'amber', 'blue']

export default function SubjectList() {
  const { semesterId } = useParams()
  const [searchParams] = useSearchParams()
  
  const [semester, setSemester] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [chapterCounts, setChapterCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const { isDark, toggleTheme } = useDkTheme()

  const currentSpec = searchParams.get('spec') || 'all'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const allSemesters = await getSemesters()
      const sem = allSemesters.find((s) => s.id === semesterId)
      setSemester(sem || null)

      const subs = await getSubjects(semesterId)
      
      const isBMS = sem?.department === 'bms'
      const isLCS = sem?.department === 'lcs'
      const isBMSYear3or4 = isBMS && (sem?.name?.includes('Y3') || sem?.name?.includes('Y4'))
      const isLCSYear2Plus = isLCS && (sem?.name?.includes('Y2') || sem?.name?.includes('Y3') || sem?.name?.includes('Y4'))
      
      let filteredSubs = subs;
      if (isBMSYear3or4 || isLCSYear2Plus) {
        filteredSubs = subs.filter(sub => {
          return !sub.specialization || sub.specialization === 'all' || sub.specialization === currentSpec
        })
      }
      
      setSubjects(filteredSubs)

      const counts = {}
      for (const sub of filteredSubs) {
        const chs = await getChapters(sub.id)
        counts[sub.id] = chs.length
      }
      setChapterCounts(counts)
      setLoading(false)
    }
    load()
  }, [semesterId, currentSpec])

  if (loading) {
    return (
      <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
        <DkStyle />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-40 rounded-md dk-skel" />
            <div className="h-8 w-64 rounded-lg dk-skel" />
            <div className="h-3 w-32 rounded-md dk-skel" />
          </div>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl dk-skel" />)}
        </div>
      </div>
    )
  }

  if (!semester) {
    return (
      <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
        <DkStyle />
        <div className="flex justify-end">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
        <div className="dk-card mx-auto mt-12 max-w-md rounded-2xl p-8 text-center">
          <span className="dk-sub dk-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"><AlertCircle className="w-6 h-6" /></span>
          <h2 className="text-base font-semibold dk-text">Semester not found</h2>
          <p className="mt-1 text-sm dk-text2">It may have been removed, or it isn't available for your account.</p>
          <Link to="/dashboard" className="dk-btn dk-focus mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to semesters
          </Link>
        </div>
      </div>
    )
  }

  const getSpecBadgeLabel = (spec, dept) => {
    if (dept === 'lcs') {
      const labels = {
        communication: 'Communication',
        languages: 'Languages',
        all: 'General'
      }
      return labels[spec] || 'General'
    }
    const labels = {
      accounting: 'Accounting Specialization',
      marketing: 'Marketing Specialization',
      hrm: 'HRM Specialization',
      management: 'Management Specialization',
      info_management: 'Information Management Specialization',
      all: 'General Degree'
    }
    return labels[spec] || 'General'
  }

  const totalChapters = Object.values(chapterCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
      <DkStyle />

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Link to="/dashboard" className="dk-focus dk-brandtext group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Semesters
          </Link>
          <h1 className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight dk-text">
            {semester.name.replace(/Y1/g, 'Year I ').replace(/Y2/g, 'Year II ').replace(/Y3/g, 'Year III ').replace(/Y4/g, 'Year IV ').replace(/S1/g, 'Semester I').replace(/S2/g, 'Semester II')}
          </h1>
          <p className="mt-1 text-sm dk-text2 capitalize">{semester.department} Department</p>
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>

      {/* Summary chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {semester.department === 'bms' && (semester.name?.includes('Y3') || semester.name?.includes('Y4')) && (
          <span className="dk-tone-indigo dk-tile inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg w-max">
            <Stars className="w-3.5 h-3.5" /> {getSpecBadgeLabel(currentSpec, 'bms')}
          </span>
        )}

        {semester.department === 'lcs' && (semester.name?.includes('Y2') || semester.name?.includes('Y3') || semester.name?.includes('Y4')) && (
          <span className="dk-tone-emerald dk-tile inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg w-max">
            <Stars className="w-3.5 h-3.5" /> {getSpecBadgeLabel(currentSpec, 'lcs')}
          </span>
        )}

        <span className="dk-sub dk-text2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg">
          <Layers className="w-3.5 h-3.5" /> {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}
        </span>
        <span className="dk-sub dk-text2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg">
          <BookOpen className="w-3.5 h-3.5" /> {totalChapters} {totalChapters === 1 ? 'chapter' : 'chapters'}
        </span>
      </div>

      {subjects.length === 0 ? (
        <div className="dk-card flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border-dashed px-6 text-center">
          <span className="dk-sub dk-muted flex h-11 w-11 items-center justify-center rounded-xl"><BookOpen className="w-5 h-5" /></span>
          <p className="text-sm dk-text2">No subjects available for this stream yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub, i) => {
            const tone = SUBJECT_TONES[i % SUBJECT_TONES.length]
            return (
              <Link key={sub.id} to={`/dashboard/subjects/${semesterId}/subject/${sub.id}?spec=${currentSpec}`}
                className={`group dk-card dk-card-i dk-focus dk-tone-${tone} flex flex-col justify-between min-h-[168px] p-5 rounded-2xl`}>
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="dk-tile inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide">{sub.code || '\u2014'}</span>
                    <span className="inline-flex items-center gap-1 text-xs dk-muted">
                      <BookOpen className="w-3.5 h-3.5" /> {chapterCounts[sub.id] || 0} chapters
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold leading-snug dk-text">{sub.name}</h3>
                  {sub.description && <p className="mt-2 text-sm leading-relaxed dk-text2 line-clamp-2">{sub.description}</p>}
                </div>

                <div className="mt-5 flex items-center justify-between gap-2">
                  {sub.specialization && sub.specialization !== 'all' ? (
                    <span className="dk-tone-amber dk-tile inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md w-max capitalize">
                      <BookOpen className="w-3 h-3" /> {sub.specialization.replace('_', ' ')}
                    </span>
                  ) : <span />}
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium dk-muted">
                    Open <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}