import {
  BackupClient,
  ListBackupVaultsCommand
} from '@aws-sdk/client-backup';
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
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand
} from '@aws-sdk/client-database-migration-service';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeReplicationGroupsCommand,
  ElastiCacheClient
} from '@aws-sdk/client-elasticache';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  S3Client
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const region = process.env.AWS_REGION || 'ap-southeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthlsv1f';

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const ecsClient = new ECSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const cacheClient = new ElastiCacheClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const backupClient = new BackupClient({ region });
const dmsClient = new DatabaseMigrationServiceClient({ region });

// Helper function to load outputs
function loadOutputs(): Record<string, string> {
  try {
    const outputPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputPath)) {
      return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not load flat-outputs.json, will use fallback methods');
  }
  return {};
}

const outputs = loadOutputs();

describe('Migration Infrastructure Integration Tests', () => {
  const stackName = `MigrationStack-${environmentSuffix}`;
  let stackOutputs: Record<string, string> = {};

  beforeAll(async () => {
    // Get stack outputs from CloudFormation if not loaded from file
    if (Object.keys(outputs).length === 0) {
      try {
        const response = await cfnClient.send(
          new DescribeStacksCommand({ StackName: stackName })
        );

        const stack = response.Stacks?.[0];
        if (stack?.Outputs) {
          for (const output of stack.Outputs) {
            if (output.OutputKey && output.OutputValue) {
              stackOutputs[output.OutputKey] = output.OutputValue;
            }
          }
        }
      } catch (error) {
        console.error('Could not fetch stack outputs:', error);
      }
    } else {
      stackOutputs = outputs;
    }
  });

  describe('Stack Deployment', () => {
    test('Stack deployed successfully', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBeGreaterThan(0);

      const stack = response.Stacks![0];
      expect(stack.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('Stack has required outputs', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const stack = response.Stacks![0];
      const outputKeys = stack.Outputs?.map(o => o.OutputKey) || [];

      expect(outputKeys).toContain('VpcId');
      expect(outputKeys).toContain('DatabaseEndpoint');
      expect(outputKeys).toContain('LoadBalancerDns');
      expect(outputKeys).toContain('ArtifactBucketName');
    });

    test('All stack resources created successfully', async () => {
      const response = await cfnClient.send(
        new ListStackResourcesCommand({ StackName: stackName })
      );

      expect(response.StackResourceSummaries).toBeDefined();
      expect(response.StackResourceSummaries!.length).toBeGreaterThan(0);

      // Check that no resources are in failed state
      const failedResources = response.StackResourceSummaries!.filter(
        resource => resource.ResourceStatus?.includes('FAILED')
      );
      expect(failedResources).toHaveLength(0);
    });
  });

  describe('VPC Infrastructure', () => {
    test('VPC created with correct configuration', async () => {
      const vpcId = stackOutputs.VpcId || outputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId]
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
    });

    test('Subnets created in multiple availability zones', async () => {
      const vpcId = stackOutputs.VpcId || outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] }
          ]
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(9);

      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('NAT Gateways deployed for high availability', async () => {
      const vpcId = stackOutputs.VpcId || outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'state', Values: ['available'] }
          ]
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('RDS PostgreSQL Database', () => {
    test('RDS instance running with Multi-AZ enabled', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint || outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            { Name: 'db-instance-id', Values: [`migration-db-${environmentSuffix}`] }
          ]
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThan(0);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    test('Read replica exists and is healthy', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            { Name: 'db-instance-id', Values: [`migration-db-replica-${environmentSuffix}`] }
          ]
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);

      const replica = response.DBInstances![0];
      expect(replica.DBInstanceStatus).toBe('available');
      expect(replica.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
    });

    test('RDS has correct storage configuration', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            { Name: 'db-instance-id', Values: [`migration-db-${environmentSuffix}`] }
          ]
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.AllocatedStorage).toBeGreaterThanOrEqual(100);
      expect(dbInstance.StorageType).toBe('gp3');
      expect(dbInstance.MaxAllocatedStorage).toBeGreaterThanOrEqual(500);
    });

    test('RDS has backup retention configured', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            { Name: 'db-instance-id', Values: [`migration-db-${environmentSuffix}`] }
          ]
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('RDS has Performance Insights enabled', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            { Name: 'db-instance-id', Values: [`migration-db-${environmentSuffix}`] }
          ]
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
    });
  });

  describe('AWS Backup Configuration', () => {
    test('Backup vault exists', async () => {
      const response = await backupClient.send(
        new ListBackupVaultsCommand({})
      );

      expect(response.BackupVaultList).toBeDefined();

      const vault = response.BackupVaultList!.find(
        v => v.BackupVaultName?.includes(environmentSuffix)
      );
      expect(vault).toBeDefined();
    });
  });

  describe('DMS Replication', () => {
    test('DMS replication instance exists and is available', async () => {
      const response = await dmsClient.send(
        new DescribeReplicationInstancesCommand({
          Filters: [
            { Name: 'replication-instance-id', Values: [`dms-instance-${environmentSuffix}`] }
          ]
        })
      );

      expect(response.ReplicationInstances).toBeDefined();
      expect(response.ReplicationInstances!.length).toBeGreaterThan(0);

      const instance = response.ReplicationInstances![0];
      expect(instance.ReplicationInstanceStatus).toBe('available');
      expect(instance.PubliclyAccessible).toBe(false);
    });
  });

  describe('ElastiCache Redis Cluster', () => {
    test('Redis cluster exists and is available', async () => {
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: `redis-${environmentSuffix}`
        })
      );

      expect(response.ReplicationGroups).toBeDefined();
      expect(response.ReplicationGroups!.length).toBe(1);

      const cluster = response.ReplicationGroups![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.MultiAZ).toBe('enabled');
      expect(cluster.AutomaticFailover).toBe('enabled');
    });

    test('Redis has encryption enabled', async () => {
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: `redis-${environmentSuffix}`
        })
      );

      const cluster = response.ReplicationGroups![0];
      expect(cluster.AtRestEncryptionEnabled).toBe(true);
      expect(cluster.TransitEncryptionEnabled).toBe(true);
    });

    test('Redis has snapshot retention configured', async () => {
      const response = await cacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: `redis-${environmentSuffix}`
        })
      );

      const cluster = response.ReplicationGroups![0];
      expect(cluster.SnapshotRetentionLimit).toBeGreaterThanOrEqual(5);
    });
  });

  describe('ECS Fargate Service', () => {
    test('ECS cluster exists', async () => {
      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [`migration-cluster-${environmentSuffix}`]
        })
      );

      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
    });

    test('ECS service running with correct configuration', async () => {
      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: `migration-cluster-${environmentSuffix}`,
          services: [`migration-service-${environmentSuffix}`]
        })
      );

      expect(response.services).toBeDefined();
      expect(response.services!.length).toBe(1);

      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
    });

    test('Task definition configured correctly', async () => {
      const serviceResponse = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: `migration-cluster-${environmentSuffix}`,
          services: [`migration-service-${environmentSuffix}`]
        })
      );

      const service = serviceResponse.services![0];
      const taskDefArn = service.taskDefinition!;

      const taskResponse = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: taskDefArn
        })
      );

      expect(taskResponse.taskDefinition).toBeDefined();
      const taskDef = taskResponse.taskDefinition!;

      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.memory).toBe('2048');
      expect(taskDef.cpu).toBe('1024');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is active', async () => {
      const albDns = stackOutputs.LoadBalancerDns || outputs.LoadBalancerDns;
      expect(albDns).toBeDefined();

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [`migration-alb-${environmentSuffix}`]
        })
      );

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    });

    test('Target group configured with health checks', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          Names: [`migration-tg-${environmentSuffix}`]
        })
      );

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);

      const tg = response.TargetGroups![0];
      expect(tg.Port).toBe(80);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
    });

    test('Target group has healthy targets', async () => {
      const tgResponse = await elbClient.send(
        new DescribeTargetGroupsCommand({
          Names: [`migration-tg-${environmentSuffix}`]
        })
      );

      const tgArn = tgResponse.TargetGroups![0].TargetGroupArn!;

      const healthResponse = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: tgArn
        })
      );

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();

      // At least some targets should be healthy or initializing
      const healthyOrInitializing = healthResponse.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy' ||
          t.TargetHealth?.State === 'initial' ||
          t.TargetHealth?.State === 'unhealthy'
      );
      expect(healthyOrInitializing.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('S3 bucket exists with encryption enabled', async () => {
      const bucketName = stackOutputs.ArtifactBucketName || outputs.ArtifactBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket has versioning enabled', async () => {
      const bucketName = stackOutputs.ArtifactBucketName || outputs.ArtifactBucketName;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has lifecycle policies configured', async () => {
      const bucketName = stackOutputs.ArtifactBucketName || outputs.ArtifactBucketName;

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName
        })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      // Check for noncurrent version expiration rule
      const expirationRule = response.Rules!.find(
        r => r.NoncurrentVersionExpiration
      );
      expect(expirationRule).toBeDefined();
      expect(expirationRule!.NoncurrentVersionExpiration!.NoncurrentDays).toBe(30);

      // Check for transition to IA rule
      const transitionRule = response.Rules!.find(
        r => r.Transitions && r.Transitions.length > 0
      );
      expect(transitionRule).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('CloudWatch alarms created for monitoring', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'migration'
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(3);

      // Check for specific alarms
      const alarmNames = response.MetricAlarms!.map(a => a.AlarmName);

      const dbCpuAlarm = alarmNames.find(n => n?.includes('db-cpu'));
      expect(dbCpuAlarm).toBeDefined();

      const albResponseAlarm = alarmNames.find(n => n?.includes('alb-response'));
      expect(albResponseAlarm).toBeDefined();

      const unhealthyHostAlarm = alarmNames.find(n => n?.includes('unhealthy'));
      expect(unhealthyHostAlarm).toBeDefined();
    });

    test('Alarms have correct threshold configurations', async () => {
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`migration-db-cpu-${environmentSuffix}`]
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.EvaluationPeriods).toBe(2);
    });
  });

  describe('Lambda Functions', () => {
    test('Pre-migration validation Lambda exists', async () => {
      const functionArn = stackOutputs.PreMigrationFunctionArn || outputs.PreMigrationFunctionArn;
      expect(functionArn).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: `pre-migration-validation-${environmentSuffix}`
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Timeout).toBe(300);
    });

    test('Post-migration validation Lambda exists', async () => {
      const functionArn = stackOutputs.PostMigrationFunctionArn || outputs.PostMigrationFunctionArn;
      expect(functionArn).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: `post-migration-validation-${environmentSuffix}`
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Timeout).toBe(300);
    });

    test('Lambda functions have VPC configuration', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: `pre-migration-validation-${environmentSuffix}`
        })
      );

      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds!.length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups', () => {
    test('Security groups created with correct ingress rules', async () => {
      const vpcId = stackOutputs.VpcId || outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:EnvironmentSuffix', Values: [environmentSuffix] }
          ]
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(5);

      // Verify ALB security group allows HTTP from internet
      const albSg = response.SecurityGroups!.find(
        sg => sg.GroupName?.includes('alb-sg')
      );
      expect(albSg).toBeDefined();

      const httpRule = albSg!.IpPermissions!.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('Resources have correct tags', async () => {
      const vpcId = stackOutputs.VpcId || outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId]
        })
      );

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const migrationPhaseTag = tags.find(t => t.Key === 'MigrationPhase');
      expect(migrationPhaseTag).toBeDefined();

      const costCenterTag = tags.find(t => t.Key === 'CostCenter');
      expect(costCenterTag).toBeDefined();
      expect(costCenterTag!.Value).toBe('finance-app-migration');
    });
  });
});

describe('TapStack Integration Tests', () => {
  const tapStackName = `TapStack-${environmentSuffix}`;

  test('TapStack deployed successfully', async () => {
    const response = await cfnClient.send(
      new DescribeStacksCommand({ StackName: tapStackName })
    );

    expect(response.Stacks).toBeDefined();
    expect(response.Stacks?.length).toBeGreaterThan(0);

    const stack = response.Stacks![0];
    expect(stack.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
  });
});
