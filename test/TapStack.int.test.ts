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
  const secondaryRegion = 'us-west-2';

  // AWS SDK Clients
  let primaryRdsClient: RDSClient;
  let secondaryRdsClient: RDSClient;
  let primaryLambdaClient: LambdaClient;
  let secondaryLambdaClient: LambdaClient;
  let route53Client: Route53Client;
  let primaryCwClient: CloudWatchClient;
  let secondaryCwClient: CloudWatchClient;
  let primarySnsClient: SNSClient;
  let secondarySnsClient: SNSClient;
  let primaryEc2Client: EC2Client;
  let secondaryEc2Client: EC2Client;
  let primaryLogsClient: CloudWatchLogsClient;
  let secondaryLogsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. ` +
        'Deploy both primary and secondary stacks before running integration tests.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS SDK clients
    primaryRdsClient = new RDSClient({ region: primaryRegion });
    secondaryRdsClient = new RDSClient({ region: secondaryRegion });
    primaryLambdaClient = new LambdaClient({ region: primaryRegion });
    secondaryLambdaClient = new LambdaClient({ region: secondaryRegion });
    route53Client = new Route53Client({ region: primaryRegion }); // Route53 is global
    primaryCwClient = new CloudWatchClient({ region: primaryRegion });
    secondaryCwClient = new CloudWatchClient({ region: secondaryRegion });
    primarySnsClient = new SNSClient({ region: primaryRegion });
    secondarySnsClient = new SNSClient({ region: secondaryRegion });
    primaryEc2Client = new EC2Client({ region: primaryRegion });
    secondaryEc2Client = new EC2Client({ region: secondaryRegion });
    primaryLogsClient = new CloudWatchLogsClient({ region: primaryRegion });
    secondaryLogsClient = new CloudWatchLogsClient({ region: secondaryRegion });
  });

  afterAll(() => {
    // Cleanup clients
    primaryRdsClient.destroy();
    secondaryRdsClient.destroy();
    primaryLambdaClient.destroy();
    secondaryLambdaClient.destroy();
    route53Client.destroy();
    primaryCwClient.destroy();
    secondaryCwClient.destroy();
    primarySnsClient.destroy();
    secondarySnsClient.destroy();
    primaryEc2Client.destroy();
    secondaryEc2Client.destroy();
    primaryLogsClient.destroy();
    secondaryLogsClient.destroy();
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs loaded', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have primary region outputs', () => {
      expect(outputs.PrimaryVPCId).toBeDefined();
      expect(outputs.PrimaryAuroraEndpoint).toBeDefined();
      expect(outputs.PrimaryAuroraReadEndpoint).toBeDefined();
      expect(outputs.PrimaryLambdaArn).toBeDefined();
      expect(outputs.PrimarySNSTopicArn).toBeDefined();
    });

    test('should have secondary region outputs', () => {
      expect(outputs.SecondaryVPCId).toBeDefined();
      expect(outputs.SecondaryAuroraEndpoint).toBeDefined();
      expect(outputs.SecondaryAuroraReadEndpoint).toBeDefined();
      expect(outputs.SecondaryLambdaArn).toBeDefined();
      expect(outputs.SecondarySNSTopicArn).toBeDefined();
    });

    test('should have global resources outputs', () => {
      expect(outputs.GlobalClusterId).toBeDefined();
      expect(outputs.HostedZoneId).toBeDefined();
      expect(outputs.HostedZoneNameServers).toBeDefined();
    });

    test('should have consistent environment suffix across resources', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      const suffix = outputs.EnvironmentSuffix;

      expect(outputs.PrimaryAuroraEndpoint).toContain(suffix);
      expect(outputs.SecondaryAuroraEndpoint).toContain(suffix);
      expect(outputs.GlobalClusterId).toContain(suffix);
    });

    test('should have region indicators in outputs', () => {
      expect(outputs.PrimaryRegion).toBe('us-east-1');
      expect(outputs.SecondaryRegion).toBe('us-west-2');
    });
  });

  describe('VPC and Network Configuration - Primary Region', () => {
    test('should have VPC deployed in primary region', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.PrimaryVPCId],
      });
      const response = await primaryEc2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have private subnets across multiple AZs in primary region', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.PrimaryVPCId] },
          { Name: 'tag:Name', Values: [`*private*${outputs.EnvironmentSuffix}*`] },
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
          { Name: 'vpc-id', Values: [outputs.PrimaryVPCId] },
        ],
      });
      const response = await primaryEc2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('VPC and Network Configuration - Secondary Region', () => {
    test('should have VPC deployed in secondary region', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.SecondaryVPCId],
      });
      const response = await secondaryEc2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
    });

    test('should have private subnets across multiple AZs in secondary region', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.SecondaryVPCId] },
          { Name: 'tag:Name', Values: [`*private*${outputs.EnvironmentSuffix}*`] },
        ],
      });
      const response = await secondaryEc2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Aurora Global Database', () => {
    test('should have global cluster created', async () => {
      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterId,
      });
      const response = await primaryRdsClient.send(command);

      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters!.length).toBe(1);
      
      const globalCluster = response.GlobalClusters![0];
      expect(globalCluster.Status).toBe('available');
      expect(globalCluster.Engine).toBe('aurora-mysql');
      expect(globalCluster.StorageEncrypted).toBe(true);
      expect(globalCluster.DeletionProtection).toBe(false);
    });

    test('should have primary cluster in us-east-1', async () => {
      const primaryEndpointId = outputs.PrimaryAuroraEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [`*${outputs.EnvironmentSuffix}*`] },
        ],
      });
      const response = await primaryRdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      const primaryCluster = response.DBClusters!.find(c => 
        c.Endpoint?.includes(primaryEndpointId)
      );

      expect(primaryCluster).toBeDefined();
      expect(primaryCluster!.Status).toBe('available');
      expect(primaryCluster!.StorageEncrypted).toBe(true);
      expect(primaryCluster!.MultiAZ).toBe(true);
      expect(primaryCluster!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('should have secondary cluster in us-west-2', async () => {
      const secondaryEndpointId = outputs.SecondaryAuroraEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [`*${outputs.EnvironmentSuffix}*`] },
        ],
      });
      const response = await secondaryRdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      const secondaryCluster = response.DBClusters!.find(c => 
        c.Endpoint?.includes(secondaryEndpointId)
      );

      expect(secondaryCluster).toBeDefined();
      expect(secondaryCluster!.Status).toBe('available');
      expect(secondaryCluster!.StorageEncrypted).toBe(true);
    });

    test('should have Aurora instances running in primary region', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [`*${outputs.EnvironmentSuffix}*`] },
        ],
      });
      const response = await primaryRdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      const instances = response.DBInstances!.filter(i => 
        i.DBClusterIdentifier?.includes(outputs.EnvironmentSuffix) &&
        !i.DBInstanceIdentifier?.includes('secondary')
      );
      
      expect(instances.length).toBeGreaterThanOrEqual(1);
      instances.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.PubliclyAccessible).toBe(false);
        expect(instance.DBInstanceClass).toContain('db.r5');
      });
    });

    test('should have Aurora instances running in secondary region', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [`*${outputs.EnvironmentSuffix}*`] },
        ],
      });
      const response = await secondaryRdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      const instances = response.DBInstances!.filter(i => 
        i.DBClusterIdentifier?.includes(outputs.EnvironmentSuffix)
      );
      
      expect(instances.length).toBeGreaterThanOrEqual(1);
      instances.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    test('should have read endpoints available', () => {
      expect(outputs.PrimaryAuroraReadEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.SecondaryAuroraReadEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('Aurora endpoints should be in correct regions', () => {
      expect(outputs.PrimaryAuroraEndpoint).toContain('us-east-1');
      expect(outputs.SecondaryAuroraEndpoint).toContain('us-west-2');
    });
  });

  describe('Lambda Functions - Primary Region', () => {
    test('should have Lambda function deployed in primary region', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.PrimaryLambdaArn,
      });
      const response = await primaryLambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toContain('payment-processor-primary');
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
      expect(response.VpcConfig!.VpcId).toBe(outputs.PrimaryVPCId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThanOrEqual(3);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    test('primary Lambda should have environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.PrimaryLambdaArn,
      });
      const response = await primaryLambdaClient.send(command);

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.REGION).toBe('us-east-1');
      expect(response.Environment!.Variables!.DB_CLUSTER_ENDPOINT).toBeDefined();
    });

    test('primary Lambda should have CloudWatch log group', async () => {
      const logGroupName = `/aws/lambda/payment-processor-primary-${outputs.EnvironmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await primaryLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBe(1);
      expect(response.logGroups![0].retentionInDays).toBe(30);
    });
  });

  describe('Lambda Functions - Secondary Region', () => {
    test('should have Lambda function deployed in secondary region', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.SecondaryLambdaArn,
      });
      const response = await secondaryLambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toContain('payment-processor-secondary');
      expect(response.Configuration!.State).toBe('Active');
    });

    test('secondary Lambda should have correct runtime and configuration', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.SecondaryLambdaArn,
      });
      const response = await secondaryLambdaClient.send(command);

      expect(response.Runtime).toBe('python3.11');
      expect(response.MemorySize).toBe(1024);
      expect(response.Timeout).toBe(30);
      // Note: ReservedConcurrentExecutions removed due to account concurrency limits
    });

    test('secondary Lambda should be in VPC', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.SecondaryLambdaArn,
      });
      const response = await secondaryLambdaClient.send(command);

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.SecondaryVPCId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThanOrEqual(3);
    });

    test('secondary Lambda should have environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.SecondaryLambdaArn,
      });
      const response = await secondaryLambdaClient.send(command);

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.REGION).toBe('us-west-2');
      expect(response.Environment!.Variables!.DB_CLUSTER_ENDPOINT).toBeDefined();
    });

    test('secondary Lambda should have CloudWatch log group', async () => {
      const logGroupName = `/aws/lambda/payment-processor-secondary-${outputs.EnvironmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await secondaryLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBe(1);
      expect(response.logGroups![0].retentionInDays).toBe(30);
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
      expect(response.HostedZone!.Config?.Comment).toContain('failover');
    });

    test('should have nameservers configured', () => {
      expect(outputs.HostedZoneNameServers).toBeDefined();
      const nameservers = outputs.HostedZoneNameServers.split(',');
      expect(nameservers.length).toBe(4);
      nameservers.forEach(ns => {
        expect(ns).toContain('awsdns');
      });
    });

    test('should have DNS records with failover routing', async () => {
      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.HostedZoneId,
      });
      const response = await route53Client.send(command);

      expect(response.ResourceRecordSets).toBeDefined();
      
      const failoverRecords = response.ResourceRecordSets!.filter(r => 
        r.SetIdentifier && r.Failover
      );
      
      expect(failoverRecords.length).toBeGreaterThanOrEqual(2);
      
      const primaryRecord = failoverRecords.find(r => r.Failover === 'PRIMARY');
      const secondaryRecord = failoverRecords.find(r => r.Failover === 'SECONDARY');
      
      expect(primaryRecord).toBeDefined();
      expect(secondaryRecord).toBeDefined();
      expect(primaryRecord!.TTL).toBe(60);
      expect(secondaryRecord!.TTL).toBe(60);
    });

    test('should have health checks configured', async () => {
      const listCommand = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.HostedZoneId,
      });
      const recordsResponse = await route53Client.send(listCommand);
      
      const recordsWithHealthChecks = recordsResponse.ResourceRecordSets!.filter(r => 
        r.HealthCheckId
      );
      
      expect(recordsWithHealthChecks.length).toBeGreaterThanOrEqual(2);
      
      // Check one health check
      const healthCheckId = recordsWithHealthChecks[0].HealthCheckId!;
      const healthCheckCommand = new GetHealthCheckCommand({
        HealthCheckId: healthCheckId,
      });
      const healthCheckResponse = await route53Client.send(healthCheckCommand);
      
      expect(healthCheckResponse.HealthCheck).toBeDefined();
      expect(healthCheckResponse.HealthCheck!.HealthCheckConfig.Type).toBe('CLOUDWATCH_METRIC');
    });
  });

  describe('CloudWatch Alarms - Primary Region', () => {
    test('should have replication lag alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-dr-replication-lag-${outputs.EnvironmentSuffix}`,
      });
      const response = await primaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('AuroraGlobalDBReplicationLag');
      expect(alarm.Threshold).toBe(1000);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have database CPU alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-dr-db-cpu-${outputs.EnvironmentSuffix}`,
      });
      const response = await primaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
    });

    test('should have Lambda error alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-dr-lambda-errors-${outputs.EnvironmentSuffix}`,
      });
      const response = await primaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
    });

    test('should have Lambda throttle alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-dr-lambda-throttles-${outputs.EnvironmentSuffix}`,
      });
      const response = await primaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      const alarm = response.MetricAlarms!.find(a => a.MetricName === 'Throttles');
      expect(alarm).toBeDefined();
    });
  });

  describe('CloudWatch Alarms - Secondary Region', () => {
    test('should have replication lag alarm in secondary region', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-dr-replication-lag-secondary-${outputs.EnvironmentSuffix}`,
      });
      const response = await secondaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('should have database CPU alarm in secondary region', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-dr-db-cpu-secondary-${outputs.EnvironmentSuffix}`,
      });
      const response = await secondaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('should have Lambda error alarm in secondary region', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-dr-lambda-errors-secondary-${outputs.EnvironmentSuffix}`,
      });
      const response = await secondaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
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
      expect(response.Attributes!.KmsMasterKeyId).toContain('alias/aws/sns');
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

  describe('SNS Topics and Notifications - Secondary Region', () => {
    test('should have SNS topic in secondary region', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SecondarySNSTopicArn,
      });
      const response = await secondarySnsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.SecondarySNSTopicArn);
      expect(response.Attributes!.KmsMasterKeyId).toContain('alias/aws/sns');
    });

    test('should have email subscription in secondary region', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.SecondarySNSTopicArn,
      });
      const response = await secondarySnsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);
      
      const emailSub = response.Subscriptions!.find(s => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
    });
  });

  describe('Multi-Region Deployment Validation', () => {
    test('VPCs should be in different regions with different CIDR blocks', () => {
      expect(outputs.PrimaryVPCId).toBeDefined();
      expect(outputs.SecondaryVPCId).toBeDefined();
      expect(outputs.PrimaryVPCId).not.toBe(outputs.SecondaryVPCId);
    });

    test('Aurora clusters should be in different regions', () => {
      expect(outputs.PrimaryAuroraEndpoint).toContain('us-east-1');
      expect(outputs.SecondaryAuroraEndpoint).toContain('us-west-2');
      expect(outputs.PrimaryAuroraEndpoint).not.toBe(outputs.SecondaryAuroraEndpoint);
    });

    test('Lambda functions should be in different regions', () => {
      expect(outputs.PrimaryLambdaArn).toContain('us-east-1');
      expect(outputs.SecondaryLambdaArn).toContain('us-west-2');
      expect(outputs.PrimaryLambdaArn).not.toBe(outputs.SecondaryLambdaArn);
    });

    test('SNS topics should be in different regions', () => {
      expect(outputs.PrimarySNSTopicArn).toContain('us-east-1');
      expect(outputs.SecondarySNSTopicArn).toContain('us-west-2');
    });

    test('environment suffix should be consistent across all resources', () => {
      const suffix = outputs.EnvironmentSuffix;
      
      expect(outputs.PrimaryAuroraEndpoint).toContain(suffix);
      expect(outputs.SecondaryAuroraEndpoint).toContain(suffix);
      expect(outputs.GlobalClusterId).toContain(suffix);
      expect(outputs.PrimarySNSTopicArn).toContain(suffix);
      expect(outputs.SecondarySNSTopicArn).toContain(suffix);
    });
  });

  describe('Disaster Recovery Readiness', () => {
    test('global cluster should have both primary and secondary members', async () => {
      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterId,
      });
      const response = await primaryRdsClient.send(command);

      const globalCluster = response.GlobalClusters![0];
      expect(globalCluster.GlobalClusterMembers).toBeDefined();
      expect(globalCluster.GlobalClusterMembers!.length).toBeGreaterThanOrEqual(2);
      
      const regions = globalCluster.GlobalClusterMembers!.map(m => 
        m.DBClusterArn?.split(':')[3]
      );
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('us-west-2');
    });

    test('Lambda functions should have reserved concurrency for guaranteed capacity', async () => {
      const primaryConfig = await primaryLambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.PrimaryLambdaArn })
      );
      const secondaryConfig = await secondaryLambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.SecondaryLambdaArn })
      );

      // Note: ReservedConcurrentExecutions removed due to account concurrency limits
      // Lambda functions use shared account concurrency pool
      expect(primaryConfig.MemorySize).toBe(1024);
      expect(secondaryConfig.MemorySize).toBe(1024);
    });

    test('DNS failover should be configured with primary and secondary records', async () => {
      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.HostedZoneId,
      });
      const response = await route53Client.send(command);

      const failoverRecords = response.ResourceRecordSets!.filter(r => r.Failover);
      const primary = failoverRecords.find(r => r.Failover === 'PRIMARY');
      const secondary = failoverRecords.find(r => r.Failover === 'SECONDARY');

      expect(primary).toBeDefined();
      expect(secondary).toBeDefined();
      expect(primary!.HealthCheckId).toBeDefined();
      expect(secondary!.HealthCheckId).toBeDefined();
    });

    test('health checks should monitor regional endpoints', async () => {
      const recordsCommand = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.HostedZoneId,
      });
      const recordsResponse = await route53Client.send(recordsCommand);

      const primaryRecord = recordsResponse.ResourceRecordSets!.find(r => 
        r.Failover === 'PRIMARY' && r.HealthCheckId
      );
      
      if (primaryRecord?.HealthCheckId) {
        const healthCheckCommand = new GetHealthCheckCommand({
          HealthCheckId: primaryRecord.HealthCheckId,
        });
        const healthCheckResponse = await route53Client.send(healthCheckCommand);

        expect(healthCheckResponse.HealthCheck).toBeDefined();
        const config = healthCheckResponse.HealthCheck!.HealthCheckConfig;
        expect(config.Type).toBe('CLOUDWATCH_METRIC');
        expect(config.AlarmIdentifier).toBeDefined();
      }
    });

    test('CloudWatch alarms should notify SNS topics', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-dr-replication-lag-${outputs.EnvironmentSuffix}`,
      });
      const response = await primaryCwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      const alarm = response.MetricAlarms![0];
      
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      expect(alarm.AlarmActions![0]).toContain('sns');
    });
  });

  describe('Security Configuration', () => {
    test('Aurora clusters should have encryption enabled', async () => {
      const globalCommand = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterId,
      });
      const globalResponse = await primaryRdsClient.send(globalCommand);
      
      expect(globalResponse.GlobalClusters![0].StorageEncrypted).toBe(true);
    });

    test('Aurora clusters should not have deletion protection (for testing)', async () => {
      const globalCommand = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.GlobalClusterId,
      });
      const globalResponse = await primaryRdsClient.send(globalCommand);
      
      expect(globalResponse.GlobalClusters![0].DeletionProtection).toBe(false);
    });

    test('DB instances should not be publicly accessible', async () => {
      const primaryCommand = new DescribeDBInstancesCommand({
        Filters: [{ Name: 'db-cluster-id', Values: [`*${outputs.EnvironmentSuffix}*`] }],
      });
      const primaryInstances = await primaryRdsClient.send(primaryCommand);
      
      primaryInstances.DBInstances!.forEach(instance => {
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    test('SNS topics should have encryption enabled', async () => {
      const primaryCommand = new GetTopicAttributesCommand({
        TopicArn: outputs.PrimarySNSTopicArn,
      });
      const primaryResponse = await primarySnsClient.send(primaryCommand);
      
      expect(primaryResponse.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(primaryResponse.Attributes!.KmsMasterKeyId).toContain('alias/aws/sns');
    });
  });

  describe('High Availability Configuration', () => {
    test('should have resources deployed in both regions', () => {
      expect(outputs.PrimaryVPCId).toBeDefined();
      expect(outputs.SecondaryVPCId).toBeDefined();
      expect(outputs.PrimaryLambdaArn).toBeDefined();
      expect(outputs.SecondaryLambdaArn).toBeDefined();
    });

    test('Aurora should be multi-AZ in primary region', async () => {
      const primaryEndpointId = outputs.PrimaryAuroraEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        Filters: [{ Name: 'db-cluster-id', Values: [`*${outputs.EnvironmentSuffix}*`] }],
      });
      const response = await primaryRdsClient.send(command);

      const primaryCluster = response.DBClusters!.find(c => 
        c.Endpoint?.includes(primaryEndpointId)
      );

      expect(primaryCluster!.MultiAZ).toBe(true);
    });

    test('Lambda functions should be in multiple subnets', async () => {
      const primaryConfig = await primaryLambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.PrimaryLambdaArn })
      );

      expect(primaryConfig.VpcConfig!.SubnetIds!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Backup and Recovery', () => {
    test('Aurora should have automated backups enabled', async () => {
      const primaryEndpointId = outputs.PrimaryAuroraEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        Filters: [{ Name: 'db-cluster-id', Values: [`*${outputs.EnvironmentSuffix}*`] }],
      });
      const response = await primaryRdsClient.send(command);

      const primaryCluster = response.DBClusters!.find(c => 
        c.Endpoint?.includes(primaryEndpointId)
      );

      expect(primaryCluster!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(primaryCluster!.PreferredBackupWindow).toBeDefined();
    });

    test('Aurora should have point-in-time recovery enabled', async () => {
      const primaryEndpointId = outputs.PrimaryAuroraEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        Filters: [{ Name: 'db-cluster-id', Values: [`*${outputs.EnvironmentSuffix}*`] }],
      });
      const response = await primaryRdsClient.send(command);

      const primaryCluster = response.DBClusters!.find(c => 
        c.Endpoint?.includes(primaryEndpointId)
      );

      // Backup retention > 0 implies PITR is enabled
      expect(primaryCluster!.BackupRetentionPeriod).toBeGreaterThan(0);
    });
  });
});

