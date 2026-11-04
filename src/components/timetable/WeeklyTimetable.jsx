import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, Users, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getTimetableSlots } from '../../services/firestore'
import {
  getCurrentDay,
  WEEKDAYS,
  sortSlots,
} from '../../utils/timetable'

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

const slotItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export default function WeeklyTimetable({ slots: propsSlots = [] }) {
  const { userData } = useAuth()
  const { showToast } = useToast()
  const [slots, setSlots] = useState(Array.isArray(propsSlots) ? propsSlots : [])
  const [loading, setLoading] = useState(true)
  
  // Toggle & Day Selection States
  const [showTimetable, setShowTimetable] = useState(false)
  const currentDay = getCurrentDay()
  const defaultDay = WEEKDAYS.slice(0, 5).includes(currentDay) ? currentDay : 'Monday'
  const [selectedDay, setSelectedDay] = useState(defaultDay)

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
            setSlots(Array.isArray(allSlots) ? allSlots : [])
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
      const d = String(s.day || '').trim()
      if (grouped[d]) grouped[d].push(s)
    }
    return grouped
  }, [slots])

  const timeGroupedSlots = useMemo(() => {
    const groups = {}
    for (const [day, dayList] of Object.entries(daySlots)) {
      groups[day] = {}
      const sorted = sortSlots(dayList)
      for (const s of sorted) {
        const end = s.endTime || (() => {
          const [h, m] = String(s.startTime || '').split(':').map(Number)
          const endMinutes = (h || 0) * 60 + (m || 0) + (Number(s.durationMinutes) || 60)
          return `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
        })()
        const key = `${s.startTime || ''}|${end}`
        if (!groups[day][key]) {
          groups[day][key] = { start: s.startTime || '', end, slots: [] }
        }
        groups[day][key].slots.push(s)
      }
    }
    return groups
  }, [daySlots])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Weekly Timetable</h3>
              <p className="text-xs text-gray-500">Loading schedule...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const dayGroups = timeGroupedSlots[selectedDay] || {}
  const groupKeys = Object.keys(dayGroups)
  const isTodaySelected = selectedDay === currentDay

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      {/* Header & View Timetable Toggle Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wide">Weekly Timetable</h3>
            <p className="text-xs text-gray-500">
              {dept ? `${dept.toUpperCase()} Batch ${batch}` : 'Academic Schedule'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTimetable(!showTimetable)}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          {showTimetable ? 'Hide Timetable' : 'View Timetable'}
        </button>
      </div>

      {/* Expandable Timetable View */}
      {showTimetable && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          {/* Day Switcher Tabs (Monday to Friday) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {WEEKDAYS.slice(0, 5).map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
                }`}
              >
                <span>{day}</span>
                {day === currentDay && (
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedDay === day ? 'bg-white' : 'bg-emerald-500'}`} />
                )}
              </button>
            ))}
          </div>

          {/* Selected Day Content */}
          <motion.div
            key={selectedDay}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className={`rounded-xl border p-3 transition-all ${
              isTodaySelected ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isTodaySelected ? 'text-indigo-700' : 'text-gray-500'
                }`}>
                  {selectedDay}
                </span>
                {isTodaySelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {groupKeys.length} slot{groupKeys.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-1.5">
              {groupKeys.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs">
                  No lectures scheduled for {selectedDay}.
                </div>
              ) : (
                Object.values(dayGroups).map((group) => (
                  <motion.div
                    key={`${group.start}-${group.end}`}
                    initial="hidden"
                    animate="visible"
                    variants={slotItemVariants}
                    className="flex items-start gap-2 p-2.5 rounded-lg border bg-white border-gray-200/80 shadow-xs"
                  >
                    <div className="flex-shrink-0 w-16 pt-0.5">
                      <p className="text-[10px] font-bold text-gray-700">{group.start || '—'}</p>
                      <p className="text-[10px] text-gray-400">{group.end || '—'}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {group.slots.length > 1 ? (
                        <div className="flex flex-col gap-1.5">
                          {group.slots.map((s) => (
                            <div key={s.id || `${s.startTime}-${s.subjectName}`} className="border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                              <p className="text-[11px] font-bold text-gray-900 leading-tight">
                                {s.subjectName || 'Untitled Subject'}
                              </p>
                              {s.lecturer && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Users className="w-2.5 h-2.5 text-gray-400" />
                                  <span className="text-[10px] text-gray-500">{s.lecturer}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <p className="text-[11px] font-bold text-gray-900 leading-tight">
                            {group.slots[0]?.subjectName || 'Untitled Subject'}
                          </p>
                          {group.slots[0]?.lecturer && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Users className="w-2.5 h-2.5 text-gray-400" />
                              <span className="text-[10px] text-gray-500">{group.slots[0]?.lecturer}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}