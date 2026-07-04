import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getQuizzes, addQuiz, updateQuiz, deleteQuiz, getAllSubjects, getAttempts } from '../../services/firestore'
import { exportToCSV } from '../../utils/export'

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', timeLimit: '10', password: '', subjectId: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    setQuizzes(await getQuizzes())
    setSubjects(await getAllSubjects())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return
    if (editing) {
      await updateQuiz(editing, form)
      setEditing(null)
    } else {
      await addQuiz(form)
    }
    setForm({ title: '', timeLimit: '10', password: '', subjectId: '' })
    load()
  }

  const handleEdit = (q) => {
    setEditing(q.id)
    setForm({ title: q.title, timeLimit: String(q.timeLimit || 10), password: q.password || '', subjectId: q.subjectId || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this quiz and all its questions/attempts?')) return
    await deleteQuiz(id)
    load()
  }

  const exportResults = async (quiz) => {
    const attempts = await getAttempts(quiz.id)
    if (attempts.length === 0) return alert('No attempts for this quiz.')
    exportToCSV(attempts, `${quiz.title.replace(/\s+/g, '_')}_results`, [
      { label: 'User Name', accessor: (a) => a.userName },
      { label: 'Email', accessor: (a) => a.userEmail },
      { label: 'Score', accessor: (a) => a.score },
      { label: 'Total', accessor: (a) => a.total },
      { label: 'Percentage', accessor: (a) => a.total ? Math.round((a.score / a.total) * 100) : 0 },
      { label: 'Date', accessor: (a) => a.createdAt?.toDate?.().toISOString() || '' },
    ])
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Quiz Management</h1>

      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-gray-800 bg-[#141726] p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Quiz Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-rose-500" required />
          <input type="number" placeholder="Time (min)" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
            className="w-28 rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-rose-500" />
          <input type="text" placeholder="Password (optional)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-40 rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-rose-500" />
          <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            className="rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-rose-500">
            <option value="">No subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-rose-600 px-6 py-2.5 font-semibold text-white hover:bg-rose-700 transition">
            {editing ? 'Update' : 'Create Quiz'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', timeLimit: '10', password: '', subjectId: '' }) }}
            className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-600 transition">Cancel</button>}
        </div>
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No quizzes yet.</div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <div key={q.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#141726] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/20 text-lg">📝</div>
                <div>
                  <p className="font-semibold text-white">{q.title}</p>
                  <p className="text-xs text-gray-500">
                    {q.timeLimit} min{q.password ? ' · Password protected' : ''}
                    {q.subjectId ? ` · ${subjects.find((s) => s.id === q.subjectId)?.name || ''}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/quizzes/${q.id}/questions`}
                  className="rounded-lg bg-indigo-600/20 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/30 transition">
                  Questions
                </Link>
                <button onClick={() => exportResults(q)}
                  className="rounded-lg bg-emerald-600/20 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition">
                  Results
                </button>
                <button onClick={() => handleEdit(q)}
                  className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-600 transition">
                  Edit
                </button>
                <button onClick={() => handleDelete(q.id)}
                  className="rounded-lg bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/30 transition">
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
