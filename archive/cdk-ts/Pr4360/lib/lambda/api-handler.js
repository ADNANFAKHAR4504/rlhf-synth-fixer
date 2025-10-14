const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const bucketName = process.env.S3_BUCKET_NAME;

  try {
    // Log the request to S3
    const logKey = `requests/${Date.now()}-${event.requestContext?.requestId || 'unknown'}.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: logKey,
      Body: JSON.stringify({
        timestamp: new Date().toISOString(),
        event: event,
        environment: process.env.ENVIRONMENT
      }),
      ContentType: 'application/json'
    }));

    // Example: Store data in DynamoDB
    if (event.httpMethod === 'POST' && event.body) {
      const data = JSON.parse(event.body);
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: {
          id: event.requestContext?.requestId || `id-${Date.now()}`,
          timestamp: Date.now(),
          data: data,
          createdAt: new Date().toISOString()
        }
      }));
    }

    // Example: Read data from DynamoDB
    if (event.httpMethod === 'GET') {
      const result = await docClient.send(new ScanCommand({
        TableName: tableName,
        Limit: 10
      }));

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Request processed successfully',
          items: result.Items,
          environment: process.env.ENVIRONMENT
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Request processed successfully',
        requestId: event.requestContext?.requestId,
        environment: process.env.ENVIRONMENT
      })
    };
  } catch (error) {
    console.error('Error processing request:', error);

    // Try to log error to S3
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: `errors/${Date.now()}-error.json`,
        Body: JSON.stringify({
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          event: event
        }),
        ContentType: 'application/json'
      }));
    } catch (logError) {
      console.error('Failed to log error to S3:', logError);
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
