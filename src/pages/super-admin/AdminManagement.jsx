import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { db, firebaseConfig } from '../../services/firebase' 
import { useAuth } from '../../contexts/AuthContext'

export default function AdminManagement() {
  const { userData } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 📝 අලුත් Admin කෙනෙක් හදන්න අවශ්‍ය ස්ටේට්ස්
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 🛡️ Super Admin ද කියලා චෙක් කරනවා (Role එක 'super_admin' ලෙස)
  const isSuperAdmin = userData?.role === 'super_admin'

  const loadAdmins = async () => {
    try {
      setLoading(true)
      // Adminsලා සහ Super Adminsලා දෙගොල්ලන්වම ලයිස්තුවට ගන්නවා
      const adminQuery = query(collection(db, 'users'), where('role', 'in', ['admin', 'super_admin']))
      const adminSnap = await getDocs(adminQuery)
      setAdmins(adminSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (error) {
      console.error("Error loading admins:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins()
    }
  }, [isSuperAdmin])

  // ➕ Super Admin විසින් අලුත් ඇඩ්මින් කෙනෙක්ව Auth + Firestore වල ක්‍රියේට් කිරීම
  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    if (!email || !password || !firstName || !lastName) return alert('කරුණාකර සියලුම විස්තර ඇතුලත් කරන්න මචං!')
    if (password.length < 6) return alert('Password එකට අවමංගතව අකුරු/ඉලක්කම් 6ක්වත් ඕනේ!')
    if (!confirm('මෙම නව Admin ගිණුම සෑදීමට ඔබට ස්ථිරද?')) return

    let secondaryApp;
    try {
      setIsSubmitting(true)
      // Super Admin ව logout වීම වැලැක්වීමට තාවකාලික Firebase App එකක් හදනවා
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp')
      const secondaryAuth = getAuth(secondaryApp)

      // a. Firebase Auth එකේ අලුත් ඇඩ්මින්ව හදනවා
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
      const newAdminUid = userCredential.user.uid

      // b. Firestore 'users' කලෙක්ෂන් එකට ඇඩ්මින්ගේ ඩේටා දානවා (Role එක 'admin' ලෙස)
      await setDoc(doc(db, 'users', newAdminUid), {
        uid: newAdminUid,
        firstName,
        lastName,
        email,
        role: 'admin', 
        batch: 'Admin Staff',
        department: 'Management',
        quizEnabled: true,
        createdAt: new Date().toISOString()
      })

      alert('නව Admin ගිණුම සාර්ථකව සාදන ලදී! 🎉')
      setEmail('')
      setPassword('')
      setFirstName('')
      setLastName('')
      loadAdmins()
    } catch (error) {
      console.error("Error creating admin:", error)
      alert(`ගැටළුවක් ඇති වුණා: ${error.message}`)
    } finally {
      setIsSubmitting(false)
      // වැඩේ ඉවර වුණාම තාවකාලික ඇප් එක ඩිලීට් කරනවා memory clear වෙන්න
      if (secondaryApp) {
        await deleteApp(secondaryApp)
      }
    }
  }

  // ❌ ඇඩ්මින් කෙනෙක්ව සම්පූර්ණයෙන්ම පද්ධතියෙන් ඉවත් කිරීම
  const handleDeleteAdmin = async (uid, role) => {
    if (role === 'super_admin') return alert('Super Admin කෙනෙක්ව අයින් කරන්න බැහැ මචං!')
    if (!confirm('මෙම Admin ගිණුම Firestore එකෙන් සම්පූර්ණයෙන්ම මකා දැමීමට අවශ්‍යද?')) return
    
    try {
      await deleteDoc(doc(db, 'users', uid))
      alert('ඇඩ්මින් ගිණුම සාර්ථකව ඉවත් කළා.')
      loadAdmins()
    } catch (error) {
      alert('ඉවත් කිරීමට නොහැකි වුණා.')
    }
  }

  // 🚫 Super Admin නොවන කෙනෙක් මේ පිටුවට ආවොත් Access Denied පෙන්වනවා
  if (!isSuperAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-4">
        <div className="text-4xl mb-2">🚫</div>
        <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          මෙම පිටුවට පිවිසීමට හැක්කේ **Super Admin** හට පමණි. සාමාන්‍ය Adminවරුන්ට මෙම කොටස තහනම් වේ.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-1 sm:p-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">Create and manage administrative accounts securely.</p>
      </div>

      {/* 🛠️ Add New Admin Form */}
      <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-orange-50/20 p-5 md:p-6 shadow-sm">
        <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          ✨ Create New Admin Account
        </h2>
        
        <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">First Name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
              placeholder="Ex: Thanush"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500 transition shadow-inner" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Last Name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required
              placeholder="Ex: Nethsika"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500 transition shadow-inner" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="admin@uniflow.com"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500 transition shadow-inner" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="******" minLength={6}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500 transition shadow-inner" />
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button type="submit" disabled={isSubmitting}
              className="w-full md:w-auto rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 transition shadow-md">
              {isSubmitting ? 'Creating Account...' : 'Register Admin Account 🚀'}
            </button>
          </div>
        </form>
      </div>

      {/* 👥 Current Admins List */}
      <div>
        <h2 className="mb-4 text-base font-bold text-gray-800">Current Admins List ({admins.length})</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading admin data...</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No administrators found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-gray-100/50 p-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold ${
                    a.role === 'super_admin' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-gray-900'
                  }`}>
                    {a.role === 'super_admin' ? '🔑' : 'Staff'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">{a.firstName} {a.lastName}</p>
                      {a.role === 'super_admin' && (
                        <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-200">SUPER</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{a.email}</p>
                  </div>
                </div>
                
                {a.role !== 'super_admin' && (
                  <button onClick={() => handleDeleteAdmin(a.id, a.role)}
                    className="rounded-xl bg-red-50 text-red-600 border border-red-200/60 px-3 py-1.5 text-xs font-bold hover:bg-red-100/80 transition">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}