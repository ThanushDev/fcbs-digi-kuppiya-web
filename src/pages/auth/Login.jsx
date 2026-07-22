import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, resetPassword } from '../../services/auth'
import { useToast } from '../../contexts/ToastContext'
import { Eye, EyeOff, Mail, Lock, MessageCircle, Mail as MailIcon, X, HelpCircle } from 'lucide-react'
import logo from '../../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [isOldUser, setIsOldUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showContactMenu, setShowContactMenu] = useState(false)

  // Dynamic Background Colors Setup
  const [colorIdx, setColorIdx] = useState(0)
  const bgColors = [
    ['bg-indigo-500/40', 'bg-sky-500/30', 'bg-violet-500/30'],
    ['bg-emerald-500/40', 'bg-teal-500/30', 'bg-cyan-500/30'],
    ['bg-rose-500/40', 'bg-orange-500/30', 'bg-amber-500/30'],
    ['bg-fuchsia-500/40', 'bg-purple-500/30', 'bg-pink-500/30']
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIdx((prev) => (prev + 1) % bgColors.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

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
    <div className="relative flex h-screen w-screen items-center justify-center bg-gradient-to-br from-black via-slate-150 to-black p-4 md:p-6 overflow-hidden select-none">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-[3000ms] ease-in-out ${bgColors[colorIdx][0]}`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-[3000ms] ease-in-out ${bgColors[colorIdx][1]}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[160px] transition-colors duration-[3000ms] ease-in-out ${bgColors[colorIdx][2]}`} />
      </div>

      <div className="relative w-full max-w-md z-10 my-auto">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-300/60 border border-slate-300/70 p-7 md:p-9 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />

          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-18 w-18 items-center justify-center">
              <img src={logo} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">FCBS DIGI KUPPIYA</h2>
            <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
              {isOldUser ? 'Account Activation' : 'Student Portal Access'}
            </p>
          </div>

          {!isOldUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Email / Registration No</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field !pl-10" placeholder="you@example.com or 22/ms/00" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field !pl-10 !pr-10" placeholder="Enter your password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition p-0.5">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition duration-200 active:scale-[0.99] shadow-md shadow-indigo-200">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForceReset} className="space-y-4">
              <div className="rounded-xl bg-amber-50 p-3.5 text-xs text-amber-700 border border-amber-200 leading-relaxed flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span>You are logging in for the first time. For security reasons, you must reset your password to proceed.</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Confirm Email Address</label>
                <input type="email" value={form.email} readOnly
                  className="input-field !pl-4 bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition duration-200 active:scale-[0.99] shadow-md shadow-amber-200">
                {loading ? 'Sending Link...' : 'Send Activation & Reset Link'}
              </button>
              <button type="button" onClick={() => setIsOldUser(false)}
                className="text-xs font-semibold text-slate-400 w-full text-center hover:text-indigo-500 transition mt-1">
                Back to Sign In
              </button>
            </form>
          )}

          {!isOldUser && (
            <div className="mt-6 flex items-center justify-between text-xs border-t border-slate-100 pt-5 font-medium">
              <Link to="/forgot-password" className="text-slate-400 hover:text-indigo-500 transition inline-flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Forgot Password?
              </Link>
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider text-xs">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        {showContactMenu && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <a href="https://wa.me/94764781212" target="_blank" rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:scale-110 hover:bg-emerald-600 duration-200 shadow-emerald-200">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="mailto:fcbsdigikuppiya@gmail.com" target="_blank"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition hover:scale-110 hover:bg-sky-600 duration-200 shadow-sky-200">
              <MailIcon className="w-5 h-5" />
            </a>
          </div>
        )}
        <button onClick={() => setShowContactMenu(!showContactMenu)}
          className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200 transition-all duration-300 hover:scale-105 active:scale-95">
          {showContactMenu ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}