import { auth, db } from './firebase'; // 🎯 ඔයාගේ firebase setup එකට අනුව path එක නිවැරදිද බලන්න
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

// ==========================================
// 1. Login User Function
// ==========================================
export const loginUser = async (emailOrReg, password) => {
  let finalEmail = emailOrReg;

  // 📧 ඊමේල් එකක් නෙවෙයි නම් (Reg No එකක් නම්) ඒකට අදාළ ඊමේල් එක Firestore එකෙන් සොයනවා
  if (!emailOrReg.includes('@')) {
    const q = query(collection(db, "users"), where("regNumber", "==", emailOrReg));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("USER_NOT_FOUND");
    }

    const userData = querySnapshot.docs[0].data();
    finalEmail = userData.email;

    if (userData.isOldUser === true || userData.requiresPasswordReset === true) {
      throw new Error("OLD_USER_DETECTED");
    }
  } else {
    // ඊමේල් එකක් නම්, ඒ යූසර් පරණ කෙනෙක්ද කියලා චෙක් කරනවා
    const q = query(collection(db, "users"), where("email", "==", emailOrReg));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      if (userData.isOldUser === true || userData.requiresPasswordReset === true) {
        throw new Error("OLD_USER_DETECTED");
      }
    }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, finalEmail, password);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      const wrongPassError = new Error("WRONG_PASSWORD");
      wrongPassError.email = finalEmail;
      throw wrongPassError;
    }
    throw error;
  }
};

// ==========================================
// 2. Register User Function 🎯 (Fixed Supported Data Issue)
// ==========================================
export const registerUser = async (userData) => {
  // 🛡️ photoFile (Raw File Object) එක මෙතනින් වෙන් කරලා ගන්නවා 
  // එතකොට extraData එක ඇතුළට File object එක ගිහින් Firestore crash වෙන්නේ නැහැ.
  const { email, password, photoFile, ...extraData } = userData;

  try {
    // I. Firebase Auth එකේ එකවුන්ට් එක හදනවා (Strings විදිහට පාස් වේ)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 💡 දැනට photo upload logic එකක් නැති නිසා default profile pic URL එකක් දෙනවා
    const defaultPhotoURL = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

    // II. Firestore එකේ users collection එක ඇතුළේ දත්ත සේව් කරනවා
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      role: 'student', // Default role එක student විදිහට සෙට් වේ
      photoURL: defaultPhotoURL,
      createdAt: new Date().toISOString(),
      requiresPasswordReset: false, 
      ...extraData // firstName, lastName, regNumber, mobile, department, batch ටික මෙතනට වදී
    });

    return user;
  } catch (error) {
    throw error;
  }
};

// ==========================================
// 3. Reset Password Function
// ==========================================
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error("USER_NOT_FOUND");
    }
    throw error;
  }
};

// ==========================================
// 4. Logout User Function
// ==========================================
export const logoutUser = async () => {
  try {
    await auth.signOut();
    return true;
  } catch (error) {
    throw error;
  }
};