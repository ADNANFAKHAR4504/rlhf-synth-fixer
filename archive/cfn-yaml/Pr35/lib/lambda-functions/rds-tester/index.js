const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

const secretsManager = new AWS.SecretsManager();

let connection;

const getDbCredentials = async () => {
  try {
    const secret = await secretsManager
      .getSecretValue({
        SecretId: `/tapstack/${process.env.ENVIRONMENT_SUFFIX}/db/password`,
      })
      .promise();
    return JSON.parse(secret.SecretString);
  } catch (error) {
    console.error('Error retrieving database credentials:', error);
    throw error;
  }
};

const getConnection = async () => {
  if (!connection) {
    const dbCreds = await getDbCredentials();
    connection = await mysql.createConnection({
      host: process.env.DB_ENDPOINT,
      port: 3306,
      user: dbCreds.username,
      password: dbCreds.password,
      database: 'tapstackdb',
      timeout: 60000,
    });
  }
  return connection;
};

const executeQuery = async (query, params = []) => {
  try {
    const conn = await getConnection();
    console.log(`Executing query: ${query}`);
    console.log(`Parameters: ${JSON.stringify(params)}`);
    
    const [result] = await conn.execute(query, params);
    
    console.log(`Query executed successfully. Result:`, result);
    return {
      success: true,
      query,
      params,
      result,
      rowCount: Array.isArray(result) ? result.length : (result.affectedRows || 0),
      insertId: result.insertId || null
    };
  } catch (error) {
    console.error(`Query execution failed:`, error);
    return {
      success: false,
      query,
      params,
      error: error.message,
      code: error.code,
      sqlState: error.sqlState
    };
  }
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const { query, params = [] } = event;
    
    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Query parameter is required',
          example: {
            query: 'SELECT 1 as test',
            params: []
          }
        })
      };
    }

    const result = await executeQuery(query, params);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        database: 'tapstackdb',
        host: process.env.DB_ENDPOINT,
        ...result
      })
    };
    
  } catch (error) {
    console.error('Lambda execution error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack
      })
    };
  }
};