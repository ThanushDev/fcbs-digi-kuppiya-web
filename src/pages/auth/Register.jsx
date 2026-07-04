import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/auth'
import { useToast } from '../../contexts/ToastContext'
import { validateEmail, validateRegNumber, validateMobile, validatePassword } from '../../utils/validators'
import { DEPARTMENTS, BATCHES } from '../../utils/constants'

export default function Register() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', mobile: '', regNumber: '',
    department: '', batch: '', password: '', photo: null,
  })
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const handlePhoto = (e) => setForm({ ...form, photo: e.target.files[0] })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateEmail(form.email)) return showToast('Invalid email address', 'error')
    if (!validateMobile(form.mobile)) return showToast('Mobile must be exactly 10 digits', 'error')
    if (!validateRegNumber(form.regNumber)) return showToast('Format: YY/ms/00 or YY/cs/00', 'error')
    if (!validatePassword(form.password)) return showToast('Password must be at least 8 characters', 'error')
    if (!form.department) return showToast('Select a department', 'error')
    if (!form.batch) return showToast('Select a batch', 'error')

    setLoading(true)
    try {
      await registerUser({ ...form })
      showToast('Account created successfully!', 'success')
      navigate('/dashboard')
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/5 bg-[#141726] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-white">Create Account</h2>
          <p className="mt-1 text-sm text-gray-400">Register for FCBS Digi Kuppiya</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-400">First Name</label>
              <input type="text" value={form.firstName} onChange={set('firstName')}
                className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Last Name</label>
              <input type="text" value={form.lastName} onChange={set('lastName')}
                className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" required />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input type="email" value={form.email} onChange={set('email')}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Mobile</label>
              <input type="text" value={form.mobile} onChange={set('mobile')} maxLength={10}
                className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Reg No (YY/ms/00)</label>
              <input type="text" value={form.regNumber} onChange={set('regNumber')}
                className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Department</label>
              <select value={form.department} onChange={set('department')}
                className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" required>
                <option value="">Select</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Batch</label>
              <select value={form.batch} onChange={set('batch')}
                className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" required>
                <option value="">Select</option>
                {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input type="password" value={form.password} onChange={set('password')}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25" required />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Profile Photo</label>
            <input type="file" accept="image/jpeg,image/png" onChange={handlePhoto}
              className="w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#6a11cb] to-[#2575fc] py-2.5 font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-indigo-500/25 disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
