import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminDashboard() {
  const { userData } = useAuth()
  const [stats, setStats] = useState({ users: 0, bms: 0, lcs: 0, semesters: 0, subjects: 0 })
  
  // Notification States (targetDepartment එකතු කළා)
  const [notifications, setNotifications] = useState([])
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', targetBatch: 'all', targetDepartment: 'all', type: 'notice', zoomLink: '' })
  const [submitting, setSubmitting] = useState(false)

  // Dynamic Batches State
  const [dbBatches, setDbBatches] = useState([])

  const loadData = async () => {
    try {
      // 1. Active Batches ටික විතරක් ගන්නවා 
      let batchList = [];
      try {
        const batchesRef = collection(db, 'batchPermissions')
        const q = query(batchesRef, where('active', '==', true))
        const batchSnap = await getDocs(q)
        
        batchList = batchSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        batchList.sort((a, b) => {
          const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
          const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
          return dateB - dateA;
        });

        setDbBatches(batchList)
      } catch (batchErr) {
        console.error("❌ Batches Fetch Error:", batchErr)
      }

      // 2. ඉතිරි ස්ටැට්ස් සහ නොටිෆිකේෂන් ටික parallel ලෝඩ් කරනවා
      const [usersSnap, bmsSnap, lcsSnap, semSnap, subSnap, notifSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'users'), where('department', '==', 'bms'))),
        getDocs(query(collection(db, 'users'), where('department', '==', 'lcs'))),
        getDocs(collection(db, 'semesters')),
        getDocs(collection(db, 'subjects')),
        getDocs(collection(db, 'global_notifications'))
      ])

      setStats({
        users: usersSnap.size,
        bms: bmsSnap.size,
        lcs: lcsSnap.size,
        semesters: semSnap.size,
        subjects: subSnap.size,
      })

      const notifList = notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      notifList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setNotifications(notifList)

    } catch (err) {
      console.error("Dashboard general data loading error: ", err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleNotificationSubmit = async (e) => {
    e.preventDefault()
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) return
    setSubmitting(true)
    try {
      // Payload එකට targetDepartment එක යවනවා
      await addDoc(collection(db, 'global_notifications'), {
        title: noticeForm.title,
        message: noticeForm.message,
        targetBatch: noticeForm.targetBatch,
        targetDepartment: noticeForm.targetDepartment, // අලුතින් එකතු කළ කොටස
        type: noticeForm.type,
        zoomLink: noticeForm.type === 'zoom' ? noticeForm.zoomLink : '',
        createdAt: new Date().toISOString()
      })
      setNoticeForm({ title: '', message: '', targetBatch: 'all', targetDepartment: 'all', type: 'notice', zoomLink: '' })
      alert('Notification broadcasted successfully!')
      loadData()
    } catch (err) {
      alert('Error creating notification.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return
    try {
      await deleteDoc(doc(db, 'global_notifications', id))
      alert('Notification deleted!')
      loadData()
    } catch (err) {
      alert('Error deleting notification.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">Welcome back, {userData?.firstName || 'Admin'}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Users', value: stats.users, color: 'from-[#4f46e5] to-[#7c3aed]' },
          { label: 'BMS Students', value: stats.bms, color: 'from-[#059669] to-[#10b981]' },
          { label: 'LCS Students', value: stats.lcs, color: 'from-[#d97706] to-[#f59e0b]' },
          { label: 'Semesters', value: stats.semesters, color: 'from-[#dc2626] to-[#ef4444]' },
          { label: 'Subjects', value: stats.subjects, color: 'from-[#2563eb] to-[#3b82f6]' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 shadow-lg`}>
            <p className="text-sm font-medium text-white/80">{s.label}</p>
            <p className="mt-1 text-4xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📢 Broadcast New Notification / Zoom</h2>
          <form onSubmit={handleNotificationSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notification Title</label>
              <input type="text" value={noticeForm.title} onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})} className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., New Zoom Meeting Tonight" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Message / Description</label>
              <textarea rows="2" value={noticeForm.message} onChange={(e) => setNoticeForm({...noticeForm, message: e.target.value})} className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Enter notice details..." required />
            </div>
            
            {/* Target Batch සහ Target Department පේළිය */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Target Batch</label>
                <select value={noticeForm.targetBatch} onChange={(e) => setNoticeForm({...noticeForm, targetBatch: e.target.value})} className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-white outline-none">
                  <option value="all">All Batches</option>
                  {dbBatches.map((batch) => (
                    <option key={batch.id} value={batch.batchName}>
                      Batch {batch.batchName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Target Department</label>
                <select value={noticeForm.targetDepartment} onChange={(e) => setNoticeForm({...noticeForm, targetDepartment: e.target.value})} className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-white outline-none">
                  <option value="all">All Departments (Both)</option>
                  <option value="bms">BMS</option>
                  <option value="lcs">LCS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <select value={noticeForm.type} onChange={(e) => setNoticeForm({...noticeForm, type: e.target.value})} className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-white outline-none">
                <option value="notice">General Notice 📝</option>
                <option value="zoom">Zoom Meeting 📹</option>
                <option value="resource">New Resource Added 📁</option>
              </select>
            </div>
            
            {noticeForm.type === 'zoom' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Zoom Invitation Link</label>
                <input type="url" value={noticeForm.zoomLink} onChange={(e) => setNoticeForm({...noticeForm, zoomLink: e.target.value})} className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://zoom.us/j/..." required />
              </div>
            )}
            <button type="submit" disabled={submitting} className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              {submitting ? 'Broadcasting...' : 'Broadcast Announcement 🚀'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Active Broadcasts ({notifications.length})</h2>
          <div className="space-y-3 flex-grow overflow-y-auto max-h-[340px] pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No active notifications found.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${n.type === 'zoom' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {n.type} • Batch: {n.targetBatch} • Dept: {n.targetDepartment || 'all'}
                    </span>
                    <h4 className="text-sm font-bold text-gray-800">{n.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteNotification(n.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition text-xs font-bold">
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Content Management</h2>
        <p className="text-gray-400">Use the sidebar to manage Semesters, Subjects, Chapters, and Resources.</p>
      </div>
    </div>
  )
}