import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, setDoc,
  query, where, orderBy, serverTimestamp, onSnapshot, writeBatch
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'
import { GRADE_WEIGHTS, getGradeWeight } from '../utils/gradeWeights'

export { GRADE_WEIGHTS };

/* ─── Semesters ─── */
const semestersCol = collection(db, 'semesters')

export async function getSemesters() {
  const q = query(semestersCol, orderBy('order'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addSemester(data) {
  return addDoc(semestersCol, { ...data, createdAt: serverTimestamp() })
}

export async function updateSemester(id, data) {
  return updateDoc(doc(db, 'semesters', id), data)
}

export async function deleteSemester(id) {
  return deleteDoc(doc(db, 'semesters', id))
}

/* ─── Subjects ─── */
const subjectsCol = collection(db, 'subjects')

export async function getSubjects(semesterId) {
  const q = semesterId
    ? query(subjectsCol, where('semesterId', '==', semesterId), orderBy('name'))
    : query(subjectsCol, orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAllSubjects() {
  const snap = await getDocs(query(subjectsCol, orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addSubject(data) {
  return addDoc(subjectsCol, { ...data, createdAt: serverTimestamp() })
}

export async function updateSubject(id, data) {
  return updateDoc(doc(db, 'subjects', id), data)
}

export async function deleteSubject(id) {
  const chapters = await getChapters(id)
  for (const ch of chapters) {
    const resources = await getResources(ch.id)
    for (const r of resources) {
      if (r.fileURL && r.filePath) await deleteObject(ref(storage, r.filePath)).catch(() => {})
      await deleteDoc(doc(db, 'resources', r.id))
    }
    await deleteDoc(doc(db, 'chapters', ch.id))
  }
  return deleteDoc(doc(db, 'subjects', id))
}

/* ─── Chapters ─── */
const chaptersCol = collection(db, 'chapters')

export async function getChapters(subjectId) {
  const q = query(chaptersCol, where('subjectId', '==', subjectId), orderBy('order'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addChapter(data) {
  return addDoc(chaptersCol, { ...data, createdAt: serverTimestamp() })
}

export async function updateChapter(id, data) {
  return updateDoc(doc(db, 'chapters', id), data)
}

export async function deleteChapter(id) {
  const resources = await getResources(id)
  for (const r of resources) {
    if (r.fileURL && r.filePath) await deleteObject(ref(storage, r.filePath)).catch(() => {})
    await deleteDoc(doc(db, 'resources', r.id))
  }
  return deleteDoc(doc(db, 'chapters', id))
}

/* ─── Resources ─── */
const resourcesCol = collection(db, 'resources')

export async function getResources(chapterId) {
  const q = query(resourcesCol, where('chapterId', '==', chapterId), orderBy('createdAt'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addDocumentResource(chapterId, name, file) {
  const filePath = `resources/${chapterId}/${Date.now()}_${file.name}`
  const storageRef = ref(storage, filePath)
  const snap = await uploadBytes(storageRef, file)
  const fileURL = await getDownloadURL(snap.ref)
  return addDoc(resourcesCol, {
    chapterId, name, type: 'document', fileURL, filePath,
    createdAt: serverTimestamp(),
  })
}

export async function addVideoResource(chapterId, name, youtubeId, duration) {
  return addDoc(resourcesCol, {
    chapterId, name, type: 'video', youtubeId, duration,
    createdAt: serverTimestamp(),
  })
}

export async function deleteResource(id) {
  const snap = await getDoc(doc(db, 'resources', id))
  const data = snap.data()
  if (data?.filePath) await deleteObject(ref(storage, data.filePath)).catch(() => {})
  return deleteDoc(doc(db, 'resources', id))
}

/* ─── Resource type queries (Past Papers, Short Notes, Videos) ─── */
export async function getResourcesBySubjectAndType(subjectId, type) {
  const q = query(
    resourcesCol,
    where('subjectId', '==', subjectId),
    where('type', '==', type),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAllResourcesByType(type) {
  const q = query(resourcesCol, where('type', '==', type), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addResourceItem(data) {
  return addDoc(resourcesCol, { ...data, createdAt: serverTimestamp() })
}

export async function updateResourceItem(id, data) {
  return updateDoc(doc(db, 'resources', id), data)
}

export async function deleteResourceItem(id) {
  return deleteDoc(doc(db, 'resources', id))
}

/* ─── Quizzes ─── */
const quizzesCol = collection(db, 'quizzes')

export async function getQuizzes() {
  const q = query(quizzesCol, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getQuiz(id) {
  const snap = await getDoc(doc(db, 'quizzes', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function addQuiz({ title, timeLimit, password, subjectId }) {
  return addDoc(quizzesCol, { title, timeLimit: Number(timeLimit) || 10, password: password || '', subjectId: subjectId || '', createdAt: serverTimestamp() })
}

export async function updateQuiz(id, data) {
  return updateDoc(doc(db, 'quizzes', id), data)
}

export async function deleteQuiz(id) {
  const questionsSnap = await getDocs(query(collection(db, 'questions'), where('quizId', '==', id)))
  for (const q of questionsSnap.docs) {
    await deleteDoc(doc(db, 'questions', q.id))
  }
  const attemptsSnap = await getDocs(query(collection(db, 'attempts'), where('quizId', '==', id)))
  for (const a of attemptsSnap.docs) {
    await deleteDoc(doc(db, 'attempts', a.id))
  }
  return deleteDoc(doc(db, 'quizzes', id))
}

/* ─── Questions ─── */
export async function getQuestions(quizId) {
  const q = query(collection(db, 'questions'), where('quizId', '==', quizId), orderBy('createdAt'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addQuestion({ quizId, text, allowMultiple, options }) {
  const docRef = await addDoc(collection(db, 'questions'), {
    quizId, text, allowMultiple: !!allowMultiple,
    options: options || [],
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateQuestion(id, data) {
  return updateDoc(doc(db, 'questions', id), data)
}

export async function deleteQuestion(id) {
  return deleteDoc(doc(db, 'questions', id))
}

/* ─── Attempts ─── */
export async function getAttempts(quizId) {
  const q = query(collection(db, 'attempts'), where('quizId', '==', quizId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getUserAttempts(userId) {
  const q = query(collection(db, 'attempts'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function submitAttempt({ quizId, userId, userName, userEmail, answers, score, total }) {
  return addDoc(collection(db, 'attempts'), {
    quizId, userId, userName, userEmail, answers, score, total,
    createdAt: serverTimestamp(),
  })
}

/* ─── Comments / Feedbacks (Real-time + Backward Compatibility) ─── */
const commentsCol = collection(db, 'comments')

export async function addComment(commentData) {
  return addDoc(commentsCol, {
    ...commentData,
    createdAt: serverTimestamp(),
  })
}

export function getCommentsLive(callback) {
  const q = query(commentsCol, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(comments)
  })
}

export async function getAllComments() {
  const q = query(commentsCol, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteComment(id) {
  return deleteDoc(doc(db, 'comments', id))
}

export async function getComments(chapterId) {
  const q = query(commentsCol, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateCommentStatus(id, status) {
  return updateDoc(doc(db, 'comments', id), { status })
}

/* ─── Batch Permissions ─── */
const batchPermsCol = collection(db, 'batchPermissions')

export async function getBatchPermissions() {
  const snap = await getDocs(batchPermsCol)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getBatchPermission(batchName) {
  const q = query(batchPermsCol, where('batchName', '==', batchName))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

export async function setBatchPermission(batchName, semesterIds) {
  const existing = await getBatchPermission(batchName)
  if (existing) {
    await updateDoc(doc(db, 'batchPermissions', existing.id), { semesterIds })
    return existing.id
  }
  const ref = await addDoc(batchPermsCol, {
    batchName, semesterIds: semesterIds || [],
    active: true,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteBatchPermission(id) {
  return deleteDoc(doc(db, 'batchPermissions', id))
}

/* ─── Exam Results (Optimized Structure) ─── */
const examResultsCol = collection(db, 'exam_results');

function getExamDocId(batch, department, year, semester) {
  const sanitizedBatch = batch.replace(/\//g, '-').toLowerCase().trim();
  const sanitizedDept = department.toLowerCase().trim();
  return `${sanitizedBatch}_${sanitizedDept}_${year}_${semester}`;
}

function getYearFromSemester(semester) {
  return semester.charAt(0);
}

export async function uploadExamResultsOptimized(results, department, batch, semester) {
  const year = getYearFromSemester(semester);
  const docId = getExamDocId(batch, department, year, semester);
  const docRef = doc(examResultsCol, docId);
  
  const subjectMap = {};
  const students = {};
  
  for (const r of results) {
    const subjectCode = r.subjectCode;
    const subjectName = r.subjectName || subjectCode;
    const indexNo = r.indexNo.toUpperCase();
    const studentName = r.studentName || '';
    const grade = r.grade;
    
    if (!subjectMap[subjectCode]) {
      subjectMap[subjectCode] = subjectName;
    }
    
    if (!students[indexNo]) {
      students[indexNo] = {
        studentName: studentName,
        grades: {}
      };
    }
    
    const existingGrade = students[indexNo].grades[subjectCode];
    const newGradeWeight = getGradeWeight(grade);
    const existingGradeWeight = existingGrade ? getGradeWeight(existingGrade) : 0;
    
    if (!existingGrade || newGradeWeight > existingGradeWeight) {
      students[indexNo].grades[subjectCode] = grade;
    }
  }
  
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const existingData = docSnap.data();
    const existingSubjectMap = existingData.subjectMap || {};
    const existingStudents = existingData.students || {};
    
    const mergedSubjectMap = { ...existingSubjectMap, ...subjectMap };
    const mergedStudents = { ...existingStudents };
    
    for (const [indexNo, newStudentData] of Object.entries(students)) {
      if (!mergedStudents[indexNo]) {
        mergedStudents[indexNo] = newStudentData;
      } else {
        const existingGrades = mergedStudents[indexNo].grades || {};
        const newGrades = newStudentData.grades;
        const mergedGrades = { ...existingGrades };
        
        for (const [subjectCode, newGrade] of Object.entries(newGrades)) {
          const existingGrade = existingGrades[subjectCode];
          const newGradeWeight = getGradeWeight(newGrade);
          const existingGradeWeight = existingGrade ? getGradeWeight(existingGrade) : 0;
          
          if (!existingGrade || newGradeWeight > existingGradeWeight) {
            mergedGrades[subjectCode] = newGrade;
          }
        }
        
        mergedStudents[indexNo] = {
          studentName: newStudentData.studentName || mergedStudents[indexNo].studentName,
          grades: mergedGrades
        };
      }
    }
    
    await updateDoc(docRef, {
      subjectMap: mergedSubjectMap,
      students: mergedStudents,
      updatedAt: serverTimestamp()
    });
  } else {
    await setDoc(docRef, {
      batch,
      department: department.toLowerCase(),
      year: getYearFromSemester(semester),
      semester,
      subjectMap,
      students,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  return results.length;
}

export async function getExamResultsOptimized(indexNo, department, batch, semester) {
  const year = getYearFromSemester(semester);
  const docId = getExamDocId(batch, department, year, semester);
  const docRef = doc(examResultsCol, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return [];
  }
  
  const data = docSnap.data();
  const students = data.students || {};
  const subjectMap = data.subjectMap || {};
  const studentData = students[indexNo.toUpperCase()];
  
  if (!studentData) {
    return [];
  }
  
  const results = [];
  for (const [subjectCode, grade] of Object.entries(studentData.grades)) {
    results.push({
      indexNo: indexNo.toUpperCase(),
      studentName: studentData.studentName,
      subjectCode,
      subjectName: subjectMap[subjectCode] || subjectCode,
      grade,
      department: department.toLowerCase(),
      batch,
      semester
    });
  }
  
  return results;
}

export async function getExamSemestersOptimized(indexNo, department, batch) {
  if (!indexNo || !department || !batch) return [];

  const normalizedIndex = indexNo.toUpperCase().trim();
  const normalizedDept = department.toLowerCase().trim();
  const originalBatch = batch.trim().toLowerCase();
  const sanitizedBatch = batch.replace(/\//g, '-').toLowerCase().trim();

  const SEMESTER_LABELS = {
    '11': 'Year I Semester I',
    '12': 'Year I Semester II',
    '21': 'Year II Semester I',
    '22': 'Year II Semester II',
    '31': 'Year III Semester I',
    '32': 'Year III Semester II',
    '41': 'Year IV Semester I',
    '42': 'Year IV Semester II',
  };

  const q = query(
    examResultsCol,
    where('department', '==', normalizedDept)
  );

  const snap = await getDocs(q);
  const semesters = new Set();

  snap.docs.forEach((d) => {
    const data = d.data();
    const docBatch = (data.batch || '').toLowerCase().trim();
    const docSanitizedBatch = docBatch.replace(/\//g, '-');

    const isBatchMatch = docBatch === originalBatch || docSanitizedBatch === sanitizedBatch;

    if (isBatchMatch && data.students && data.students[normalizedIndex]) {
      if (data.semester) {
        semesters.add(data.semester);
      }
    }
  });

  return Array.from(semesters)
    .sort()
    .map((semester) => ({
      id: semester,
      label: SEMESTER_LABELS[semester] || semester,
      year: getYearFromSemester(semester),
      semester,
    }));
}

export async function deleteExamResultsOptimized(department, batch, semester) {
  const year = getYearFromSemester(semester);
  const docId = getExamDocId(batch, department, year, semester);
  const docRef = doc(examResultsCol, docId);
  await deleteDoc(docRef);
  return true;
}

// Keep original functions for backward compatibility
export async function uploadExamResults(results, department, batch, semester) {
  return uploadExamResultsOptimized(results, department, batch, semester);
}

export async function getExamResults(indexNo, department, batch, semester) {
  return getExamResultsOptimized(indexNo, department, batch, semester);
}

export async function getExamSemesters(indexNo, department, batch) {
  return getExamSemestersOptimized(indexNo, department, batch);
}

export async function deleteExamResultsByBatchAndSemester(department, batch, semester) {
  return deleteExamResultsOptimized(department, batch, semester);
}