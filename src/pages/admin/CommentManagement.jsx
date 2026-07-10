import { useState, useEffect } from 'react'
import { getCommentsLive, deleteComment } from '../../services/firestore' // 🎯 අපේ Live ෆන්ක්ෂන් එක ගත්තා
import { exportToCSV } from '../../utils/export'

export default function CommentManagement() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('') // 🔍 බැච් හෝ නමින් සර්ච් කරන්න

  // 🔄 ඩේටාබේස් එකේ අලුතින් කමෙන්ට් එකක් වැටුණු සැනින් ඇඩ්මින් පැනල් එකට Live අප්ඩේට් වෙනවා
  useEffect(() => {
    const unsubscribe = getCommentsLive((allComments) => {
      setComments(allComments)
      setLoading(false)
    })
    
    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment permanently?')) return
    try {
      await deleteComment(id)
    } catch (error) {
      alert("Comment එක ඩිලීට් කරන්න බැරි වුණා මචං!")
    }
  }

  // 🔍 සර්ච් ෆිල්ටර් එක (නම, ඊමේල් හෝ බැච් එක අනුව ෆිල්ටර් කරන්න පුළුවන්)
  const filteredComments = comments.filter((c) => {
    const search = searchTerm.toLowerCase()
    return (
      c.studentName?.toLowerCase().includes(search) ||
      c.studentEmail?.toLowerCase().includes(search) ||
      c.batch?.toLowerCase().includes(search) ||
      c.text?.toLowerCase().includes(search)
    )
  })

  if (loading) return <div className="text-center py-16 text-gray-400">Loading live feedback comments...</div>

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Feedbacks</h1>
          <p className="text-xs text-gray-500 mt-0.5">Review and manage comments posted by undergraduates in real-time.</p>
        </div>
        
        {/* CSV Export Button */}
        <button 
          onClick={() => exportToCSV(comments, 'Uniflow_Feedback_Export', [
            { label: 'Student Name', accessor: (c) => c.studentName || 'N/A' },
            { label: 'Email Address', accessor: (c) => c.studentEmail || 'N/A' },
            { label: 'Batch', accessor: (c) => c.batch || 'N/A' },
            { label: 'Department', accessor: (c) => c.department || 'N/A' },
            { label: 'Comment Text', accessor: (c) => c.text || '' },
            { label: 'Date Posted', accessor: (c) => c.createdAt?.toDate?.().toLocaleString() || '' },
          ])}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all duration-200 flex items-center gap-1.5"
        >
          📥 Export CSV
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="w-full max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Search by student name, email, or batch..."
          className="w-full text-sm p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none placeholder-gray-400"
        />
      </div>

      {/* 3. Live Comments List */}
      {filteredComments.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-sm text-gray-400">No matching feedback or comments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200">
              <div className="flex items-start justify-between gap-4">
                
                {/* Left Side: Avatar Indicator & Student Meta Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 border border-indigo-100">
                    {c.studentName?.[0] || 'S'}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{c.studentName}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">
                        Batch: {c.batch}
                      </span>
                      <span className="text-[10px] bg-gray-50 text-gray-600 font-medium px-2 py-0.5 rounded-md border border-gray-100 capitalize">
                        Dept: {c.department}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{c.studentEmail}</p>
                    
                    {/* The Actual Comment Text Content */}
                    <p className="pt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{c.text}</p>
                    
                    {/* Time Stamp */}
                    <p className="pt-1 text-[10px] text-gray-400 font-medium">
                      {c.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                    </p>
                  </div>
                </div>

                {/* Right Side: Delete Control Action */}
                <div className="shrink-0">
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}