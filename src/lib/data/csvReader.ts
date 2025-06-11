import fs from 'fs';
import path from 'path';

/**
 * Interface for budget CSV row data
 */
export interface BudgetCsvRow {
  Team: string;
  Description: string;
  Employee: string;
  TaskID: string;
  [month: string]: string; // Dynamic monthly columns like '202501', '202502', etc.
}

/**
 * Processed budget data with monthly hours parsed as numbers
 */
export interface ProcessedBudgetData {
  team: string;
  description: string;
  employee: string;
  taskId: string;
  monthlyHours: Record<string, number>;
  totalHours: number;
}

/**
 * Read and parse CSV file synchronously
 * @param filePath - Path to the CSV file
 * @returns Promise that resolves to parsed CSV data
 */
export async function readCsvFile(filePath: string): Promise<BudgetCsvRow[]> {
  return new Promise((resolve, reject) => {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    const results: BudgetCsvRow[] = [];
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV content
      const lines = fileContent.split('\n');
      const headers = lines[0].split(';').map(h => h.trim().replace(/\r/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const values = line.split(';');
          const row: BudgetCsvRow = {} as BudgetCsvRow;
          
          headers.forEach((header, index) => {
            row[header] = (values[index] || '').trim().replace(/\r/g, '');
          });
          
          results.push(row);
        }
      }
      
      resolve(results);
    } catch (error) {
      reject(new Error(`Error parsing CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Read and parse the budget2025.csv file specifically
 * @returns Promise that resolves to parsed budget data
 */
export async function readBudget2025(): Promise<BudgetCsvRow[]> {
  const csvPath = path.join(process.cwd(), 'data', 'budget', 'budget2025.csv');
  
  try {
    return await readCsvFile(csvPath);
  } catch (error) {
    throw new Error(`Failed to read budget2025.csv: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process raw CSV data into a more usable format with parsed monthly hours
 * @param rawData - Raw CSV data from readBudget2025()
 * @returns Processed budget data with numerical values
 */
export function processBudgetData(rawData: BudgetCsvRow[]): ProcessedBudgetData[] {
  return rawData.map(row => {
    const monthlyHours: Record<string, number> = {};
    let totalHours = 0;
    
    // Extract monthly columns (those starting with '2025')
    Object.keys(row).forEach(key => {
      if (key.startsWith('2025')) {
        const hours = parseInt(row[key]) || 0;
        monthlyHours[key] = hours;
        totalHours += hours;
      }
    });
    
    return {
      team: row.Team,
      description: row.Description,
      employee: row.Employee,
      taskId: row.TaskID,
      monthlyHours,
      totalHours
    };
  });
}

/**
 * Get budget data for a specific team
 * @param teamName - Name of the team (e.g., 'CST III')
 * @returns Promise that resolves to team budget data
 */
export async function getTeamBudgetData(teamName: string): Promise<ProcessedBudgetData[]> {
  try {
    const rawData = await readBudget2025();
    const processedData = processBudgetData(rawData);
    
    return processedData.filter(item => item.team === teamName);
  } catch (error) {
    throw new Error(`Failed to get team budget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get budget data for a specific employee
 * @param employeeInitials - Employee initials (e.g., 'JKH')
 * @returns Promise that resolves to employee budget data
 */
export async function getEmployeeBudgetData(employeeInitials: string): Promise<ProcessedBudgetData[]> {
  try {
    const rawData = await readBudget2025();
    const processedData = processBudgetData(rawData);
    
    return processedData.filter(item => item.employee === employeeInitials);
  } catch (error) {
    throw new Error(`Failed to get employee budget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get budget data for a specific period and optionally filter by team
 * @param period - Period in format like "202505" or "May 2025"
 * @param teamFilter - Optional team filter (e.g., 'CST III')
 * @returns Promise that resolves to budget data for the specific period
 */
export async function getBudgetDataForPeriod(period: string, teamFilter?: string): Promise<ProcessedBudgetData[]> {
  try {
    const rawData = await readBudget2025();
    const processedData = processBudgetData(rawData);
    
    // Convert period to database format if necessary
    const periodCode = convertPeriodToCode(period);
    
    return processedData
      .filter(item => {
        // Filter by team if specified
        if (teamFilter && item.team !== teamFilter) {
          return false;
        }
        
        // Check if the employee has budget data for this specific period
        return item.monthlyHours[periodCode] !== undefined;
      })
      .map(item => ({
        ...item,
        // Override totalHours to be the hours for this specific period
        totalHours: item.monthlyHours[periodCode] || 0
      }));
  } catch (error) {
    throw new Error(`Failed to get budget data for period: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert period string to database period code
 * Examples: "May 2025" -> "202505", "January 2025" -> "202501"
 */
export function convertPeriodToCode(period: string): string {
  const monthMap: Record<string, string> = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };

  // Handle different period formats
  if (period.match(/^\d{6}$/)) {
    return period; // Already in correct format
  }

  // Parse "Month Year" format
  const parts = period.toLowerCase().trim().split(/\s+/);
  if (parts.length === 2) {
    const [monthName, year] = parts;
    const monthCode = monthMap[monthName];
    if (monthCode && year.match(/^\d{4}$/)) {
      return `${year}${monthCode}`;
    }
  }

  // Default to current month if parsing fails
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  console.warn(`Could not parse period "${period}", defaulting to current month: ${currentYear}${currentMonth}`);
  return `${currentYear}${currentMonth}`;
}

/**
 * Get total budget hours by team
 * @returns Promise that resolves to team totals
 */
export async function getTeamTotals(): Promise<Record<string, number>> {
  try {
    const rawData = await readBudget2025();
    const processedData = processBudgetData(rawData);
    
    const teamTotals: Record<string, number> = {};
    
    processedData.forEach(item => {
      if (!teamTotals[item.team]) {
        teamTotals[item.team] = 0;
      }
      teamTotals[item.team] += item.totalHours;
    });
    
    return teamTotals;
  } catch (error) {
    throw new Error(`Failed to calculate team totals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 