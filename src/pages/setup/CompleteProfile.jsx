import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { DEPARTMENTS, BATCHES } from '../../utils/constants'
import { validateRegNumber } from '../../utils/validators'

export default function CompleteProfile() {
  const { user, userData, refreshUserData } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [regNumber, setRegNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const batch = userData?.batch || ''
    if (!validateRegNumber(regNumber, batch)) {
      const batchMsg = batch ? ` for batch ${batch} (must start with ${batch.split('/')[0]} or ${parseInt(batch.split('/')[1]) - 1})` : ''
      return showToast(`Invalid registration number${batchMsg}`, 'error')
    }

    // Additional validation for BMS/LCS department
    const userDept = userData?.department?.toLowerCase() || ''
    if (userDept === 'bms' && !regNumber.toLowerCase().includes('/ms/')) {
      return showToast('Registration number for BMS must contain "ms" (e.g., 22/ms/001)', 'error')
    }
    if (userDept === 'lcs' && !regNumber.toLowerCase().includes('/cs/')) {
      return showToast('Registration number for LCS must contain "cs" (e.g., 22/cs/001)', 'error')
    }

    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { regNumber })
      await refreshUserData()
      showToast('Profile completed successfully!', 'success')
      navigate('/dashboard')
    } catch (err) {
      showToast(err.message, 'error')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="mt-2 text-sm text-gray-500">
              Welcome back! Please provide your Registration Number to continue.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shrink-0">
                {userData?.firstName?.[0] || 'U'}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{userData?.firstName} {userData?.lastName}</p>
                <p className="text-[10px] text-gray-500">{userData?.department?.toUpperCase()} | Batch {userData?.batch}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Registration Number</label>
              <input type="text" value={regNumber} onChange={(e) => setRegNumber(e.target.value)}
                placeholder={userData?.department === 'bms' ? '22/ms/000' : '22/cs/000'}
                className="input-field" required autoFocus />
              <p className="mt-1.5 text-[10px] text-gray-400">
                {userData?.batch
                  ? `Must start with ${userData.batch.split('/')[0]} or ${parseInt(userData.batch.split('/')[1]) - 1} for batch ${userData.batch}`
                  : 'Format: YY/ms/000 or YY/cs/000'}
              </p>
            </div>

            <button type="submit" disabled={loading || !regNumber.trim()}
              className="btn-primary w-full">
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
