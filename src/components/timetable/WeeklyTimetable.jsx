import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, Users, ChevronRight, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getTimetableSlots } from '../../services/firestore'
import {
  getCurrentDay, sortSlots, WEEKDAYS,
} from '../../utils/timetable'

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

const slotItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export default function WeeklyTimetable() {
  const { userData } = useAuth()
  const { showToast } = useToast()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  const dept = userData?.department ? String(userData.department).trim() : ''
  const batch = userData?.batch ? String(userData.batch).trim() : ''

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        if (dept && batch) {
          const allSlots = await getTimetableSlots({ department: dept, batchYear: batch })
          if (mounted) {
            setSlots(allSlots)
          }
        } else if (mounted) {
          setSlots([])
        }
      } catch (err) {
        console.error('Weekly timetable error:', err)
        if (mounted) showToast('Unable to load timetable', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [dept, batch, showToast])

  const daySlots = useMemo(() => {
    const grouped = {}
    WEEKDAYS.forEach((d) => { grouped[d] = [] })
    for (const s of slots) {
      const d = String(s.day).trim()
      if (grouped[d]) grouped[d].push(s)
    }
    return grouped
  }, [slots])

  // Group slots by time range (day + start + end) to show concurrent slots together
  const timeGroupedSlots = useMemo(() => {
    const groups = {}
    for (const [day, dayList] of Object.entries(daySlots)) {
      groups[day] = {}
      const sorted = sortSlots(dayList)
      for (const s of sorted) {
        const end = s.endTime || (() => {
          const [h, m] = s.startTime.split(':').map(Number)
          const endMinutes = h * 60 + m + (Number(s.durationMinutes) || 60)
          return `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
        })()
        const key = `${s.startTime}|${end}`
        if (!groups[day][key]) {
          groups[day][key] = { start: s.startTime, end, slots: [] }
        }
        groups[day][key].slots.push(s)
      }
    }
    return groups
  }, [daySlots])

  const currentDay = getCurrentDay()

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-wide">Weekly Timetable</h1>
          </div>
          <div className="space-y-4">
            {WEEKDAYS.slice(0, 5).map((d) => (
              <div key={d} className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">{d}</span>
                  <div className="h-2 w-1/3 bg-gray-100 rounded animate-pulse" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 rounded-lg bg-gray-100 animate-pulse mb-1.5" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const hasAnySlot = slots.length > 0

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-wide">Weekly Timetable</h1>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {dept.toUpperCase()} • Batch {batch}
            </p>
          </div>
          {!hasAnySlot && (
            <button
              onClick={() => window.location.assign('/admin/timetable')}
              className="px-4 py-2 rounded-md text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 transition"
            >
              Open Admin Timetable
            </button>
          )}
        </div>

        {!hasAnySlot && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">No timetable entries yet</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              Your department or batch has no published timetable slots. Contact your admin to upload the timetable CSV.
            </p>
          </div>
        )}

        {hasAnySlot && (
          <div className="grid gap-2">
            {WEEKDAYS.map((day) => {
              const dayGroups = timeGroupedSlots[day] || {}
              const groupKeys = Object.keys(dayGroups)
              const isToday = day === currentDay
              return (
                <motion.div
                  key={day}
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  className={`rounded-xl border p-3 transition-all ${
                    isToday
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        isToday ? 'text-indigo-700' : 'text-gray-400'
                      }`}>{day}</span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-gray-400">{groupKeys.length} slot{groupKeys.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-1.5">
                    {groupKeys.length === 0 ? (
                      <div className="h-5 flex items-center">
                        <span className="text-[9px] text-gray-400">No lectures</span>
                      </div>
                    ) : (
                      Object.values(dayGroups).map((group) => (
                        <motion.div
                          key={`${group.start}-${group.end}`}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={slotItemVariants}
                          className="flex items-start gap-2 p-2 rounded-lg border bg-gray-50 cursor-default select-none group"
                        >
                          <div className="flex-shrink-0 w-16">
                            <p className="text-[9px] font-bold text-gray-500">{group.start}</p>
                            <p className="text-[9px] text-gray-400">{group.end}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            {group.slots.length > 1 ? (
                              <div className="flex flex-col gap-1">
                                {group.slots.map((s) => (
                                  <div key={s.id} className="mb-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold border ${
                                      /library/i.test(s.subjectCode || s.subjectName || '')
                                        ? 'bg-amber-100 border-amber-200 text-amber-700'
                                        : 'bg-gray-100 border-gray-200 text-gray-600'
                                    }`}>
                                      {s.subjectName || 'Untitled Subject'}
                                    </span>
                                    <p className="text-[9px] font-semibold text-gray-800 leading-tight">{s.subjectName || 'Untitled Subject'}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Users className="w-2.5 h-2.5 text-gray-400/50" />
                                      <span className="text-[9px] text-gray-500">{s.lecturer || 'TBA'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold border ${
                                    /library/i.test(group.slots[0].subjectCode || group.slots[0].subjectName || '')
                                      ? 'bg-amber-100 border-amber-200 text-amber-700'
                                      : 'bg-gray-100 border-gray-200 text-gray-600'
                                  }`}>
                                    {group.slots[0].subjectName || 'Untitled Subject'}
                                  </span>
                                </div>
                                <p className="text-[9px] font-semibold text-gray-800 leading-tight">{group.slots[0].subjectName || 'Untitled Subject'}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Users className="w-2.5 h-2.5 text-gray-400/50" />
                                  <span className="text-[9px] text-gray-500">{group.slots[0].lecturer || 'TBA'}</span>
                                </div>
                              </>
                            )}
                          </div>
                          <ChevronRight className="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600 shrink-0" />
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
