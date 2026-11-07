import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Sun, Clock, BookOpen, Users, RefreshCw, Play, SkipForward,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  getTimetableSlots,
} from '../../services/firestore'
import {
  getCurrentDay, getCurrentTime, timeToMinutes,
} from '../../utils/timetable'

const pulseVariant = {
  animate: { opacity: [0.4, 1, 0.4], boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 24px rgba(16,185,129,0.7)', '0 0 0px rgba(16,185,129,0)'] },
}

export default function LiveNowCard() {
  const { userData } = useAuth()
  const { showToast } = useToast()
  const [slots, setSlots] = useState([])
  const [status, setStatus] = useState({ status: 'idle', ongoingSlots: [], upcomingSlot: null })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const dept = userData?.department ? String(userData.department).trim() : ''
  const batch = userData?.batch ? String(userData.batch).trim() : ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (dept && batch) {
        const allSlots = await getTimetableSlots({ department: dept, batchYear: batch })
        setSlots(allSlots)
      } else {
        setSlots([])
      }
    } catch (err) {
      console.error('Timetable load error:', err)
      showToast('Unable to load timetable', 'error')
    } finally {
      setLoading(false)
    }
  }, [dept, batch, showToast])

  useEffect(() => { load() }, [load])

  // Recompute live status whenever data changes
  useEffect(() => {
    const now = new Date()
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const currentDayName = getCurrentDay()

    const daySlots = slots.filter((s) => String(s.day).toLowerCase() === currentDayName.toLowerCase())

    // Find ALL ongoing slots at this exact time
    const ongoing = daySlots.filter((s) => {
      const start = timeToMinutes(s.startTime)
      const end = s.endTime ? timeToMinutes(s.endTime) : start + (Number(s.durationMinutes) || 60)
      return nowMins >= start && nowMins < end
    })

    // Find the next upcoming slot after now
    const upcoming = daySlots
      .map((s) => ({ ...s, startMins: timeToMinutes(s.startTime) }))
      .filter((s) => s.startMins > nowMins)
      .sort((a, b) => a.startMins - b.startMins)[0] || null

    setStatus({ status: ongoing.length > 0 ? 'ongoing' : upcoming ? 'upcoming' : 'none', ongoing, upcoming })
  }, [slots])

  const handleRefresh = async (e) => {
    e?.preventDefault?.()
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const currentDay = getCurrentDay()
  const currentTime = getCurrentTime()
  const { status: liveStatus, ongoing, upcoming } = status
  const isOngoing = liveStatus === 'ongoing'
  const isUpcoming = liveStatus === 'upcoming'
  const isNone = liveStatus === 'none'

  if (loading) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 animate-pulse">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-2 w-1/2 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg animate-fade-in">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Live Lecture</span>
              {isOngoing && (
                <motion.span
                  animate={pulseVariant}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                />
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wide">
              {isOngoing ? 'Live Now' : isUpcoming ? 'Next Class' : 'No Lectures Right Now'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Clock className="w-2.5 h-2.5" />
          <span>{currentDay} • {currentTime}</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="px-4 py-2.5"
      >
        {/* Live / Upcoming content */}
        {isOngoing && ongoing.length > 0 && (
          <>
            <div className="mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border bg-emerald-100 border-emerald-200 text-emerald-700 shadow-sm`}>
                <Play className="w-2.5 h-2.5" />
                {ongoing.length === 1 ? 'ONGOING' : `${ongoing.length} LIVE`}
              </span>
            </div>

            <div className="space-y-1.5">
              {ongoing.map((slot, idx) => (
                <motion.div
                  key={slot.id || `ongoing-${idx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-emerald-50 cursor-default select-none group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Subject</p>
                    <p className="text-base font-bold text-gray-900">{slot.subjectName || 'Untitled Subject'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Users className="w-2.5 h-2.5 text-gray-400/50" />
                    <span className="text-[9px] text-gray-500">{slot.lecturer || 'TBA'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {isUpcoming && upcoming && (
          <>
            <div className="mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border bg-cyan-100 border-cyan-200 text-cyan-700 shadow-sm`}>
                <SkipForward className="w-2.5 h-2.5" />
                UPCOMING
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Subject</p>
                  <p className="text-base font-bold text-gray-900">{upcoming.subjectName || 'Untitled Subject'}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-2 flex items-center gap-2">
                <SkipForward className="w-3 h-3 text-cyan-600" />
                <div>
                  <p className="text-[9px] font-bold text-cyan-600 uppercase tracking-wider mb-0.5">Start Time</p>
                  <p className="text-sm font-bold text-gray-800">{new Date(`1970-01-01T${upcoming.startTime}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* No lectures state */}
        {isNone && (
          <div className="text-center py-2.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-2">
              <Sun className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-800 mb-0.5">No Lectures Right Now</p>
            <p className="text-[9px] text-gray-500">
              Enjoy your break — no scheduled lectures at the moment.
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer actions */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition border border-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        {dept || batch ? (
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <span>{dept.toUpperCase()}</span>
            <span className="w-px h-3 bg-gray-300 mx-1" />
            <span>Batch {batch}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
