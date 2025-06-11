/**
 * Employee name mapping utility for converting between database and CSV formats
 * Database format: 'THN - Thomas Nissen' (with possible leading/trailing spaces)
 * CSV format: 'THN'
 */

export interface EmployeeMapping {
  initials: string;
  fullName: string;
}

/**
 * Extracts initials from database employee format
 * Handles formats like: 'THN - Thomas Nissen', ' THN - Thomas Nissen ', 'THN-Thomas Nissen'
 */
export function extractInitials(databaseName: string): string {
  if (!databaseName || typeof databaseName !== 'string') {
    throw new Error('Invalid database name: must be a non-empty string');
  }

  // Trim whitespace and find the first hyphen
  const trimmed = databaseName.trim();
  const hyphenIndex = trimmed.indexOf('-');
  
  if (hyphenIndex === -1) {
    throw new Error(`Invalid database name format: missing hyphen in "${databaseName}"`);
  }

  // Extract initials (everything before the first hyphen)
  const initials = trimmed.substring(0, hyphenIndex).trim();
  
  if (!initials) {
    throw new Error(`Invalid database name format: no initials found in "${databaseName}"`);
  }

  return initials.toUpperCase();
}

/**
 * Extracts full name from database employee format
 * Handles formats like: 'THN - Thomas Nissen', ' THN - Thomas Nissen '
 */
export function extractFullName(databaseName: string): string {
  if (!databaseName || typeof databaseName !== 'string') {
    throw new Error('Invalid database name: must be a non-empty string');
  }

  // Trim whitespace and find the first hyphen
  const trimmed = databaseName.trim();
  const hyphenIndex = trimmed.indexOf('-');
  
  if (hyphenIndex === -1) {
    throw new Error(`Invalid database name format: missing hyphen in "${databaseName}"`);
  }

  // Extract full name (everything after the first hyphen)
  const fullName = trimmed.substring(hyphenIndex + 1).trim();
  
  if (!fullName) {
    throw new Error(`Invalid database name format: no full name found in "${databaseName}"`);
  }

  return fullName;
}

/**
 * Formats initials for database lookup (ensures uppercase)
 */
export function formatEmployeeNameForDatabase(initials: string): string {
  if (!initials || typeof initials !== 'string') {
    throw new Error('Invalid initials: must be a non-empty string');
  }

  return initials.trim().toUpperCase();
}

/**
 * Formats employee name for display (capitalizes properly)
 */
export function formatEmployeeNameForDisplay(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    throw new Error('Invalid full name: must be a non-empty string');
  }

  return fullName
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Creates an employee mapping object from database format
 */
export function createEmployeeMappingFromDatabase(databaseName: string): EmployeeMapping {
  try {
    const initials = extractInitials(databaseName);
    const fullName = extractFullName(databaseName);
    
    return {
      initials: formatEmployeeNameForDatabase(initials),
      fullName: formatEmployeeNameForDisplay(fullName)
    };
  } catch (error) {
    throw new Error(`Failed to create employee mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if a string matches the expected database employee format
 */
export function isValidDatabaseEmployeeFormat(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  try {
    extractInitials(name);
    extractFullName(name);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid employee initials format
 */
export function isValidInitialsFormat(initials: string): boolean {
  if (!initials || typeof initials !== 'string') {
    return false;
  }

  const trimmed = initials.trim();
  // Basic validation: 2-4 uppercase letters, no spaces or special chars
  return /^[A-Z]{2,4}$/.test(trimmed);
} 