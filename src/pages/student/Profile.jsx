import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { updatePassword } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { db, auth } from '../../services/firebase'
import { validateMobile, validateRegNumber } from '../../utils/validators'

const CLOUD_NAME = 'your_cloud_name'
const UPLOAD_PRESET = 'kuppiya_preset'

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
  const [previewUrl, setPreviewUrl] = useState(null)
  const [passwords, setPasswords] = useState({ current: '', new: '' })
  const [saving, setSaving] = useState(false)

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('cloud_name', CLOUD_NAME)
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) throw new Error('Cloudinary upload failed')
    const data = await response.json()
    return data.secure_url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.mobile && !validateMobile(form.mobile)) return showToast('Mobile must be exactly 10 digits', 'error')
    if (form.regNumber && !validateRegNumber(form.regNumber, userData?.batch)) {
      const batchMsg = userData?.batch ? ` for batch ${userData.batch}` : ''
      return showToast(`Invalid registration number${batchMsg}`, 'error')
    }

    setSaving(true)
    try {
      const updateData = {
        firstName: form.firstName,
        lastName: form.lastName,
        mobile: form.mobile,
        regNumber: form.regNumber,
      }

      if (photo) {
        showToast('Uploading new profile photo...', 'info')
        const uploadedPhotoUrl = await uploadToCloudinary(photo)
        updateData.photoURL = uploadedPhotoUrl
        updateData.profile_pic = uploadedPhotoUrl
      }

      await updateDoc(doc(db, 'users', user.uid), updateData)

      if (passwords.current && passwords.new) {
        await updatePassword(auth.currentUser, passwords.new)
      }

      await refreshUserData()
      showToast('Profile updated successfully!', 'success')
      setPhoto(null)
    } catch (err) {
      showToast(err.message, 'error')
    }
    setSaving(false)
  }

  const currentImageSrc = previewUrl || userData?.photoURL || userData?.profile_pic
  const hasRegNumber = !!userData?.regNumber

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Profile</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shrink-0 overflow-hidden">
            {currentImageSrc ? (
              <img src={currentImageSrc} className="h-full w-full object-cover" alt="Profile" />
            ) : (
              userData?.firstName?.[0] || 'U'
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{userData?.firstName} {userData?.lastName}</p>
            <p className="text-xs text-gray-500 capitalize">{userData?.role} | {userData?.department} | Batch {userData?.batch}</p>
            <label className="mt-1 inline-block cursor-pointer text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Change Photo
              <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">First Name</label>
            <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="input-field" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Last Name</label>
            <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="input-field" required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
          <input type="email" value={form.email} disabled className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Mobile</label>
            <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} maxLength={10}
              className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Registration No</label>
            <input type="text" value={form.regNumber}
              onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
              disabled={hasRegNumber}
              className="input-field" />
            {hasRegNumber && <p className="mt-1 text-[10px] text-gray-400">Registration number cannot be changed after registration.</p>}
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Current Password</label>
            <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">New Password</label>
            <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="input-field" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
