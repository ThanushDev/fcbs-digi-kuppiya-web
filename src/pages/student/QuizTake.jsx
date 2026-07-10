import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getQuiz, getQuestions, submitAttempt } from '../../services/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function QuizTake() {
  const { quizId } = useParams()
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const q = await getQuiz(quizId)
      const qs = await getQuestions(quizId)
      if (!q || qs.length === 0) { navigate('/dashboard/quizzes'); return }
      setQuiz(q)
      setQuestions(qs)
      setTimeLeft(q.timeLimit * 60)
      setLoading(false)
    }
    load()
    return () => clearInterval(timerRef.current)
  }, [quizId])

  useEffect(() => {
    if (loading || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); showToast('Time is up! Submitting your quiz.', 'info'); handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [loading])

  const handleSelect = (qIdx, optIdx) => {
    const q = questions[qIdx]
    if (q.allowMultiple) {
      const prev = answers[qIdx] || []
      setAnswers({ ...answers, [qIdx]: prev.includes(optIdx) ? prev.filter((i) => i !== optIdx) : [...prev, optIdx] })
    } else {
      setAnswers({ ...answers, [qIdx]: [optIdx] })
    }
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    clearInterval(timerRef.current)
    let score = 0
    const total = questions.length
    const answerList = questions.map((q, i) => {
      const selected = answers[i] || []
      const correct = q.options.filter((o) => o.isCorrect).map((_, idx) => idx)
      const isCorrect = selected.length === correct.length && selected.every((s) => correct.includes(s))
      if (isCorrect) score++
      return { questionId: q.id, selected, correct, isCorrect }
    })
    const docRef = await submitAttempt({
      quizId, userId: user.uid, userName: `${userData?.firstName} ${userData?.lastName}`, userEmail: user.email,
      answers: answerList, score, total,
    })
    navigate(`/dashboard/quizzes/${quizId}/result/${docRef.id}`)
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (loading) return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-4 w-20 bg-gray-800/60 rounded animate-pulse mb-2" />
          <div className="h-7 w-48 bg-gray-800/60 rounded animate-pulse" />
        </div>
        <div className="h-16 w-24 bg-gray-800/60 rounded-xl animate-pulse" />
      </div>
      <div className="h-2 w-full bg-gray-800/60 rounded-full mb-6 animate-pulse" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <div className="h-5 w-32 bg-gray-800/60 rounded animate-pulse mb-4" />
        <div className="h-6 w-3/4 bg-gray-800/60 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 w-full bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )

  const q = questions[current]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/dashboard/quizzes" className="text-sm text-rose-400 hover:text-rose-300 transition">&larr; Back</Link>
          <h1 className="mt-1 text-xl font-bold text-gray-900">{quiz.title}</h1>
        </div>
        <div className={`rounded-xl px-4 py-2 text-center ${timeLeft < 60 ? 'bg-red-600/20 text-red-400' : 'bg-gray-800 text-gray-900'}`}>
          <p className="text-2xl font-bold">{formatTime(timeLeft)}</p>
          <p className="text-[10px] text-gray-500">remaining</p>
        </div>
      </div>

      <div className="mb-4 flex gap-1">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`h-2 flex-1 rounded-full transition ${answers[i] ? 'bg-emerald-500' : i === current ? 'bg-rose-500' : 'bg-gray-700'}`} />
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">Question {current + 1} of {questions.length}</span>
          {q.allowMultiple && <span className="text-[10px] text-amber-400 font-semibold">Select all that apply</span>}
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{q.text}</h2>
        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <button key={idx} onClick={() => handleSelect(current, idx)}
              className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                (answers[current] || []).includes(idx)
                  ? 'border-rose-500 bg-rose-600/10 text-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-600'
              }`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                (answers[current] || []).includes(idx) ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-500'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
          className="rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition">
          Previous
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(current + 1)}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-indigo-700 transition">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="rounded-lg bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-gray-900 hover:bg-emerald-700 disabled:opacity-50 transition">
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}
