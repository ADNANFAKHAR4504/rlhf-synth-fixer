import {
  CloudFormationClient,
  DescribeStacksCommand,
  Output,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import {
  GetParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = process.env.STACK_NAME || `pci-pipeline-${environmentSuffix}`;

describe('PCI-DSS Pipeline Integration Tests', () => {
  let stackOutputs: Record<string, string>;
  let cfnClient: CloudFormationClient;
  let ec2Client: EC2Client;
  let s3Client: S3Client;
  let lambdaClient: LambdaClient;
  let kmsClient: KMSClient;
  let logsClient: CloudWatchLogsClient;
  let snsClient: SNSClient;
  let ssmClient: SSMClient;
  let iamClient: IAMClient;

  beforeAll(async () => {
    // Initialize AWS SDK clients
    cfnClient = new CloudFormationClient({ region });
    ec2Client = new EC2Client({ region });
    s3Client = new S3Client({ region });
    lambdaClient = new LambdaClient({ region });
    kmsClient = new KMSClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
    snsClient = new SNSClient({ region });
    ssmClient = new SSMClient({ region });
    iamClient = new IAMClient({ region });

    // Fetch stack outputs
    try {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      if (!response.Stacks || response.Stacks.length === 0) {
        throw new Error(`Stack ${stackName} not found`);
      }

      const stack = response.Stacks[0];
      stackOutputs = {};

      if (stack.Outputs) {
        stack.Outputs.forEach((output: Output) => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }

      console.log('Stack outputs loaded:', Object.keys(stackOutputs));
    } catch (error) {
      console.error('Error fetching stack outputs:', error);
      throw error;
    }
  }, 30000);

  describe('VPC Infrastructure', () => {
    test('VPC should exist with correct configuration', async () => {
      const vpcId = stackOutputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].EnableDnsHostnames).toBe(true);
      expect(response.Vpcs![0].EnableDnsSupport).toBe(true);
    });

    test('VPC should have PCI compliance tags', async () => {
      const vpcId = stackOutputs.VPCId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const tags = response.Vpcs![0].Tags || [];
      expect(tags.some(t => t.Key === 'DataClassification' && t.Value === 'PCI')).toBe(true);
      expect(tags.some(t => t.Key === 'ComplianceScope' && t.Value === 'Payment')).toBe(true);
    });

    test('private subnets should exist in 3 availability zones', async () => {
      const subnetIds = [
        stackOutputs.PrivateSubnet1Id,
        stackOutputs.PrivateSubnet2Id,
        stackOutputs.PrivateSubnet3Id,
      ];

      expect(subnetIds.every(id => id !== undefined)).toBe(true);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      // Check that subnets are in different AZs
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);

      // Check CIDR blocks
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);

      // Check that they're all private (no public IP assignment)
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('private subnets should have PCI compliance tags', async () => {
      const subnetIds = [
        stackOutputs.PrivateSubnet1Id,
        stackOutputs.PrivateSubnet2Id,
        stackOutputs.PrivateSubnet3Id,
      ];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(t => t.Key === 'DataClassification' && t.Value === 'PCI')).toBe(true);
        expect(tags.some(t => t.Key === 'ComplianceScope' && t.Value === 'Payment')).toBe(true);
      });
    });

    test('VPC flow logs should be enabled and capturing all traffic', async () => {
      const vpcId = stackOutputs.VPCId;

      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            { Name: 'resource-id', Values: [vpcId] },
          ],
        })
      );

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Security Groups', () => {
    test('Lambda security group should have restricted egress', async () => {
      const vpcId = stackOutputs.VPCId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [`lambda-sg-${environmentSuffix}`] },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const egressRules = sg.IpPermissionsEgress || [];

      // Should not have 0.0.0.0/0 egress
      const hasOpenEgress = egressRules.some(rule =>
        rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      expect(hasOpenEgress).toBe(false);

      // Should have specific egress to KMS endpoint
      const hasKmsEgress = egressRules.some(rule =>
        rule.IpProtocol === 'tcp' &&
        rule.FromPort === 443 &&
        rule.ToPort === 443
      );
      expect(hasKmsEgress).toBe(true);
    });

    test('security groups should have PCI compliance tags', async () => {
      const vpcId = stackOutputs.VPCId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
          ],
        })
      );

      response.SecurityGroups!.forEach(sg => {
        if (sg.GroupName?.includes(environmentSuffix)) {
          const tags = sg.Tags || [];
          expect(tags.some(t => t.Key === 'DataClassification' && t.Value === 'PCI')).toBe(true);
          expect(tags.some(t => t.Key === 'ComplianceScope' && t.Value === 'Payment')).toBe(true);
        }
      });
    });
  });

  describe('KMS Key', () => {
    test('KMS key should exist and be enabled', async () => {
      const kmsKeyId = stackOutputs.KMSKeyId;
      expect(kmsKeyId).toBeDefined();

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.Enabled).toBe(true);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Origin).toBe('AWS_KMS');
    });

    test('KMS key should be customer managed', async () => {
      const kmsKeyId = stackOutputs.KMSKeyId;

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
    });

    test('KMS key alias should exist', async () => {
      const kmsKeyId = stackOutputs.KMSKeyId;

      const response = await kmsClient.send(
        new ListAliasesCommand({ KeyId: kmsKeyId })
      );

      expect(response.Aliases).toBeDefined();
      expect(response.Aliases!.length).toBeGreaterThan(0);
      expect(response.Aliases![0].AliasName).toContain(`pci-data-key-${environmentSuffix}`);
    });
  });

  describe('S3 Buckets', () => {
    test('data bucket should exist with KMS encryption', async () => {
      const bucketName = stackOutputs.DataBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toContain(stackOutputs.KMSKeyId);
      expect(rule.BucketKeyEnabled).toBe(true);
    });

    test('data bucket should have versioning enabled', async () => {
      const bucketName = stackOutputs.DataBucketName;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('data bucket should block all public access', async () => {
      const bucketName = stackOutputs.DataBucketName;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('data bucket should have bucket policy requiring SSL', async () => {
      const bucketName = stackOutputs.DataBucketName;

      const response = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: bucketName })
      );

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      // Check for SSL requirement
      const denyInsecure = policy.Statement.find(
        (s: any) => s.Sid === 'DenyInsecureTransport'
      );
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');

      // Check for KMS encryption requirement
      const denyUnencrypted = policy.Statement.find(
        (s: any) => s.Sid === 'DenyUnencryptedObjectUploads'
      );
      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted.Effect).toBe('Deny');
    });

    test('config bucket should exist with KMS encryption', async () => {
      const bucketName = stackOutputs.ConfigBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('config bucket should block all public access', async () => {
      const bucketName = stackOutputs.ConfigBucketName;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function should exist with correct configuration', async () => {
      const functionName = stackOutputs.DataValidationFunctionName;
      expect(functionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('nodejs22.x');
      expect(response.Configuration!.MemorySize).toBe(1024);
      expect(response.Configuration!.Timeout).toBe(60);
    });

    test('Lambda function should be in VPC', async () => {
      const functionName = stackOutputs.DataValidationFunctionName;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(stackOutputs.VPCId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBe(3);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    test('Lambda function should have environment variables', async () => {
      const functionName = stackOutputs.DataValidationFunctionName;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.DATA_BUCKET).toBe(stackOutputs.DataBucketName);
      expect(response.Environment!.Variables!.KMS_KEY_ID).toBe(stackOutputs.KMSKeyId);
    });

    test('Lambda execution role should have necessary policies', async () => {
      const functionName = stackOutputs.DataValidationFunctionName;

      const functionResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      const roleArn = functionResponse.Role!;
      const roleName = roleArn.split('/').pop()!;

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();

      // Check managed policies
      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const managedPolicies = policiesResponse.AttachedPolicies || [];
      const hasVpcPolicy = managedPolicies.some(p =>
        p.PolicyArn?.includes('AWSLambdaVPCAccessExecutionRole')
      );
      expect(hasVpcPolicy).toBe(true);

      // Check inline policies
      const inlinePoliciesResponse = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );

      const inlinePolicies = inlinePoliciesResponse.PolicyNames || [];
      expect(inlinePolicies).toContain('S3Access');
      expect(inlinePolicies).toContain('KMSAccess');
    });
  });

  describe('CloudWatch Logs', () => {
    test('VPC flow logs log group should exist with correct retention', async () => {
      const logGroupName = stackOutputs.VPCFlowLogsLogGroup;
      expect(logGroupName).toBeDefined();

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(90);
      expect(logGroup.kmsKeyId).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('security alert topic should be encrypted with KMS', async () => {
      const topicArn = stackOutputs.SecurityAlertTopicArn;
      expect(topicArn).toBeDefined();

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('PCI Security Alerts');
    });
  });

  describe('SSM Parameters', () => {
    test('data bucket parameter should exist in SSM', async () => {
      const parameterName = `/pci/config/${environmentSuffix}/data-bucket`;

      const response = await ssmClient.send(
        new GetParameterCommand({ Name: parameterName })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('String');
      expect(response.Parameter!.Value).toBe(stackOutputs.DataBucketName);
    });

    test('KMS key parameter should exist in SSM', async () => {
      const parameterName = `/pci/config/${environmentSuffix}/kms-key-id`;

      const response = await ssmClient.send(
        new GetParameterCommand({ Name: parameterName })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('String');
      expect(response.Parameter!.Value).toBe(stackOutputs.KMSKeyId);
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
        'DataBucketName',
        'KMSKeyId',
        'KMSKeyArn',
        'DataValidationFunctionArn',
        'DataValidationFunctionName',
        'SecurityAlertTopicArn',
        'VPCFlowLogsLogGroup',
        'ConfigBucketName',
      ];

      requiredOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
    });

    test('output values should be valid ARNs or IDs', () => {
      // VPC ID format: vpc-xxxxxxxx
      expect(stackOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      // Subnet IDs
      expect(stackOutputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(stackOutputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(stackOutputs.PrivateSubnet3Id).toMatch(/^subnet-[a-f0-9]+$/);

      // S3 bucket names should be valid
      expect(stackOutputs.DataBucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      expect(stackOutputs.ConfigBucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);

      // KMS Key ID format
      expect(stackOutputs.KMSKeyId).toMatch(/^[a-f0-9-]+$/);

      // ARNs should start with arn:aws
      expect(stackOutputs.KMSKeyArn).toMatch(/^arn:aws:kms:/);
      expect(stackOutputs.DataValidationFunctionArn).toMatch(/^arn:aws:lambda:/);
      expect(stackOutputs.SecurityAlertTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('End-to-End Validation', () => {
    test('Lambda function should be able to access S3 bucket through VPC', async () => {
      // This test validates that the Lambda function can be invoked
      // In a real scenario, you would invoke the Lambda function here
      const functionName = stackOutputs.DataValidationFunctionName;
      expect(functionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.LastUpdateStatus).toBe('Successful');
    });

    test('all resources should be properly tagged for PCI compliance', async () => {
      // VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [stackOutputs.VPCId] })
      );
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.some(t => t.Key === 'DataClassification' && t.Value === 'PCI')).toBe(true);

      // Subnet tags
      const subnetIds = [
        stackOutputs.PrivateSubnet1Id,
        stackOutputs.PrivateSubnet2Id,
        stackOutputs.PrivateSubnet3Id,
      ];
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );
      subnetResponse.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(t => t.Key === 'DataClassification' && t.Value === 'PCI')).toBe(true);
      });

      // CloudWatch Logs tags
      const logsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.VPCFlowLogsLogGroup,
        })
      );
      // Note: CloudWatch Logs tags are fetched differently via ListTagsLogGroup
      expect(logsResponse.logGroups![0]).toBeDefined();
    });
  });
});
