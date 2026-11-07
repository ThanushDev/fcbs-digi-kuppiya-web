export const DEPARTMENTS = ['BMS', 'LCS']
export const BATCHES = ['20/21', '21/22', '22/23', '23/24', '24/25']
export const SEMESTERS = ['Y1S1', 'Y1S2', 'Y2S1', 'Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'Y4S2']
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Specialization options per department (transient course-view selection only —
// never written to the user profile; used to filter subjects/materials on demand).
export const BMS_SPECIALIZATIONS = [
  { value: 'all', label: 'General Degree / Common' },
  { value: 'accounting', label: 'Accounting & Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'hrm', label: 'Human Resource Management' },
  { value: 'management', label: 'Management' },
  { value: 'info_management', label: 'Information Systems' },
]

export const LCS_SPECIALIZATIONS = [
  { value: 'all', label: 'General / Common' },
  { value: 'communication', label: 'Communication' },
  { value: 'languages', label: 'Languages' },
]

export function getSpecializationsByDepartment(department) {
  const dept = String(department || '').toLowerCase()
  if (dept === 'bms') return BMS_SPECIALIZATIONS
  if (dept === 'lcs') return LCS_SPECIALIZATIONS
  return []
}

export function getSpecializationLabel(value, department) {
  const specs = getSpecializationsByDepartment(department)
  const match = specs.find((s) => s.value === value)
  return match ? match.label : (value === 'all' ? 'General' : value)
}

// Returns true when a semester requires an explicit specialization choice
// before its subjects/materials can be meaningfully filtered.
export function requiresSpecializationChoice(department, semesterName) {
  const dept = String(department || '').toLowerCase()
  const name = String(semesterName || '')
  if (dept === 'bms') return /Y[34]/.test(name)
  if (dept === 'lcs') return /Y[234]/.test(name)
  return false
}
