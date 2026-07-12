import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, resetPassword } from '../../services/auth'
import { useToast } from '../../contexts/ToastContext'
import logo from '../../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [isOldUser, setIsOldUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Floating Button State
  const [showContactMenu, setShowContactMenu] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginUser(form.email, form.password)
      showToast('Signed in successfully', 'success')
      navigate('/dashboard')
    } catch (err) {
      if (err.message === 'OLD_USER_DETECTED') {
        setIsOldUser(true)
        showToast('Account detected. Please reset your password to activate.', 'info')
      } else if (err.message === 'WRONG_PASSWORD') {
        showToast('Wrong password! Redirecting to Forgot Password...', 'error')
        setTimeout(() => {
          navigate('/forgot-password', { state: { email: err.email } })
        }, 1500)
      } else if (err.message === 'USER_NOT_FOUND') {
        showToast('Registration number or Email is not registered.', 'error')
      } else {
        showToast('Invalid email/reg number or password.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForceReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(form.email)
      showToast('Activation & Reset link sent! Please check your inbox or spam.', 'success')
      setIsOldUser(false)
    } catch (err) {
      showToast(err.message || 'Failed to send reset link.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#060b19] p-4 md:p-6 overflow-hidden select-none">
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/15 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.2]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#060b19_80%)]" />
      </div>

      <div className="relative w-full max-w-md z-10 my-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-70 -z-10" />
        
        {/* Larger & More Spacious Glass Card */}
        <div className="bg-[#0b1528]/60 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] border border-white/[0.08] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center bg-transparent cursor-pointer">
              <img src={logo} alt="Uniflow Logo" className="h-full w-full object-contain filter drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
            </div>
            <h2 className="text-2xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              FCBS DIGI KUPPIYA
            </h2>
            <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isOldUser ? 'Cyber Account Activation' : 'Core System Authentication'}
            </p>
          </div>

          {!isOldUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-cyan-400 uppercase">Email / Registration No</label>
                <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm font-medium" placeholder="you@example.com or 22/ms/00" required />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-cyan-400 uppercase">Password</label>
                <div className="relative flex items-center">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-sm font-medium" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 text-slate-400 hover:text-cyan-400 transition p-1">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full mt-2 py-2.5 rounded-xl text-xs font-extrabold tracking-wider text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-90 transition duration-200 active:scale-[0.99] border border-cyan-400/20">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForceReset} className="space-y-4">
              <div className="rounded-xl bg-cyan-500/10 p-3 text-[11px] text-cyan-400 border border-cyan-500/20 backdrop-blur-sm leading-relaxed">
                You are logging in for the first time. For security reasons, you must reset your password to proceed.
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-cyan-400 uppercase">Confirm Email Address</label>
                <input type="email" value={form.email} readOnly className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-slate-400 cursor-not-allowed text-sm font-medium" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-xs font-extrabold tracking-wider text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 transition duration-200 active:scale-[0.99]">
                {loading ? 'Sending Link...' : 'Send Activation & Reset Link'}
              </button>
              <button type="button" onClick={() => setIsOldUser(false)} className="text-[11px] font-semibold text-slate-400 w-full text-center hover:text-cyan-400 transition mt-1 tracking-wider">
                Back to Sign In
              </button>
            </form>
          )}

          {!isOldUser && (
            <div className="mt-6 flex items-center justify-between text-xs border-t border-white/[0.08] pt-4 tracking-wide font-medium">
              <Link to="/forgot-password" className="text-slate-400 hover:text-cyan-400 transition">Forgot Password?</Link>
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition font-bold uppercase tracking-wider">Create Account</Link>
            </div>
          )}
        </div>
      </div>

      {/* 🛠️ FLOATING CONTACT BUTTON MENU */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        {showContactMenu && (
          <div className="flex flex-col gap-2 animate-fade-in-up">
            {/* WhatsApp Button */}
            <a href="https://wa.me/94764781212" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:scale-110 hover:bg-emerald-600 duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.618-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
            </a>
            {/* Email Button */}
            <a href="fcbsdigikuppiya@gmail.com" className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg transition hover:scale-110 hover:bg-cyan-700 duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        )}
        {/* Main Floating Button */}
        <button onClick={() => setShowContactMenu(!showContactMenu)} className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-105 active:scale-95">
          {showContactMenu ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.596.596 0 01-.733-.589l-.006-.294a5.974 5.974 0 011.664-4.14A7.965 7.965 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
          )}
        </button>
      </div>
    </div>
  )
}