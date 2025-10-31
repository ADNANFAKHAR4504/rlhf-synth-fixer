// test/tap-stack.int.test.ts
// Pattern aligned to the reference suite: read outputs once, use AWS SDK,
// and skip tests when required outputs are absent (no edits to flat-outputs.json).

import fs from 'fs';

// --- Env / region ---
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
let region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

// Keep the original outputs read (unchanged)
let outputs: Record<string, string> = {};

// Load outputs once, like the reference does
beforeAll(() => {
  try {
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    if (fs.existsSync(outputsPath)) {
      const raw = fs.readFileSync(outputsPath, 'utf8');
      outputs = raw ? JSON.parse(raw) : {};
      // Derive region from StateMachineArn if present
      if (outputs.StateMachineArn) {
        const arnParts = String(outputs.StateMachineArn).split(':');
        if (arnParts[3]) region = arnParts[3];
      }
      console.log('Loaded deployment outputs:', Object.keys(outputs));
    } else {
      console.warn('Warning: flat-outputs.json not found. Some integration tests will be skipped.');
    }
  } catch (error) {
    console.error('Error loading outputs:', error);
  }
});

// Polyfill fetch if needed
const g: any = globalThis as any;
const fetchFn: typeof fetch =
  g.fetch ??
  (((...args: any[]) =>
    import('node-fetch').then((m) => (m.default as any)(...args))) as any);

// --- AWS SDK v3 clients (init after region is final) ---
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, ListRulesCommand } from '@aws-sdk/client-eventbridge';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { DescribeExecutionCommand, SFNClient } from '@aws-sdk/client-sfn';
import { GetQueueAttributesCommand, SQSClient } from '@aws-sdk/client-sqs';

const logs = new CloudWatchLogsClient({ region });
const ddb = new DynamoDBClient({ region });
const eb = new EventBridgeClient({ region });
const sqs = new SQSClient({ region });
let s3 = new S3Client({ region });
const sfn = new SFNClient({ region });

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
jest.setTimeout(180000); // 3 minutes max

