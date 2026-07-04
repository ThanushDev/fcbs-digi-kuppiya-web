import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getComments, addComment } from '../../services/firestore'

export default function CommentSection({ chapterId, chapterTitle }) {
  const { user, userData } = useAuth()
  const { showToast } = useToast()
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chapterId) return
    const load = async () => {
      const all = await getComments(chapterId)
      setComments(all)
      setLoading(false)
    }
    load()
  }, [chapterId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    const fullName = userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData?.email || 'Unknown'
    const photoURL = userData?.photoURL || ''
    await addComment({
      chapterId,
      content: content.trim(),
      userId: user.uid,
      userDisplayName: fullName,
      userPhotoURL: photoURL,
    })
    setContent('')
    setSubmitting(false)
    showToast('Comment posted and pending approval', 'success')
    const all = await getComments(chapterId)
    setComments(all)
  }

  if (!chapterId) return null

  return (
    <div className="mt-8 border-t border-gray-800 pt-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Comments</h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts or ask a question..."
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-800 bg-[#141726] p-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition" />
        <div className="mt-2 flex justify-end">
          <button type="submit" disabled={submitting || !content.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition">
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className={`rounded-xl border p-4 ${c.status === 'approved' ? 'border-gray-800 bg-[#141726]' : 'border-dashed border-gray-700 bg-[#141726]/50'}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {c.userPhotoURL ? (
                    <img src={c.userPhotoURL} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    c.userDisplayName?.[0] || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{c.userDisplayName}</span>
                    {c.status !== 'approved' && (
                      <span className="rounded bg-yellow-600/20 px-2 py-0.5 text-[10px] text-yellow-400">Pending</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-300">{c.content}</p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {c.createdAt?.toDate?.().toLocaleString() || ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
