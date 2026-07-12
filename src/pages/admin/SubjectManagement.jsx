import { useState, useEffect } from 'react'
import { getSubjects, getAllSubjects, addSubject, updateSubject, deleteSubject, getSemesters } from '../../services/firestore'
import { SEMESTERS } from '../../utils/constants'

// BMS Specialization ලැයිස්තුව
const BMS_SPECIALIZATIONS = [
  { value: 'all', label: 'General Degree / Common' },
  { value: 'accounting', label: 'Accounting Special' },
  { value: 'marketing', label: 'Marketing Special' },
  { value: 'hrm', label: 'HRM Special' },
  { value: 'management', label: 'Management Special' },
  { value: 'info_management', label: 'Information Management Special' }
]

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSem, setFilterSem] = useState('')
  
  // 🛠️ Form state එකට specialization: 'all' එකතු කළා
  const [form, setForm] = useState({ name: '', code: '', semesterId: '', description: '', specialization: 'all' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    setSemesters(await getSemesters())
    setSubjects(filterSem ? await getSubjects(filterSem) : await getAllSubjects())
    setLoading(false)
  }

  useEffect(() => { load() }, [filterSem])

  // 🔍 දැනට සිලෙක්ට් කරලා තියෙන සෙමෙස්ටර් එක Year 3 හෝ Year 4 ද සහ බී.එම්.එස් ද කියලා බලන ලොජික් එක
  const selectedSemester = semesters.find(s => s.id === form.semesterId)
  const showSpecializationDropdown = 
    selectedSemester && 
    selectedSemester.department === 'bms' && 
    (selectedSemester.name?.includes('Y3') || selectedSemester.name?.includes('Y4'))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.semesterId) return

    const payload = { 
      name: form.name, 
      code: form.code, 
      semesterId: form.semesterId, 
      description: form.description,
      // Year 3/4 BMS නෙමේ නම් auto 'all' (General) විදියට සේව් වෙනවා
      specialization: showSpecializationDropdown ? form.specialization : 'all'
    }

    if (editing) {
      await updateSubject(editing, payload)
      setEditing(null)
    } else {
      await addSubject(payload)
    }
    setForm({ name: '', code: '', semesterId: '', description: '', specialization: 'all' })
    load()
  }

  const handleEdit = (s) => {
    setEditing(s.id)
    setForm({ 
      name: s.name, 
      code: s.code || '', 
      semesterId: s.semesterId, 
      description: s.description || '',
      specialization: s.specialization || 'all'
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject and all its chapters/resources?')) return
    await deleteSubject(id)
    load()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Subject Management</h1>

      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Subject Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" required />
          
          <input type="text" placeholder="Subject Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="w-32 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" />
          
          <select value={form.semesterId} onChange={(e) => setForm({ ...form, semesterId: e.target.value, specialization: 'all' })}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" required>
            <option value="">Select Semester</option>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
          </select>

          {/* 🔄 🚀 CONDITIONAL DROPDOWN: BMS Year 3 හෝ 4 නම් විතරක් ලයිව් වෙනවා මචං */}
          {showSpecializationDropdown && (
            <select value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="rounded-lg border border-amber-300 bg-amber-50/50 px-4 py-2.5 text-gray-900 outline-none focus:border-amber-500 font-semibold animate-fade-in">
              {BMS_SPECIALIZATIONS.map((spec) => (
                <option key={spec.value} value={spec.value}>{spec.label}</option>
              ))}
            </select>
          )}

          <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-gray-900 hover:bg-indigo-700 transition">
            {editing ? 'Update' : 'Add Subject'}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', code: '', semesterId: '', description: '', specialization: 'all' }) }}
            className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-600 transition">Cancel</button>}
        </div>
        <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" rows={2} />
      </form>

      <div className="mb-4">
        <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none focus:border-indigo-500">
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
            const specLabel = BMS_SPECIALIZATIONS.find(sp => sp.value === s.specialization)?.label
            return (
              <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col justify-between">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-lg bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-400">{sem?.name || '—'}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(s)} className="text-xs text-gray-400 hover:text-indigo-400 transition">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-gray-400 hover:text-red-400 transition">Del</button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{s.name}</h3>
                  {s.code && <p className="text-xs text-gray-500 mt-1">{s.code}</p>}
                  {s.description && <p className="mt-2 text-xs text-gray-400 line-clamp-2">{s.description}</p>}
                </div>
                
                {/* 🏷️ Specialization Tag එක UI එකේ පෙන්වන්න */}
                {s.specialization && s.specialization !== 'all' && (
                  <span className="mt-3 block w-fit text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md uppercase border border-amber-200">
                    🎯 {specLabel}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}