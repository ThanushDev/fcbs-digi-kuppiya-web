import { useState } from 'react'
import { Quote, Link, Book, FileText, Copy, Download } from 'lucide-react'
import { callGroq } from '../utils/groq'

const STYLES = [
  { value: 'apa', label: 'APA' },
  { value: 'ieee', label: 'IEEE' },
  { value: 'mla', label: 'MLA' },
  { value: 'harvard', label: 'Harvard' },
]

const SOURCE_TYPES = [
  { value: 'website', label: 'Website / Webpage', icon: Link },
  { value: 'book', label: 'Book', icon: Book },
  { value: 'article', label: 'Journal / Article', icon: FileText },
]

export default function CitationGenerator() {
  const [form, setForm] = useState({
    sourceType: 'website',
    style: 'apa',
    title: '',
    authors: '',
    year: '',
    publisher: '',
    url: '',
    accessDate: '',
  })
  const [citation, setCitation] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const sourceConfig = SOURCE_TYPES.find((s) => s.value === form.sourceType)

  const handleGenerate = async () => {
    if (!form.title.trim()) {
      setError('Please enter a title.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setCitation('')

    try {
      const styleName = STYLES.find((s) => s.value === form.style)?.label || form.style
      const sourceLabel = sourceConfig?.label || form.sourceType

      const prompt = `Generate a formal academic citation in ${styleName} style for the following ${sourceLabel}.\n\nSource details:\n- Type: ${sourceLabel}\n- Title: ${form.title}\n- Author(s): ${form.authors || 'Not provided'}\n- Year: ${form.year || 'Not provided'}\n- Publisher / Website: ${form.publisher || 'Not provided'}\n- URL: ${form.url || 'Not provided'}\n- Access date: ${form.accessDate || 'Not provided'}\n\nReturn ONLY the formatted citation text, nothing else. No explanations, no markdown code blocks, no extra labels. Just the citation.`

      const result = await callGroq(
        [
          {
            role: 'system',
            content: 'You are an expert academic citation generator. Produce only the formatted citation in the requested style.',
          },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.3, max_tokens: 600 }
      )

      setCitation(result.trim())
    } catch (err) {
      setError(err.message || 'Failed to generate citation. Please try again.')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyCitation = () => {
    if (!citation) return
    navigator.clipboard.writeText(citation)
  }

  const downloadCitation = () => {
    if (!citation) return
    const blob = new Blob([citation], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `citation-${form.style}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const fmtDate = () => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">AI Citation Generator</h2>
        <p className="text-sm text-gray-500">Generate APA, IEEE, MLA, or Harvard citations with AI.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Citation style</label>
            <select
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-violet-500"
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Source type</label>
            <select
              value={form.sourceType}
              onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-violet-500"
            >
              {SOURCE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Title *</label>
            <input
              type="text"
              placeholder="e.g. The Impact of Climate Change on Coastal Cities"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Author(s)</label>
            <input
              type="text"
              placeholder="e.g. John Doe, Jane Smith"
              value={form.authors}
              onChange={(e) => setForm({ ...form, authors: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Year</label>
            <input
              type="number"
              min={1000}
              max={2100}
              placeholder={new Date().getFullYear()}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Publisher / Website</label>
            <input
              type="text"
              placeholder="e.g. Oxford University Press"
              value={form.publisher}
              onChange={(e) => setForm({ ...form, publisher: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">URL</label>
            <input
              type="url"
              placeholder="https://example.com/article"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Access date</label>
            <input
              type="date"
              value={form.accessDate || fmtDate()}
              onChange={(e) => setForm({ ...form, accessDate: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !form.title.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Quote className="w-4 h-4 animate-spin" /> Generating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Quote className="w-4 h-4" /> Generate Citation
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {citation && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Generated Citation</h3>
            <div className="flex gap-2">
              <button
                onClick={copyCitation}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-900 hover:bg-gray-50 transition"
                title="Copy"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={downloadCitation}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
                title="Download .txt"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 italic leading-relaxed whitespace-pre-wrap break-words shadow-inner">
            {citation}
          </div>
        </div>
      )}
    </div>
  )
}
