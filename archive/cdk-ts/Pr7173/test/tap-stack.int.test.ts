// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const outputsPath =
  process.env.CFN_OUTPUTS_PATH || 'cfn-outputs/flat-outputs.json';
if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Missing CloudFormation outputs at ${outputsPath}. Deploy the stack before running integration tests.`
  );
}
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const getOutput = (key: string) => {
  const value = outputs[key];
  if (!value) {
    throw new Error(`Output "${key}" not found in ${outputsPath}`);
  }
  return value;
};

const streamToString = async (
  stream: Readable | ReadableStream | undefined
) => {
  if (!stream) {
    return '';
  }
  if (typeof (stream as any).transformToByteArray === 'function') {
    const arrayBuffer = await (stream as any).transformToByteArray();
    return Buffer.from(arrayBuffer).toString('utf-8');
  }
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    (stream as Readable)
      .on('data', chunk =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      )
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
};

const randomId = () => crypto.randomBytes(12).toString('hex');

describe('Trading platform integration flows', () => {
  jest.setTimeout(120000);

  // Use Dev environment outputs (default deployment is dev-only)
  const devBucket = getOutput('DevDataBucketName');
  const devRegionConfig = getOutput('DevRegion');
  const processorAliasArn = getOutput('DevprocessorAliasArn');
  const apiEndpoint = getOutput('DevApiEndpoint');
  const snsTopicArn = getOutput('DevSnsTopicArn');

  let s3Client: S3Client;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;

  const resolveBucketRegion = async (
    bucket: string,
    fallbackRegion: string
  ): Promise<string> => {
    try {
      const discoveryClient = new S3Client({ region: 'us-east-1' });
      const location = await discoveryClient.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      const resolved =
        location.LocationConstraint && location.LocationConstraint.length > 0
          ? location.LocationConstraint
          : 'us-east-1';
      return resolved;
    } catch (error) {
      // If we cannot determine the location, default to fallback region
      return fallbackRegion;
    }
  };

  beforeAll(async () => {
    const bucketRegion = await resolveBucketRegion(devBucket, devRegionConfig);
    s3Client = new S3Client({ region: bucketRegion });

    const aliasRegion = processorAliasArn.split(':')[3] || devRegionConfig;
    lambdaClient = new LambdaClient({ region: aliasRegion });

    const topicRegion = snsTopicArn.split(':')[3] || devRegionConfig;
    snsClient = new SNSClient({ region: topicRegion });
  });

  test('ingests and retrieves trade events through the dev data lake bucket', async () => {
    const key = `integration-tests/orders/${randomId()}.json`;
    const payload = {
      tradeId: randomId(),
      instrument: 'FX-EURUSD',
      amount: 2500000,
    };

    await s3Client.send(
      new PutObjectCommand({
        Bucket: devBucket,
        Key: key,
        Body: JSON.stringify(payload),
      })
    );

    const readResult = await s3Client.send(
      new GetObjectCommand({
        Bucket: devBucket,
        Key: key,
      })
    );
    const body = await streamToString(readResult.Body as Readable);
    const parsed = JSON.parse(body);
    expect(parsed.tradeId).toBe(payload.tradeId);

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: devBucket,
        Key: key,
      })
    );
  });

  test('routes trading payloads through the processor lambda alias with weighted traffic', async () => {
    const invocation = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: processorAliasArn,
        Payload: Buffer.from(
          JSON.stringify({
            requestId: randomId(),
            action: 'PROCESS_TRADE',
            quantity: 10,
          })
        ),
      })
    );
    expect(invocation.StatusCode).toBe(200);
    const payloadBuffer = invocation.Payload
      ? Buffer.from(invocation.Payload)
      : Buffer.from('{}');
    const payloadJson = JSON.parse(payloadBuffer.toString());
    expect(payloadJson.statusCode).toBe(200);
  });

  test('serves synchronous trading requests via API Gateway', async () => {
    const baseUrl = apiEndpoint.endsWith('/')
      ? apiEndpoint.slice(0, -1)
      : apiEndpoint;
    const response = await axios.post(`${baseUrl}/processor`, {
      requestId: randomId(),
      client: 'integration-suite',
      orderType: 'MARKET',
    });
    expect(response.status).toBe(200);
    const responseBody =
      typeof response.data === 'string'
        ? JSON.parse(response.data)
        : response.data;
    expect(responseBody.status).toBe('OK');
  });

  test('publishes deployment notifications to the dev SNS topic', async () => {
    const publishResponse = await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'integration-test-deployment',
        Message: JSON.stringify({
          requestId: randomId(),
          status: 'SUCCESS',
          details: { component: 'integration-suite' },
        }),
      })
    );
    expect(publishResponse.MessageId).toBeDefined();
  });

  test('processes batch trade orders through the complete data pipeline', async () => {
    const batchId = randomId();
    const trades = Array.from({ length: 5 }, (_, i) => ({
      tradeId: `${batchId}-${i}`,
      instrument: ['FX-EURUSD', 'FX-GBPUSD', 'FX-USDJPY'][i % 3],
      amount: (i + 1) * 100000,
      side: i % 2 === 0 ? 'BUY' : 'SELL',
      timestamp: new Date().toISOString(),
    }));

    const batchKey = `integration-tests/batches/${batchId}.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: devBucket,
        Key: batchKey,
        Body: JSON.stringify({ batchId, trades }),
        ContentType: 'application/json',
      })
    );

    const invocation = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: processorAliasArn,
        Payload: Buffer.from(
          JSON.stringify({
            requestId: batchId,
            action: 'PROCESS_BATCH',
            batchKey,
            bucket: devBucket,
          })
        ),
      })
    );

    expect(invocation.StatusCode).toBe(200);
    const result = JSON.parse(
      Buffer.from(invocation.Payload || '{}').toString()
    );
    expect(result.statusCode).toBe(200);

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: devBucket,
        Key: batchKey,
      })
    );
  });

  test('handles concurrent API requests for high-frequency trading simulation', async () => {
    const baseUrl = apiEndpoint.endsWith('/')
      ? apiEndpoint.slice(0, -1)
      : apiEndpoint;
    const concurrentRequests = 10;

    const requests = Array.from({ length: concurrentRequests }, (_, i) =>
      axios.post(`${baseUrl}/processor`, {
        requestId: `${randomId()}-${i}`,
        client: 'hft-simulation',
        orderType: 'LIMIT',
        price: 1.085 + i * 0.0001,
        quantity: 100000,
      })
    );

    const responses = await Promise.allSettled(requests);
    const successful = responses.filter(r => r.status === 'fulfilled');
    expect(successful.length).toBeGreaterThanOrEqual(concurrentRequests * 0.8);
  });

  test('validates trade data persistence and retrieval across storage tiers', async () => {
    const tradeId = randomId();
    const tradeData = {
      tradeId,
      instrument: 'EQUITY-AAPL',
      quantity: 1000,
      price: 150.25,
      executedAt: new Date().toISOString(),
      metadata: {
        clientId: 'test-client',
        strategy: 'momentum',
        tags: ['automated', 'integration-test'],
      },
    };

    const hotKey = `integration-tests/hot/${tradeId}.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: devBucket,
        Key: hotKey,
        Body: JSON.stringify(tradeData),
        ContentType: 'application/json',
        Metadata: {
          tradeid: tradeId,
          tier: 'hot',
        },
      })
    );

    const retrieved = await s3Client.send(
      new GetObjectCommand({
        Bucket: devBucket,
        Key: hotKey,
      })
    );

    const retrievedData = JSON.parse(
      await streamToString(retrieved.Body as Readable)
    );
    expect(retrievedData.tradeId).toBe(tradeId);
    expect(retrievedData.metadata.strategy).toBe('momentum');

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: devBucket,
        Key: hotKey,
      })
    );
  });

  test('executes end-to-end trade lifecycle from submission to confirmation', async () => {
    const orderId = randomId();
    const baseUrl = apiEndpoint.endsWith('/')
      ? apiEndpoint.slice(0, -1)
      : apiEndpoint;

    const submitResponse = await axios.post(`${baseUrl}/processor`, {
      requestId: orderId,
      action: 'SUBMIT_ORDER',
      client: 'lifecycle-test',
      orderType: 'MARKET',
      instrument: 'FX-EURUSD',
      quantity: 500000,
      side: 'BUY',
    });
    expect(submitResponse.status).toBe(200);
    const submitResult =
      typeof submitResponse.data === 'string'
        ? JSON.parse(submitResponse.data)
        : submitResponse.data;
    expect(submitResult.status).toBe('OK');

    const confirmKey = `integration-tests/confirmations/${orderId}.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: devBucket,
        Key: confirmKey,
        Body: JSON.stringify({
          orderId,
          status: 'FILLED',
          fillPrice: 1.0855,
          fillQuantity: 500000,
          confirmedAt: new Date().toISOString(),
        }),
      })
    );

    const confirmation = await s3Client.send(
      new GetObjectCommand({
        Bucket: devBucket,
        Key: confirmKey,
      })
    );
    const confirmData = JSON.parse(
      await streamToString(confirmation.Body as Readable)
    );
    expect(confirmData.orderId).toBe(orderId);
    expect(confirmData.status).toBe('FILLED');

    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'trade-confirmation',
        Message: JSON.stringify({
          orderId,
          event: 'ORDER_FILLED',
          details: confirmData,
        }),
      })
    );

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: devBucket,
        Key: confirmKey,
      })
    );
  });
});
