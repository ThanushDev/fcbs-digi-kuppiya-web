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
    return <div className="text-center py-16 text-gray-400">Semester not found.</div>
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">&larr; Back to Semesters</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{semester.name}</h1>
        <p className="text-sm text-gray-500 capitalize">{semester.department} Department</p>
      </div>

      {subjects.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-sm text-gray-400">No subjects available for this semester yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub) => (
            <Link key={sub.id} to={`/dashboard/subjects/${semesterId}/subject/${sub.id}`}
              className="card card-hover group p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="badge badge-indigo">{sub.code || '—'}</span>
                <span className="text-xs text-gray-400">{chapterCounts[sub.id] || 0} chapters</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition">{sub.name}</h3>
              {sub.description && <p className="mt-2 text-xs text-gray-500 line-clamp-2">{sub.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
