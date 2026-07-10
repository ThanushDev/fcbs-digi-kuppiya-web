import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { db, auth } from '../../services/firebase' 
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getBatchPermissions } from '../../services/firestore' 

const GRADE_POINTS = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'E': 0.0 }

const BMS_COURSES = {
  '11': [
    { code: 'BMT 1013', name: 'Principle of Management', credits: 3 },
    { code: 'BMT 1023', name: 'Introduction to Information Technology', credits: 3 },
    { code: 'BMT 1033', name: 'Business Mathematics', credits: 3 },
    { code: 'BMT 1043', name: 'Business English I', credits: 3},
    { code: 'BMT 1053', name: 'Micro Economics', credits: 3 },
    { code: 'NCC 1010', name: 'Basic Tamil/Sinhala I', credits: 0, isNonCredit: true },
  ],
  '12': [
    { code: 'AFM 1013', name: 'Financial Accounting', credits: 3 },
    { code: 'HRM 1013', name: 'Human Resource Management', credits: 3 },
    { code: 'MKT 1013', name: 'Marketing Management', credits: 3 },
    { code: 'BMT 1063', name: 'Business Statistics', credits: 3 },
    { code: 'BMT 1073', name: 'Business English II', credits: 3 },
    { code: 'NCC 1030', name: 'Basic Tamil II /Sinhala II', credits: 0, isNonCredit: true },
  ],
  '21': [
    { code: 'BMT 2013', name: 'Macro Economics', credits: 3 },
    { code: 'AFM 2013', name: 'Cost and Management Accounting', credits: 3 },
    { code: 'BMT 2023', name: 'Management Information System', credits: 3 },
    { code: 'BMT 2033', name: 'Business Skills I', credits: 3 },
    { code: 'BMT 2043', name: 'Business Law', credits: 3 },
    { code: 'NCC 2010', name: 'Career Guidance', credits: 3, isNonCredit: true },
  ],
  '22': [
    { code: 'BMT 2053', name: 'Operations Management', credits: 3 }, 
    { code: 'AFM 2023', name: 'Financial Management', credits: 3 },
    { code: 'BMT 2063', name: 'Business Skills II', credits: 3 },
    { code: 'BMT 2073', name: 'Enterprenurship and Innovation', credits: 3 },
    { code: 'BMT 2082', name: 'Fundamental Sociology and Psychology', credits: 2 },
    { code: 'BMT 2091', name: 'Peace and Social Harmony', credits: 1 },
    { code: 'NCC 2020', name: 'Basic Science', credits: 0, isNonCredit: true },
  ],
}

