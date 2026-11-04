import { useState, useEffect } from 'react'
import { getAllSubjects, getAllResourcesByType, addResourceItem, updateResourceItem, deleteResourceItem } from '../../services/firestore'

export default function ShortNoteManagement() {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', subjectId: '', fileUrl: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    const [i, s] = await Promise.all([getAllResourcesByType('short_note'), getAllSubjects()])
    setItems(i)
    setSubjects(s)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.subjectId) return
    if (editing) {
      await updateResourceItem(editing, form)
      setEditing(null)
    } else {
      await addResourceItem({ ...form, type: 'short_note' })
    }
    setForm({ title: '', subjectId: '', fileUrl: '' })
    load()
  }

  const handleEdit = (item) => {
    setEditing(item.id)
    setForm({ title: item.title, subjectId: item.subjectId, fileUrl: item.fileUrl || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this short note?')) return
    await deleteResourceItem(id)
    load()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Short Notes</h1>

      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" required />
          <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" required>
            <option value="">Select Subject</option>
            {subjects.map((s) => {
              const dept = s.department ? `[${s.department.toUpperCase()}]` : ''
              const spec = s.specialization && s.specialization !== 'all' ? `[${s.specialization}]` : ''
              return <option key={s.id} value={s.id}>{dept} {spec} {s.name}</option>
            })}
          </select>
          <input type="url" placeholder="Google Drive Link" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" />
          <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-gray-900 hover:bg-indigo-700 transition">
            {editing ? 'Update' : 'Add'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', subjectId: '', fileUrl: '' }) }}
            className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-600 transition">Cancel</button>}
        </div>
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No short notes added yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const subject = subjects.find((s) => s.id === item.subjectId)
            return (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">{subject?.name || 'Unknown'}</p>
                      {subject?.department && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${subject.department === 'bms' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {subject.department}
                        </span>
                      )}
                      {subject?.specialization && subject.specialization !== 'all' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-100 text-amber-800">
                          {subject.specialization.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {item.fileUrl && (
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg bg-blue-600/20 px-4 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition">Open</a>
                  )}
                  <button onClick={() => handleEdit(item)}
                    className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-600 transition">Edit</button>
                  <button onClick={() => handleDelete(item.id)}
                    className="rounded-lg bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/30 transition">Del</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}