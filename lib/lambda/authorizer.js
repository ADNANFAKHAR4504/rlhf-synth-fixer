const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async event => {
  console.log('Authorizer event:', JSON.stringify(event, null, 2));

  const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-Api-Key'];
  const httpMethod = event.httpMethod || event.requestContext?.httpMethod;

  if (!apiKey) {
    console.log('No API key provided');
    throw new Error('Unauthorized');
  }
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.API_KEYS_TABLE,
        Key: { apiKey },
      })
    );
    if (!result.Item || result.Item.status !== 'active') {
      console.log('API key not found or inactive:', apiKey);
      throw new Error('Unauthorized');
    }
    const permissions = result.Item.permissions || 'read';
    const userId = result.Item.userId || 'anonymous';

    console.log(
      'Found user:',
      userId,
      'with permissions:',
      permissions,
      'for method:',
      httpMethod
    );

    // Check permissions based on HTTP method
    let allow = true;
    if (
      httpMethod === 'POST' ||
      httpMethod === 'PUT' ||
      httpMethod === 'DELETE'
    ) {
      // Write operations require read-write or admin permissions
      allow = permissions === 'read-write' || permissions === 'admin';
    } else if (httpMethod === 'GET') {
      // Read operations allowed for all permission levels
      allow = true;
    }

    if (!allow) {
      console.log(
        'Insufficient permissions:',
        permissions,
        'for method:',
        httpMethod
      );
      throw new Error('Forbidden');
    }
    const policy = {
      principalId: userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
          },
        ],
      },
      context: {
        userId: userId,
        permissions: permissions,
      },
    };
    console.log(
      'Authorization successful for user:',
      userId,
      'with permissions:',
      permissions
    );
    return policy;
  } catch (error) {
    console.error('Authorization failed:', error.message);
    throw new Error('Unauthorized');
  }
};
