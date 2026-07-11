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
  const [showPassword, setShowPassword] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const handlePhoto = (e) => setPhoto(e.target.files[0])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
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
      showToast(err.message || 'Registration failed. Try again.', 'error')
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

      <div className="relative w-full max-w-lg z-10 my-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70 -z-10" />

        {/* --- REGISTER CARD (Balanced Version) --- */}
        <div className="bg-[#0b1528]/60 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)] border border-white/[0.08] p-5 md:p-7 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

          {/* Header Section - Sized down just a bit to save top space */}
          <div className="mb-4 text-center">
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center bg-transparent cursor-pointer">
              <img src={logo} alt="Uniflow Logo" className="h-full w-full object-contain filter drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]" />
            </div>
            <h2 className="text-xl font-black tracking-widest bg-gradient-to-r from-purple-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent">
              FCBS DIGI KUPPIYA
            </h2>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Create Portal Identity Record</p>
          </div>

          {/* Form Section - Comfortable space-y-3.5 and py-1.5 inputs */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">First Name</label>
                <input type="text" value={form.firstName} onChange={set('firstName')} className="w-full px-3.5 py-1.5 text-xs rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium" required />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">Last Name</label>
                <input type="text" value={form.lastName} onChange={set('lastName')} className="w-full px-3.5 py-1.5 text-xs rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium" required />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">Email Address</label>
              <input type="email" value={form.email} onChange={set('email')} className="w-full px-3.5 py-1.5 text-xs rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium" required />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">Mobile NO</label>
                <input type="text" value={form.mobile} onChange={set('mobile')} maxLength={10} className="w-full px-3.5 py-1.5 text-xs rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium" required />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">Reg No (YY/ms/00)</label>
                <input type="text" value={form.regNumber} onChange={set('regNumber')} className="w-full px-3.5 py-1.5 text-xs rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium" placeholder="22/ms/00" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">Department</label>
                <select value={form.department} onChange={set('department')} className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#09101d] border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium cursor-pointer" required>
                  <option value="" className="bg-[#0b1528]">Select Department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()} className="bg-[#0b1528]">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">Batch</label>
                <select value={form.batch} onChange={set('batch')} className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#09101d] border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium cursor-pointer" required>
                  <option value="" className="bg-[#0b1528]">Select Batch</option>
                  {BATCHES.map((b) => <option key={b} value={b} className="bg-[#0b1528]">{b}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">Password</label>
              <div className="relative flex items-center">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} className="w-full pl-3.5 pr-10 py-1.5 text-xs rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 font-medium" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-purple-400 transition p-1">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-wider text-purple-400 uppercase">Profile Photo</label>
              <input type="file" accept="image/jpeg,image/png" onChange={handlePhoto}
                className="w-full text-xs text-slate-400 file:mr-2.5 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-purple-600 file:to-indigo-600 file:px-3.5 file:py-1.5 file:text-[10px] file:font-extrabold file:text-white cursor-pointer" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 text-xs font-extrabold tracking-wider rounded-xl text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-90 transition duration-200 active:scale-[0.99] border border-purple-400/20 mt-1">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer Section */}
          <p className="mt-4 text-center text-[11px] text-slate-400 border-t border-white/[0.08] pt-2.5 tracking-wide font-medium">
            Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider ml-0.5">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}