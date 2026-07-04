import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

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

/* ─── Comments ─── */
const commentsCol = collection(db, 'comments')

export async function getComments(chapterId) {
  const q = query(commentsCol, where('chapterId', '==', chapterId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAllComments() {
  const q = query(commentsCol, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addComment({ chapterId, content, userId, userDisplayName, userPhotoURL }) {
  return addDoc(commentsCol, {
    chapterId, content, userId, userDisplayName, userPhotoURL: userPhotoURL || '',
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function updateCommentStatus(id, status) {
  return updateDoc(doc(db, 'comments', id), { status })
}

export async function deleteComment(id) {
  return deleteDoc(doc(db, 'comments', id))
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
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() }
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
