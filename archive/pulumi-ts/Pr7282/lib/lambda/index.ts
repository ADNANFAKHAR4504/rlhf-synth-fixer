import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});

interface S3Event {
  Records?: Array<{
    s3: {
      object: {
        key: string;
      };
    };
  }>;
}

export const handler = async (event: S3Event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const bucketName = process.env.BUCKET_NAME!;
  const auditTable = process.env.AUDIT_TABLE!;

  // Process S3 event
  for (const record of event.Records || []) {
    const s3Event = record.s3;
    const key = s3Event.object.key;

    if (!key) {
      // Skip records with missing key
      continue;
    }

    try {
      console.log(`Processing file: ${key}`);

      // Get object from S3
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(getCommand);

      // Log to audit table
      const timestamp = new Date().toISOString();
      const auditCommand = new PutItemCommand({
        TableName: auditTable,
        Item: {
          id: { S: `${timestamp}-${key}` },
          timestamp: { S: timestamp },
          action: { S: 'FILE_PROCESSED' },
          fileName: { S: key },
          status: { S: 'SUCCESS' },
        },
      });

      await dynamoClient.send(auditCommand);

      console.log(`Audit log created for: ${key}`);
    } catch (error) {
      console.error(`Error processing file ${key}:`, error);

      // Log error to audit table for this specific file
      try {
        const timestamp = new Date().toISOString();
        const auditCommand = new PutItemCommand({
          TableName: auditTable,
          Item: {
            id: { S: `${timestamp}-${key}-error` },
            timestamp: { S: timestamp },
            action: { S: 'FILE_PROCESSING_ERROR' },
            fileName: { S: key },
            error: { S: String(error) },
            status: { S: 'FAILED' },
          },
        });

        await dynamoClient.send(auditCommand);
      } catch (auditError) {
        console.error(`Failed to log error for ${key}:`, auditError);
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Processing complete' }),
  };
};
