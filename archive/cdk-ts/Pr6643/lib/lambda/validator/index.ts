import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const cloudwatchClient = new CloudWatchClient({});

interface Event {
  bucket: string;
  key: string;
  jobId: string;
}

interface ValidationResult {
  valid: boolean;
  bucket: string;
  key: string;
  jobId: string;
  fileName: string;
  rowCount?: number;
  error?: string;
}

export const handler = async (event: Event): Promise<ValidationResult> => {
  const startTime = Date.now();
  console.log('Validator started:', JSON.stringify(event));

  const { bucket, key, jobId } = event;
  const fileName = key.split('/').pop() || key;

  try {
    // Get CSV file from S3
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      throw new Error('Empty file');
    }

    const csvContent = await response.Body.transformToString();
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    // Validate header
    const header = lines[0].split(',');
    const requiredColumns = [
      'transaction_id',
      'amount',
      'timestamp',
      'merchant_id',
    ];

    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Validate data rows
    const dataRows = lines.slice(1);
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i].split(',');
      if (row.length !== header.length) {
        throw new Error(`Row ${i + 2} has incorrect number of columns`);
      }

      // Validate transaction_id is not empty
      if (!row[header.indexOf('transaction_id')]) {
        throw new Error(`Row ${i + 2} has empty transaction_id`);
      }

      // Validate amount is a number
      const amount = row[header.indexOf('amount')];
      if (isNaN(parseFloat(amount))) {
        throw new Error(`Row ${i + 2} has invalid amount: ${amount}`);
      }
    }

    const processingTime = Date.now() - startTime;

    // Update metadata in DynamoDB
    await dynamoClient.send(
      new PutItemCommand({
        TableName: process.env.METADATA_TABLE!,
        Item: {
          jobId: { S: jobId },
          fileName: { S: fileName },
          status: { S: 'validated' },
          timestamp: { N: Date.now().toString() },
          rowCount: { N: dataRows.length.toString() },
          processingTime: { N: processingTime.toString() },
        },
      })
    );

    // Send custom metric
    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ETLPipeline',
        MetricData: [
          {
            MetricName: 'ValidationSuccess',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );

    console.log(`Validation succeeded: ${dataRows.length} rows validated`);

    return {
      valid: true,
      bucket,
      key,
      jobId,
      fileName,
      rowCount: dataRows.length,
    };
  } catch (error) {
    console.error('Validation failed:', error);

    const processingTime = Date.now() - startTime;

    // Update metadata with error
    await dynamoClient.send(
      new PutItemCommand({
        TableName: process.env.METADATA_TABLE!,
        Item: {
          jobId: { S: jobId },
          fileName: { S: fileName },
          status: { S: 'validation_failed' },
          timestamp: { N: Date.now().toString() },
          error: {
            S: error instanceof Error ? error.message : 'Unknown error',
          },
          processingTime: { N: processingTime.toString() },
        },
      })
    );

    // Send failure metric
    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ETLPipeline',
        MetricData: [
          {
            MetricName: 'ValidationFailure',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );

    return {
      valid: false,
      bucket,
      key,
      jobId,
      fileName,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