const SPECIALIZATION_COURSES = {
  'G': {
    '31': [
      { code: 'BMT 3013', name: 'Organizational Behavior', credits: 3 },
      { code: 'BMT 3023', name: 'Operrational Reserch', credits: 3 },
      { code: 'BMT 3033', name: 'Total Quality Management', credits: 3 },
      { code: 'BMT 3043', name: 'Organizational Development', credits: 3 },
      { code: 'BMT 3053', name: 'Micro Finance', credits: 3 },
    ],
    '32': [
      { code: 'BMT 3063', name: 'Project Management', credits: 3 },
      { code: 'BMT 3073', name: 'Managerial Economics', credits: 3 },
      { code: 'BMT 3083', name: 'Reserch Methods', credits: 3 },
      { code: 'BMT 3093', name: 'Strategic Management', credits: 3 },
      { code: 'BMT 3113', name: 'Disaster Management', credits: 3 },
    ],
  },
  'M': {
    '31': [
      { code: 'BMT 3013', name: 'Organizational Behavior', credits: 3 },
      { code: 'BMT 3023', name: 'Operrational Reserch', credits: 3 },
      { code: 'BMT 3033', name: 'Total Quality Management', credits: 3 },
      { code: 'BMT 3043', name: 'Organizational Development', credits: 3 },
      { code: 'BMT 3053', name: 'Micro Finance', credits: 3 },
    ],
    '32': [
      { code: 'BMT 3063', name: 'Project Management', credits: 3 },
      { code: 'BMT 3073', name: 'Managerial Economics', credits: 3 },
      { code: 'BMT 3083', name: 'Reserch Methods', credits: 3 },
      { code: 'BMT 3093', name: 'Strategic Management', credits: 3 },
      { code: 'BMT 3113', name: 'Disaster Management', credits: 3 },
      { code: 'BMT 3123', name: 'Labor Law and Relations', credits: 3 },
    ],
    '41': [
      { code: 'BMT 4013', name: 'Computer Based Data Analysis', credits: 3 },
      { code: 'BMT 4023', name: 'Development Economics', credits: 3 },
      { code: 'BMT 4033', name: 'Service Management', credits: 3 },
      { code: 'BMT 4043', name: 'International Business', credits: 3 },
      { code: 'BMT 4053', name: 'E-Commerce', credits: 3 },
      { code: 'BMT 3133', name: 'Contempory Issues in Management', credits: 3 },
    ],
    '42': [
      { code: 'BMT 4076', name: 'Reserch', credits: 6 },
      { code: 'BMT 4083', name: 'Internship', credits: 3 },
    ],
  },
  'HR': {
    '31': [
      { code: 'HRM 3013', name: 'Organizational Behavior', credits: 3 },
      { code: 'HRM 3023', name: 'Operrational Reserch', credits: 3 },
      { code: 'HRM 3033', name: 'Organizational Development', credits: 3 },
      { code: 'HRM 3043', name: 'Performance Appraisal', credits: 3 },
      { code: 'HRM 3053', name: 'Human Resource Planning', credits: 3 },
    ],
    '32': [
      { code: 'HRM 3063', name: 'Project Management', credits: 3 },
      { code: 'HRM 3073', name: 'Managerial Economics', credits: 3 },
      { code: 'HRM 3083', name: 'Reserch Methods', credits: 3 },
      { code: 'HRM 3093', name: 'Strategic Management', credits: 3 },
      { code: 'HRM 3123', name: 'Labor Law and Relations', credits: 3 },
      { code: 'HRM 3113', name: 'Human Resource Development', credits: 3 },
    ],
    '41': [
      { code: 'HRM 4013', name: 'Computer Based Data Analysis', credits: 3 },
      { code: 'HRM 4023', name: 'Development Economics', credits: 3 },
      { code: 'HRM 4033', name: 'Strategic Human Resource Management', credits: 3 },
      { code: 'HRM 4043', name: 'International Human Resource Management', credits: 3 },
      { code: 'HRM 4053', name: 'Human Resource Information Systems', credits: 3 },
      { code: 'HRM 4063', name: 'Human Resource Accounting', credits: 3 },
    ],
    '42': [
      { code: 'HRM 4076', name: 'Reserch', credits: 6 },
      { code: 'HRM 4083', name: 'Internship', credits: 3 },
    ],
  },
  'ACC': {
    '31': [
      { code: 'BMT 3013', name: 'Organizational Behavior', credits: 3 },
      { code: 'BMT 3023', name: 'Operrational Reserch', credits: 3 },
      { code: 'AFM 3033', name: 'Micro Finance', credits: 3 },
      { code: 'AFM 3043', name: 'Investment and Portfolio Management', credits: 3 },
      { code: 'AFM 3053', name: 'Advanced Financial Accounting', credits: 3 },
    ],
    '32': [
      { code: 'BMT 3063', name: 'Project Management', credits: 3 },
      { code: 'BMT 3073', name: 'Managerial Economics', credits: 3 },
      { code: 'BMT 3083', name: 'Reserch Methods', credits: 3 },
      { code: 'BMT 3093', name: 'Strategic Management', credits: 3 },
      { code: 'AFM 3103', name: 'Auditing', credits: 3 },
      { code: 'AFM 3113', name: 'Computer Based Accounting', credits: 3 },
    ],
    '41': [
      { code: 'AFM 4013', name: 'Computer Based Data Analysis', credits: 3 },
      { code: 'AFM 4023', name: 'Development Economics', credits: 3 },
      { code: 'AFM 4033', name: 'Taxation', credits: 3 },
      { code: 'AFM 4043', name: 'Advanced Accounting Theory', credits: 3 },
      { code: 'AFM 4053', name: 'Public Sector Accounting', credits: 3 },
      { code: 'AFM 4063', name: 'Financial Reporting', credits: 3 },
    ],
    '42': [
      { code: 'AFM 4076', name: 'Reserch', credits: 6 },
      { code: 'AFM 4083', name: 'Internship', credits: 3 },
    ],
  },
  'Mkt': {
    '31': [
      { code: 'MMT 3013', name: 'Organizational Behavior', credits: 3 },
      { code: 'MMT 3023', name: 'Operrational Reserch', credits: 3 },
      { code: 'MMT 3033', name: 'Service Marketing', credits: 3 },
      { code: 'MMT 3043', name: 'Sales Management and Retail Marketing', credits: 3 },
      { code: 'MMT 3053', name: 'Marketing Research', credits: 3 },
    ],
    '32': [
      { code: 'MMT 3063', name: 'Project Management', credits: 3 },
      { code: 'MMT 3073', name: 'Managerial Economics', credits: 3 },
      { code: 'MMT 3083', name: 'Reserch Methods', credits: 3 },
      { code: 'MMT 3093', name: 'Strategic Management', credits: 3 },
      { code: 'MMT 3103', name: 'Consumer Behavior', credits: 3 },
      { code: 'MMT 3113', name: 'Intergrated Marketing Communication', credits: 3 },
    ],
    '41': [
      { code: 'MMT 4013', name: 'Computer Based Data Analysis', credits: 3 },
      { code: 'MMT 4023', name: 'Development Economics', credits: 3 },
      { code: 'MMT 4033', name: 'E Marketing', credits: 3 },
      { code: 'MMT 4043', name: 'Strategic Marketing', credits: 3 },
      { code: 'MMT 4053', name: 'International Marketing', credits: 3 },
      { code: 'MMT 4063', name: 'Brand Management', credits: 3 },
    ],
    '42': [
      { code: 'MMT 4076', name: 'Reserch', credits: 6 },
      { code: 'MMT 4083', name: 'Internship', credits: 3 },
    ],
  },
  'IS': {
    '31': [
      { code: 'IMT 3013', name: 'Organizational Behavior', credits: 3 },
      { code: 'IMT 3023', name: 'Operrational Reserch', credits: 3 },
      { code: 'IMT 3033', name: 'Programming Concept', credits: 3 },
      { code: 'IMT 3043', name: 'Systems Analaysis and Design', credits: 3 },
      { code: 'IMT 3053', name: 'Data Communication and Computer Networks', credits: 3 },
    ],
    '32': [
      { code: 'IMT 3063', name: 'Project Management', credits: 3 },
      { code: 'IMT 3073', name: 'Managerial Economics', credits: 3 },
      { code: 'IMT 3083', name: 'Reserch Methods', credits: 3 },
      { code: 'IMT 3093', name: 'Strategic Management', credits: 3 },
      { code: 'IMT 3103', name: 'Professional Ethics and Responsibility', credits: 3 },
      { code: 'IMT 3113', name: 'Software Engineering', credits: 3 },
    ],
    '41': [
      { code: 'IMT 4013', name: 'Computer Based Data Analysis', credits: 3 },
      { code: 'IMT 4023', name: 'Object Oriented Programming', credits: 3 },
      { code: 'IMT 4033', name: 'Web Development', credits: 3 },
      { code: 'IMT 4043', name: 'Enterprise Resource Planning System', credits: 3 },
      { code: 'IMT 4053', name: 'Software Quality Assuarance', credits: 3 },
      { code: 'IMT 4063', name: 'Database Management Systems', credits: 3 },
    ],
    '42': [
      { code: 'IMT 4076', name: 'Reserch', credits: 6 },
      { code: 'IMT 4083', name: 'Internship', credits: 3 },
    ],
  },
}

