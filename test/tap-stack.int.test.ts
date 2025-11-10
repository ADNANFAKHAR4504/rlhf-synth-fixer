import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';

// Load stack outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

const region = process.env.AWS_REGION || 'us-east-1';

// AWS S3 client (works with jest)
const s3Client = new S3Client({ region });

describe('Payment Platform Infrastructure Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('VPC ID output exists', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-/);
    });

    test('ALB DNS Name output exists', () => {
      expect(outputs.AlbDnsName).toBeDefined();
      expect(outputs.AlbDnsName).toContain('elb.amazonaws.com');
    });

    test('ALB ARN output exists', () => {
      expect(outputs.AlbArn).toBeDefined();
      expect(outputs.AlbArn).toMatch(/^arn:aws:elasticloadbalancing:/);
    });

    test('RDS Endpoint output exists', () => {
      expect(outputs.RdsEndpoint).toBeDefined();
      expect(outputs.RdsEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.RdsEndpoint).toContain(':5432');
    });

    test('RDS Address output exists', () => {
      expect(outputs.RdsAddress).toBeDefined();
      expect(outputs.RdsAddress).toContain('rds.amazonaws.com');
    });

    test('ECS Cluster Name output exists', () => {
      expect(outputs.EcsClusterName).toBeDefined();
      expect(outputs.EcsClusterName).toContain('payment-cluster');
    });

    test('ECS Cluster ARN output exists', () => {
      expect(outputs.EcsClusterArn).toBeDefined();
      expect(outputs.EcsClusterArn).toMatch(/^arn:aws:ecs:/);
    });

    test('S3 Bucket Name output exists', () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toContain('payment-assets');
    });

    test('Secret ARN output exists', () => {
      expect(outputs.SecretArn).toBeDefined();
      expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(outputs.SecretArn).toContain('payment-platform-db-password');
    });
  });

  describe('S3 Storage Integration', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(
          new HeadBucketCommand({
            Bucket: bucketName,
          })
        )
      ).resolves.not.toThrow();
    });

    test('S3 bucket has versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    });

    test('S3 bucket has public access blocked', async () => {
      const bucketName = outputs.S3BucketName;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Infrastructure Naming Conventions', () => {
    test('Resources follow naming convention with environment suffix', () => {
      // Check VPC ID format
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);

      // Check ALB name contains dev suffix
      expect(outputs.AlbDnsName).toContain('-dev');

      // Check RDS identifier contains dev suffix
      expect(outputs.RdsEndpoint).toContain('payment-db-dev');

      // Check ECS cluster contains dev suffix
      expect(outputs.EcsClusterName).toContain('-dev');

      // Check S3 bucket contains dev suffix
      expect(outputs.S3BucketName).toContain('-dev-');

      // Check secret name contains dev suffix
      expect(outputs.SecretArn).toContain('-dev-');
    });

    test('Resources are in correct AWS region', () => {
      // Check ARNs contain correct region
      expect(outputs.AlbArn).toContain(`${region}`);
      expect(outputs.EcsClusterArn).toContain(`${region}`);
      expect(outputs.SecretArn).toContain(`${region}`);

      // Check RDS endpoint contains region
      expect(outputs.RdsEndpoint).toContain(`${region}`);
    });
  });

  describe('End-to-End Validation', () => {
    test('All required outputs are present', () => {
      const requiredOutputs = [
        'VpcId',
        'AlbDnsName',
        'AlbArn',
        'RdsEndpoint',
        'RdsAddress',
        'EcsClusterName',
        'EcsClusterArn',
        'S3BucketName',
        'SecretArn',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('Infrastructure components have correct ARN format', () => {
      // Validate ARN formats
      const arnPattern = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:[0-9]{12}:.+$/;

      expect(outputs.AlbArn).toMatch(arnPattern);
      expect(outputs.EcsClusterArn).toMatch(arnPattern);
      expect(outputs.SecretArn).toMatch(arnPattern);
    });

    test('Database configuration is correct', () => {
      // RDS endpoint should have address and port
      expect(outputs.RdsEndpoint).toContain(outputs.RdsAddress);
      expect(outputs.RdsEndpoint).toMatch(/.+:\d+$/);

      // Check PostgreSQL port
      expect(outputs.RdsEndpoint).toContain(':5432');
    });

    test('S3 bucket is properly configured for production use', async () => {
      const bucketName = outputs.S3BucketName;

      // Verify bucket is accessible
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();

      // Verify versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Verify encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // Verify public access is blocked
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
    });
  });
});
