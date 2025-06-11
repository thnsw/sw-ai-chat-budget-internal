# CSV Reader Utility

This utility provides functions for reading and processing budget data from CSV files.

## Files

- `csvReader.ts` - Main CSV reading and processing utility

## Features

- Read budget2025.csv file from `data/budget/budget2025.csv`
- Parse CSV data with proper handling of semicolon delimiters
- Convert string values to numerical data for monthly hours
- Filter data by team or employee
- Calculate totals and aggregations
- Handle file errors gracefully

## Usage

```typescript
import { 
  readBudget2025, 
  processBudgetData, 
  getTeamBudgetData, 
  getEmployeeBudgetData,
  getTeamTotals 
} from './csvReader';

// Read raw CSV data
const rawData = await readBudget2025();

// Process data with numerical conversions
const processedData = processBudgetData(rawData);

// Get data for specific team
const teamData = await getTeamBudgetData('CST III');

// Get data for specific employee
const employeeData = await getEmployeeBudgetData('THN');

// Get team totals
const totals = await getTeamTotals();
```

## Data Structure

### Raw CSV Structure
- `Team`: Team name (e.g., 'CST III')
- `Description`: Task description
- `Employee`: Employee initials (e.g., 'THN')
- `TaskID`: Task identifier
- `202501`-`202512`: Monthly hours for each month in 2025

### Processed Data Structure
- `team`: Team name
- `description`: Task description  
- `employee`: Employee initials
- `taskId`: Task identifier
- `monthlyHours`: Object with month codes as keys and hours as numbers
- `totalHours`: Sum of all monthly hours

## Error Handling

All functions include proper error handling for:
- File not found errors
- CSV parsing errors
- Invalid data formats
- Missing or malformed values 