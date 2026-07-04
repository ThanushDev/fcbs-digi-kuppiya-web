import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
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
    setOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className="relative hidden md:block">
      <input ref={ref}
        value={query} onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Search... (/)"
        className="w-56 rounded-lg border border-gray-700 bg-[#1b1f32] px-4 py-2 pl-9 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition" />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">🔍</span>
    </form>
  )
}
