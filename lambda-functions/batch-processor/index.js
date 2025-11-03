const { DynamoDBClient, UpdateItemCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  maxAttempts: 3,
  retryMode: "adaptive"
});

const s3Client = new S3Client({
  maxAttempts: 3,
  retryMode: "adaptive"
});

// Environment variables
const DATA_BUCKET = process.env.DATA_BUCKET;
const METADATA_TABLE = process.env.METADATA_TABLE;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS || "10");
const ENVIRONMENT = process.env.ENVIRONMENT;

// Exponential backoff retry logic
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Stream to string helper
async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

exports.handler = async (event) => {
  console.log(`Processing batch in environment: ${ENVIRONMENT}`);
  console.log(`Max connections: ${MAX_CONNECTIONS}`);
  console.log(`Event: ${JSON.stringify(event)}`);

  try {
    // Handle S3 event
    const record = event.Records?.[0];
    if (!record || record.eventSource !== 'aws:s3') {
      throw new Error('Invalid event source');
    }

    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    // Get file from S3 with retry
    const data = await retryWithBackoff(async () => {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      const response = await s3Client.send(command);
      return await streamToString(response.Body);
    });

    const jobData = JSON.parse(data);
    const jobId = jobData.jobId || key.split('/').pop().replace('.json', '');

    // Simulate batch processing
    console.log(`Processing ${jobId}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update metadata in DynamoDB with retry
    await retryWithBackoff(async () => {
      const command = new UpdateItemCommand({
        TableName: METADATA_TABLE,
        Key: {
          jobId: { S: jobId },
          timestamp: { N: (jobData.timestamp || Date.now()).toString() }
        },
        UpdateExpression: "SET #status = :status, processedAt = :processedAt",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": { S: "completed" },
          ":processedAt": { N: Date.now().toString() }
        }
      });
      return await dynamoClient.send(command);
    });

    console.log(`Successfully processed batch job: ${jobId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Batch processed successfully",
        jobId: jobId
      })
    };
  } catch (error) {
    console.error("Error processing batch:", error);
    throw error; // Let Lambda retry mechanism handle it
  }
};
