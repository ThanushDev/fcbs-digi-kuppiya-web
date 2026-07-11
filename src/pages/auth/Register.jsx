import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/auth' 
import { useToast } from '../../contexts/ToastContext'
import { DEPARTMENTS, BATCHES } from '../../utils/constants'
import { validateEmail, validateMobile, validateRegNumber, validatePassword } from '../../utils/validators'
import logo from '../../assets/logo.png' 

export default function Register() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', mobile: '',
    regNumber: '', department: '', batch: '', password: '',
  })
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handlePhoto = (e) => setPhoto(e.target.files[0])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 🛡️ Validation Checks
    if (!validateEmail(form.email)) return showToast('Invalid email address', 'error')
    if (!validateMobile(form.mobile)) return showToast('Mobile must be exactly 10 digits', 'error')
    if (!validateRegNumber(form.regNumber, form.batch)) {
      const batchMsg = form.batch ? ` for batch ${form.batch}` : ''
      return showToast(`Invalid registration number${batchMsg}`, 'error')
    }
    if (!validatePassword(form.password)) return showToast('Password must be at least 8 characters', 'error')
    if (!form.department) return showToast('Select a department', 'error')
    if (!form.batch) return showToast('Select a batch', 'error')

    setLoading(true)
    try {
      // 🚀 සර්විස් එකට මුළු දත්ත Object එකම ක්‍රමවත්ව යවනවා
      await registerUser({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        mobile: form.mobile,
        department: form.department,
        batch: form.batch,
        regNumber: form.regNumber,
        photoFile: photo 
      })
      
      showToast('Account created successfully! Please sign in.', 'success')
      navigate('/login')
    } catch (err) {
      // Firebase එකෙන් එන ඕනෑම error එකක් Toast එකෙන් පෙන්වනවා
      showToast(err.message || 'Registration failed. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg animate-slide-up my-auto py-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center bg-transparent">
              <img src={logo} alt="Uniflow Logo" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-wide">FCBS DIGI KUPPIYA</h2>
            <p className="mt-0.5 text-xs text-gray-500">Register for your fcbs kuppiya account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">First Name</label>
                <input type="text" value={form.firstName} onChange={set('firstName')} className="input-field py-1.5 text-sm" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Last Name</label>
                <input type="text" value={form.lastName} onChange={set('lastName')} className="input-field py-1.5 text-sm" required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="input-field py-1.5 text-sm" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mobile</label>
                <input type="text" value={form.mobile} onChange={set('mobile')} maxLength={10} className="input-field py-1.5 text-sm" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Reg No (YY/ms/00)</label>
                <input type="text" value={form.regNumber} onChange={set('regNumber')} className="input-field py-1.5 text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Department</label>
                <select value={form.department} onChange={set('department')} className="select-field py-1.5 text-sm" required>
                  <option value="">Select</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Batch</label>
                <select value={form.batch} onChange={set('batch')} className="select-field py-1.5 text-sm" required>
                  <option value="">Select</option>
                  {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Password</label>
              <input type="password" value={form.password} onChange={set('password')} className="input-field py-1.5 text-sm" required />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Profile Photo</label>
              <input type="file" accept="image/jpeg,image/png" onChange={handlePhoto}
                className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700 transition" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2 text-sm font-semibold mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-3 text-center text-xs text-gray-500">
            Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}