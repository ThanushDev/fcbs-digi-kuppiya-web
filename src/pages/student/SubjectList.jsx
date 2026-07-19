import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getSubjects, getSemesters, getChapters } from '../../services/firestore'
import Skeleton, { CardSkeleton } from '../../components/ui/Skeleton'
import { ArrowLeft, BookOpen, Stars } from 'lucide-react'

export default function SubjectList() {
  const { semesterId } = useParams()
  const [searchParams] = useSearchParams()
  
  const [semester, setSemester] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [chapterCounts, setChapterCounts] = useState({})
  const [loading, setLoading] = useState(true)

  const currentSpec = searchParams.get('spec') || 'all'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const allSemesters = await getSemesters()
      const sem = allSemesters.find((s) => s.id === semesterId)
      setSemester(sem || null)

      const subs = await getSubjects(semesterId)
      
      const isBMS = sem?.department === 'bms'
      const isYear3or4 = sem?.name?.includes('Y3') || sem?.name?.includes('Y4')
      
      let filteredSubs = subs;
      if (isBMS && isYear3or4) {
        filteredSubs = subs.filter(sub => {
          return !sub.specialization || sub.specialization === 'all' || sub.specialization === currentSpec
        })
      }
      
      setSubjects(filteredSubs)

      const counts = {}
      for (const sub of filteredSubs) {
        const chs = await getChapters(sub.id)
        counts[sub.id] = chs.length
      }
      setChapterCounts(counts)
      setLoading(false)
    }
    load()
  }, [semesterId, currentSpec])

  if (loading) {
    return (
      <div className="animate-fade-in">
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

  const getSpecBadgeLabel = (spec) => {
    const labels = {
      accounting: 'Accounting Specialization',
      marketing: 'Marketing Specialization',
      hrm: 'HRM Specialization',
      management: 'Management Specialization',
      info_management: 'Information Management Specialization',
      all: 'General Degree'
    }
    return labels[spec] || 'General'
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1.5 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Semesters
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {semester.name.replace(/Y1/g, 'Year I ').replace(/Y2/g, 'Year II ').replace(/Y3/g, 'Year III ').replace(/Y4/g, 'Year IV ').replace(/S1/g, 'Semester I').replace(/S2/g, 'Semester II')}
          </h1>
          <p className="text-sm text-gray-500 capitalize">{semester.department} Department</p>
        </div>

        {semester.department === 'bms' && (semester.name?.includes('Y3') || semester.name?.includes('Y4')) && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl w-max uppercase tracking-wider shadow-sm">
            <Stars className="w-3.5 h-3.5" /> {getSpecBadgeLabel(currentSpec)}
          </span>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-sm text-gray-400">No subjects available for this stream yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub) => (
            <Link key={sub.id} to={`/dashboard/subjects/${semesterId}/subject/${sub.id}?spec=${currentSpec}`}
              className="card card-hover group p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="badge badge-indigo">{sub.code || '\u2014'}</span>
                  <span className="text-xs text-gray-400">{chapterCounts[sub.id] || 0} chapters</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition">{sub.name}</h3>
                {sub.description && <p className="mt-2 text-xs text-gray-500 line-clamp-2">{sub.description}</p>}
              </div>

              {sub.specialization && sub.specialization !== 'all' && (
                <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded w-max uppercase">
                  <BookOpen className="w-3 h-3" /> {sub.specialization.replace('_', ' ')}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
