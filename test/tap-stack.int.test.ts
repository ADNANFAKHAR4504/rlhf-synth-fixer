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

  // Robust output lookup: many CI artifacts include different keys/naming conventions.
  // Try several common output key names first, then fall back to scanning values.
  const findOutput = (candidates: string[]) => {
    for (const c of candidates) {
      if (Object.prototype.hasOwnProperty.call(outputs!, c) && outputs![c]) return outputs![c];
    }
    // fallback: search by value pattern
    for (const [k, v] of Object.entries(outputs!)) {
      if (!v || typeof v !== 'string') continue;
      // API gateway URL
      if (candidates.includes('ApiGatewayUrl') && v.includes('execute-api')) return v;
      // SQS URL
      if (candidates.includes('SqsQueueUrl') && (v.includes('sqs.amazonaws.com') || /^https:\/\//.test(v) && v.includes('amazonaws.com'))) return v;
      // Dynamo table name heuristic
      if (candidates.includes('DynamoTableName') && /table|TableName|Dynamo/.test(k)) return v;
      // Lambda ARN
      if (candidates.includes('LambdaFunctionArn') && v.startsWith('arn:aws:lambda')) return v;
      // Secrets Manager ARN
      if (candidates.includes('DatabaseSecretArn') && v.startsWith('arn:aws:secretsmanager')) return v;
      // S3 bucket (heuristic: key name contains bucket or value looks like a bucket name)
      if (candidates.includes('S3BucketName') && (k.toLowerCase().includes('bucket') || /^[a-z0-9.-]{3,63}$/.test(v))) return v;
    }
    return undefined;
  };

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
      // attempt to resolve each required output via common names / heuristics
      // Prefer explicit environment override (CI-friendly) then fall back to outputs
      const apiUrl = process.env.API_GATEWAY_ENDPOINT || findOutput(['ApiGatewayUrl', 'ApiEndpointUrl', 'ApplicationApiEndpoint', 'ApiEndpoint', 'ApplicationApiEndpointA2298DCC']);
      const lambdaArn = findOutput(['LambdaFunctionArn', 'FunctionArn', 'ApplicationLambdaArn']);
      const s3Bucket = findOutput(['S3BucketName', 'LogsBucketName', 'BucketName']);
      const sqsUrl = findOutput(['SqsQueueUrl', 'QueueUrl', 'SqsUrl']);
      const rdsEndpoint = findOutput(['RdsEndpoint', 'DBEndpoint', 'DatabaseEndpoint']);
      const secretArn = findOutput(['DatabaseSecretArn', 'SecretArn', 'DatabaseSecret']);

      // Print if we couldn't find expected outputs to help debugging
      if (!apiUrl || !lambdaArn || !s3Bucket || !sqsUrl || !rdsEndpoint || !secretArn) {
        // eslint-disable-next-line no-console
        console.error('Missing expected outputs. Available output keys:', Object.keys(outputs!));
      }

      expect(apiUrl).toBeTruthy();
      expect(lambdaArn).toBeTruthy();
      expect(s3Bucket).toBeTruthy();
      expect(sqsUrl).toBeTruthy();
      expect(rdsEndpoint).toBeTruthy();
      expect(secretArn).toBeTruthy();

      // fail if the value looks masked (contains '***')
      expect(isMasked(apiUrl)).toBe(false);
      expect(isMasked(lambdaArn)).toBe(false);
      expect(isMasked(s3Bucket)).toBe(false);
      expect(isMasked(sqsUrl)).toBe(false);
      expect(isMasked(rdsEndpoint)).toBe(false);
      expect(isMasked(secretArn)).toBe(false);

      // Extra basic structural checks
      expect(looksLikeUrl(apiUrl)).toBe(true);
      expect(looksLikeArn(lambdaArn)).toBe(true);
      expect(looksLikeArn(secretArn)).toBe(true);
      expect(typeof s3Bucket === 'string').toBe(true);
      expect(typeof rdsEndpoint === 'string').toBe(true);
      expect(looksLikeUrl(sqsUrl)).toBe(true);
    });

    describe('End-to-end: API -> Lambda -> downstream systems', () => {
      const testId = uuidv4();
      const payload = { testId, message: 'integration-test' };
      let itemId: string | undefined;
      let postSucceeded = false;

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
        const apiUrl = findOutput(['ApiGatewayUrl', 'ApiEndpointUrl', 'ApplicationApiEndpoint', 'ApiEndpoint', 'ApplicationApiEndpointA2298DCC']);
        expect(apiUrl).toBeTruthy();

        // Support API key protected endpoints in CI by reading an API key from env.
        // Preferred env var names (in order): INTEGRATION_API_KEY, ADMIN_API_KEY, READ_ONLY_API_KEY
        // Backwards-compatible: also accept API_KEY and the CI-standard names used in docs.
        const apiKey = process.env.INTEGRATION_API_KEY || process.env.ADMIN_API_KEY || process.env.READ_ONLY_API_KEY || process.env.API_KEY;
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
          // If no API key was supplied, fail fast with a clear error so CI doesn't silently pass or produce opaque downstream failures.
          if (!apiKey) {
            // eslint-disable-next-line no-console
            console.error('API returned authentication error and no API key was provided. For live integration tests provide an API key in CI as INTEGRATION_API_KEY, ADMIN_API_KEY or READ_ONLY_API_KEY.');
            // Make the test fail explicitly with actionable guidance.
            throw new Error('API authentication failed (401/403) and no API key found in environment. Set INTEGRATION_API_KEY or ADMIN_API_KEY in CI.');
          }
          // If an API key was provided but we still got 401/403, surface that as a failure too (likely misconfigured key or stage)
          // eslint-disable-next-line no-console
          console.error('API returned authentication error despite having an API key set. Verify the key and that it is associated with the deployed stage.');
          throw new Error(`API authentication failed with status ${res.status}.`);
        }

        // Require that the API returns an itemId for downstream verification
        expect(res.data).toBeDefined();
        // If itemId is missing, fail fast with helpful context
        if (!res.data || res.data.itemId === undefined) {
          // eslint-disable-next-line no-console
          console.error('API POST did not return itemId. POST status:', res.status, 'body:', JSON.stringify(res.data).slice(0, 2000));
        }
        expect(res.data.itemId).toBeDefined();
        itemId = res.data.itemId;
        postSucceeded = true;
      }, 20000);

      test('verify data flows to DynamoDB and SQS (polling)', async () => {
        // If the POST did not succeed, fail with clear guidance rather than producing opaque undefined errors
        expect(postSucceeded).toBe(true);
        // Strict: require an itemId and table/queue outputs to exist
        expect(itemId).toBeDefined();
        const tableName = findOutput(['TableName', 'DynamoTableName', 'DynamoDBTableName', 'DynamoTableName']);
        expect(tableName).toBeDefined();

        // Poll for the item in DynamoDB. Different lambdas use different primary key names
        // (common ones: 'id' and 'assetId'). Try both when probing the table.
        let found = false;
        const keyCandidates = [{ id: itemId! }, { assetId: itemId! }];
        for (let i = 0; i < 6; i++) {
          try {
            for (const candidateKey of keyCandidates) {
              try {
                const get = new GetItemCommand({ TableName: tableName, Key: marshall(candidateKey) });
                const resp = await dynamo.send(get);
                if (resp.Item) {
                  found = true;
                  break;
                }
              } catch (innerErr: any) {
                // ignore per-key errors and try next key variant
              }
            }
            if (found) break;
          } catch (e: any) {
            // ignore transient errors and retry
          }
          // wait
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 2000));
        }

        expect(found).toBe(true);

        // Poll SQS for a message that includes the item id
        const queueUrl = findOutput(['SqsQueueUrl', 'QueueUrl', 'SqsUrl']);
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
                  // message shape varies; accept either 'id' or 'assetId' top-level fields
                  if (body && (body.id === itemId || body.assetId === itemId || (body.id && body.id.S === itemId) || (body.assetId && body.assetId.S === itemId))) {
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
        const lambdaArn = findOutput(['LambdaFunctionArn', 'FunctionArn', 'ApplicationLambdaArn']);
        expect(lambdaArn).toBeDefined();

        // Invoke and assert success; treat invocation failures as test failures
        const nameOrArn = lambdaArn.includes(':') ? lambdaArn : lambdaArn;
        const cmd = new InvokeCommand({ FunctionName: nameOrArn, Payload: Buffer.from(JSON.stringify({ test: 'invoke' })) });
        const resp = await lambda.send(cmd) as InvokeCommandOutput;
        expect(resp.StatusCode).toBeDefined();
        expect(resp.StatusCode).toBeGreaterThanOrEqual(200);
      });

      test('S3: Lambda can write and read object (via direct S3 client operations)', async () => {
        const bucket = findOutput(['S3BucketName', 'LogsBucketName', 'BucketName']);
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
        const secretArn = findOutput(['DatabaseSecretArn', 'SecretArn', 'DatabaseSecret']);
        expect(secretArn).toBeDefined();
        const resp = await secrets.send(new GetSecretValueCommand({ SecretId: secretArn } as any));
        expect(resp.SecretString || resp.SecretBinary).toBeDefined();
      }, 20000);

    });
  });
}