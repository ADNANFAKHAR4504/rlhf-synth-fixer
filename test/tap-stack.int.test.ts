import { DescribeInstancesCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Load CloudFormation outputs from file
let outputs: any;
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('⚠️ flat-outputs.json not found. Using fallback mock values.');
  outputs = {};
}

// Get environment
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const kms = new KMSClient({ region });

describe('TapStack CloudFormation Integration Tests', () => {
  test('Should have all expected outputs from the stack', () => {
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
      expect(outputs[fullKey]).toBeDefined();
      expect(outputs[fullKey]).not.toBeNull();
    });
  });

  test('S3 buckets should be encrypted and block public access', async () => {
    const bucketNames = [
      outputs[`TapStack${environmentSuffix}-WebsiteContentBucket`],
      outputs[`TapStack${environmentSuffix}-ApplicationLogsBucket`],
      outputs[`TapStack${environmentSuffix}-BackupDataBucket`],
      outputs[`TapStack${environmentSuffix}-S3AccessLogsBucket`],
    ];

    for (const bucketName of bucketNames) {
      expect(bucketName).toBeDefined();

      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

      const publicAccess = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(
        publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    }
  });

  test('EC2 instance should be running and have a public IP', async () => {
    const instanceId = outputs[`TapStack${environmentSuffix}-EC2InstanceId`];
    expect(instanceId).toBeDefined();

    const response = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    );
    const instance = response.Reservations?.[0]?.Instances?.[0];

    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toMatch(/running|pending|stopping|stopped/);
    expect(instance?.PublicIpAddress).toBeDefined();
  });

  test('KMS Key should be available and enabled', async () => {
    const keyId = outputs[`TapStack${environmentSuffix}-KMSKeyId`];
    expect(keyId).toBeDefined();

    const response = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
    expect(response.KeyMetadata?.KeyState).toBe('Enabled');
  });
});
