import { Callback, Context, S3Event } from 'aws-lambda';

export const handler = async (
  event: S3Event,
  context: Context,
  callback: Callback
) => {
  console.log('Audit Lambda triggered by S3 event');

  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, ' ')
      );
      const eventName = record.eventName;

      console.log(`Processing S3 event: ${eventName}`);
      console.log(`Bucket: ${bucketName}`);
      console.log(`Object: ${objectKey}`);
      console.log(`Size: ${record.s3.object.size} bytes`);

      // Audit logging - in production, this would write to CloudWatch Logs,
      // send to a SIEM, or store in a dedicated audit database
      const auditLog = {
        timestamp: new Date().toISOString(),
        eventName,
        bucketName,
        objectKey,
        size: record.s3.object.size,
        sourceIp: record.requestParameters?.sourceIPAddress || 'unknown',
        userIdentity: record.userIdentity || 'unknown',
      };

      console.log('Audit Log Entry:', JSON.stringify(auditLog, null, 2));

      // Here you would typically:
      // 1. Validate the object meets security requirements
      // 2. Check for sensitive data patterns
      // 3. Log to a centralized audit system
      // 4. Send alerts for suspicious activity
    }

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Audit processing completed successfully',
        processedRecords: event.Records.length,
      }),
    });
  } catch (error) {
    console.error('Error processing audit event:', error);
    callback(error instanceof Error ? error : new Error(String(error)));
  }
};
