import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getQuizzes, getUserAttempts } from '../../services/firestore'
import { useAuth } from '../../contexts/AuthContext'

export default function QuizList() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [passwordModal, setPasswordModal] = useState(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    const load = async () => {
      setQuizzes(await getQuizzes())
      if (user) setAttempts(await getUserAttempts(user.uid))
      setLoading(false)
    }
    load()
  }, [user])

  const handleQuizClick = (quiz) => {
    if (!quiz.password) {
      window.location.href = `/dashboard/quizzes/${quiz.id}`
      return
    }
    setPasswordModal(quiz)
    setPassword('')
    setPasswordError('')
  }

  const handlePasswordSubmit = () => {
    if (password !== passwordModal.password) {
      setPasswordError('Incorrect password')
      return
    }
    window.location.href = `/dashboard/quizzes/${passwordModal.id}`
  }

  const getAttempt = (quizId) => attempts.find((a) => a.quizId === quizId)

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300 transition">&larr; Back to Dashboard</Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Quizzes</h1>
        <p className="text-sm text-gray-400">Test your knowledge with available quizzes.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-gray-800 bg-[#141726]">
          <p className="text-gray-500">No quizzes available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => {
            const attempt = getAttempt(q.id)
            return (
              <div key={q.id} className="rounded-xl border border-gray-800 bg-[#141726] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-lg bg-rose-600/20 px-3 py-1 text-xs font-semibold text-rose-400">{q.timeLimit} min</span>
                  {q.password && <span className="text-[10px] text-gray-500">🔒 Locked</span>}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{q.title}</h3>
                {attempt ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Score: </span>
                      <span className="font-bold text-emerald-400">{attempt.score}/{attempt.total}</span>
                    </div>
                    <Link to={`/dashboard/quizzes/${q.id}/result/${attempt.id}`}
                      className="inline-block rounded-lg bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition">
                      View Result
                    </Link>
                  </div>
                ) : (
                  <button onClick={() => handleQuizClick(q)}
                    className="w-full rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 py-2 text-sm font-semibold text-white hover:from-rose-500 hover:to-pink-500 transition">
                    Start Quiz
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPasswordModal(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-[#141726] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">Password Required</h2>
            <p className="text-sm text-gray-400 mb-4">Enter the password to access "{passwordModal.title}"</p>
            {passwordError && <p className="text-sm text-red-400 mb-3">{passwordError}</p>}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus
              className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-rose-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setPasswordModal(null)} className="flex-1 rounded-lg bg-gray-700 py-2 text-sm text-gray-300 hover:bg-gray-600">Cancel</button>
              <button onClick={handlePasswordSubmit} className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-700">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
