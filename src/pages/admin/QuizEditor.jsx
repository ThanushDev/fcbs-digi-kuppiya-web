import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getQuiz, getQuestions, addQuestion, updateQuestion, deleteQuestion } from '../../services/firestore'
import { Check, X } from 'lucide-react'

export default function QuizEditor() {
  const { quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingQ, setEditingQ] = useState(null)
  const [form, setForm] = useState({ text: '', allowMultiple: false, options: ['', ''] })

  const load = async () => {
    setLoading(true)
    setQuiz(await getQuiz(quizId))
    setQuestions(await getQuestions(quizId))
    setLoading(false)
  }

  useEffect(() => { load() }, [quizId])

  const handleAddOption = () => setForm({ ...form, options: [...form.options, ''] })
  const handleRemoveOption = (i) => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })
  const handleOptionChange = (i, v) => {
    const opts = [...form.options]
    opts[i] = v
    setForm({ ...form, options: opts })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.text || form.options.length < 2) return
    const payload = { quizId, text: form.text, allowMultiple: form.allowMultiple, options: form.options.map((o) => ({ text: o })) }
    if (editingQ) {
      await updateQuestion(editingQ, payload)
      setEditingQ(null)
    } else {
      await addQuestion(payload)
    }
    setForm({ text: '', allowMultiple: false, options: ['', ''] })
    load()
  }

  const handleEditQ = (q) => {
    setEditingQ(q.id)
    setForm({ text: q.text, allowMultiple: q.allowMultiple, options: q.options.map((o) => o.text) })
  }

  const handleDeleteQ = async (id) => {
    if (!confirm('Delete this question?')) return
    await deleteQuestion(id)
    load()
  }

  const toggleCorrect = async (qId, optIdx) => {
    const q = questions.find((x) => x.id === qId)
    if (!q) return
    const opts = q.options.map((o, i) => ({ ...o, isCorrect: i === optIdx ? !o.isCorrect : o.isCorrect }))
    await updateQuestion(qId, { ...q, options: opts })
    load()
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>
  if (!quiz) return <div className="text-center py-16 text-gray-500">Quiz not found.</div>

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/quizzes" className="text-sm text-rose-400 hover:text-rose-300 transition">&larr; Back to Quizzes</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{quiz.title}</h1>
        <p className="text-sm text-gray-400">{quiz.timeLimit} min · {questions.length} questions</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{editingQ ? 'Edit Question' : 'Add Question'}</h2>
        <input type="text" placeholder="Question text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-rose-500" required />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={form.allowMultiple} onChange={(e) => setForm({ ...form, allowMultiple: e.target.checked })} />
          Allow multiple correct answers
        </label>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none focus:border-rose-500 text-sm" required />
              {form.options.length > 2 && <button type="button" onClick={() => handleRemoveOption(i)} className="text-gray-500 hover:text-red-400 text-sm"><X className="w-3 h-3" /></button>}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleAddOption} className="text-sm text-indigo-400 hover:text-indigo-300">+ Add option</button>
          <button type="submit" className="rounded-lg bg-rose-600 px-6 py-2 font-semibold text-gray-900 hover:bg-rose-700 transition text-sm">
            {editingQ ? 'Update' : 'Add Question'}
          </button>
          {editingQ && <button type="button" onClick={() => { setEditingQ(null); setForm({ text: '', allowMultiple: false, options: ['', ''] }) }}
            className="text-sm text-gray-400 hover:text-gray-900">Cancel</button>}
        </div>
      </form>

      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No questions yet. Add one above.</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-400">{i + 1}</span>
                  <h3 className="font-semibold text-gray-900">{q.text}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditQ(q)} className="text-xs text-gray-400 hover:text-indigo-400">Edit</button>
                  <button onClick={() => handleDeleteQ(q.id)} className="text-xs text-gray-400 hover:text-red-400">Del</button>
                </div>
              </div>
              {q.allowMultiple && <p className="mb-2 text-[10px] text-amber-400 font-semibold">Multiple answers allowed</p>}
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, idx) => (
                  <button key={idx} onClick={() => toggleCorrect(q.id, idx)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${opt.isCorrect ? 'border-emerald-500 bg-emerald-600/20 text-emerald-400' : 'border-gray-200 text-gray-400 hover:border-gray-600'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded text-[10px] ${opt.isCorrect ? 'bg-emerald-500 text-gray-900' : 'bg-gray-700 text-gray-500'}`}>
                      {opt.isCorrect ? <Check className="w-3 h-3" /> : ''}
                    </span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
