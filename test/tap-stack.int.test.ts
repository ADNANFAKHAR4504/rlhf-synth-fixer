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

  const prodBucket = getOutput('ProdDataBucketName');
  const prodRegion = getOutput('ProdRegion');
  const processorAliasArn = getOutput('ProdprocessorAliasArn');
  const apiEndpoint = getOutput('ProdApiEndpoint');
  const snsTopicArn = getOutput('ProdSnsTopicArn');

  const s3Client = new S3Client({ region: prodRegion });
  const lambdaClient = new LambdaClient({ region: prodRegion });
  const snsClient = new SNSClient({ region: prodRegion });

  test('ingests and retrieves trade events through the prod data lake bucket', async () => {
    const key = `integration-tests/orders/${randomId()}.json`;
    const payload = {
      tradeId: randomId(),
      instrument: 'FX-EURUSD',
      amount: 2500000,
    };

    await s3Client.send(
      new PutObjectCommand({
        Bucket: prodBucket,
        Key: key,
        Body: JSON.stringify(payload),
      })
    );

    const readResult = await s3Client.send(
      new GetObjectCommand({
        Bucket: prodBucket,
        Key: key,
      })
    );
    const body = await streamToString(readResult.Body as Readable);
    const parsed = JSON.parse(body);
    expect(parsed.tradeId).toBe(payload.tradeId);

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: prodBucket,
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

  test('publishes deployment notifications to the prod SNS topic', async () => {
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
});