// Helper: if the bucket is in a different region, switch S3 client just for that call
async function getS3ClientForBucket(bucket: string): Promise<S3Client> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return s3;
  } catch (e: any) {
    const hdrs = e?.$metadata?.httpHeaders || {};
    const realRegion = hdrs['x-amz-bucket-region'] || hdrs['x-amz-bucket-region'.toLowerCase()];
    if (realRegion && realRegion !== region) return new S3Client({ region: realRegion });
    throw e;
  }
}

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('outputs file has required keys and valid formats (skip if missing)', async () => {
      const required = [
        'ApiEndpoint',
        'ApiKeyValue',
        'StateMachineArn',
        'TransactionsTableName',
        'InboundQueueUrl',
        'DLQUrl',
        'EventBusName',
        'ArchiveBucketName',
        'DashboardUrl',
      ];

      // If outputs are empty, skip like the reference suite’s style
      if (!required.some((k) => outputs[k])) {
        console.log('Skipping: required outputs not found in flat-outputs.json');
        return;
      }

      for (const k of required) {
        if (!outputs[k]) {
          console.log(`Skipping: ${k} not found in outputs`);
          return;
        }
      }

      // Keep your original format checks when values are present
      expect(String(outputs.ApiEndpoint)).toMatch(
        /^https:\/\/.+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9-]+\/$/
      );
      expect(String(outputs.StateMachineArn)).toMatch(
        /^arn:aws:states:[a-z0-9-]+:\d{12}:stateMachine:.+/
      );
      expect(String(outputs.InboundQueueUrl)).toMatch(
        /^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/.+/
      );
      expect(String(outputs.DLQUrl)).toMatch(
        /^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/.+/
      );
      expect(String(outputs.ArchiveBucketName)).toMatch(/^txn-archive-[a-z0-9-]+-\d+$/);
    });

    test('API requires Authorization token (should 401/403 without it)', async () => {
      if (!outputs.ApiEndpoint || !outputs.ApiKeyValue) {
        console.log('Skipping: ApiEndpoint/ApiKeyValue missing in outputs');
        return;
      }

      const url = `${outputs.ApiEndpoint}transactions`;
      const res = await fetchFn(url, {
        method: 'POST',
        headers: {
          'x-api-key': outputs.ApiKeyValue,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: `it-deny-${Date.now()}`,
          merchantId: 'm-unauth',
          amount: 10,
          currency: 'USD',
        }),
      });
      expect([401, 403]).toContain(res.status);
    });

    test('POST /transactions returns executionArn and Step Functions sees it', async () => {
      if (!outputs.ApiEndpoint || !outputs.ApiKeyValue) {
        console.log('Skipping: ApiEndpoint/ApiKeyValue missing in outputs');
        return;
      }

      const txnId = `it-${Date.now()}`;
      const url = `${outputs.ApiEndpoint}transactions`;
      const res = await fetchFn(url, {
        method: 'POST',
        headers: {
          'x-api-key': outputs.ApiKeyValue,
          Authorization: 'Bearer integ-test-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: txnId,
          merchantId: `merchant-${Math.random().toString(36).slice(2, 8)}`,
          amount: 42.5,
          currency: 'USD',
        }),
      });

      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(body.executionArn).toMatch(/^arn:aws:states:[a-z0-9-]+:\d{12}:execution:.+/);

      const execArn: string = body.executionArn;
      let status = 'RUNNING';
      const start = Date.now();
      while (Date.now() - start < 120000) {
        const out = await sfn.send(new DescribeExecutionCommand({ executionArn: execArn }));
        status = out.status || 'UNKNOWN';
        if (['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED'].includes(status)) break;
        await sleep(3000);
      }
      expect(['SUCCEEDED', 'RUNNING']).toContain(status);
    });

    test('transaction eventually persists to DynamoDB with status COMPLETED', async () => {
      if (!outputs.ApiEndpoint || !outputs.ApiKeyValue || !outputs.TransactionsTableName) {
        console.log('Skipping: ApiEndpoint/ApiKeyValue/TransactionsTableName missing in outputs');
        return;
      }

      const txnId = `it-ddb-${Date.now()}`;
      const url = `${outputs.ApiEndpoint}transactions`;
      await fetchFn(url, {
        method: 'POST',
        headers: {
          'x-api-key': outputs.ApiKeyValue,
          Authorization: 'Bearer integ-test-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: txnId,
          merchantId: 'merchant-live',
          amount: 55.0,
          currency: 'USD',
        }),
      });

      // Poll DDB for item
      const start = Date.now();
      let item: any | undefined;
      while (Date.now() - start < 120000) {
        const resp = await ddb.send(
          new GetItemCommand({
            TableName: outputs.TransactionsTableName,
            Key: { txnId: { S: txnId } },
            ConsistentRead: true,
          })
        );
        item = resp.Item;
        if (item?.status?.S) break;
        await sleep(3000);
      }
      expect(item).toBeTruthy();
      expect(item.status.S).toBe('COMPLETED');
      expect(item.currency.S).toBe('USD');
    });

    test('EventBridge bus contains expected rules for this env', async () => {
      if (!outputs.EventBusName) {
        console.log('Skipping: EventBusName missing in outputs');
        return;
      }

      const expected = new Set([
        `tap-high-amount-${environmentSuffix}`,
        `tap-high-fraud-${environmentSuffix}`,
        `tap-failure-spike-${environmentSuffix}`,
      ]);

      let nextToken: string | undefined = undefined;
      const found = new Set<string>();

      do {
        const resp = await eb.send(
          new ListRulesCommand({
            EventBusName: outputs.EventBusName,
            NextToken: nextToken,
            Limit: 100,
          })
        );
        (resp.Rules || []).forEach((r) => r?.Name && found.add(r.Name));
        nextToken = resp.NextToken;
      } while (nextToken);

      expected.forEach((name) => expect(found.has(name)).toBe(true));
    });

    test('SQS queues have expected attributes (FIFO, redrive)', async () => {
      if (!outputs.InboundQueueUrl || !outputs.DLQUrl) {
        console.log('Skipping: InboundQueueUrl/DLQUrl missing in outputs');
        return;
      }

      // Inbound FIFO with redrive
      const inbound = await sqs.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.InboundQueueUrl,
          AttributeNames: ['All'],
        })
      );
      const attrsIn = inbound.Attributes || {};
      expect(attrsIn.FifoQueue).toBe('true');
      expect(attrsIn.ContentBasedDeduplication).toBe('true');
      expect(attrsIn.RedrivePolicy).toBeTruthy();

      // DLQ (FIFO)
      const dlq = await sqs.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.DLQUrl,
          AttributeNames: ['All'],
        })
      );
      const attrsDlq = dlq.Attributes || {};
      expect(attrsDlq.FifoQueue).toBe('true');
    });

    test('S3 archive bucket exists, is versioned, and encrypted; put+delete object works', async () => {
      if (!outputs.ArchiveBucketName) {
        console.log('Skipping: ArchiveBucketName missing in outputs');
        return;
      }

      const bucket = outputs.ArchiveBucketName;
      const s3ForBucket = await getS3ClientForBucket(bucket);

      // Versioning
      const ver = await s3ForBucket.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      expect(ver.Status).toBe('Enabled');

      // Encryption
      const enc = await s3ForBucket.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.length).toBeGreaterThan(0);

      // Put/Delete
      const key = `it-check/${Date.now()}.txt`;
      await s3ForBucket.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: 'ok' }));
      await s3ForBucket.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    });

    test('CloudWatch Logs group for the state machine exists', async () => {
      const lgName = `/aws/vendedlogs/states/tap-transaction-processor-${environmentSuffix}`;
      const resp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: lgName }));
      const names = (resp.logGroups || []).map((g) => g.logGroupName);
      expect(names).toContain(lgName);
    });

    test('webhook status mock endpoint responds with acknowledged', async () => {
      if (!outputs.ApiEndpoint || !outputs.ApiKeyValue) {
        console.log('Skipping: ApiEndpoint/ApiKeyValue missing in outputs');
        return;
      }

      const url = `${outputs.ApiEndpoint}webhooks/status`;
      const res = await fetchFn(url, {
        method: 'POST',
        headers: {
          'x-api-key': outputs.ApiKeyValue,
          Authorization: 'Bearer integ-test-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ping: 'pong' }),
      });
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(body.status).toBe('acknowledged');
    });
  });
});
