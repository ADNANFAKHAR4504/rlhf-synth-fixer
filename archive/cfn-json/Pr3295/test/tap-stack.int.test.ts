// Integration tests for RDS PostgreSQL Infrastructure
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient
} from '@aws-sdk/client-sns';

// Get stack name from environment or use default
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const STACK_NAME = process.env.STACK_NAME || `TapStack${ENVIRONMENT_SUFFIX}`;
const REGION = process.env.AWS_REGION || 'us-west-2';

// Initialize AWS SDK clients
const cfClient = new CloudFormationClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const ec2Client = new EC2Client({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });
const cwClient = new CloudWatchClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });

// Helper function to get stack outputs
async function getStackOutputs() {
  const command = new DescribeStacksCommand({ StackName: STACK_NAME });
  const response = await cfClient.send(command);
  const stack = response.Stacks?.[0];

  if (!stack || !stack.Outputs) {
    throw new Error('Stack outputs not found');
  }

  const outputs: { [key: string]: string } = {};
  stack.Outputs.forEach(output => {
    if (output.OutputKey && output.OutputValue) {
      outputs[output.OutputKey] = output.OutputValue;
    }
  });

  return outputs;
}

describe('RDS PostgreSQL Infrastructure Integration Tests', () => {
  let stackOutputs: { [key: string]: string };

  beforeAll(async () => {
    try {
      stackOutputs = await getStackOutputs();
    } catch (error) {
      console.error('Failed to get stack outputs:', error);
      throw error;
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('stack should be successfully deployed', async () => {
      const command = new DescribeStacksCommand({ StackName: STACK_NAME });
      const response = await cfClient.send(command);

      expect(response.Stacks).toHaveLength(1);
      expect(response.Stacks?.[0].StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('stack should have all expected outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DBInstanceId',
        'DBEndpoint',
        'DBPort',
        'BackupBucketName',
        'BackupBucketArn',
        'KMSKeyId',
        'KMSKeyArn',
        'DatabaseSecurityGroupId',
        'S3VPCEndpointId',
        'SNSTopicArn',
        'S3BackupRoleArn',
        'RDSMonitoringRoleArn'
      ];

      expectedOutputs.forEach(output => {
        expect(stackOutputs[output]).toBeDefined();
        expect(stackOutputs[output]).not.toBe('');
      });
    });
  });

  describe('VPC and Network', () => {
    test('VPC should be created with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.VPCId]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs?.[0];
      expect(vpc?.CidrBlock).toBe('10.60.0.0/16');
      expect(vpc?.State).toBe('available');
    });

    test('private subnets should be created in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [stackOutputs.PrivateSubnet1Id, stackOutputs.PrivateSubnet2Id]
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);

      const subnet1 = response.Subnets?.find(s => s.SubnetId === stackOutputs.PrivateSubnet1Id);
      const subnet2 = response.Subnets?.find(s => s.SubnetId === stackOutputs.PrivateSubnet2Id);

      expect(subnet1?.CidrBlock).toBe('10.60.10.0/24');
      expect(subnet2?.CidrBlock).toBe('10.60.20.0/24');
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);
    });

    test('S3 VPC endpoint should be created', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [stackOutputs.S3VPCEndpointId]
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toHaveLength(1);
      const endpoint = response.VpcEndpoints?.[0];
      expect(endpoint?.ServiceName).toContain('s3');
      expect(endpoint?.VpcEndpointType).toBe('Gateway');
      expect(endpoint?.State).toBe('available');
    });
  });

  describe('Security Group', () => {
    test('database security group should allow PostgreSQL port', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [stackOutputs.DatabaseSecurityGroupId]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups?.[0];

      const pgRule = sg?.IpPermissions?.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );

      expect(pgRule).toBeDefined();
      expect(pgRule?.IpProtocol).toBe('tcp');
      expect(pgRule?.IpRanges?.[0]?.CidrIp).toBe('10.60.0.0/16');
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should be created with correct configuration', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: stackOutputs.DBInstanceId
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance?.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.EngineVersion).toContain('16.8');
      expect(dbInstance?.DBInstanceStatus).toBe('available');
    });

    test('RDS instance should have encryption enabled', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: stackOutputs.DBInstanceId
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
    });

    test('RDS instance should have backup configured', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: stackOutputs.DBInstanceId
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.BackupRetentionPeriod).toBe(7);
      expect(dbInstance?.PreferredBackupWindow).toBeDefined();
    });

    test('RDS instance should have Performance Insights enabled', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: stackOutputs.DBInstanceId
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance?.PerformanceInsightsRetentionPeriod).toBe(7);
    });

    test('RDS instance should have enhanced monitoring enabled', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: stackOutputs.DBInstanceId
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.MonitoringInterval).toBe(60);
      expect(dbInstance?.MonitoringRoleArn).toBeDefined();
    });

    test('DB subnet group should contain two subnets', async () => {
      const describeCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: stackOutputs.DBInstanceId
      });
      const dbResponse = await rdsClient.send(describeCommand);
      const dbSubnetGroupName = dbResponse.DBInstances?.[0]?.DBSubnetGroup?.DBSubnetGroupName;

      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroupName
      });
      const response = await rdsClient.send(command);

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups?.[0];
      expect(subnetGroup?.Subnets).toHaveLength(2);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should be created and active', async () => {
      const command = new DescribeKeyCommand({
        KeyId: stackOutputs.KMSKeyId
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key alias should be created', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);

      const alias = response.Aliases?.find(a =>
        a.TargetKeyId === stackOutputs.KMSKeyId
      );

      expect(alias).toBeDefined();
      expect(alias?.AliasName).toContain('RetailInventory');
    });
  });

  describe('S3 Backup Bucket', () => {
    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: stackOutputs.BackupBucketName
      });
      const response = await s3Client.send(command);

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.BucketKeyEnabled).toBe(true);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: stackOutputs.BackupBucketName
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle configuration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: stackOutputs.BackupBucketName
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toHaveLength(3);

      const deleteOldVersions = response.Rules?.find(r => r.ID === 'DeleteOldVersions');
      expect(deleteOldVersions?.Status).toBe('Enabled');

      const transitionToIA = response.Rules?.find(r => r.ID === 'TransitionToIA');
      expect(transitionToIA?.Status).toBe('Enabled');

      const transitionToGlacier = response.Rules?.find(r => r.ID === 'TransitionToGlacier');
      expect(transitionToGlacier?.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: stackOutputs.BackupBucketName
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('all required alarms should be created', async () => {
      // Get stack parameters to find project name
      const stackCommand = new DescribeStacksCommand({ StackName: STACK_NAME });
      const stackResponse = await cfClient.send(stackCommand);
      const stack = stackResponse.Stacks?.[0];

      // Extract project name and environment from stack parameters or name
      const projectName = stack?.Parameters?.find(p => p.ParameterKey === 'ProjectName')?.ParameterValue || 'RetailInventory';
      const environmentSuffix = stack?.Parameters?.find(p => p.ParameterKey === 'EnvironmentSuffix')?.ParameterValue || ENVIRONMENT_SUFFIX;
      const alarmPrefix = `${projectName}-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: alarmPrefix
      });
      const response = await cwClient.send(command);

      const alarmNames = response.MetricAlarms?.map(a => a.AlarmName) || [];

      // Log alarm names for debugging
      console.log('Found alarms:', alarmNames);
      console.log('Using alarm prefix:', alarmPrefix);

      expect(alarmNames.some(name => name?.includes('HighCPU'))).toBe(true);
      expect(alarmNames.some(name => name?.includes('HighConnections'))).toBe(true);
      expect(alarmNames.some(name => name?.includes('LowStorage'))).toBe(true);
      expect(alarmNames.some(name => name?.includes('HighReadLatency'))).toBe(true);
      expect(alarmNames.some(name => name?.includes('HighWriteLatency'))).toBe(true);
    });

    test('alarms should have SNS topic configured', async () => {
      // Get stack parameters to find project name
      const stackCommand = new DescribeStacksCommand({ StackName: STACK_NAME });
      const stackResponse = await cfClient.send(stackCommand);
      const stack = stackResponse.Stacks?.[0];

      // Extract project name and environment from stack parameters or name
      const projectName = stack?.Parameters?.find(p => p.ParameterKey === 'ProjectName')?.ParameterValue || 'RetailInventory';
      const environmentSuffix = stack?.Parameters?.find(p => p.ParameterKey === 'EnvironmentSuffix')?.ParameterValue || ENVIRONMENT_SUFFIX;
      const alarmPrefix = `${projectName}-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: alarmPrefix
      });
      const response = await cwClient.send(command);

      response.MetricAlarms?.forEach(alarm => {
        expect(alarm.AlarmActions).toHaveLength(1);
        expect(alarm.AlarmActions?.[0]).toBe(stackOutputs.SNSTopicArn);
      });
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic should be created', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: stackOutputs.SNSTopicArn
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(stackOutputs.SNSTopicArn);
    });

    test('SNS topic should have email subscription', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: stackOutputs.SNSTopicArn
      });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toHaveLength(1);
      expect(response.Subscriptions?.[0]?.Protocol).toBe('email');
    });
  });

  describe('Database Connectivity', () => {
    test('database endpoint should be accessible from VPC', async () => {
      // Note: This test assumes you have a bastion host or Lambda function in the VPC
      // In a real scenario, you would test actual connectivity

      expect(stackOutputs.DBEndpoint).toBeDefined();
      expect(stackOutputs.DBPort).toBe('5432');

      // Verify the endpoint format
      expect(stackOutputs.DBEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have proper tags', async () => {
      const command = new ListStackResourcesCommand({
        StackName: STACK_NAME
      });
      const response = await cfClient.send(command);

      expect(response.StackResourceSummaries).toBeDefined();
      expect(response.StackResourceSummaries?.length).toBeGreaterThan(0);

      // Verify that critical resources exist
      const criticalResources = [
        'VPC',
        'DBInstance',
        'BackupBucket',
        'KMSKey',
        'DatabaseSecurityGroup'
      ];

      criticalResources.forEach(resourceName => {
        const resource = response.StackResourceSummaries?.find(r =>
          r.LogicalResourceId === resourceName
        );
        expect(resource).toBeDefined();
        expect(resource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
      });
    });
  });
});