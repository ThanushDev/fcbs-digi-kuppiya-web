import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../../contexts/ToastContext'
import {
  getTimetableSlots, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot,
  deleteTimetableSlotsByBatchAndDept,
} from '../../services/firestore'
import { DEPARTMENTS, BATCHES, WEEKDAYS } from '../../utils/constants'
import {
  Clock, Plus, Trash2, Eye, EyeOff, Save, X, Edit2,
  BookOpen, ShieldAlert, RotateCw, Library,
} from 'lucide-react'

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

export default function TimetableManagement() {
  const { showToast } = useToast()

  /* ---------- Data ---------- */
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  /* ---------- Filters ---------- */
  const [filterDept, setFilterDept] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [showHidden, setShowHidden] = useState(false)

  /* ---------- Add / Edit slot ---------- */
  const [editOpen, setEditOpen] = useState(false)
  const [editSlot, setEditSlot] = useState(null)
  const [editForm, setEditForm] = useState({
    day: '', startTime: '', endTime: '', subjectCode: '', subjectName: '',
    lecturer: '', specialization: '', durationMinutes: 60,
  })

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    department: '', batchYear: '', day: '', startTime: '', endTime: '',
    subjectCode: '', subjectName: '', lecturer: '', specialization: '', durationMinutes: 60,
  })

  const loadSlots = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTimetableSlots()
      setSlots(data)
    } catch (err) {
      console.error('Timetable load error:', err)
      showToast('Failed to load timetable slots', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadSlots() }, [loadSlots])

  const filteredSlots = useMemo(() => slots.filter((s) => {
    if (filterDept && String(s.department).toLowerCase() !== filterDept.toLowerCase()) return false
    if (filterBatch && String(s.batchYear).toLowerCase() !== filterBatch.toLowerCase()) return false
    if (filterDay && String(s.day).toLowerCase() !== filterDay.toLowerCase()) return false
    if (!showHidden && s.isHidden === true) return false
    return true
  }), [slots, filterDept, filterBatch, filterDay, showHidden])

  /* ---------- CRUD ---------- */
  const handleToggleHidden = async (id, currentlyHidden) => {
    try {
      await updateTimetableSlot(id, { isHidden: !currentlyHidden })
      showToast(`Slot ${!currentlyHidden ? 'hidden' : 'unhidden'}`, 'success')
      loadSlots()
    } catch (err) {
      showToast('Failed to update visibility', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable entry? This cannot be undone.')) return
    try {
      await deleteTimetableSlot(id)
      showToast('Slot deleted', 'success')
      loadSlots()
    } catch (err) {
      showToast('Failed to delete slot', 'error')
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editSlot) return
    try {
      await updateTimetableSlot(editSlot.id, {
        day: editForm.day,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        subjectCode: editForm.subjectCode,
        subjectName: editForm.subjectName,
        lecturer: editForm.lecturer,
        specialization: editForm.specialization || null,
        durationMinutes: Number(editForm.durationMinutes) || 60,
      })
      showToast('Timetable slot updated', 'success')
      setEditOpen(false)
      loadSlots()
    } catch (err) {
      showToast('Failed to update slot', 'error')
    }
  }

  const handleSaveAdd = async (e) => {
    e.preventDefault()
    if (!addForm.department || !addForm.batchYear || !addForm.day || !addForm.startTime) {
      showToast('Department, Batch, Day, and Start Time are required', 'error')
      return
    }
    try {
      await addTimetableSlot({
        ...addForm,
        department: addForm.department.toLowerCase(),
        durationMinutes: Number(addForm.durationMinutes) || 60,
      })
      showToast('Timetable slot added', 'success')
      setAddOpen(false)
      setAddForm({
        department: '', batchYear: '', day: '', startTime: '', endTime: '',
        subjectCode: '', subjectName: '', lecturer: '', specialization: '', durationMinutes: 60,
      })
      loadSlots()
    } catch (err) {
      showToast('Failed to add slot', 'error')
    }
  }

  /* ---------- Delete Entire Group ---------- */
  const handleDeleteGroup = async (department, batchYear) => {
    if (!window.confirm(`Delete ALL timetable slots for ${department.toUpperCase()} Batch ${batchYear}? This cannot be undone.`)) return
    try {
      const count = await deleteTimetableSlotsByBatchAndDept(department, batchYear)
      showToast(`Deleted ${count} slot(s) for ${department.toUpperCase()} Batch ${batchYear}`, 'success')
      loadSlots()
    } catch (err) {
      showToast('Failed to delete timetable group', 'error')
    }
  }

  /* ---------- Helpers ---------- */
  const specLabel = (code) => {
    if (!code) return 'General'
    const labels = {
      bmt: 'Business Management', mmt: 'Marketing Management',
      hrm: 'Human Resource Management', afm: 'Accounting & Financial Management',
      imt: 'Information Management Technology', lang: 'Languages', comm: 'Communications',
    }
    return labels[String(code).toLowerCase()] || code
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500">Loading timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-wide">Live Lecture Timetable</h1>
            </div>
            <p className="mt-1 text-xs text-gray-500 uppercase tracking-widest">
              Admin Management • CSV Upload • Manual Entry • Library Overrides
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Slot
            </button>
            <button
              onClick={loadSlots}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-indigo-700 transition"
            >
              <RotateCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: 'Total Slots', value: slots.length, color: 'from-indigo-500 to-purple-500' },
            { label: 'Visible', value: slots.filter(s => s.isHidden !== true).length, color: 'from-emerald-500 to-teal-500' },
            { label: 'Hidden', value: slots.filter(s => s.isHidden === true).length, color: 'from-gray-400 to-gray-600' },
            { label: 'Library Slots', value: slots.filter(s => /library/i.test(s.subjectCode || s.subjectName || '')).length, color: 'from-amber-400 to-orange-500' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-5 border border-gray-100 bg-white shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <div className="h-1 mt-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full gradient-x ${s.color}`} style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Table */}
        <div className="mb-8 rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Timetable Entries
            </h2>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
              >
                <option value="">All Batches</option>
                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
              >
                <option value="">All Days</option>
                {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button
                onClick={() => setShowHidden(!showHidden)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold border transition ${
                  showHidden
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {showHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showHidden ? 'Show Hidden' : 'Hide Hidden'}
              </button>
            </div>
          </div>

          {filteredSlots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">No timetable entries found</h3>
              <p className="text-xs text-gray-500">Try adjusting the filters or add a new slot.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10">Dept</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10">Batch</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10">Day</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10">Time</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10">Subject Code</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10">Subject Name</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10">Lecturer</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10">Spec</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10 text-right">Visibility</th>
                    <th className="px-4 py-3 text-gray-400 font-bold uppercase sticky top-0 z-10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSlots.map((s) => {
                    return (
                      <motion.tr
                        key={s.id}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={rowVariants}
                        className={`transition-colors ${
                          s.isHidden === true
                            ? 'bg-red-50 opacity-90'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-800">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200 bg-gray-100 text-indigo-700">
                            {s.department?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-mono">{s.batchYear}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium capitalize">{s.day}</td>
                        <td className="px-4 py-3 text-gray-800 font-mono">{s.startTime} — {s.endTime || '—'}</td>
                        <td className="px-4 py-3 text-gray-900 font-mono font-medium">{s.subjectCode}</td>
                        <td className="px-4 py-3 text-gray-600">{s.subjectName || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.lecturer || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{specLabel(s.specialization)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleHidden(s.id, s.isHidden === true)}
                            title={s.isHidden === true ? 'Unhide slot' : 'Hide slot'}
                            className={`p-1.5 rounded transition ${
                              s.isHidden === true
                                ? 'text-emerald-600 hover:bg-emerald-100'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {s.isHidden === true ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          <button
                            onClick={() => { setEditForm({ ...s, durationMinutes: s.durationMinutes || 60 }); setEditSlot(s); setEditOpen(true) }}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Entire Group Section */}
        <div className="mb-8 rounded-xl p-6 border border-amber-100 bg-amber-50 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Library className="w-3.5 h-3.5 text-amber-500" /> Bulk Delete Timetable Group
            </h2>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
              Delete all slots for a Dept + Batch
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            Select a Department and Batch to permanently delete ALL timetable slots for that combination.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 items-end">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
              <select
                value={addForm.department}
                onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Batch</label>
              <select
                value={addForm.batchYear}
                onChange={(e) => setAddForm({ ...addForm, batchYear: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
              >
                <option value="">Select Batch</option>
                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleDeleteGroup(addForm.department, addForm.batchYear)}
                disabled={!addForm.department || !addForm.batchYear}
                className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>

        {/* Add Slot Modal */}
        <AnimatePresence>
          {addOpen ? (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) setAddOpen(false) }}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
                className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Timetable Slot
                  </h3>
                  <button
                    onClick={() => setAddOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveAdd} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
                      <select
                        value={addForm.department}
                        onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Batch Year</label>
                      <select
                        value={addForm.batchYear}
                        onChange={(e) => setAddForm({ ...addForm, batchYear: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
                      >
                        <option value="">Select Batch</option>
                        {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Day</label>
                      <select
                        value={addForm.day}
                        onChange={(e) => setAddForm({ ...addForm, day: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
                      >
                        {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Time</label>
                      <input
                        type="time"
                        value={addForm.startTime}
                        onChange={(e) => setAddForm({ ...addForm, startTime: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Time</label>
                      <input
                        type="time"
                        value={addForm.endTime}
                        onChange={(e) => setAddForm({ ...addForm, endTime: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subject Code</label>
                      <input
                        type="text"
                        value={addForm.subjectCode}
                        onChange={(e) => setAddForm({ ...addForm, subjectCode: e.target.value })}
                        placeholder="e.g. BMT 3013"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subject Name</label>
                      <input
                        type="text"
                        value={addForm.subjectName}
                        onChange={(e) => setAddForm({ ...addForm, subjectName: e.target.value })}
                        placeholder="e.g. Operational Research"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lecturer</label>
                      <input
                        type="text"
                        value={addForm.lecturer}
                        onChange={(e) => setAddForm({ ...addForm, lecturer: e.target.value })}
                        placeholder="Lecturer name"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Specialization</label>
                      <select
                        value={addForm.specialization || ''}
                        onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value || null })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
                      >
                        <option value="">General / All</option>
                        <option value="bmt">BMT - Business Management</option>
                        <option value="mmt">MMT - Marketing Management</option>
                        <option value="hrm">HRM - Human Resource Management</option>
                        <option value="afm">AFM - Accounting & Financial Management</option>
                        <option value="imt">IMT - Information Management Technology</option>
                        <option value="lang">Languages</option>
                        <option value="comm">Communications</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={addForm.durationMinutes || 60}
                        onChange={(e) => setAddForm({ ...addForm, durationMinutes: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddOpen(false)}
                      className="px-4 py-2 rounded-md text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition"
                    >
                      <Save className="w-3.5 h-3.5 inline mr-1.5" /> Add Slot
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Edit Slot Modal */}
        <AnimatePresence>
          {editOpen && editSlot ? (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false) }}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
                className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Edit2 className="w-3.5 h-3.5 text-indigo-600" /> Edit Timetable Slot
                  </h3>
                  <button
                    onClick={() => setEditOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
                      <input
                        type="text"
                        value={editSlot.department || ''}
                        readOnly
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Batch Year</label>
                      <input
                        type="text"
                        value={editSlot.batchYear || ''}
                        readOnly
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Day</label>
                      <select
                        value={editForm.day}
                        onChange={(e) => setEditForm({ ...editForm, day: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
                      >
                        {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Time</label>
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Time</label>
                      <input
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subject Code</label>
                      <input
                        type="text"
                        value={editForm.subjectCode}
                        onChange={(e) => setEditForm({ ...editForm, subjectCode: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subject Name</label>
                      <input
                        type="text"
                        value={editForm.subjectName}
                        onChange={(e) => setEditForm({ ...editForm, subjectName: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lecturer</label>
                      <input
                        type="text"
                        value={editForm.lecturer}
                        onChange={(e) => setEditForm({ ...editForm, lecturer: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Specialization</label>
                      <select
                        value={editForm.specialization || ''}
                        onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value || null })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 select-field"
                      >
                        <option value="">General / All</option>
                        <option value="bmt">BMT - Business Management</option>
                        <option value="mmt">MMT - Marketing Management</option>
                        <option value="hrm">HRM - Human Resource Management</option>
                        <option value="afm">AFM - Accounting & Financial Management</option>
                        <option value="imt">IMT - Information Management Technology</option>
                        <option value="lang">Languages</option>
                        <option value="comm">Communications</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={editForm.durationMinutes || 60}
                        onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditOpen(false)}
                      className="px-4 py-2 rounded-md text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition"
                    >
                      <Save className="w-3.5 h-3.5 inline mr-1.5" /> Update Slot
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
