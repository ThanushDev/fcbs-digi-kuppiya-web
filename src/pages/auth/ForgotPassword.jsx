import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { resetPassword } from '../../services/auth'
import { validateEmail } from '../../utils/validators'
import logo from '../../assets/logo.png' // 🎯 SVG ලෝගෝ එක

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="mb-6 text-center">
            
            {/* 🎯 නිල් කොටුව අයින් කරලා, ලෝගෝ එක h-24 w-24 (පොඩ්ඩක් ලොකු) කළා */}
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center bg-transparent">
              <img src={logo} alt="Uniflow Logo" className="h-full w-full object-contain" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-1 text-sm text-gray-500">Enter your email to receive a reset link</p>
          </div>

          {message && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">{message}</div>}
          {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}