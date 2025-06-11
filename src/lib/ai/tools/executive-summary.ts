import { tool } from 'ai';
import { executiveSummaryParamsSchema } from '@/lib/schemas/chat';
import { getExecutiveSummaryAnalysis } from '@/lib/data/executiveSummaryData';

export const getExecutiveSummary = tool({
  description: 'Get executive summary of budget performance with key metrics and recommendations',
  parameters: executiveSummaryParamsSchema,
  execute: async ({ period, team }) => {
    try {
      console.log(`Generating executive summary for period: ${period}, team: ${team || 'All Teams'}`);
      
      // Fetch and analyze real data
      const analysisData = await getExecutiveSummaryAnalysis(period);
      
      // Generate recommendations based on the analysis
      const recommendations: string[] = [];
      const alerts: Array<{ type: string; message: string }> = [];
      
      // Analyze variance and generate recommendations
      const variancePercentage = analysisData.totalBudgeted > 0 
        ? (analysisData.budgetVariance / analysisData.totalBudgeted) * 100 
        : 0;

      if (Math.abs(variancePercentage) > 10) {
        if (variancePercentage > 0) {
          recommendations.push(`Total hours are ${variancePercentage.toFixed(1)}% over budget - review resource allocation and project scope`);
          alerts.push({
            type: 'warning',
            message: `Team is trending ${variancePercentage.toFixed(1)}% over budget this period`
          });
        } else {
          recommendations.push(`Total hours are ${Math.abs(variancePercentage).toFixed(1)}% under budget - consider increasing utilization or reallocating resources`);
          alerts.push({
            type: 'info',
            message: `Team has ${Math.abs(variancePercentage).toFixed(1)}% unutilized budget capacity`
          });
        }
      }

      // Team-specific recommendations
      Object.entries(analysisData.teamSummary).forEach(([teamName, teamData]) => {
        const teamVariancePercentage = teamData.budgeted > 0 
          ? (teamData.variance / teamData.budgeted) * 100 
          : 0;
          
        if (Math.abs(teamVariancePercentage) > 15) {
          if (teamVariancePercentage > 0) {
            recommendations.push(`${teamName} team is ${teamVariancePercentage.toFixed(1)}% over budget - review workload and project priorities`);
          } else {
            recommendations.push(`${teamName} team is ${Math.abs(teamVariancePercentage).toFixed(1)}% under budget - consider additional project assignments`);
          }
        }
      });

      // Individual performance alerts
      const highVarianceEmployees = analysisData.employeeAnalysis.filter(emp => Math.abs(emp.variancePercentage) > 20);
      if (highVarianceEmployees.length > 0) {
        recommendations.push(`Review individual performance for ${highVarianceEmployees.length} employees with >20% variance from budget`);
      }

      // Calculate additional metrics
      const averageHourlyRate = analysisData.totalBilled > 0 ? 50 : 0; // Placeholder - would need rate data
      const employeesOverBudget = analysisData.employeeAnalysis.filter(emp => emp.variance > 0).length;
      const employeesUnderBudget = analysisData.employeeAnalysis.filter(emp => emp.variance < 0).length;
      const employeesOnTrack = analysisData.employeeAnalysis.filter(emp => Math.abs(emp.variancePercentage) <= 5).length;

      return {
        period,
        team: team || 'All Teams',
        totalBudgeted: analysisData.totalBudgeted,
        totalBilled: analysisData.totalBilled,
        budgetVariance: variancePercentage,
        utilizationRate: analysisData.utilizationRate,
        keyMetrics: {
          budgetedHours: analysisData.totalBudgeted,
          billedHours: analysisData.totalBilled,
          averageHourlyRate,
          employeesOnTrack,
          employeesOverBudget,
          employeesUnderBudget
        },
        teamSummary: analysisData.teamSummary,
        employeeAnalysis: analysisData.employeeAnalysis,
        recommendations,
        alerts
      };
      
    } catch (error) {
      console.error('Executive summary tool error:', error);
      
      // Fallback to basic error response
      return {
        period,
        team: team || 'All Teams',
        error: true,
        errorMessage: `Failed to generate executive summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        totalBudgeted: 0,
        totalBilled: 0,
        budgetVariance: 0,
        utilizationRate: 0,
        keyMetrics: {
          budgetedHours: 0,
          billedHours: 0,
          averageHourlyRate: 0,
          employeesOnTrack: 0,
          employeesOverBudget: 0,
          employeesUnderBudget: 0
        },
        recommendations: ['Unable to analyze data - please check database connection and data availability'],
        alerts: [{
          type: 'error',
          message: 'Executive summary generation failed - using fallback data'
        }]
      };
    }
  },
}); 