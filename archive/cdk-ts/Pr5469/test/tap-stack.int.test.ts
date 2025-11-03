import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CodePipelineClient, GetPipelineCommand } from '@aws-sdk/client-codepipeline';
import { DescribeTableCommand, DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';
import { Readable } from 'stream';

// Load stack outputs generated post-deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Helpers
function parseRegionFromApiUrl(url: string): string {
  // e.g. https://xxxx.execute-api.us-east-1.amazonaws.com/dev/
  const match = url.match(/execute-api\.([a-z0-9-]+)\.amazonaws\.com/);
  return match ? match[1] : process.env.AWS_REGION || 'us-east-1';
}

function getEnvFromBucket(bucketName: string): { env: string; account: string; region: string } {
  // financeapp-data-<env>-<account>-<region>
  const parts = bucketName.split('-');
  // ['financeapp', 'data', env, account, regionParts...]
  const env = parts[2];
  const account = parts[3];
  const region = parts.slice(4).join('-');
  return { env, account, region };
}

async function streamToString(body: any): Promise<string> {
  const stream = body as Readable;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

// Derive core params from outputs
const apiUrl: string = outputs.ApiGatewayEndpoint;
const dataBucket: string = outputs.DataBucketName;
const artifactBucket: string = outputs.ArtifactBucketName;
const tableName: string = outputs.DynamoTableName;
const pipelineArn: string = outputs.CodePipelineArn;
const topicArn: string = outputs.SNSTopicArn;
const lambdaArn: string = outputs.LambdaFunctionArn;
const lambdaLogGroup: string = outputs.LambdaLogGroupName;
const pipelineLogGroup: string = outputs.PipelineLogGroupName;
const kmsKeyArn: string = outputs.KMSKeyArn;
const kmsKeyId: string = outputs.KMSKeyId;

const region = parseRegionFromApiUrl(apiUrl);
const { env: environmentSuffix, account } = getEnvFromBucket(dataBucket);

// AWS SDK v3 clients
const dynamo = new DynamoDBClient({ region });
const s3 = new S3Client({ region });
const sns = new SNSClient({ region });
const logs = new CloudWatchLogsClient({ region });
const kms = new KMSClient({ region });
const codepipeline = new CodePipelineClient({ region });

// Increase default timeout for live integration
jest.setTimeout(180000);

describe('TapStack Live Integration Tests', () => {
  // =============================
  // Non-interactive: Resource validation
  // =============================
  describe('Resource validation (non-interactive)', () => {
    test('stack outputs are present and formatted as expected', () => {
      expect(apiUrl).toMatch(/^https:\/\/.*execute-api\.[a-z0-9-]+\.amazonaws\.com\//);
      expect(dataBucket).toMatch(/^financeapp-data-/);
      expect(artifactBucket).toMatch(/^financeapp-artifacts-/);
      expect(tableName).toMatch(/^financeapp-data-/);
      expect(lambdaArn).toMatch(/^arn:aws:lambda:/);
      expect(pipelineArn).toMatch(/^arn:aws:codepipeline:/);
      expect(topicArn).toMatch(/^arn:aws:sns:/);
      expect(lambdaLogGroup).toMatch(/^\/aws\/lambda\//);
      expect(pipelineLogGroup).toMatch(/^\/aws\/codepipeline\//);
      expect(kmsKeyArn).toMatch(/^arn:aws:kms:/);
      expect(kmsKeyId).toHaveLength(36);
    });

    test('S3 data bucket exists and is accessible (HeadBucket)', async () => {
      const res = await s3.send(new HeadBucketCommand({ Bucket: dataBucket }));
      expect(res.$metadata.httpStatusCode).toBe(200);
    });

    test('DynamoDB table exists with expected settings', async () => {
      const desc = await dynamo.send(new DescribeTableCommand({ TableName: tableName }));
      expect(desc.Table?.TableStatus).toBeDefined();
      expect(desc.Table?.SSEDescription?.Status).toBeDefined();
      expect(desc.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(desc.Table?.GlobalSecondaryIndexes?.some(g => g.IndexName === 'timestamp-index')).toBe(true);
    });

    test('KMS key is enabled and describable', async () => {
      const k = await kms.send(new DescribeKeyCommand({ KeyId: kmsKeyArn }));
      expect(k.KeyMetadata?.KeyId).toBe(kmsKeyId);
      expect(k.KeyMetadata?.Enabled).toBe(true);
    });

    test('SNS topic and CodePipeline referenced by ARNs are describable', async () => {
      // SNS
      const topicRegion = topicArn.split(':')[3];
      if (topicRegion === region) {
        const topicArnLocal = topicArn; // region match, safe to call
        const topicRes = await sns.send(new GetTopicAttributesCommand({ TopicArn: topicArnLocal }));
        expect(topicRes.Attributes?.TopicArn).toBe(topicArnLocal);
      }
      // CodePipeline name from ARN
      const pipelineName = pipelineArn.split(':').pop() as string;
      const pipe = await codepipeline.send(new GetPipelineCommand({ name: pipelineName }));
      expect(pipe.pipeline?.name).toBe(pipelineName);
    });

    test('CloudWatch log groups exist', async () => {
      // Query each log group with a specific prefix to avoid pagination
      const lambdaPage = await logs.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: lambdaLogGroup })
      );
      const pipelinePage = await logs.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: pipelineLogGroup })
      );

      const lambdaNames = (lambdaPage.logGroups || []).map(l => l.logGroupName);
      const pipelineNames = (pipelinePage.logGroups || []).map(l => l.logGroupName);

      expect(lambdaNames).toContain(lambdaLogGroup);
      expect(pipelineNames).toContain(pipelineLogGroup);
    });
  });

  // =============================
  // Service-level tests (interactive actions)
  // =============================
  describe('Service-level (interactive)', () => {
    test('DynamoDB: PutItem then GetItem round-trip', async () => {
      const key = `int-test-${Date.now()}`;
      await dynamo.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: key },
          message: { S: 'hello' },
          value: { N: '42' },
          ok: { BOOL: true },
          timestamp: { N: `${Date.now()}` },
        },
      }));
      const got = await dynamo.send(new GetItemCommand({ TableName: tableName, Key: { id: { S: key } } }));
      expect(got.Item?.id?.S).toBe(key);
      expect(got.Item?.message?.S).toBe('hello');
      expect(got.Item?.value?.N).toBe('42');
    });

    test('S3: PutObject with KMS then GetObject content matches', async () => {
      const key = `int-tests/data/${Date.now()}.txt`;
      const content = `integration-content-${Date.now()}`;
      await s3.send(new PutObjectCommand({
        Bucket: dataBucket,
        Key: key,
        Body: Buffer.from(content, 'utf-8'),
        ContentType: 'text/plain',
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: kmsKeyId,
        Metadata: { uploadedBy: 'int-tests' },
      }));
      const get = await s3.send(new GetObjectCommand({ Bucket: dataBucket, Key: key }));
      const body = await streamToString(get.Body);
      expect(body).toBe(content);
    });
  });

  // =============================
  // Cross-service tests (interactive actions)
  // =============================
  describe('Cross-service (interactive)', () => {
    test('API Gateway → Lambda → S3: PUT via API then GET via API', async () => {
      const key = `api-int/s3/${Date.now()}.json`;
      const payload = { foo: 'bar', t: Date.now() };
      // PUT via API
      const putRes = await fetch(`${apiUrl}s3/object/${encodeURIComponent(dataBucket)}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64'), contentType: 'application/json' }),
      });
      expect(putRes.status).toBeLessThan(400);
      const putJson = await putRes.json();
      expect(putJson.success).toBe(true);
      expect(putJson.data.key).toBe(key);
      // GET via API
      const getRes = await fetch(`${apiUrl}s3/object/${encodeURIComponent(dataBucket)}/${encodeURIComponent(key)}`);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.success).toBe(true);
      const returned = JSON.parse(getJson.data.content);
      expect(returned.foo).toBe('bar');
    });

    test('API Gateway → Lambda → DynamoDB: PUT via API, verify via SDK', async () => {
      const key = `api-dynamo-${Date.now()}`;
      const body = { data: { note: 'from-api', count: 7, active: true } };
      const putRes = await fetch(`${apiUrl}dynamodb/item/${encodeURIComponent(tableName)}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(putRes.status).toBeLessThan(400);
      const get = await dynamo.send(new GetItemCommand({ TableName: tableName, Key: { id: { S: key } } }));
      expect(get.Item?.id?.S).toBe(key);
      expect(get.Item?.note?.S).toBe('from-api');
      expect(get.Item?.count?.N).toBe('7');
      expect(get.Item?.active?.BOOL).toBe(true);
    });
  });

  // =============================
  // E2E tests (interactive actions across 3+ services)
  // =============================
  describe('E2E flows (interactive)', () => {
    test('API → S3 → API round-trip and verify via SDK (3 services)', async () => {
      const key = `e2e/api-s3/${Date.now()}.txt`;
      const content = `round-trip-${Date.now()}`;
      // Put via API
      const putRes = await fetch(`${apiUrl}s3/object/${encodeURIComponent(dataBucket)}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: Buffer.from(content).toString('base64'), contentType: 'text/plain' }),
      });
      expect(putRes.status).toBeLessThan(400);
      // Verify via SDK
      const s3Obj = await s3.send(new GetObjectCommand({ Bucket: dataBucket, Key: key }));
      const sdkBody = await streamToString(s3Obj.Body);
      expect(sdkBody).toBe(content);
      // Read again via API
      const getRes = await fetch(`${apiUrl}s3/object/${encodeURIComponent(dataBucket)}/${encodeURIComponent(key)}`);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.data.content).toBe(content);
    });

    test('API → DynamoDB → SDK → API consistency (3 services)', async () => {
      const key = `e2e/api-dynamo/${Date.now()}`;
      const data = { data: { origin: 'e2e', value: 99 } };
      // Put via API
      const putRes = await fetch(`${apiUrl}dynamodb/item/${encodeURIComponent(tableName)}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      expect(putRes.status).toBeLessThan(400);
      // Verify via SDK
      const got = await dynamo.send(new GetItemCommand({ TableName: tableName, Key: { id: { S: key } } }));
      expect(got.Item?.origin?.S).toBe('e2e');
      expect(got.Item?.value?.N).toBe('99');
      // Verify via API
      const getRes = await fetch(`${apiUrl}dynamodb/item/${encodeURIComponent(tableName)}/${encodeURIComponent(key)}`);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.success).toBe(true);
      expect(getJson.data.item.id.S).toBe(key);
    });
  });
});


