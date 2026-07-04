import { useState, useEffect } from 'react'
import { getAllComments, updateCommentStatus, deleteComment, getChapters } from '../../services/firestore'
import { exportToCSV } from '../../utils/export'

export default function CommentManagement() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [chapterTitles, setChapterTitles] = useState({})

  useEffect(() => {
    const load = async () => {
      const all = await getAllComments()
      setComments(all)
      const chapterIds = [...new Set(all.map((c) => c.chapterId))]
      const map = {}
      for (const id of chapterIds) {
        const chs = await getChapters(id)
        chs.forEach((ch) => { map[ch.id] = ch.title })
      }
      setChapterTitles(map)
      setLoading(false)
    }
    load()
  }, [])

  const refresh = async () => {
    const all = await getAllComments()
    setComments(all)
  }

  const handleApprove = async (id) => {
    await updateCommentStatus(id, 'approved')
    await refresh()
  }

  const handleReject = async (id) => {
    await updateCommentStatus(id, 'rejected')
    await refresh()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment permanently?')) return
    await deleteComment(id)
    await refresh()
  }

  const filtered = filter === 'all' ? comments : comments.filter((c) => c.status === filter)

  if (loading) return <div className="text-center py-16 text-gray-400">Loading comments...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Comment Moderation</h1>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(comments, 'comments_export', [
            { label: 'User', accessor: (c) => c.userDisplayName },
            { label: 'Content', accessor: (c) => c.content },
            { label: 'Status', accessor: (c) => c.status },
            { label: 'Chapter', accessor: (c) => chapterTitles[c.chapterId] || '' },
            { label: 'Date', accessor: (c) => c.createdAt?.toDate?.().toISOString() || '' },
          ])}
            className="rounded-lg bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition">
            Export CSV
          </button>
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-800">
          <p className="text-sm text-gray-500">No {filter === 'all' ? '' : filter} comments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className={`rounded-xl border p-4 ${c.status === 'pending' ? 'border-yellow-700/30 bg-yellow-600/5' : c.status === 'approved' ? 'border-gray-800 bg-[#141726]' : 'border-red-900/30 bg-red-900/5'}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {c.userPhotoURL ? (
                    <img src={c.userPhotoURL} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    c.userDisplayName?.[0] || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{c.userDisplayName}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-medium capitalize ${c.status === 'approved' ? 'bg-green-600/20 text-green-400' : c.status === 'rejected' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                      {c.status}
                    </span>
                    {chapterTitles[c.chapterId] && (
                      <span className="text-[10px] text-gray-500">
                        on <span className="text-gray-400">{chapterTitles[c.chapterId]}</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-300">{c.content}</p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {c.createdAt?.toDate?.().toLocaleString() || ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {c.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(c.id)}
                        className="rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-600/30 transition">Approve</button>
                      <button onClick={() => handleReject(c.id)}
                        className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/30 transition">Reject</button>
                    </>
                  )}
                  <button onClick={() => handleDelete(c.id)}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-red-600/30 hover:text-red-400 transition">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
