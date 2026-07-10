import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, resetPassword } from '../../services/auth'
import { useToast } from '../../contexts/ToastContext'
import logo from '../../assets/logo.png' // 🎯 SVG ලෝගෝ එක

export default function Login() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [isOldUser, setIsOldUser] = useState(false)

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="mb-6 text-center">
            
            {/* 🎯 නිල් කොටුව අයින් කරලා, ලෝගෝ එක h-24 w-24 (පොඩ්ඩක් ලොකු) කළා */}
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center bg-transparent">
              <img src={logo} alt="Uniflow Logo" className="h-full w-full object-contain" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">FCBS DIGI KUPPPIYA</h2>
            <p className="mt-1 text-sm text-gray-500">
              {isOldUser ? 'Activate your account' : 'Sign in to your account'}
            </p>
          </div>

          {!isOldUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Email / Registration No</label>
                <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field" placeholder="you@example.com or 22/ms/00" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field" placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForceReset} className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                You are logging in for the first time. For security reasons, you must reset your password to proceed.
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-600">Confirm Email Address</label>
                <input type="email" value={form.email} disabled className="input-field bg-gray-100 cursor-not-allowed" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full bg-amber-600 hover:bg-amber-700">
                {loading ? 'Sending Link...' : 'Send Activation & Reset Link'}
              </button>
              <button type="button" onClick={() => setIsOldUser(false)} className="text-sm text-gray-500 w-full text-center hover:underline mt-2">
                Back to Sign In
              </button>
            </form>
          )}

          {!isOldUser && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</Link>
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">Create account</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}