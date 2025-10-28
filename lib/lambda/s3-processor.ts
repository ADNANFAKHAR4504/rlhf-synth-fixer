import { S3Event, S3Handler } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const snsClient = new SNSClient({});
const s3Client = new S3Client({});

/**
 * Lambda function to process S3 events and send notifications
 * Handles object creation, validates files, and sends SNS notifications
 */
export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  const snsTopicArn = process.env.SNS_TOPIC_ARN;
  const environment = process.env.ENVIRONMENT || 'unknown';

  console.log(`Processing S3 events in ${environment} environment`);

  for (const record of event.Records) {
    try {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const eventName = record.eventName;
      const size = record.s3.object.size;

      console.log(`Event: ${eventName}, Bucket: ${bucketName}, Key: ${objectKey}, Size: ${size} bytes`);

      // Get object metadata
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      const metadata = await s3Client.send(headCommand);

      // Validate file size (alert if > 100MB)
      const maxSizeBytes = 100 * 1024 * 1024;
      let alertMessage = '';

      if (size > maxSizeBytes) {
        alertMessage = `WARNING: Large file detected: ${objectKey} (${(size / 1024 / 1024).toFixed(2)} MB)`;
        console.warn(alertMessage);
      }

      // Prepare notification message
      const message = {
        event: eventName,
        bucket: bucketName,
        key: objectKey,
        size: size,
        sizeFormatted: `${(size / 1024 / 1024).toFixed(2)} MB`,
        contentType: metadata.ContentType || 'unknown',
        lastModified: metadata.LastModified?.toISOString(),
        encryption: metadata.ServerSideEncryption || 'none',
        versionId: metadata.VersionId,
        environment: environment,
        timestamp: new Date().toISOString(),
        alert: size > maxSizeBytes ? alertMessage : null,
      };

      // Send notification to SNS
      if (snsTopicArn) {
        const publishCommand = new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: `S3 Event: ${eventName} - ${environment}`,
          Message: JSON.stringify(message, null, 2),
          MessageAttributes: {
            eventType: {
              DataType: 'String',
              StringValue: eventName,
            },
            environment: {
              DataType: 'String',
              StringValue: environment,
            },
            bucketName: {
              DataType: 'String',
              StringValue: bucketName,
            },
          },
        });

        await snsClient.send(publishCommand);
        console.log(`Notification sent to SNS topic: ${snsTopicArn}`);
      }

      // Additional processing for JSON files
      if (objectKey.endsWith('.json')) {
        console.log(`JSON file detected: ${objectKey}`);

        // Could add JSON validation, schema checking, etc.
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });

        const response = await s3Client.send(getCommand);
        const jsonContent = await response.Body?.transformToString();

        if (jsonContent) {
          try {
            const parsed = JSON.parse(jsonContent);
            console.log(`JSON file successfully parsed. Keys: ${Object.keys(parsed).join(', ')}`);
          } catch (parseError) {
            console.error(`Invalid JSON file: ${objectKey}`, parseError);

            // Send alert for invalid JSON
            if (snsTopicArn) {
              await snsClient.send(new PublishCommand({
                TopicArn: snsTopicArn,
                Subject: `WARNING: Invalid JSON File - ${environment}`,
                Message: `Invalid JSON file detected: ${bucketName}/${objectKey}`,
              }));
            }
          }
        }
      }

    } catch (error) {
      console.error('Error processing S3 event:', error);

      // Send error notification
      if (snsTopicArn) {
        await snsClient.send(new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: `ERROR: S3 Processing Error - ${environment}`,
          Message: `Error processing S3 event: ${JSON.stringify(error, null, 2)}`,
        }));
      }

      throw error;
    }
  }
};
