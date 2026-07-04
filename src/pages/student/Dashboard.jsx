import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getSemesters, getBatchPermission } from '../../services/firestore'
import { CardSkeleton } from '../../components/ui/Skeleton'

const semesterIcons = ['📘', '📗', '📕', '📙', '📔', '📓']

export default function Dashboard() {
  const { userData } = useAuth()
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const all = await getSemesters()
      const dept = userData?.department || ''
      let filtered = all.filter((s) => s.department === dept || s.department === 'both')
      const batch = userData?.batch || ''
      if (batch) {
        const perm = await getBatchPermission(batch)
        if (perm?.semesterIds?.length) {
          filtered = filtered.filter((s) => perm.semesterIds.includes(s.id))
        }
      }
      setSemesters(filtered.sort((a, b) => a.order - b.order))
      setLoading(false)
    }
    load()
  }, [userData])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome, {userData?.firstName || 'Student'}</h1>
        <p className="mt-1 text-sm text-gray-400">Select a semester to view your subjects and learning materials.</p>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : semesters.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-gray-800 bg-[#141726]">
          <p className="text-gray-500">No semesters available for your department yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((s, i) => (
            <Link key={s.id} to={`/dashboard/subjects/${s.id}`}
              className="group rounded-2xl border border-gray-800 bg-[#141726] p-6 transition hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600/10 text-2xl group-hover:bg-indigo-600/20 transition">
                {semesterIcons[i % semesterIcons.length]}
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">{s.name}</h3>
              <p className="mt-1 text-xs text-gray-500 capitalize">{s.department}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
