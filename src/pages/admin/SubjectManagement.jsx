import { useState, useEffect } from 'react'
import { getSubjects, getAllSubjects, addSubject, updateSubject, deleteSubject, getSemesters } from '../../services/firestore'

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSem, setFilterSem] = useState('')
  const [form, setForm] = useState({ name: '', code: '', semesterId: '', description: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    setSemesters(await getSemesters())
    setSubjects(filterSem ? await getSubjects(filterSem) : await getAllSubjects())
    setLoading(false)
  }

  useEffect(() => { load() }, [filterSem])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.semesterId) return
    if (editing) {
      await updateSubject(editing, { name: form.name, code: form.code, semesterId: form.semesterId, description: form.description })
      setEditing(null)
    } else {
      await addSubject({ name: form.name, code: form.code, semesterId: form.semesterId, description: form.description })
    }
    setForm({ name: '', code: '', semesterId: '', description: '' })
    load()
  }

  const handleEdit = (s) => {
    setEditing(s.id)
    setForm({ name: s.name, code: s.code || '', semesterId: s.semesterId, description: s.description || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject and all its chapters/resources?')) return
    await deleteSubject(id)
    load()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Subject Management</h1>

      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-gray-800 bg-[#141726] p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Subject Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" required />
          <input type="text" placeholder="Subject Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="w-32 rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
          <select value={form.semesterId} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}
            className="rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" required>
            <option value="">Select Semester</option>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 transition">
            {editing ? 'Update' : 'Add Subject'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', code: '', semesterId: '', description: '' }) }}
            className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-600 transition">Cancel</button>}
        </div>
        <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2.5 text-white outline-none focus:border-indigo-500" rows={2} />
      </form>

      <div className="mb-4">
        <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)}
          className="rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2 text-white outline-none focus:border-indigo-500">
          <option value="">All Semesters</option>
          {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No subjects found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const sem = semesters.find((x) => x.id === s.semesterId)
            return (
              <div key={s.id} className="rounded-xl border border-gray-800 bg-[#141726] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-lg bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-400">{sem?.name || '—'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(s)} className="text-xs text-gray-400 hover:text-indigo-400 transition">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-gray-400 hover:text-red-400 transition">Del</button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white">{s.name}</h3>
                {s.code && <p className="text-xs text-gray-500 mt-1">{s.code}</p>}
                {s.description && <p className="mt-2 text-xs text-gray-400 line-clamp-2">{s.description}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
