import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DeleteObjectsCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  ObjectIdentifier,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';

// --- Test Configuration ---

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack-${environmentSuffix}`;

let apiGatewayUrl: string;
let s3BucketName: string;
let kmsKeyAlias: string;

const s3Client = new S3Client({});
const kmsClient = new KMSClient({});
const cfClient = new CloudFormationClient({});

// --- Test Suite ---

describe('TAP Stack Full Integration Tests', () => {
  const s3KeysToCleanup: ObjectIdentifier[] = [];

  beforeAll(async () => {
    try {
      console.log(`🔎 Fetching outputs for stack: ${stackName}`);
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfClient.send(command);
      const outputs = response.Stacks?.[0]?.Outputs;
      if (!outputs) throw new Error('Stack outputs not found.');

      apiGatewayUrl = outputs.find(
        o => o.OutputKey === 'ApiGatewayUrl'
      )?.OutputValue!;
      s3BucketName = outputs.find(
        o => o.OutputKey === 'S3BucketName'
      )?.OutputValue!;
      kmsKeyAlias = `alias/tap/s3-key-${environmentSuffix}`;

      if (!apiGatewayUrl || !s3BucketName) {
        throw new Error('Required outputs not found.');
      }
      console.log('✅ Successfully fetched stack outputs.');
    } catch (error) {
      console.error(
        'Failed to fetch stack outputs from CloudFormation.',
        error
      );
      throw error;
    }
  }, 60000);

  afterAll(async () => {
    if (s3KeysToCleanup.length > 0) {
      console.log(`🧹 Cleaning up ${s3KeysToCleanup.length} S3 object(s)...`);
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: s3BucketName,
          Delete: { Objects: s3KeysToCleanup },
        })
      );
      console.log('✅ Cleanup complete.');
    }
  });

  // --- Resource-Level Integration Tests ---
  describe('Resource Configuration Verification', () => {
    let kmsKeyId: string;

    test('KMS Key should exist and have rotation enabled', async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyAlias })
      );
      expect(KeyMetadata).toBeDefined();
      expect(KeyMetadata?.Enabled).toBe(true);
      kmsKeyId = KeyMetadata?.KeyId!;

      const { KeyRotationEnabled } = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );
      expect(KeyRotationEnabled).toBe(true);
      console.log(`✅ KMS Key ${kmsKeyId} verified.`);
    });

    test('S3 Bucket should have correct KMS encryption enabled', async () => {
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );

      expect(ServerSideEncryptionConfiguration).toBeDefined();
      expect(ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(
        0
      );

      const sseRule = ServerSideEncryptionConfiguration!.Rules![0];
      expect(sseRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(
        sseRule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
      ).toContain(kmsKeyId);
      console.log('✅ S3 Bucket encryption verified.');
    });

    test('S3 Bucket should have versioning enabled', async () => {
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe('Enabled');
      console.log('✅ S3 Bucket versioning verified.');
    });
  });

  // --- End-to-End Flow Tests ---
  describe('API End-to-End Flow', () => {
    test('POST with JSON body should succeed', async () => {
      const { data } = await axios.post(apiGatewayUrl, { testId: 'json-test' });
      expect(data.message).toBe('Request processed and stored successfully.');
      s3KeysToCleanup.push({ Key: data.s3_key });
      const body = await getS3ObjectBody(data.s3_key);
      expect(JSON.parse(JSON.parse(body).body)).toEqual({
        testId: 'json-test',
      });
    });

    test('GET request should succeed', async () => {
      const { data } = await axios.get(apiGatewayUrl, {
        params: { testId: 'get-test' },
      });
      expect(data.message).toBe('Request processed and stored successfully.');
      s3KeysToCleanup.push({ Key: data.s3_key });
      const body = await getS3ObjectBody(data.s3_key);
      expect(JSON.parse(body).httpMethod).toBe('GET');
    });

    test('POST with empty body should succeed', async () => {
      const { data } = await axios.post(apiGatewayUrl, {});
      expect(data.message).toBe('Request processed and stored successfully.');
      s3KeysToCleanup.push({ Key: data.s3_key });
      const body = await getS3ObjectBody(data.s3_key);
      expect(JSON.parse(body).body).toBe('{}');
    });
  });
});

/**
 * Helper function to retrieve an object's body from S3.
 */
async function getS3ObjectBody(key: string): Promise<string> {
  console.log(`🔎 Verifying S3 object: ${key}`);
  const s3Object = await s3Client.send(
    new GetObjectCommand({ Bucket: s3BucketName, Key: key })
  );
  const body = await s3Object.Body?.transformToString('utf-8');
  if (!body) throw new Error(`S3 object body for key ${key} is empty.`);
  console.log(`✅ S3 object content for "${key}" retrieved.`);
  return body;
}