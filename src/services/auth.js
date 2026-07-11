import { auth, db } from './firebase'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

// 🎯 Vercel / Vite එකෙන් Variables කියවගන්නේ මෙහෙමයි
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Cloudinary Helper Function
const uploadImageToCloudinary = async (file) => {
  if (!CLOUD_NAME) {
    console.warn("Cloudinary Cloud Name is missing in environment variables. Using default photo.");
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Cloudinary upload failed');
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary error:", error);
    return null;
  }
};

// ==========================================
// 1. Login User Function
// ==========================================
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

// ==========================================
// 2. Register User Function (Fixed Upload Issue)
// ==========================================
export const registerUser = async (userData) => {
  const { email, password, photoFile, ...extraData } = userData;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Default image එකක් මුලින් සෙට් කරනවා
    let finalPhotoURL = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; 
    
    // යූසර් ඉමේජ් එකක් තෝරලා තියෙනවා නම් ඒක Cloudinary එකට අප්ලෝඩ් කරනවා
    if (photoFile) {
      const uploadedUrl = await uploadImageToCloudinary(photoFile);
      if (uploadedUrl) {
        finalPhotoURL = uploadedUrl;
      }
    }

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      role: 'student', 
      photoURL: finalPhotoURL,
      profile_pic: finalPhotoURL, 
      createdAt: new Date().toISOString(),
      requiresPasswordReset: false, 
      ...extraData 
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