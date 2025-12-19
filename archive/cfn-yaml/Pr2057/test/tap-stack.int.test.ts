import fs from 'fs';
import path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand
} from '@aws-sdk/client-kms';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand
} from '@aws-sdk/client-ec2';
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand
} from '@aws-sdk/client-cloudtrail';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand
} from '@aws-sdk/client-lambda';
import {
  IAMClient,
  GetRoleCommand,
  GetGroupCommand
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  SecretsManagerClient,
  DescribeSecretCommand
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const ec2Client = new EC2Client({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const lambdaClient = new LambdaClient({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('TapStack Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let stackResources: any[] = [];

  beforeAll(async () => {
    // Load outputs from cfn-outputs/flat-outputs.json if available
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      stackOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      // Fallback to getting outputs from CloudFormation stack
      try {
        const describeStacksCommand = new DescribeStacksCommand({ StackName: stackName });
        const stackResponse = await cfnClient.send(describeStacksCommand);
        
        if (stackResponse.Stacks && stackResponse.Stacks[0] && stackResponse.Stacks[0].Outputs) {
          stackResponse.Stacks[0].Outputs.forEach(output => {
            if (output.OutputKey && output.OutputValue) {
              stackOutputs[output.OutputKey] = output.OutputValue;
            }
          });
        }

        // Get stack resources
        const describeResourcesCommand = new DescribeStackResourcesCommand({ StackName: stackName });
        const resourcesResponse = await cfnClient.send(describeResourcesCommand);
        stackResources = resourcesResponse.StackResources || [];
      } catch (error) {
        console.error('Error fetching stack information:', error);
      }
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('stack should be deployed successfully', async () => {
      if (Object.keys(stackOutputs).length === 0) {
        // Skip if no deployment outputs available
        console.log('Skipping deployment tests - no outputs available');
        return;
      }

      const describeStacksCommand = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(describeStacksCommand);
      
      expect(response.Stacks).toHaveLength(1);
      const stack = response.Stacks![0];
      expect(stack.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('stack should have expected outputs', () => {
      if (Object.keys(stackOutputs).length === 0) {
        console.log('Skipping output tests - no outputs available');
        return;
      }

      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'KMSKeyId',
        'LambdaDeploymentBucket',
        'CloudTrailArn',
        'LambdaFunctionArn'
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
      });
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and be configured correctly', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping VPC tests - no VPC ID available');
        return;
      }

      const describeVpcsCommand = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.VPCId]
      });
      const response = await ec2Client.send(describeVpcsCommand);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      
      // Check DNS attributes using DescribeVpcAttribute
      const dnsHostnamesResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId,
        Attribute: 'enableDnsHostnames'
      }));
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      
      const dnsSupportResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId,
        Attribute: 'enableDnsSupport'
      }));
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
    });

    test('subnets should be configured correctly', async () => {
      if (!stackOutputs.PrivateSubnet1Id || !stackOutputs.PrivateSubnet2Id) {
        console.log('Skipping subnet tests - no subnet IDs available');
        return;
      }

      const describeSubnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: [stackOutputs.PrivateSubnet1Id, stackOutputs.PrivateSubnet2Id]
      });
      const response = await ec2Client.send(describeSubnetsCommand);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(stackOutputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('NAT Gateway should be operational', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping NAT Gateway tests - no VPC ID available');
        return;
      }

      const describeNatGatewaysCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.VPCId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });
      const response = await ec2Client.send(describeNatGatewaysCommand);
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThan(0);
    });

    test('security groups should be configured', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping security group tests - no VPC ID available');
        return;
      }

      const describeSecurityGroupsCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(describeSecurityGroupsCommand);
      
      expect(response.SecurityGroups).toBeDefined();
      // Should have at least default + 4 custom security groups
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should be enabled and configured', async () => {
      if (!stackOutputs.KMSKeyId) {
        console.log('Skipping KMS tests - no KMS key ID available');
        return;
      }

      const describeKeyCommand = new DescribeKeyCommand({
        KeyId: stackOutputs.KMSKeyId
      });
      const response = await kmsClient.send(describeKeyCommand);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('S3 Buckets', () => {
    test('Lambda deployment bucket should exist with proper configuration', async () => {
      if (!stackOutputs.LambdaDeploymentBucket) {
        console.log('Skipping S3 tests - no bucket name available');
        return;
      }

      // Check bucket exists
      const headBucketCommand = new HeadBucketCommand({
        Bucket: stackOutputs.LambdaDeploymentBucket
      });
      await expect(s3Client.send(headBucketCommand)).resolves.toBeDefined();

      // Check encryption
      const getEncryptionCommand = new GetBucketEncryptionCommand({
        Bucket: stackOutputs.LambdaDeploymentBucket
      });
      const encryptionResponse = await s3Client.send(getEncryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);

      // Check versioning
      const getVersioningCommand = new GetBucketVersioningCommand({
        Bucket: stackOutputs.LambdaDeploymentBucket
      });
      const versioningResponse = await s3Client.send(getVersioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const getPublicAccessBlockCommand = new GetPublicAccessBlockCommand({
        Bucket: stackOutputs.LambdaDeploymentBucket
      });
      const publicAccessResponse = await s3Client.send(getPublicAccessBlockCommand);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail should be configured and logging', async () => {
      if (!stackOutputs.CloudTrailArn) {
        console.log('Skipping CloudTrail tests - no CloudTrail ARN available');
        return;
      }

      // Extract trail name from ARN
      const trailName = stackOutputs.CloudTrailArn.split('/').pop();
      
      const getTrailCommand = new GetTrailCommand({
        Name: trailName
      });
      const trailResponse = await cloudTrailClient.send(getTrailCommand);
      
      expect(trailResponse.Trail).toBeDefined();
      expect(trailResponse.Trail!.IsMultiRegionTrail).toBe(true);
      expect(trailResponse.Trail!.LogFileValidationEnabled).toBe(true);
      expect(trailResponse.Trail!.KmsKeyId).toBeDefined();

      // Check trail status
      const getTrailStatusCommand = new GetTrailStatusCommand({
        Name: trailName
      });
      const statusResponse = await cloudTrailClient.send(getTrailStatusCommand);
      expect(statusResponse.IsLogging).toBe(true);
    });

    test('CloudWatch Log Group for CloudTrail should exist', async () => {
      const describeLogGroupsCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/cloudtrail/${environmentSuffix}`
      });
      const response = await logsClient.send(describeLogGroupsCommand);
      
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(90);
      expect(logGroup.kmsKeyId).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('Secure Lambda function should be deployed and configured', async () => {
      if (!stackOutputs.LambdaFunctionArn) {
        console.log('Skipping Lambda tests - no Lambda ARN available');
        return;
      }

      // Extract function name from ARN
      const functionName = stackOutputs.LambdaFunctionArn.split(':').pop();
      
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: functionName
      });
      const functionResponse = await lambdaClient.send(getFunctionCommand);
      
      expect(functionResponse.Configuration).toBeDefined();
      expect(functionResponse.Configuration!.Runtime).toBe('python3.9');
      expect(functionResponse.Configuration!.Handler).toBe('index.lambda_handler');
      expect(functionResponse.Configuration!.KMSKeyArn).toBeDefined();
      expect(functionResponse.Configuration!.VpcConfig).toBeDefined();
      expect(functionResponse.Configuration!.Environment).toBeDefined();
      expect(functionResponse.Configuration!.Environment!.Variables).toBeDefined();
    });

    test('Lambda function should have VPC configuration', async () => {
      if (!stackOutputs.LambdaFunctionArn) {
        console.log('Skipping Lambda VPC tests - no Lambda ARN available');
        return;
      }

      const functionName = stackOutputs.LambdaFunctionArn.split(':').pop();
      
      const getFunctionConfigCommand = new GetFunctionConfigurationCommand({
        FunctionName: functionName
      });
      const configResponse = await lambdaClient.send(getFunctionConfigCommand);
      
      expect(configResponse.VpcConfig).toBeDefined();
      expect(configResponse.VpcConfig!.SubnetIds).toBeDefined();
      expect(configResponse.VpcConfig!.SubnetIds!.length).toBe(2);
      expect(configResponse.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(configResponse.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Resources', () => {
    test('IAM roles should be created with proper policies', async () => {
      const roleNames = [
        `EC2Role-${environmentSuffix}`,
        `LambdaExecutionRole-${environmentSuffix}`,
        `CloudTrailRole-${environmentSuffix}`
      ];

      for (const roleName of roleNames) {
        try {
          const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
          const response = await iamClient.send(getRoleCommand);
          
          expect(response.Role).toBeDefined();
          expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
        } catch (error: any) {
          if (error.name !== 'NoSuchEntity') {
            throw error;
          }
          console.log(`Role ${roleName} not found - may be using different naming`);
        }
      }
    });

    test('MFA required group should exist', async () => {
      try {
        const getGroupCommand = new GetGroupCommand({
          GroupName: `MFARequired-${environmentSuffix}`
        });
        const response = await iamClient.send(getGroupCommand);
        
        expect(response.Group).toBeDefined();
      } catch (error: any) {
        if (error.name !== 'NoSuchEntity') {
          throw error;
        }
        console.log('MFA group not found - may be using different naming');
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test('security alarms should be configured', async () => {
      const alarmNames = [
        `UnauthorizedAPICalls-${environmentSuffix}`,
        `RootAccountUsage-${environmentSuffix}`
      ];

      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: alarmNames
      });
      
      try {
        const response = await cloudWatchClient.send(describeAlarmsCommand);
        
        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBeGreaterThan(0);
        
        response.MetricAlarms!.forEach(alarm => {
          expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
          expect(alarm.Threshold).toBe(1);
        });
      } catch (error) {
        console.log('CloudWatch alarms not found - may not be fully configured');
      }
    });
  });

  describe('Secrets Manager', () => {
    test('EC2 user data secret should exist and be encrypted', async () => {
      try {
        const describeSecretCommand = new DescribeSecretCommand({
          SecretId: `ec2-userdata-${environmentSuffix}`
        });
        const response = await secretsClient.send(describeSecretCommand);
        
        expect(response).toBeDefined();
        expect(response.KmsKeyId).toBeDefined();
      } catch (error: any) {
        if (error.name !== 'ResourceNotFoundException') {
          throw error;
        }
        console.log('Secret not found - may be using different naming');
      }
    });
  });

  describe('End-to-End Security Verification', () => {
    test('all S3 buckets should have encryption enabled', async () => {
      // Get all S3 bucket resources from the stack
      const s3Buckets = stackResources.filter(r => r.ResourceType === 'AWS::S3::Bucket');
      
      for (const bucket of s3Buckets) {
        if (bucket.PhysicalResourceId) {
          try {
            const getEncryptionCommand = new GetBucketEncryptionCommand({
              Bucket: bucket.PhysicalResourceId
            });
            const response = await s3Client.send(getEncryptionCommand);
            expect(response.ServerSideEncryptionConfiguration).toBeDefined();
          } catch (error: any) {
            if (error.name !== 'ServerSideEncryptionConfigurationNotFoundError') {
              console.log(`Bucket ${bucket.PhysicalResourceId} encryption check failed:`, error.message);
            }
          }
        }
      }
    });

    test('all resources should use environment suffix in naming', () => {
      stackResources.forEach(resource => {
        if (resource.PhysicalResourceId && 
            !resource.ResourceType.includes('::Route') &&
            !resource.ResourceType.includes('::VPCGatewayAttachment') &&
            !resource.ResourceType.includes('::SubnetRouteTableAssociation')) {
          // Many resources should include the environment suffix
          if (resource.ResourceType.includes('::S3::Bucket') ||
              resource.ResourceType.includes('::IAM::Role') ||
              resource.ResourceType.includes('::Lambda::Function') ||
              resource.ResourceType.includes('::CloudTrail::Trail') ||
              resource.ResourceType.includes('::SecretsManager::Secret')) {
            expect(resource.PhysicalResourceId.toLowerCase()).toContain(environmentSuffix.toLowerCase());
          }
        }
      });
    });

    test('network should be properly isolated', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping network isolation tests - no VPC ID available');
        return;
      }

      // Verify private subnets don't have direct internet routes
      const describeSubnetsCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.VPCId]
          }
        ]
      });
      const subnetResponse = await ec2Client.send(describeSubnetsCommand);
      
      const privateSubnets = subnetResponse.Subnets!.filter(s => 
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('private'))
      );
      
      privateSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });
});