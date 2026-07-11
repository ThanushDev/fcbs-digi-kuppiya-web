import { auth, db } from './firebase' // ඔයාගේ firebase config එක තියෙන path එක හරියටම දාන්න
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

/**
 * නව පරිශීලකයෙකු Firebase Auth සහ Firestore වෙත ලියාපදිංචි කිරීම.
 */
export const registerUser = async (userData) => {
  const {
    email,
    password,
    firstName,
    lastName,
    mobile,
    department,
    batch,
    regNumber,
    photoFile
  } = userData;

  // 1. Firebase Authentication එකේ යූසර්ව ක්‍රියේට් කරනවා (සඟල වරහන් {} නැතුව කෙලින්ම String පාස් කර ඇත)
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 💡 දැනට Photo Upload Logic එකක් නැත්නම් default URL එකක් සෙට් කරනවා
  let finalPhotoURL = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; 

  // 2. Firestore 'users' Collection එක ඇතුළේ යූසර්ගේ Profile දත්ත ටික සේව් කරනවා
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    firstName,
    lastName,
    email,
    mobile,
    department: department.toLowerCase(),
    batch,
    regNumber,
    role: 'student', // Default රෝල් එක student විදිහට දෙනවා
    photoURL: finalPhotoURL,
    createdAt: new Date().toISOString()
  });

  return user;
};