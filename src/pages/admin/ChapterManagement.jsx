import { useState, useEffect } from 'react'
import { getChapters, addChapter, updateChapter, deleteChapter, getAllSubjects, getSemesters } from '../../services/firestore'

export default function ChapterManagement() {
  const [chapters, setChapters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('')
  const [form, setForm] = useState({ title: '', subjectId: '', order: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    setSubjects(await getAllSubjects())
    setSemesters(await getSemesters())
    if (filterSubject) {
      setChapters(await getChapters(filterSubject))
    } else {
      setChapters([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [filterSubject])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.subjectId) return
    const payload = { title: form.title, subjectId: form.subjectId, order: Number(form.order) || 0 }
    if (editing) {
      await updateChapter(editing, payload)
      setEditing(null)
    } else {
      await addChapter(payload)
    }
    setForm({ title: '', subjectId: filterSubject, order: '' })
    load()
  }

  const handleEdit = (c) => {
    setEditing(c.id)
    setForm({ title: c.title, subjectId: c.subjectId, order: String(c.order || '') })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this chapter and all its resources?')) return
    await deleteChapter(id)
    load()
  }

  const getSubjectName = (id) => subjects.find((s) => s.id === id)?.name || '—'

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Chapter Management</h1>

      <div className="mb-6">
        <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setForm({ ...form, subjectId: e.target.value }) }}
          className="rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2 text-white outline-none focus:border-indigo-500 w-64">
          <option value="">Select a Subject first</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({semesters.find((x) => x.id === s.semesterId)?.name || '—'})</option>
          ))}
        </select>
      </div>

      {filterSubject && (
        <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-3 rounded-xl border border-gray-800 bg-[#141726] p-5">
          <input type="text" placeholder="Chapter Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" required />
          <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })}
            className="w-20 rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
          <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 transition">
            {editing ? 'Update' : 'Add Chapter'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', subjectId: filterSubject, order: '' }) }}
            className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-600 transition">Cancel</button>}
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{filterSubject ? 'No chapters yet for this subject.' : 'Select a subject above.'}</div>
      ) : (
        <div className="space-y-3">
          {chapters.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#141726] p-4">
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-400">{c.order || '—'}</span>
                <div>
                  <h3 className="font-semibold text-white">{c.title}</h3>
                  <p className="text-xs text-gray-500">{getSubjectName(c.subjectId)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(c)} className="rounded px-3 py-1 text-xs text-gray-400 hover:text-indigo-400 transition">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="rounded px-3 py-1 text-xs text-gray-400 hover:text-red-400 transition">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
