// Grade ranking: higher number = better grade
// 'ab' (absent) is the absolute lowest (0)
export const GRADE_RANK = {
  'A+': 15, 'A': 14, 'A-': 13,
  'B+': 12, 'B': 11, 'B-': 10,
  'C+': 9, 'C': 8, 'C-': 7,
  'D+': 6, 'D': 5, 'E': 4,
  'ab': 1, 'AB': 1, 'Ab': 1,
  '': 0, null: 0, undefined: 0
};

// Reverse lookup for display
export const RANK_TO_GRADE = Object.fromEntries(
  Object.entries(GRADE_RANK).map(([k, v]) => [v, k.toUpperCase()])
);

/**
 * Returns the highest grade from an array of grades
 * 'ab' is treated as the lowest possible grade
 */
export function getHighestGrade(grades) {
  if (!grades || grades.length === 0) return null;
  
  const validGrades = grades
    .map(g => String(g).trim().toUpperCase())
    .filter(g => g !== '');
  
  if (validGrades.length === 0) return null;
  
  // Sort by rank descending (highest first)
  validGrades.sort((a, b) => (GRADE_RANK[b] || 0) - (GRADE_RANK[a] || 0));
  
  return validGrades[0];
}

/**
 * Parse CSV content and return array of objects
 * Expected columns: IndexNo, StudentName, SubjectCode1, SubjectCode2, ...
 */
export function parseExamResultsCSV(csvText) {
  const lines = csvText.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const indexNoIndex = headers.findIndex(h => h.toLowerCase() === 'indexno' || h.toLowerCase() === 'index no');
  const studentNameIndex = headers.findIndex(h => h.toLowerCase() === 'studentname' || h.toLowerCase() === 'student name');
  
  if (indexNoIndex === -1) {
    throw new Error('CSV must contain an "IndexNo" column');
  }
  
  const subjectCodes = headers
    .map((h, i) => ({ code: h.trim(), index: i }))
    .filter(h => h.index !== indexNoIndex && h.index !== studentNameIndex && h.code);
  
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length <= indexNoIndex) continue;
    
    const indexNo = values[indexNoIndex]?.trim();
    if (!indexNo) continue;
    
    const studentName = studentNameIndex !== -1 ? values[studentNameIndex]?.trim() : '';
    
    for (const { code, index } of subjectCodes) {
      const grade = values[index]?.trim();
      if (grade && grade !== '' && grade.toLowerCase() !== 'ab') {
        results.push({
          indexNo: indexNo.toUpperCase(),
          studentName: studentName || '',
          subjectCode: code.toUpperCase(),
          grade: grade.toUpperCase(),
        });
      } else if (grade && grade.toLowerCase() === 'ab') {
        // Include 'ab' grades too for proper tracking
        results.push({
          indexNo: indexNo.toUpperCase(),
          studentName: studentName || '',
          subjectCode: code.toUpperCase(),
          grade: 'ab',
        });
      }
    }
  }
  
  return results;
}

/**
 * Group results by indexNo and subjectCode, keeping only highest grade
 */
export function deduplicateResults(results) {
  const map = new Map();
  
  for (const r of results) {
    const key = `${r.indexNo}|${r.subjectCode}`;
    const existing = map.get(key);
    const currentRank = GRADE_RANK[r.grade] || 0;
    const existingRank = existing ? (GRADE_RANK[existing.grade] || 0) : 0;
    
    if (!existing || currentRank > existingRank) {
      map.set(key, r);
    }
  }
  
  return Array.from(map.values());
}

/**
 * Validate index number format
 * BMS: ^\d{2}\/ms\/\d{4}$ (e.g., 22/ms/0001)
 * LCS: ^\d{2}\/cs\/\d{4}$ (e.g., 22/cs/0001)
 */
export function validateIndexNo(indexNo, department) {
  const normalized = indexNo.trim().toLowerCase();
  
  if (department === 'bms') {
    return /^\d{2}\/ms\/\d{4}$/.test(normalized);
  } else if (department === 'lcs') {
    return /^\d{2}\/cs\/\d{4}$/.test(normalized);
  }
  
  // General validation if department not specified
  return /^\d{2}\/(ms|cs)\/\d{4}$/.test(normalized);
}

/**
 * Get department from index number
 */
export function getDepartmentFromIndexNo(indexNo) {
  const normalized = indexNo.trim().toLowerCase();
  if (/\/ms\//.test(normalized)) return 'bms';
  if (/\/cs\//.test(normalized)) return 'lcs';
  return null;
}

/**
 * Generate a sample CSV template for download
 */
export function generateCSVTemplate(department = 'bms') {
  // Common subjects for template
  const bmsSubjects = [
    'BMT 1013', 'BMT 1023', 'BMT 1033', 'BMT 1043', 'BMT 1053',
    'AFM 1013', 'HRM 1013', 'MKT 1013', 'BMT 1063', 'BMT 1073',
    'BMT 2013', 'AFM 2013', 'BMT 2023', 'BMT 2033', 'BMT 2043',
    'BMT 2053', 'AFM 2023', 'BMT 2063', 'BMT 2073', 'BMT 2082', 'BMT 2091',
    'BMT 3013', 'BMT 3023', 'BMT 3033', 'BMT 3043', 'BMT 3053',
    'BMT 3063', 'BMT 3073', 'BMT 3083', 'BMT 3093', 'BMT 3113',
    'BMT 3013', 'BMT 3023', 'BMT 3033', 'BMT 3043', 'BMT 3053',
    'HRM 3013', 'HRM 3023', 'HRM 3033', 'HRM 3043', 'HRM 3053',
    'AFM 3033', 'AFM 3043', 'AFM 3053',
    'MMT 3013', 'MMT 3023', 'MMT 3033', 'MMT 3043', 'MMT 3053',
    'IMT 3013', 'IMT 3023', 'IMT 3033', 'IMT 3043', 'IMT 3053',
  ];
  
  const lcsSubjects = [
    'LANG-1013/1023', 'LANG-1033', 'GENR-1013', 'COMM-1013', 'ITEC-1013',
    'LANG-1043', 'LANG-1053', 'COMM-1023', 'LANG-1013', 'GENR-1023',
    'COMM-2053', 'COMM-2063', 'LANG-2063', 'COMM-2033', 'COMM-2043',
    'COMM-2083', 'COMM-2093', 'COMM-2103', 'LANG-2113', 'COMM-2073',
    'LANG-2073', 'LANG-2083', 'LANG-2093', 'LANG-2103', 'COMM-2033',
    'LANG-2123', 'LANG-2133', 'LANG-2143', 'LANG-2153', 'COMM-2073',
    'COMM-3113', 'COMM-3123', 'COMM-3133', 'COMM-3143', 'ITEC-3033',
    'LANG-3163', 'LANG-3173', 'LANG-3183', 'LING-3113', 'ITEC-3033', 'COMM-3143',
    'COMM-3153', 'COMM-3163', 'COMM-3173', 'COMM-3183', 'GENR-3043',
    'LANG-3193', 'LANG-3203', 'LANG-3143', 'GENR-3043', 'GENR-3033',
  ];
  
  const subjects = department === 'lcs' ? lcsSubjects : bmsSubjects;
  const header = ['IndexNo', 'StudentName', ...subjects].join(',');
  const sampleRow = ['22/ms/0001', 'John Doe', ...subjects.map(() => '')].join(',');
  
  return `${header}\n${sampleRow}\n`;
}