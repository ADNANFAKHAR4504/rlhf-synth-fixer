exports.handler = async (event, context) => {
  console.log('Lambda function triggered');
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Process each S3 event record
    for (const record of event.Records) {
      if (record.eventName && record.eventName.startsWith('ObjectCreated')) {
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(
          record.s3.object.key.replace(/\+/g, ' ')
        );
        const objectSize = record.s3.object.size;
        const eventTime = record.eventTime;
        const sourceIp = record.requestParameters?.sourceIPAddress || 'Unknown';

        // Log object details
        const logEntry = {
          timestamp: new Date().toISOString(),
          eventTime: eventTime,
          action: 'OBJECT_CREATED',
          bucket: bucketName,
          key: objectKey,
          size: objectSize,
          sizeInMB: (objectSize / (1024 * 1024)).toFixed(2),
          sourceIp: sourceIp,
          region: record.awsRegion,
          eventName: record.eventName,
          eTag: record.s3.object.eTag || 'N/A',
          versionId: record.s3.object.versionId || 'N/A',
        };

        console.log(
          'Object Creation Detected:',
          JSON.stringify(logEntry, null, 2)
        );

        // Log additional metadata from event
        console.log('Object Metadata:', {
          sequencer: record.s3.object.sequencer,
          bucketArn: record.s3.bucket.arn,
          requestId: record.responseElements?.['x-amz-request-id'] || 'N/A',
          principalId: record.userIdentity?.principalId || 'N/A',
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed S3 events',
        recordsProcessed: event.Records.length,
      }),
    };
  } catch (error) {
    console.error('Error processing S3 event:', error);

    // Handle specific error cases
    if (error.code === 'AccessDenied') {
      console.error('Access denied to S3 object. Check IAM permissions.');
    } else if (error.code === 'NoSuchKey') {
      console.error('S3 object not found. It may have been deleted.');
    } else if (error.code === 'RequestTimeout') {
      console.error('Request timeout. Consider increasing Lambda timeout.');
    }

    // Re-throw to mark Lambda execution as failed
    throw error;
  }
};
