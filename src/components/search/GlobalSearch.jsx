import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/dashboard/search?q=${encodeURIComponent(query.trim())}`)
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit} className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      <input ref={ref}
        value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search... (/)"
        className="w-56 input-field pl-9 pr-8 text-sm rounded-xl bg-slate-50/80 border-slate-200/80 focus:bg-white transition" />
      {query && (
        <button type="button" onClick={() => { setQuery(''); ref.current?.focus() }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  )
}
