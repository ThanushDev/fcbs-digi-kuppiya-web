import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { resetPassword } from '../../services/auth'
import { validateEmail } from '../../utils/validators'
import logo from '../../assets/logo.png' 

export default function ForgotPassword() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#060b19] p-4 md:p-6 overflow-hidden select-none">
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/15 blur-[120px] animate-pulse" style={{ animationDuration: '14s' }} />
        <div className="absolute bottom-[-15%] left-[-15%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.2]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#060b19_85%)]" />
      </div>

      <div className="relative w-full max-w-md z-10 my-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70 -z-10" />

        {/* --- FORGOT PASSWORD CARD --- */}
        <div className="bg-[#0b1528]/60 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)] border border-white/[0.08] p-5 md:p-7 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

          {/* Header Section */}
          <div className="mb-4 text-center">
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center bg-transparent cursor-pointer">
              <img src={logo} alt="Uniflow Logo" className="h-full w-full object-contain filter drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]" />
            </div>
            <h2 className="text-xl font-black tracking-widest bg-gradient-to-r from-purple-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent">
              UNIFLOW
            </h2>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reset Portal Access</p>
          </div>

          {/* Alert Messages */}
          {message && (
            <div className="mb-3.5 rounded-xl bg-green-500/10 px-3.5 py-2 text-xs text-green-400 border border-green-500/20 font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-3.5 rounded-xl bg-red-500/10 px-3.5 py-2 text-xs text-red-400 border border-red-500/20 font-medium">
              {error}
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">University Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-1.5 text-xs rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium" 
                placeholder="you@example.com" 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-2.5 text-xs font-extrabold tracking-wider rounded-xl text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-90 transition duration-200 active:scale-[0.99] border border-purple-400/20 mt-1"
            >
              {loading ? 'SENDING LINK...' : 'Rest Password'}
            </button>
          </form>

          {/* Footer Section */}
          <p className="mt-4 text-center text-[11px] text-slate-400 border-t border-white/[0.08] pt-2.5 tracking-wide font-medium">
            Remembered key? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider ml-0.5">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}