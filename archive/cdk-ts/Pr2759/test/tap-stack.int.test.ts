// tap-stack-integration.test.ts
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { DescribeInstancesCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import fs from 'fs';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs from CloudFormation
let outputs: any = {};

try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('cfn-outputs.json not found, using environment variables');
  // Fallback to environment variables
  outputs = {
    SecurityKmsKeyId: process.env.KMS_KEY_ID,
    SecurityBucketName: process.env.S3_BUCKET_NAME,
    EC2InstanceId: process.env.EC2_INSTANCE_ID,
    RDSEndpoint: process.env.RDS_ENDPOINT,
    VPCId: process.env.VPC_ID,
    EC2RoleArn: process.env.EC2_ROLE_ARN,
    RemediationFunctionArn: process.env.LAMBDA_FUNCTION_ARN,
  };
}

const KMS_KEY_ID = outputs.SecurityKmsKeyId;
const S3_BUCKET_NAME = outputs.SecurityBucketName;
const EC2_INSTANCE_ID = outputs.EC2InstanceId;
const RDS_ENDPOINT = outputs.RDSEndpoint;
const VPC_ID = outputs.VPCId;
const LAMBDA_FUNCTION_ARN = outputs.RemediationFunctionArn;

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const kmsClient = new KMSClient({ region });
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  beforeAll(() => {
    console.log('Testing TapStack infrastructure with configuration:', {
      environmentSuffix,
      kmsKeyId: KMS_KEY_ID,
      s3BucketName: S3_BUCKET_NAME,
      ec2InstanceId: EC2_INSTANCE_ID,
      rdsEndpoint: RDS_ENDPOINT,
      vpcId: VPC_ID,
      lambdaFunctionArn: LAMBDA_FUNCTION_ARN,
      region,
    });
  });

  describe('KMS Key Validation', () => {
    test('should be able to describe the KMS key', async () => {
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: KMS_KEY_ID,
        })
      );

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata?.KeyId).toBe(KMS_KEY_ID);
      expect(keyResponse.KeyMetadata?.Enabled).toBe(true);
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
    }, 15000);
  });

  describe('S3 Bucket Validation', () => {
    test('should be able to list objects in S3 bucket', async () => {
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: S3_BUCKET_NAME,
          MaxKeys: 1,
        })
      );

      expect(listResponse).toBeDefined();
      // Bucket should exist and be accessible
      expect(listResponse.Name).toBe(S3_BUCKET_NAME);
    }, 15000);

    test('S3 bucket name should contain environment suffix', () => {
      expect(S3_BUCKET_NAME).toContain(environmentSuffix);
    });
  });

  describe('EC2 Instance Validation', () => {
    test('should be able to describe EC2 instance', async () => {
      const instancesResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [EC2_INSTANCE_ID],
        })
      );

      expect(instancesResponse.Reservations).toBeDefined();
      expect(instancesResponse.Reservations?.length).toBe(1);
      expect(instancesResponse.Reservations?.[0].Instances?.length).toBe(1);

      const instance = instancesResponse.Reservations?.[0].Instances?.[0];
      expect(instance?.InstanceId).toBe(EC2_INSTANCE_ID);
      expect(instance?.State?.Name).toBe('running');
    }, 20000);
  });

  describe('RDS Instance Validation', () => {
    test('should be able to describe RDS instance', async () => {
      const dbIdentifier = `tap-rds-postgres-${environmentSuffix}`;
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(dbResponse.DBInstances).toBeDefined();
      expect(dbResponse.DBInstances?.length).toBe(1);

      const dbInstance = dbResponse.DBInstances?.[0];
      expect(dbInstance?.DBInstanceIdentifier).toBe(dbIdentifier);
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Endpoint?.Address).toBe(RDS_ENDPOINT);
    }, 30000);
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use correct environment suffix', () => {
      expect(S3_BUCKET_NAME).toContain(environmentSuffix);
      expect(LAMBDA_FUNCTION_ARN).toContain(environmentSuffix);
    });
  });

  describe('Connectivity Tests', () => {
    test('S3 bucket should be accessible', async () => {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: S3_BUCKET_NAME,
          MaxKeys: 1,
        })
      );
      expect(response).toBeDefined();
    }, 15000);

    test('KMS key should be accessible', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: KMS_KEY_ID,
        })
      );
      expect(response.KeyMetadata).toBeDefined();
    }, 15000);
  });

  describe('Configuration Validation', () => {
    test('should have all required outputs configured', () => {
      expect(KMS_KEY_ID).toBeTruthy();
      expect(S3_BUCKET_NAME).toBeTruthy();
      expect(EC2_INSTANCE_ID).toBeTruthy();
      expect(RDS_ENDPOINT).toBeTruthy();
      expect(VPC_ID).toBeTruthy();
      expect(LAMBDA_FUNCTION_ARN).toBeTruthy();
    });
  });
});
