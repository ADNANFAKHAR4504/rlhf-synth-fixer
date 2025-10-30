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
    // Read secure API key at runtime from SSM SecureString. Missing parameter is non-fatal.
    let apiKey = 'not-provided';
    if (apiKeyParam) {
      try {
        const resp = await ssm.getParameter({ Name: apiKeyParam, WithDecryption: true }).promise();
        apiKey = resp.Parameter?.Value || apiKey;
      } catch (e) {
        // If the parameter does not exist, log and continue with default apiKey.
        // Other errors should still surface so they can be debugged.
        const code = e && e.code ? e.code : (e && e.name ? e.name : null);
        if (code === 'ParameterNotFound' || code === 'ParameterNotFoundException') {
          console.warn('SSM parameter not found, continuing without API key:', apiKeyParam);
        } else {
          // Re-throw unexpected errors to be handled by outer catch.
          throw e;
        }
      }
    }

    // Example real-world use case: fetch recent items and transform
    // Support POST to create an item (so API -> Lambda -> DynamoDB -> Stream flows work),
    // and default to listing items for GET.
    const method = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method) || 'GET';

    if (method === 'POST') {
      // create an item in DynamoDB
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
      } catch (e) {
        // ignore parse errors and treat as empty
        body = {};
      }
      const itemId = body.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const item = { id: itemId, ...body, createdAt: new Date().toISOString() };

      await dynamo.put({ TableName: tableName, Item: item }).promise();

      console.info('Created item', itemId);
      return {
        statusCode: 201,
        body: JSON.stringify({ itemId })
      };
    }

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
