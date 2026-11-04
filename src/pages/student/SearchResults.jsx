import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getSubjects, getChapters, getResources } from '../../services/firestore'
import Skeleton from '../../components/ui/Skeleton'
import { BookOpen, BookText, FileText, ExternalLink } from 'lucide-react'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState({ subjects: [], chapters: [], resources: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!q) { setLoading(false); return }
    const load = async () => {
      const allSubs = await getSubjects()
      const query = q.toLowerCase()
      const matchedSubs = allSubs.filter((s) =>
        s.name?.toLowerCase().includes(query) || s.code?.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query)
      )
      const matchedChapters = []
      const matchedResources = []
      for (const sub of allSubs) {
        const chs = await getChapters(sub.id)
        for (const ch of chs) {
          if (ch.title?.toLowerCase().includes(query) || ch.description?.toLowerCase().includes(query)) {
            matchedChapters.push({ ...ch, subjectName: sub.name, subjectId: sub.id, semesterId: sub.semesterId })
          }
          const res = await getResources(ch.id)
          for (const r of res) {
            if (r.name?.toLowerCase().includes(query)) {
              matchedResources.push({ ...r, chapterTitle: ch.title, chapterId: ch.id, subjectName: sub.name, subjectId: sub.id, semesterId: sub.semesterId })
            }
          }
        }
      }
      setResults({ subjects: matchedSubs, chapters: matchedChapters, resources: matchedResources })
      setLoading(false)
    }
    load()
  }, [q])

  if (!q) return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-200">
      <p className="text-sm text-gray-500">Enter a search term to find subjects, chapters, and resources.</p>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Search Results</h1>
      <p className="mb-6 text-sm text-gray-400">Showing results for "{q}"</p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-8">
          <Section title="Subjects" count={results.subjects.length} empty="No subjects found." icon={BookOpen} bgColor="bg-indigo-600/10" textColor="text-indigo-600">
            {results.subjects.map((s) => (
              <Link key={s.id} to={`/dashboard/subjects/${s.semesterId}/subject/${s.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-500/50 transition shadow-sm hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{s.name} <span className="text-xs text-gray-500">{s.code}</span></p>
                  <p className="text-xs text-gray-500">{s.description}</p>
                </div>
              </Link>
            ))}
          </Section>

          <Section title="Chapters" count={results.chapters.length} empty="No chapters found." icon={BookText} bgColor="bg-emerald-600/10" textColor="text-emerald-600">
            {results.chapters.map((ch) => (
              <Link key={ch.id} to={`/dashboard/subjects/${ch.semesterId}/subject/${ch.subjectId}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-500/50 transition shadow-sm hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10">
                  <BookText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{ch.title}</p>
                  <p className="text-xs text-gray-500">in {ch.subjectName}</p>
                </div>
              </Link>
            ))}
          </Section>

          <Section title="Resources" count={results.resources.length} empty="No resources found." icon={FileText} bgColor="bg-rose-600/10" textColor="text-rose-600">
            {results.resources.map((r) => (
              <div key={`${r.chapterId}-${r.id}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600/10">
                  <FileText className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.subjectName} / {r.chapterTitle}</p>
                </div>
                {r.fileURL ? (
                  <a href={r.fileURL} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg bg-indigo-600/10 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-600/20 transition inline-flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                ) : r.youtubeId ? (
                  <Link to={`/dashboard/subjects/${r.semesterId}/subject/${r.subjectId}`}
                    className="rounded-lg bg-red-600/10 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-600/20 transition">View</Link>
                ) : null}
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({ title, count, empty, icon: Icon, bgColor, textColor, children }) {
  if (count === 0) return null
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${textColor}`} />
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-gray-600">({count})</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
