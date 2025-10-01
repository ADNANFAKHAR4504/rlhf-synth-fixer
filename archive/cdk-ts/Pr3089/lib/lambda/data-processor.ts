import { Logger } from '@aws-lambda-powertools/logger';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Context, S3Event } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger({ serviceName: process.env.POWERTOOLS_SERVICE_NAME });
const metrics = new Metrics({
  namespace: process.env.POWERTOOLS_METRICS_NAMESPACE,
});
const tracer = new Tracer({ serviceName: process.env.POWERTOOLS_SERVICE_NAME });

const s3Client = tracer.captureAWSv3Client(new S3Client({}));
const dynamoClient = tracer.captureAWSv3Client(new DynamoDBClient({}));

const BUCKET_NAME = process.env.BUCKET_NAME!;
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: S3Event,
  context: Context
): Promise<void> => {
  const segment = tracer.getSegment();

  logger.info('Processing S3 event', {
    requestId: context.awsRequestId,
    eventRecords: event.Records.length,
  });

  metrics.addMetric('ProcessedEvents', MetricUnit.Count, event.Records.length);

  try {
    for (const record of event.Records) {
      const subsegment = segment?.addNewSubsegment('processRecord');

      try {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(
          record.s3.object.key.replace(/\+/g, ' ')
        );

        logger.info('Processing object', { bucket, key });

        // Create metadata entry
        const metadataId = uuidv4();
        const timestamp = Date.now();

        await dynamoClient.send(
          new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
              id: { S: metadataId },
              timestamp: { N: timestamp.toString() },
              status: { S: 'processing' },
              bucket: { S: bucket },
              key: { S: key },
              size: { N: record.s3.object.size.toString() },
              eventTime: { S: record.eventTime },
              ttl: { N: (timestamp + 86400000).toString() }, // 24 hours TTL
            },
          })
        );

        // Simulate processing (in real app, this would be actual processing logic)
        await processData(bucket, key);

        // Update status to completed
        await dynamoClient.send(
          new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: {
              id: { S: metadataId },
              timestamp: { N: timestamp.toString() },
            },
            UpdateExpression:
              'SET #status = :status, completedAt = :completedAt',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':status': { S: 'completed' },
              ':completedAt': { N: Date.now().toString() },
            },
          })
        );

        metrics.addMetric('ProcessedSuccessfully', MetricUnit.Count, 1);
        logger.info('Successfully processed object', {
          bucket,
          key,
          metadataId,
        });
      } catch (error) {
        logger.error('Error processing record', {
          error: error as Error,
          record: JSON.stringify(record),
        });

        metrics.addMetric('ProcessingErrors', MetricUnit.Count, 1);
        throw error;
      } finally {
        subsegment?.close();
      }
    }
  } catch (error) {
    logger.error('Handler error', { error: error as Error });
    throw error;
  } finally {
    metrics.publishStoredMetrics();
  }
};

async function processData(bucket: string, key: string): Promise<void> {
  const subsegment = tracer.getSegment()?.addNewSubsegment('processData');

  try {
    // Get object from S3
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(getCommand);
    const data = (await response.Body?.transformToString()) || '';

    // Simulate data processing with some async operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

    // Example: Transform and save processed data
    const processedData = {
      originalKey: key,
      processedAt: new Date().toISOString(),
      dataLength: data.length,
      // Add your processing logic here
    };

    const processedKey = `processed/${key}`;
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: processedKey,
      Body: JSON.stringify(processedData),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);

    logger.debug('Data processed successfully', {
      originalKey: key,
      processedKey,
    });
  } finally {
    subsegment?.close();
  }
}
