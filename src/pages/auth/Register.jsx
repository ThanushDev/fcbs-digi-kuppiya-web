import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/auth'
import { useToast } from '../../contexts/ToastContext'
import { DEPARTMENTS } from '../../utils/constants'
import { validateEmail, validateMobile, validateRegNumber, validatePassword } from '../../utils/validators'
import { User, Mail, Phone, CreditCard, BookOpen, CalendarDays, Lock, Eye, EyeOff, Upload, ArrowLeft } from 'lucide-react'
import logo from '../../assets/logo.png'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'

export default function Register() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', mobile: '',
    regNumber: '', department: '', batch: '', password: '',
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dbBatches, setDbBatches] = useState([])

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

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const batchesRef = collection(db, 'batchPermissions')
        const q = query(batchesRef, where('active', '==', true))
        const batchSnap = await getDocs(q)
        const batchList = batchSnap.docs
          .map(doc => doc.data())
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .map(data => data.batchName)
        setDbBatches(batchList)
      } catch (err) {
        console.error("Error loading register batches:", err)
      }
    }
    fetchBatches()
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!photo) return showToast('A profile photo is required to register', 'error')
    if (!validateEmail(form.email)) return showToast('Invalid email address', 'error')
    if (!validateMobile(form.mobile)) return showToast('Mobile must be exactly 10 digits', 'error')
    if (!validateRegNumber(form.regNumber, form.batch)) {
      const batchMsg = form.batch ? ` for batch ${form.batch}` : ''
      return showToast(`Invalid registration number${batchMsg}`, 'error')
    }
    if (!validatePassword(form.password)) return showToast('Password must be at least 8 characters', 'error')
    if (!form.department) return showToast('Select a department', 'error')
    if (!form.batch) return showToast('Select a batch', 'error')
    if (form.department.toLowerCase() === 'bms' && !form.regNumber.toLowerCase().includes('/ms/')) {
      return showToast('Registration number for BMS must contain "ms" (e.g., 22/ms/00)', 'error')
    }
    if (form.department.toLowerCase() === 'lcs' && !form.regNumber.toLowerCase().includes('/cs/')) {
      return showToast('Registration number for LCS must contain "cs" (e.g., 22/cs/00)', 'error')
    }
    setLoading(true)
    try {
      await registerUser({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
        mobile: form.mobile, department: form.department,
        batch: form.batch, regNumber: form.regNumber,
        photoFile: photo
      })
      showToast('Account created successfully! Please sign in.', 'success')
      navigate('/login')
    } catch (err) {
      showToast(err.message || 'Registration failed. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-gradient-to-br from-black via-slate-150 to-black p-4 md:p-6 overflow-hidden select-none">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] right-[-8%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-[3000ms] ease-in-out ${bgColors[colorIdx][0]}`} />
        <div className={`absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-[3000ms] ease-in-out ${bgColors[colorIdx][1]}`} />
        <div className={`absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-[3000ms] ease-in-out ${bgColors[colorIdx][2]}`} />
      </div>

      {/* Meke thamai max-lg eka max-w-lg widiyata hadala thiyenne Layout eka hedenna */}
      <div className="relative w-full max-w-lg z-10 my-auto max-h-[98vh] overflow-y-auto no-scrollbar">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-300/60 border border-slate-300/70 p-5 md:p-7 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />

          <div className="mb-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center">
              <img src={logo} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">FCBS DIGI KUPPIYA</h2>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Create Your Student Account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={form.firstName} onChange={set('firstName')} className="input-field !pl-10 py-1.5 text-xs" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={form.lastName} onChange={set('lastName')} className="input-field !pl-10 py-1.5 text-xs" required />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="email" value={form.email} onChange={set('email')} className="input-field !pl-10 py-1.5 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={form.mobile} onChange={set('mobile')} maxLength={10} className="input-field !pl-10 py-1.5 text-xs" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Reg No</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={form.regNumber} onChange={set('regNumber')} className="input-field !pl-10 py-1.5 text-xs" placeholder="22/ms/00" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Department</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
                  <select value={form.department} onChange={set('department')} className="select-field !pl-10 py-1.5 text-xs" required>
                    <option value="">Select</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Batch</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
                  <select value={form.batch} onChange={set('batch')} className="select-field !pl-10 py-1.5 text-xs" required>
                    <option value="">Select</option>
                    {dbBatches.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  className="input-field !pl-10 !pr-10 py-1.5 text-xs" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-600">
                Profile Photo <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50/60">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <input type="file" id="reg-photo" accept="image/jpeg,image/png" onChange={handlePhoto}
                    className="hidden" />
                  <label htmlFor="reg-photo"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3.5 py-1.5 text-[11px] font-bold text-white hover:from-indigo-600 hover:to-indigo-700 transition shadow-sm shadow-indigo-200">
                    <Upload className="w-3.5 h-3.5" />
                    {photo ? 'Change Photo' : 'Upload Photo'}
                  </label>
                  {!photo ? (
                    <p className="text-[10px] text-red-400 mt-1 font-medium">* Required — clear face photo</p>
                  ) : (
                    <p className="text-[10px] text-emerald-500 mt-1 font-medium">Photo selected</p>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || !photo}
              className="w-full py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition duration-200 active:scale-[0.99] shadow-md shadow-indigo-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400">
              {loading ? 'Creating account...' : !photo ? 'Upload a Photo First' : 'Create Account'}
            </button>
          </form>

          <p className="mt-3 text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3 font-medium">
            Already have an account?
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider ml-1">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}