const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});
const s3Client = new S3Client({});

exports.handler = async (event) => {
  console.log('Processing order:', JSON.stringify(event, null, 2));

  const environment = process.env.ENVIRONMENT;
  const tableName = process.env.DYNAMODB_TABLE;
  const queueName = process.env.SQS_QUEUE;
  const bucketName = process.env.S3_BUCKET;

  try {
    // Parse order from event
    const order = typeof event.body === 'string' ? JSON.parse(event.body) : event;

    // Validate order
    if (!order.orderId || !order.customerId || !order.amount) {
      throw new Error('Invalid order: missing required fields');
    }

    const timestamp = new Date().toISOString();
    const orderId = order.orderId;

    // Store order in DynamoDB
    await dynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          orderId: { S: orderId },
          customerId: { S: order.customerId },
          amount: { N: order.amount.toString() },
          status: { S: 'PENDING' },
          timestamp: { S: timestamp },
          environment: { S: environment },
        },
      })
    );

    // Send message to SQS for further processing
    const queueUrl = `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${queueName}`;
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          orderId,
          customerId: order.customerId,
          amount: order.amount,
          timestamp,
        }),
      })
    );

    // Archive order to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `orders/${timestamp.split('T')[0]}/${orderId}.json`,
        Body: JSON.stringify(order),
        ContentType: 'application/json',
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order processed successfully',
        orderId,
        environment,
      }),
    };
  } catch (error) {
    console.error('Error processing order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process order',
        error: error.message,
      }),
    };
  }
};
