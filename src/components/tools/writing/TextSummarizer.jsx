import { useState } from 'react'
import { Sparkles, Wand2, Copy, Download, Brain } from 'lucide-react'
import { callGroq } from '../utils/groq'

const MODES = [
  { value: 'summarize', label: 'Summarize', icon: Brain, desc: 'Condense into key points' },
  { value: 'paraphrase', label: 'Paraphrase', icon: Wand2, desc: 'Rewrite in your own words' },
]

export default function TextSummarizer() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('summarize')
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter some text first.')
      return
    }
    if (input.length > 12000) {
      setError('Text is too long (max 12,000 characters).')
      return
    }

    setIsGenerating(true)
    setError(null)
    setOutput('')

    try {
      const prompt =
        mode === 'summarize'
          ? `Summarize the following text concisely while keeping the key information. Use bullet points if helpful.\n\nText:\n${input}`
          : `Paraphrase the following text. Rewrite it clearly in your own words while preserving the original meaning and tone.\n\nText:\n${input}`

      const result = await callGroq(
        [
          {
            role: 'system',
            content: `You are an academic writing assistant. You ${mode === 'summarize' ? 'summarize' : 'paraphrase'} text clearly and accurately.`,
          },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.5, max_tokens: 1500 }
      )

      setOutput(result.trim())
    } catch (err) {
      setError(err.message || 'Failed to process text. Please try again.')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyOutput = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
  }

  const downloadOutput = () => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${mode}-result.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">AI Summarizer & Paraphraser</h2>
        <p className="text-sm text-gray-500">Summarize notes or rewrite paragraphs with AI.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm space-y-5">
        {/* Mode selector */}
        <div className="flex gap-2">
          {MODES.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${
                  mode === m.value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {m.label}
                <span className="ml-auto text-[10px] opacity-70">{m.desc}</span>
              </button>
            )
          })}
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Input text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your notes, essay, or paragraph here…"
            rows={8}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[13px] leading-relaxed resize-y"
          />
          <p className="text-[10px] text-gray-400">
            {input.length} / 12,000 characters
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" /> Processing…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Generate
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Output */}
      {output && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Result</h3>
            <div className="flex gap-2">
              <button
                onClick={copyOutput}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-900 hover:bg-gray-50 transition"
                title="Copy"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={downloadOutput}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                title="Download .txt"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words shadow-inner">
            {output}
          </div>
        </div>
      )}
    </div>
  )
}
