import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../../services/auth'
import { useToast } from '../../contexts/ToastContext'

export default function Login() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginUser(form.email, form.password)
      showToast('Signed in successfully', 'success')
      navigate('/dashboard')
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#141726] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <img src="/favicon.svg" alt="Logo" className="mx-auto mb-3 h-20 w-20 rounded-full border-2 border-white/10 object-cover shadow-lg" />
          <h2 className="text-xl font-bold text-white">FCBS Digi Kuppiya</h2>
          <p className="mt-1 text-sm text-gray-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Email / Registration No</label>
            <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
              placeholder="you@example.com" required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#6a11cb] to-[#2575fc] py-2.5 font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-indigo-500/25 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300">Forgot password?</Link>
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Create account</Link>
        </div>
      </div>
    </div>
  )
}
