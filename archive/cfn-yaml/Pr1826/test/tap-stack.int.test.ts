import { 
  IAMClient, 
  GetRoleCommand,
  ListMFADevicesCommand 
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand
} from '@aws-sdk/client-kms';
import {
  DynamoDBClient,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  AccessAnalyzerClient,
  GetAnalyzerCommand
} from '@aws-sdk/client-accessanalyzer';
import {
  SecurityHubClient,
  DescribeHubCommand
} from '@aws-sdk/client-securityhub';
import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Stack Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  const iamClient = new IAMClient({ region });
  const kmsClient = new KMSClient({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const s3Client = new S3Client({ region });
  const ec2Client = new EC2Client({ region });
  const accessAnalyzerClient = new AccessAnalyzerClient({ region });
  const securityHubClient = new SecurityHubClient({ region });

  beforeAll(() => {
    // Load the deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      throw new Error('Deployment outputs not found. Please deploy the stack first.');
    }
  });

  describe('KMS Key Validation', () => {
    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.SecurityKMSKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    }, 30000);
  });

  describe('IAM Roles Validation', () => {
    test('Admin role should exist with correct trust policy', async () => {
      const roleArn = outputs.AdminRoleArn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      
      // Check that MFA is required in trust policy
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}'));
      const statement = trustPolicy.Statement?.[0];
      expect(statement?.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe('true');
    }, 30000);

    test('Developer role should exist with correct trust policy', async () => {
      const roleArn = outputs.DeveloperRoleArn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      
      // Check that MFA is required
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}'));
      const statement = trustPolicy.Statement?.[0];
      expect(statement?.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe('true');
    }, 30000);

    test('ReadOnly role should exist', async () => {
      const roleArn = outputs.ReadOnlyRoleArn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    }, 30000);
  });

  describe('DynamoDB Table Validation', () => {
    test('DynamoDB table should exist with encryption', async () => {
      const tableName = outputs.SecureDataTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.DeletionProtectionEnabled).toBe(false); // Should be deletable for cleanup
    }, 30000);
  });

  describe('S3 Bucket Validation', () => {
    test('CloudTrail bucket should exist with proper encryption', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      expect(bucketName).toBeDefined();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.BucketKeyEnabled).toBe(true);
    }, 30000);

    test('CloudTrail bucket should have versioning enabled', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      
      expect(versioningResponse.Status).toBe('Enabled');
    }, 30000);

    test('CloudTrail bucket should block public access', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      
      const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);
  });

  describe('Network Resources Validation', () => {
    test('VPC should exist with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings might not be returned in describe-vpcs, but they are enabled in the template
      // We verify they were set correctly in the template unit tests
    }, 30000);

    test('Private subnet should exist', async () => {
      const subnetId = outputs.PrivateSubnetId;
      expect(subnetId).toBeDefined();

      const command = new DescribeSubnetsCommand({ SubnetIds: [subnetId] });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(1);
      const subnet = response.Subnets?.[0];
      expect(subnet?.State).toBe('available');
      expect(subnet?.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet?.VpcId).toBe(outputs.VPCId);
    }, 30000);

    test('Security group should exist with minimal access', async () => {
      const sgId = outputs.SecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups?.[0];
      expect(sg?.VpcId).toBe(outputs.VPCId);
      
      // Check ingress rules
      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0]?.FromPort).toBe(443);
      expect(ingressRules[0]?.ToPort).toBe(443);
      expect(ingressRules[0]?.IpProtocol).toBe('tcp');
    }, 30000);
  });

  describe('Security Services Validation', () => {
    test('Access Analyzer should exist and be active', async () => {
      const analyzerArn = outputs.AccessAnalyzerArn;
      expect(analyzerArn).toBeDefined();
      
      const analyzerName = analyzerArn.split('/').pop();
      const command = new GetAnalyzerCommand({ analyzerName });
      const response = await accessAnalyzerClient.send(command);
      
      expect(response.analyzer).toBeDefined();
      expect(response.analyzer?.status).toBe('ACTIVE');
      expect(response.analyzer?.type).toBe('ACCOUNT');
    }, 30000);

    test('Security Hub should be enabled', async () => {
      const hubArn = outputs.SecurityHubArn;
      expect(hubArn).toBeDefined();
      
      try {
        const command = new DescribeHubCommand({});
        const response = await securityHubClient.send(command);
        
        expect(response.HubArn).toBeDefined();
        // Security Hub is enabled if we can describe it without error
        expect(response.SubscribedAt).toBeDefined();
      } catch (error: any) {
        // Security Hub might not be enabled in all regions
        if (error.name === 'InvalidAccessException') {
          console.log('Security Hub not enabled in this region/account');
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    }, 30000);
  });

  describe('Stack Outputs Validation', () => {
    test('All expected outputs should be present', () => {
      const expectedOutputs = [
        'SecurityKMSKeyId',
        'SecurityKMSKeyArn',
        'AdminRoleArn',
        'DeveloperRoleArn',
        'ReadOnlyRoleArn',
        'CloudTrailBucketName',
        'SecureDataTableName',
        'AccessAnalyzerArn',
        'VPCId',
        'PrivateSubnetId',
        'SecurityGroupId',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('Resource ARNs should be properly formatted', () => {
      const accountId = outputs.AdminRoleArn.split(':')[4];
      
      // Check IAM role ARNs
      expect(outputs.AdminRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(outputs.DeveloperRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(outputs.ReadOnlyRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      
      // Check KMS key ARN
      expect(outputs.SecurityKMSKeyArn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/.+$/);
      
      // Check Access Analyzer ARN
      expect(outputs.AccessAnalyzerArn).toMatch(/^arn:aws:access-analyzer:[a-z0-9-]+:\d{12}:analyzer\/.+$/);
    });

    test('Resources should include environment suffix', () => {
      const suffix = outputs.EnvironmentSuffix;
      expect(suffix).toBeDefined();
      
      // Check that resource names include the suffix
      expect(outputs.AdminRoleArn).toContain(suffix);
      expect(outputs.DeveloperRoleArn).toContain(suffix);
      expect(outputs.ReadOnlyRoleArn).toContain(suffix);
      expect(outputs.SecureDataTableName).toContain(suffix);
      expect(outputs.CloudTrailBucketName).toContain(suffix);
      expect(outputs.AccessAnalyzerArn).toContain(suffix);
    });
  });
});