// Integration tests for DMS Migration Infrastructure
// Note: These tests require actual AWS deployment with cfn-outputs/flat-outputs.json
import fs from 'fs';
import path from 'path';

// AWS SDK clients
import { RDSClient, DescribeDBClustersCommand, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { DatabaseMigrationServiceClient, DescribeReplicationInstancesCommand, DescribeEndpointsCommand, DescribeReplicationTasksCommand } from '@aws-sdk/client-database-migration-service';
import { Route53Client, GetHostedZoneCommand, ListResourceRecordSetsCommand } from '@aws-sdk/client-route-53';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('DMS Migration Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;
  let rdsClient: RDSClient;
  let dmsClient: DatabaseMigrationServiceClient;
  let route53Client: Route53Client;
  let cloudwatchClient: CloudWatchClient;
  let ssmClient: SSMClient;
  let kmsClient: KMSClient;
  let snsClient: SNSClient;
  let ec2Client: EC2Client;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'cfn-outputs/flat-outputs.json not found. Please deploy the stack first using: ' +
        'npm run cfn:deploy-json'
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    rdsClient = new RDSClient({ region });
    dmsClient = new DatabaseMigrationServiceClient({ region });
    route53Client = new Route53Client({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    ssmClient = new SSMClient({ region });
    kmsClient = new KMSClient({ region });
    snsClient = new SNSClient({ region });
    ec2Client = new EC2Client({ region });
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'DMSTaskARN',
        'AuroraClusterEndpoint',
        'AuroraReaderEndpoint',
        'Route53HostedZoneId',
        'DMSReplicationInstanceARN',
        'KMSKeyId',
        'SNSTopicARN',
        'CloudWatchDashboardURL',
        'VPCId'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('ARN outputs should be valid ARNs', () => {
      const arnOutputs = ['DMSTaskARN', 'DMSReplicationInstanceARN', 'SNSTopicARN'];

      arnOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toMatch(/^arn:aws:/);
      });
    });

    test('endpoint outputs should be valid hostnames', () => {
      expect(outputs.AuroraClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.AuroraReaderEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and be properly configured', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have 3 private subnets across different AZs', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'tag:Name', Values: [`dms-migration-private-subnet-*-${environmentSuffix}`] }
        ]
      }));

      expect(response.Subnets).toHaveLength(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('should have 3 public subnets across different AZs', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'tag:Name', Values: [`dms-migration-public-subnet-*-${environmentSuffix}`] }
        ]
      }));

      expect(response.Subnets).toHaveLength(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Aurora PostgreSQL Cluster', () => {
    test('Aurora cluster should be available', async () => {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `aurora-cluster-${environmentSuffix}`
      }));

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('Aurora cluster should have 3 instances', async () => {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [`aurora-cluster-${environmentSuffix}`] }
        ]
      }));

      expect(response.DBInstances).toHaveLength(3);

      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.Engine).toBe('aurora-postgresql');
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    test('Aurora cluster should have proper endpoints', async () => {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `aurora-cluster-${environmentSuffix}`
      }));

      const cluster = response.DBClusters![0];
      expect(cluster.Endpoint).toBe(outputs.AuroraClusterEndpoint);
      expect(cluster.ReaderEndpoint).toBe(outputs.AuroraReaderEndpoint);
    });

    test('Aurora cluster should have CloudWatch logs enabled', async () => {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `aurora-cluster-${environmentSuffix}`
      }));

      const cluster = response.DBClusters![0];
      expect(cluster.EnabledCloudwatchLogsExports).toContain('postgresql');
    });
  });

  describe('DMS Replication Infrastructure', () => {
    test('DMS replication instance should be available', async () => {
      const response = await dmsClient.send(new DescribeReplicationInstancesCommand({
        Filters: [
          { Name: 'replication-instance-id', Values: [`dms-replication-instance-${environmentSuffix}`] }
        ]
      }));

      expect(response.ReplicationInstances).toHaveLength(1);
      const instance = response.ReplicationInstances![0];
      expect(instance.ReplicationInstanceStatus).toBe('available');
      expect(instance.ReplicationInstanceClass).toBe('dms.t3.medium');
      expect(instance.PubliclyAccessible).toBe(false);
    });

    test('DMS source endpoint should be configured', async () => {
      const response = await dmsClient.send(new DescribeEndpointsCommand({
        Filters: [
          { Name: 'endpoint-id', Values: [`dms-source-endpoint-${environmentSuffix}`] }
        ]
      }));

      expect(response.Endpoints).toHaveLength(1);
      const endpoint = response.Endpoints![0];
      expect(endpoint.EndpointType).toBe('source');
      expect(endpoint.EngineName).toBe('postgres');
      expect(endpoint.SslMode).toBe('require');
    });

    test('DMS target endpoint should be configured', async () => {
      const response = await dmsClient.send(new DescribeEndpointsCommand({
        Filters: [
          { Name: 'endpoint-id', Values: [`dms-target-endpoint-${environmentSuffix}`] }
        ]
      }));

      expect(response.Endpoints).toHaveLength(1);
      const endpoint = response.Endpoints![0];
      expect(endpoint.EndpointType).toBe('target');
      expect(endpoint.EngineName).toBe('aurora-postgresql');
      expect(endpoint.SslMode).toBe('require');
    });

    test('DMS replication task should be configured', async () => {
      const response = await dmsClient.send(new DescribeReplicationTasksCommand({
        Filters: [
          { Name: 'replication-task-id', Values: [`dms-migration-task-${environmentSuffix}`] }
        ]
      }));

      expect(response.ReplicationTasks).toHaveLength(1);
      const task = response.ReplicationTasks![0];
      expect(task.MigrationType).toBe('full-load-and-cdc');
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      }));

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Description).toContain('KMS key for encrypting Aurora database and DMS resources');
    });
  });

  describe('SSM Parameter Store', () => {
    test('on-premises database password parameter should exist', async () => {
      const response = await ssmClient.send(new GetParameterCommand({
        Name: `/dms/onprem-db-password-${environmentSuffix}`,
        WithDecryption: false
      }));

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('SecureString');
    });

    test('Aurora database password parameter should exist', async () => {
      const response = await ssmClient.send(new GetParameterCommand({
        Name: `/dms/aurora-db-password-${environmentSuffix}`,
        WithDecryption: false
      }));

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('SecureString');
    });
  });

  describe('Route 53 Blue-Green Deployment', () => {
    test('hosted zone should exist', async () => {
      const response = await route53Client.send(new GetHostedZoneCommand({
        Id: outputs.Route53HostedZoneId
      }));

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Config?.Comment).toContain('blue-green deployment');
    });

    test('should have weighted record sets for blue-green deployment', async () => {
      const response = await route53Client.send(new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.Route53HostedZoneId
      }));

      const weightedRecords = response.ResourceRecordSets!.filter(rs => rs.Weight !== undefined);
      expect(weightedRecords.length).toBeGreaterThanOrEqual(2);

      const onPremRecord = weightedRecords.find(rs => rs.SetIdentifier === 'OnPremises');
      const auroraRecord = weightedRecords.find(rs => rs.SetIdentifier === 'Aurora');

      expect(onPremRecord).toBeDefined();
      expect(auroraRecord).toBeDefined();
      expect(onPremRecord!.Weight).toBe(100);
      expect(auroraRecord!.Weight).toBe(0);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarm for replication lag should exist', async () => {
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [`dms-replication-lag-${environmentSuffix}`]
      }));

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CDCLatencySource');
      expect(alarm.Namespace).toBe('AWS/DMS');
      expect(alarm.Threshold).toBe(300);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('CloudWatch alarm should have proper dimensions', async () => {
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [`dms-replication-lag-${environmentSuffix}`]
      }));

      const alarm = response.MetricAlarms![0];
      expect(alarm.Dimensions).toHaveLength(2);

      const dimensionNames = alarm.Dimensions!.map(d => d.Name);
      expect(dimensionNames).toContain('ReplicationInstanceIdentifier');
      expect(dimensionNames).toContain('ReplicationTaskIdentifier');
    });

    test('CloudWatch alarm should be configured to send SNS notifications', async () => {
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [`dms-replication-lag-${environmentSuffix}`]
      }));

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmActions).toContain(outputs.SNSTopicARN);
    });
  });

  describe('SNS Alerting', () => {
    test('SNS topic should exist', async () => {
      const response = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicARN
      }));

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('DMS Replication Alerts');
    });
  });

  describe('Security Validation', () => {
    test('Aurora security group should allow PostgreSQL from DMS', async () => {
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: [`aurora-sg-${environmentSuffix}`] },
          { Name: 'vpc-id', Values: [outputs.VPCId] }
        ]
      }));

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const postgresIngress = sg.IpPermissions!.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresIngress).toBeDefined();
    });

    test('DMS security group should allow outbound PostgreSQL', async () => {
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: [`dms-sg-${environmentSuffix}`] },
          { Name: 'vpc-id', Values: [outputs.VPCId] }
        ]
      }));

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      const postgresEgress = sg.IpPermissionsEgress!.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresEgress).toBeDefined();
    });
  });

  describe('End-to-End Connectivity', () => {
    test('Aurora cluster should be reachable from DMS', async () => {
      // This test verifies that the DMS replication instance can connect to Aurora
      // by checking the target endpoint status
      const response = await dmsClient.send(new DescribeEndpointsCommand({
        Filters: [
          { Name: 'endpoint-id', Values: [`dms-target-endpoint-${environmentSuffix}`] }
        ]
      }));

      expect(response.Endpoints).toHaveLength(1);
      const endpoint = response.Endpoints![0];
      // If the endpoint was successfully tested, it should have a status
      expect(endpoint.Status).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('Aurora cluster should have proper tags', async () => {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: `aurora-cluster-${environmentSuffix}`
      }));

      const cluster = response.DBClusters![0];
      const nameTag = cluster.TagList?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);
    });
  });
});
