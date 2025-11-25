import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import * as AWSXRay from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PATTERNS_TABLE_NAME = process.env.PATTERNS_TABLE_NAME!;
const ALERT_QUEUE_URL = process.env.ALERT_QUEUE_URL!;

interface PatternData {
  symbol: string;
  price: number;
  volume: number;
  timestamp?: number;
}

interface PatternDetectionResult {
  patternId: string;
  patternType: string;
  confidence: number;
  detected: boolean;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('pattern-detection-logic');

  try {
    const path = event.path;
    const method = event.httpMethod;

    if (path === '/patterns' && method === 'POST') {
      return await handlePatternSubmission(event, subsegment);
    } else if (path === '/patterns' && method === 'GET') {
      return await handleGetPatterns(subsegment);
    } else if (path === '/alerts' && method === 'POST') {
      return await handleAlertSubmission(event, subsegment);
    } else if (path === '/alerts' && method === 'GET') {
      return await handleGetAlerts(subsegment);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    subsegment?.addError(error as Error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: (error as Error).message,
      }),
    };
  } finally {
    subsegment?.close();
  }
};

async function handlePatternSubmission(
  event: APIGatewayProxyEvent,
  subsegment: AWSXRay.Subsegment | undefined
): Promise<APIGatewayProxyResult> {
  const detectionSubsegment = subsegment?.addNewSubsegment('detect-pattern');

  try {
    const data: PatternData = JSON.parse(event.body || '{}');

    // Detect pattern
    const detectionResult = detectPattern(data);

    // Store pattern in DynamoDB
    const patternId = detectionResult.patternId;
    const timestamp = data.timestamp || Date.now();

    await docClient.send(
      new PutCommand({
        TableName: PATTERNS_TABLE_NAME,
        Item: {
          patternId,
          timestamp,
          symbol: data.symbol,
          price: data.price,
          volume: data.volume,
          patternType: detectionResult.patternType,
          confidence: detectionResult.confidence,
          detected: detectionResult.detected,
          createdAt: new Date().toISOString(),
        },
      })
    );

    // If pattern detected, send alert to queue
    if (detectionResult.detected) {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: ALERT_QUEUE_URL,
          MessageBody: JSON.stringify({
            patternId,
            symbol: data.symbol,
            patternType: detectionResult.patternType,
            confidence: detectionResult.confidence,
            price: data.price,
            volume: data.volume,
            timestamp,
          }),
        })
      );
    }

    detectionSubsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Pattern processed successfully',
        result: detectionResult,
      }),
    };
  } catch (error) {
    detectionSubsegment?.addError(error as Error);
    detectionSubsegment?.close();
    throw error;
  }
}

async function handleGetPatterns(
  subsegment: AWSXRay.Subsegment | undefined
): Promise<APIGatewayProxyResult> {
  const scanSubsegment = subsegment?.addNewSubsegment('scan-patterns');

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: PATTERNS_TABLE_NAME,
        Limit: 50,
      })
    );

    scanSubsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patterns: result.Items || [],
        count: result.Count || 0,
      }),
    };
  } catch (error) {
    scanSubsegment?.addError(error as Error);
    scanSubsegment?.close();
    throw error;
  }
}

async function handleAlertSubmission(
  event: APIGatewayProxyEvent,
  subsegment: AWSXRay.Subsegment | undefined
): Promise<APIGatewayProxyResult> {
  const alertSubsegment = subsegment?.addNewSubsegment('create-alert');

  try {
    const alertData = JSON.parse(event.body || '{}');

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: ALERT_QUEUE_URL,
        MessageBody: JSON.stringify({
          ...alertData,
          alertId: uuidv4(),
          timestamp: Date.now(),
        }),
      })
    );

    alertSubsegment?.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Alert submitted successfully' }),
    };
  } catch (error) {
    alertSubsegment?.addError(error as Error);
    alertSubsegment?.close();
    throw error;
  }
}

async function handleGetAlerts(
  subsegment: AWSXRay.Subsegment | undefined
): Promise<APIGatewayProxyResult> {
  subsegment?.addAnnotation('operation', 'get-alerts');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Alert retrieval not implemented in this version',
      note: 'Check SQS queue directly for pending alerts',
    }),
  };
}

function detectPattern(data: PatternData): PatternDetectionResult {
  const patternId = uuidv4();

  // Simple pattern detection logic
  const priceThreshold = 100;
  const volumeThreshold = 10000;

  let patternType = 'none';
  let confidence = 0;
  let detected = false;

  if (data.price > priceThreshold && data.volume > volumeThreshold) {
    patternType = 'high-volume-breakout';
    confidence = 0.85;
    detected = true;
  } else if (data.price > priceThreshold) {
    patternType = 'price-spike';
    confidence = 0.65;
    detected = true;
  } else if (data.volume > volumeThreshold * 2) {
    patternType = 'volume-surge';
    confidence = 0.75;
    detected = true;
  }

  return {
    patternId,
    patternType,
    confidence,
    detected,
  };
}
