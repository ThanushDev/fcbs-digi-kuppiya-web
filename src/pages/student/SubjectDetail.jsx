import { useState, useEffect, useLayoutEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getChapters, getSubjects, getResourcesBySubjectAndType } from '../../services/firestore'
import CommentSection from '../../components/comments/CommentSection'
import { ArrowLeft, BookOpen, FileText, FileEdit, Video, Play, ExternalLink, AlertCircle, Sun, Moon } from 'lucide-react'

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
.dk-tab{color:var(--dk-text2);transition:background-color .2s,color .2s,box-shadow .2s}
.dk-tab:hover{color:var(--dk-text)}
.dk-tab[aria-selected="true"]{background:var(--dk-surface);color:var(--dk-brand-text);box-shadow:var(--dk-shadow),0 0 0 1px var(--dk-border)}
.dk-count{background:var(--dk-border);color:var(--dk-text2)}
.dk-tab[aria-selected="true"] .dk-count{background:var(--dk-brand-soft);color:var(--dk-brand-text)}
.dk-linkbtn{background:var(--dk-surface2);border:1px solid var(--dk-border);color:var(--dk-text2);transition:background-color .2s,color .2s,border-color .2s}
.dk-linkbtn:hover{background:var(--dk-brand);border-color:var(--dk-brand);color:#fff}
:root[data-dk="dark"] .dk-adapt{filter:invert(.92) hue-rotate(180deg)}
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


const TABS = [
  { key: 'chapters', label: 'Chapters', icon: BookOpen },
  { key: 'past_papers', label: 'Past Papers', icon: FileText },
  { key: 'short_notes', label: 'Short Notes', icon: FileEdit },
  { key: 'videos', label: 'Videos', icon: Video },
]

export default function SubjectDetail() {
  const { subjectId } = useParams()
  const [subject, setSubject] = useState(null)
  const [tab, setTab] = useState('chapters')
  const [chapters, setChapters] = useState([])
  const [pastPapers, setPastPapers] = useState([])
  const [shortNotes, setShortNotes] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const { isDark, toggleTheme } = useDkTheme()

  useEffect(() => {
    const load = async () => {
      try {
        const allSubs = await getSubjects()
        const sub = allSubs.find((s) => s.id === subjectId)
        setSubject(sub || null)

        const [chs, pp, sn, vids] = await Promise.all([
          getChapters(subjectId),
          getResourcesBySubjectAndType(subjectId, 'past_paper'),
          getResourcesBySubjectAndType(subjectId, 'short_note'),
          getResourcesBySubjectAndType(subjectId, 'video'),
        ])

        setChapters(chs.sort((a, b) => (a.order || 0) - (b.order || 0)))
        setPastPapers(pp)
        setShortNotes(sn)
        setVideos(vids)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  } , [subjectId])

  if (loading) return (
    <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
      <DkStyle />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-32 rounded-md dk-skel" />
          <div className="h-8 w-64 rounded-lg dk-skel" />
          <div className="h-3 w-48 rounded-md dk-skel" />
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>
      <div className="mt-6 h-11 w-full max-w-md rounded-xl dk-skel" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl dk-skel" />)}
      </div>
    </div>
  )

  if (!subject) return (
    <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
      <DkStyle />
      <div className="flex justify-end">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>
      <div className="dk-card mx-auto mt-12 max-w-md rounded-2xl p-8 text-center">
        <span className="dk-sub dk-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"><AlertCircle className="w-6 h-6" /></span>
        <h2 className="text-base font-semibold dk-text">Subject not found</h2>
        <p className="mt-1 text-sm dk-text2">It may have been removed, or it isn't available for your account.</p>
        <Link to="/dashboard" className="dk-btn dk-focus mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to semesters
        </Link>
      </div>
    </div>
  )

  const counts = {
    chapters: chapters.length,
    past_papers: pastPapers.length,
    short_notes: shortNotes.length,
    videos: videos.length,
  }

  return (
    <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
      <DkStyle />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link to={`/dashboard/subjects/${subject.semesterId}`} className="dk-focus dk-brandtext group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Subjects
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight dk-text">{subject.name}</h1>
            {subject.code && (
              <span className="dk-brandsoft inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide">{subject.code}</span>
            )}
          </div>
          {subject.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed dk-text2">{subject.description}</p>}
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Subject resources" className="dk-sub mb-6 flex w-full max-w-full overflow-x-auto rounded-xl p-1 sm:inline-flex sm:w-auto">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className="dk-tab dk-focus inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap">
              <Icon className="w-4 h-4" />
              {t.label}
              <span className="dk-count rounded-md px-1.5 text-[11px] font-semibold leading-5">{counts[t.key]}</span>
            </button>
          )
        })}
      </div>

      {tab === 'chapters' && <ChapterGridCard chapters={chapters} />}
      {tab === 'past_papers' && <ResourceGridCard items={pastPapers} type="past_paper" />}
      {tab === 'short_notes' && <ResourceGridCard items={shortNotes} type="short_note" />}
      {tab === 'videos' && <VideoGridPlayer items={videos} />}

      <div className="dk-divider mt-12 pt-8 border-t">
        <div className="dk-adapt">
          <CommentSection chapterId={subjectId} chapterTitle={subject.name} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="dk-card flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border-dashed px-6 text-center">
      <span className="dk-sub dk-muted flex h-11 w-11 items-center justify-center rounded-xl"><Icon className="w-5 h-5" /></span>
      <p className="text-sm dk-text2">{text}</p>
    </div>
  )
}

