import { useState, useEffect } from 'react'
import { 
  getMentors, 
  addMentor, 
  updateMentor, 
  deleteMentor, 
  getMentor 
} from '../../services/firestore'
import { uploadImageToCloudinary } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { 
  Plus, Trash2, Edit, Save, X, Image, User, 
  Shield, AlertCircle, CheckCircle, Loader2 
} from 'lucide-react'

const TITLES = ['Mr', 'Ms']
const BATCHES = ['20/21', '21/22', '22/23', '23/24', '24/25', '25/26']
const DEPARTMENTS = [
  { value: 'bms', label: 'BMS (Business Management Studies)' },
  { value: 'lcs', label: 'LCS (Language & Communication Studies)' },
  { value: 'both', label: 'Both Departments' }
]

export default function MentorManager() {
  const { userData } = useAuth()
  const { showToast } = useToast()
  const isSuperAdmin = userData?.role === 'super_admin'
  
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [form, setForm] = useState({
    title: 'Ms',
    firstName: '',
    lastName: '',
    nickname: '',
    role: '',
    batch: '',
    department: 'bms',
    imageUrl: '',
    isOwner: false
  })
  
  const [editing, setEditing] = useState(null)
  const [faceVerified, setFaceVerified] = useState(false)
  const [showFaceVerify, setShowFaceVerify] = useState(false)

  const loadMentors = async () => {
    try {
      setLoading(true)
      const data = await getMentors()
      setMentors(data)
    } catch (error) {
      console.error('Error loading mentors:', error)
      toast.error('Failed to load mentors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMentors()
  }, [])

  const handleFaceVerify = async () => {
    // This would integrate with your existing face verification system
    // For now, we'll simulate it - replace with actual face verification
    setShowFaceVerify(true)
  }

  const handleFaceVerified = async (verified) => {
    setFaceVerified(verified)
    setShowFaceVerify(false)
    if (verified) {
      showToast('Face verification successful! You can now upload an image.', 'success')
    } else {
      showToast('Face verification failed. Please try again.', 'error')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!faceVerified) {
      toast.error('Please complete face verification first')
      return
    }

    setUploadingImage(true)
    try {
      const url = await uploadImageToCloudinary(file)
      if (url) {
        setForm(prev => ({ ...prev, imageUrl: url }))
        showToast('Image uploaded successfully!', 'success')
      } else {
        showToast('Failed to upload image', 'error')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Upload failed', 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  const canEditMentor = (mentor) => {
    if (!mentor.isOwner) return true
    // Owner can only be edited by superadmin, and only imageUrl
    return isSuperAdmin
  }

  const getEditableFields = (mentor) => {
    if (!mentor.isOwner) return 'all'
    return isSuperAdmin ? 'imageOnly' : 'none'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const isOwnerMentor = form.isOwner || (editing && mentors.find(m => m.id === editing)?.isOwner)
    const editableFields = getEditableFields(mentors.find(m => m.id === editing) || { isOwner: false })
    
    if (isOwnerMentor && editableFields === 'none') {
      showToast('Cannot edit owner mentor - insufficient permissions', 'error')
      return
    }

    if (!form.firstName || !form.lastName || !form.role || !form.batch || !form.department) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title,
        firstName: form.firstName,
        lastName: form.lastName,
        name: `${form.title}.${form.firstName} ${form.lastName}`,
        nickname: form.nickname,
        role: form.role,
        batch: form.batch,
        department: form.department,
        imageUrl: form.imageUrl,
        isOwner: form.isOwner
      }

      if (isOwnerMentor && editableFields === 'imageOnly') {
        // Only update imageUrl for owner
        const ownerMentor = mentors.find(m => m.id === editing)
        if (ownerMentor) {
          await updateMentor(editing, { imageUrl: form.imageUrl })
        }
      } else if (editing) {
        await updateMentor(editing, payload)
      } else {
        await addMentor(payload)
      }
      
      showToast(editing ? 'Mentor updated successfully!' : 'Mentor added successfully!', 'success')
      resetForm()
      loadMentors()
    } catch (error) {
      console.error('Save error:', error)
      showToast('Failed to save mentor', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (mentor) => {
    const editableFields = getEditableFields(mentor)
    
    setEditing(mentor.id)
    setForm({
      title: mentor.title || 'Ms',
      firstName: mentor.firstName || '',
      lastName: mentor.lastName || '',
      nickname: mentor.nickname || '',
      role: mentor.role || '',
      batch: mentor.batch || '',
      department: mentor.department || 'bms',
      imageUrl: mentor.imageUrl || mentor.image || '',
      isOwner: mentor.isOwner || false
    })
    setFaceVerified(false)
  }

  const handleDelete = async (id) => {
    const mentor = mentors.find(m => m.id === id)
    if (mentor?.isOwner) {
      showToast('Cannot delete the owner/author mentor', 'error')
      return
    }
    
    if (!window.confirm('Are you sure you want to delete this mentor?')) return
    
    try {
      await deleteMentor(id)
      showToast('Mentor deleted successfully!', 'success')
      loadMentors()
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Failed to delete mentor', 'error')
    }
  }

  const resetForm = () => {
    setEditing(null)
    setForm({
      title: 'Ms',
      firstName: '',
      lastName: '',
      nickname: '',
      role: '',
      batch: '',
      department: 'bms',
      imageUrl: '',
      isOwner: false
    })
    setFaceVerified(false)
  }

  const isOwnerEditing = editing && mentors.find(m => m.id === editing)?.isOwner
  const editableFields = isOwnerEditing ? 'imageOnly' : (editing ? 'all' : 'all')
  const isEditingOwner = editing && mentors.find(m => m.id === editing)?.isOwner

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mentor Management</h1>
        <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
          {isSuperAdmin ? 'Super Admin' : 'Admin'} Access
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? (isEditingOwner ? 'Edit Owner Mentor (Image Only)' : 'Edit Mentor') : 'Add New Mentor'}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <select 
            value={form.title} 
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            disabled={isEditingOwner}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 select-field disabled:bg-gray-50"
          >
            {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <input
            type="text"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
            disabled={isEditingOwner}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 input-field disabled:bg-gray-50"
            required
          />

          <input
            type="text"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
            disabled={isEditingOwner}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 input-field disabled:bg-gray-50"
            required
          />

          <input
            type="text"
            placeholder="Nickname (Optional)"
            value={form.nickname}
            onChange={(e) => setForm(prev => ({ ...prev, nickname: e.target.value }))}
            disabled={isEditingOwner}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 input-field disabled:bg-gray-50"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Role / Subject"
            value={form.role}
            onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
            disabled={isEditingOwner}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 input-field disabled:bg-gray-50"
            required
          />

          <select
            value={form.batch}
            onChange={(e) => setForm(prev => ({ ...prev, batch: e.target.value }))}
            disabled={isEditingOwner}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 select-field disabled:bg-gray-50"
            required
          >
            <option value="">Select Batch</option>
            {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            value={form.department}
            onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
            disabled={isEditingOwner}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 select-field disabled:bg-gray-50"
            required
          >
            {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isOwner}
                onChange={(e) => setForm(prev => ({ ...prev, isOwner: e.target.checked }))}
                disabled={editing || !isSuperAdmin}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Is Author/Owner</span>
            </label>
            {form.isOwner && (
              <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-medium">
                <Shield className="w-2.5 h-2.5 inline" /> Owner
              </span>
            )}
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Profile Image</label>
          
          {form.imageUrl && (
            <div className="mb-3 flex items-center gap-3">
              <img src={form.imageUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
              <span className="text-sm text-gray-500">Current image</span>
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={!faceVerified || uploadingImage || isEditingOwner}
                className="sr-only"
                id="mentor-image-upload"
              />
              <label 
                htmlFor="mentor-image-upload"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition ${
                  !faceVerified || uploadingImage || isEditingOwner
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload New Image'}</span>
              </label>
            </div>

            {!faceVerified && !form.imageUrl && !isEditingOwner && (
              <button
                type="button"
                onClick={handleFaceVerify}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Verify Face First</span>
              </button>
            )}

            {faceVerified && !form.imageUrl && !isEditingOwner && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" /> Face Verified
              </span>
            )}

            {isEditingOwner && !isSuperAdmin && (
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <Shield className="w-3.5 h-3.5" /> Owner - Image locked
              </span>
            )}
          </div>

          {!faceVerified && !form.imageUrl && !isEditingOwner && (
            <p className="mt-2 text-xs text-gray-500">
              <AlertCircle className="w-3 h-3 inline" /> Face verification required before uploading mentor image for security.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing ? 'Update Mentor' : 'Add Mentor'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Mentors List */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            All Mentors ({mentors.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading mentors...</div>
        ) : mentors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No mentors found. Add your first mentor above.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="p-5 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <img 
                      src={mentor.imageUrl || mentor.image || '/default-avatar.png'} 
                      alt={mentor.name} 
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{mentor.name}</h3>
                        {mentor.nickname && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                            {mentor.nickname}
                          </span>
                        )}
                        {mentor.isOwner && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-medium">
                            <Shield className="w-2.5 h-2.5" /> Owner
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          mentor.department === 'bms' ? 'bg-indigo-100 text-indigo-700' :
                          mentor.department === 'lcs' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {DEPARTMENTS.find(d => d.value === mentor.department)?.label || mentor.department}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{mentor.role}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Batch: {mentor.batch}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(mentor)}
                      disabled={mentor.isOwner && !isSuperAdmin}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title={mentor.isOwner && !isSuperAdmin ? 'Owner - Only Super Admin can edit' : 'Edit'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!mentor.isOwner && (
                      <button
                        onClick={() => handleDelete(mentor.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Face Verification Modal */}
      {showFaceVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFaceVerify(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
                <User className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Face Verification Required</h3>
              <p className="text-sm text-gray-500 mt-2">
                To upload a mentor profile image, please verify your identity using face verification.
              </p>
            </div>
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 relative overflow-hidden">
                {/* Face verification component would go here */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-indigo-50 flex items-center justify-center">
                    <User className="w-10 h-10 text-indigo-500" />
                  </div>
                  <p className="text-gray-500">Camera preview would appear here</p>
                  <p className="text-xs text-gray-400 mt-1">Integrate with existing face verification system</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleFaceVerified(false)}
                  className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFaceVerified(true)}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                >
                  Verify (Demo)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}