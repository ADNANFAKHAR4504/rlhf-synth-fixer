/**
 * Optimized Lambda function with proper error handling and logging
 * Compatible with Node.js 18+ runtime
 * Uses AWS SDK v3 with X-Ray integration
 */

// AWS SDK v3 imports
import { XRayClient } from '@aws-sdk/client-xray';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

// Environment variables from Pulumi Config
const DB_ENDPOINT = process.env.DB_ENDPOINT;
const API_KEY = process.env.API_KEY;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

// Logger utility
const log = (level, message, metadata = {}) => {
  if (shouldLog(level)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: ENVIRONMENT,
      ...metadata,
    }));
  }
};

const shouldLog = (level) => {
  const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  return levels[level] >= levels[LOG_LEVEL];
};

/**
 * Lambda handler with optimized performance and error handling
 * Using AWS SDK v3 and X-Ray captureAWSv3Client pattern
 */
export const handler = async (event, context) => {
  // Import AWS X-Ray dynamically for tracing
  const AWSXRay = await import('aws-xray-sdk-core');
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('ProcessEvent');

  try {
    log('INFO', 'Processing Lambda event', {
      requestId: context.requestId,
      functionName: context.functionName,
      memoryLimit: context.memoryLimitInMB,
    });

    // Validate input
    if (!event || !event.body) {
      throw new Error('Invalid event: missing body');
    }

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    log('DEBUG', 'Parsed event body', { body });

    // Simulate processing with retry logic
    let result;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        subsegment.addAnnotation('attempt', attempt);
        result = await processData(body);
        break;
      } catch (error) {
        log('WARN', `Attempt ${attempt} failed`, {
          error: error.message,
          attempt,
          maxRetries: MAX_RETRIES,
        });

        if (attempt === MAX_RETRIES) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    subsegment.close();

    log('INFO', 'Successfully processed event', {
      requestId: context.requestId,
      resultSize: JSON.stringify(result).length,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': context.requestId,
      },
      body: JSON.stringify({
        success: true,
        data: result,
        requestId: context.requestId,
      }),
    };

  } catch (error) {
    subsegment.addError(error);
    subsegment.close();

    log('ERROR', 'Lambda execution failed', {
      error: error.message,
      stack: error.stack,
      requestId: context.requestId,
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': context.requestId,
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        requestId: context.requestId,
      }),
    };
  }
};

/**
 * Simulated data processing function
 */
async function processData(data) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    processed: true,
    timestamp: new Date().toISOString(),
    input: data,
    environment: ENVIRONMENT,
  };
}
