const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const dynamodbClient = new DynamoDBClient({});
const snsClient = new SNSClient({});
const s3Client = new S3Client({});

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract S3 event details from EventBridge event
    const s3Event = event.detail;
    const bucketName = s3Event.bucket.name;
    const objectKey = s3Event.object.key;
    const objectSize = s3Event.object.size;

    console.log(`Processing S3 object: s3://${bucketName}/${objectKey}`);

    // Get object metadata from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );

    // Store metadata in DynamoDB
    const timestamp = Date.now();
    const dynamodbParams = {
      TableName: DYNAMODB_TABLE,
      Item: {
        id: { S: objectKey },
        timestamp: { N: timestamp.toString() },
        bucket: { S: bucketName },
        size: { N: objectSize.toString() },
        contentType: { S: s3Response.ContentType || "unknown" },
        environment: { S: ENVIRONMENT },
        processedAt: { S: new Date().toISOString() },
        status: { S: "processed" },
      },
    };

    await dynamodbClient.send(new PutItemCommand(dynamodbParams));
    console.log(`Metadata stored in DynamoDB: ${objectKey}`);

    // Send notification to SNS
    const snsMessage = {
      event: "Object Processed",
      environment: ENVIRONMENT,
      bucket: bucketName,
      key: objectKey,
      size: objectSize,
      timestamp: new Date().toISOString(),
    };

    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `Data Processing Complete - ${ENVIRONMENT}`,
        Message: JSON.stringify(snsMessage, null, 2),
      })
    );

    console.log("SNS notification sent successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Processing completed successfully",
        objectKey: objectKey,
        environment: ENVIRONMENT,
      }),
    };
  } catch (error) {
    console.error("Error processing event:", error);

    // Send error notification
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: `Data Processing Error - ${ENVIRONMENT}`,
          Message: JSON.stringify({
            error: error.message,
            event: JSON.stringify(event),
            environment: ENVIRONMENT,
            timestamp: new Date().toISOString(),
          }, null, 2),
        })
      );
    } catch (snsError) {
      console.error("Failed to send error notification:", snsError);
    }

    throw error;
  }
};
