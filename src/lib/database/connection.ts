import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration interface
interface DatabaseConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  driver: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

// Get database configuration from environment variables
function getDatabaseConfig(): DatabaseConfig {
  const server = process.env.DATABASE_SERVER;
  const database = process.env.DATABASE_NAME;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const driver = process.env.DATABASE_DRIVER || 'ODBC Driver 17 for SQL Server';

  if (!server || !database || !user || !password) {
    throw new Error('Missing required database environment variables');
  }

  return {
    server,
    database,
    user,
    password,
    driver,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };
}

// Create and return a database connection
export async function createConnection(): Promise<sql.ConnectionPool> {
  try {
    console.log('Attempting to connect to MSSQL database...');
    
    const config = getDatabaseConfig();
    const pool = new sql.ConnectionPool(config);
    
    await pool.connect();
    console.log('Successfully connected to MSSQL database');
    
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Execute a query with error handling
export async function executeQuery<T = any>(
  query: string,
  parameters?: Record<string, any>
): Promise<sql.IResult<T>> {
  let connection: sql.ConnectionPool | null = null;
  
  try {
    console.log('Executing query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
    
    connection = await createConnection();
    const request = connection.request();
    
    // Add parameters if provided
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        request.input(key, value);
      });
    }
    
    const result = await request.query(query);
    console.log(`Query executed successfully, returned ${result.recordset.length} rows`);
    
    return result;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// Test database connectivity
export async function testConnection(): Promise<boolean> {
  try {
    console.log('Testing database connection...');
    const result = await executeQuery('SELECT 1 as test');
    
    if (result.recordset.length > 0 && result.recordset[0].test === 1) {
      console.log('Database connection test passed');
      return true;
    } else {
      console.error('Database connection test failed - unexpected result');
      return false;
    }
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
} 