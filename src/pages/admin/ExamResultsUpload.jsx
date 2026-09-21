import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { uploadExamResults, getBatchPermissions } from '../../services/firestore'
import { FileText, Upload, AlertTriangle, Loader2, Eye, X, CheckCircle2, FileQuestion, Table } from 'lucide-react'
import { parse } from 'papaparse'

const DEPARTMENTS = ['BMS', 'LCS'];

const SEMESTERS = [
  { id: '11', label: 'Year 1 - Semester 1' },
  { id: '12', label: 'Year 1 - Semester 2' },
  { id: '21', label: 'Year 2 - Semester 1' },
  { id: '22', label: 'Year 2 - Semester 2' },
  { id: '31', label: 'Year 3 - Semester 1' },
  { id: '32', label: 'Year 3 - Semester 2' },
  { id: '41', label: 'Year 4 - Semester 1' },
  { id: '42', label: 'Year 4 - Semester 2' },
];

const VALID_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'AB'];

const REQUIRED_HEADERS = ['Index Number', 'Student Name', 'Subject Code', 'Subject Name', 'Grade'];

export default function ExamResultsUpload() {
  const { showToast } = useToast();
  const [department, setDepartment] = useState('BMS');
  const [batch, setBatch] = useState('');
  const [semester, setSemester] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batches, setBatches] = useState([]);
  const [errors, setErrors] = useState([]);
  const [extractedData, setExtractedData] = useState([]);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState([]);

  const loadBatches = useCallback(async () => {
    try {
      const perms = await getBatchPermissions();
      setBatches(perms.map(p => p.batchName).filter(Boolean).sort());
    } catch (err) {
      showToast('Failed to load batches', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches, department]);

  const handleFileChange = useCallback((e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (f.type !== 'text/csv' && !f.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error');
      return;
    }

    setFile(f);
    setErrors([]);
    setExtractedData([]);
    setStep(1);
    setCsvData([]);

    const url = URL.createObjectURL(f);
    setFilePreview(url);

    setProcessing(true);
    setProgress(0);

    parse(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        setProgress(100);
        setProcessing(false);
        
        if (results.errors.length > 0) {
          showToast(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`, 'error');
          return;
        }

        if (results.data.length === 0) {
          showToast('CSV file is empty', 'error');
          return;
        }

        const headers = results.meta.fields || [];
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          showToast(`Missing required columns: ${missingHeaders.join(', ')}. Required: ${REQUIRED_HEADERS.join(', ')}`, 'error');
          return;
        }

        setCsvData(results.data);
        setProgress(100);
        showToast(`Parsed ${results.data.length} rows from CSV`, 'success');
      },
      error: (err) => {
        setProcessing(false);
        showToast('Failed to parse CSV file', 'error');
      }
    });
  }, [showToast]);

  const processCsvData = useCallback(() => {
    if (csvData.length === 0) {
      showToast('No CSV data to process', 'error');
      return;
    }

    if (!batch || !semester) {
      showToast('Please select batch and semester', 'error');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setErrors([]);

    try {
      setProgress(20);

      const grouped = {};
      
      for (const row of csvData) {
        const indexNumber = (row['Index Number'] || '').trim();
        const studentName = (row['Student Name'] || '').trim();
        const subjectCode = (row['Subject Code'] || '').trim().toUpperCase();
        const subjectName = (row['Subject Name'] || '').trim();
        const grade = (row['Grade'] || '').trim().toUpperCase();

        if (!indexNumber || !subjectCode || !grade) continue;
        if (!VALID_GRADES.includes(grade)) continue;

        if (!grouped[indexNumber]) {
          grouped[indexNumber] = {
            indexNumber,
            studentName: studentName || 'Unknown',
            results: []
          };
        }

        grouped[indexNumber].results.push({
          subjectCode,
          subjectName,
          grade
        });
      }

      setProgress(50);

      const finalData = Object.values(grouped).map(student => {
        const subjectMap = new Map();
        for (const result of student.results) {
          const key = result.subjectCode;
          if (!subjectMap.has(key) || VALID_GRADES.indexOf(result.grade) < VALID_GRADES.indexOf(subjectMap.get(key).grade)) {
            subjectMap.set(key, { subjectCode: result.subjectCode, subjectName: result.subjectName, grade: result.grade });
          }
        }
        return {
          indexNumber: student.indexNumber,
          studentName: student.studentName,
          results: Array.from(subjectMap.values())
        };
      });

      setProgress(80);

      const errs = [];
      for (const student of finalData) {
        for (const result of student.results) {
          if (!VALID_GRADES.includes(result.grade)) {
            errors.push(`Invalid grade "${result.grade}" for ${student.indexNumber} - ${result.subjectCode}`);
          }
        }
      }

      setErrors(errs);
      setProgress(100);

      setExtractedData(finalData);
      setStep(2);
      showToast(`Processed ${finalData.length} students from CSV`, 'success');
    } catch (err) {
      console.error('Processing error:', err);
      showToast('Failed to process CSV data', 'error');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [csvData, batch, semester, showToast]);

  const handleUpload = useCallback(async () => {
    if (extractedData.length === 0) {
      showToast('No data to upload', 'error');
      return;
    }

    if (!batch || !semester) {
      showToast('Please select batch and semester', 'error');
      return;
    }

    setLoading(true);
    try {
      const records = [];
      for (const student of extractedData) {
        for (const result of student.results) {
          records.push({
            indexNo: student.indexNumber,
            studentName: student.studentName,
            subjectCode: result.subjectCode,
            subjectName: result.subjectName,
            grade: result.grade,
            department: department.toLowerCase(),
            batch,
            semester
          });
        }
      }

      if (records.length === 0) {
        showToast('No valid grade records to upload', 'error');
        return;
      }

      await uploadExamResults(records, department, batch, semester);
      showToast(`Successfully uploaded ${records.length} grade records for ${batch} ${semester} (${department})`, 'success');

      setFile(null);
      setFilePreview(null);
      setCsvData([]);
      setExtractedData([]);
      setErrors([]);
      setStep(1);
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [extractedData, batch, semester, department]);

  const resetUpload = useCallback(() => {
    setFile(null);
    setFilePreview(null);
    setCsvData([]);
    setExtractedData([]);
    setErrors([]);
    setStep(1);
    setProgress(0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exam Results Upload (CSV)</h1>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Upload CSV file → Parse → Review → Upload
        </span>
      </div>

      {step === 1 && (
        <div className="card p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setBatch(''); }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 select-field"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 select-field"
                required
              >
                <option value="">Select Batch</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-indigo-500 select-field"
                required
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8">
            <div className="flex flex-col items-center">
              {filePreview ? (
                <div className="relative w-full max-w-md mx-auto mb-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg w-full">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <span className="ml-3 text-gray-500">CSV File</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {file?.name}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-4">
                      <Table className="w-12 h-12 text-indigo-400" />
                      <FileQuestion className="w-12 h-12 text-indigo-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 text-lg">Upload CSV File</p>
                      <p className="text-sm text-gray-400 mt-1">Required columns: Index Number, Student Name, Subject Code, Subject Name, Grade</p>
                    </div>
                  </div>
                </>
              )}
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={processing || loading}
              />
              
              {!filePreview ? (
                <label htmlFor="csv-upload" className="mt-4 inline-block cursor-pointer px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-base">
                  <Upload className="w-5 h-5 inline mr-2" />
                  Choose CSV File
                </label>
              ) : (
                <button
                  onClick={processCsvData}
                  disabled={processing || loading || !batch || !semester || csvData.length === 0}
                  className="mt-4 inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-base disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {progress > 0 ? `Processing CSV... ${progress}%` : 'Processing CSV...'}
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Process CSV Data
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Review Extracted Data ({extractedData.length} students)
            </h2>
            <button onClick={resetUpload} className="text-sm text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4 inline mr-1" /> Re-upload
            </button>
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                <AlertTriangle className="w-5 h-5" />
                Validation Warnings ({errors.length})
              </div>
              <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {errors.slice(0, 20).map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>{e}</span>
                  </li>
                ))}
                {errors.length > 20 && <li className="text-red-500">... and {errors.length - 20} more</li>}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-3 text-left font-semibold text-gray-600 w-10">#</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600">Index No</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600">Student Name</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600">Subject Code</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600">Subject Name</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600 w-24">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {extractedData.flatMap((student, studentIdx) => 
                  student.results.map((result, resultIdx) => (
                    <tr key={`${student.indexNumber}-${result.subjectCode}`} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-gray-500 text-center">
                        {extractedData.slice(0, studentIdx).reduce((acc, s) => acc + s.results.length, 0) + resultIdx + 1}
                      </td>
                      <td className="px-3 py-3 font-mono text-gray-900">{student.indexNumber}</td>
                      <td className="px-3 py-3 text-gray-700">{student.studentName}</td>
                      <td className="px-3 py-3 font-mono text-gray-900">{result.subjectCode}</td>
                      <td className="px-3 py-3 text-gray-700">{result.subjectName}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          result.grade === 'AB' ? 'bg-red-100 text-red-800' :
                          ['A+', 'A', 'A-'].includes(result.grade) ? 'bg-green-100 text-green-800' :
                          ['B+', 'B', 'B-'].includes(result.grade) ? 'bg-blue-100 text-blue-800' :
                          ['C+', 'C', 'C-'].includes(result.grade) ? 'bg-yellow-100 text-yellow-800' :
                          ['D+', 'D', 'E'].includes(result.grade) ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.grade === 'AB' ? 'AB' : result.grade}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm & Upload to Firebase
                </>
              )}
            </button>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Only the highest grade is displayed for each subject (repeat attempts with lower grades are excluded).</li>
                <li><strong>AB</strong> indicates the student was absent for that examination.</li>
                <li>This report is for reference only. Official transcripts must be obtained from the Examination Branch.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}