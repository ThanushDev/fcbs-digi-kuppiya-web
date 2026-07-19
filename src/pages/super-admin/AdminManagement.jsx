import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { db, firebaseConfig } from '../../services/firebase' 
import { useAuth } from '../../contexts/AuthContext'
import { ShieldAlert, Sparkles, Key, Trash2, UserCog } from 'lucide-react'

export default function AdminManagement() {
  const { userData } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  
  // State for creating new admin
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if current user is super_admin
  const isSuperAdmin = userData?.role === 'super_admin'

  const loadAdmins = async () => {
    try {
      setLoading(true)
      // Load both admins and super admins
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

  // Super Admin creates a new admin in Auth + Firestore
  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    if (!email || !password || !firstName || !lastName) return alert('Please fill in all details!')
    if (password.length < 6) return alert('Password must be at least 6 characters!')
    if (!confirm('Are you sure you want to create this new admin account?')) return

    let secondaryApp;
    try {
      setIsSubmitting(true)
      // Create temporary Firebase app to avoid logging out the super admin
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp')
      const secondaryAuth = getAuth(secondaryApp)

      // a. Create new admin in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
      const newAdminUid = userCredential.user.uid

      // b. Save admin data to Firestore 'users' collection
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

      alert('New admin account created successfully!')
      setEmail('')
      setPassword('')
      setFirstName('')
      setLastName('')
      loadAdmins()
    } catch (error) {
      console.error("Error creating admin:", error)
      alert(`Error occurred: ${error.message}`)
    } finally {
      setIsSubmitting(false)
      // Clean up temporary app to free memory
      if (secondaryApp) {
        await deleteApp(secondaryApp)
      }
    }
  }

  // Delete an admin from the system
  const handleDeleteAdmin = async (uid, role) => {
    if (role === 'super_admin') return alert('Cannot delete a Super Admin!')
    if (!confirm('Are you sure you want to permanently delete this admin from Firestore?')) return
    
    try {
      await deleteDoc(doc(db, 'users', uid))
      alert('Admin account removed successfully.')
      loadAdmins()
    } catch (error) {
      alert('Failed to remove admin.')
    }
  }

  // Show Access Denied if not Super Admin
  if (!isSuperAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-4">
        <ShieldAlert className="w-10 h-10 text-red-400 mb-2" />
        <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          This page is restricted to Super Admin only. Regular admins cannot access this section.
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

      {/* Add New Admin Form */}
      <div className="card">
        <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 inline" /> Create New Admin Account
        </h2>
        
        <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">First Name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
              placeholder="Ex: Thanush"
              className="input-field" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Last Name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required
              placeholder="Ex: Nethsika"
              className="input-field" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="admin@uniflow.com"
              className="input-field" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="******" minLength={6}
              className="input-field" />
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button type="submit" disabled={isSubmitting}
              className="btn-primary w-full md:w-auto">
              {isSubmitting ? 'Creating Account...' : 'Register Admin Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Current Admins List */}
      <div>
        <h2 className="mb-4 text-base font-bold text-gray-800">Current Admins List ({admins.length})</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading admin data...</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No administrators found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between card">
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold ${
                    a.role === 'super_admin' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-gray-900'
                  }`}>
                    {a.role === 'super_admin' ? <Key className="w-4 h-4" /> : <UserCog className="w-4 h-4" />}
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
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Remove
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
