import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { getQuiz, getQuestions } from '../../services/firestore'
import Skeleton from '../../components/ui/Skeleton'

export default function QuizResult() {
  const { quizId, attemptId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const quiz = await getQuiz(quizId)
      const questions = await getQuestions(quizId)
      const attemptSnap = await getDoc(doc(db, 'attempts', attemptId))
      if (!attemptSnap.exists()) { setLoading(false); return }
      const attempt = { id: attemptSnap.id, ...attemptSnap.data() }
      setData({ quiz, questions, attempt })
      setLoading(false)
    }
    load()
  }, [quizId, attemptId])

  if (loading) return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="mb-6 h-4 w-28" />
      <div className="mb-8 rounded-2xl border border-gray-800 bg-[#141726] p-8 text-center">
        <Skeleton className="mx-auto h-24 w-24 rounded-full mb-4" />
        <Skeleton className="mx-auto h-10 w-32 mb-2" />
        <Skeleton className="mx-auto h-6 w-20" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="mb-4 h-24 w-full" />
      ))}
    </div>
  )
  if (!data) return <div className="text-center py-16 text-gray-500">Attempt not found.</div>

  const { quiz, questions, attempt } = data
  const percentage = Math.round((attempt.score / attempt.total) * 100)
  const grade = percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'F'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/dashboard/quizzes" className="text-sm text-indigo-400 hover:text-indigo-300 transition">&larr; Back to Quizzes</Link>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-800 bg-[#141726] p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">{quiz.title} — Results</h1>
        <div className={`inline-flex items-center justify-center rounded-full w-24 h-24 text-4xl font-bold mb-4 ${
          percentage >= 60 ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
        }`}>{grade}</div>
        <div className="text-5xl font-bold text-white mb-2">{attempt.score} <span className="text-2xl text-gray-500">/ {attempt.total}</span></div>
        <p className="text-lg text-gray-400">{percentage}%</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const ans = attempt.answers?.[i]
          return (
            <div key={q.id} className={`rounded-xl border p-5 ${ans?.isCorrect ? 'border-emerald-800 bg-emerald-600/5' : 'border-red-800 bg-red-600/5'}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${ans?.isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                  {ans?.isCorrect ? '✓' : '✕'}
                </span>
                <h3 className="font-semibold text-white">{q.text}</h3>
              </div>
              <div className="grid gap-2">
                {q.options.map((opt, idx) => {
                  const selected = ans?.selected?.includes(idx)
                  return (
                    <div key={idx} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      opt.isCorrect ? 'border-emerald-600 bg-emerald-600/10 text-emerald-400' :
                      selected ? 'border-red-600 bg-red-600/10 text-red-400' :
                      'border-gray-700 text-gray-500'
                    }`}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded text-[10px] ${
                        opt.isCorrect ? 'bg-emerald-600 text-white' :
                        selected ? 'bg-red-600 text-white' : 'bg-gray-700'
                      }`}>
                        {opt.isCorrect ? '✓' : selected ? '✕' : ''}
                      </span>
                      {opt.text}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
