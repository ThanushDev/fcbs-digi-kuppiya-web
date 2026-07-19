import { useState, useEffect } from 'react'
import { getResources, addDocumentResource, addVideoResource, deleteResource, getChapters, getAllSubjects } from '../../services/firestore'
import { Video, FileText } from 'lucide-react'

export default function ResourceManagement() {
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChapter, setSelectedChapter] = useState('')
  const [docForm, setDocForm] = useState({ name: '', file: null })
  const [videoForm, setVideoForm] = useState({ name: '', youtubeId: '', duration: '' })
  const [tab, setTab] = useState('document')

  const loadChapters = async () => {
    const all = await getAllSubjects()
    setSubjects(all)
  }

  useEffect(() => { loadChapters() }, [])

  useEffect(() => {
    const load = async () => {
      if (!selectedChapter) { setResources([]); return }
      setLoading(true)
      setChapters(await getChapters(selectedChapter))
      setResources(await getResources(selectedChapter))
      setLoading(false)
    }
    load()
  }, [selectedChapter])

  const handleDocSubmit = async (e) => {
    e.preventDefault()
    if (!docForm.name || !docForm.file || !selectedChapter) return
    await addDocumentResource(selectedChapter, docForm.name, docForm.file)
    setDocForm({ name: '', file: null })
    const updated = await getResources(selectedChapter)
    setResources(updated)
  }

  const handleVideoSubmit = async (e) => {
    e.preventDefault()
    if (!videoForm.name || !videoForm.youtubeId || !selectedChapter) return
    await addVideoResource(selectedChapter, videoForm.name, videoForm.youtubeId, videoForm.duration)
    setVideoForm({ name: '', youtubeId: '', duration: '' })
    const updated = await getResources(selectedChapter)
    setResources(updated)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return
    await deleteResource(id)
    const updated = await getResources(selectedChapter)
    setResources(updated)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Resource Management</h1>

      <div className="mb-6">
        <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 outline-none focus:border-indigo-500 w-80">
          <option value="">Select a Subject to see its chapters</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.code || '—'})</option>
          ))}
        </select>
      </div>

      {selectedChapter && (
        <>
          <div className="mb-6 flex gap-2">
            <button onClick={() => setTab('document')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${tab === 'document' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-100'}`}>
              Upload Document
            </button>
            <button onClick={() => setTab('video')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${tab === 'video' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-100'}`}>
              Add YouTube Video
            </button>
          </div>

          {tab === 'document' ? (
            <form onSubmit={handleDocSubmit} className="mb-8 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-5">
              <input type="text" placeholder="Document Name" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" required />
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] })}
                className="text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-900" required />
              <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-gray-900 hover:bg-indigo-700 transition">Upload</button>
            </form>
          ) : (
            <form onSubmit={handleVideoSubmit} className="mb-8 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-5">
              <input type="text" placeholder="Video Name" value={videoForm.name} onChange={(e) => setVideoForm({ ...videoForm, name: e.target.value })}
                className="flex-1 min-w-[150px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" required />
              <input type="text" placeholder="YouTube Video ID" value={videoForm.youtubeId} onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })}
                className="w-40 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" required />
              <input type="text" placeholder="Duration (e.g. 12:30)" value={videoForm.duration} onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                className="w-32 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500" />
              <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-gray-900 hover:bg-indigo-700 transition">Add Video</button>
            </form>
          )}

          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resources for this Subject</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No resources yet.</div>
          ) : (
            <div className="space-y-3">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-4">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${r.type === 'video' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                      {r.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{r.name}</h3>
                      <p className="text-xs text-gray-500">
                        {r.type === 'video' ? `YouTube: ${r.youtubeId} ${r.duration ? `| ${r.duration}` : ''}` : 'Document'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.type === 'video' && (
                      <a href={`https://youtube.com/watch?v=${r.youtubeId}`} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/30 transition">
                        Watch
                      </a>
                    )}
                    {r.type === 'document' && r.fileURL && (
                      <a href={r.fileURL} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition">
                        View
                      </a>
                    )}
                    <button onClick={() => handleDelete(r.id)} className="text-xs text-gray-500 hover:text-red-400 transition">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!selectedChapter && (
        <div className="text-center py-16 text-gray-500">Select a subject above to manage its chapters and resources.</div>
      )}
    </div>
  )
}
