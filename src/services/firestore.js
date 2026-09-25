import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
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

// 1. අලුත් කමෙන්ට් එකක් Firebase එකට එකතු කිරීම
export async function addComment(commentData) {
  return addDoc(commentsCol, {
    ...commentData,
    createdAt: serverTimestamp(),
  })
}

// 2. Dashboard එකට සහ Admin එකට ඕන වෙන Real-time Listener එක
export function getCommentsLive(callback) {
  const q = query(commentsCol, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(comments)
  })
}

// 3. Static එක පාරක් විතරක් ඔක්කොම ඇදලා ගන්න (Admin Export වලට)
export async function getAllComments() {
  const q = query(commentsCol, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// 4. කමෙන්ට් එකක් ඩිලීට් කිරීම
export async function deleteComment(id) {
  return deleteDoc(doc(db, 'comments', id))
}

/* VITE SYNTAX ERRORS මඟහරවා ගැනීමට පාවිච්චි කල පරණ FUNCTIONS */

// SubjectDetail හෝ CommentSection.jsx බ්‍රේක් නොවී වැඩ කරන්න
export async function getComments(chapterId) {
  const q = query(commentsCol, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// පරණ CommentManagement.jsx එකේ updateCommentStatus ඉල්ලන නිසා
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

// Document ID format: {batch}_{department}_{year}_{semester}
// e.g., "23/24_bms_1_11"
// Document structure:
// {
//   batch: string,
//   department: string,
//   year: string,
//   semester: string,
//   subjectMap: { [subjectCode]: subjectName },
//   students: {
//     [indexNo]: { studentName: string, grades: { [subjectCode]: grade } }
//   },
//   updatedAt: timestamp
// }

function getDocId(batch, department, year, semester) {
  return `${batch}_${department.toLowerCase()}_${year}_${semester}`;
}

function getYearFromSemester(semester) {
  // semester format: '11', '12', '21', '22', '31', '32', '41', '42'
  return semester.charAt(0);
}

export async function uploadExamResultsOptimized(results, department, batch, semester) {
  const year = getYearFromSemester(semester);
  const docId = getDocId(batch, department, year, semester);
  const docRef = doc(examResultsCol, docId);
  
  // Build subjectMap and students object from results
  const subjectMap = {};
  const students = {};
  
  for (const r of results) {
    const subjectCode = r.subjectCode;
    const subjectName = r.subjectName || subjectCode;
    const indexNo = r.indexNo.toUpperCase();
    const studentName = r.studentName || '';
    const grade = r.grade;
    
    // Build subjectMap (only once per subject)
    if (!subjectMap[subjectCode]) {
      subjectMap[subjectCode] = subjectName;
    }
    
    // Build students object
    if (!students[indexNo]) {
      students[indexNo] = {
        studentName: studentName,
        grades: {}
      };
    }
    
    // Apply grade comparison logic - keep higher grade
    const existingGrade = students[indexNo].grades[subjectCode];
    const newGradeWeight = getGradeWeight(grade);
    const existingGradeWeight = existingGrade ? getGradeWeight(existingGrade) : 0;
    
    if (!existingGrade || newGradeWeight > existingGradeWeight) {
      students[indexNo].grades[subjectCode] = grade;
    }
  }
  
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    // Merge with existing document
    const existingData = docSnap.data();
    const existingSubjectMap = existingData.subjectMap || {};
    const existingStudents = existingData.students || {};
    
    // Merge subjectMap (new subjects get added, existing kept)
    const mergedSubjectMap = { ...existingSubjectMap, ...subjectMap };
    
    // Merge students and grades with grade comparison
    const mergedStudents = { ...existingStudents };
    
    for (const [indexNo, newStudentData] of Object.entries(students)) {
      if (!mergedStudents[indexNo]) {
        mergedStudents[indexNo] = newStudentData;
      } else {
        // Merge grades with comparison
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
    // Create new document
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

// Semester-isolated query: fetch single document and extract student data
export async function getExamResultsOptimized(indexNo, department, batch, semester) {
  const year = getYearFromSemester(semester);
  const docId = getDocId(batch, department, year, semester);
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
  
  // Convert to flat array format for backward compatibility
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

export async function deleteExamResultsOptimized(department, batch, semester) {
  const year = getYearFromSemester(semester);
  const docId = getDocId(batch, department, year, semester);
  const docRef = doc(examResultsCol, docId);
  await deleteDoc(docRef);
  return true;
}

export async function getExamSemestersOptimized(indexNo, department, batch) {
  const q = query(
    examResultsCol,
    where('indexNo', '==', indexNo.toUpperCase()),
    where('department', '==', department.toLowerCase()),
    where('batch', '==', batch)
  );
  const snap = await getDocs(q);
  
  const semesters = new Set();
  snap.docs.forEach(d => {
    const data = d.data();
    if (data.semester) {
      semesters.add(data.semester);
    }
  });
  
  return Array.from(semesters).sort();
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