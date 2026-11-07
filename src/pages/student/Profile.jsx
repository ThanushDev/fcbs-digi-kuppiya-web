import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { updatePassword } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { db, auth } from '../../services/firebase'
import { validateMobile, validateRegNumber } from '../../utils/validators'
import useFaceVerification from '../../hooks/useFaceVerification'
import { Camera, Eye, Loader2, CheckCircle, XCircle, AlertTriangle, Sun, Moon } from 'lucide-react'

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


const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export default function Profile() {
  const { user, userData, refreshUserData } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const faceOverlayRef = useRef(null)
  const { status: faceStatus, progress: scanProgress, result: faceResult, analyze: runFaceAnalysis, reset: resetFaceScan } = useFaceVerification()
  const canvasRef = useRef(null)

  const [form, setForm] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || '',
    mobile: userData?.mobile || '',
    regNumber: userData?.regNumber || '',
  })
  const [photo, setPhoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [passwords, setPasswords] = useState({ current: '', new: '' })
  const [saving, setSaving] = useState(false)
  const { isDark, toggleTheme } = useDkTheme()

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      resetFaceScan()
      setTimeout(() => runFaceAnalysis(url, faceOverlayRef), 60)
    }
  }

  // Draw scanline animation on canvas while AI analysis is running
  useEffect(() => {
    if (!canvasRef.current || !previewUrl || faceStatus !== 'analyzing') return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = previewUrl
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw the image
      ctx.drawImage(img, 0, 0)

      // Dim overlay
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Scanline effect based on progress
      const lineY = (canvas.height * scanProgress)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)'
      ctx.fillRect(0, 0, canvas.width, lineY)

      // Corner brackets
      const bx = canvas.width * 0.15
      const by = canvas.height * 0.15
      const bw = canvas.width * 0.7
      const bh = canvas.height * 0.7
      const cl = 18
      ctx.lineWidth = 3
      ctx.strokeStyle = '#818cf8'
      // Top-left
      ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke()
      // Top-right
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke()
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke()
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke()

      // Scanning label
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('AI FACE SCAN IN PROGRESS', canvas.width / 2, 24)
    }
  }, [previewUrl, faceStatus, scanProgress])

  const uploadToCloudinary = async (file) => {
    if (!CLOUD_NAME) {
      throw new Error('Cloudinary Cloud Name is missing in environment variables.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error?.message || 'Cloudinary upload failed')
    }
    
    const data = await response.json()
    return data.secure_url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.mobile && !validateMobile(form.mobile)) return showToast('Mobile must be exactly 10 digits', 'error')
    if (form.regNumber && !validateRegNumber(form.regNumber, userData?.batch)) {
      const batchMsg = userData?.batch ? ` for batch ${userData.batch}` : ''
      return showToast(`Invalid registration number${batchMsg}`, 'error')
    }

    if (photo && faceStatus !== 'passed') {
      return showToast('Human face not detected. Please upload a clear photo of yourself.', 'error')
    }

    setSaving(true)
    try {
      const updateData = {
        firstName: form.firstName,
        lastName: form.lastName,
        mobile: form.mobile,
        regNumber: form.regNumber,
      }

      if (photo) {
        showToast('Uploading new profile photo...', 'info')
        const uploadedPhotoUrl = await uploadToCloudinary(photo)
        updateData.photoURL = uploadedPhotoUrl
        updateData.profile_pic = uploadedPhotoUrl
        updateData.hasValidFace = faceStatus === 'passed'
      }

      await updateDoc(doc(db, 'users', user.uid), updateData)

      if (passwords.current && passwords.new) {
        await updatePassword(auth.currentUser, passwords.new)
      }

      await refreshUserData()
      showToast('Profile updated successfully!', 'success')
      setPhoto(null)
      resetFaceScan()
      setPreviewUrl(null)
    } catch (err) {
      showToast(err.message, 'error')
    }
    setSaving(false)
  }

  const currentImageSrc = previewUrl || userData?.photoURL || userData?.profile_pic
  const hasRegNumber = !!userData?.regNumber

  const statusTone = faceStatus === 'passed' ? 'emerald' : faceStatus === 'failed' ? 'rose' : faceStatus === 'analyzing' ? 'indigo' : 'slate'

  return (
    <div className="dk-page animate-fade-in p-3 sm:p-6 rounded-2xl min-h-screen">
      <DkStyle />
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight dk-text">My profile</h1>
            <p className="mt-1 text-sm dk-text2">Manage your details, photo and password.</p>
          </div>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo + identity */}
          <section className="dk-card rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="dk-avatar relative flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-white shrink-0 overflow-hidden">
                {previewUrl ? (
                  <>
                    {faceStatus === 'analyzing' ? (
                      <canvas ref={canvasRef} className="w-full h-full object-cover" />
                    ) : (
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Face Preview" />
                    )}
                    <canvas
                      ref={faceOverlayRef}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ opacity: (faceStatus === 'passed' || faceStatus === 'failed') && faceResult ? 1 : 0 }}
                    />
                    {faceStatus === 'passed' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/25 backdrop-blur-sm flex items-center justify-center">
                          <CheckCircle className="w-7 h-7 text-emerald-400" />
                        </div>
                      </div>
                    )}
                    {faceStatus === 'failed' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-rose-500/25 backdrop-blur-sm flex items-center justify-center">
                          <XCircle className="w-7 h-7 text-rose-400" />
                        </div>
                      </div>
                    )}
                  </>
                ) : currentImageSrc ? (
                  <img src={currentImageSrc} className="h-full w-full object-cover" alt="Profile" />
                ) : (
                  userData?.firstName?.[0] || 'U'
                )}
              </div>

              <div className="min-w-0">
                <p className="text-lg font-semibold dk-text">{userData?.firstName} {userData?.lastName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {userData?.role && <span className="dk-brandsoft rounded-lg px-2.5 py-1 text-xs font-medium capitalize">{userData.role}</span>}
                  {userData?.department && <span className="dk-sub dk-text2 rounded-lg px-2.5 py-1 text-xs font-medium uppercase">{userData.department}</span>}
                  {userData?.batch && <span className="dk-sub dk-text2 rounded-lg px-2.5 py-1 text-xs font-medium">Batch {userData.batch}</span>}
                </div>
                <label className="dk-linkbtn mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium">
                  <Camera className="w-3.5 h-3.5" /> Change photo
                  <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} className="hidden" />
                </label>
                <p className="mt-1.5 text-xs dk-muted">JPG or PNG. A clear photo of your face is required.</p>
              </div>
            </div>

            {previewUrl && (
              <div className={`dk-tone-${statusTone} dk-vcard mt-5 rounded-xl p-4 transition-all duration-300`}>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className={`w-4 h-4 dk-tonetext ${faceStatus === 'analyzing' ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-semibold dk-text">Face verification</span>
                  {faceStatus === 'passed' && <span className="dk-tile ml-auto text-xs font-medium px-2 py-0.5 rounded-full">Verified</span>}
                  {faceStatus === 'failed' && <span className="dk-tile ml-auto text-xs font-medium px-2 py-0.5 rounded-full">Failed</span>}
                </div>

                {faceStatus === 'analyzing' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin dk-tonetext" />
                      <span className="text-sm font-medium dk-text">Analyzing face structure...</span>
                      <span className="ml-auto text-xs font-medium dk-text2">{Math.round((scanProgress || 0) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full dk-sub">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.round((scanProgress || 0) * 100)}%`, background: 'var(--tone-fg)' }} />
                    </div>
                    <p className="text-xs dk-muted">Scanning facial features &amp; landmarks. AI is checking for a human face.</p>
                  </div>
                )}

                {faceStatus === 'passed' && (
                  <p className="text-sm font-medium dk-tonetext flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Human face detected &amp; verified successfully
                  </p>
                )}

                {faceStatus === 'failed' && (
                  <p className="text-sm font-medium dk-tonetext leading-relaxed">
                    Face verification failed! No clear human face detected. Please upload a clear photo of your face.
                  </p>
                )}

                {faceStatus === 'idle' && (
                  <p className="text-sm dk-text2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 dk-muted" />
                    Upload a clear face photo for verification
                  </p>
                )}

                {faceStatus === 'error' && (
                  <div className="dk-tone-rose dk-alert mt-2 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-center">
                    Face verification unavailable. Please check your connection and try again.
                  </div>
                )}

                <div className="dk-tone-amber dk-alert mt-3 flex items-start gap-2 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Non-human images (flowers, animals, objects) will be rejected. A valid human face is required to proceed.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Personal information */}
          <section className="dk-card rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold dk-text">Personal information</h2>
              <p className="text-xs dk-text2">Your name and contact details.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="dk-input w-full rounded-xl px-3.5 py-2.5 text-sm" required />
              </Field>
              <Field label="Last name">
                <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="dk-input w-full rounded-xl px-3.5 py-2.5 text-sm" required />
              </Field>
            </div>

            <Field label="Email">
              <input type="email" value={form.email} disabled className="dk-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile">
                <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} maxLength={10}
                  className="dk-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
              </Field>
              <Field label="Registration no" hint={hasRegNumber ? 'Registration number cannot be changed after registration.' : null}>
                <input type="text" value={form.regNumber}
                  onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
                  disabled={hasRegNumber}
                  className="dk-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
              </Field>
            </div>
          </section>

          {/* Password */}
          <section className="dk-card rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold dk-text">Password</h2>
              <p className="text-xs dk-text2">Fill in both fields to change your password. Leave them empty to keep it as it is.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current password">
                <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="dk-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
              </Field>
              <Field label="New password">
                <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="dk-input w-full rounded-xl px-3.5 py-2.5 text-sm" />
              </Field>
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="dk-btn dk-focus inline-flex w-full sm:w-auto sm:min-w-[180px] items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>) : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium dk-text2">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs dk-muted">{hint}</p>}
    </div>
  )
}