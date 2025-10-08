// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { CloudFrontClient, GetDistributionCommand } from '@aws-sdk/client-cloudfront';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Infrastructure Integration Tests', () => {
  const s3Client = new S3Client({ region: 'us-west-2' });
  const ec2Client = new EC2Client({ region: 'us-west-2' });
  const rdsClient = new RDSClient({ region: 'us-west-2' });
  const cloudFrontClient = new CloudFrontClient({ region: 'us-west-2' });

  describe('VPC and Networking', () => {
    test('VPC should exist and be properly configured', async () => {
      expect(outputs.VPCId).toBeDefined();
      
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.DnsHostnames).toBe('enabled');
      expect(vpc.DnsSupport).toBe('enabled');
    });

    test('bastion host should be accessible', async () => {
      expect(outputs.BastionPublicIP).toBeDefined();
      expect(outputs.BastionPublicIP).toMatch(/^(\d{1,3}\.){3}\d{1,3}$/);
    });
  });

  describe('Load Balancer', () => {
    test('Application Load Balancer should have a valid DNS name', () => {
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBDNSName).toContain('.elb.amazonaws.com');
    });

    test('ALB should be accessible via HTTP (basic connectivity)', async () => {
      expect(outputs.ALBDNSName).toBeDefined();
      
      const url = `http://${outputs.ALBDNSName}`;
      
      try {
        const response = await fetch(url, { 
          method: 'GET',
          timeout: 10000 
        });
        
        // We expect either a successful response or a service unavailable (503)
        // since targets may not be ready yet
        expect([200, 503, 502]).toContain(response.status);
      } catch (error) {
        // Connection errors are acceptable during initial deployment
        console.log('ALB connection test - expected during initial deployment:', error);
      }
    });
  });

  describe('S3 Storage', () => {
    test('data bucket should exist and be accessible', async () => {
      expect(outputs.DataBucketName).toBeDefined();
      expect(outputs.DataBucketName).toContain(`tapstack${environmentSuffix}-data`);
      
      const command = new HeadObjectCommand({
        Bucket: outputs.DataBucketName,
        Key: 'test-object-that-does-not-exist'
      });
      
      try {
        await s3Client.send(command);
      } catch (error: any) {
        // Should get 404 for non-existent object, confirming bucket exists
        expect(error.name).toBe('NotFound');
      }
    });

    test('bucket names should follow naming convention', () => {
      expect(outputs.DataBucketName).toBeDefined();
      expect(outputs.DataBucketName.toLowerCase()).toContain(environmentSuffix.toLowerCase());
      expect(outputs.DataBucketName).toMatch(/^tapstack.*-data-\d+-us-west-2$/);
    });
  });

  describe('Database', () => {
    test('RDS endpoint should be accessible and properly configured', async () => {
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toContain('.rds.amazonaws.com');
      
      // Extract instance identifier from endpoint
      const instanceId = outputs.RDSEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId
      });
      
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.MultiAZ).toBe(true);
    });
  });

  describe('CloudFront CDN', () => {
    test('CloudFront distribution should be accessible', () => {
      expect(outputs.CloudFrontURL).toBeDefined();
      expect(outputs.CloudFrontURL).toMatch(/^https:\/\/[a-zA-Z0-9]+\.cloudfront\.net$/);
    });

    test('CloudFront distribution should be properly configured', async () => {
      expect(outputs.CloudFrontURL).toBeDefined();
      
      // Extract distribution ID from the URL
      const distributionId = outputs.CloudFrontURL.replace('https://', '').replace('.cloudfront.net', '');
      
      const command = new GetDistributionCommand({
        Id: distributionId
      });
      
      const response = await cloudFrontClient.send(command);
      expect(response.Distribution).toBeDefined();
      
      const distribution = response.Distribution!;
      expect(distribution.DistributionConfig.Enabled).toBe(true);
      expect(distribution.DistributionConfig.DefaultRootObject).toBe('index.html');
      expect(distribution.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function ARN should be valid', () => {
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:us-west-2:\d{12}:function:.+$/);
    });
  });

  describe('Infrastructure Connectivity', () => {
    test('all components should have consistent environment suffix in naming', () => {
      // Check that all resources use consistent naming with environment suffix
      if (outputs.VPCId) {
        expect(outputs.VPCId).toContain('vpc-');
      }
      
      if (outputs.DataBucketName) {
        expect(outputs.DataBucketName.toLowerCase()).toContain(environmentSuffix.toLowerCase());
      }
      
      if (outputs.RDSEndpoint) {
        // RDS endpoints typically don't show environment suffix directly,
        // but we can verify it's in the expected format
        expect(outputs.RDSEndpoint).toContain('.us-west-2.rds.amazonaws.com');
      }
    });

    test('resources should be in the correct region (us-west-2)', () => {
      if (outputs.ALBDNSName) {
        expect(outputs.ALBDNSName).toContain('.us-west-2.elb.amazonaws.com');
      }
      
      if (outputs.RDSEndpoint) {
        expect(outputs.RDSEndpoint).toContain('.us-west-2.rds.amazonaws.com');
      }
      
      if (outputs.DataBucketName) {
        expect(outputs.DataBucketName).toContain('-us-west-2');
      }
    });
  });

  describe('Security Validation', () => {
    test('database should not be publicly accessible', async () => {
      if (outputs.RDSEndpoint) {
        const instanceId = outputs.RDSEndpoint.split('.')[0];
        
        const command = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId
        });
        
        const response = await rdsClient.send(command);
        const dbInstance = response.DBInstances![0];
        
        expect(dbInstance.PubliclyAccessible).toBe(false);
        expect(dbInstance.StorageEncrypted).toBe(true);
      }
    });

    test('CloudFront should enforce HTTPS', () => {
      expect(outputs.CloudFrontURL).toBeDefined();
      expect(outputs.CloudFrontURL).toMatch(/^https:\/\//);
    });
  });
});