import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { BATCHES, DEPARTMENTS } from '../../utils/constants'
import { exportToCSV } from '../../utils/export'
import { Trash2, Edit3, ImageOff, X } from 'lucide-react'

const PAGE_SIZE = 20

// Dynamically fix Cloudinary URLs (file extensions, uploads folder, missing domain)
const fixCloudinaryUrl = (url, firstName, lastName) => {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${firstName || 'User'}+${lastName || ''}&background=6366f1&color=fff&size=40`;
  
  if (!url) return defaultAvatar;
  
  let fixedUrl = url.trim();

  // 1. Prepend Cloudinary base URL if incomplete
  if (!fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
    fixedUrl = `https://res.cloudinary.com/ddn08cpkt/image/upload/${fixedUrl}`;
  }

  // 2. Remove 'uploads/' segment
  fixedUrl = fixedUrl.replace('uploads/', '');
  
  // Clean double slashes
  fixedUrl = fixedUrl.replace('upload//', 'upload/');

  // 3. Auto-format for any file type
  if (fixedUrl.includes('res.cloudinary.com')) {
    if (!fixedUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      fixedUrl = `${fixedUrl}.jpg`;
    }
    
    if (!fixedUrl.includes('f_auto')) {
      fixedUrl = fixedUrl.replace('/upload/', '/upload/f_auto/');
    }
  }
  
  return fixedUrl;
};

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [page, setPage] = useState(1)
  const [fullImage, setFullImage] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', mobile: '', regNumber: '', department: '', batch: '', role: '' })
  const [editPhoto, setEditPhoto] = useState(null)
  const [saving, setSaving] = useState(false)

  // Prevent infinite loop with useCallback
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    load() 
  }, [load])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.mobile?.toLowerCase().includes(q) || u.regNumber?.toLowerCase().includes(q)
    const matchDept = !filterDept || u.department === filterDept
    const matchBatch = !filterBatch || u.batch === filterBatch
    return matchSearch && matchDept && matchBatch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, filterDept, filterBatch])

  const handleDelete = async (uid) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return
    await deleteDoc(doc(db, 'users', uid))
    setEditUser(null)
    load()
  }

  // Delete user's profile image only
  const handleDeleteImage = async (uid) => {
    if (!confirm('Are you sure you want to delete this user\'s profile image? User will be forced to upload a new image upon login.')) return
    try {
      await updateDoc(doc(db, 'users', uid), {
        photoURL: '',
        profilePic: '',
        profile_pic: '',
        hasValidFace: false
      })
      load()
    } catch (err) {
      alert("Failed to delete image: " + err.message)
    }
  }

  const openEdit = (u) => {
    setEditUser(u)
    setEditPhoto(null)
    setEditForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      mobile: u.mobile || '',
      regNumber: u.regNumber || '',
      department: u.department || '',
      batch: u.batch || '',
      role: u.role || 'student',
    })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let updatedData = { ...editForm }

      if (editPhoto) {
        // Cloudinary/Firebase storage upload logic here
      }

      await updateDoc(doc(db, 'users', editUser.id), updatedData)
      setEditUser(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">User Management</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, mobile or reg no..."
          className="input-field flex-1 min-w-[200px]" />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          className="select-field">
          <option value="">All Depts</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
        </select>
        <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}
          className="select-field">
          <option value="">All Batches</option>
          {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={() => exportToCSV(filtered, 'users_export', [
          { label: 'First Name', accessor: (u) => u.firstName },
          { label: 'Last Name', accessor: (u) => u.lastName },
          { label: 'Email', accessor: (u) => u.email },
          { label: 'Mobile', accessor: (u) => u.mobile },
          { label: 'Role', accessor: (u) => u.role },
          { label: 'Department', accessor: (u) => u.department },
          { label: 'Batch', accessor: (u) => u.batch },
          { label: 'Reg Number', accessor: (u) => u.regNumber },
        ])}
          className="rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition">
          Export CSV
        </button>
        <span className="text-sm text-gray-500">{filtered.length} users</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading users...</div>
      ) : paged.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">No users found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Student</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Academic</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Registration No</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paged.map((u) => {
                  const defaultAvatar = `https://ui-avatars.com/api/?name=${u.firstName || 'User'}+${u.lastName || ''}&background=6366f1&color=fff&size=40`;
                  
                  // Select and fix any profile pic field from database
                  const rawImgUrl = u.photoURL || u.profilePic || u.profile_pic;
                  const finalImgUrl = fixCloudinaryUrl(rawImgUrl, u.firstName, u.lastName);
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={finalImgUrl}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            // Fallback to UI-Avatar only if file is fully deleted from server
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = defaultAvatar;
                            }}
                            onClick={() => setFullImage(finalImgUrl)} 
                            alt=""
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{u.firstName} {u.lastName}</div>
                            <div className="text-[10px] text-gray-500">#{u.id?.slice(0, 8) || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{u.email}</div>
                        <div className="text-[10px] text-gray-500">{u.mobile || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${u.department === 'bms' ? 'badge-indigo' : 'badge-yellow'}`}>
                          {u.department?.toUpperCase() || '—'}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">Batch {u.batch || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{u.regNumber || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Manual Profile Pic Delete Button */}
                          <button onClick={() => handleDeleteImage(u.id)} title="Delete Profile Image"
                            className="p-2 bg-amber-50 rounded-lg hover:text-amber-600 transition text-amber-500 border border-amber-200">
                            <ImageOff className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(u)}
                            className="p-2 bg-gray-100 rounded-lg hover:text-indigo-600 transition text-gray-500">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(u.id)}
                            className="p-2 bg-gray-100 rounded-lg hover:text-red-600 transition text-gray-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-[11px] text-gray-500">
              Page <span className="text-gray-900">{page}</span> of <span className="text-gray-900">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                className="pagination-btn">
                Previous
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                className="pagination-btn pagination-btn-active">
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Full Screen Image Overlay */}
      {fullImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFullImage(null)}>
          <button onClick={() => setFullImage(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition">
            <X className="w-8 h-8" />
          </button>
          <img src={fullImage} className="max-w-full max-h-full rounded-lg shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()} alt="" />
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditUser(null)}>
          <div className="w-full max-w-lg card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">First Name</label>
                  <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="input-field" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Last Name</label>
                  <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="input-field" required />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input-field" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Mobile</label>
                  <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Reg Number</label>
                  <input type="text" value={editForm.regNumber} onChange={(e) => setEditForm({ ...editForm, regNumber: e.target.value })}
                    className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Department</label>
                  <select value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="select-field">
                    <option value="">Select</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Batch</label>
                  <select value={editForm.batch} onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                    className="select-field">
                    <option value="">Select</option>
                    {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="select-field">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Update Profile Photo</label>
                <input type="file" accept="image/jpeg,image/png" onChange={(e) => setEditPhoto(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold hover:file:bg-gray-200 cursor-pointer" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)}
                  className="rounded-lg bg-gray-100 px-5 py-2 text-sm text-gray-600 hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
