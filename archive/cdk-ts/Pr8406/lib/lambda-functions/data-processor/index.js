'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS clients
const region = process.env['AWS_REGION'] || 'us-east-1';
const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });

// Environment variables
const DYNAMODB_TABLE_NAME = process.env['DYNAMODB_TABLE_NAME'];
const ENVIRONMENT = process.env['ENVIRONMENT'];
const IS_PRIMARY = process.env['IS_PRIMARY'] === 'true';

// Error handling class
class ProcessingError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'ProcessingError';
    this.code = code;
    this.details = details;
  }
}

// Data validation function
function validateData(data) {
  const errors = [];

  if (!data) {
    errors.push({ field: 'data', message: 'Data is required' });
    return errors;
  }

  if (typeof data !== 'object') {
    errors.push({
      field: 'data',
      message: 'Data must be an object',
      value: data,
    });
  }

  // Add more validation rules as needed
  if (data.id && typeof data.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'ID must be a string',
      value: data.id,
    });
  }

  if (data.timestamp && typeof data.timestamp !== 'string') {
    errors.push({
      field: 'timestamp',
      message: 'Timestamp must be a string',
      value: data.timestamp,
    });
  }

  return errors;
}

// Data transformation function
function transformData(originalData, sourceBucket, sourceKey) {
  const transformedData = {
    ...originalData,
    // Add any data transformation logic here
    transformedAt: new Date().toISOString(),
    source: {
      bucket: sourceBucket,
      key: sourceKey,
    },
  };

  return transformedData;
}

// Generate unique record ID
function generateRecordId() {
  return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Send message to dead letter queue
async function sendToDeadLetterQueue(error, record) {
  try {
    const message = {
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
      record: {
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
        size: record.s3.object.size,
        eventTime: record.eventTime,
      },
      timestamp: new Date().toISOString(),
    };

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: `https://sqs.${region}.amazonaws.com/${process.env['AWS_ACCOUNT_ID']}/serverless-dlq-${ENVIRONMENT}`,
        MessageBody: JSON.stringify(message),
      })
    );

    console.log('Message sent to dead letter queue:', message);
  } catch (dlqError) {
    console.error('Failed to send message to dead letter queue:', dlqError);
  }
}

// Main processing function
async function processData(record) {
  const startTime = Date.now();
  const bucket = record.s3.bucket.name;
  const key = record.s3.object.key;

  console.log(`Processing file: s3://${bucket}/${key}`);

  try {
    // Download file from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!s3Response.Body) {
      throw new ProcessingError('S3 object body is empty', 'S3_EMPTY_BODY');
    }

    // Parse the file content
    const fileContent = await s3Response.Body.transformToString();
    let originalData;

    try {
      originalData = JSON.parse(fileContent);
    } catch (parseError) {
      throw new ProcessingError(
        'Failed to parse JSON data',
        'JSON_PARSE_ERROR',
        {
          parseError,
        }
      );
    }

    // Validate the data
    const validationErrors = validateData(originalData);
    if (validationErrors.length > 0) {
      throw new ProcessingError('Data validation failed', 'VALIDATION_ERROR', {
        validationErrors,
      });
    }

    // Transform the data
    const processedData = transformData(originalData, bucket, key);

    // Create the record for DynamoDB
    const recordId = originalData.id || generateRecordId();
    const timestamp = originalData.timestamp || new Date().toISOString();
    const dataType = originalData.type || 'unknown';

    const dynamoRecord = {
      recordId,
      timestamp,
      dataType,
      processingStatus: 'COMPLETED',
      originalData,
      processedData,
      metadata: {
        sourceBucket: bucket,
        sourceKey: key,
        region: region,
        isPrimary: IS_PRIMARY,
        processingTime: Date.now() - startTime,
        version: '1.0.0',
      },
      ttl: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    };

    // Store in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Item: dynamoRecord,
      })
    );

    console.log(`Successfully processed and stored record: ${recordId}`);
    return dynamoRecord;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Error processing file s3://${bucket}/${key}:`, error);

    // Create error record for DynamoDB
    const errorRecord = {
      recordId: generateRecordId(),
      timestamp: new Date().toISOString(),
      dataType: 'error',
      processingStatus: 'FAILED',
      originalData: null,
      processedData: null,
      metadata: {
        sourceBucket: bucket,
        sourceKey: key,
        region: region,
        isPrimary: IS_PRIMARY,
        processingTime,
        version: '1.0.0',
      },
      ttl: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    };

    // Store error record in DynamoDB
    try {
      await docClient.send(
        new PutCommand({
          TableName: DYNAMODB_TABLE_NAME,
          Item: errorRecord,
        })
      );
    } catch (dynamoError) {
      console.error('Failed to store error record in DynamoDB:', dynamoError);
    }

    // Send to dead letter queue
    if (error instanceof ProcessingError) {
      await sendToDeadLetterQueue(error, record);
    }

    throw error;
  }
}

// Lambda handler
exports.handler = async (event, context, callback) => {
  console.log('Lambda function started');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Environment:', ENVIRONMENT);
  console.log('Is Primary:', IS_PRIMARY);
  console.log('Region:', region);

  try {
    // Process all records in the event
    const processingPromises = event.Records.map(record => processData(record));
    const results = await Promise.allSettled(processingPromises);

    // Log results
    const successful = results.filter(
      result => result.status === 'fulfilled'
    ).length;
    const failed = results.filter(
      result => result.status === 'rejected'
    ).length;

    console.log(
      `Processing completed. Successful: ${successful}, Failed: ${failed}`
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Record ${index} failed:`, result.reason);
      }
    });

    // If any records failed, throw an error to trigger retry/dead letter queue
    if (failed > 0) {
      throw new Error(`${failed} records failed to process`);
    }

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Processing completed successfully',
        successful,
        failed,
        region: region,
        isPrimary: IS_PRIMARY,
      }),
    });
  } catch (error) {
    console.error('Lambda function failed:', error);
    callback(error);
  }
};
