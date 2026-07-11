import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore' // 👈 මෙන්න මේ නිවැරදි එක විතරයි ඕනේ මචං!
import { auth, db } from '../services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔄 refreshUserData Logic
  const refreshUserData = useCallback(async (uid) => {
    const currentUid = uid || auth.currentUser?.uid
    if (!currentUid) return

    try {
      const docRef = doc(db, 'users', currentUid)
      const docSnap = await getDoc(docRef)
      setUserData(docSnap.exists() ? docSnap.data() : null)
    } catch (error) {
      setUserData(null)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const docRef = doc(db, 'users', firebaseUser.uid)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            setUserData(docSnap.data())
          } else {
            setUserData(null)
          }
          setUser(firebaseUser)
        } else {
          setUser(null)
          setUserData(null)
        }
      } catch (error) {
        // Errors නිහඬව හැන්ඩ්ල් කර ඇත
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  // 👥 Roles සහ Profile Setup Logic
  const role = userData?.role || 'guest'
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isSuperAdmin = role === 'super_admin'
  
  // 🛡️ Profile Check Logic
  const userPhoto = userData?.photoURL || userData?.profilePic || userData?.profile_pic
  const isPhotoBrokenOrMissing = !userPhoto || String(userPhoto).includes('profile_')

  const needsProfileSetup = !!user && role === 'student' && (
    isPhotoBrokenOrMissing || 
    !userData?.regNumber || 
    userData?.regNumber.trim() === "" || 
    !userData?.department || 
    userData?.department.trim() === ""
  )

  return (
    <div className="w-full">
      <AuthContext.Provider value={{ user, userData, loading, role, isAdmin, isSuperAdmin, needsProfileSetup, refreshUserData }}>
        {!loading && children}
      </AuthContext.Provider>
    </div>
  )
}

export const useAuth = () => useContext(AuthContext)