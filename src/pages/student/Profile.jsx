import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { updatePassword } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { db, auth } from '../../services/firebase'
import { validateMobile, validateRegNumber } from '../../utils/validators'
import useFaceVerification from '../../hooks/useFaceVerification'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export default function Profile() {
  const { user, userData, refreshUserData } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const faceOverlayRef = useRef(null)
  const { status: faceStatus, progress: scanProgress, result: faceResult, analyze: runFaceAnalysis, reset: resetFaceScan } = useFaceVerification()
  const canvasRef = useRef(null)

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
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      resetFaceScan()
      setTimeout(() => runFaceAnalysis(url, faceOverlayRef), 60)
    }
  }

  // Draw scanline animation on canvas while AI analysis is running
  useEffect(() => {
    if (!canvasRef.current || !previewUrl || faceStatus !== 'analyzing') return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = previewUrl
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw the image
      ctx.drawImage(img, 0, 0)

      // Dim overlay
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Scanline effect based on progress
      const lineY = (canvas.height * scanProgress)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)'
      ctx.fillRect(0, 0, canvas.width, lineY)

      // Corner brackets
      const bx = canvas.width * 0.15
      const by = canvas.height * 0.15
      const bw = canvas.width * 0.7
      const bh = canvas.height * 0.7
      const cl = 18
      ctx.lineWidth = 3
      ctx.strokeStyle = '#818cf8'
      // Top-left
      ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke()
      // Top-right
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke()
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke()
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke()

      // Scanning label
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('AI FACE SCAN IN PROGRESS', canvas.width / 2, 24)
    }
  }, [previewUrl, faceStatus, scanProgress])

  const uploadToCloudinary = async (file) => {
    if (!CLOUD_NAME) {
      throw new Error('Cloudinary Cloud Name is missing in environment variables.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error?.message || 'Cloudinary upload failed')
    }
    
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

    if (photo && faceStatus !== 'passed') {
      return showToast('Human face not detected. Please upload a clear photo of yourself.', 'error')
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
        updateData.hasValidFace = faceStatus === 'passed'
      }

      await updateDoc(doc(db, 'users', user.uid), updateData)

      if (passwords.current && passwords.new) {
        await updatePassword(auth.currentUser, passwords.new)
      }

      await refreshUserData()
      showToast('Profile updated successfully!', 'success')
      setPhoto(null)
      resetFaceScan()
      setPreviewUrl(null)
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
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white shrink-0 overflow-hidden">
            {previewUrl ? (
              <>
                {faceStatus === 'analyzing' ? (
                  <canvas ref={canvasRef} className="w-full h-full object-cover" />
                ) : (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Face Preview" />
                )}
                <canvas
                  ref={faceOverlayRef}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ opacity: (faceStatus === 'passed' || faceStatus === 'failed') && faceResult ? 1 : 0 }}
                />
                {faceStatus === 'passed' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-emerald-100/80 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                )}
                {faceStatus === 'failed' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-rose-100/80 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                  </div>
                )}
              </>
            ) : currentImageSrc ? (
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

        {previewUrl && (
          <div className={`rounded-xl border p-4 transition-all duration-300 ${
            faceStatus === 'passed' ? 'border-emerald-300 bg-emerald-50/40' :
            faceStatus === 'failed' ? 'border-rose-300 bg-rose-50/40' :
            faceStatus === 'analyzing' ? 'border-indigo-300 bg-indigo-50/30' :
            'border-slate-200 bg-white/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className={`w-4 h-4 ${
                faceStatus === 'passed' ? 'text-emerald-500' :
                faceStatus === 'failed' ? 'text-rose-500' :
                faceStatus === 'analyzing' ? 'text-indigo-500 animate-pulse' :
                'text-slate-400'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Face Verification</span>
              {faceStatus === 'passed' && <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>}
              {faceStatus === 'failed' && <span className="ml-auto text-[10px] font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Failed</span>}
            </div>

            {faceStatus === 'analyzing' && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-indigo-600">Analyzing Face Structure...</span>
                </div>
                <p className="text-[10px] text-slate-400">Scanning facial features & landmarks</p>
              </div>
            )}

            {faceStatus === 'passed' && (
              <p className="text-xs text-emerald-600 text-center font-semibold flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Human face detected & verified successfully
              </p>
            )}

            {faceStatus === 'failed' && (
              <p className="text-xs font-semibold text-rose-600 text-center leading-relaxed">
                Face verification failed! No clear human face detected. Please upload a clear photo of your face.
              </p>
            )}

            {faceStatus === 'idle' && (
              <p className="text-xs text-slate-500 text-center font-medium">
                <svg className="w-3.5 h-3.5 inline mr-1 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110 4.75V3h4v1.75a2 2 0 001.664.89l.812 1.2A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Upload a clear face photo for verification
              </p>
            )}

            {faceStatus === 'analyzing' && (
              <div className="mt-2 w-full py-2 rounded-xl bg-indigo-100 text-xs font-bold text-indigo-400 text-center flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                AI Scanning for human face...
              </div>
            )}

            {faceStatus === 'error' && (
              <div className="mt-2 w-full py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-500 text-center">
                Face verification unavailable. Please check your connection and try again.
              </div>
            )}

            <div className="mt-2 flex items-start gap-1.5 bg-amber-50 border border-amber-200/60 rounded-xl p-2.5">
              <svg className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-[10px] text-amber-700 leading-relaxed">
                Non-human images (flowers, animals, objects) will be rejected. A valid human face is required to proceed.
              </p>
            </div>
          </div>
        )}

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