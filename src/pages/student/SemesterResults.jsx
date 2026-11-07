import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getExamResultsOptimized, getExamSemestersOptimized } from '../../services/firestore'
import { validateIndexNo } from '../../utils/examResults'
import { ArrowLeft, Search, Loader2, AlertCircle, ChevronDown, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
  orange: ['#FFF7ED', '#EA580C', 'rgba(249,115,22,.16)', '#FDBA74'],
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
:root[data-dk="dark"]{color-scheme:dark}
.dk-input:disabled{opacity:.6;cursor:not-allowed}
.dk-linkbtn{background:var(--dk-surface2);border:1px solid var(--dk-border);color:var(--dk-text2);transition:background-color .2s,color .2s,border-color .2s}
.dk-linkbtn:hover{background:var(--dk-brand);border-color:var(--dk-brand);color:#fff}
.dk-avatar{background:var(--dk-brand);box-shadow:0 0 0 4px var(--dk-surface),0 0 0 5px var(--dk-border)}
.dk-tonetext{color:var(--tone-fg)}
.dk-vcard{border:1px solid color-mix(in srgb,var(--tone-fg) 35%,var(--dk-border));background:color-mix(in srgb,var(--tone-bg) 55%,var(--dk-surface))}
.dk-alert{background:var(--tone-bg);color:color-mix(in srgb,var(--tone-fg) 72%,var(--dk-text));border:1px solid color-mix(in srgb,var(--tone-fg) 28%,transparent)}
.dk-row{transition:background-color .15s}.dk-row:hover{background:var(--dk-surface2)}
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


const BATCHES = ['20/21', '21/22', '22/23', '23/24', '24/25', '25/26'];

const SEMESTER_LABELS = {
  '11': 'Year I Semester I',
  '12': 'Year I Semester II',
  '21': 'Year II Semester I',
  '22': 'Year II Semester II',
  '31': 'Year III Semester I',
  '32': 'Year III Semester II',
  '41': 'Year IV Semester I',
  '42': 'Year IV Semester II',
};

function getSemesterLabel(code) {
  return SEMESTER_LABELS[code] || code;
}

export default function SemesterResults() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [indexNo, setIndexNo] = useState('');
  const [batch, setBatch] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [studentName, setStudentName] = useState('');

  const userDept = (userData?.department || '').toLowerCase();
  const { isDark, toggleTheme } = useDkTheme()

  const fetchSemesters = useCallback(async () => {
    const normalizedIndex = indexNo.trim().toUpperCase();
    
    if (!normalizedIndex || !batch) {
      setAvailableSemesters([]);
      setSemester('');
      return;
    }
    
    if (!validateIndexNo(normalizedIndex, userDept)) {
      setAvailableSemesters([]);
      setSemester('');
      return;
    }
    
    setLoadingSemesters(true);
    try {
      const semesters = await getExamSemestersOptimized(normalizedIndex, userDept, batch);
      setAvailableSemesters(semesters);
      
      // Menggunakan state sadurunge (prev) supaya ora perlu masang 'semester' ing dependensi array
      setSemester(prev => {
        if (semesters.length > 0 && !prev) {
          return semesters[0].id; 
        } else if (prev && !semesters.some(s => s.id === prev)) {
          return ''; 
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to fetch semesters:', err);
      setAvailableSemesters([]);
    } finally {
      setLoadingSemesters(false);
    }
  }, [indexNo, batch, userDept]); // 'semester' dibusak saka kene kanggo mungkasi infinite loop

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    
    const normalizedIndex = indexNo.trim().toUpperCase();
    
    if (!validateIndexNo(normalizedIndex, userDept)) {
      const format = userDept === 'bms' ? 'XX/MS/XXXX' : 'XX/CS/XXXX';
      setError(`Invalid Index Number format. Expected: ${format} (e.g., 22/${userDept === 'bms' ? 'ms' : 'cs'}/0001)`);
      return;
    }
    
    if (!batch) {
      setError('Please select a batch');
      return;
    }
    
    if (!semester) {
      setError('Please select a semester');
      return;
    }
    
    setLoading(true);
    try {
      const rawResults = await getExamResultsOptimized(normalizedIndex, userDept, batch, semester);
      
      if (rawResults.length === 0) {
        setError('No examination results found for this index number, batch, and semester.');
        setResults([]);
        setStudentName('');
        return;
      }
      
      const firstResult = rawResults[0];
      if (firstResult.studentName) {
        setStudentName(firstResult.studentName);
      }
      
      const finalResults = rawResults
        .map(r => ({
          ...r,
          subjectName: r.subjectName || r.subjectCode,
        }))
        .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
      
      setResults(finalResults);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
      <DkStyle />
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="dk-focus dk-brandtext group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>

        <div className="dk-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight dk-text">Examination results</h1>
            <p className="mt-1 text-sm dk-text2">Enter your index number, then pick a batch and semester.</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium dk-text2 mb-1.5">Index Number</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dk-muted" />
                  <input
                    type="text"
                    value={indexNo}
                    onChange={(e) => setIndexNo(e.target.value.toUpperCase())}
                    placeholder={userDept === 'bms' ? '22/MS/0001' : '22/CS/0001'}
                    className="dk-input w-full rounded-xl py-2.5 pl-10 pr-3 text-sm"
                    required
                    maxLength={12}
                  />
                </div>
                <p className="mt-1.5 text-xs dk-muted">Format: XX/{userDept === 'bms' ? 'MS' : 'CS'}/XXXX</p>
              </div>
              <div>
                <label className="block text-sm font-medium dk-text2 mb-1.5">Batch</label>
                <div className="relative">
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="dk-input w-full appearance-none rounded-xl py-2.5 pl-3.5 pr-9 text-sm"
                    required
                  >
                    <option value="">Select Batch</option>
                    {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dk-muted" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium dk-text2 mb-1.5">Semester</label>
                <div className="relative">
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="dk-input w-full appearance-none rounded-xl py-2.5 pl-3.5 pr-9 text-sm"
                    disabled={loadingSemesters || availableSemesters.length === 0}
                    required
                  >
                    <option value="">Select Semester</option>
                    {loadingSemesters && <option value="" disabled>Loading...</option>}
                    {availableSemesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    {availableSemesters.length === 0 && !loadingSemesters && batch && indexNo && (
                      <option value="" disabled>No semesters found</option>
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dk-muted" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || loadingSemesters || availableSemesters.length === 0}
              className="dk-btn dk-focus w-full py-3 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : loadingSemesters ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading semesters...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  View Results
                </>
              )}
            </button>
          </form>

          {error && !results.length && (
            <div className="dk-tone-rose dk-alert rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold dk-text">Results for {indexNo}</h2>
                <p className="mt-1 text-sm dk-text2">
                  {studentName ? <span className="font-medium dk-text">{studentName}</span> : 'Student Name: N/A'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="dk-sub dk-text2 rounded-lg px-2.5 py-1 text-xs font-medium">{userDept.toUpperCase()}</span>
                  <span className="dk-sub dk-text2 rounded-lg px-2.5 py-1 text-xs font-medium">Batch {batch}</span>
                  <span className="dk-brandsoft rounded-lg px-2.5 py-1 text-xs font-medium">{getSemesterLabel(semester)}</span>
                  <span className="dk-sub dk-text2 rounded-lg px-2.5 py-1 text-xs font-medium">{results.length} subject(s)</span>
                </div>
              </div>

              <div className="dk-card overflow-x-auto rounded-xl">
                <table className="w-full text-sm">
                  <thead className="dk-sub">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold dk-text2 w-10">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold dk-text2">Subject code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold dk-text2">Subject name</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold dk-text2 w-24">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => {
                      const gradeTone = r.grade.startsWith('A') ? 'emerald' :
                                        r.grade.startsWith('B') ? 'blue' :
                                        r.grade.startsWith('C') ? 'amber' :
                                        r.grade.startsWith('D') ? 'orange' :
                                        r.grade === 'AB' ? 'rose' : 'slate';
                      return (
                        <tr key={`${r.subjectCode}-${i}`} className="dk-row dk-divider border-t">
                          <td className="px-4 py-3 dk-muted">{i + 1}</td>
                          <td className="px-4 py-3 font-mono text-[13px] dk-text">{r.subjectCode}</td>
                          <td className="px-4 py-3 dk-text2">{r.subjectName}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`dk-tone-${gradeTone} dk-tile inline-flex min-w-[2.75rem] justify-center rounded-full px-3 py-1 text-xs font-bold`}>
                              {r.grade === 'AB' ? 'AB' : r.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="dk-tone-amber dk-alert rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Only the highest grade is displayed for each subject (repeat attempts with lower grades are excluded).</li>
                    <li><strong>AB</strong> indicates the student was absent for that examination.</li>
                    <li>This report is for reference only.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}