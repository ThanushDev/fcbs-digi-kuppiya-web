import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSubjects, getSemesters, getChapters } from '../../services/firestore'
import Skeleton, { CardSkeleton } from '../../components/ui/Skeleton'

export default function SubjectList() {
  const { semesterId } = useParams()
  const [semester, setSemester] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [chapterCounts, setChapterCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const allSemesters = await getSemesters()
      const sem = allSemesters.find((s) => s.id === semesterId)
      setSemester(sem || null)

      const subs = await getSubjects(semesterId)
      setSubjects(subs)

      const counts = {}
      for (const sub of subs) {
        const chs = await getChapters(sub.id)
        counts[sub.id] = chs.length
      }
      setChapterCounts(counts)
      setLoading(false)
    }
    load()
  }, [semesterId])

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="mb-6 h-8 w-60" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (!semester) {
    return <div className="text-center py-16 text-gray-500">Semester not found.</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300 transition">&larr; Back to Semesters</Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{semester.name}</h1>
        <p className="text-sm text-gray-400 capitalize">{semester.department} Department</p>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-gray-800 bg-[#141726]">
          <p className="text-gray-500">No subjects available for this semester yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub) => (
            <Link key={sub.id} to={`/dashboard/subjects/${semesterId}/subject/${sub.id}`}
              className="group rounded-2xl border border-gray-800 bg-[#141726] p-6 transition hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-lg bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-400">{sub.code || '—'}</span>
                <span className="text-xs text-gray-500">{chapterCounts[sub.id] || 0} chapters</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">{sub.name}</h3>
              {sub.description && <p className="mt-2 text-xs text-gray-500 line-clamp-2">{sub.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
