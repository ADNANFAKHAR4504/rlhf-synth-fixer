const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log("DataIngestion triggered", JSON.stringify(event));

  try {
    // Process S3 event
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = record.s3.object.key;

      console.log(`Processing file: ${bucket}/${key}`);

      // Simulate data processing
      const marketData = {
        symbol: key.split('/')[0] || 'UNKNOWN',
        timestamp: Date.now(),
        source: bucket,
        key: key,
      };

      // Send message to SQS
      const sqsParams = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(marketData),
      };

      await sqsClient.send(new SendMessageCommand(sqsParams));
      console.log("Message sent to SQS");

      // Store initial state in DynamoDB
      const dynamoParams = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: {
          symbol: { S: marketData.symbol },
          timestamp: { N: marketData.timestamp.toString() },
          status: { S: "ingested" },
          source: { S: bucket },
          key: { S: key },
        },
      };

      await dynamoClient.send(new PutItemCommand(dynamoParams));
      console.log("Data stored in DynamoDB");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data ingestion successful" }),
    };
  } catch (error) {
    console.error("ERROR:", error);
    throw error;
  }
};