const SPECIALIZATIONS = [
  { key: 'G', label: 'General Degree Program', suffix: 'G' },
  { key: 'M', label: 'Management (Special)', suffix: 'M' },
  { key: 'HR', label: 'HRM (Special)', suffix: 'HR' },
  { key: 'ACC', label: 'Accounting (Special)', suffix: 'ACC' },
  { key: 'Mkt', label: 'Marketing (Special)', suffix: 'Mkt' },
  { key: 'IS', label: 'Information Management (Special)', suffix: 'IS' },
]

const SEMESTERS = [
  { id: '11', label: 'Year I - Semester I', year: 1, sem: 1 },
  { id: '12', label: 'Year I - Semester II', year: 1, sem: 2 },
  { id: '21', label: 'Year II - Semester I', year: 2, sem: 1 },
  { id: '22', label: 'Year II - Semester II', year: 2, sem: 2 },
  { id: '31', label: 'Year III - Semester I', year: 3, sem: 1 },
  { id: '32', label: 'Year III - Semester II', year: 3, sem: 2 },
  { id: '41', label: 'Year IV - Semester I', year: 4, sem: 1 },
  { id: '42', label: 'Year IV - Semester II', year: 4, sem: 2 },
]

function getCourses(semesterId, specialization) {
  if (BMS_COURSES[semesterId]) return BMS_COURSES[semesterId]
  if (specialization && SPECIALIZATION_COURSES[specialization]?.[semesterId]) {
    return SPECIALIZATION_COURSES[specialization][semesterId]
  }
  return null
}

