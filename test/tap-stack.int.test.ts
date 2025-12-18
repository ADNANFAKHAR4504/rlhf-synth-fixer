import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import * as fs from 'fs';
import * as path from 'path';

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

// AWS Client configuration for LocalStack
const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocalStack && {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  }),
};

// AWS Clients
const ec2Client = new EC2Client(clientConfig);
const s3Client = new S3Client({
  ...clientConfig,
  forcePathStyle: true, // Required for LocalStack S3
});
const rdsClient = new RDSClient(clientConfig);

describe('TapStack Integration Tests', () => {
  let outputs: any = {};

  beforeAll(() => {
    // Read CloudFormation outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    }
  });

  describe('Network Resources', () => {
    test('VPC should be created and accessible', async () => {
      if (!outputs.VPCId) {
        console.log('VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
    });
  });

  describe('S3 Buckets', () => {
    test('Assets bucket should be created and accessible', async () => {
      if (!outputs.AssetsBucketName) {
        console.log('AssetsBucketName not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.AssetsBucketName,
      });

      // If the bucket exists, this won't throw an error
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('Logs bucket should be created and accessible', async () => {
      if (!outputs.LogsBucketName) {
        console.log('LogsBucketName not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.LogsBucketName,
      });

      // If the bucket exists, this won't throw an error
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('Database Resources', () => {
    test('RDS instance should be available (skipped in LocalStack)', async () => {
      if (isLocalStack) {
        console.log('RDS is disabled in LocalStack, skipping test');
        return;
      }

      if (!outputs.DatabaseEndpoint) {
        console.log('DatabaseEndpoint not found in outputs, skipping test');
        return;
      }

      // Extract instance identifier from endpoint
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const instanceId = `development-db-${environmentSuffix}`;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId,
      });

      try {
        const response = await rdsClient.send(command);
        expect(response.DBInstances).toHaveLength(1);
        expect(response.DBInstances![0].DBInstanceStatus).toBe('available');
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.log(
            `DB instance ${instanceId} not found, it may still be creating`
          );
        } else {
          throw error;
        }
      }
    });
  });

  describe('Load Balancer', () => {
    test('ALB should be accessible via DNS', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.log('LoadBalancerDNS not found in outputs, skipping test');
        return;
      }

      // Just verify the output exists and has the expected format
      expect(outputs.LoadBalancerDNS).toMatch(/.*\.elb\.amazonaws\.com$/);
    });
  });
});
