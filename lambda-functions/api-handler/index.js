const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

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

exports.handler = async (event) => {
  console.log(`Processing API request in environment: ${ENVIRONMENT}`);
  console.log(`Max connections: ${MAX_CONNECTIONS}`);

  try {
    const jobId = event.jobId || `job-${Date.now()}`;
    const timestamp = Date.now();

    // Store metadata in DynamoDB with retry
    await retryWithBackoff(async () => {
      const command = new PutItemCommand({
        TableName: METADATA_TABLE,
        Item: {
          jobId: { S: jobId },
          timestamp: { N: timestamp.toString() },
          status: { S: "processing" },
          requestData: { S: JSON.stringify(event) }
        }
      });
      return await dynamoClient.send(command);
    });

    // Store data in S3 with retry
    await retryWithBackoff(async () => {
      const command = new PutObjectCommand({
        Bucket: DATA_BUCKET,
        Key: `incoming/${jobId}.json`,
        Body: JSON.stringify(event),
        ContentType: "application/json"
      });
      return await s3Client.send(command);
    });

    console.log(`Successfully processed job: ${jobId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Job submitted successfully",
        jobId: jobId
      })
    };
  } catch (error) {
    console.error("Error processing request:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing job",
        error: error.message
      })
    };
  }
};
