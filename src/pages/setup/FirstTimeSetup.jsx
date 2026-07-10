import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth' // 🎯 Firebase SignOut එක ගත්තා
import { auth, db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { DEPARTMENTS, BATCHES } from '../../utils/constants'

export default function FirstTimeSetup() {
  const { user, userData, needsProfileSetup, refreshUserData } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [formData, setFormData] = useState({
    regNumber: '',
    department: '',
    batch: ''
  })

  // 🎯 Security check: If profile is already complete, redirect to dashboard
  useEffect(() => {
    if (user && !needsProfileSetup) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, needsProfileSetup, navigate])

  // Pre-load existing data into the form if available
  useEffect(() => {
    if (userData) {
      setFormData({
        regNumber: userData.regNumber || '',
        department: userData.department || '',
        batch: userData.batch || ''
      })
    }
  }, [userData])

  // Check exactly which fields are missing
  const userPhoto = userData?.photoURL || userData?.profilePic || userData?.profile_pic;
  const isImageMissing = !userPhoto || String(userPhoto).includes('profile_');
  const isRegMissing = !userData?.regNumber || userData?.regNumber.trim() === '';
  const isDeptMissing = !userData?.department || userData?.department.trim() === '';
  const isBatchMissing = !userData?.batch || userData?.batch.trim() === '';

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  // 🎯 ආපහු Login එකට යන්න Logout වෙන Function එක
  const handleCancelAndLogout = async () => {
    try {
      await signOut(auth) // Firebase එකෙන් යූසර්ව Sign Out කරනවා
      navigate('/login', { replace: true }) // කෙලින්ම Login පේජ් එකට යවනවා
    } catch (error) {
      console.error("Logout Error:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isImageMissing && !image) {
      alert("Please upload a clear photograph of your face for verification!")
      return
    }

    setLoading(true)
    try {
      let imageUrl = userPhoto || ''

      // 1. Image upload (only if a new one is selected)
      if (image) {
        const data = new FormData()
        data.append("file", image)
        data.append("upload_preset", "kuppiya_preset") 
        data.append("cloud_name", "ddn08cpkt")

        const res = await fetch("https://api.cloudinary.com/v1_1/ddn08cpkt/image/upload", {
          method: "POST",
          body: data
        })

        if (!res.ok) {
          const errData = await res.json()
          console.error("Cloudinary Detailed Error:", errData)
          throw new Error("Cloudinary upload failed")
        }

        const fileData = await res.json()
        if (fileData.secure_url) {
          imageUrl = fileData.secure_url
        }
      }

      // 2. Update Firestore document
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        photoURL: imageUrl,
        profilePic: imageUrl,
        regNumber: formData.regNumber.trim(),
        department: formData.department.toLowerCase(),
        batch: formData.batch,
        profileCompleted: true
      })

      // Refresh data inside AuthContext
      await refreshUserData(user.uid)
      
      // Success Alert එක අයින් කරලා කෙලින්ම Dashboard එකට දානවා
      navigate('/dashboard', { replace: true })

    } catch (error) {
      console.error(error)
      alert("An error occurred while saving your details! Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="text-xs text-gray-500 mt-1">Please provide the missing details below to access the platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 📸 Image Upload Section */}
          {isImageMissing && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
              {preview ? (
                <img src={preview} className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-md" alt="Face Preview" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              
              <label className="mt-3 cursor-pointer inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">
                <span>Upload Face Image *</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">⚠️ Ensure your face is clearly visible without hats or sunglasses for face verification.</p>
            </div>
          )}

          {/* 🆔 Registration Number */}
          {isRegMissing && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number *</label>
              <input 
                type="text" 
                placeholder="e.g., 22/ms/00"
                value={formData.regNumber}
                onChange={(e) => setFormData({...formData, regNumber: e.target.value})}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500" 
                required 
              />
            </div>
          )}

          {/* 🏫 Department */}
          {isDeptMissing && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
              <select 
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS?.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
              </select>
            </div>
          )}

          {/* 🎓 Batch */}
          {isBatchMissing && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Batch *</label>
              <select 
                value={formData.batch}
                onChange={(e) => setFormData({...formData, batch: e.target.value})}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select Batch</option>
                {BATCHES?.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {/* 🚀 Action Buttons */}
          <div className="space-y-2 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-md shadow-indigo-200"
            >
              {loading ? 'Saving Changes...' : 'Confirm & Proceed'}
            </button>

            {/* 🎯 මෙන්න මචං ආපහු Login එකට යන්න දාපු Cancel/Logout බටන් එක */}
            <button 
              type="button"
              onClick={handleCancelAndLogout}
              disabled={loading}
              className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
            >
              Cancel & Back to Login
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}