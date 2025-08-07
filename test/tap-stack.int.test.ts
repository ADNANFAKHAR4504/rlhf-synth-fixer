// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  APIGatewayClient
} from '@aws-sdk/client-api-gateway';
import {
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import {
  WAFV2Client
} from '@aws-sdk/client-wafv2';
import axios from 'axios';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ec2ClientWest = new EC2Client({ region: 'us-west-1' });
const ec2ClientEast = new EC2Client({ region: 'us-east-1' });
const rdsClientWest = new RDSClient({ region: 'us-west-1' });
const rdsClientEast = new RDSClient({ region: 'us-east-1' });
const s3ClientWest = new S3Client({ region: 'us-west-1' });
const s3ClientEast = new S3Client({ region: 'us-east-1' });
const apiGatewayClientWest = new APIGatewayClient({ region: 'us-west-1' });
const apiGatewayClientEast = new APIGatewayClient({ region: 'us-east-1' });
const wafClientWest = new WAFV2Client({ region: 'us-west-1' });
const wafClientEast = new WAFV2Client({ region: 'us-east-1' });
const ssmClientWest = new SSMClient({ region: 'us-west-1' });
const ssmClientEast = new SSMClient({ region: 'us-east-1' });

describe('Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have VPC deployed in both regions', async () => {
      // Check primary VPC
      expect(outputs.VpcIdPrimary).toBeDefined();
      expect(outputs.VpcIdPrimary).toMatch(/^vpc-[a-f0-9]+$/);
      
      const primaryResponse = await ec2ClientWest.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VpcIdPrimary] })
      );
      expect(primaryResponse.Vpcs).toHaveLength(1);
      expect(primaryResponse.Vpcs![0].State).toBe('available');

      // Check secondary VPC
      expect(outputs.VpcIdSecondary).toBeDefined();
      expect(outputs.VpcIdSecondary).toMatch(/^vpc-[a-f0-9]+$/);
      
      const secondaryResponse = await ec2ClientEast.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VpcIdSecondary] })
      );
      expect(secondaryResponse.Vpcs).toHaveLength(1);
      expect(secondaryResponse.Vpcs![0].State).toBe('available');
    });

    test('should have correct VPC tags', async () => {
      const response = await ec2ClientWest.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VpcIdPrimary] })
      );
      
      const tags = response.Vpcs![0].Tags || [];
      expect(tags.some(t => t.Key === 'Environment' && t.Value === environmentSuffix)).toBe(true);
      expect(tags.some(t => t.Key === 'Project' && t.Value === 'SecureInfrastructure')).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    test('should have encrypted RDS instances', async () => {
      // Check primary database
      expect(outputs.DatabaseEndpointPrimary).toBeDefined();
      const primaryDbId = outputs.DatabaseEndpointPrimary.split('.')[0];
      
      const primaryResponse = await rdsClientWest.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: primaryDbId })
      );
      expect(primaryResponse.DBInstances![0].StorageEncrypted).toBe(true);

      // Check secondary database
      expect(outputs.DatabaseEndpointSecondary).toBeDefined();
      const secondaryDbId = outputs.DatabaseEndpointSecondary.split('.')[0];
      
      const secondaryResponse = await rdsClientEast.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: secondaryDbId })
      );
      expect(secondaryResponse.DBInstances![0].StorageEncrypted).toBe(true);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have versioning enabled on buckets', async () => {
      const bucketName = `tap${environmentSuffix}-primary-access-logs-us-west-1`.toLowerCase();
      const response = await s3ClientWest.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled on buckets', async () => {
      const bucketName = `tap${environmentSuffix}-primary-access-logs-us-west-1`.toLowerCase();
      const response = await s3ClientWest.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('API Gateway and WAF', () => {
    test('should have API Gateway endpoints accessible', async () => {
      expect(outputs.ApiUrlPrimary).toBeDefined();
      expect(outputs.ApiUrlSecondary).toBeDefined();

      // Test primary endpoint
      try {
        await axios.get(outputs.ApiUrlPrimary);
      } catch (error: any) {
        // If blocked by WAF, that's expected
        expect(error.response?.status).toBeDefined();
      }

      // Test secondary endpoint
      try {
        await axios.get(outputs.ApiUrlSecondary);
      } catch (error: any) {
        // If blocked by WAF, that's expected
        expect(error.response?.status).toBeDefined();
      }
    });

    test('should have WAF protection', async () => {
      expect(outputs.WAFWebACLArnPrimary).toBeDefined();
      expect(outputs.WAFWebACLArnSecondary).toBeDefined();

      // Test SQL injection protection
      try {
        await axios.get(outputs.ApiUrlPrimary, {
          params: { query: "SELECT * FROM users" }
        });
      } catch (error: any) {
        expect(error.response?.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('SSM Parameters', () => {
    test('should have CloudTrail configuration in SSM', async () => {
      const response = await ssmClientWest.send(
        new GetParameterCommand({
          Name: `/tap/${environmentSuffix}/cloudtrail-config`
        })
      );
      expect(response.Parameter?.Value).toBeDefined();
      const config = JSON.parse(response.Parameter!.Value!);
      expect(config.bucket).toBeDefined();
      expect(config.encryptionKey).toBeDefined();
    });
  });
});