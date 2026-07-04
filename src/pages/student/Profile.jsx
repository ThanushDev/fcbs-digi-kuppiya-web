import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updatePassword } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { db, storage, auth } from '../../services/firebase'
import { validateMobile, validateRegNumber } from '../../utils/validators'

export default function Profile() {
  const { user, userData, refreshUserData } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || '',
    mobile: userData?.mobile || '',
    regNumber: userData?.regNumber || '',
  })
  const [photo, setPhoto] = useState(null)
  const [passwords, setPasswords] = useState({ current: '', new: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.mobile && !validateMobile(form.mobile)) return showToast('Mobile must be exactly 10 digits', 'error')
    if (form.regNumber && !validateRegNumber(form.regNumber)) return showToast('Format: YY/ms/00 or YY/cs/00', 'error')
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        mobile: form.mobile,
        regNumber: form.regNumber,
      })
      if (photo) {
        const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${photo.name}`)
        const snap = await uploadBytes(storageRef, photo)
        const photoURL = await getDownloadURL(snap.ref)
        await updateDoc(doc(db, 'users', user.uid), { photoURL })
      }
      if (passwords.current && passwords.new) {
        await updatePassword(auth.currentUser, passwords.new)
      }
      await refreshUserData()
      showToast('Profile updated successfully!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">My Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-800 bg-[#141726] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shrink-0 overflow-hidden">
            {userData?.photoURL ? <img src={userData.photoURL} className="h-full w-full object-cover" alt="" /> : (userData?.firstName?.[0] || 'U')}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{userData?.firstName} {userData?.lastName}</p>
            <p className="text-xs text-gray-500 capitalize">{userData?.role} | {userData?.department} | Batch {userData?.batch}</p>
            <label className="mt-1 inline-block cursor-pointer text-xs text-indigo-400 hover:text-indigo-300">
              Change Photo
              <input type="file" accept="image/jpeg,image/png" onChange={(e) => setPhoto(e.target.files[0])} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">First Name</label>
            <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Last Name</label>
            <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-400">Email</label>
          <input type="email" value={form.email} disabled
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-500 outline-none cursor-not-allowed" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Mobile</label>
            <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} maxLength={10}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Registration No</label>
            <input type="text" value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
          </div>
        </div>

        <hr className="border-gray-800" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Current Password</label>
            <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">New Password</label>
            <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full rounded-lg bg-gradient-to-r from-[#6a11cb] to-[#2575fc] py-2.5 font-semibold text-white shadow-lg transition hover:translate-y-[-1px] disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
