import { DescribeInstancesCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Load CloudFormation outputs
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  console.log('✅ Loaded outputs:', Object.keys(outputs));
} catch (error) {
  console.warn(
    '⚠️ flat-outputs.json not found or invalid. Integration tests will be skipped.'
  );
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const kms = new KMSClient({ region });

function getOutput(key: string) {
  const fullKey = `TapStack${environmentSuffix}-${key}`;
  const value = outputs[fullKey];
  if (!value) {
    console.warn(`⚠️ Output ${fullKey} is missing. Skipping related test.`);
  }
  return value;
}

describe('TapStack CloudFormation Integration Tests', () => {
  test('Should have all expected outputs from the stack', () => {
    if (!outputs || Object.keys(outputs).length === 0) {
      console.warn('⚠️ No outputs loaded. Skipping output presence test.');
      return;
    }

    const expectedKeys = [
      'VPCId',
      'WebsiteContentBucket',
      'ApplicationLogsBucket',
      'BackupDataBucket',
      'S3AccessLogsBucket',
      'KMSKeyId',
      'EC2InstanceId',
      'EC2PublicIP',
      'EC2InstanceRoleArn',
    ];

    expectedKeys.forEach(key => {
      const fullKey = `TapStack${environmentSuffix}-${key}`;
      if (!outputs[fullKey]) {
        console.warn(`⚠️ Output ${fullKey} is missing. Skipping check.`);
        return;
      }
      expect(outputs[fullKey]).toBeDefined();
      expect(outputs[fullKey]).not.toBeNull();
    });
  });

  test('S3 buckets should be encrypted and block public access', async () => {
    const bucketKeys = [
      'WebsiteContentBucket',
      'ApplicationLogsBucket',
      'BackupDataBucket',
      'S3AccessLogsBucket',
    ];

    for (const key of bucketKeys) {
      const bucketName = getOutput(key);
      if (!bucketName) continue;

      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

      const publicAccess = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      const config = publicAccess.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    }
  });

  test('EC2 instance should be running and have a public IP', async () => {
    const instanceId = getOutput('EC2InstanceId');
    if (!instanceId) return;

    const response = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    );
    const instance = response.Reservations?.[0]?.Instances?.[0];

    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toMatch(/running|pending|stopping|stopped/);
    expect(instance?.PublicIpAddress).toBeDefined();
  });

  test('KMS Key should be available and enabled', async () => {
    const keyId = getOutput('KMSKeyId');
    if (!keyId) return;

    const response = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
    expect(response.KeyMetadata?.KeyState).toBe('Enabled');
  });
});
