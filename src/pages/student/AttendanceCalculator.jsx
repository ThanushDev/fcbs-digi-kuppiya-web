import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'

const BMS_IMAGES = [
  '/img/1234.png',
  '/img/4321.png',
  '/img/01.png',
  '/img/02.png',
  '/img/03.png',
  '/img/04.png'
]

const LCS_IMAGES = [
  '/img/lcs/1234.png',
  '/img/lcs/4321.png',
  '/img/lcs/01.png',
  '/img/lcs/02.png',
  '/img/lcs/03.png',
  '/img/lcs/04.png'
]

const BMS_SPECIALIZATIONS = ['IS', 'HR', 'ACC', 'Mkt', 'M', 'G']

export default function AttendanceCalculator() {
  const navigate = useNavigate()
  const { userData, loading } = useAuth()
  const [maxHours, setMaxHours] = useState('')
  const [attendedHours, setAttendedHours] = useState('')
  const [absentHours, setAbsentHours] = useState('')
  const [currentPercentage, setCurrentPercentage] = useState('N/A')
  const [eligibility, setEligibility] = useState({ text: '', color: '' })
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const resultRef = useRef(null)
  const touchStartX = useRef(0)

  const department = (userData?.department || '').toLowerCase()
  const specialization = userData?.specialization || ''
  const isLCS = department === 'lcs'
  const imageSet = isLCS ? LCS_IMAGES : BMS_IMAGES

  const handleCalculate = () => {
    const max = maxHours
    const atd = attendedHours
    const abs = absentHours

    if (max === '') {
      alert('Enter the maximum hours')
      return
    }
    if (Number(max) <= 0) {
      alert('Maximum Hours should be greater than 0')
      return
    }
    if (Number(max) !== Math.floor(Number(max))) {
      alert('Maximum Hours should be a whole number.')
      return
    }
    if (atd === '') {
      alert('Enter the Attended hours')
      return
    }
    if (Number(atd) < 0) {
      alert('Attended Hours should be greater than or equal to 0')
      return
    }
    if (Number(atd) !== Math.floor(Number(atd))) {
      alert('Attended Hours should be a whole number.')
      return
    }
    if (Number(max) < Number(atd)) {
      alert('Attended Hours should be lesser than or equal to Maximum hours.')
      return
    }
    if (abs !== '') {
      if (Number(abs) < 0) {
        alert('Hours going to be absent should be greater than or equal to 0')
        return
      }
      if (Number(abs) !== Math.floor(Number(abs))) {
        alert('Hours going to be absent should be a whole number.')
        return
      }
    }

    const currPct = (Number(atd) / Number(max) * 100).toFixed(2) + '%'
    setCurrentPercentage(currPct)

    let adjustedMax = Number(max)
    if (abs !== '') {
      adjustedMax = Number(max) + Number(abs)
    }
    const finalPct = (Number(atd) / adjustedMax) * 100

    if (finalPct >= 80) {
      setEligibility({ text: 'Eligible', color: '#059669' })
    } else {
      setEligibility({ text: 'Not Eligible', color: '#DC2626' })
    }

    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openViewer = (index) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const closeViewer = () => setViewerOpen(false)

  const nextImage = useCallback(() => {
    setViewerIndex(i => (i + 1) % imageSet.length)
  }, [imageSet.length])

  const prevImage = useCallback(() => {
    setViewerIndex(i => (i - 1 + imageSet.length) % imageSet.length)
  }, [imageSet.length])

  useEffect(() => {
    if (!viewerOpen) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); nextImage() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevImage() }
      if (e.key === 'Escape') closeViewer()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [viewerOpen, nextImage, prevImage])

  if (loading) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <button 
        onClick={() => navigate('/dashboard')} 
        className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition group"
      >
        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Calculator</h1>

      <div className="card p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 font-medium">Department</span>
          <p className="text-sm font-bold text-gray-900 uppercase mt-0.5">
            {department || '—'}
            {!isLCS && department === 'bms' && specialization && ` / ${specialization}`}
          </p>
        </div>
        <span className="badge badge-indigo">
          {isLCS ? 'LCS' : 'BMS'} Images
        </span>
      </div>

      <div className="card p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter the Maximum Hours <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={maxHours}
              onChange={e => setMaxHours(e.target.value)}
              className="input-field"
              placeholder="e.g. 120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter the Attended Hours <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={attendedHours}
              onChange={e => setAttendedHours(e.target.value)}
              className="input-field"
              placeholder="e.g. 100"
            />
          </div>

          <button onClick={handleCalculate} className="btn-primary w-full">
            Calculate
          </button>
        </div>

        <div ref={resultRef} className="mt-6 pt-6 border-t border-gray-100 space-y-3">
          <p className="text-center text-lg font-semibold text-gray-700">
            Current Percentage:{' '}
            <span className="text-indigo-600 text-xl font-bold">{currentPercentage}</span>
          </p>
          {eligibility.text && (
            <p
              className="text-center text-lg font-bold px-6 py-3 rounded-lg bg-gray-50 border border-gray-200 w-fit mx-auto"
              style={{ color: eligibility.color }}
            >
              {eligibility.text}
            </p>
          )}
        </div>
      </div>

      <h2 className="text-center text-lg font-bold text-gray-800 underline bg-blue-50 py-2 px-4 rounded-lg shadow-sm mb-4">
        Subjects Hours
      </h2>

      <div className="space-y-3">
        {imageSet.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Subject hours chart ${i + 1}`}
            onClick={() => openViewer(i)}
            className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          />
        ))}
      </div>

      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeViewer}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            const diff = e.changedTouches[0].clientX - touchStartX.current
            if (diff > 50) prevImage()
            if (diff < -50) nextImage()
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); closeViewer() }}
            className="absolute top-5 right-7 text-white cursor-pointer z-10 hover:text-gray-300"
            aria-label="Close viewer"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={e => { e.stopPropagation(); prevImage() }}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-white cursor-pointer z-10 hover:text-gray-300 select-none"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <img
            src={imageSet[viewerIndex]}
            alt={`Full view chart ${viewerIndex + 1}`}
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg select-none"
            onClick={e => e.stopPropagation()}
            draggable={false}
          />

          <button
            onClick={e => { e.stopPropagation(); nextImage() }}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white cursor-pointer z-10 hover:text-gray-300 select-none"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  )
}
