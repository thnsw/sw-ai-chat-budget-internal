#!/usr/bin/env tsx

import { getExecutiveSummaryAnalysis } from '../src/lib/data/executiveSummaryData';

async function testExecutiveSummary() {
  console.log('🧪 Testing Executive Summary Data Analysis Function');
  console.log('='.repeat(60));
  
  const testPeriod = 'may 2025';
  const testTeams = ['CST III', 'CST IV', 'CST V'];
  
  try {
    // Test 1: All teams for May 2025
    console.log(`\n📊 TEST 1: Analyzing ALL TEAMS for period: ${testPeriod}`);
    console.log('⏳ Fetching and processing data...\n');
    
    const startTime = Date.now();
    const result = await getExecutiveSummaryAnalysis(testPeriod);
    const endTime = Date.now();
    
    console.log('✅ Analysis completed successfully!');
    console.log(`⏱️  Execution time: ${endTime - startTime}ms\n`);
    
    // Display overall metrics
    console.log('📈 OVERALL METRICS');
    console.log('─'.repeat(40));
    console.log(`Total Budgeted Hours: ${result.totalBudgeted.toFixed(2)}`);
    console.log(`Total Billed Hours: ${result.totalBilled.toFixed(2)}`);
    console.log(`Budget Variance: ${result.budgetVariance.toFixed(2)} hours`);
    console.log(`Utilization Rate: ${result.utilizationRate.toFixed(2)}%`);
    
    // Display team summary
    console.log('\n🏢 TEAM SUMMARY');
    console.log('─'.repeat(40));
    Object.entries(result.teamSummary).forEach(([teamName, teamData]) => {
      const variancePercentage = teamData.budgeted > 0 
        ? ((teamData.variance / teamData.budgeted) * 100).toFixed(1)
        : '0.0';
      
      console.log(`\n${teamName}:`);
      console.log(`  Budgeted: ${teamData.budgeted.toFixed(2)} hours`);
      console.log(`  Billed: ${teamData.billed.toFixed(2)} hours`);
      console.log(`  Variance: ${teamData.variance.toFixed(2)} hours (${variancePercentage}%)`);
      console.log(`  Employees: ${teamData.employeeCount}`);
    });
    
    // Display employee analysis (top 5 by variance)
    console.log('\n👥 EMPLOYEE ANALYSIS (Top 5 by absolute variance)');
    console.log('─'.repeat(60));
    
    const topVarianceEmployees = result.employeeAnalysis
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 5);
    
    topVarianceEmployees.forEach((employee, index) => {
      console.log(`\n${index + 1}. ${employee.initials} (${employee.team})`);
      console.log(`   Full Name: ${employee.fullName}`);
      console.log(`   Budgeted: ${employee.budgetedHours.toFixed(2)} hours`);
      console.log(`   Billed: ${employee.billedHours.toFixed(2)} hours`);
      console.log(`   Variance: ${employee.variance.toFixed(2)} hours (${employee.variancePercentage.toFixed(1)}%)`);
    });
    
    // Display summary statistics
    console.log('\n📊 SUMMARY STATISTICS');
    console.log('─'.repeat(40));
    console.log(`Total Employees Analyzed: ${result.employeeAnalysis.length}`);
    console.log(`Teams Analyzed: ${Object.keys(result.teamSummary).length}`);
    
    const overBudgetEmployees = result.employeeAnalysis.filter(emp => emp.variance > 0);
    const underBudgetEmployees = result.employeeAnalysis.filter(emp => emp.variance < 0);
    const onTrackEmployees = result.employeeAnalysis.filter(emp => Math.abs(emp.variancePercentage) <= 5);
    
    console.log(`Employees Over Budget: ${overBudgetEmployees.length}`);
    console.log(`Employees Under Budget: ${underBudgetEmployees.length}`);
    console.log(`Employees On Track (±5%): ${onTrackEmployees.length}`);
    
    // Raw data sample
    console.log('\n🔍 RAW DATA SAMPLE (First 3 employees)');
    console.log('─'.repeat(60));
    result.employeeAnalysis.slice(0, 3).forEach((employee, index) => {
      console.log(`${index + 1}. ${JSON.stringify(employee, null, 2)}`);
    });
    
    // Test 2: Individual team tests
    for (const team of testTeams) {
      console.log(`\n\n📊 TEST 2.${testTeams.indexOf(team) + 1}: Analyzing ${team} for period: ${testPeriod}`);
      console.log('='.repeat(60));
      
      try {
        const teamStartTime = Date.now();
        const teamResult = await getExecutiveSummaryAnalysis(testPeriod, team);
        const teamEndTime = Date.now();
        
        console.log(`✅ ${team} analysis completed!`);
        console.log(`⏱️  Execution time: ${teamEndTime - teamStartTime}ms\n`);
        
        console.log(`📈 ${team} METRICS`);
        console.log('─'.repeat(40));
        console.log(`Total Budgeted Hours: ${teamResult.totalBudgeted.toFixed(2)}`);
        console.log(`Total Billed Hours: ${teamResult.totalBilled.toFixed(2)}`);
        console.log(`Budget Variance: ${teamResult.budgetVariance.toFixed(2)} hours`);
        console.log(`Utilization Rate: ${teamResult.utilizationRate.toFixed(2)}%`);
        console.log(`Employees Analyzed: ${teamResult.employeeAnalysis.length}`);
        
        if (teamResult.employeeAnalysis.length > 0) {
          const topEmployee = teamResult.employeeAnalysis
            .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))[0];
          console.log(`Top Variance Employee: ${topEmployee.initials} (${topEmployee.variance.toFixed(2)} hours)`);
        }
        
      } catch (teamError) {
        console.error(`❌ ${team} test failed:`, teamError);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testExecutiveSummary()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 