import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { DEPARTMENTS, BATCHES } from '../utils/constants';
import { AlertTriangle } from 'lucide-react';

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
      alert("Please upload a clear photograph of your face!");
      return;
    }
    if (!formData.department || !formData.regNumber) {
      alert("All fields are required!");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload image to Cloudinary
      const data = new FormData();
      data.append("file", image);
      data.append("upload_preset", "your_cloudinary_preset"); // Replace with your Cloudinary preset
      data.append("cloud_name", "ddn08cpkt");

      const res = await fetch("https://api.cloudinary.com/v1_1/ddn08cpkt/image/upload", {
        method: "POST",
        body: data
      });
      const fileData = await res.json();
      
      const imageUrl = fileData.secure_url; 

      // 2. Update Firebase Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: imageUrl,
        profilePic: imageUrl,
        regNumber: formData.regNumber.trim(),
        department: formData.department.toLowerCase(),
        batch: formData.batch,
        profileCompleted: true
      });

      alert("Profile updated successfully! The app will reload.");
      window.location.reload();

    } catch (error) {
      console.error(error);
      alert("An error occurred! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-6 animate-fade-in animate-duration-200">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="text-xs text-gray-500 mt-1">Please verify your identity before using the app.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Face Image Upload */}
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
              <span>Choose a clear face photo</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required />
            </label>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center"><AlertTriangle className="w-4 h-4 inline text-amber-500" /> Must be a clear photo without hats or sunglasses for face recognition.</p>
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number *</label>
            <input 
              type="text" 
              placeholder="e.g. EU/IS/2022/XX"
              value={formData.regNumber}
              onChange={(e) => setFormData({...formData, regNumber: e.target.value})}
              className="input-field" 
              required 
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
            <select 
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="select-field"
              required
            >
              <option value="">Select Department</option>
              {DEPARTMENTS?.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
            </select>
          </div>

          {/* Batch */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Batch *</label>
            <select 
              value={formData.batch}
              onChange={(e) => setFormData({...formData, batch: e.target.value})}
              className="select-field"
              required
            >
              <option value="">Select Batch</option>
              {BATCHES?.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Uploading & Saving...' : 'Confirm & Enter'}
          </button>

        </form>
      </div>
    </div>
  );
}
