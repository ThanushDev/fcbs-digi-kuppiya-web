import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { DEPARTMENTS, BATCHES } from '../utils/constants';

export default function CompleteProfileModal({ user }) {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    regNumber: user.regNumber || '',
    department: user.department || '',
    batch: user.batch || ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      alert("කරුණාකර ඔබගේ මුහුණ පැහැදිලිව පෙනෙන ඡායාරූපයක් (Face Image) ඇතුළත් කරන්න!");
      return;
    }
    if (!formData.department || !formData.regNumber) {
      alert("සියලුම ක්ෂේත්‍ර (Fields) අනිවාර්යයෙන්ම පිරවිය යුතුය!");
      return;
    }

    setLoading(true);
    try {
      // 1. 🚀 Cloudinary එකට Image එක Upload කිරීම
      const data = new FormData();
      data.append("file", image);
      data.append("upload_preset", "your_cloudinary_preset"); // ⚠️ ඔයාගේ Cloudinary Preset එක මෙතනට දාන්න
      data.append("cloud_name", "ddn08cpkt");

      const res = await fetch("https://api.cloudinary.com/v1_1/ddn08cpkt/image/upload", {
        method: "POST",
        body: data
      });
      const fileData = await res.json();
      
      // Cloudinary එකෙන් හම්බවෙන පිරිසිදු URL එක (uploads/ කෑලි නැතිව)
      const imageUrl = fileData.secure_url; 

      // 2. 🔥 Firebase Firestore එක Update කිරීම
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: imageUrl,
        profilePic: imageUrl,
        regNumber: formData.regNumber.trim(),
        department: formData.department.toLowerCase(),
        batch: formData.batch,
        profileCompleted: true // සාර්ථකව නිම කළ බවට ලකුණක්
      });

      alert("ප්‍රොෆයිල් එක සාර්ථකව යාවත්කාලීන වුණා! ඇප් එක රීලෝඩ් වෙනවා.");
      window.location.reload(); // Auth state එක අලුතින්ම ගන්න රීලෝඩ් කරනවා

    } catch (error) {
      console.error(error);
      alert("යම් දෝෂයක් සිදු වුණා! නැවත උත්සාහ කරන්න.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-fade-in animate-duration-200">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">ප්‍රොෆයිල් එක සම්පූර්ණ කරන්න</h2>
          <p className="text-xs text-gray-500 mt-1">ඇප් එක භාවිතා කිරීමට ප්‍රථම ඔබගේ අනන්‍යතාවය තහවුරු කළ යුතුය.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 📸 Face Recognition Image Upload Part */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
            {preview ? (
              <img src={preview} className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-md" alt="Face Preview" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            <label className="mt-3 cursor-pointer inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">
              <span>මුහුණ පෙනෙන පින්තූරයක් තෝරන්න</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required />
            </label>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">⚠️ Face Recognition සඳහා තොප්පි, අව්කණ්ණාඩි නොදැමූ පැහැදිලි එකක් විය යුතුය.</p>
          </div>

          {/* 🆔 Registration Number */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number (ලියාපදිංචි අංකය) *</label>
            <input 
              type="text" 
              placeholder="e.g. EU/IS/2022/XX"
              value={formData.regNumber}
              onChange={(e) => setFormData({...formData, regNumber: e.target.value})}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500" 
              required 
            />
          </div>

          {/* 🏫 Department */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department (අංශය) *</label>
            <select 
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
              required
            >
              <option value="">Select Department</option>
              {DEPARTMENTS?.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
            </select>
          </div>

          {/* 🎓 Batch */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Batch (කණ්ඩායම) *</label>
            <select 
              value={formData.batch}
              onChange={(e) => setFormData({...formData, batch: e.target.value})}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
              required
            >
              <option value="">Select Batch</option>
              {BATCHES?.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* 🚀 Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-md shadow-indigo-200"
          >
            {loading ? 'Uploading & Saving...' : 'තහවුරු කර ඇතුල් වන්න'}
          </button>

        </form>
      </div>
    </div>
  );
}