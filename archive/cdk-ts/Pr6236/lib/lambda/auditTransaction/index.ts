import { SQSEvent } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const transaction = JSON.parse(record.body);

      const auditLog = {
        ...transaction,
        auditedAt: Date.now(),
        messageId: record.messageId,
      };

      const key = `audit/${transaction.transactionId}-${Date.now()}.json`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: JSON.stringify(auditLog, null, 2),
          ContentType: 'application/json',
        })
      );

      console.log(`Audit log created: ${key}`);
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }
};
