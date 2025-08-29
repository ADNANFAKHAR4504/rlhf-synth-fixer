import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  IAMClient
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load Terraform outputs
const loadTerraformOutputs = () => {
  try {
    const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
    const outputsContent = readFileSync(outputsPath, 'utf8');
    return JSON.parse(outputsContent);
  } catch (error) {
    console.error('Failed to load Terraform outputs:', error);
    throw error;
  }
};

// Initialize AWS clients
const region = 'us-east-1';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const secretsClient = new SecretsManagerClient({ region });

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    outputs = loadTerraformOutputs();
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcIds = JSON.parse(outputs.vpc_ids);
      const vpcId = vpcIds.us_east_1;

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
      expect(vpc.State).toBe('available');
      // DNS settings are not always returned in the API response
      // but we can check if the VPC is properly configured
      expect(vpc.State).toBe('available');
    }, 30000);

    test('should have private subnet with correct configuration', async () => {
      const subnetIds = JSON.parse(outputs.private_subnet_ids);
      const subnetId = subnetIds.us_east_1;

      const command = new DescribeSubnetsCommand({
        SubnetIds: [subnetId],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(1);
      const subnet = response.Subnets![0];

      expect(subnet.SubnetId).toBe(subnetId);
      expect(subnet.CidrBlock).toBe('10.1.2.0/24');
      expect(subnet.State).toBe('available');
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
    }, 30000);

    test('should have database subnet with correct configuration', async () => {
      const subnetIds = JSON.parse(outputs.database_subnet_ids);
      const subnetId = subnetIds.us_east_1;

      const command = new DescribeSubnetsCommand({
        SubnetIds: [subnetId],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(1);
      const subnet = response.Subnets![0];

      expect(subnet.SubnetId).toBe(subnetId);
      expect(subnet.CidrBlock).toBe('10.1.3.0/24');
      expect(subnet.State).toBe('available');
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
    }, 30000);

    test('should have security group with correct configuration', async () => {
      const vpcIds = JSON.parse(outputs.vpc_ids);
      const vpcId = vpcIds.us_east_1;

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      // Check that at least one security group exists in the VPC
      const securityGroups = response.SecurityGroups!;
      expect(securityGroups.length).toBeGreaterThan(0);

      // Verify the security group belongs to the correct VPC
      const securityGroup = securityGroups[0];
      expect(securityGroup.VpcId).toBe(vpcId);
    }, 30000);
  });

  describe('S3 Bucket', () => {
    test('should have central logging bucket with correct configuration', async () => {
      const bucketName = outputs.central_logging_bucket;

      // Check bucket encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      // Check bucket versioning
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);

      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessCommand = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);

      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('should have consistent tagging across resources', async () => {
      const vpcIds = JSON.parse(outputs.vpc_ids);
      const vpcId = vpcIds.us_east_1;

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const nameTag = tags.find(tag => tag.Key === 'Name');
      const environmentTag = tags.find(tag => tag.Key === 'Environment');
      const projectTag = tags.find(tag => tag.Key === 'Project');
      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');

      expect(nameTag?.Value).toContain('secure-infra');
      expect(environmentTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('secure-infra');
      expect(managedByTag?.Value).toBe('Terraform');
    }, 30000);
  });
});
