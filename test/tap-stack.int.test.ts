import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// AWS SDK clients (v3)
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { InvokeCommand, InvokeCommandOutput, LambdaClient } from '@aws-sdk/client-lambda';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { PurgeQueueCommand, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { marshall } from '@aws-sdk/util-dynamodb';

// Use only flat outputs from deployment
const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');

let outputs: Record<string, any> | null = null;
if (fs.existsSync(outputsPath)) {
  try {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse cfn-outputs/flat-outputs.json:', e && (e as Error).message ? (e as Error).message : e);
    outputs = null;
  }
}

if (!outputs || Object.keys(outputs).length === 0) {
  describe('Integration tests - missing outputs', () => {
    test('cfn-outputs/flat-outputs.json must exist and be non-empty', () => {
      // eslint-disable-next-line no-console
      console.error('Missing or empty cfn-outputs/flat-outputs.json - integration tests require actual deployment outputs');
      expect(outputs).not.toBeNull();
      expect(Object.keys(outputs || {}).length).toBeGreaterThan(0);
    });
  });
} else {
  const findOutput = (candidates: string[]) => {
    for (const c of candidates) {
      if (Object.prototype.hasOwnProperty.call(outputs!, c) && outputs![c]) return outputs![c];
    }
    for (const [k, v] of Object.entries(outputs!)) {
      if (!v || typeof v !== 'string') continue;
      if (candidates.includes('ApiGatewayUrl') && v.includes('execute-api')) return v;
      if (candidates.includes('SqsQueueUrl') && v.includes('sqs.amazonaws.com')) return v;
      if (candidates.includes('LambdaFunctionArn') && v.startsWith('arn:aws:lambda')) return v;
      if (candidates.includes('S3BucketName') && k.toLowerCase().includes('bucket')) return v;
      if (candidates.includes('DatabaseSecretArn') && v.startsWith('arn:aws:secretsmanager')) return v;
    }
    return undefined;
  };

  const inferRegionFromArn = (arn?: string) => {
    if (!arn || typeof arn !== 'string') return undefined;
    const parts = arn.split(':');
    if (parts.length > 3 && parts[3]) return parts[3];
    return undefined;
  };
  const inferRegionFromUrl = (u?: string) => {
    if (!u || typeof u !== 'string') return undefined;
    const m = u.match(/execute-api\.([a-z0-9-]+)\.amazonaws\.com/);
    if (m && m[1]) return m[1];
    return undefined;
  };

  const apiUrl = findOutput(['ApiGatewayUrl', 'ApiGatewayEndpoint5AA8EC3A', 'ApiGatewayUrl', 'ApiGatewayEndpoint']);
  const lambdaArn = findOutput(['LambdaFunctionArn', 'TapStackpr4832MultiComponentApplicationApiLambdaAEFAB088Arn']);
  const sqsUrl = findOutput(['SqsQueueUrl', 'TapStackpr4832MultiComponentApplicationAsyncProcessingQueue260C73C3Ref']);

  let region = process.env.AWS_REGION || 'us-east-1';
  const awsRegionFile = path.resolve(process.cwd(), 'lib/AWS_REGION');
  if (fs.existsSync(awsRegionFile)) {
    region = fs.readFileSync(awsRegionFile, 'utf8').trim();
  }
  region = inferRegionFromUrl(apiUrl) || inferRegionFromArn(lambdaArn) || inferRegionFromUrl(sqsUrl) || region;

  const dynamo = new DynamoDBClient({ region });
  const lambda = new LambdaClient({ region });
  const s3 = new S3Client({ region });
  const sqs = new SQSClient({ region });
  const secrets = new SecretsManagerClient({ region });

  describe('Live integration end-to-end workflow tests', () => {
    test('flat outputs provide required runtime identifiers', () => {
      const s3Bucket = findOutput(['S3BucketName', 'TapStackpr4832MultiComponentApplicationStaticFilesBucket8A2F001CRef']);
      const secretArn = findOutput(['DatabaseSecretArn', 'TapStackpr4832MultiComponentApplicationDatabaseSecret72EB0C38Ref']);

      expect(apiUrl).toBeTruthy();
      expect(lambdaArn).toBeTruthy();
      expect(s3Bucket).toBeTruthy();
      expect(sqsUrl).toBeTruthy();
      expect(secretArn).toBeTruthy();
    });

    describe('E2E: POST -> Lambda -> DynamoDB -> SQS (runtime)', () => {
      const testId = uuidv4();
      const payload = { testId, message: 'integration-test' };
      let itemId: string | undefined;
      let postSucceeded = false;

      beforeAll(async () => {
        try {
          const q = sqsUrl;
          if (q) await sqs.send(new PurgeQueueCommand({ QueueUrl: q }));
        } catch (e: any) {
          // non-fatal
          // eslint-disable-next-line no-console
          console.warn('SQS purge failed (non-fatal):', e && e.message ? e.message : e);
        }
      });

      test('POST to API endpoint accepts payload (or fallback via Lambda)', async () => {
        expect(apiUrl).toBeTruthy();

        const apiKey = process.env.INTEGRATION_API_KEY || process.env.ADMIN_API_KEY || process.env.READ_ONLY_API_KEY || process.env.API_KEY;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['x-api-key'] = apiKey;

        const res = await axios.post(`${apiUrl.replace(/\/$/, '')}/items`, payload, { headers, validateStatus: () => true, timeout: 20000 });
        // eslint-disable-next-line no-console
        console.log('API POST status:', res.status, 'body (truncated):', JSON.stringify(res.data).slice(0, 2000));

        if ((res.status === 401 || res.status === 403) || (res.data && typeof res.data === 'object' && /Missing Authentication Token/i.test(JSON.stringify(res.data)))) {
          if (!apiKey) {
            // fallback - direct Lambda invocation (try multiple event shapes)
            // eslint-disable-next-line no-console
            console.warn('API auth error and no API key. Attempting Lambda fallback.');
            if (!lambdaArn) throw new Error('No Lambda ARN/name found for fallback invocation.');

            let functionIdentifier: any = lambdaArn;
            try {
              if (typeof lambdaArn === 'string' && lambdaArn.includes('function:')) {
                const m = lambdaArn.match(/function:([a-zA-Z0-9-_]+)/);
                if (m && m[1]) functionIdentifier = m[1];
              }
            } catch (e) { }

            const shapes = [
              { httpMethod: 'POST', path: '/items', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
              { version: '2.0', routeKey: 'POST /items', rawPath: '/items', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), isBase64Encoded: false },
              payload,
            ];

            let lastErr: any = null;
            for (const ev of shapes) {
              try {
                // eslint-disable-next-line no-console
                console.log('Trying Lambda fallback shape keys:', Object.keys(ev));
                const invokeCmd = new InvokeCommand({ FunctionName: functionIdentifier, Payload: Buffer.from(JSON.stringify(ev)) });
                const lambdaResp = await lambda.send(invokeCmd) as InvokeCommandOutput;
                // eslint-disable-next-line no-console
                console.log('Lambda fallback status:', lambdaResp.StatusCode);
                if (lambdaResp.Payload) {
                  const str = Buffer.from(lambdaResp.Payload as Uint8Array).toString();
                  // eslint-disable-next-line no-console
                  console.log('Lambda fallback payload (truncated):', str.slice(0, 2000));

                  // Detect common runtime ImportModuleError like missing 'aws-sdk'
                  if (/ImportModuleError/i.test(str) && /aws-sdk/i.test(str)) {
                    // eslint-disable-next-line no-console
                    console.error('Lambda runtime ImportModuleError detected: function appears to be packaged expecting the older "aws-sdk" v2.');
                    // Provide actionable guidance in the test failure path by setting lastErr so the outer handler can print it
                    lastErr = new Error('Lambda runtime ImportModuleError: missing "aws-sdk". Repackage the function to include required dependencies or provide INTEGRATION_API_KEY to bypass API Gateway.');
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(str);
                    if (parsed && parsed.body) {
                      const bodyObj = typeof parsed.body === 'string' ? JSON.parse(parsed.body) : parsed.body;
                      if (bodyObj && bodyObj.itemId) {
                        itemId = bodyObj.itemId;
                        postSucceeded = true;
                        break;
                      }
                    }
                    if (parsed && parsed.itemId) {
                      itemId = parsed.itemId;
                      postSucceeded = true;
                      break;
                    }
                  } catch (e) {
                    // not JSON
                  }
                  const m = str.match(/itemId\W*[:=]\W*"?([a-zA-Z0-9-_.]+)"?/i);
                  if (m && m[1]) {
                    itemId = m[1];
                    postSucceeded = true;
                    break;
                  }
                }
              } catch (e: any) {
                lastErr = e;
              }
            }

            if (!postSucceeded) {
              // eslint-disable-next-line no-console
              console.error('Lambda fallback failed to return itemId. Last error:', lastErr && lastErr.message ? lastErr.message : lastErr);
              throw new Error('API authentication failed and Lambda fallback did not return itemId. Provide INTEGRATION_API_KEY in CI.');
            }
          }
          // if API key present but still auth error, fail
          // eslint-disable-next-line no-console
          console.error('API returned authentication error despite API key or fallback attempts.');
          throw new Error(`API authentication failed with status ${res.status}`);
        }

        // require itemId in API response
        if (res.data && res.data.itemId) {
          itemId = res.data.itemId;
          postSucceeded = true;
        } else {
          // eslint-disable-next-line no-console
          console.error('API POST did not return itemId. Response (truncated):', JSON.stringify(res.data).slice(0, 2000));
        }

        expect(postSucceeded).toBe(true);
        expect(itemId).toBeDefined();
      }, 20000);

      test('verify DynamoDB and SQS receive the item (polling)', async () => {
        expect(postSucceeded).toBe(true);
        expect(itemId).toBeDefined();

        const tableName = findOutput(['TableName', 'DynamoTableName', 'DynamoDBTableName']);
        expect(tableName).toBeDefined();

        let found = false;
        const keyCandidates = [{ id: itemId! }, { assetId: itemId! }];
        for (let i = 0; i < 6; i++) {
          for (const candidateKey of keyCandidates) {
            try {
              const get = new GetItemCommand({ TableName: tableName, Key: marshall(candidateKey) });
              const resp = await dynamo.send(get);
              if (resp.Item) {
                found = true;
                break;
              }
            } catch (e) {
              // ignore and try next
            }
          }
          if (found) break;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 2000));
        }

        expect(found).toBe(true);

        const queueUrl = findOutput(['SqsQueueUrl', 'TapStackpr4832MultiComponentApplicationAsyncProcessingQueue260C73C3Ref']);
        expect(queueUrl).toBeDefined();

        let messageFound = false;
        for (let attempt = 0; attempt < 12 && !messageFound; attempt++) {
          try {
            const recv = new ReceiveMessageCommand({ QueueUrl: queueUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 10 });
            const resp = await sqs.send(recv);
            if (resp.Messages && resp.Messages.length > 0) {
              for (const m of resp.Messages) {
                try {
                  const body = JSON.parse(m.Body as string);
                  if (body && (body.id === itemId || body.assetId === itemId || (body.id && body.id.S === itemId) || (body.assetId && body.assetId.S === itemId))) {
                    messageFound = true;
                    break;
                  }
                } catch (e) {
                  // ignore
                }
              }
            }
          } catch (e) {
            // ignore transient
          }
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 2000));
        }

        expect(messageFound).toBe(true);
      }, 90000);

      test('S3: write, read, cleanup', async () => {
        const bucket = findOutput(['S3BucketName', 'TapStackpr4832MultiComponentApplicationStaticFilesBucket8A2F001CRef']);
        expect(bucket).toBeDefined();
        const key = `integration-test-${uuidv4()}.txt`;
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: 'hello' } as any) as any);
        const got = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key } as any) as any);
        // @ts-ignore
        const body = await got.Body.transformToString();
        expect(body).toBe('hello');
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key } as any) as any);
      }, 30000);

      test('Secrets Manager: read secret', async () => {
        const secretArn = findOutput(['DatabaseSecretArn', 'TapStackpr4832MultiComponentApplicationDatabaseSecret72EB0C38Ref']);
        expect(secretArn).toBeDefined();
        const resp = await secrets.send(new GetSecretValueCommand({ SecretId: secretArn } as any));
        expect(resp.SecretString || resp.SecretBinary).toBeDefined();
      }, 20000);
    });
  });
}

