/**
 * Database Migration Validation Lambda Function
 * 
 * This Lambda function validates data consistency between source and target databases
 * during the DMS migration process. It performs row count comparisons and data integrity checks.
 */

const { Client } = require('pg');

/**
 * Create a PostgreSQL client connection
 */
function createClient(endpoint, dbName = 'paymentdb', port = 5432) {
  return new Client({
    host: endpoint,
    port: port,
    database: dbName,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Get row count from a table
 */
async function getTableCount(client, tableName) {
  try {
    const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error(`Error counting rows in ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Get list of tables in the database
 */
async function getTables(client) {
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Error fetching table list:', error.message);
    return [];
  }
}

/**
 * Validate migration between source and target databases
 */
async function validateMigration() {
  const sourceEndpoint = process.env.SOURCE_DB_ENDPOINT;
  const targetEndpoint = process.env.TARGET_DB_ENDPOINT;
  const dbName = process.env.DB_NAME || 'paymentdb';
  const dbPort = parseInt(process.env.DB_PORT || '5432');

  console.log('Starting migration validation...');
  console.log(`Source: ${sourceEndpoint}`);
  console.log(`Target: ${targetEndpoint}`);

  let sourceClient = null;
  let targetClient = null;

  try {
    // Connect to source database
    console.log('Connecting to source database...');
    sourceClient = createClient(sourceEndpoint, dbName, dbPort);
    await sourceClient.connect();
    console.log('Connected to source database');

    // Connect to target database
    console.log('Connecting to target database...');
    targetClient = createClient(targetEndpoint, dbName, dbPort);
    await targetClient.connect();
    console.log('Connected to target database');

    // Get list of tables from source
    const sourceTables = await getTables(sourceClient);
    console.log(`Found ${sourceTables.length} tables in source database`);

    // Validate each table
    const validationResults = [];
    for (const tableName of sourceTables) {
      try {
        const sourceCount = await getTableCount(sourceClient, tableName);
        const targetCount = await getTableCount(targetClient, tableName);
        
        const isValid = sourceCount === targetCount;
        const result = {
          table: tableName,
          sourceCount,
          targetCount,
          valid: isValid,
          difference: Math.abs(sourceCount - targetCount)
        };
        
        validationResults.push(result);
        
        if (isValid) {
          console.log(`✓ ${tableName}: ${sourceCount} rows (matched)`);
        } else {
          console.log(`✗ ${tableName}: source=${sourceCount}, target=${targetCount} (MISMATCH)`);
        }
      } catch (error) {
        console.error(`Error validating table ${tableName}:`, error.message);
        validationResults.push({
          table: tableName,
          error: error.message,
          valid: false
        });
      }
    }

    // Calculate overall validation status
    const totalTables = validationResults.length;
    const validTables = validationResults.filter(r => r.valid).length;
    const invalidTables = totalTables - validTables;

    const summary = {
      timestamp: new Date().toISOString(),
      totalTables,
      validTables,
      invalidTables,
      validationRate: totalTables > 0 ? (validTables / totalTables * 100).toFixed(2) : 0,
      details: validationResults
    };

    console.log('\n=== Validation Summary ===');
    console.log(`Total tables: ${totalTables}`);
    console.log(`Valid: ${validTables}`);
    console.log(`Invalid: ${invalidTables}`);
    console.log(`Validation rate: ${summary.validationRate}%`);

    return summary;

  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  } finally {
    // Close connections
    if (sourceClient) {
      try {
        await sourceClient.end();
        console.log('Source connection closed');
      } catch (e) {
        console.error('Error closing source connection:', e.message);
      }
    }
    if (targetClient) {
      try {
        await targetClient.end();
        console.log('Target connection closed');
      } catch (e) {
        console.error('Error closing target connection:', e.message);
      }
    }
  }
}

/**
 * Lambda handler function
 */
exports.handler = async (event, context) => {
  console.log('Database validation Lambda invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const validationResults = await validateMigration();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Migration validation completed',
        results: validationResults
      })
    };
  } catch (error) {
    console.error('Lambda execution failed:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Migration validation failed',
        error: error.message,
        stack: error.stack
      })
    };
  }
};
