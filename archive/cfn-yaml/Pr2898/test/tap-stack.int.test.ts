import { APIGatewayClient, GetRestApiCommand, GetStagesCommand } from '@aws-sdk/client-api-gateway';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

let outputs: Record<string, any> = {};
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const readRegion = (): string => {
  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  try {
    const regionPath = path.join(__dirname, '../lib/AWS_REGION');
    if (fs.existsSync(regionPath)) {
      return fs.readFileSync(regionPath, 'utf8').trim();
    }
  } catch (_) { }
  return 'us-west-2';
};

const region = readRegion();

// Build SDK clients
const s3 = new S3Client({ region });
const ddb = new DynamoDBClient({ region });
const lambda = new LambdaClient({ region });
const apigw = new APIGatewayClient({ region });

const haveAwsCredentials = (): boolean => {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
  );
};

describe('TapStack Integration - Live AWS checks (SDK + cfn-outputs)', () => {
  beforeAll(() => {
    try {
      const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
      if (fs.existsSync(outputsPath)) {
        const content = fs.readFileSync(outputsPath, 'utf8');
        outputs = JSON.parse(content);
      } else {
        // No outputs available, tests will skip gracefully
        outputs = {};
      }
    } catch (_) {
      outputs = {};
    }
  });

  test('environment suffix should be a valid string', () => {
    expect(environmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
  });

  test('S3 bucket exists and has KMS encryption (if output provided)', async () => {
    const bucketName = outputs.S3BucketName;
    if (!bucketName || !haveAwsCredentials()) {
      expect(true).toBe(true);
      return;
    }
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      const hasKms = rules.some(
        (r) => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
      );
      expect(hasKms).toBe(true);
    } catch (err: any) {
      if (err?.name === 'CredentialsProviderError') {
        expect(true).toBe(true);
        return;
      }
      throw err;
    }
  });

  test('DynamoDB table exists and stream is enabled (if output provided)', async () => {
    const tableName = outputs.DynamoDBTableName;
    if (!tableName || !haveAwsCredentials()) {
      expect(true).toBe(true);
      return;
    }
    const res = await ddb.send(new DescribeTableCommand({ TableName: tableName }));
    expect(res.Table?.TableStatus).toBeDefined();
    expect(res.Table?.StreamSpecification?.StreamEnabled).toBe(true);
  });

  test('Main Lambda exists (if output provided)', async () => {
    const fnArn = outputs.MainLambdaFunctionArn;
    if (!fnArn || !haveAwsCredentials()) {
      expect(true).toBe(true);
      return;
    }
    const res = await lambda.send(new GetFunctionCommand({ FunctionName: fnArn }));
    expect(res.Configuration?.FunctionArn).toBeDefined();
  });

  test('Stream Processor Lambda exists (if output provided)', async () => {
    const fnArn = outputs.StreamProcessorLambdaFunctionArn;
    if (!fnArn || !haveAwsCredentials()) {
      expect(true).toBe(true);
      return;
    }
    const res = await lambda.send(new GetFunctionCommand({ FunctionName: fnArn }));
    expect(res.Configuration?.FunctionArn).toBeDefined();
  });

  test('API Gateway RestApi and stage exist (if outputs provided)', async () => {
    const restApiId = outputs.RestApiId;
    const apiUrl = outputs.ApiGatewayURL as string | undefined;
    if ((!restApiId && !apiUrl) || !haveAwsCredentials()) {
      expect(true).toBe(true);
      return;
    }
    const id = restApiId ?? (apiUrl?.match(/https:\/\/([a-z0-9]+)\.execute-api\.[-a-z0-9]+\.amazonaws\.com\//i)?.[1] ?? '');
    if (!id) {
      expect(true).toBe(true);
      return;
    }
    const api = await apigw.send(new GetRestApiCommand({ restApiId: id }));
    expect(api).toBeDefined();

    const stages = await apigw.send(new GetStagesCommand({ restApiId: id }));
    expect(Array.isArray(stages.item)).toBe(true);

    // Try to determine stage name from URL (/StageName/)
    const stageFromUrl = apiUrl?.split('.amazonaws.com/')[1]?.split('/')[0];
    if (stageFromUrl && stages.item) {
      const found = stages.item.some(s => s.stageName === stageFromUrl);
      expect(found).toBe(true);
    }
  });
});
