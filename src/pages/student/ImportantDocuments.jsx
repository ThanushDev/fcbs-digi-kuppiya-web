import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { FileText, ExternalLink, ArrowLeft, BookOpen, Users, Eye, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ImportantDocuments() {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  const userBatch = userData?.batch || ''
  const userDept = (userData?.department || '').toLowerCase()

  const loadDocs = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'important_documents'))
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      const filtered = all.filter((d) => {
        if (!d.active) {
          console.log(`[ImportantDocuments] SKIPPED (inactive): "${d.title}"`)
          return false
        }

        const batchMatch = d.targetBatch === 'all' || d.targetBatch === userBatch
        const deptMatch = d.targetDepartment === 'all' || d.targetDepartment === userDept

        const passed = batchMatch && deptMatch
        return passed
      })

      filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setDocs(filtered)
    } catch (err) {
      console.error('[ImportantDocuments] Error loading documents:', err)
    } finally {
      setLoading(false)
    }
  }, [userBatch, userDept])

  useEffect(() => { loadDocs() }, [loadDocs])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 border border-slate-200/60 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Important Documents
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Showing documents for {userDept.toUpperCase()} | {userBatch}
          </p>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="loader-glow !w-8 !h-8" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200/40">
          <FileText className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-sm font-medium">No documents available</p>
          <p className="text-[11px] text-slate-300 mt-1">Your department or batch has no documents assigned yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((docItem) => (
            <a
              key={docItem.id}
              href={docItem.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-indigo-100/30 hover:border-indigo-300/60 transition-all duration-200 active:scale-[0.98]"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 flex items-center justify-center mb-4 group-hover:from-indigo-100 group-hover:to-indigo-200/60 transition">
                <FileText className="w-6 h-6 text-indigo-500" />
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition mb-2 line-clamp-2">
                {docItem.title}
              </h3>

              {/* Tags */}
              
              {/* Open link */}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-500 group-hover:text-indigo-600 transition">
                <ExternalLink className="w-3.5 h-3.5" />
                Open Document
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
