import { useState, useEffect } from 'react'
import { getBatchPermissions, setBatchPermission, deleteBatchPermission } from '../../services/firestore'
import { BATCHES as INITIAL_BATCHES } from '../../utils/constants'

// 📌 ඩේටාබේස් එක මත යැපෙන්නේ නැතිව සෙමෙස්ටර් 8ම ස්ථාවරව පෙන්වීමට hardcoded array එකක් ගන්නවා.
// GPACalculator එකේ පාවිච්චි කරන ID (11, 12, 21...) ම මෙතනටත් දෙනවා.
const FIX_SEMESTERS = [
  { id: '11', name: 'Y1S1' },
  { id: '12', name: 'Y1S2' },
  { id: '21', name: 'Y2S1' },
  { id: '22', name: 'Y2S2' },
  { id: '31', name: 'Y3S1' },
  { id: '32', name: 'Y3S2' },
  { id: '41', name: 'Y4S1' },
  { id: '42', name: 'Y4S2' },
]

export default function BatchManagement() {
  const [permissions, setPermissions] = useState([])
  const [dynamicBatches, setDynamicBatches] = useState([]) 
  const [newBatchName, setNewBatchName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    const load = async () => {
      // 🔄 getSemesters() වෙනුවට සෘජුවම getBatchPermissions() විතරක් කෝල් කරනවා
      const perms = await getBatchPermissions()
      setPermissions(perms)

      // 🔄 Firestore එකේ තියෙන බැච් සහ Constants වල තියෙන බැච් දෙකම එකතු කරලා යුනික් ලිස්ට් එකක් හදනවා
      const dbBatchNames = perms.map(p => p.batchName)
      const combined = Array.from(new Set([...INITIAL_BATCHES, ...dbBatchNames]))
      setDynamicBatches(combined)
      
      setLoading(false)
    }
    load()
  }, [])

  const getBatchPerm = (batch) => permissions.find((p) => p.batchName === batch)

  const toggleSemester = async (batch, semId) => {
    setSaving(batch)
    const perm = getBatchPerm(batch)
    const current = perm?.semesterIds || []
    const next = current.includes(semId) ? current.filter((id) => id !== semId) : [...current, semId]
    
    await setBatchPermission(batch, next)
    const perms = await getBatchPermissions()
    setPermissions(perms)
    setSaving(null)
  }

  const handleAddBatch = async (e) => {
    e.preventDefault()
    if (!newBatchName.trim()) return

    const formattedBatch = newBatchName.trim()
    
    if (dynamicBatches.includes(formattedBatch)) {
      alert('This batch already exists!')
      return
    }

    setSaving(formattedBatch)
    await setBatchPermission(formattedBatch, [])
    
    const perms = await getBatchPermissions()
    setPermissions(perms)
    setDynamicBatches(Array.from(new Set([...dynamicBatches, formattedBatch])))
    setNewBatchName('')
    setSaving(null)
  }

  const removeBatch = async (id, batchName) => {
    if (!confirm(`Remove all permissions for batch ${batchName}?`)) return
    await deleteBatchPermission(id)
    const perms = await getBatchPermissions()
    setPermissions(perms)
    
    if (!INITIAL_BATCHES.includes(batchName)) {
      setDynamicBatches(dynamicBatches.filter(b => b !== batchName))
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Batch Permissions Control 🔐</h1>
      <p className="mb-6 text-sm text-gray-400">Control which semesters each batch can access in real-time.</p>

      {/* ➕ Add New Batch Form */}
      <form onSubmit={handleAddBatch} className="mb-6 flex max-w-md gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <input 
          type="text" 
          value={newBatchName} 
          onChange={(e) => setNewBatchName(e.target.value)} 
          placeholder="e.g., 24/25, 25/26" 
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-indigo-500 flex-1"
        />
        <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
          Add Batch
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70">
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Batch</th>
              {/* 🔄 දැන් මෙතනට ස්ථාවර සෙමෙස්ටර් 8ම ලෝඩ් වෙනවා */}
              {FIX_SEMESTERS.map((s) => (
                <th key={s.id} className="px-3 py-4 text-xs font-semibold text-gray-400 uppercase text-center">{s.name}</th>
              ))}
              <th className="px-4 py-4" />
            </tr>
          </thead>
          <tbody>
            {dynamicBatches.map((batch) => {
              const perm = getBatchPerm(batch)
              const isSaving = saving === batch
              return (
                <tr key={batch} className="border-b border-gray-200/50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{batch}</td>
                  {/* 🔄 රෝස් ඇතුළෙත් FIX_SEMESTERS map කරනවා */}
                  {FIX_SEMESTERS.map((s) => {
                    const checked = perm?.semesterIds?.includes(s.id) || false
                    return (
                      <td key={s.id} className="px-3 py-4 text-center">
                        <button
                          disabled={isSaving}
                          onClick={() => toggleSemester(batch, s.id)}
                          className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md border transition ${checked ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-200 bg-transparent hover:border-gray-400'} ${isSaving ? 'opacity-40' : ''}`}>
                          {checked ? '✓' : ''}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-4 py-4 text-center">
                    {perm && (
                      <button onClick={() => removeBatch(perm.id, batch)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium transition">Clear</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {permissions.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500">Click any checkbox above to grant semester access to a batch.</p>
        </div>
      )}
    </div>
  )
}