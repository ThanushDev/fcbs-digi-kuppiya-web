import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'

export default function SuperAdminDashboard() {
  const { userData } = useAuth()
  const [stats, setStats] = useState({
    users: 0, admins: 0, bms: 0, lcs: 0,
    semesters: 0, subjects: 0, chapters: 0, resources: 0,
  })
  const [batchStats, setBatchStats] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const usersSnap = await getDocs(collection(db, 'users'))
      const adminSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')))
      const bmsSnap = await getDocs(query(collection(db, 'users'), where('department', '==', 'bms')))
      const lcsSnap = await getDocs(query(collection(db, 'users'), where('department', '==', 'lcs')))
      const semSnap = await getDocs(collection(db, 'semesters'))
      const subSnap = await getDocs(collection(db, 'subjects'))
      const chSnap = await getDocs(collection(db, 'chapters'))
      const resSnap = await getDocs(collection(db, 'resources'))

      const batchMap = {}
      usersSnap.docs.forEach((d) => {
        const dept = d.data().department
        const batch = d.data().batch
        if (batch) {
          if (!batchMap[batch]) batchMap[batch] = { batch, bms: 0, lcs: 0, total: 0 }
          batchMap[batch].total++
          if (dept === 'bms') batchMap[batch].bms++
          if (dept === 'lcs') batchMap[batch].lcs++
        }
      })

      const recentSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5)))

      setStats({
        users: usersSnap.size,
        admins: adminSnap.size,
        bms: bmsSnap.size,
        lcs: lcsSnap.size,
        semesters: semSnap.size,
        subjects: subSnap.size,
        chapters: chSnap.size,
        resources: resSnap.size,
      })
      setBatchStats(Object.values(batchMap).sort((a, b) => a.batch.localeCompare(b.batch)))
      setRecentUsers(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-16 text-gray-400">Loading analytics...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-400">Full system overview — {userData?.firstName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Users', value: stats.users, color: 'from-indigo-600 to-indigo-800' },
          { label: 'Admins', value: stats.admins, color: 'from-amber-600 to-amber-800' },
          { label: 'BMS Students', value: stats.bms, color: 'from-emerald-600 to-emerald-800' },
          { label: 'LCS Students', value: stats.lcs, color: 'from-cyan-600 to-cyan-800' },
          { label: 'Semesters', value: stats.semesters, color: 'from-purple-600 to-purple-800' },
          { label: 'Subjects', value: stats.subjects, color: 'from-pink-600 to-pink-800' },
          { label: 'Chapters', value: stats.chapters, color: 'from-teal-600 to-teal-800' },
          { label: 'Resources', value: stats.resources, color: 'from-orange-600 to-orange-800' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 shadow-lg`}>
            <p className="text-sm font-medium text-gray-900/80">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Students by Batch</h2>
          <div className="space-y-4">
            {batchStats.map((b) => {
              const maxVal = Math.max(...batchStats.map((x) => x.total)) || 1
              return (
                <div key={b.batch}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-900 font-medium">Batch {b.batch}</span>
                    <span className="text-gray-400">{b.total}</span>
                  </div>
                  <div className="flex h-2 gap-1 rounded-full bg-gray-800 overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(b.bms / b.total) * 100}%` }} />
                    <div className="bg-cyan-500 h-full transition-all" style={{ width: `${(b.lcs / b.total) * 100}%` }} />
                  </div>
                  <div className="mt-1 flex gap-4 text-[10px] text-gray-500">
                    <span>BMS: {b.bms}</span>
                    <span>LCS: {b.lcs}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Registrations</h2>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg bg-gray-800/30 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-gray-900 shrink-0">
                  {u.firstName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-gray-500">{u.email} · {u.department?.toUpperCase()} · {u.batch}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${u.role === 'admin' ? 'bg-amber-600/20 text-amber-400' : 'bg-indigo-600/20 text-indigo-400'}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
