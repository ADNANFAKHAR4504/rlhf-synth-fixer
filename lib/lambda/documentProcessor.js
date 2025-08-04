const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async event => {
  console.log('Document processor event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName && record.eventName.startsWith('ObjectCreated')) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      try {
        // Get object metadata
        const objectInfo = await s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );

        // Extract document metadata
        const documentId = key.split('/').pop().split('.')[0];
        const uploadTimestamp = Date.now();
        const metadata = {
          documentId,
          uploadTimestamp,
          fileName: key.split('/').pop(),
          bucket,
          key,
          size: objectInfo.ContentLength,
          contentType: objectInfo.ContentType,
          uploadedAt: new Date().toISOString(),
          status: 'processed',
          processedAt: new Date().toISOString(),
          userId: key.split('/')[1] || 'anonymous', // Extract userId from path
        };

        // Store metadata in DynamoDB
        await docClient.send(
          new PutCommand({
            TableName: process.env.DOCUMENTS_TABLE,
            Item: metadata,
          })
        );

        console.log('Successfully processed document:', documentId);
      } catch (error) {
        console.error('Error processing document:', error);

        // Store error information
        await docClient.send(
          new PutCommand({
            TableName: process.env.DOCUMENTS_TABLE,
            Item: {
              documentId: key.split('/').pop().split('.')[0],
              uploadTimestamp: Date.now(),
              fileName: key.split('/').pop(),
              bucket,
              key,
              status: 'error',
              error: error.message,
              processedAt: new Date().toISOString(),
              userId: key.split('/')[1] || 'anonymous',
            },
          })
        );
      }
    }
  }
};
