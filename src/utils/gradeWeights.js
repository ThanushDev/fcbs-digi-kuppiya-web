// Unified grade weight mapping for comparison (higher weight = better grade)
// Used across the application for consistent grade comparison
export const GRADE_WEIGHTS = {
  'A+': 14, 'A': 13, 'A-': 12,
  'B+': 11, 'B': 10, 'B-': 9,
  'C+': 8, 'C': 7, 'C-': 6,
  'D+': 5, 'D': 4, 'E': 3,
  'F': 1, 'AB': 1, 'ab': 1,
  '': 0, null: 0, undefined: 0
};

// Reverse lookup for display (weight -> grade)
export const WEIGHT_TO_GRADE = Object.fromEntries(
  Object.entries(GRADE_WEIGHTS)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => [v, k])
);

// Get weight for a grade (case-insensitive)
export function getGradeWeight(grade) {
  if (!grade) return 0;
  const normalized = String(grade).trim().toUpperCase();
  return GRADE_WEIGHTS[normalized] || 0;
}

// Compare two grades: returns true if gradeA is better than gradeB
export function isGradeBetter(gradeA, gradeB) {
  return getGradeWeight(gradeA) > getGradeWeight(gradeB);
}

// Get the better of two grades
export function getBetterGrade(gradeA, gradeB) {
  return isGradeBetter(gradeA, gradeB) ? gradeA : gradeB;
}

// Get highest grade from an array
export function getHighestGrade(grades) {
  if (!grades || grades.length === 0) return null;
  
  const validGrades = grades
    .map(g => String(g).trim().toUpperCase())
    .filter(g => g !== '');
  
  if (validGrades.length === 0) return null;
  
  return validGrades.reduce((best, current) => 
    isGradeBetter(current, best) ? current : best
  );
}

// Validate if a grade is valid
export function isValidGrade(grade) {
  if (!grade) return false;
  const normalized = String(grade).trim().toUpperCase();
  return normalized in GRADE_WEIGHTS && GRADE_WEIGHTS[normalized] > 0;
}

export const VALID_GRADES = Object.keys(GRADE_WEIGHTS).filter(k => GRADE_WEIGHTS[k] > 0);