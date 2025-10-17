const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const s3Client = new S3Client({});

exports.handler = async (event) => {
  const bucketName = process.env.ARCHIVE_BUCKET;

  for (const record of event) {
    try {
      // Handle DynamoDB stream event from EventBridge Pipe
      const dynamoRecord = record.dynamodb || record;

      if (dynamoRecord.NewImage) {
        const newImage = unmarshall(dynamoRecord.NewImage);
        const transactionId = newImage.transactionId;
        const timestamp = newImage.timestamp || Date.now();

        // Archive the webhook payload to S3
        const key = `webhooks/${new Date(timestamp).toISOString().split('T')[0]}/${transactionId}.json`;

        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: JSON.stringify(newImage, null, 2),
          ContentType: 'application/json',
          Metadata: {
            transactionId: transactionId,
            vendorId: newImage.vendorId || 'unknown',
            archivedAt: new Date().toISOString(),
          },
        });

        await s3Client.send(putCommand);
        console.log(`Successfully archived transaction ${transactionId} to S3: ${key}`);
      }
    } catch (error) {
      console.error('Error archiving webhook:', error);
      throw error;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Webhooks archived successfully' }),
  };
};
