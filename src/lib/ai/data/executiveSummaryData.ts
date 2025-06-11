import { executeQuery } from '@/lib/database/connection';
import { getBudgetDataForPeriod, ProcessedBudgetData, convertPeriodToCode } from '@/lib/data/csvReader';
import { extractInitials } from '@/lib/utils/employeeMapping';
import { formatTeamNameForDisplay } from '@/lib/utils/teamMapping';

export interface DatabaseEmployeeData {
  EmployeeName: string;
  EmployeeID_EmployeeNiv1: string;
  BillableHours: number;
}

export interface EmployeeAnalysis {
  initials: string;
  fullName: string;
  team: string;
  budgetedHours: number;
  billedHours: number;
  variance: number;
  variancePercentage: number;
}

export interface ExecutiveSummaryData {
  totalBudgeted: number;
  totalBilled: number;
  budgetVariance: number;
  utilizationRate: number;
  employeeAnalysis: EmployeeAnalysis[];
  teamSummary: Record<string, {
    budgeted: number;
    billed: number;
    variance: number;
    employeeCount: number;
  }>;
}

/**
 * Fetch billed hours data from the database for a specific period
 */
export async function fetchBilledHoursData(period: string): Promise<DatabaseEmployeeData[]> {
  // Convert period format (e.g., "May 2025" -> "202505")
  const periodCode = convertPeriodToCode(period);
  
  const query = `
    WITH LatestEntries AS (
        SELECT
            e.EmployeeName,
            e.EmployeeID_EmployeeNiv1,
            f.Hours,
            f.IsBillableKey,
            f.Date,
            ROW_NUMBER() OVER (PARTITION BY f.DW_ID ORDER BY f.DW_Batch_Created DESC) AS RowNum
        FROM
            [PowerBIData].[vPowerBiData_Harvest_Harvest_data_All] f
        LEFT JOIN
            [PowerBIData].[DimEmployee_Tabular_Flat] e ON f.EmployeeKey = e.EmployeeKey
        WHERE
            f.Hours > 0
            AND e.EmployeeID_EmployeeNiv1 IN ('CST3', 'CST4', 'CST5')
    )
    SELECT
        EmployeeName,
        EmployeeID_EmployeeNiv1,
        SUM(CASE WHEN IsBillableKey = 1 THEN Hours ELSE 0 END) AS BillableHours
    FROM
        LatestEntries
    WHERE
        RowNum = 1
        AND Date LIKE @periodCode
    GROUP BY
        EmployeeName,
        EmployeeID_EmployeeNiv1;
  `;

  try {
    const result = await executeQuery<DatabaseEmployeeData>(query, { 
      periodCode: `${periodCode}%` 
    });
    return result.recordset;
  } catch (error) {
    console.error('Failed to fetch billed hours data:', error);
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Match database employees with CSV budget data
 */
function matchEmployeeData(
  databaseData: DatabaseEmployeeData[],
  budgetData: ProcessedBudgetData[]
): EmployeeAnalysis[] {
  const analysis: EmployeeAnalysis[] = [];

  for (const dbEmployee of databaseData) {
    try {
      // Extract initials from database employee name
      const initials = extractInitials(dbEmployee.EmployeeName);
      
      // Find matching budget data
      const budgetEntry = budgetData.find(budget => budget.employee === initials);
      
      if (budgetEntry) {
        const budgetedHours = budgetEntry.totalHours;
        const billedHours = dbEmployee.BillableHours;
        const variance = billedHours - budgetedHours;
        const variancePercentage = budgetedHours > 0 ? (variance / budgetedHours) * 100 : 0;

        analysis.push({
          initials,
          fullName: dbEmployee.EmployeeName,
          team: formatTeamNameForDisplay(dbEmployee.EmployeeID_EmployeeNiv1),
          budgetedHours,
          billedHours,
          variance,
          variancePercentage
        });
      } else {
        console.warn(`No budget data found for employee: ${initials} (${dbEmployee.EmployeeName})`);
      }
    } catch (error) {
      console.error(`Error processing employee ${dbEmployee.EmployeeName}:`, error);
    }
  }

  return analysis;
}

/**
 * Generate team summary from employee analysis
 */
function generateTeamSummary(employeeAnalysis: EmployeeAnalysis[]): Record<string, {
  budgeted: number;
  billed: number;
  variance: number;
  employeeCount: number;
}> {
  const teamSummary: Record<string, {
    budgeted: number;
    billed: number;
    variance: number;
    employeeCount: number;
  }> = {};

  for (const employee of employeeAnalysis) {
    if (!teamSummary[employee.team]) {
      teamSummary[employee.team] = {
        budgeted: 0,
        billed: 0,
        variance: 0,
        employeeCount: 0
      };
    }

    teamSummary[employee.team].budgeted += employee.budgetedHours;
    teamSummary[employee.team].billed += employee.billedHours;
    teamSummary[employee.team].variance += employee.variance;
    teamSummary[employee.team].employeeCount += 1;
  }

  return teamSummary;
}

/**
 * Main function to fetch and analyze all data for executive summary
 */
export async function getExecutiveSummaryAnalysis(period: string, teamFilter?: string): Promise<ExecutiveSummaryData> {
  try {
    // Fetch data from both sources
    const [databaseData, processedBudgetData] = await Promise.all([
      fetchBilledHoursData(period),
      getBudgetDataForPeriod(period, teamFilter)
    ]);

    // Match and analyze employee data
    const employeeAnalysis = matchEmployeeData(databaseData, processedBudgetData);

    // Calculate totals
    const totalBudgeted = employeeAnalysis.reduce((sum, emp) => sum + emp.budgetedHours, 0);
    const totalBilled = employeeAnalysis.reduce((sum, emp) => sum + emp.billedHours, 0);
    const budgetVariance = totalBilled - totalBudgeted;
    const utilizationRate = totalBudgeted > 0 ? (totalBilled / totalBudgeted) * 100 : 0;

    // Generate team summary
    const teamSummary = generateTeamSummary(employeeAnalysis);

    return {
      totalBudgeted,
      totalBilled,
      budgetVariance,
      utilizationRate,
      employeeAnalysis,
      teamSummary
    };

  } catch (error) {
    console.error('Failed to generate executive summary analysis:', error);
    throw new Error(`Executive summary analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}