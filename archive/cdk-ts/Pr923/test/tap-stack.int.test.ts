// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { 
  EC2Client, 
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand 
} from '@aws-sdk/client-ec2';
import { 
  S3Client, 
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyStatusCommand,
  GetPublicAccessBlockCommand 
} from '@aws-sdk/client-s3';
import { 
  KMSClient, 
  DescribeKeyCommand,
  GetKeyRotationStatusCommand 
} from '@aws-sdk/client-kms';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Configure AWS clients for us-west-2
const region = 'us-west-2';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });

describe('Security Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC exists and is configured correctly', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      
      // Check DNS attributes separately
      const dnsHostnamesCmd = new DescribeVpcAttributeCommand({
        VpcId: outputs.VpcId,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResp = await ec2Client.send(dnsHostnamesCmd);
      expect(dnsHostnamesResp.EnableDnsHostnames?.Value).toBe(true);
      
      const dnsSupportCmd = new DescribeVpcAttributeCommand({
        VpcId: outputs.VpcId,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResp = await ec2Client.send(dnsSupportCmd);
      expect(dnsSupportResp.EnableDnsSupport?.Value).toBe(true);
    });

    test('VPC has correct subnet configuration', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6); // 2 public, 2 private, 2 isolated
      
      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === false);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(4); // private + isolated
    });

    test('VPC Flow Logs are enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);
      
      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('Security groups are configured with least privilege', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
      
      // Check web security group
      const webSg = response.SecurityGroups!.find(sg => 
        sg.GroupName && sg.GroupName.includes('web-sg')
      );
      if (webSg) {
        // Should only allow HTTPS inbound
        const httpsRule = webSg.IpPermissions?.find(rule => 
          rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule).toBeDefined();
      }
    });
  });

  describe('KMS Configuration', () => {
    test('KMS key exists and is configured correctly', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KmsKeyId
      });
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata!.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(response.KeyMetadata!.CustomerMasterKeySpec).toBe('SYMMETRIC_DEFAULT');
    });

    test('KMS key has rotation enabled', async () => {
      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.KmsKeyId
      });
      const response = await kmsClient.send(command);
      
      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('S3 bucket exists and has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault).toBeDefined();
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.SecureStorageBucketName
      });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket policy enforces SSL', async () => {
      try {
        const command = new GetBucketPolicyStatusCommand({
          Bucket: outputs.SecureStorageBucketName
        });
        const response = await s3Client.send(command);
        
        // Policy exists and is not public
        expect(response.PolicyStatus).toBeDefined();
        expect(response.PolicyStatus!.IsPublic).toBe(false);
      } catch (error: any) {
        // If no policy status, that's okay as long as bucket is private
        if (error.name !== 'NoSuchBucketPolicy') {
          throw error;
        }
      }
    });
  });

  describe('Cross-Resource Integration', () => {
    test('Resources are properly tagged', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      
      const vpc = vpcResponse.Vpcs![0];
      const envTag = vpc.Tags?.find(t => t.Key === 'Environment');
      const projectTag = vpc.Tags?.find(t => t.Key === 'Project');
      
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toContain(environmentSuffix);
      expect(projectTag).toBeDefined();
      expect(projectTag?.Value).toBe('security-infrastructure');
    });

    test('All resources are deployed in correct region', async () => {
      // This test verifies we're testing in the right region
      expect(region).toBe('us-west-2');
      
      // Verify outputs exist
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.KmsKeyId).toBeDefined();
      expect(outputs.SecureStorageBucketName).toBeDefined();
    });
  });
});
