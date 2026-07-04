import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'

export default function AdminManagement() {
  const [admins, setAdmins] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState('')

  const load = async () => {
    setLoading(true)
    const adminSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')))
    setAdmins(adminSnap.docs.map((d) => ({ id: d.id, ...d.data() })))

    const allSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')))
    setAllUsers(allSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAddAdmin = async () => {
    if (!selectedUser) return
    if (!confirm('Promote this user to Admin?')) return
    await updateDoc(doc(db, 'users', selectedUser), { role: 'admin' })
    setSelectedUser('')
    load()
  }

  const handleRemoveAdmin = async (uid) => {
    if (!confirm('Remove admin privileges from this user?')) return
    await updateDoc(doc(db, 'users', uid), { role: 'student' })
    load()
  }

  const handleDeleteUser = async (uid) => {
    if (!confirm('Permanently delete this user account? This cannot be undone.')) return
    await deleteDoc(doc(db, 'users', uid))
    load()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Admin Management</h1>

      <div className="mb-8 rounded-xl border border-gray-800 bg-[#141726] p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">Add New Admin</h2>
        <div className="flex gap-3">
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-amber-500">
            <option value="">Select a student to promote...</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.email} ({u.department} {u.batch})</option>
            ))}
          </select>
          <button onClick={handleAddAdmin} disabled={!selectedUser}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition">
            Promote to Admin
          </button>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-white">Current Admins ({admins.length})</h2>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No admins yet.</div>
      ) : (
        <div className="space-y-3">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#141726] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
                  {a.firstName?.[0] || 'A'}
                </div>
                <div>
                  <p className="font-semibold text-white">{a.firstName} {a.lastName}</p>
                  <p className="text-xs text-gray-500">{a.email} · {a.department?.toUpperCase()} · {a.batch}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRemoveAdmin(a.id)}
                  className="rounded-lg bg-red-600/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/30 transition">
                  Demote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
