import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Event } from 'aws-lambda';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface DocumentMetadata {
  documentId: string;
  uploadTimestamp: number;
  fileName: string;
  bucket: string;
  key: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  status: string;
  processedAt: string;
  userId: string;
}

interface ErrorDocumentMetadata extends DocumentMetadata {
  error: string;
  errorType: string;
}

export const handler = async (event: S3Event): Promise<void> => {
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
        const documentId = key.split('/').pop()?.split('.')[0] || 'unknown';
        const uploadTimestamp = Date.now();
        const metadata: DocumentMetadata = {
          documentId,
          uploadTimestamp,
          fileName: key.split('/').pop() || 'unknown',
          bucket,
          key,
          size: objectInfo.ContentLength || 0,
          contentType: objectInfo.ContentType || 'application/octet-stream',
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
      } catch (error: any) {
        console.error('Error processing document:', error);

        // Handle specific error types
        let errorStatus = 'error';
        let errorDetails = error.message || 'Unknown error';

        if (error.name === 'NoSuchKey') {
          errorStatus = 's3_not_found';
          errorDetails = 'S3 object not found';
        } else if (error.name === 'AccessDeniedException') {
          errorStatus = 'access_denied';
          errorDetails = 'Access denied to S3 or DynamoDB';
        } else if (error.name === 'ResourceNotFoundException') {
          errorStatus = 'table_not_found';
          errorDetails = 'DynamoDB table not found';
        } else if (error.name === 'ProvisionedThroughputExceededException') {
          errorStatus = 'throughput_exceeded';
          errorDetails = 'DynamoDB throughput exceeded';
        }

        // Store error information with enhanced details
        try {
          const errorMetadata: ErrorDocumentMetadata = {
            documentId: key.split('/').pop()?.split('.')[0] || 'unknown',
            uploadTimestamp: Date.now(),
            fileName: key.split('/').pop() || 'unknown',
            bucket,
            key,
            size: 0,
            contentType: 'application/octet-stream',
            uploadedAt: new Date().toISOString(),
            status: errorStatus,
            error: errorDetails,
            errorType: error.name || 'UnknownError',
            processedAt: new Date().toISOString(),
            userId: key.split('/')[1] || 'anonymous',
          };

          await docClient.send(
            new PutCommand({
              TableName: process.env.DOCUMENTS_TABLE,
              Item: errorMetadata,
            })
          );
        } catch (dbError: any) {
          console.error(
            'Failed to store error information in DynamoDB:',
            dbError
          );
        }
      }
    }
  }
};
