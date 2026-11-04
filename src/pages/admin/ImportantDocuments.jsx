import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { DEPARTMENTS, BATCHES } from '../../utils/constants'
import { useToast } from '../../contexts/ToastContext'
import { FileText, Plus, Trash2, ExternalLink, Eye, EyeOff, Save, List, ToggleLeft, Link, BookOpen, Users } from 'lucide-react'

export default function ImportantDocuments() {
  const { showToast } = useToast()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    driveUrl: '',
    targetBatch: 'all',
    targetDepartment: 'all',
    active: true
  })
  const [submitting, setSubmitting] = useState(false)

  const loadDocs = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'important_documents'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setDocs(list)
    } catch {
      showToast('Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadDocs() }, [loadDocs])

  const handleChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [key]: value })
  }

  const resetForm = () => {
    setForm({ title: '', driveUrl: '', targetBatch: 'all', targetDepartment: 'all', active: true })
    setShowForm(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return showToast('Document title is required', 'error')
    if (!form.driveUrl.trim()) return showToast('Document URL is required', 'error')

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'important_documents'), {
        title: form.title.trim(),
        driveUrl: form.driveUrl.trim(),
        targetBatch: form.targetBatch,
        targetDepartment: form.targetDepartment,
        active: form.active,
        createdAt: new Date().toISOString()
      })
      showToast('Document added successfully', 'success')
      resetForm()
      loadDocs()
    } catch {
      showToast('Failed to add document', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (docId, currentActive) => {
    try {
      await updateDoc(doc(db, 'important_documents', docId), { active: !currentActive })
      showToast(`Document ${!currentActive ? 'activated' : 'deactivated'}`, 'success')
      loadDocs()
    } catch {
      showToast('Failed to update document', 'error')
    }
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await deleteDoc(doc(db, 'important_documents', docId))
      showToast('Document deleted', 'success')
      loadDocs()
    } catch {
      showToast('Failed to delete document', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Important Documents
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage documents visible to students based on batch & department</p>
        </div>
      </div>

      {/* Create Form */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-800">{showForm ? 'Close Form' : 'Add New Document'}</span>
          </div>
          <span className={`text-slate-400 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`}>
            <Plus className="w-4 h-4" />
          </span>
        </button>

        {showForm && (
          <form onSubmit={handleCreate} className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  <FileText className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Document Title <span className="text-rose-400">*</span>
                </label>
                <input type="text" value={form.title} onChange={handleChange('title')}
                  placeholder="e.g., Academic Calendar 2026"
                  className="input-field py-2 text-xs" required />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  <Link className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Document URL <span className="text-rose-400">*</span>
                </label>
                <input type="url" value={form.driveUrl} onChange={handleChange('driveUrl')}
                  placeholder="https://drive.google.com/..."
                  className="input-field py-2 text-xs" required />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Target Batch
                </label>
                <select value={form.targetBatch} onChange={handleChange('targetBatch')}
                  className="select-field py-2 text-xs">
                  <option value="all">All Batches</option>
                  {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  <BookOpen className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Target Department
                </label>
                <select value={form.targetDepartment} onChange={handleChange('targetDepartment')}
                  className="select-field py-2 text-xs">
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-300 ${form.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${form.active ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <span className="text-[11px] font-semibold text-slate-600">
                {form.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition shadow-sm shadow-indigo-200 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Document'}
            </button>
          </form>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <List className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">All Documents ({docs.length})</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loader-glow !w-6 !h-6" />
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FileText className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-xs font-medium">No documents added yet</p>
            <p className="text-[10px] text-slate-300 mt-1">Click "Add New Document" above to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {docs.map((docItem) => (
              <div key={docItem.id} className="px-5 py-4 hover:bg-slate-50/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${docItem.active ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <FileText className={`w-4 h-4 ${docItem.active ? 'text-indigo-500' : 'text-slate-400'}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 truncate">{docItem.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${docItem.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {docItem.active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{docItem.driveUrl}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {docItem.targetBatch === 'all' ? 'All Batches' : docItem.targetBatch}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {docItem.targetDepartment === 'all' ? 'All Departments' : docItem.targetDepartment.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggleActive(docItem.id, docItem.active)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${docItem.active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      title={docItem.active ? 'Deactivate' : 'Activate'}>
                      {docItem.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <a href={docItem.driveUrl} target="_blank" rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => handleDelete(docItem.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
