import { useState, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers, Scissors, ImageMinus, Image, Maximize,
  Quote, FileText, Sparkles, ArrowLeft, Sun, Moon
} from 'lucide-react'

// ---- Theme tokens (light / dark). Matches Dashboard.jsx exactly. ----
const TONES = {
  indigo: ['#EEF2FF', '#4F46E5', 'rgba(99,102,241,.18)', '#A5B4FC'],
  emerald: ['#ECFDF5', '#059669', 'rgba(16,185,129,.16)', '#6EE7B7'],
  rose: ['#FFF1F2', '#E11D48', 'rgba(244,63,94,.16)', '#FDA4AF'],
  blue: ['#EFF6FF', '#2563EB', 'rgba(59,130,246,.16)', '#93C5FD'],
  amber: ['#FFFBEB', '#D97706', 'rgba(245,158,11,.16)', '#FCD34D'],
  violet: ['#F5F3FF', '#7C3AED', 'rgba(139,92,246,.16)', '#C4B5FD'],
  slate: ['#F1F5F9', '#475569', 'rgba(148,163,184,.16)', '#CBD5E1'],
  fuchsia: ['#FDF4FF', '#C026D3', 'rgba(217,70,239,.16)', '#F0ABFC'],
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

export default function ToolsHub() {
  const navigate = useNavigate()

  // Theme (light / dark) - applied on <html> so portals and modals inherit it
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('dk-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch { /* ignore */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const isDark = theme === 'dark'
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  useLayoutEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-dk', theme)
    root.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem('dk-theme', theme) } catch { /* ignore */ }
    return () => {
      root.removeAttribute('data-dk')
      root.classList.remove('dark')
    }
  }, [theme])

  const [category, setCategory] = useState('all')

  const tools = [
    {
      id: 'merge-pdf',
      title: 'Merge PDF',
      subtitle: 'Combine multiple PDFs',
      category: 'pdf',
      icon: Layers,
      desc: 'Drag & drop PDFs, reorder, and merge into one file instantly.',
      colorClass: 'dk-tone-indigo',
    },
    {
      id: 'split-pdf',
      title: 'Split PDF',
      subtitle: 'Extract pages',
      category: 'pdf',
      icon: Scissors,
      desc: 'Split by page range or extract individual pages into separate files.',
      colorClass: 'dk-tone-emerald',
    },
    {
      id: 'pdf-to-image',
      title: 'PDF to Image',
      subtitle: 'PDF → JPG / PNG',
      category: 'pdf',
      icon: ImageMinus,
      desc: 'Convert PDF pages to high-resolution images in one click.',
      colorClass: 'dk-tone-rose',
    },
    {
      id: 'image-to-pdf',
      title: 'Image to PDF',
      subtitle: 'Images → PDF',
      category: 'pdf',
      icon: Image,
      desc: 'Combine multiple images (JPG/PNG) into a single PDF document.',
      colorClass: 'dk-tone-blue',
    },
    {
      id: 'compress-pdf',
      title: 'Compress PDF',
      subtitle: 'Reduce file size',
      category: 'pdf',
      icon: Maximize,
      desc: 'Optimize and shrink PDF file size without losing quality.',
      colorClass: 'dk-tone-amber',
    },
    {
      id: 'citation-generator',
      title: 'AI Citation Generator',
      subtitle: 'APA • IEEE • MLA • Harvard',
      category: 'writing',
      icon: Quote,
      desc: 'Generate accurate academic citations from URLs, books, or articles using AI.',
      colorClass: 'dk-tone-violet',
    },
    {
      id: 'text-analyzer',
      title: 'Word & Read-Time Counter',
      subtitle: 'Text analyzer',
      category: 'writing',
      icon: FileText,
      desc: 'Real-time word, character, sentence, paragraph, and reading-time stats.',
      colorClass: 'dk-tone-slate',
    },
    {
      id: 'ai-summarizer',
      title: 'AI Summarizer & Paraphraser',
      subtitle: 'Summarize • Rewrite',
      category: 'writing',
      icon: Sparkles,
      desc: 'Summarize notes or rewrite paragraphs cleanly with AI.',
      colorClass: 'dk-tone-fuchsia',
    },
  ]

  const filtered = category === 'all' ? tools : tools.filter((t) => t.category === category)

  const categories = [
    { key: 'all', label: 'All Tools' },
    { key: 'pdf', label: 'PDF Suite' },
    { key: 'writing', label: 'Writing Utilities' },
  ]

  return (
    <>
      <style>{DK_CSS}</style>
      <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="dk-focus dk-icon-btn dk-icon-btn group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
            </button>
            <div className="hidden sm:block">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider dk-text uppercase mb-1">
                Tools Hub
              </h1>
              <p className="mt-0.5 text-sm dk-text2">
                Fast, client-side productivity tools for students — no uploads, no delays.
              </p>
            </div>
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
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                category === c.key
                  ? 'dk-brandsoft dk-brandtext border-dk-brand'
                  : 'dk-sub dk-text2 hover:dk-brandsoft hover:dk-brandtext'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                onClick={() => navigate(`/dashboard/tools/${tool.id}`)}
                className={`group relative flex flex-col rounded-2xl border p-5 hover:-translate-y-1 transition-all duration-200 dk-card dk-card-i dk-focus dk-tone-${tool.colorClass}`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl mb-4 dk-tile`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold dk-text text-sm mb-1">{tool.title}</h3>
                <p className="text-xs dk-text2 mb-3 leading-relaxed">{tool.desc}</p>
                <div className="mt-auto pt-3 border-t dk-divider flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider dk-tone-${tool.colorClass} dk-tile`}>
                    {tool.subtitle}
                  </span>
                  <span className="text-xs transition dk-muted dk-ghost hover:dk-text2">
                    Open
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 dk-muted mb-3" />
            <h3 className="text-lg font-bold dk-text mb-1">No tools found</h3>
            <p className="text-sm dk-text2">Try selecting a different category.</p>
          </div>
        )}
      </div>
    </>
  )
}
