const AWS = require('aws-sdk');
const XRay = require('aws-xray-sdk-core');
const AWSXRay = XRay.captureAWS(require('aws-sdk'));

const dynamo = new AWSXRay.DynamoDB.DocumentClient();
const ssm = new AWSXRay.SSM();

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  const tableName = process.env.TABLE_NAME;
  const apiKeyParam = process.env.API_KEY_PARAM;

  try {
    // Read secure API key at runtime from SSM SecureString
    let apiKey = 'not-provided';
    if (apiKeyParam) {
      const resp = await ssm.getParameter({ Name: apiKeyParam, WithDecryption: true }).promise();
      apiKey = resp.Parameter?.Value || apiKey;
    }

    // Example real-world use case: fetch recent items and transform
    const result = await dynamo.scan({ TableName: tableName, Limit: 10 }).promise();
    const items = (result.Items || []).map((it) => ({
      id: it.id,
      processedAt: new Date().toISOString(),
      summary: JSON.stringify(it).slice(0, 200)
    }));

    // Emit an audit log to console (captured by CloudWatch)
    console.info('Processed items count:', items.length, 'apiKeyUsed:', !!apiKey);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'ok', items })
    };
  } catch (err) {
    console.error('Handler error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'internal' }) };
  }
};
