import { useState, useEffect } from 'react'
import { getAllSubjects, getAllResourcesByType, addResourceItem, updateResourceItem, deleteResourceItem } from '../../services/firestore'

export default function VideoManagement() {
  const [items, setItems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', subjectId: '', fileUrl: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    const [i, s] = await Promise.all([getAllResourcesByType('video'), getAllSubjects()])
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
      await addResourceItem({ ...form, type: 'video' })
    }
    setForm({ title: '', subjectId: '', fileUrl: '' })
    load()
  }

  const handleEdit = (item) => {
    setEditing(item.id)
    setForm({ title: item.title, subjectId: item.subjectId, fileUrl: item.fileUrl || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this video?')) return
    await deleteResourceItem(id)
    load()
  }

  return (
    <div className="p-1 md:p-4 text-black">
      <h1 className="mb-6 text-2xl font-black tracking-wider text-black uppercase">
        Video Matrix Management
      </h1>

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl bg-white p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap gap-4">
          <input 
            type="text" 
            placeholder="Video Title" 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 min-w-[240px] rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-black outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition font-medium" 
            required 
          />
          
          <select 
            value={form.subjectId} 
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-black outline-none cursor-pointer font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]" 
            required
          >
            <option value="" className="bg-white text-black">Select Subject</option>
            {subjects.map((s) => {
              const dept = s.department ? `[${s.department.toUpperCase()}]` : ''
              const spec = s.specialization && s.specialization !== 'all' ? `[${s.specialization}]` : ''
              return <option key={s.id} value={s.id} className="bg-white text-black">{dept} {spec} {s.name}</option>
            })}
          </select>
          
          <input 
            type="text" 
            placeholder="YouTube Video ID (e.g., dQw4w9WgXcQ)" 
            value={form.fileUrl} 
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            className="flex-1 min-w-[240px] rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-black outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition font-medium" 
          />
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="submit" className="flex-1 sm:flex-none rounded-xl bg-blue-600 px-6 py-2 text-sm font-extrabold tracking-wider text-white hover:bg-blue-700 transition shadow-sm">
              {editing ? 'UPDATE' : 'ADD VIDEO'}
            </button>
            {editing && (
              <button 
                type="button" 
                onClick={() => { setEditing(null); setForm({ title: '', subjectId: '', fileUrl: '' }) }}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium tracking-wide animate-pulse">Loading Video Stream...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50">No videos mapped in this terminal yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const subject = subjects.find((s) => s.id === item.subjectId)
            return (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-white p-4 gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate text-sm tracking-wide">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        {subject?.name || 'Unknown Subject'}
                      </p>
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
                
                <div className="flex gap-2 justify-end shrink-0 border-t border-gray-100 pt-3 sm:pt-0 sm:border-t-0">
                  {item.fileUrl && (
                    <button 
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${item.fileUrl}`, '_blank')}
                      className="rounded-xl bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition tracking-wider uppercase"
                    >
                      Preview
                    </button>
                  )}
                  <button 
                    onClick={() => handleEdit(item)}
                    className="rounded-xl bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 transition tracking-wider uppercase"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition tracking-wider uppercase shadow-sm"
                  >
                    Del
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}