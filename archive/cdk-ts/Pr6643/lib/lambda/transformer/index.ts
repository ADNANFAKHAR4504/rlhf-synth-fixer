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
  valid: boolean;
  bucket: string;
  key: string;
  jobId: string;
  fileName: string;
  rowCount: number;
}

interface TransformResult {
  transformed: boolean;
  bucket: string;
  outputKey: string;
  jobId: string;
  fileName: string;
  rowCount: number;
  error?: string;
}

export const handler = async (event: Event): Promise<TransformResult> => {
  const startTime = Date.now();
  console.log('Transformer started:', JSON.stringify(event));

  if (!event.valid) {
    throw new Error('Cannot transform invalid data');
  }

  const { bucket, key, jobId, fileName, rowCount } = event;

  try {
    // Get CSV file from S3
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      throw new Error('Empty file');
    }

    const csvContent = await response.Body.transformToString();
    const lines = csvContent.trim().split('\n');
    const header = lines[0].split(',');
    const dataRows = lines.slice(1);

    // Transform to Parquet-like JSON structure (simulated)
    const transformedData = dataRows.map(row => {
      const values = row.split(',');
      const record: Record<string, string | number> = {};

      header.forEach((col, index) => {
        const value = values[index];
        // Convert numeric columns
        if (col === 'amount' || col === 'timestamp') {
          record[col] = parseFloat(value) || 0;
        } else {
          record[col] = value;
        }
      });

      return record;
    });

    // Store transformed data (JSON format for simplicity)
    const outputKey = key
      .replace('raw/', 'processed/')
      .replace('.csv', '.json');
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: outputKey,
      Body: JSON.stringify(transformedData, null, 2),
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
          'SET #status = :status, #outputKey = :outputKey, #transformTime = :time',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#outputKey': 'outputKey',
          '#transformTime': 'transformTime',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'transformed' },
          ':outputKey': { S: outputKey },
          ':time': { N: processingTime.toString() },
        },
      })
    );

    // Send custom metric
    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ETLPipeline',
        MetricData: [
          {
            MetricName: 'TransformSuccess',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'ProcessingLatency',
            Value: processingTime,
            Unit: 'Milliseconds',
            Timestamp: new Date(),
          },
        ],
      })
    );

    console.log(`Transformation succeeded: ${outputKey}`);

    return {
      transformed: true,
      bucket,
      outputKey,
      jobId,
      fileName,
      rowCount,
    };
  } catch (error) {
    console.error('Transformation failed:', error);

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
          'SET #status = :status, #error = :error, #transformTime = :time',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#error': 'error',
          '#transformTime': 'transformTime',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'transform_failed' },
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
            MetricName: 'TransformFailure',
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
