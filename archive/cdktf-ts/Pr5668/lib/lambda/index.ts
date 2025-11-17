import { S3Event } from 'aws-lambda';
// eslint-disable-next-line import/no-extraneous-dependencies
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Processing document event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const key = record.s3.object.key;
    const size = record.s3.object.size;

    try {
      // Store metadata in DynamoDB
      await dynamodb
        .put({
          TableName: TABLE_NAME,
          Item: {
            documentId: key,
            uploadedAt: new Date().toISOString(),
            size,
            status: 'processed',
          },
        })
        .promise();

      console.log(`Metadata stored for document: ${key}`);
    } catch (error) {
      console.error(`Error processing document ${key}:`, error);
      throw error;
    }
  }
};
