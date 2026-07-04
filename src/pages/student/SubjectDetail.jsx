import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getChapters, getSubjects, getResources } from '../../services/firestore'
import CommentSection from '../../components/comments/CommentSection'
import Skeleton, { DetailSkeleton } from '../../components/ui/Skeleton'

export default function SubjectDetail() {
  const { subjectId } = useParams()
  const [subject, setSubject] = useState(null)
  const [chapters, setChapters] = useState([])
  const [resourceMap, setResourceMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState(null)

  useEffect(() => {
    const load = async () => {
      const allSubs = await getSubjects()
      const sub = allSubs.find((s) => s.id === subjectId)
      setSubject(sub || null)

      const chs = await getChapters(subjectId)
      setChapters(chs)

      const map = {}
      for (const ch of chs) {
        map[ch.id] = await getResources(ch.id)
      }
      setResourceMap(map)
      setLoading(false)
    }
    load()
  }, [subjectId])

  if (loading) return (
    <div>
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-6 h-8 w-60" />
      <DetailSkeleton />
    </div>
  )
  if (!subject) return <div className="text-center py-16 text-gray-500">Subject not found.</div>

  return (
    <div>
      <div className="mb-6">
        <Link to={`/dashboard/subjects/${subject.semesterId}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition">&larr; Back to Subjects</Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{subject.name}</h1>
        <p className="text-sm text-gray-400">{subject.code || ''} {subject.description ? `— ${subject.description}` : ''}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">Chapters</h2>
          {chapters.length === 0 ? (
            <p className="text-sm text-gray-500">No chapters yet.</p>
          ) : (
            chapters.map((ch) => (
              <button key={ch.id} onClick={() => setActiveChapter(ch.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${activeChapter === ch.id ? 'border-indigo-500 bg-indigo-600/10' : 'border-gray-800 bg-[#141726] hover:border-gray-700'}`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-400">{ch.order || '—'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${activeChapter === ch.id ? 'text-indigo-400' : 'text-white'}`}>{ch.title}</p>
                    <p className="text-[10px] text-gray-500">{resourceMap[ch.id]?.length || 0} resources</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {!activeChapter ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-800">
              <p className="text-sm text-gray-500">Select a chapter to view its resources</p>
            </div>
          ) : (
            <>
              <ChapterResources chapterId={activeChapter} resources={resourceMap[activeChapter] || []} />
              <CommentSection chapterId={activeChapter} chapterTitle={chapters.find((c) => c.id === activeChapter)?.title || ''} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ChapterResources({ chapterId, resources }) {
  const [playing, setPlaying] = useState(null)

  if (resources.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-800">
        <p className="text-sm text-gray-500">No resources in this chapter yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {playing && (
        <div className="rounded-2xl overflow-hidden border border-gray-800 bg-black aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${playing}?autoplay=1`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video Player"
          />
        </div>
      )}

      <div className="space-y-3">
        {resources.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#141726] p-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${r.type === 'video' ? 'bg-red-600/10' : 'bg-blue-600/10'}`}>
                {r.type === 'video' ? '▶' : '📄'}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{r.name}</h4>
                <p className="text-xs text-gray-500">
                  {r.type === 'video' ? (r.duration ? r.duration : 'Video') : 'Document'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 ml-3">
              {r.type === 'video' ? (
                <button onClick={() => setPlaying(playing === r.youtubeId ? null : r.youtubeId)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${playing === r.youtubeId ? 'bg-red-600 text-white' : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`}>
                  {playing === r.youtubeId ? 'Close' : 'Play'}
                </button>
              ) : (
                <a href={r.fileURL} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600/20 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition">
                  Open
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
