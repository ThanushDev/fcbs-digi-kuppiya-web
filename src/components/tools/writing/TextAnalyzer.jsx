import { useState, useMemo } from 'react'
import { FileText, Type, Activity, Clock, LayoutList, Maximize } from 'lucide-react'

const WORDS_PER_MINUTE_READING = 225
const WORDS_PER_MINUTE_SPEAKING = 130

export default function TextAnalyzer() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const trimmed = text.trim()
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length
    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const sentences = trimmed === '' ? 0 : trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
    const paragraphs = trimmed === '' ? 0 : trimmed.split(/\n+/).filter((p) => p.trim().length > 0).length
    const readingTime = Math.ceil((words / WORDS_PER_MINUTE_READING) * 100) / 100 || 0
    const speakingTime = Math.ceil((words / WORDS_PER_MINUTE_SPEAKING) * 100) / 100 || 0

    return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime, speakingTime }
  }, [text])

  const clearText = () => setText('')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Word & Read-Time Counter</h2>
        <p className="text-sm text-gray-500">Real-time text analysis for essays, notes, and assignments.</p>
      </div>

      <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Text input</label>
          <button
            onClick={clearText}
            disabled={text.length === 0}
            className="text-xs text-gray-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed underline"
          >
            Clear
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your essay, notes, or any text here to analyze…"
          rows={12}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-slate-500 font-mono text-[13px] leading-relaxed resize-y"
        />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Words"
          value={stats.words}
          icon={Type}
          tone="bg-slate-50 text-slate-600 border-slate-100"
        />
        <StatCard
          label="Characters"
          value={stats.characters}
          icon={FileText}
          tone="bg-blue-50 text-blue-600 border-blue-100"
        />
        <StatCard
          label="Sentences"
          value={stats.sentences}
          icon={Activity}
          tone="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <StatCard
          label="Paragraphs"
          value={stats.paragraphs}
          icon={LayoutList}
          tone="bg-rose-50 text-rose-600 border-rose-100"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard
          label="Reading time"
          value={`${stats.readingTime} min`}
          icon={Clock}
          tone="bg-indigo-50 text-indigo-600 border-indigo-100"
        />
        <StatCard
          label="Speaking time"
          value={`${stats.speakingTime} min`}
          icon={Maximize}
          tone="bg-violet-50 text-violet-600 border-violet-100"
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
        <p className="font-medium text-gray-700 mb-1">How it's calculated</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Words: sequences separated by whitespace.</li>
          <li>Sentences: split on <code className="bg-white px-1 rounded">. ! ?</code> punctuation.</li>
          <li>Reading time: ~{WORDS_PER_MINUTE_READING} words per minute.</li>
          <li>Speaking time: ~{WORDS_PER_MINUTE_SPEAKING} words per minute.</li>
        </ul>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className={`rounded-xl border ${tone} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 text-gray-400">
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}
