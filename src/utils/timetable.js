/**
 * Timetable utilities for the Live Lecture Timetable Tracker.
 * Pure functions - no Firebase imports.
 */

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DAY_INDEX = {}
WEEKDAYS.forEach((d, i) => { DAY_INDEX[d.toLowerCase()] = i })

export function getCurrentDay() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
}

export function getCurrentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function timeToMinutes(time) {
  if (!time) return 0
  const [h, m] = String(time).split(':').map(Number)
  if (h == null || m == null) return 0
  return h * 60 + m
}

export function parseTimeString(timeStr) {
  if (!timeStr) return null
  const str = String(timeStr).trim()

  // Handle "HH:MM - HH:MM" format
  const rangeMatch = str.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
  if (rangeMatch) {
    return {
      start: `${String(parseInt(rangeMatch[1])).padStart(2, '0')}:${rangeMatch[2]}`,
      end: `${String(parseInt(rangeMatch[3])).padStart(2, '0')}:${rangeMatch[4]}`,
    }
  }

  // Handle "HH:MM AM/PM - HH:MM AM/PM" format
  const rangeMatchAmPm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (rangeMatchAmPm) {
    const convertTo24h = (h, m, ampm) => {
      let hour = parseInt(h)
      if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12
      if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0
      return `${String(hour).padStart(2, '0')}:${m}`
    }
    return {
      start: convertTo24h(rangeMatchAmPm[1], rangeMatchAmPm[2], rangeMatchAmPm[3]),
      end: convertTo24h(rangeMatchAmPm[4], rangeMatchAmPm[5], rangeMatchAmPm[6]),
    }
  }

  // Handle single "HH:MM" format
  const singleMatch = str.match(/^(\d{1,2}):(\d{2})$/)
  if (singleMatch) {
    return {
      start: `${String(parseInt(singleMatch[1])).padStart(2, '0')}:${singleMatch[2]}`,
      end: null,
    }
  }

  return null
}

export function normalizeSlot(slot) {
  if (!slot) return slot
  const normalized = { ...slot }

  // If startTime exists, keep it; otherwise derive from 'time' field
  if (slot.startTime) {
    normalized.startTime = slot.startTime
  } else if (slot.time) {
    const parsed = parseTimeString(slot.time)
    if (parsed && parsed.start) {
      normalized.startTime = parsed.start
    }
  }

  // If endTime exists, keep it; otherwise derive from 'time' field or durationMinutes
  if (slot.endTime) {
    normalized.endTime = slot.endTime
  } else if (slot.time) {
    const parsed = parseTimeString(slot.time)
    if (parsed && parsed.end) {
      normalized.endTime = parsed.end
    } else if (normalized.startTime && slot.durationMinutes) {
      const [h, m] = normalized.startTime.split(':').map(Number)
      const endMinutes = h * 60 + m + Number(slot.durationMinutes)
      normalized.endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
    }
  }

  return normalized
}

export function sortSlots(slots) {
  return [...slots].sort((a, b) => {
    const da = DAY_INDEX[String(a.day).toLowerCase()] ?? 99
    const db = DAY_INDEX[String(b.day).toLowerCase()] ?? 99
    if (da !== db) return da - db
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })
}
