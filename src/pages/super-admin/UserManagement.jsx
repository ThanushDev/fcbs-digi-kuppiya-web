import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { BATCHES, DEPARTMENTS } from '../../utils/constants'
import { exportToCSV } from '../../utils/export'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  const load = async () => {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.regNumber?.toLowerCase().includes(q)
    const matchDept = !filterDept || u.department === filterDept
    const matchBatch = !filterBatch || u.batch === filterBatch
    return matchSearch && matchDept && matchBatch
  })

  const handleDelete = async (uid) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return
    await deleteDoc(doc(db, 'users', uid))
    setSelectedUser(null)
    load()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">User Management</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or reg no..."
          className="flex-1 min-w-[200px] rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-amber-500" />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-amber-500">
          <option value="">All Depts</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
        </select>
        <button onClick={() => exportToCSV(filtered, 'users_export', [
          { label: 'First Name', accessor: (u) => u.firstName },
          { label: 'Last Name', accessor: (u) => u.lastName },
          { label: 'Email', accessor: (u) => u.email },
          { label: 'Role', accessor: (u) => u.role },
          { label: 'Department', accessor: (u) => u.department },
          { label: 'Batch', accessor: (u) => u.batch },
          { label: 'Reg Number', accessor: (u) => u.regNumber },
          { label: 'Mobile', accessor: (u) => u.mobile },
          { label: 'Verified', accessor: (u) => u.isFaceVerified ? 'Yes' : 'No' },
          { label: 'Created', accessor: (u) => u.createdAt?.toDate?.().toISOString() || '' },
        ])}
          className="rounded-lg bg-emerald-600/20 px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition">
          Export CSV
        </button>
        <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}
          className="rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-amber-500">
          <option value="">All Batches</option>
          {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="self-center text-sm text-gray-500">{filtered.length} users</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No users found.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => (
            <div key={u.id}
              className="rounded-xl border border-gray-800 bg-[#141726] p-5 cursor-pointer transition hover:border-amber-500/50 hover:shadow-lg"
              onClick={() => setSelectedUser(u)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white shrink-0">
                  {u.firstName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-gray-500">{u.email}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${u.role === 'admin' ? 'bg-amber-600/20 text-amber-400' : u.role === 'super_admin' ? 'bg-red-600/20 text-red-400' : 'bg-indigo-600/20 text-indigo-400'}`}>
                  {u.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>Dept: {u.department?.toUpperCase()}</span>
                <span>Batch: {u.batch || '—'}</span>
                <span>Reg: {u.regNumber || '—'}</span>
                <span>Mobile: {u.mobile || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-[#141726] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Full Profile</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-600 text-2xl font-bold text-white shrink-0 overflow-hidden">
                {selectedUser.photoURL ? <img src={selectedUser.photoURL} className="h-full w-full object-cover" alt="" /> : (selectedUser.firstName?.[0] || '?')}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold mt-1 ${selectedUser.role === 'admin' ? 'bg-amber-600/20 text-amber-400' : selectedUser.role === 'super_admin' ? 'bg-red-600/20 text-red-400' : 'bg-indigo-600/20 text-indigo-400'}`}>
                  {selectedUser.role?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="User ID" value={selectedUser.id} />
              <Detail label="Email" value={selectedUser.email} />
              <Detail label="Mobile" value={selectedUser.mobile || '—'} />
              <Detail label="Reg Number" value={selectedUser.regNumber || '—'} />
              <Detail label="Department" value={selectedUser.department?.toUpperCase() || '—'} />
              <Detail label="Batch" value={selectedUser.batch || '—'} />
              <Detail label="Face Verified" value={selectedUser.isFaceVerified ? 'Yes' : 'No'} />
              <Detail label="Photo URL" value={selectedUser.photoURL ? 'Uploaded' : 'None'} />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelectedUser(null)}
                className="rounded-lg bg-gray-700 px-5 py-2 text-sm text-gray-300 hover:bg-gray-600 transition">Close</button>
              <button onClick={() => handleDelete(selectedUser.id)}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-white font-medium break-all">{value}</p>
    </div>
  )
}
