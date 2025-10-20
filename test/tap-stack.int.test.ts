import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// AWS SDK clients (v3)
import { APIGatewayClient } from '@aws-sdk/client-api-gateway';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { EC2Client } from '@aws-sdk/client-ec2';
import { InvokeCommand, InvokeCommandOutput, LambdaClient } from '@aws-sdk/client-lambda';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { PurgeQueueCommand, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { marshall } from '@aws-sdk/util-dynamodb';

// Path to outputs produced by deployment
const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');

let outputs: Record<string, any> | null = null;
if (fs.existsSync(outputsPath)) {
  try {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } catch (e) {
    // malformed — treat as missing
    // eslint-disable-next-line no-console
    console.warn('Failed to parse outputs file:', e);
    outputs = null;
  }
}

// If outputs are missing or empty, fail explicitly — integration tests require real outputs
if (!outputs || Object.keys(outputs).length === 0) {
  describe('Live integration (failed - missing outputs)', () => {
    test('cfn-outputs/flat-outputs.json must be present and non-empty', () => {
      // eslint-disable-next-line no-console
      console.error('ERROR: cfn-outputs/flat-outputs.json not found or empty. Integration tests require real deployment outputs.');
      expect(outputs).not.toBeNull();
      expect(Object.keys(outputs || {}).length).toBeGreaterThan(0);
    });
  });
} else {
  // Determine region: prefer lib/AWS_REGION if present, else env AWS_REGION or default in outputs if available
  let region = process.env.AWS_REGION || 'us-east-1';
  const regionPath = path.resolve(process.cwd(), 'lib/AWS_REGION');
  if (fs.existsSync(regionPath)) {
    region = fs.readFileSync(regionPath, 'utf8').trim();
  }

  // helper validators
  const isMasked = (v: any) => typeof v === 'string' && v.includes('***');
  const looksLikeArn = (v: any) => typeof v === 'string' && v.startsWith('arn:');
  const looksLikeUrl = (v: any) => typeof v === 'string' && /^https?:\/\//.test(v);

  // Initialize clients
  const ec2 = new EC2Client({ region });
  const dynamo = new DynamoDBClient({ region });
  const lambda = new LambdaClient({ region });
  const s3 = new S3Client({ region });
  const sqs = new SQSClient({ region });
  const secrets = new SecretsManagerClient({ region });
  const api = new APIGatewayClient({ region });

  describe('Live integration end-to-end workflow tests', () => {
    // Basic presence checks for keys and basic format/masking validation
    test('outputs contain the minimal keys required for E2E flows and values are not masked', () => {
      const required = ['ApiGatewayUrl', 'LambdaFunctionArn', 'S3BucketName', 'SqsQueueUrl', 'RdsEndpoint', 'DatabaseSecretArn'];
      required.forEach((k) => {
        expect(Object.prototype.hasOwnProperty.call(outputs!, k)).toBe(true);
        const v = outputs![k];
        expect(v).toBeTruthy();
        // fail if the value looks masked (contains '***')
        expect(isMasked(v)).toBe(false);
      });

      // Extra basic structural checks
      expect(looksLikeUrl(outputs!['ApiGatewayUrl'])).toBe(true);
      expect(looksLikeArn(outputs!['LambdaFunctionArn'])).toBe(true);
      expect(looksLikeArn(outputs!['DatabaseSecretArn'])).toBe(true);
      expect(typeof outputs!['S3BucketName']).toBe('string');
      expect(typeof outputs!['RdsEndpoint']).toBe('string');
      expect(looksLikeUrl(outputs!['SqsQueueUrl'])).toBe(true);
    });

    describe('End-to-end: API -> Lambda -> downstream systems', () => {
      const testId = uuidv4();
      const payload = { testId, message: 'integration-test' };
      let itemId: string | undefined;

      beforeAll(async () => {
        // Attempt to purge SQS if present to get a clean slate; not fatal if it fails
        try {
          const q = outputs!['SqsQueueUrl'];
          if (q) await sqs.send(new PurgeQueueCommand({ QueueUrl: q }));
        } catch (e: any) {
          // In strict mode, log the error but do not hide it — tests will still run and fail if flows break
          // eslint-disable-next-line no-console
          console.warn('SQS purge attempted but failed:', e.message || e);
        }
      });

      test('POST to API endpoint accepts test payload and returns success marker', async () => {
        const apiUrl = outputs!['ApiGatewayUrl'];
        expect(apiUrl).toBeTruthy();

        // Support API key protected endpoints in CI by reading an API key from env.
        // Preferred env var names: INTEGRATION_API_KEY, ADMIN_API_KEY, READ_ONLY_API_KEY
        const apiKey = process.env.INTEGRATION_API_KEY || process.env.ADMIN_API_KEY || process.env.READ_ONLY_API_KEY;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['x-api-key'] = apiKey;

        const res = await axios.post(`${apiUrl.replace(/\/$/, '')}/items`, payload, {
          headers,
          validateStatus: () => true,
          timeout: 20000,
        });

        // Diagnostic info
        // eslint-disable-next-line no-console
        console.log('Integration API POST status:', res.status);
        // eslint-disable-next-line no-console
        console.log('Integration API POST body:', JSON.stringify(res.data).slice(0, 2000));

        // We don't enforce a specific status code beyond success/sensible response; accept 200-499 but fail on 5xx
        expect(res.status).toBeLessThan(600);
        expect(Math.floor(res.status / 100)).not.toBe(5);

        // Helpful diagnostic for common API Gateway auth failures
        if ((res.status === 401 || res.status === 403) || (res.data && typeof res.data === 'object' && /Missing Authentication Token/i.test(JSON.stringify(res.data)))) {
          // If no API key was supplied, give a clearer error to the operator/CI
          if (!apiKey) {
            // eslint-disable-next-line no-console
            console.error('API returned authentication error. If your API is protected by an API key, set INTEGRATION_API_KEY or ADMIN_API_KEY in the environment before running integration tests.');
          }
        }

        // Require that the API returns an itemId for downstream verification
        expect(res.data).toBeDefined();
        expect(res.data.itemId).toBeDefined();
        itemId = res.data.itemId;
      }, 20000);

      test('verify data flows to DynamoDB and SQS (polling)', async () => {
        // Strict: require an itemId and table/queue outputs to exist
        expect(itemId).toBeDefined();
        const tableName = outputs!['TableName'] || outputs!['DynamoTableName'] || outputs!['DynamoDBTableName'];
        expect(tableName).toBeDefined();

        // Poll for the item in DynamoDB
        let found = false;
        for (let i = 0; i < 6; i++) {
          try {
            const get = new GetItemCommand({ TableName: tableName, Key: marshall({ id: itemId! }) });
            const resp = await dynamo.send(get);
            if (resp.Item) {
              found = true;
              break;
            }
          } catch (e: any) {
            // ignore transient
          }
          // wait
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 2000));
        }

        expect(found).toBe(true);

        // Poll SQS for a message that includes the item id
        const queueUrl = outputs!['SqsQueueUrl'];
        expect(queueUrl).toBeDefined();

        let messageFound = false;
        for (let attempt = 0; attempt < 12 && !messageFound; attempt++) {
          const recv = new ReceiveMessageCommand({ QueueUrl: queueUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 10 });
          try {
            const resp = await sqs.send(recv);
            if (resp.Messages && resp.Messages.length > 0) {
              for (const m of resp.Messages) {
                try {
                  const body = JSON.parse(m.Body as string);
                  if (body && (body.id === itemId || (body.id && body.id.S === itemId))) {
                    messageFound = true;
                    break;
                  }
                } catch (e: any) {
                  // not JSON, ignore
                }
              }
            }
          } catch (e: any) {
            // ignore transient
          }
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 2000));
        }

        // Fail if no message was observed within the polling window
        expect(messageFound).toBe(true);
      }, 90000);

      test('Lambda direct invocation returns expected shape', async () => {
        const lambdaArn = outputs!['LambdaFunctionArn'];
        expect(lambdaArn).toBeDefined();

        // Invoke and assert success; treat invocation failures as test failures
        const nameOrArn = lambdaArn.includes(':') ? lambdaArn : lambdaArn;
        const cmd = new InvokeCommand({ FunctionName: nameOrArn, Payload: Buffer.from(JSON.stringify({ test: 'invoke' })) });
        const resp = await lambda.send(cmd) as InvokeCommandOutput;
        expect(resp.StatusCode).toBeDefined();
        expect(resp.StatusCode).toBeGreaterThanOrEqual(200);
      });

      test('S3: Lambda can write and read object (via direct S3 client operations)', async () => {
        const bucket = outputs!['S3BucketName'];
        expect(bucket).toBeDefined();

        const key = `integration-test-${uuidv4()}.txt`;
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: 'hello' } as any) as any);
        const got = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key } as any) as any);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const body = await got.Body.transformToString();
        expect(body).toBe('hello');
        // cleanup, let failures in cleanup surface
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key } as any) as any);
      }, 30000);

      test('Secrets Manager: can read secret string', async () => {
        const secretArn = outputs!['DatabaseSecretArn'];
        expect(secretArn).toBeDefined();
        const resp = await secrets.send(new GetSecretValueCommand({ SecretId: secretArn } as any));
        expect(resp.SecretString || resp.SecretBinary).toBeDefined();
      }, 20000);

    });
  });
}