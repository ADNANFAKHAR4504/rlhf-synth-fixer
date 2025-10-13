const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const topicArn = process.env.SNS_TOPIC_ARN;

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;
    const objectSize = record.s3.object.size;

    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      const response = await s3Client.send(getObjectCommand);
      const bodyStream = response.Body;

      if (!bodyStream) {
        throw new Error('Empty object body');
      }

      const bodyBuffer = await streamToBuffer(bodyStream);
      const checksum = crypto.createHash('sha256').update(bodyBuffer).digest('hex');

      const clientId = objectKey.split('/')[0];
      const backupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      const putItemCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          backupId: { S: backupId },
          clientId: { S: clientId },
          timestamp: { N: timestamp.toString() },
          status: { S: 'VERIFIED' },
          size: { N: objectSize.toString() },
          checksum: { S: checksum },
          objectKey: { S: objectKey },
          bucketName: { S: bucketName },
        },
      });

      await dynamoClient.send(putItemCommand);

      const publishCommand = new PublishCommand({
        TopicArn: topicArn,
        Subject: 'Backup Verification Success',
        Message: JSON.stringify({
          backupId,
          clientId,
          objectKey,
          status: 'SUCCESS',
          checksum,
          timestamp: new Date(timestamp).toISOString(),
        }),
      });

      await snsClient.send(publishCommand);

    } catch (error) {
      console.error('Backup verification failed:', error);

      const publishCommand = new PublishCommand({
        TopicArn: topicArn,
        Subject: 'Backup Verification Failed',
        Message: JSON.stringify({
          objectKey,
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        }),
      });

      await snsClient.send(publishCommand);
      throw error;
    }
  }
};

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}