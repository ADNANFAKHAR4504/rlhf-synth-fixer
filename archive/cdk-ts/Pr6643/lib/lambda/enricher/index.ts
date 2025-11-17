import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

interface Event {
  transformed: boolean;
  bucket: string;
  outputKey: string;
  jobId: string;
  fileName: string;
  rowCount: number;
}

interface EnrichResult {
  enriched: boolean;
  bucket: string;
  enrichedKey: string;
  jobId: string;
  fileName: string;
  rowCount: number;
}

export const handler = async (event: Event): Promise<EnrichResult> => {
  const startTime = Date.now();
  console.log('Enricher started:', JSON.stringify(event));

  if (!event.transformed) {
    throw new Error('Cannot enrich non-transformed data');
  }

  const { bucket, outputKey, jobId, fileName, rowCount } = event;

  try {
    // Get transformed data from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: outputKey,
    });
    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      throw new Error('Empty file');
    }

    const transformedContent = await response.Body.transformToString();
    const records = JSON.parse(transformedContent) as Record<
      string,
      string | number
    >[];

    // Enrich each record with metadata
    const enrichedRecords = await Promise.all(
      records.map(async (record: Record<string, string | number>) => {
        // Add processing metadata
        const enriched = {
          ...record,
          enrichment_timestamp: Date.now(),
          processing_job_id: jobId,
          data_source: 'financial_partners',
          record_version: '1.0',
          // In production, would fetch additional data from DynamoDB based on merchant_id
          enrichment_status: 'completed',
        };

        return enriched;
      })
    );

    // Store enriched data
    const enrichedKey = outputKey.replace('processed/', 'enriched/');
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: enrichedKey,
      Body: JSON.stringify(enrichedRecords, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putObjectCommand);

    const processingTime = Date.now() - startTime;

    // Update metadata
    await dynamoClient.send(
      new UpdateItemCommand({
        TableName: process.env.METADATA_TABLE!,
        Key: {
          jobId: { S: jobId },
          fileName: { S: fileName },
        },
        UpdateExpression:
          'SET #status = :status, #enrichedKey = :enrichedKey, #enrichTime = :time, #completedAt = :completed',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#enrichedKey': 'enrichedKey',
          '#enrichTime': 'enrichTime',
          '#completedAt': 'completedAt',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'completed' },
          ':enrichedKey': { S: enrichedKey },
          ':time': { N: processingTime.toString() },
          ':completed': { N: Date.now().toString() },
        },
      })
    );

    // Send custom metrics
    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ETLPipeline',
        MetricData: [
          {
            MetricName: 'EnrichmentSuccess',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'SuccessRate',
            Value: 100,
            Unit: 'Percent',
            Timestamp: new Date(),
          },
        ],
      })
    );

    console.log(`Enrichment succeeded: ${enrichedKey}`);

    return {
      enriched: true,
      bucket,
      enrichedKey,
      jobId,
      fileName,
      rowCount,
    };
  } catch (error) {
    console.error('Enrichment failed:', error);

    const processingTime = Date.now() - startTime;

    // Update metadata with error
    await dynamoClient.send(
      new UpdateItemCommand({
        TableName: process.env.METADATA_TABLE!,
        Key: {
          jobId: { S: jobId },
          fileName: { S: fileName },
        },
        UpdateExpression:
          'SET #status = :status, #error = :error, #enrichTime = :time',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#error': 'error',
          '#enrichTime': 'enrichTime',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'enrichment_failed' },
          ':error': {
            S: error instanceof Error ? error.message : 'Unknown error',
          },
          ':time': { N: processingTime.toString() },
        },
      })
    );

    // Send failure metric
    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ETLPipeline',
        MetricData: [
          {
            MetricName: 'EnrichmentFailure',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'FailureRate',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );

    throw error;
  }
};
