import { useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getExamResults } from '../../services/firestore'
import { getHighestGrade, validateIndexNo } from '../../utils/examResults'
import { ArrowLeft, Search, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Subject code to name mapping (from GPA calculators)
const SUBJECT_NAME_MAP = {
  // BMS Common
  'BMT 1013': 'Principle of Management',
  'BMT 1023': 'Introduction to Information Technology',
  'BMT 1033': 'Business Mathematics',
  'BMT 1043': 'Business English I',
  'BMT 1053': 'Micro Economics',
  'NCC 1010': 'Basic Tamil/Sinhala I',
  'AFM 1013': 'Financial Accounting',
  'HRM 1013': 'Human Resource Management',
  'MKT 1013': 'Marketing Management',
  'BMT 1063': 'Business Statistics',
  'BMT 1073': 'Business English II',
  'NCC 1030': 'Basic Tamil II /Sinhala II',
  'BMT 2013': 'Macro Economics',
  'AFM 2013': 'Cost and Management Accounting',
  'BMT 2023': 'Management Information System',
  'BMT 2033': 'Business Skills I',
  'BMT 2043': 'Business Law',
  'NCC 2010': 'Career Guidance',
  'BMT 2053': 'Operations Management',
  'AFM 2023': 'Financial Management',
  'BMT 2063': 'Business Skills II',
  'BMT 2073': 'Enterprenurship and Innovation',
  'BMT 2082': 'Fundamental Sociology and Psychology',
  'BMT 2091': 'Peace and Social Harmony',
  'NCC 2020': 'Basic Science',
  // BMS Specializations
  'BMT 3013': 'Organizational Behavior',
  'BMT 3023': 'Operrational Reserch',
  'BMT 3033': 'Total Quality Management',
  'BMT 3043': 'Organizational Development',
  'BMT 3053': 'Micro Finance',
  'BMT 3063': 'Project Management',
  'BMT 3073': 'Managerial Economics',
  'BMT 3083': 'Reserch Methods',
  'BMT 3093': 'Strategic Management',
  'BMT 3113': 'Disaster Management',
  'BMT 3123': 'Labor Law and Relations',
  'BMT 3133': 'Contempory Issues in Management',
  'BMT 4013': 'Computer Based Data Analysis',
  'BMT 4023': 'Development Economics',
  'BMT 4033': 'Service Management',
  'BMT 4043': 'International Business',
  'BMT 4053': 'E-Commerce',
  'BMT 4076': 'Reserch',
  'BMT 4083': 'Internship',
  'HRM 3013': 'Organizational Behavior',
  'HRM 3023': 'Operrational Reserch',
  'HRM 3033': 'Organizational Development',
  'HRM 3043': 'Performance Appraisal',
  'HRM 3053': 'Human Resource Planning',
  'HRM 3063': 'Project Management',
  'HRM 3073': 'Managerial Economics',
  'HRM 3083': 'Reserch Methods',
  'HRM 3093': 'Strategic Management',
  'HRM 3123': 'Labor Law and Relations',
  'HRM 3113': 'Human Resource Development',
  'HRM 4013': 'Computer Based Data Analysis',
  'HRM 4023': 'Development Economics',
  'HRM 4033': 'Strategic Human Resource Management',
  'HRM 4043': 'International Human Resource Management',
  'HRM 4053': 'Human Resource Information Systems',
  'HRM 4063': 'Human Resource Accounting',
  'HRM 4076': 'Reserch',
  'HRM 4083': 'Internship',
  'AFM 3033': 'Micro Finance',
  'AFM 3043': 'Investment and Portfolio Management',
  'AFM 3053': 'Advanced Financial Accounting',
  'AFM 3103': 'Auditing',
  'AFM 3113': 'Computer Based Accounting',
  'AFM 4013': 'Computer Based Data Analysis',
  'AFM 4023': 'Development Economics',
  'AFM 4033': 'Taxation',
  'AFM 4043': 'Advanced Accounting Theory',
  'AFM 4053': 'Public Sector Accounting',
  'AFM 4063': 'Financial Reporting',
  'AFM 4076': 'Reserch',
  'AFM 4083': 'Internship',
  'MMT 3013': 'Organizational Behavior',
  'MMT 3023': 'Operrational Reserch',
  'MMT 3033': 'Service Marketing',
  'MMT 3043': 'Sales Management and Retail Marketing',
  'MMT 3053': 'Marketing Research',
  'MMT 3063': 'Project Management',
  'MMT 3073': 'Managerial Economics',
  'MMT 3083': 'Reserch Methods',
  'MMT 3093': 'Strategic Management',
  'MMT 3103': 'Consumer Behavior',
  'MMT 3113': 'Intergrated Marketing Communication',
  'MMT 4013': 'Computer Based Data Analysis',
  'MMT 4023': 'Development Economics',
  'MMT 4033': 'E Marketing',
  'MMT 4043': 'Strategic Marketing',
  'MMT 4053': 'International Marketing',
  'MMT 4063': 'Brand Management',
  'MMT 4076': 'Reserch',
  'MMT 4083': 'Internship',
  'IMT 3013': 'Organizational Behavior',
  'IMT 3023': 'Operrational Reserch',
  'IMT 3033': 'Programming Concept',
  'IMT 3043': 'Systems Analaysis and Design',
  'IMT 3053': 'Data Communication and Computer Networks',
  'IMT 3063': 'Project Management',
  'IMT 3073': 'Managerial Economics',
  'IMT 3083': 'Reserch Methods',
  'IMT 3093': 'Strategic Management',
  'IMT 3103': 'Professional Ethics and Responsibility',
  'IMT 3113': 'Software Engineering',
  'IMT 4013': 'Computer Based Data Analysis',
  'IMT 4023': 'Object Oriented Programming',
  'IMT 4033': 'Web Development',
  'IMT 4043': 'Enterprise Resource Planning System',
  'IMT 4053': 'Software Quality Assuarance',
  'IMT 4063': 'Database Management Systems',
  'IMT 4076': 'Reserch',
  'IMT 4083': 'Internship',
  // LCS Common
  'LANG-1013/1023': 'Basic Sinhala/Tamil',
  'LANG-1033': 'Basic Reading & Grammar',
  'GENR-1013': 'Sri Lankan Studies',
  'COMM-1013': 'Introduction to Communication Studies',
  'ITEC-1013': 'Computer Literacy & Application',
  'LANG-1043': 'Basic Writing & Speech',
  'LANG-1053': 'Introduction to Literature',
  'COMM-1023': 'Communication & Persuasion',
  'LANG-1013': 'Introduction to Language & Linguistics',
  'GENR-1023': 'Basic Mathematics',
  // LCS Communication
  'COMM-2053': 'Introduction to Interpersonal Communication',
  'COMM-2063': 'Introduction to Organizational Communication',
  'LANG-2063': 'General English III',
  'COMM-2033': 'Mass Communication & Society',
  'COMM-2043': 'Communication Theories & Media Literacy',
  'COMM-2083': 'Instructional Media',
  'COMM-2093': 'Development Communication',
  'COMM-2103': 'Communication, Gender and Society',
  'LANG-2113': 'General English IV',
  'COMM-2073': 'Writing For Media',
  'COMM-3113': 'Culture & Communication',
  'COMM-3123': 'Communication & Conflict Management',
  'COMM-3133': 'Film & Television',
  'COMM-3143': 'Introduction to Folk Media',
  'ITEC-3033': 'Desktop Publishing',
  'COMM-3153': 'Print Media',
  'COMM-3163': 'Beginning Video Production',
  'COMM-3173': 'Critical Media Theories',
  'COMM-3183': 'Advertising',
  'GENR-3043': 'Independent Study',
  'COMM-4203': 'Advanced Video Production',
  'COMM-4213': 'Managing Media Institutions',
  'ITEC-4053': 'Animation Techniques',
  'COMM-4223': 'Semiotics',
  'GENR-4053': 'Research Methodology',
  'COMM-4233': 'Asian Cinema',
  'COMM-4243': 'Journalism Practicum (Internship)',
  'COMM-4253': 'Media Ethics',
  'GENR-4063': 'Research Report',
  // LCS Languages
  'LANG-2073': 'Introductory Phonetics',
  'LANG-2083': 'Advanced Reading & Grammar',
  'LANG-2093': 'Advanced Writing & Speech',
  'LANG-2103': 'Communication Theories & Media Literacy',
  'LANG-2123': 'Sri Lankan Literature',
  'LANG-2133': 'Introduction to Fiction',
  'LANG-2143': 'Introduction to Western Culture',
  'LANG-2153': 'Creative Writing',
  'LANG-3163': 'Commonwealth Literature',
  'LANG-3173': 'Modern Drama',
  'LANG-3183': 'Practical Criticism',
  'LING-3113': 'Linguistics Principles of Translation',
  'LANG-3193': 'Varieties of English',
  'LANG-3203': 'Modern Literature',
  'LANG-3143': 'Discourse Analysis',
  'GENR-3033': 'Basic Counseling',
  'LANG-4233': 'Phonology',
  'LANG-4243': 'Morphology',
  'LANG-4253': 'Classical Drama',
  'GENR-4243': 'American Literature',
  'LANG-4213': 'English Language Teaching',
  'LANG-4223': 'Stylistics',
  'LANG-4273': "Women's Writing in English",
  'LANG-4283': 'Grammar & Syntax',
  'LANG-4293': 'Internship',
  'GENR-4056': 'Dissertation',
};

const BATCHES = ['20/21', '21/22', '22/23', '23/24', '24/25', '25/26'];

function normalizeSubjectCode(code) {
  return code.trim().toUpperCase().replace(/\s+/g, ' ');
}

export default function CumulativeReport() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [indexNo, setIndexNo] = useState('');
  const [batch, setBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');

  const userDept = (userData?.department || '').toLowerCase();

  const handleSearch = useCallback(async (e) => {
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
    
    setLoading(true);
    try {
      // Fetch ALL results without semester filter
      const rawResults = await getExamResults(normalizedIndex, userDept, batch);
      
      if (rawResults.length === 0) {
        setError('No examination results found for this index number and batch.');
        setResults([]);
        setStudentName('');
        return;
      }
      
      // Extract student name from first result
      const firstResult = rawResults[0];
      if (firstResult.studentName) {
        setStudentName(firstResult.studentName);
      }
      
      // Group by subjectCode across ALL semesters - keep highest grade
      const grouped = {};
      for (const r of rawResults) {
        const code = normalizeSubjectCode(r.subjectCode);
        const existing = grouped[code];
        const currentGrade = getHighestGrade([r.grade]);
        const existingGrade = existing ? getHighestGrade([existing.grade]) : null;
        
        if (!existingGrade || (currentGrade && getHighestGrade([currentGrade, existingGrade]) === currentGrade)) {
          grouped[code] = { ...r, subjectCode: code };
        }
      }
      
      const finalResults = Object.values(grouped).map(r => ({
        ...r,
        subjectName: SUBJECT_NAME_MAP[r.subjectCode] || r.subjectCode,
      })).sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
      
      setResults(finalResults);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [indexNo, batch, userDept]);

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
          <h1 className="text-2xl font-bold text-gray-900">Result Report</h1>
          <p className="text-sm text-gray-500 mt-1">Complete academic history with highest grade retention</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <p className="mt-1 text-xs text-gray-400">Format: XX/${userDept === 'bms' ? 'MS' : 'CS'}/XXXX</p>
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
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                View Result Report
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
                <h2 className="text-lg font-bold text-gray-900">Result Report for {indexNo}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {studentName ? <span className="font-medium text-gray-900">{studentName}</span> : 'Student Name: N/A'}
                  <span className="mx-2">|</span>
                  {userDept.toUpperCase()} | Batch {batch} | {results.length} subject(s) across all semesters
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
                    <th className="px-3 py-3 text-center font-semibold text-gray-600 w-24">Highest Grade</th>
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

            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="text-sm text-emerald-800">
                <p className="font-medium mb-1">Report Logic:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Shows <strong>highest grade achieved</strong> for each subject across all semesters (repeats resolved).</li>
                  <li><strong>AB</strong> indicates the student was absent for that examination in all attempts.</li>
                  <li>This report is for reference only. Official transcripts must be obtained from the Examination Branch.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}