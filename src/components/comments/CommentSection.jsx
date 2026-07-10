import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { addComment, getComments } from '../../services/firestore' // 🎯 getChapterComments වෙනුවට හරියටම getComments import කළා

export default function CommentSection({ chapterId, chapterTitle }) {
  const { user, userData } = useAuth()
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!chapterId) return
    const load = async () => {
      // 🎯 getChapterComments වෙනුවට firestore.js එකේ තියෙන getComments ක්‍රියාත්මක කළා
      const data = await getComments(chapterId)
      setComments(data.filter((c) => c.status === 'approved'))
      setLoading(false)
    }
    load()
  }, [chapterId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await addComment({
        chapterId,
        userId: user.uid,
        userDisplayName: `${userData?.firstName} ${userData?.lastName}`,
        userPhotoURL: userData?.photoURL || '',
        content: content.trim(),
      })
      setContent('')
      // 🎯 කමෙන්ට් එක දැම්මට පස්සේ ආයේ ලිස්ට් එක අප්ඩේට් කරගන්නත් getComments ම පාවිච්චි කළා
      const data = await getComments(chapterId)
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
          placeholder="Share your thoughts about this chapter..."
          rows={3}
          className="input-field resize-none mb-2" />
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