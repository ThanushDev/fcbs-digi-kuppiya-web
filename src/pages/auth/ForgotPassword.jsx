import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '../../services/auth'
import { validateEmail } from '../../utils/validators'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!validateEmail(email)) return setError('Enter a valid email address')
    setLoading(true)
    try {
      await resetPassword(email)
      setMessage('Password reset link sent! Check your inbox.')
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#141726] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-white">Reset Password</h2>
          <p className="mt-1 text-sm text-gray-400">Enter your email to receive a reset link</p>
        </div>

        {message && <div className="mb-4 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400 border border-green-500/20">{message}</div>}
        {error && <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
              placeholder="you@example.com" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#6a11cb] to-[#2575fc] py-2.5 font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-indigo-500/25 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