function getAllSemesterIdsUpTo(targetId, specialization) {
  const targetIndex = SEMESTERS.findIndex((s) => s.id === targetId)
  if (targetIndex === -1) return []

  const allIds = []
  for (let i = 0; i <= targetIndex; i++) {
    const sem = SEMESTERS[i]
    const courses = getCourses(sem.id, specialization)
    if (courses) allIds.push(sem.id)
  }
  return allIds
}

function getAccumulatedCourses(targetId, specialization) {
  const ids = getAllSemesterIdsUpTo(targetId, specialization)
  const allCourses = []
  for (const id of ids) {
    const courses = getCourses(id, specialization)
    if (courses) {
      for (const c of courses) {
        allCourses.push({ ...c, semesterId: id })
      }
    }
  }
  return allCourses
}

function calcGPA(grades, courses) {
  let totalPoints = 0, totalCredits = 0
  for (const course of courses) {
    if (course.isNonCredit) continue
    const grade = grades[course.code]
    if (grade && GRADE_POINTS[grade] !== undefined) {
      totalPoints += GRADE_POINTS[grade] * course.credits
      totalCredits += course.credits
    }
  }
  return totalCredits > 0 ? (totalPoints / totalCredits) : 0
}

// සියලුම සෙමෙස්ටර් වල එකතුවෙන් Cumulative GPA එක සෙවීම
function calcGPAFromAll(semesterGrades, semesterCourses) {
  let totalPoints = 0, totalCredits = 0
  for (const semId of Object.keys(semesterGrades)) {
    const courses = semesterCourses[semId] || []
    const grades = semesterGrades[semId] || {}
    for (const course of courses) {
      if (course.isNonCredit) continue
      const grade = grades[course.code]
      if (grade && GRADE_POINTS[grade] !== undefined) {
        totalPoints += GRADE_POINTS[grade] * course.credits
        totalCredits += course.credits
      }
    }
  }
  return totalCredits > 0 ? (totalPoints / totalCredits) : 0
}

