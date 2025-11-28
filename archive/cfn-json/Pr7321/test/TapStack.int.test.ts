import * as fs from 'fs';
import * as path from 'path';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeGlobalClustersCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  Route53Client,
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
  GetHealthCheckCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

describe('Multi-Region DR Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;
  const primaryRegion = 'us-east-1';

  // AWS SDK Clients
  let primaryRdsClient: RDSClient;
  let primaryLambdaClient: LambdaClient;
  let route53Client: Route53Client;
  let primaryCwClient: CloudWatchClient;
  let primarySnsClient: SNSClient;
  let primaryEc2Client: EC2Client;
  let primaryLogsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. ` +
        'Deploy the stack before running integration tests.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS SDK clients
    primaryRdsClient = new RDSClient({ region: primaryRegion });
    primaryLambdaClient = new LambdaClient({ region: primaryRegion });
    route53Client = new Route53Client({ region: primaryRegion });
    primaryCwClient = new CloudWatchClient({ region: primaryRegion });
    primarySnsClient = new SNSClient({ region: primaryRegion });
    primaryEc2Client = new EC2Client({ region: primaryRegion });
    primaryLogsClient = new CloudWatchLogsClient({ region: primaryRegion });
  });

  afterAll(() => {
    // Cleanup clients
    primaryRdsClient.destroy();
    primaryLambdaClient.destroy();
    route53Client.destroy();
    primaryCwClient.destroy();
    primarySnsClient.destroy();
    primaryEc2Client.destroy();
    primaryLogsClient.destroy();
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs loaded', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have primary region outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrimaryClusterEndpoint).toBeDefined();
      expect(outputs.PrimaryClusterReadEndpoint).toBeDefined();
      expect(outputs.PrimaryLambdaArn).toBeDefined();
      expect(outputs.PrimarySNSTopicArn).toBeDefined();
    });

    test('should have global resources outputs', () => {
      expect(outputs.GlobalClusterIdentifier).toBeDefined();
      expect(outputs.HostedZoneId).toBeDefined();
    });

    test('should have Aurora endpoints in correct region', () => {
      expect(outputs.PrimaryClusterEndpoint).toContain('us-east-1');
      expect(outputs.PrimaryClusterReadEndpoint).toContain('us-east-1');
    });
  });

  describe('VPC and Network Configuration - Primary Region', () => {
    test('should have VPC deployed in primary region', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await primaryEc2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('should have private subnets across multiple AZs in primary region', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });
      const response = await primaryEc2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have security groups configured in primary region', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
        ],
      });
      const response = await primaryEc2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('Aurora Global Database', () => {
    test('should have global cluster created', async () => {
      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterIdentifier,
      });
      const response = await primaryRdsClient.send(command);

      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters!.length).toBe(1);

      const globalCluster = response.GlobalClusters![0];
      expect(globalCluster.Status).toBe('available');
      expect(globalCluster.Engine).toBe('aurora-mysql');
      expect(globalCluster.StorageEncrypted).toBe(true);
    });

    test('should have primary cluster in us-east-1', async () => {
      const clusterId = outputs.PrimaryClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await primaryRdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.MultiAZ).toBe(true);
    });

    test('should have Aurora instances running in primary region', async () => {
      const clusterId = outputs.PrimaryClusterEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [clusterId] },
        ],
      });
      const response = await primaryRdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(1);

      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.Engine).toBe('aurora-mysql');
      });
    });

    test('should have read endpoints available', () => {
      expect(outputs.PrimaryClusterReadEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  describe('Lambda Functions - Primary Region', () => {
    test('should have Lambda function deployed in primary region', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.PrimaryLambdaArn,
      });
      const response = await primaryLambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.State).toBe('Active');
    });

    test('primary Lambda should have correct runtime and configuration', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.PrimaryLambdaArn,
      });
      const response = await primaryLambdaClient.send(command);

      expect(response.Runtime).toBe('python3.11');
      expect(response.MemorySize).toBe(1024);
      expect(response.Timeout).toBe(30);
      // Note: ReservedConcurrentExecutions removed due to account concurrency limits
    });

    test('primary Lambda should be in VPC', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.PrimaryLambdaArn,
      });
      const response = await primaryLambdaClient.send(command);

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.VPCId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThanOrEqual(3);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
    });

    test('primary Lambda should have environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.PrimaryLambdaArn,
      });
      const response = await primaryLambdaClient.send(command);

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.REGION).toBe('us-east-1');
    });
  });

  describe('Route 53 DNS Failover', () => {
    test('should have hosted zone created', async () => {
      const command = new GetHostedZoneCommand({
        Id: outputs.HostedZoneId,
      });
      const response = await route53Client.send(command);

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Name).toContain('test-domain.internal');
    });

    test('should have DNS records configured', async () => {
      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.HostedZoneId,
      });
      const response = await route53Client.send(command);

      expect(response.ResourceRecordSets).toBeDefined();
      expect(response.ResourceRecordSets!.length).toBeGreaterThan(0);
    });

    test('should have health check for primary region', async () => {
      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.HostedZoneId,
      });
      const response = await route53Client.send(command);

      const recordsWithHealthChecks = response.ResourceRecordSets!.filter(
        r => r.HealthCheckId
      );

      expect(recordsWithHealthChecks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CloudWatch Alarms - Primary Region', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'payment-dr-',
      });
      const response = await primaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      // Primary stack should have alarms for replication lag, CPU, Lambda errors, Lambda throttles
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SNS Topics and Notifications - Primary Region', () => {
    test('should have SNS topic in primary region', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.PrimarySNSTopicArn,
      });
      const response = await primarySnsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.PrimarySNSTopicArn);
    });

    test('should have email subscription in primary region', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.PrimarySNSTopicArn,
      });
      const response = await primarySnsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);

      const emailSub = response.Subscriptions!.find(s => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('Aurora clusters should have encryption enabled', async () => {
      const clusterId = outputs.PrimaryClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await primaryRdsClient.send(command);

      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    });

    test('Aurora clusters should not have deletion protection (for testing)', async () => {
      const clusterId = outputs.PrimaryClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await primaryRdsClient.send(command);

      expect(response.DBClusters![0].DeletionProtection).toBe(false);
    });

    test('DB instances should not be publicly accessible', async () => {
      const clusterId = outputs.PrimaryClusterEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [clusterId] },
        ],
      });
      const response = await primaryRdsClient.send(command);

      response.DBInstances!.forEach(instance => {
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    test('SNS topics should have encryption enabled', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.PrimarySNSTopicArn,
      });
      const response = await primarySnsClient.send(command);

      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('Lambda functions should be in multiple subnets', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.PrimaryLambdaArn,
      });
      const response = await primaryLambdaClient.send(command);

      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThanOrEqual(3);
    });

    test('Aurora should be multi-AZ in primary region', async () => {
      const clusterId = outputs.PrimaryClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await primaryRdsClient.send(command);

      expect(response.DBClusters![0].MultiAZ).toBe(true);
    });
  });

  describe('Backup and Recovery', () => {
    test('Aurora should have automated backups enabled', async () => {
      const clusterId = outputs.PrimaryClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await primaryRdsClient.send(command);

      expect(response.DBClusters![0].BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('Aurora should have point-in-time recovery enabled', async () => {
      const clusterId = outputs.PrimaryClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await primaryRdsClient.send(command);

      // Point-in-time recovery is enabled when BackupRetentionPeriod > 0
      expect(response.DBClusters![0].BackupRetentionPeriod).toBeGreaterThan(0);
      expect(response.DBClusters![0].EarliestRestorableTime).toBeDefined();
    });
  });
});
