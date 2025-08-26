
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  S3Client
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Configuration
let outputs: any = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('Warning: cfn-outputs/flat-outputs.json not found. Tests requiring stack outputs will be skipped.');
}

// Environment setup
const environment = process.env.ENVIRONMENT || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK clients
const ec2Client = new EC2Client({ region });
const kmsClient = new KMSClient({ region });


const iamClient = new IAMClient({ region });

const s3Client = new S3Client({ region });

describe('Security and Compliance Integration Tests', () => {

  describe('Infrastructure Outputs Validation', () => {
    test('should have all required security-related outputs', () => {
      if (!outputs.VPCId) {
        console.log('Skipping output validation tests - stack outputs not available');
        return;
      }
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.MainKMSKeyId).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
    });
  });

  describe('VPC and Network Security', () => {
    test('should validate VPC exists with correct configuration', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping VPC configuration test - VPC ID not available');
        return;
      }
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
    });

    test('should validate subnets are in multiple AZs', async () => {
      if (!outputs.PrivateSubnet1Id) {
        console.log('Skipping subnet test - subnet IDs not available');
        return;
      }
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id
        ]
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(4);

      // Get unique AZs
      const uniqueAZs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
    });
  });



  describe('KMS and Encryption', () => {
    test('should validate KMS key configuration', async () => {
      if (!outputs.MainKMSKeyId) {
        console.log('Skipping KMS test - KMS key ID not available');
        return;
      }
      const command = new DescribeKeyCommand({
        KeyId: outputs.MainKMSKeyId
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.Enabled).toBe(true);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      // Check key status
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    // EBS volume tests removed as we don't have EC2 instances anymore
  });





  // EC2 Instance Security tests removed as we don't have EC2 instances anymore
});
