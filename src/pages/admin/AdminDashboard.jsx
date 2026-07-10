import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminDashboard() {
  const { userData } = useAuth()
  const [stats, setStats] = useState({ users: 0, bms: 0, lcs: 0, semesters: 0, subjects: 0 })

  useEffect(() => {
    const load = async () => {
      const usersSnap = await getDocs(collection(db, 'users'))
      const bmsSnap = await getDocs(query(collection(db, 'users'), where('department', '==', 'bms')))
      const lcsSnap = await getDocs(query(collection(db, 'users'), where('department', '==', 'lcs')))
      const semSnap = await getDocs(collection(db, 'semesters'))
      const subSnap = await getDocs(collection(db, 'subjects'))
      setStats({
        users: usersSnap.size,
        bms: bmsSnap.size,
        lcs: lcsSnap.size,
        semesters: semSnap.size,
        subjects: subSnap.size,
      })
    }
    load()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">Welcome back, {userData?.firstName || 'Admin'}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Users', value: stats.users, color: 'from-[#4f46e5] to-[#7c3aed]' },
          { label: 'BMS Students', value: stats.bms, color: 'from-[#059669] to-[#10b981]' },
          { label: 'LCS Students', value: stats.lcs, color: 'from-[#d97706] to-[#f59e0b]' },
          { label: 'Semesters', value: stats.semesters, color: 'from-[#dc2626] to-[#ef4444]' },
          { label: 'Subjects', value: stats.subjects, color: 'from-[#2563eb] to-[#3b82f6]' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 shadow-lg`}>
            <p className="text-sm font-medium text-white/80">{s.label}</p>
            <p className="mt-1 text-4xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Content Management</h2>
        <p className="text-gray-400">Use the sidebar to manage Semesters, Subjects, Chapters, and Resources.</p>
      </div>
    </div>
  )
}
