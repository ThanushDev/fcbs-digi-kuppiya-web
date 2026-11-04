import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getMentors,
  addMentor,
  updateMentor,
  deleteMentor,
} from '../../services/firestore'
import { uploadImageToCloudinary } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Plus, Trash2, Edit, Image, User,
  Shield, AlertCircle, CheckCircle, Loader2,
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
  const [isEditingOwner, setIsEditingOwner] = useState(false)
  const [faceVerified, setFaceVerified] = useState(false)
  const fileInputRef = useRef(null)

  const loadMentors = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getMentors()
      setMentors(data)
    } catch (error) {
      console.error('Error loading mentors:', error)
      showToast('Failed to load mentors', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadMentors()
  }, [loadMentors])

  const handleFaceVerify = async () => {
    setFaceVerified(true)
    showToast('Face verified successfully! You can now upload an image.', 'success')
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Allow editing existing image without face verification
    const hasExistingImage = !!form.imageUrl
    if (!faceVerified && !hasExistingImage) {
      showToast('Please complete face verification first', 'error')
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

  const handleSubmit = async (e) => {
    e.preventDefault()

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
        nickname: form.nickname,
        role: form.role,
        batch: form.batch,
        department: form.department,
        imageUrl: form.imageUrl,
        isOwner: form.isOwner
      }

      if (editing) {
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
    setEditing(mentor.id)
    setIsEditingOwner(!!mentor.isOwner)
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
    if (!mentor.imageUrl && !mentor.image) {
      setFaceVerified(false)
    }
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
    setIsEditingOwner(false)
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
                ref={fileInputRef}
                onChange={handleImageUpload}
                disabled={(isEditingOwner && !isSuperAdmin) || (!faceVerified && !form.imageUrl) || uploadingImage}
                className="sr-only"
                id="mentor-image-upload"
              />
              <label
                onClick={(e) => {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition ${
                  (isEditingOwner && !isSuperAdmin) || (!faceVerified && !form.imageUrl) || uploadingImage
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
                <Shield className="w-2.5 h-2.5" /> Owner - Image locked
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
          <div className="p-8 text-center text-gray-400">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500">Loading mentors...</p>
          </div>
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
    </div>
  )
}








