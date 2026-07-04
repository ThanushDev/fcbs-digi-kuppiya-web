import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'

export default function FirstTimeSetup() {
  const { user, userData, refreshUserData } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    const check = async () => {
      if (!user) { setStatus('need_login'); return }
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'super_admin')))
      if (!snap.empty) return setStatus('done')
      const setupDoc = await getDoc(doc(db, 'settings', 'setup'))
      if (setupDoc.exists() && setupDoc.data().completed) return setStatus('done')
      setStatus('ready')
    }
    check()
  }, [user])

  const handleSetup = async () => {
    setError('')
    try {
      await setDoc(doc(db, 'settings', 'setup'), { completed: false, startedAt: serverTimestamp() })
      await setDoc(doc(db, 'users', user.uid), { role: 'super_admin' }, { merge: true })
      await setDoc(doc(db, 'settings', 'setup'), { completed: true }, { merge: true })
      await refreshUserData()
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#141726] p-8 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-600/20 text-3xl">
          ⚙
        </div>
        <h1 className="text-xl font-bold text-white">First-Time Setup</h1>

        {status === 'checking' && <p className="mt-4 text-sm text-gray-400">Checking setup status...</p>}

        {status === 'need_login' && (
          <>
            <p className="mt-4 text-sm text-gray-400">You must be logged in to set up the application.</p>
            <button onClick={() => navigate('/register')}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-[#6a11cb] to-[#2575fc] py-2.5 font-semibold text-white shadow-lg transition hover:translate-y-[-1px]">
              Register First
            </button>
          </>
        )}

        {status === 'done' && (
          <>
            <p className="mt-4 text-sm text-green-400">Setup has already been completed.</p>
            <button onClick={() => navigate('/login')}
              className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-500 transition">
              Go to Login
            </button>
          </>
        )}

        {status === 'ready' && (
          <>
            <p className="mt-4 text-sm text-gray-400">
              No super admin exists. As the first user, you can claim the <span className="text-amber-400 font-semibold">Super Admin</span> role to gain full access to the system.
            </p>
            {error && <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">{error}</div>}
            <button onClick={handleSetup}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 py-2.5 font-semibold text-white shadow-lg transition hover:translate-y-[-1px]">
              Claim Super Admin Role
            </button>
            <p className="mt-4 text-xs text-gray-500">This action is irreversible and will grant you full administrative access.</p>
          </>
        )}
      </div>
    </div>
  )
}
