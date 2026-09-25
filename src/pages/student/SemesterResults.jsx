import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getExamResultsOptimized, getExamSemestersOptimized } from '../../services/firestore'
import { validateIndexNo } from '../../utils/examResults'
import { ArrowLeft, Search, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const BATCHES = ['20/21', '21/22', '22/23', '23/24', '24/25', '25/26'];

const SEMESTER_LABELS = {
  '11': 'Year I Semester I',
  '12': 'Year I Semester II',
  '21': 'Year II Semester I',
  '22': 'Year II Semester II',
  '31': 'Year III Semester I',
  '32': 'Year III Semester II',
  '41': 'Year IV Semester I',
  '42': 'Year IV Semester II',
};

function getSemesterLabel(code) {
  return SEMESTER_LABELS[code] || code;
}

export default function SemesterResults() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [indexNo, setIndexNo] = useState('');
  const [batch, setBatch] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [studentName, setStudentName] = useState('');

  const userDept = (userData?.department || '').toLowerCase();

  const fetchSemesters = useCallback(async () => {
    const normalizedIndex = indexNo.trim().toUpperCase();
    
    if (!normalizedIndex || !batch) {
      setAvailableSemesters([]);
      setSemester('');
      return;
    }
    
    if (!validateIndexNo(normalizedIndex, userDept)) {
      setAvailableSemesters([]);
      setSemester('');
      return;
    }
    
    setLoadingSemesters(true);
    try {
      const semesters = await getExamSemestersOptimized(normalizedIndex, userDept, batch);
      setAvailableSemesters(semesters);
      
      // Menggunakan state sadurunge (prev) supaya ora perlu masang 'semester' ing dependensi array
      setSemester(prev => {
        if (semesters.length > 0 && !prev) {
          return semesters[0].id; 
        } else if (prev && !semesters.some(s => s.id === prev)) {
          return ''; 
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to fetch semesters:', err);
      setAvailableSemesters([]);
    } finally {
      setLoadingSemesters(false);
    }
  }, [indexNo, batch, userDept]); // 'semester' dibusak saka kene kanggo mungkasi infinite loop

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    
    const normalizedIndex = indexNo.trim().toUpperCase();
    
    if (!validateIndexNo(normalizedIndex, userDept)) {
      const format = userDept === 'bms' ? 'XX/MS/XXXX' : 'XX/CS/XXXX';
      setError(`Invalid Index Number format. Expected: ${format} (e.g., 22/${userDept === 'bms' ? 'ms' : 'cs'}/0001)`);
      return;
    }
    
    if (!batch) {
      setError('Please select a batch');
      return;
    }
    
    if (!semester) {
      setError('Please select a semester');
      return;
    }
    
    setLoading(true);
    try {
      const rawResults = await getExamResultsOptimized(normalizedIndex, userDept, batch, semester);
      
      if (rawResults.length === 0) {
        setError('No examination results found for this index number, batch, and semester.');
        setResults([]);
        setStudentName('');
        return;
      }
      
      const firstResult = rawResults[0];
      if (firstResult.studentName) {
        setStudentName(firstResult.studentName);
      }
      
      const finalResults = rawResults
        .map(r => ({
          ...r,
          subjectName: r.subjectName || r.subjectCode,
        }))
        .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
      
      setResults(finalResults);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <button 
        onClick={() => navigate('/dashboard')} 
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition group"
      >
        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="card p-6 space-y-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Examination Results</h1>
          <p className="text-sm text-gray-500 mt-1">View results for a specific semester</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Index Number</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={indexNo}
                  onChange={(e) => setIndexNo(e.target.value.toUpperCase())}
                  placeholder={userDept === 'bms' ? '22/MS/0001' : '22/CS/0001'}
                  className="input-field !pl-10"
                  required
                  maxLength={12}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Format: XX/{userDept === 'bms' ? 'MS' : 'CS'}/XXXX</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="select-field w-full"
                required
              >
                <option value="">Select Batch</option>
                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="select-field w-full"
                disabled={loadingSemesters || availableSemesters.length === 0}
                required
              >
                <option value="">Select Semester</option>
                {loadingSemesters && <option value="" disabled>Loading...</option>}
                {availableSemesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                {availableSemesters.length === 0 && !loadingSemesters && batch && indexNo && (
                  <option value="" disabled>No semesters found</option>
                )}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || loadingSemesters || availableSemesters.length === 0}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : loadingSemesters ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading semesters...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                View Results
              </>
            )}
          </button>
        </form>

        {error && !results.length && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Results for {indexNo}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {studentName ? <span className="font-medium text-gray-900">{studentName}</span> : 'Student Name: N/A'}
                  <span className="mx-2">|</span>
                  {userDept.toUpperCase()} | Batch {batch} | Semester {getSemesterLabel(semester)} | {results.length} subject(s)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-3 text-left font-semibold text-gray-600 w-10">#</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-600">Subject Code</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-600">Subject Name</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-600 w-24">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r, i) => {
                    const gradeClass = r.grade.startsWith('A') ? 'bg-green-100 text-green-800' : 
                                       r.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                       r.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                                       r.grade.startsWith('D') ? 'bg-orange-100 text-orange-800' :
                                       r.grade === 'AB' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
                    return (
                      <tr key={`${r.subjectCode}-${i}`} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-3 font-mono text-gray-900">{r.subjectCode}</td>
                        <td className="px-3 py-3 text-gray-700">{r.subjectName}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${gradeClass}`}>
                            {r.grade === 'AB' ? 'AB' : r.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Only the highest grade is displayed for each subject (repeat attempts with lower grades are excluded).</li>
                  <li><strong>AB</strong> indicates the student was absent for that examination.</li>
                  <li>This report is for reference only.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}