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
    <div className="p-1 md:p-4 text-slate-100">
      <h1 className="mb-6 text-2xl font-black tracking-wider bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent uppercase">
        Video Matrix Management
      </h1>

      {/* Input Form Card */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-white/[0.08] bg-[#0b1528]/50 backdrop-blur-xl p-5 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
        <div className="flex flex-wrap gap-4">
          <input 
            type="text" 
            placeholder="Video Title" 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 min-w-[240px] rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition font-medium" 
            required 
          />
          
          <select 
            value={form.subjectId} 
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            className="rounded-xl border border-white/10 bg-[#09101d] px-4 py-2 text-sm text-slate-300 outline-none focus:border-purple-500/50 cursor-pointer font-medium" 
            required
          >
            <option value="" className="bg-[#0b1528]">Select Subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id} className="bg-[#0b1528]">{s.name}</option>)}
          </select>
          
          <input 
            type="text" 
            placeholder="YouTube Video ID (e.g., dQw4w9WgXcQ)" 
            value={form.fileUrl} 
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            className="flex-1 min-w-[240px] rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition font-medium" 
          />
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="submit" className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-sm font-extrabold tracking-wider text-white hover:opacity-90 transition shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              {editing ? 'UPDATE' : 'ADD VIDEO'}
            </button>
            {editing && (
              <button 
                type="button" 
                onClick={() => { setEditing(null); setForm({ title: '', subjectId: '', fileUrl: '' }) }}
                className="rounded-xl bg-slate-800 border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Videos List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium tracking-wide animate-pulse">Loading Video Stream...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-2xl bg-slate-950/10">No videos mapped in this terminal yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/[0.06] bg-[#0b1528]/40 backdrop-blur-md p-4 gap-4 hover:border-white/10 transition">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 truncate text-sm tracking-wide">{item.title}</p>
                  <p className="text-xs font-bold text-purple-400/80 uppercase mt-0.5 tracking-wider">
                    {subjects.find((s) => s.id === item.subjectId)?.name || 'Unknown Subject'}
                  </p>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex gap-2 justify-end shrink-0 border-t border-white/[0.04] pt-3 sm:pt-0 sm:border-t-0">
                {item.fileUrl && (
                  <button 
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${item.fileUrl}`, '_blank')}
                    className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition tracking-wider uppercase"
                  >
                    Preview
                  </button>
                )}
                <button 
                  onClick={() => handleEdit(item)}
                  className="rounded-xl bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition tracking-wider uppercase"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="rounded-xl bg-red-950/40 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30 transition tracking-wider uppercase"
                >
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