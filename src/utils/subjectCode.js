/**
 * Normalize subject code to a standard format: 'PREFIX NUMBER'
 * Handles variations like:
 * - 'BMT1013' → 'BMT 1013'
 * - 'BMT 1013' → 'BMT 1013'
 * - 'bmt1013' → 'BMT 1013'
 * - 'BMT  1013' → 'BMT 1013'
 * - 'LANG-1013' → 'LANG-1013' (codes with hyphens stay as-is)
 * - 'COMM-2033' → 'COMM-2033'
 */
export function normalizeSubjectCode(code) {
  if (!code) return '';
  
  const trimmed = code.trim().toUpperCase();
  
  // If already contains a space or hyphen, just collapse multiple spaces
  if (trimmed.includes(' ') || trimmed.includes('-')) {
    return trimmed.replace(/\s+/g, ' ');
  }
  
  // Pattern: letters followed by numbers (e.g., BMT1013, AFM2013, HRM3013)
  // Insert space between letter prefix and number suffix
  const match = trimmed.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  
  // Fallback: return as-is
  return trimmed;
}

/**
 * Create a lookup map with normalized keys for flexible matching
 * @param {Object} subjectMap - Original subject code to name map
 * @returns {Object} Map with normalized keys
 */
export function createNormalizedSubjectMap(subjectMap) {
  const normalized = {};
  for (const [code, name] of Object.entries(subjectMap)) {
    const normCode = normalizeSubjectCode(code);
    normalized[normCode] = name;
    // Also store original for reference
    normalized[code] = name;
  }
  return normalized;
}

/**
 * Get subject name from map with flexible matching
 * @param {Object} subjectMap - Subject code to name map
 * @param {string} code - Subject code to look up
 * @returns {string} Subject name or original code if not found
 */
export function getSubjectName(subjectMap, code) {
  const normCode = normalizeSubjectCode(code);
  return subjectMap[normCode] || subjectMap[code] || code;
}