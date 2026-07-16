import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { BATCHES, DEPARTMENTS } from '../../utils/constants'
import { exportToCSV } from '../../utils/export'

const PAGE_SIZE = 20

// 🎯 Cloudinary URL එකේ තියෙන පරණ සේරම ලෙඩ ටික (File Extensions / uploads folder / missing domain) ඩයිනමික් Fix කරන සුපිරිම ෆන්ෂන් එක
const fixCloudinaryUrl = (url, firstName, lastName) => {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${firstName || 'User'}+${lastName || ''}&background=6366f1&color=fff&size=40`;
  
  if (!url) return defaultAvatar;
  
  let fixedUrl = url.trim();

  // 1. URL එක සම්පූර්ණ එකක් නෙමෙයි නම් (කෙලින්ම uploads/ වලින් පටන් ගන්නවා නම්) Cloudinary Base URL එක එකතු කරනවා
  if (!fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
    fixedUrl = `https://res.cloudinary.com/ddn08cpkt/image/upload/${fixedUrl}`;
  }

  // 2. URL එක ඇතුලේ තියෙන 'uploads/' කෑල්ල (ස්ලෑෂ් තිබ්බත් නැතත්) සම්පූර්ණයෙන්ම අයින් කරනවා
  fixedUrl = fixedUrl.replace('uploads/', '');
  
  // සමහර විට මැදට double slashes (//) හැදුනොත් ඒකත් clean කරනවා
  fixedUrl = fixedUrl.replace('upload//', 'upload/');

  // 3. Cloudinary Auto-Format මැජික් එක දානවා ඕනෑම file type (.png, .jpeg, .webp) එකක් ඔටෝ අඳුරගන්න
  if (fixedUrl.includes('res.cloudinary.com')) {
    if (!fixedUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      fixedUrl = `${fixedUrl}.jpg`;
    }
    
    // f_auto එක නැත්නම් විතරක් ඒක මැදට ඇතුල් කරනවා
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

  // 🎯 Infinite Loop වැළැක්වීමට useCallback භාවිතා කළා
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

  // 📸 1. Admin ට User ගේ නොගැලපෙන Profile Pic එක විතරක් Delete කරන්න පුළුවන් බටන් එකක ක්‍රියාකාරීත්වය
  const handleDeleteImage = async (uid) => {
    if (!confirm('Are you sure you want to delete this user\'s profile image? User will be forced to upload a new human face image upon login.')) return
    try {
      await updateDoc(doc(db, 'users', uid), {
        photoURL: '',
        profilePic: '',
        profile_pic: '',
        hasValidFace: false // User ලොග් වෙද්දී බ්ලොක් කරන්න ෆ්ලෑග් එකක් දානවා
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

      // 📸 Admin barriers removed - no forced human face checks or mandatory image uploads here
      if (editPhoto) {
        // මෙතනදී Cloudinary හෝ Firebase storage එකට upload කරලා URL එක ගන්න කෑල්ල (Project configuration එක අනුව)
        // උදාහරණයක් ලෙස: updatedData.photoURL = uploadedUrl;
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
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500" />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500">
          <option value="">All Depts</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
        </select>
        <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500">
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
                  
                  // 🎯 ඩේටාබේස් එකේ තියෙන ඕනෑම ප්‍රොෆයිල් පික්චර් ෆීල්ඩ් එකක් සිලෙක්ට් කරලා Fix කරනවා
                  const rawImgUrl = u.photoURL || u.profilePic || u.profile_pic;
                  const finalImgUrl = fixCloudinaryUrl(rawImgUrl, u.firstName, u.lastName);
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={finalImgUrl}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            // ⚡ සර්වර් එකෙන්ම ෆයිල් එක සම්පූර්ණයෙන්ම මැකිලා තිබ්බොත් විතරක් UI-Avatar එකට Fallback වෙනවා
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
                          {/* 📸 Manual Profile Pic Delete Button */}
                          <button onClick={() => handleDeleteImage(u.id)} title="Delete Profile Image"
                            className="p-2 bg-amber-50 rounded-lg hover:text-amber-600 transition text-amber-500 border border-amber-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" stroke="red" strokeWidth={3} />
                            </svg>
                          </button>
                          <button onClick={() => openEdit(u)}
                            className="p-2 bg-gray-100 rounded-lg hover:text-indigo-600 transition text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(u.id)}
                            className="p-2 bg-gray-100 rounded-lg hover:text-red-600 transition text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none transition">
                Previous
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                className="px-4 py-2 bg-indigo-600 rounded-lg text-xs text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={fullImage} className="max-w-full max-h-full rounded-lg shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()} alt="" />
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditUser(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-900 text-xl">&times;</button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">First Name</label>
                  <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Last Name</label>
                  <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500" required />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Mobile</label>
                  <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Reg Number</label>
                  <input type="text" value={editForm.regNumber} onChange={(e) => setEditForm({ ...editForm, regNumber: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Department</label>
                  <select value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500">
                    <option value="">Select</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Batch</label>
                  <select value={editForm.batch} onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500">
                    <option value="">Select</option>
                    {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* 📸 Human face barrier removed from label too */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">Update Profile Photo</label>
                <input type="file" accept="image/jpeg,image/png" onChange={(e) => setEditPhoto(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold hover:file:bg-gray-200 cursor-pointer" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)}
                  className="rounded-lg bg-gray-100 px-5 py-2 text-sm text-gray-600 hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
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