import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3Event, S3Handler } from 'aws-lambda';

const s3Client = new S3Client({});

interface S3ProcessingResult {
  bucket: string;
  key: string;
  size: number;
  lastModified: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export const handler: S3Handler = async (event: S3Event) => {
  console.log('Processing S3 event:', JSON.stringify(event, null, 2));

  const results: S3ProcessingResult[] = [];

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const size = record.s3.object.size;

      console.log(`Processing object: ${bucket}/${key} (${size} bytes)`);

      // Get object metadata for processing
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(getObjectCommand);

      const processingResult: S3ProcessingResult = {
        bucket,
        key,
        size,
        lastModified:
          response.LastModified?.toISOString() || new Date().toISOString(),
        contentType: response.ContentType,
        metadata: response.Metadata,
      };

      // Create processing summary and store it back to S3
      const summaryKey = `processed-summaries/${key.replace(/[^a-zA-Z0-9]/g, '_')}_summary.json`;
      const summaryData = {
        ...processingResult,
        processedAt: new Date().toISOString(),
        processingVersion: '1.0',
        eventSource: record.eventSource,
        eventName: record.eventName,
      };

      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: summaryKey,
        Body: JSON.stringify(summaryData, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'original-key': key,
          'processing-timestamp': new Date().toISOString(),
        },
      });

      await s3Client.send(putCommand);

      console.log(`Created processing summary: ${bucket}/${summaryKey}`);
      results.push(processingResult);
    } catch (error) {
      console.error('Error processing S3 object:', error);
      throw error;
    }
  }

  console.log(`Successfully processed ${results.length} S3 objects`);
};
