import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getChapters, getSubjects, getResourcesBySubjectAndType } from '../../services/firestore'
import CommentSection from '../../components/comments/CommentSection'
import Skeleton, { DetailSkeleton } from '../../components/ui/Skeleton'

const TABS = [
  { key: 'chapters', label: 'Chapters', icon: '▤' },
  { key: 'past_papers', label: 'Past Papers', icon: '📄' },
  { key: 'short_notes', label: 'Short Notes', icon: '✍️' },
  { key: 'videos', label: 'Videos', icon: '▶' },
]

export default function SubjectDetail() {
  const { subjectId } = useParams()
  const [subject, setSubject] = useState(null)
  const [tab, setTab] = useState('chapters')
  const [chapters, setChapters] = useState([])
  const [pastPapers, setPastPapers] = useState([])
  const [shortNotes, setShortNotes] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const allSubs = await getSubjects()
        const sub = allSubs.find((s) => s.id === subjectId)
        setSubject(sub || null)

        const [chs, pp, sn, vids] = await Promise.all([
          getChapters(subjectId),
          getResourcesBySubjectAndType(subjectId, 'past_paper'),
          getResourcesBySubjectAndType(subjectId, 'short_note'),
          getResourcesBySubjectAndType(subjectId, 'video'),
        ])

        setChapters(chs.sort((a, b) => (a.order || 0) - (b.order || 0)))
        setPastPapers(pp)
        setShortNotes(sn)
        setVideos(vids)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  } , [subjectId])

  if (loading) return (
    <div>
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-6 h-8 w-60" />
      <DetailSkeleton />
    </div>
  )
  if (!subject) return <div className="text-center py-16 text-gray-400">Subject not found.</div>

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link to={`/dashboard/subjects/${subject.semesterId}`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">&larr; Back to Subjects</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{subject.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{subject.code || ''} {subject.description ? `— ${subject.description}` : ''}</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'chapters' && <ChapterGridCard chapters={chapters} />}
      {tab === 'past_papers' && <ResourceGridCard items={pastPapers} type="past_paper" />}
      {tab === 'short_notes' && <ResourceGridCard items={shortNotes} type="short_note" />}
      {tab === 'videos' && <VideoGridPlayer items={videos} />}

      <div className="mt-12 pt-8 border-t border-gray-200">
        {/* 🎯 Fix: මෙතැනදී chapterId විදිහටම subjectId එක යවනවා (එතකොට Component එක අනිවාර්යයෙන්ම වැඩ කරනවා) */}
        <CommentSection chapterId={subjectId} chapterTitle={subject.name} />
      </div>
    </div>
  )
}

function ChapterGridCard({ chapters }) {
  if (chapters.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
        <p className="text-sm text-gray-400">No chapters available for this subject.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {chapters.map((ch) => (
        <div key={ch.id} className="card card-hover group p-5 flex flex-col justify-between h-36">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm">
              {ch.order || '—'}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition">
                {ch.title}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">Lecture Chapter</p>
            </div>
          </div>
          {ch.driveLink && (
            <a href={ch.driveLink} target="_blank" rel="noopener noreferrer"
              className="mt-3 w-full text-center rounded-lg bg-gray-100 hover:bg-indigo-600 text-gray-600 hover:text-white py-2 text-xs font-semibold transition-all duration-150">
              View Document ↗
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function ResourceGridCard({ items, type }) {
  if (items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
        <p className="text-sm text-gray-400">No {type === 'past_paper' ? 'past papers' : 'short notes'} available for this subject.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item) => {
        const documentLink = item.fileUrl || item.fileURL;
        return (
          <div key={item.id} className="card card-hover group p-5 flex flex-col justify-between h-36">
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                type === 'past_paper' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}>
                {type === 'past_paper' ? '📄' : '📝'}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition">{item.title}</h4>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">{type === 'past_paper' ? 'Exam Document' : 'Revision Note'}</p>
              </div>
            </div>
            {documentLink && (
              <a href={documentLink} target="_blank" rel="noopener noreferrer"
                className="mt-3 w-full text-center rounded-lg bg-gray-100 hover:bg-indigo-600 text-gray-600 hover:text-white py-2 text-xs font-semibold transition-all duration-150">
                View Document ↗
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

function VideoGridPlayer({ items }) {
  const [activeVideo, setActiveVideo] = useState(null)

  if (items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
        <p className="text-sm text-gray-400">No lecture videos available.</p>
      </div>
    )
  }

  const getYoutubeId = (url) => {
    if (!url) return null;
    const cleanedUrl = url.trim();
    if (cleanedUrl.length === 11 && !cleanedUrl.includes('/') && !cleanedUrl.includes('?')) {
      return cleanedUrl;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = cleanedUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <div className="space-y-6">
      {activeVideo && (
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-video max-w-4xl mx-auto shadow-md animate-fade-in">
          <iframe src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} className="h-full w-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Embedded Video Player" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const videoLink = item.fileUrl || item.fileURL || '';
          const ytId = getYoutubeId(videoLink);
          const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

          return (
            <div key={item.id} className={`card card-hover group overflow-hidden cursor-pointer ${activeVideo === ytId ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => ytId && setActiveVideo(ytId)}>

              <div className="relative aspect-video bg-gray-100 border-b border-gray-200 overflow-hidden">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold bg-gray-50">Invalid Link</div>
                )}
                
                {ytId && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                    <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center pl-1 text-lg shadow-lg transform group-hover:scale-110 transition duration-200">▶</div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1.5 font-medium">Click to stream</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}