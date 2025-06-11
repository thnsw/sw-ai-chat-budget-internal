import { tool } from 'ai';
import { teamPerformanceParamsSchema } from '@/lib/schemas/chat';

export const getTeamPerformance = tool({
  description: 'Analyze specific team budget performance with detailed breakdown and individual metrics',
  parameters: teamPerformanceParamsSchema,
  execute: async ({ teamName, period, includeIndividuals }) => {
    // Simulated delay for MVP demo
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Dummy data for MVP - will be replaced with real data integration
    const dummyData = {
      teamName,
      period,
      teamMetrics: {
        totalBudgeted: 180000,
        totalBilled: 195600,
        budgetVariance: 8.7,
        utilizationRate: 108.7,
        billableHours: 3200,
        nonBillableHours: 400,
        averageHourlyRate: 55,
        teamSize: 8,
        projectsAssigned: 4
      },
      performanceInsights: {
        trend: 'over_budget',
        efficiency: 'high',
        riskLevel: 'medium',
        notes: [
          'Team is performing well but exceeding budget due to scope creep',
          'High billable ratio indicates good client engagement',
          'Consider additional resources for upcoming sprint'
        ]
      },
      individualPerformance: includeIndividuals ? [
        {
          employeeName: 'Alice Johnson',
          role: 'Senior Developer',
          budgetedHours: 160,
          billedHours: 172,
          billableHours: 165,
          nonBillableHours: 7,
          utilizationRate: 107.5,
          hourlyRate: 65,
          projectsActive: 2
        },
        {
          employeeName: 'Bob Smith',
          role: 'Developer',
          budgetedHours: 160,
          billedHours: 158,
          billableHours: 150,
          nonBillableHours: 8,
          utilizationRate: 98.8,
          hourlyRate: 50,
          projectsActive: 1
        },
        {
          employeeName: 'Carol Davis',
          role: 'UI/UX Designer',
          budgetedHours: 120,
          billedHours: 125,
          billableHours: 115,
          nonBillableHours: 10,
          utilizationRate: 104.2,
          hourlyRate: 55,
          projectsActive: 3
        }
      ] : [],
      recommendations: [
        'Review project scope and timeline with client to manage budget expectations',
        'Consider promoting Bob Smith to senior role based on consistent performance',
        'Implement time tracking improvements to reduce non-billable overhead'
      ],
      actionItems: [
        {
          priority: 'high',
          item: 'Schedule budget review meeting with project stakeholders',
          dueDate: '2024-02-15'
        },
        {
          priority: 'medium',
          item: 'Evaluate resource allocation for Q2 planning',
          dueDate: '2024-02-28'
        }
      ]
    };
    
    return dummyData;
  },
}); 