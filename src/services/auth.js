import { auth, db } from './firebase'; // 🎯 ඔයාගේ firebase setup එකට අනුව path එක බලන්න
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

// 1. Login User Function
export const loginUser = async (emailOrReg, password) => {
  let finalEmail = emailOrReg;

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

// 2. Register User Function 🎯 (අලුතින් ඇතුළත් කළා)
export const registerUser = async (email, password, extraData = {}) => {
  try {
    // Firebase Auth එකේ එකවුන්ට් එක හදනවා
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore එකේ users collection එක ඇතුළේ යූසර්ගේ ඩේටා ටික සේව් කරනවා
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      role: 'student', // Default role එක student විදිහට සෙට් වෙනවා
      createdAt: new Date().toISOString(),
      requiresPasswordReset: false, // අලුත් යූසර්ස්ලාට මේක false
      ...extraData // ඉතිරි විස්තර (firstName, lastName, regNumber වගේ ඒවා)
    });

    return user;
  } catch (error) {
    throw error;
  }
};

// 3. Reset Password Function
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

// 4. Logout User Function
export const logoutUser = async () => {
  try {
    await auth.signOut();
    return true;
  } catch (error) {
    throw error;
  }
};