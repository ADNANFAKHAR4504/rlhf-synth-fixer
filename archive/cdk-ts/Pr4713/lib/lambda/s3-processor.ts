import { S3Event, S3EventRecord, Context } from 'aws-lambda';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
});

interface ProcessingResult {
  bucket: string;
  key: string;
  size: number;
  contentType: string;
  status: string;
  processingTimeMs: number;
}

/**
 * S3 Event Processor Lambda Function
 *
 * This function is triggered when objects are created in the S3 bucket.
 * It performs validation, metadata extraction, and logging of the processed objects.
 */
export const handler = async (
  event: S3Event,
  context: Context
): Promise<void> => {
  console.log('Lambda invoked with request ID:', context.awsRequestId);
  console.log('Event received:', JSON.stringify(event, null, 2));

  const results: ProcessingResult[] = [];
  const errors: string[] = [];

  try {
    // Process each S3 record in the event
    for (const record of event.Records) {
      const startTime = Date.now();

      try {
        const result = await processS3Record(record);
        results.push({
          ...result,
          processingTimeMs: Date.now() - startTime,
        });

        console.log(`Successfully processed: ${result.key}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const key = record.s3.object.key;

        console.error(`Error processing object ${key}:`, {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          record: JSON.stringify(record),
        });

        errors.push(`Failed to process ${key}: ${errorMessage}`);
      }
    }

    // Log summary
    console.log('Processing Summary:', {
      totalRecords: event.Records.length,
      successful: results.length,
      failed: errors.length,
      results,
    });

    // If there were any errors, throw to trigger DLQ and CloudWatch alarm
    if (errors.length > 0) {
      throw new Error(
        `Processing completed with ${errors.length} error(s): ${errors.join('; ')}`
      );
    }
  } catch (error) {
    console.error('Fatal error in Lambda execution:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error; // Re-throw to trigger retry and DLQ
  }
};

/**
 * Process a single S3 event record
 */
async function processS3Record(
  record: S3EventRecord
): Promise<ProcessingResult> {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  const size = record.s3.object.size;

  console.log(`Processing object: s3://${bucket}/${key}`);

  // Validate object key
  validateObjectKey(key);

  // Get detailed object metadata
  const metadata = await getObjectMetadata(bucket, key);

  // Perform dummy processing tasks
  await performDummyProcessing(bucket, key, size);

  return {
    bucket,
    key,
    size,
    contentType: metadata.ContentType || 'unknown',
    status: 'completed',
    processingTimeMs: 0, // Will be set by caller
  };
}

/**
 * Validate the S3 object key
 */
function validateObjectKey(key: string): void {
  // Check for empty key
  if (!key || key.trim().length === 0) {
    throw new Error('Object key cannot be empty');
  }

  // Check for suspicious patterns
  if (key.includes('..')) {
    throw new Error('Object key contains invalid path traversal pattern');
  }

  // Check minimum size requirement (e.g., not just file extension)
  if (key.length < 3) {
    throw new Error('Object key is too short');
  }

  console.log(`Object key validation passed: ${key}`);
}

/**
 * Get detailed metadata about the S3 object
 */
async function getObjectMetadata(bucket: string, key: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    console.log('Object metadata:', {
      ContentType: response.ContentType,
      ContentLength: response.ContentLength,
      LastModified: response.LastModified,
      ETag: response.ETag,
      VersionId: response.VersionId,
      StorageClass: response.StorageClass,
    });

    return response;
  } catch (error) {
    console.error('Error fetching object metadata:', error);
    throw new Error(
      `Failed to get metadata for ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Perform dummy processing tasks on the object
 */
async function performDummyProcessing(
  bucket: string,
  key: string,
  size: number
): Promise<void> {
  console.log(`Starting dummy processing for ${key}...`);

  // Simulate processing delay based on file size
  const processingDelay = Math.min(size / 1000, 1000); // Max 1 second
  await new Promise(resolve => setTimeout(resolve, processingDelay));

  // Log processing details
  console.log('Dummy processing completed:', {
    bucket,
    key,
    size,
    fileType: getFileType(key),
    isLargeFile: size > 1024 * 1024, // > 1 MB
    estimatedProcessingTime: `${processingDelay}ms`,
  });

  // Simulate additional processing steps
  await simulateDataValidation(key);
  await simulateMetadataExtraction(key);

  console.log(`Dummy processing completed for ${key}`);
}

/**
 * Get file type from key
 */
function getFileType(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase();
  return extension || 'unknown';
}

/**
 * Simulate data validation
 */
async function simulateDataValidation(key: string): Promise<void> {
  console.log(`Validating data for ${key}...`);

  // Simulate validation delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Random validation failure for testing (5% chance)
  if (Math.random() < 0.05) {
    throw new Error(`Data validation failed for ${key}`);
  }

  console.log(`Data validation passed for ${key}`);
}

/**
 * Simulate metadata extraction
 */
async function simulateMetadataExtraction(key: string): Promise<void> {
  console.log(`Extracting metadata for ${key}...`);

  // Simulate extraction delay
  await new Promise(resolve => setTimeout(resolve, 50));

  const extractedMetadata = {
    fileName: key.split('/').pop(),
    fileExtension: getFileType(key),
    processedAt: new Date().toISOString(),
    environment: process.env.ENVIRONMENT || 'unknown',
  };

  console.log('Extracted metadata:', extractedMetadata);
}
