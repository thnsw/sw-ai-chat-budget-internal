/**
 * Team Name Mapping Utility
 * Converts between database format ('CST3') and CSV format ('CST III')
 */

// Dictionary for Arabic to Roman numeral conversion (1-20 should be sufficient for teams)
const ARABIC_TO_ROMAN: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
  12: 'XII',
  13: 'XIII',
  14: 'XIV',
  15: 'XV',
  16: 'XVI',
  17: 'XVII',
  18: 'XVIII',
  19: 'XIX',
  20: 'XX'
};

// Reverse mapping for Roman to Arabic
const ROMAN_TO_ARABIC: Record<string, number> = Object.fromEntries(
  Object.entries(ARABIC_TO_ROMAN).map(([arabic, roman]) => [roman, parseInt(arabic)])
);

/**
 * Convert Arabic numeral to Roman numeral
 * @param num - Arabic number (1-20)
 * @returns Roman numeral string
 * @throws Error if number is out of supported range
 */
export function convertToRoman(num: number): string {
  if (!Number.isInteger(num) || num < 1 || num > 20) {
    throw new Error(`Arabic number ${num} is not supported. Must be an integer between 1 and 20.`);
  }
  
  return ARABIC_TO_ROMAN[num];
}

/**
 * Convert Roman numeral to Arabic numeral
 * @param roman - Roman numeral string
 * @returns Arabic number
 * @throws Error if Roman numeral is not recognized
 */
export function convertFromRoman(roman: string): number {
  const upperRoman = roman.toUpperCase().trim();
  
  if (!ROMAN_TO_ARABIC[upperRoman]) {
    throw new Error(`Roman numeral '${roman}' is not supported.`);
  }
  
  return ROMAN_TO_ARABIC[upperRoman];
}

/**
 * Convert team name from CSV format to database format
 * Example: 'CST III' -> 'CST3'
 * @param csvTeamName - Team name in CSV format (e.g., 'CST III')
 * @returns Team name in database format (e.g., 'CST3')
 * @throws Error if team name format is invalid
 */
export function formatTeamNameForDatabase(csvTeamName: string): string {
  if (!csvTeamName || typeof csvTeamName !== 'string') {
    throw new Error('Team name must be a non-empty string');
  }
  
  const trimmed = csvTeamName.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length !== 2) {
    throw new Error(`Invalid team name format: '${csvTeamName}'. Expected format: 'PREFIX ROMAN_NUMERAL'`);
  }
  
  const [prefix, romanNumeral] = parts;
  
  try {
    const arabicNumber = convertFromRoman(romanNumeral);
    return `${prefix}${arabicNumber}`;
  } catch (error) {
    throw new Error(`Invalid team name '${csvTeamName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert team name from database format to display format
 * Example: 'CST3' -> 'CST III'
 * @param dbTeamName - Team name in database format (e.g., 'CST3')
 * @returns Team name in display format (e.g., 'CST III')
 * @throws Error if team name format is invalid
 */
export function formatTeamNameForDisplay(dbTeamName: string): string {
  if (!dbTeamName || typeof dbTeamName !== 'string') {
    throw new Error('Team name must be a non-empty string');
  }
  
  const trimmed = dbTeamName.trim();
  
  // Extract prefix and number using regex
  const match = trimmed.match(/^([A-Z]+)(\d+)$/);
  
  if (!match) {
    throw new Error(`Invalid team name format: '${dbTeamName}'. Expected format: 'PREFIX{NUMBER}'`);
  }
  
  const [, prefix, numberStr] = match;
  const number = parseInt(numberStr, 10);
  
  try {
    const romanNumeral = convertToRoman(number);
    return `${prefix} ${romanNumeral}`;
  } catch (error) {
    throw new Error(`Invalid team name '${dbTeamName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate if a team name is in the correct database format
 * @param teamName - Team name to validate
 * @returns True if valid, false otherwise
 */
export function isValidDatabaseTeamName(teamName: string): boolean {
  try {
    formatTeamNameForDisplay(teamName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a team name is in the correct CSV format
 * @param teamName - Team name to validate
 * @returns True if valid, false otherwise
 */
export function isValidCsvTeamName(teamName: string): boolean {
  try {
    formatTeamNameForDatabase(teamName);
    return true;
  } catch {
    return false;
  }
} 