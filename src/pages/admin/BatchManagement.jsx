import { useState, useEffect } from 'react'
import { getSemesters, getBatchPermissions, setBatchPermission, deleteBatchPermission } from '../../services/firestore'
import { BATCHES } from '../../utils/constants'

export default function BatchManagement() {
  const [semesters, setSemesters] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    const load = async () => {
      const [sems, perms] = await Promise.all([getSemesters(), getBatchPermissions()])
      setSemesters(sems.sort((a, b) => a.order - b.order))
      setPermissions(perms)
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

  const removeBatch = async (id) => {
    if (!confirm('Remove all permissions for this batch?')) return
    await deleteBatchPermission(id)
    const perms = await getBatchPermissions()
    setPermissions(perms)
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Batch Permissions</h1>
      <p className="mb-6 text-sm text-gray-400">Control which semesters each batch can access.</p>

      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-[#141726]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Batch</th>
              {semesters.map((s) => (
                <th key={s.id} className="px-3 py-4 text-xs font-semibold text-gray-400 uppercase text-center">{s.name}</th>
              ))}
              <th className="px-4 py-4" />
            </tr>
          </thead>
          <tbody>
            {BATCHES.map((batch) => {
              const perm = getBatchPerm(batch)
              const isSaving = saving === batch
              return (
                <tr key={batch} className="border-b border-gray-800/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-semibold text-white">{batch}</td>
                  {semesters.map((s) => {
                    const checked = perm?.semesterIds?.includes(s.id) || false
                    return (
                      <td key={s.id} className="px-3 py-4 text-center">
                        <button
                          disabled={isSaving}
                          onClick={() => toggleSemester(batch, s.id)}
                          className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md border transition ${checked ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-700 bg-transparent hover:border-gray-600'} ${isSaving ? 'opacity-40' : ''}`}>
                          {checked ? '✓' : ''}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-4 py-4 text-center">
                    {perm && (
                      <button onClick={() => removeBatch(perm.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition">Clear</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {permissions.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-gray-800 p-6 text-center">
          <p className="text-sm text-gray-500">Click any checkbox above to grant semester access to a batch.</p>
        </div>
      )}
    </div>
  )
}