const GRADE_OPTIONS = Object.keys(GRADE_POINTS)

export default function GPACalculator() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [activeSem, setActiveSem] = useState(null)
  const [specialization, setSpecialization] = useState('')
  const [showSpecializationModal, setShowSpecializationModal] = useState(false)
  const [pendingSem, setPendingSem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [grades, setGrades] = useState({})
  
  const [batchPermissions, setBatchPermissions] = useState([])
  const [userBatch, setUserBatch] = useState('23/24') 

  const user = auth.currentUser

  // 🔄 මුලින්ම Firestore එකෙන් දත්ත ලබාගැනීම
  useEffect(() => {
    async function fetchUserData() {
      try {
        const perms = await getBatchPermissions()
        setBatchPermissions(perms)

        if (!user) { setLoading(false); return }

        const docRef = doc(db, 'users', user.uid, 'gpa_data', 'bms_calculator')
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.specialization) setSpecialization(data.specialization)
          if (data.grades) setGrades(data.grades)
          if (data.userBatch) setUserBatch(data.userBatch) 
        }

        const userProfileRef = doc(db, 'users', user.uid)
        const profileSnap = await getDoc(userProfileRef)
        if (profileSnap.exists() && profileSnap.data().batch) {
          setUserBatch(profileSnap.data().batch)
        }

      } catch (error) {
        console.error("Error fetching GPA data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [user])

  // activeSem එක මුලින්ම සෙට් කිරීම
  useEffect(() => {
    if (!loading && SEMESTERS.length > 0) {
      setActiveSem(SEMESTERS[0].id)
    }
  }, [loading])

  // 🛑 සෙමෙස්ටර් බටන් ක්ලික් එක පාලනය කිරීම
  const handleSemesterClick = (sem) => {
    const currentBatchPerm = batchPermissions.find((p) => p.batchName === userBatch)
    const isAllowedByAdmin = currentBatchPerm?.semesterIds?.includes(sem.id) || false

    if (!isAllowedByAdmin) {
      showToast(`ඔබගේ ${userBatch} බැච් එක සඳහා මෙම සෙමෙස්ටර් එක තවමත් විවෘත කර නොමැත! 🛑`, 'error')
      return 
    }

    const year = parseInt(sem.id[0])
    if (year <= 2) { setActiveSem(sem.id); return }
    
    if (!specialization) { 
      setPendingSem(sem.id)
      setShowSpecializationModal(true)
      return 
    }
    setActiveSem(sem.id)
  }

  // Specialization එකක් තෝරාගත් පසු Firestore සේව් කිරීම
  const handleSelectSpecialization = async (key) => {
    setSpecialization(key)
    setShowSpecializationModal(false)
    
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'gpa_data', 'bms_calculator')
        await setDoc(docRef, { specialization: key }, { merge: true })
      } catch (err) {
        console.error("Error saving specialization:", err)
      }
    }

    if (pendingSem) {
      setActiveSem(pendingSem)
      setPendingSem(null)
    }
  }

  // ලකුණු වෙනස් කරද්දී auto-save වීම
  const handleGradeChange = async (semId, courseCode, grade) => {
    const updatedGrades = {
      ...grades,
      [semId]: { ...(grades[semId] || {}), [courseCode]: grade },
    }
    setGrades(updatedGrades)

    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'gpa_data', 'bms_calculator')
        await setDoc(docRef, { grades: updatedGrades }, { merge: true })
      } catch (err) {
        console.error("Error auto-saving grades:", err)
      }
    }
  }

  // Specialization එක පමණක් වෙනස් කිරීම
  const resetSpecialization = async () => {
    if (confirm('Are you sure you want to change your specialization path? This will reload upper semester courses.')) {
      setSpecialization('')
      setActiveSem(null) 
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'gpa_data', 'bms_calculator')
        await setDoc(docRef, { specialization: '' }, { merge: true })
      }
      showToast('Specialization reset. Select a Y3/Y4 semester to choose again.', 'info')
    }
  }

  // සියලුම ලකුණු සහ Specialization ඩේටාබේස් එකෙන්ම මැකීම
  const resetAllGrades = async () => {
    if (confirm('Reset all entered grades and selected specialization path from database?')) {
      setGrades({})
      setSpecialization('')
      setActiveSem(null) 
      
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid, 'gpa_data', 'bms_calculator')
          await setDoc(docRef, { grades: {}, specialization: '' }, { merge: true })
        } catch (err) {
          console.error("Error resetting database data:", err)
        }
      }
      showToast('All grades and specialization path cleared from cloud database.', 'info')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-sm text-gray-500">Syncing with database...</span>
      </div>
    )
  }

  const accumulatedCourses = activeSem ? getAccumulatedCourses(activeSem, specialization) : []
  const allGrades = {}
  for (const c of accumulatedCourses) {
    const semGrades = grades[c.semesterId] || {}
    if (semGrades[c.code]) allGrades[c.code] = semGrades[c.code]
  }

  const semGPA = activeSem ? calcGPA(allGrades, accumulatedCourses) : 0

  const semesterCourses = {}
  for (const sem of SEMESTERS) {
    const courses = getCourses(sem.id, specialization)
    if (courses) semesterCourses[sem.id] = courses
  }
  const cumulativeGPA = calcGPAFromAll(grades, semesterCourses)

  const semesterLabel = activeSem ? SEMESTERS.find((s) => s.id === activeSem)?.label || '' : ''

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* 🔙 BACK TO DASHBOARD BUTTON */}
      <button 
        onClick={() => navigate('/dashboard')} 
        className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BMS GPA Calculator</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time cloud database storage activated ☁️ (Batch: <b>{userBatch}</b>)</p>
        </div>
        {(specialization || Object.keys(grades).length > 0) && (
          <div className="flex gap-2">
            {specialization && (
              <button onClick={resetSpecialization}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition">
                Change Specialization
              </button>
            )}
            {Object.keys(grades).length > 0 && (
              <button onClick={resetAllGrades}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition">
                Clear Grades
              </button>
            )}
          </div>
        )}
      </div>

      {Object.keys(grades).length > 0 && (
        <div className="card p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-600">Cumulative GPA (all semesters)</span>
            <p className="text-xs text-gray-400 mt-0.5">Cloud Synced Profile</p>
          </div>
          <span className={`text-2xl font-bold ${cumulativeGPA >= 3.0 ? 'text-emerald-600' : cumulativeGPA >= 2.0 ? 'text-amber-600' : 'text-red-600'}`}>
            {cumulativeGPA.toFixed(2)}
          </span>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6">
        {SEMESTERS.map((sem) => {
          const isUpper = sem.year >= 3
          const currentBatchPerm = batchPermissions.find((p) => p.batchName === userBatch)
          const isAllowedByAdmin = currentBatchPerm?.semesterIds?.includes(sem.id) || false
          
          const semData = grades[sem.id]
          const hasGrades = semData && Object.values(semData).some((g) => g)
          const isActive = activeSem === sem.id

          return (
            <button key={sem.id} onClick={() => handleSemesterClick(sem)}
              disabled={!isAllowedByAdmin}
              className={`card card-hover p-4 text-left transition-all duration-200 ${
                isActive ? 'card-selected' : ''
              } ${!isAllowedByAdmin ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isUpper ? 'bg-violet-50 text-violet-600' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  Y{sem.year}S{sem.sem}
                </span>
                {isUpper && !specialization && isAllowedByAdmin && (
                  <span className="text-[10px] text-amber-600 font-medium">Choose path</span>
                )}
                {!isAllowedByAdmin && (
                  <span className="text-[10px] text-red-500 font-medium">Locked</span>
                )}
                {hasGrades && isAllowedByAdmin && (
                  <span className="text-[10px] text-emerald-600 font-medium">Saved to Cloud</span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900">{sem.label}</p>
              {hasGrades && isAllowedByAdmin && semesterCourses[sem.id] && (
                <p className="text-xs text-gray-500 mt-1">
                  GPA: {calcGPA(semData || {}, semesterCourses[sem.id] || []).toFixed(2)}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {activeSem && accumulatedCourses.length > 0 && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">
              All Courses up to {semesterLabel}
              {specialization && parseInt(activeSem[0]) >= 3 && (
                <span className="ml-2 text-sm font-medium text-indigo-600">
                  ({SPECIALIZATIONS.find((s) => s.key === specialization)?.label})
                </span>
              )}
            </h2>
            <span className={`text-lg font-bold ${semGPA >= 3.0 ? 'text-emerald-600' : semGPA >= 2.0 ? 'text-amber-600' : 'text-red-600'}`}>
              GPA: {semGPA.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Showing all {accumulatedCourses.length} course(s). Changes auto-save instantly.
          </p>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200">
                  <th className="py-3 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 w-16">Sem</th>
                  <th className="py-3 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Code</th>
                  <th className="py-3 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Course</th>
                  <th className="py-3 pr-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 w-16">Credits</th>
                  <th className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 w-28">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accumulatedCourses.map((course, index) => {
                  const selectedGrade = grades[course.semesterId]?.[course.code] || ''
                  const prefix = course.semesterId
                  const semInfo = SEMESTERS.find((s) => s.id === prefix)
                  return (
                    <tr key={`${prefix}-${course.code}-${index}`} className={`hover:bg-gray-200 transition ${course.isNonCredit ? 'bg-gray-50/50' : ''}`}>
                      <td className="py-2.5 pr-3">
                        <span className="text-[10px] font-mono font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {semInfo ? `Y${semInfo.year}S${semInfo.sem}` : prefix}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500 font-mono text-xs">{course.code}</td>
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-gray-900">{course.name}</span>
                        {course.isNonCredit && (
                          <span className="ml-2 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">Non-credit</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-center">
                        <span className={`text-xs ${course.isNonCredit ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                          {course.credits}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <select value={selectedGrade}
                          onChange={(e) => handleGradeChange(prefix, course.code, e.target.value)}
                          className={`text-xs rounded-lg border px-2 py-1.5 outline-none transition w-full ${
                            selectedGrade
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold'
                              : 'border-gray-200 bg-white text-gray-500'
                          }`}>
                          <option value="">—</option>
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSpecializationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowSpecializationModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Choose Your Specialization</h2>
              <p className="text-sm text-gray-500 mt-1">Select your degree path for Year 3 &amp; 4 courses</p>
            </div>
            <div className="space-y-4">
              <select 
                value={specialization}
                onChange={(e) => {
                  if(e.target.value) handleSelectSpecialization(e.target.value)
                }}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-xl outline-none bg-white focus:border-indigo-500 transition font-medium text-gray-700"
              >
                <option value="">-- Click here to select your path --</option>
                {SPECIALIZATIONS.map((spec) => (
                  <option key={spec.key} value={spec.key}>
                    {spec.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {Object.keys(grades).length > 0 && (
        <div className="mt-6 card p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Per-Semester Breakdown</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {SEMESTERS.map((sem) => {
              const data = grades[sem.id]
              const courses = semesterCourses[sem.id]
              if (!data || !courses) return null
              const hasGrades = Object.values(data).some((g) => g)
              if (!hasGrades) return null
              const gpa = calcGPA(data, courses)
              return (
                <div key={sem.id} className="text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <span className="font-semibold text-gray-700">Y{sem.year}S{sem.sem}</span>
                  <span className={`ml-2 font-bold ${gpa >= 3.0 ? 'text-emerald-600' : gpa >= 2.0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {gpa.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-[11px] text-gray-400">
          BMS Department GPA Calculator — Cloud Synced Profile Data
        </p>
      </div>
    </div>
  )
}