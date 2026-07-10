import { useState, useEffect } from 'react'
import { getSemesters, addSemester, updateSemester, deleteSemester } from '../../services/firestore'
import { SEMESTERS } from '../../utils/constants'

export default function SemesterManagement() {
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', department: '' })
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    const data = await getSemesters()
    setSemesters(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.department) return
    const payload = { name: form.name, department: form.department, order: SEMESTERS.indexOf(form.name) }
    if (editing) {
      await updateSemester(editing, payload)
      setEditing(null)
    } else {
      await addSemester(payload)
    }
    setForm({ name: '', department: '' })
    load()
  }

  const handleEdit = (s) => {
    setEditing(s.id)
    setForm({ name: s.name, department: s.department })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this semester?')) return
    await deleteSemester(id)
    load()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Semester Management</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-5">
        <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500">
          <option value="">Select Semester</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500">
          <option value="">All Departments</option>
          <option value="bms">BMS</option>
          <option value="lcs">LCS</option>
          <option value="both">Both</option>
        </select>
        <button type="submit"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-gray-900 hover:bg-indigo-700 transition">
          {editing ? 'Update' : 'Add Semester'}
        </button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', department: '' }) }}
          className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-600 transition">Cancel</button>}
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : semesters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No semesters yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-lg bg-indigo-600/20 px-3 py-1 text-xs font-semibold text-indigo-400">{s.department}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(s)} className="text-xs text-gray-400 hover:text-indigo-400 transition">Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-xs text-gray-400 hover:text-red-400 transition">Del</button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{s.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
