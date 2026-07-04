import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from './firebase'

export async function registerUser({ email, password, firstName, lastName, mobile, department, batch, regNumber, photoFile }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` })

  let photoURL = ''
  if (photoFile) {
    const storageRef = ref(storage, `profiles/${cred.user.uid}/${photoFile.name}`)
    const snap = await uploadBytes(storageRef, photoFile)
    photoURL = await getDownloadURL(snap.ref)
  }

  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    firstName,
    lastName,
    email,
    mobile,
    department,
    batch,
    regNumber,
    photoURL,
    role: 'student',
    isFaceVerified: false,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  })

  return cred.user
}

export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}

export async function logoutUser() {
  return signOut(auth)
}
