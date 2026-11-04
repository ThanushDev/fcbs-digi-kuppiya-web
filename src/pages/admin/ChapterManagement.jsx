import { useState, useEffect } from 'react'
import { getChapters, addChapter, updateChapter, deleteChapter, getAllSubjects, getSemesters } from '../../services/firestore'
import { ExternalLink } from 'lucide-react'

export default function ChapterManagement() {
  const [chapters, setChapters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('')
  
  const [form, setForm] = useState({ title: '', subjectId: '', order: '', driveLink: '' })
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
    
    const payload = { 
      title: form.title, 
      subjectId: form.subjectId, 
      order: Number(form.order) || 0,
      driveLink: form.driveLink || '' 
    }
    
    if (editing) {
      await updateChapter(editing, payload)
      setEditing(null)
    } else {
      await addChapter(payload)
    }
    
    setForm({ title: '', subjectId: filterSubject, order: '', driveLink: '' })
    load()
  }

  const handleEdit = (c) => {
    setEditing(c.id)
    setForm({ 
      title: c.title, 
      subjectId: c.subjectId, 
      order: String(c.order || ''), 
      driveLink: c.driveLink || '' 
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this chapter and all its resources?')) return
    await deleteChapter(id)
    load()
  }

  const getSubjectDetails = (id) => {
    const s = subjects.find((sub) => sub.id === id)
    if (!s) return null
    return s
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Chapter Management</h1>

      <div className="mb-6">
        <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setForm({ ...form, subjectId: e.target.value, driveLink: '' }) }}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none focus:border-indigo-500 min-w-[300px] select-field">
          <option value="">Select a Subject first</option>
          {subjects.map((s) => {
            const dept = s.department ? `[${s.department.toUpperCase()}]` : ''
            const spec = s.specialization && s.specialization !== 'all' ? `[${s.specialization}]` : ''
            return <option key={s.id} value={s.id}>{dept} {spec} {s.name}</option>
          })}
        </select>
      </div>

      {filterSubject && (
        <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-5">
          <input type="text" placeholder="Chapter Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 input-field" required />
          
          <input type="url" placeholder="Google Drive Link (Optional)" value={form.driveLink} onChange={(e) => setForm({ ...form, driveLink: e.target.value })}
            className="flex-1 min-w-[250px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 input-field" />

          <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })}
            className="w-20 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 input-field" />
          
          <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-gray-900 hover:bg-indigo-700 transition btn-primary">
            {editing ? 'Update' : 'Add Chapter'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', subjectId: filterSubject, order: '', driveLink: '' }) }}
            className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-600 transition">Cancel</button>}
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-400 mt-2">Loading...</p>
        </div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{filterSubject ? 'No chapters yet for this subject.' : 'Select a subject above.'}</div>
      ) : (
        <div className="space-y-3">
          {chapters.map((c) => {
            const subject = getSubjectDetails(c.subjectId)
            return (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 card">
                <div className="flex items-center gap-4 w-full justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-400">{c.order || '—'}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{subject?.name || '—'}</p>
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

                  {c.driveLink && (
                    <a href={c.driveLink} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 inline" /> Drive Link
                    </a>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button onClick={() => handleEdit(c)} className="rounded px-3 py-1 text-xs text-gray-400 hover:text-indigo-400 transition">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="rounded px-3 py-1 text-xs text-gray-400 hover:text-red-400 transition">Del</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
