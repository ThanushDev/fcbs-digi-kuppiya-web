import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { resetPassword } from '../../services/auth'
import { validateEmail } from '../../utils/validators'
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Lock } from 'lucide-react'

export default function ForgotPassword() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Dynamic Background Colors Setup
  const [colorIdx, setColorIdx] = useState(0)
  const bgColors = [
    ['bg-violet-500/40', 'bg-sky-500/30'],
    ['bg-emerald-500/40', 'bg-cyan-500/30'],
    ['bg-rose-500/40', 'bg-amber-500/30'],
    ['bg-fuchsia-500/40', 'bg-blue-500/30']
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIdx((prev) => (prev + 1) % bgColors.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!validateEmail(email)) return setError('Enter a valid email address')
    setLoading(true)
    try {
      await resetPassword(email)
      setMessage('Password reset link sent! Check your inbox (or Spam folder).')
    } catch (err) {
      if (err.message === 'USER_NOT_FOUND') {
        setError('This email is not registered in our system.')
      } else {
        setError(err.message.replace('Firebase: ', ''))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-gradient-to-br from-black via-slate-150 to-black p-4 md:p-6 overflow-hidden select-none">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] right-[-8%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-[3000ms] ease-in-out ${bgColors[colorIdx][0]}`} />
        <div className={`absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-[3000ms] ease-in-out ${bgColors[colorIdx][1]}`} />
      </div>

      <div className="relative w-full max-w-md z-10 my-auto">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-300/60 border border-slate-300/70 p-7 md:p-9 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />

          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Lock className="w-7 h-7 text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
            <p className="mt-1 text-xs text-slate-400">Enter your email to receive a reset link</p>
          </div>

          {message && (
            <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700 border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700 border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field !pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition duration-200 active:scale-[0.99] shadow-md shadow-indigo-200">
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-5">
            <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-indigo-500 transition inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}