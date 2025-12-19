exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const tableName = process.env.TABLE_NAME;
  const environment = process.env.ENVIRONMENT;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'API function executed successfully',
      environment: environment,
      tableName: tableName,
      timestamp: new Date().toISOString()
    })
  };
};
