import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { DescribeInstancesCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetPublicAccessBlockCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';
const stackName = 'TapStackpr492';
const environmentSuffix = 'pr492';
const uniqueId = 'secureapp';

const cfnClient = new CloudFormationClient({ region });
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const kmsClient = new KMSClient({ region });

describe('Turn Around Prompt API Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};

  beforeAll(async () => {
    // Fetch stack outputs
    const describeStackCommand = new DescribeStacksCommand({
      StackName: stackName,
    });
    const stackResponse = await cfnClient.send(describeStackCommand);
    const stack = stackResponse.Stacks?.[0];
    if (!stack || !stack.Outputs) {
      throw new Error(`Stack ${stackName} not found or has no outputs`);
    }
    stack.Outputs.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        stackOutputs[output.OutputKey] = output.OutputValue;
      }
    });
  });

  describe('S3 Buckets', () => {
    const buckets = [
      {
        name: `s3-access-logs-${environmentSuffix}-${uniqueId}`,
        output: 'S3AccessLogsBucket',
      },
      {
        name: `website-content-${environmentSuffix}-${uniqueId}`,
        output: 'WebsiteContentBucket',
      },
      {
        name: `application-logs-${environmentSuffix}-${uniqueId}`,
        output: 'ApplicationLogsBucket',
      },
      {
        name: `backup-data-${environmentSuffix}-${uniqueId}`,
        output: 'BackupDataBucket',
      },
    ];

    buckets.forEach(bucket => {
      test(`should have ${bucket.name} with KMS encryption`, async () => {
        const command = new GetBucketEncryptionCommand({ Bucket: bucket.name });
        const response = await s3Client.send(command);
        const encryption =
          response.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault;
        if (!encryption) {
          throw new Error(
            `No encryption configuration found for bucket ${bucket.name}`
          );
        }
        expect(encryption.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.KMSMasterKeyID).toContain(stackOutputs.KMSKeyId);
      });

      test(`should have ${bucket.name} with public access blocked`, async () => {
        const command = new GetPublicAccessBlockCommand({
          Bucket: bucket.name,
        });
        const response = await s3Client.send(command);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
          true
        );
        expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
          true
        );
        expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
          true
        );
        expect(
          response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
        ).toBe(true);
      });
    });

    test('should have logging enabled for non-access-logs buckets', async () => {
      const nonAccessLogBuckets = buckets.filter(
        b => !b.name.includes('s3-access-logs')
      );
      for (const bucket of nonAccessLogBuckets) {
        const command = new GetBucketLoggingCommand({ Bucket: bucket.name });
        const response = await s3Client.send(command);
        expect(response.LoggingEnabled?.TargetBucket).toBe(
          `s3-access-logs-${environmentSuffix}-${uniqueId}`
        );
        expect(response.LoggingEnabled?.TargetPrefix).toBe(
          `${bucket.name.split('-').slice(0, -2).join('-')}-access-logs/`
        );
      }
    });

    test('should have startup log in application-logs bucket', async () => {
      const command = new HeadObjectCommand({
        Bucket: `application-logs-${environmentSuffix}-${uniqueId}`,
        Key: expect.stringMatching(/^startup-\d{8}-\d{6}\.log$/),
      });
      let objectExists = false;
      try {
        await s3Client.send(command);
        objectExists = true;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'NotFound') {
          // Object not found, test will fail
        } else {
          throw error;
        }
      }
      expect(objectExists).toBe(true);
    });
  });

  describe('EC2 Instance', () => {
    test('should have running EC2 instance', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [stackOutputs.EC2InstanceId],
      });
      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceId).toBe(stackOutputs.EC2InstanceId);
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.PublicIpAddress).toBe(stackOutputs.EC2PublicIP);
      expect(instance?.IamInstanceProfile?.Arn).toContain(
        stackOutputs.EC2InstanceRoleArn.split(':role/')[1]
      );
    });
  });

  describe('KMS Key', () => {
    test('should have KMS key with correct configuration', async () => {
      const command = new DescribeKeyCommand({ KeyId: stackOutputs.KMSKeyId });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyId).toBe(stackOutputs.KMSKeyId);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  afterAll(async () => {
    cfnClient.destroy();
    s3Client.destroy();
    ec2Client.destroy();
    kmsClient.destroy();
  });
});
