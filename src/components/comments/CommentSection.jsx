import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { addComment, getComments } from '../../services/firestore'

export default function CommentSection({ chapterId, chapterTitle, subjectId, subjectTitle }) {
  // Use whichever ID is provided (chapter or subject)
  const targetId = chapterId || subjectId;
  
  const { user, userData } = useAuth()
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!targetId) return
    const load = async () => {
      const data = await getComments(targetId)
      setComments(data.filter((c) => c.status === 'approved'))
      setLoading(false)
    }
    load()
  }, [targetId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    if (!targetId) {
      alert("Error: Comment ID is missing!");
      return;
    }

    setSubmitting(true)
    try {
      await addComment({
        chapterId: targetId, // Send as chapterId for compatibility with existing data
        userId: user.uid,
        userDisplayName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Student',
        userPhotoURL: userData?.photoURL || '',
        content: content.trim(),
      })
      setContent('')
      const data = await getComments(targetId)
      setComments(data.filter((c) => c.status === 'approved'))
    } catch (err) {
      console.error(err)
    }
    setSubmitting(false)
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Comments</h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts about this..."
          rows={3}
          className="input-field resize-none mb-2 w-full" />
        <button type="submit" disabled={submitting || !content.trim()}
          className="btn-primary text-sm">
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {c.userPhotoURL ? (
                    <img src={c.userPhotoURL} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    c.userDisplayName?.[0] || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{c.userDisplayName}</span>
                    <span className="text-[10px] text-gray-400">{c.createdAt?.toDate?.().toLocaleString() || ''}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{c.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
