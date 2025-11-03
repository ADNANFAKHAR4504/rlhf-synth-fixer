import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand,
  DescribeReplicationSubnetGroupsCommand,
  DescribeEndpointsCommand,
} from '@aws-sdk/client-database-migration-service';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101000808';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const ecsClient = new ECSClient({ region });
const rdsClient = new RDSClient({ region });
const dmsClient = new DatabaseMigrationServiceClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const ssmClient = new SSMClient({ region });
const autoscalingClient = new AutoScalingClient({ region });

describe('Three-Tier Migration Infrastructure Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.DMSReplicationInstanceArn).toBeDefined();
      expect(outputs.LegacyTargetGroupArn).toBeDefined();
      expect(outputs.ModernTargetGroupArn).toBeDefined();
    });

    test('output values should be valid format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-/);
      expect(outputs.ALBDNSName).toContain('.elb.amazonaws.com');
      expect(outputs.RDSEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.DMSReplicationInstanceArn).toContain('arn:aws:dms:');
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and have DNS enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    }, 10000);

    test('should have 9 subnets across 3 AZs (public, private, isolated)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets?.length).toBe(9);

      // Check for subnets in different AZs
      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    }, 10000);

    test('should have NAT Gateway deployed', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways?.length).toBeGreaterThan(0);
      expect(response.NatGateways?.[0].State).toMatch(/available|pending/);
    }, 10000);

    test('security groups should have correct tags', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const migrationSGs = response.SecurityGroups?.filter(sg =>
        sg.Tags?.some(tag => tag.Key === 'MigrationPhase')
      );

      expect(migrationSGs!.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Application Load Balancer', () => {
    test('ALB should be internet-facing and active', async () => {
      const albArn = `arn:aws:elasticloadbalancing:${region}:${await getAccountId()}:loadbalancer/app/${outputs.ALBDNSName.split('-')[0]}/*`;

      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0].split('-').slice(0, 3).join('-')],
      });
      const response = await elbv2Client.send(command);

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
    }, 15000);

    test('should have both legacy and modern target groups', async () => {
      const legacyCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.LegacyTargetGroupArn],
      });
      const modernCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.ModernTargetGroupArn],
      });

      const [legacyResponse, modernResponse] = await Promise.all([
        elbv2Client.send(legacyCommand),
        elbv2Client.send(modernCommand),
      ]);

      expect(legacyResponse.TargetGroups).toHaveLength(1);
      expect(modernResponse.TargetGroups).toHaveLength(1);

      // Verify target types
      expect(legacyResponse.TargetGroups![0].TargetType).toBe('instance');
      expect(modernResponse.TargetGroups![0].TargetType).toBe('ip');
    }, 15000);

    test('ALB listener should have weighted routing configured', async () => {
      const albName = outputs.ALBDNSName.split('.')[0];

      // Get load balancer ARN first
      const lbCommand = new DescribeLoadBalancersCommand({
        Names: [albName.split('-').slice(0, 3).join('-')],
      });
      const lbResponse = await elbv2Client.send(lbCommand);
      const albArn = lbResponse.LoadBalancers![0].LoadBalancerArn!;

      const listenersCommand = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });
      const listenersResponse = await elbv2Client.send(listenersCommand);

      expect(listenersResponse.Listeners).toHaveLength(1);
      const listener = listenersResponse.Listeners![0];

      const defaultAction = listener.DefaultActions![0];
      expect(defaultAction.Type).toBe('forward');
      expect(defaultAction.ForwardConfig?.TargetGroups).toHaveLength(2);
    }, 15000);
  });

  describe('ECS Fargate Resources', () => {
    test('ECS cluster should exist with container insights', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
        include: ['SETTINGS'],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.registeredContainerInstancesCount).toBeDefined();

      // Check for Container Insights
      const containerInsights = cluster.settings?.find(
        s => s.name === 'containerInsights'
      );
      expect(containerInsights?.value).toBe('enabled');
    }, 10000);

    test('ECS service should be running with desired count', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [`app-service-${environmentSuffix}`],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(2);
      expect(service.launchType).toBe('FARGATE');
    }, 10000);

    test('ECS task definition should be Fargate compatible', async () => {
      const serviceCommand = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [`app-service-${environmentSuffix}`],
      });
      const serviceResponse = await ecsClient.send(serviceCommand);
      const taskDefArn = serviceResponse.services![0].taskDefinition!;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const taskDefResponse = await ecsClient.send(taskDefCommand);

      const taskDef = taskDefResponse.taskDefinition!;
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();
    }, 10000);
  });

  describe('EC2 Auto Scaling for Legacy Application', () => {
    test('Auto Scaling Group should exist with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`legacy-asg-${environmentSuffix}`],
      });
      const response = await autoscalingClient.send(command);

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(4);
      expect(asg.TargetGroupARNs).toContain(outputs.LegacyTargetGroupArn);
    }, 10000);
  });

  describe('RDS MySQL Database', () => {
    test('RDS instance should be Multi-AZ and encrypted', async () => {
      const dbIdentifier = `mysql-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toMatch(/available|backing-up/);
      expect(db.Engine).toBe('mysql');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.Endpoint?.Address).toBe(outputs.RDSEndpoint);
    }, 15000);

    test('RDS subnet group should use isolated subnets', async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `db-subnet-group-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      expect(response.DBSubnetGroups).toHaveLength(1);
      expect(response.DBSubnetGroups![0].Subnets).toHaveLength(3);
    }, 10000);
  });

  describe('DMS Replication Infrastructure', () => {
    test('DMS replication instance should be available', async () => {
      const arnParts = outputs.DMSReplicationInstanceArn.split(':');
      const instanceId = arnParts[arnParts.length - 1];

      const command = new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: 'replication-instance-id',
            Values: [`dms-replication-${environmentSuffix}`],
          },
        ],
      });
      const response = await dmsClient.send(command);

      expect(response.ReplicationInstances).toHaveLength(1);
      const instance = response.ReplicationInstances![0];
      expect(instance.ReplicationInstanceStatus).toMatch(/available|modifying/);
      expect(instance.PubliclyAccessible).toBe(false);
    }, 15000);

    test('DMS subnet group should exist', async () => {
      const command = new DescribeReplicationSubnetGroupsCommand({
        Filters: [
          {
            Name: 'replication-subnet-group-id',
            Values: [`dms-subnet-group-${environmentSuffix}`],
          },
        ],
      });
      const response = await dmsClient.send(command);

      expect(response.ReplicationSubnetGroups).toHaveLength(1);
      expect(response.ReplicationSubnetGroups![0].Subnets).toHaveLength(3);
    }, 10000);

    test('DMS endpoints should be configured', async () => {
      const command = new DescribeEndpointsCommand({
        Filters: [
          {
            Name: 'endpoint-id',
            Values: [`source-endpoint-${environmentSuffix}`, `target-endpoint-${environmentSuffix}`],
          },
        ],
      });
      const response = await dmsClient.send(command);

      expect(response.Endpoints?.length).toBeGreaterThan(0);

      const sourceEndpoint = response.Endpoints?.find(e => e.EndpointType === 'source');
      const targetEndpoint = response.Endpoints?.find(e => e.EndpointType === 'target');

      expect(sourceEndpoint).toBeDefined();
      expect(targetEndpoint).toBeDefined();
      expect(targetEndpoint?.EngineName).toBe('mysql');
    }, 15000);
  });

  describe('CloudWatch Monitoring', () => {
    test('should have migration-related alarms configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `alb-`,
        MaxRecords: 100,
      });
      const response = await cloudwatchClient.send(command);

      const migrationAlarms = response.MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes(environmentSuffix)
      );

      expect(migrationAlarms!.length).toBeGreaterThan(0);
    }, 10000);

    test('CloudWatch dashboard should exist for migration monitoring', async () => {
      const command = new ListDashboardsCommand({});
      const response = await cloudwatchClient.send(command);

      const migrationDashboard = response.DashboardEntries?.find(d =>
        d.DashboardName?.includes(`migration-dashboard-${environmentSuffix}`)
      );

      expect(migrationDashboard).toBeDefined();
    }, 10000);
  });

  describe('SSM Parameter Store', () => {
    test('migration phase parameter should exist', async () => {
      const command = new GetParameterCommand({
        Name: `/migration/phase-${environmentSuffix}`,
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('String');
      expect(response.Parameter!.Value).toMatch(/preparation|testing|cutover|complete/);
    }, 10000);

    test('cutover date parameter should exist', async () => {
      const command = new GetParameterCommand({
        Name: `/migration/cutover-date-${environmentSuffix}`,
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('String');
      expect(response.Parameter!.Value).toBeDefined();
    }, 10000);
  });

  describe('End-to-End Migration Readiness', () => {
    test('all critical components should be operational', async () => {
      const results = await Promise.allSettled([
        // VPC
        ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })),
        // ALB
        elbv2Client.send(new DescribeLoadBalancersCommand({
          Names: [outputs.ALBDNSName.split('.')[0].split('-').slice(0, 3).join('-')],
        })),
        // ECS
        ecsClient.send(new DescribeClustersCommand({ clusters: [outputs.ECSClusterName] })),
        // RDS
        rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `mysql-db-${environmentSuffix}`,
        })),
        // DMS
        dmsClient.send(new DescribeReplicationInstancesCommand({
          Filters: [
            {
              Name: 'replication-instance-id',
              Values: [`dms-replication-${environmentSuffix}`],
            },
          ],
        })),
      ]);

      const allSuccessful = results.every(r => r.status === 'fulfilled');
      expect(allSuccessful).toBe(true);

      if (!allSuccessful) {
        const failures = results
          .map((r, i) => ({ index: i, result: r }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ index, result }) => ({
            component: ['VPC', 'ALB', 'ECS', 'RDS', 'DMS'][index],
            reason: (result as PromiseRejectedResult).reason,
          }));
        console.log('Failed components:', failures);
      }
    }, 30000);
  });
});

async function getAccountId(): Promise<string> {
  const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
  const stsClient = new STSClient({ region });
  const response = await stsClient.send(new GetCallerIdentityCommand({}));
  return response.Account!;
}
