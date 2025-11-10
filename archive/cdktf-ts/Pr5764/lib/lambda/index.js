/**
 * Data Processing Lambda Function
 * Processes data from S3 and tracks jobs in DynamoDB
 */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

// AWS Lambda runtime provides AWS_REGION automatically, but we use REGION from environment
const s3Client = new S3Client({ region: process.env.REGION || process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.REGION || process.env.AWS_REGION });

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;
const ENVIRONMENT = process.env.ENVIRONMENT;

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log(`Processing event in ${ENVIRONMENT} environment`, JSON.stringify(event, null, 2));

  try {
    const jobId = generateJobId();
    const timestamp = Date.now();

    // Create job tracking entry
    await createJobEntry(jobId, timestamp, 'STARTED');

    // Process data (example implementation)
    const result = await processData(event);

    // Update job status
    await updateJobEntry(jobId, timestamp, 'COMPLETED', result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data processing completed successfully',
        jobId,
        environment: ENVIRONMENT,
        result,
      }),
    };
  } catch (error) {
    console.error('Error processing data:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Data processing failed',
        error: error.message,
        environment: ENVIRONMENT,
      }),
    };
  }
};

/**
 * Generate unique job ID
 */
function generateJobId() {
  return `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create job tracking entry in DynamoDB
 */
async function createJobEntry(jobId, timestamp, status) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      jobId: { S: jobId },
      timestamp: { N: timestamp.toString() },
      status: { S: status },
      environment: { S: ENVIRONMENT },
      createdAt: { S: new Date().toISOString() },
    },
  };

  await dynamoClient.send(new PutItemCommand(params));
  console.log(`Created job entry: ${jobId} with status: ${status}`);
}

/**
 * Update job tracking entry
 */
async function updateJobEntry(jobId, timestamp, status, result) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      jobId: { S: jobId },
      timestamp: { N: timestamp.toString() },
      status: { S: status },
      environment: { S: ENVIRONMENT },
      completedAt: { S: new Date().toISOString() },
      result: { S: JSON.stringify(result) },
    },
  };

  await dynamoClient.send(new PutItemCommand(params));
  console.log(`Updated job entry: ${jobId} to status: ${status}`);
}

/**
 * Process data (example implementation)
 */
async function processData(event) {
  // Example data processing logic
  const data = {
    processedAt: new Date().toISOString(),
    environment: ENVIRONMENT,
    eventType: event.eventType || 'unknown',
    recordCount: event.records?.length || 0,
  };

  // Simulate processing work
  await new Promise((resolve) => setTimeout(resolve, 100));

  return data;
}