function ChapterGridCard({ chapters }) {
  if (chapters.length === 0) {
    return <EmptyState icon={BookOpen} text="No chapters available for this subject." />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {chapters.map((ch) => (
        <div key={ch.id} className="group dk-card dk-card-i dk-tone-indigo p-5 rounded-2xl flex flex-col justify-between gap-4 min-h-[144px]">
          <div className="flex items-start gap-3">
            <span className="dk-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold text-sm">
              {ch.order || '\u2014'}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold leading-snug dk-text line-clamp-2">
                {ch.title}
              </h4>
              <p className="text-xs dk-muted mt-1">Lecture chapter</p>
            </div>
          </div>
          {ch.driveLink && (
            <a href={ch.driveLink} target="_blank" rel="noopener noreferrer"
              className="dk-linkbtn dk-focus w-full rounded-lg py-2 text-xs font-medium inline-flex items-center justify-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> View document
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function ResourceGridCard({ items, type }) {
  if (items.length === 0) {
    return <EmptyState icon={type === 'past_paper' ? FileText : FileEdit} text={`No ${type === 'past_paper' ? 'past papers' : 'short notes'} available for this subject.`} />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item) => {
        const documentLink = item.fileUrl || item.fileURL;
        return (
          <div key={item.id} className={`group dk-card dk-card-i ${type === 'past_paper' ? 'dk-tone-amber' : 'dk-tone-emerald'} p-5 rounded-2xl flex flex-col justify-between gap-4 min-h-[144px]`}>
            <div className="flex items-start gap-3">
              <span className="dk-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                {type === 'past_paper' ? <FileText className="w-5 h-5" /> : <FileEdit className="w-5 h-5" />}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold leading-snug dk-text line-clamp-2">{item.title}</h4>
                <p className="text-xs dk-muted mt-1">{type === 'past_paper' ? 'Exam document' : 'Revision note'}</p>
              </div>
            </div>
            {documentLink && (
              <a href={documentLink} target="_blank" rel="noopener noreferrer"
                className="dk-linkbtn dk-focus w-full rounded-lg py-2 text-xs font-medium inline-flex items-center justify-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> View document
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

function VideoGridPlayer({ items }) {
  const [activeVideo, setActiveVideo] = useState(null)

  if (items.length === 0) {
    return <EmptyState icon={Video} text="No lecture videos available." />
  }

  const getYoutubeId = (url) => {
    if (!url) return null;
    const cleanedUrl = url.trim();
    if (cleanedUrl.length === 11 && !cleanedUrl.includes('/') && !cleanedUrl.includes('?')) {
      return cleanedUrl;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = cleanedUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div className="space-y-6">
      {activeVideo && (
        <div className="rounded-2xl overflow-hidden bg-black aspect-video max-w-4xl mx-auto shadow-xl animate-fade-in" style={{ border: '1px solid var(--dk-border)' }}>
          <iframe src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} className="h-full w-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Embedded Video Player" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const videoLink = item.fileUrl || item.fileURL || '';
          const ytId = getYoutubeId(videoLink);
          const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

          return (
            <div key={item.id} className={`group dk-card dk-card-i overflow-hidden rounded-2xl ${ytId ? 'cursor-pointer' : ''} ${activeVideo === ytId ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => ytId && setActiveVideo(ytId)}>

              <div className="relative aspect-video overflow-hidden dk-sub" style={{ borderWidth: '0 0 1px 0' }}>
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-medium dk-muted">Invalid link</div>
                )}

                {ytId && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                    <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-200">
                      <Play className="w-5 h-5 ml-0.5" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h4 className="text-sm font-semibold leading-snug dk-text line-clamp-2">{item.title}</h4>
                <p className="text-xs dk-muted mt-1.5">{ytId && activeVideo === ytId ? 'Now playing' : ytId ? 'Click to stream' : 'Link unavailable'}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}