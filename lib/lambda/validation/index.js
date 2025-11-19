/**
 * Lambda function for database validation
 * Compares record counts and data integrity between source and target databases
 */

const { Client } = require('pg');

exports.handler = async (event) => {
  const sourceConfig = {
    host: process.env.SOURCE_DB_ENDPOINT,
    port: parseInt(process.env.DB_PORT),
    database: 'sourcedb',
    user: 'sourceuser',
    password: 'SourcePassword123!', // Should be from Secrets Manager
    ssl: { rejectUnauthorized: false },
  };

  const targetConfig = {
    host: process.env.TARGET_DB_ENDPOINT,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: 'dbadmin',
    password: 'ChangeMe123!', // Should be from Secrets Manager
    ssl: { rejectUnauthorized: false },
  };

  let sourceClient = null;
  let targetClient = null;

  try {
    // Connect to source database
    sourceClient = new Client(sourceConfig);
    await sourceClient.connect();

    // Connect to target database
    targetClient = new Client(targetConfig);
    await targetClient.connect();

    // Get list of tables from source
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;

    const tablesResult = await sourceClient.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);

    const validationResults = [];

    // Compare record counts for each table
    for (const table of tables) {
      const sourceCountQuery = `SELECT COUNT(*) as count FROM ${table}`;
      const targetCountQuery = `SELECT COUNT(*) as count FROM ${table}`;

      const sourceCountResult = await sourceClient.query(sourceCountQuery);
      const targetCountResult = await targetClient.query(targetCountQuery);

      const sourceCount = parseInt(sourceCountResult.rows[0].count);
      const targetCount = parseInt(targetCountResult.rows[0].count);

      validationResults.push({
        table: table,
        sourceCount: sourceCount,
        targetCount: targetCount,
        match: sourceCount === targetCount,
        difference: Math.abs(sourceCount - targetCount),
      });
    }

    const allMatch = validationResults.every(result => result.match);

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        validationTime: new Date().toISOString(),
        totalTables: tables.length,
        allMatch: allMatch,
        results: validationResults,
      }),
    };

    return response;

  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        validationTime: new Date().toISOString(),
      }),
    };
  } finally {
    if (sourceClient) {
      await sourceClient.end();
    }
    if (targetClient) {
      await targetClient.end();
    }
  }
};
