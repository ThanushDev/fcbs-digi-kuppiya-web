import { auth, db } from './firebase'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

export const registerUser = async (userData) => {
  if (!userData) throw new Error("No user data provided");
  const { email, password, photoFile, mobile, regNumber, firstName, lastName, department, batch, ...extraData } = userData;

  const requiredFields = [
    { key: 'firstName', value: firstName, label: 'First Name' },
    { key: 'lastName', value: lastName, label: 'Last Name' },
    { key: 'email', value: email, label: 'Email Address' },
    { key: 'mobile', value: mobile, label: 'Mobile Number' },
    { key: 'regNumber', value: regNumber, label: 'Registration Number' },
    { key: 'department', value: department, label: 'Department' },
    { key: 'batch', value: batch, label: 'Batch' },
    { key: 'password', value: password, label: 'Password' },
    { key: 'photoFile', value: photoFile, label: 'Profile Photo' }
  ]

  for (const field of requiredFields) {
    if (!field.value || (typeof field.value === 'string' && !field.value.trim())) {
      throw new Error(`${field.label} is required`)
    }
  }

  const usersRef = collection(db, "users");

  const emailQuery = query(usersRef, where("email", "==", email));
  const emailSnap = await getDocs(emailQuery);
  if (!emailSnap.empty) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  if (mobile) {
    const mobileQuery = query(usersRef, where("mobile", "==", mobile));
    const mobileSnap = await getDocs(mobileQuery);
    if (!mobileSnap.empty) {
      throw new Error("MOBILE_ALREADY_EXISTS");
    }
  }

  if (regNumber) {
    const regQuery = query(usersRef, where("regNumber", "==", regNumber));
    const regSnap = await getDocs(regQuery);
    if (!regSnap.empty) {
      throw new Error("REG_NUMBER_ALREADY_EXISTS");
    }
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const uploadedUrl = await uploadImageToCloudinary(photoFile);
    if (!uploadedUrl) {
      throw new Error("Failed to upload profile photo. Please try again.");
    }

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      role: 'student',
      photoURL: uploadedUrl,
      profile_pic: uploadedUrl,
      createdAt: new Date().toISOString(),
      requiresPasswordReset: false,
      hasValidFace: userData.hasValidFace !== undefined ? userData.hasValidFace : true,
      ...extraData
    });

    return user;
  } catch (error) {
    throw error;
  }
};

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

export const logoutUser = async () => {
  try {
    await auth.signOut();
    return true;
  } catch (error) {
    throw error;
  }
};