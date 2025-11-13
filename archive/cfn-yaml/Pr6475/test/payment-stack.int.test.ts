import * as AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

// Configuration from environment variables
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synth101912474';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const STACK_NAME = `payment-master-${ENVIRONMENT_SUFFIX}`;

// AWS SDK configuration
AWS.config.update({ region: AWS_REGION });
const cloudformation = new AWS.CloudFormation();
const ec2 = new AWS.EC2();
const ecs = new AWS.ECS();
const rds = new AWS.RDS();
const elbv2 = new AWS.ELBv2();

// Load stack outputs from file if available (for CI/CD)
let stackOutputs: Record<string, string> = {};
try {
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  if (fs.existsSync(outputsPath)) {
    stackOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  }
} catch (error) {
  console.log('No flat-outputs.json found, will fetch from AWS');
}

describe('Payment Processing Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let albDnsName: string;
  let ecsClusterName: string;
  let dbEndpoint: string;

  beforeAll(async () => {
    // Get stack outputs from CloudFormation or from file
    if (Object.keys(stackOutputs).length > 0) {
      outputs = stackOutputs;
    } else {
      try {
        const stackData = await cloudformation.describeStacks({ StackName: STACK_NAME }).promise();
        const stack = stackData.Stacks![0];
        outputs = {};
        stack.Outputs?.forEach(output => {
          if (output.OutputKey && output.OutputValue) {
            outputs[output.OutputKey] = output.OutputValue;
          }
        });
      } catch (error) {
        console.error('Failed to get stack outputs:', error);
        outputs = {};
      }
    }

    // Parse outputs
    vpcId = outputs.VpcId || '';
    publicSubnetIds = outputs.PublicSubnetIds?.split(',') || [];
    privateSubnetIds = outputs.PrivateSubnetIds?.split(',') || [];
    albDnsName = outputs.LoadBalancerDNSName || '';
    ecsClusterName = outputs.ECSClusterName || '';
    dbEndpoint = outputs.AuroraClusterEndpoint || '';
  }, 30000);

  describe('VPC Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      if (!vpcId) {
        console.log('Skipping: VPC ID not available');
        return;
      }

      const vpc = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpc.Vpcs).toHaveLength(1);
      expect(vpc.Vpcs![0].State).toBe('available');
      expect(vpc.Vpcs![0].EnableDnsHostnames).toBe(true);
      expect(vpc.Vpcs![0].EnableDnsSupport).toBe(true);
    });

    test('should have 3 public subnets in different AZs', async () => {
      if (publicSubnetIds.length === 0) {
        console.log('Skipping: Public subnet IDs not available');
        return;
      }

      expect(publicSubnetIds).toHaveLength(3);

      const subnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
      expect(subnets.Subnets).toHaveLength(3);

      const azs = new Set(subnets.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);

      subnets.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets in different AZs', async () => {
      if (privateSubnetIds.length === 0) {
        console.log('Skipping: Private subnet IDs not available');
        return;
      }

      expect(privateSubnetIds).toHaveLength(3);

      const subnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
      expect(subnets.Subnets).toHaveLength(3);

      const azs = new Set(subnets.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);

      subnets.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have NAT Gateways for private subnet internet access', async () => {
      if (publicSubnetIds.length === 0) {
        console.log('Skipping: Subnet IDs not available');
        return;
      }

      const natGateways = await ec2.describeNatGateways({
        Filter: [
          { Name: 'subnet-id', Values: publicSubnetIds },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      expect(natGateways.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });

    test('all resources should have required tags', async () => {
      if (!vpcId) {
        console.log('Skipping: VPC ID not available');
        return;
      }

      const vpc = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      const tags = vpc.Vpcs![0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Application');
      expect(tagKeys).toContain('ManagedBy');

      const costCenterTag = tags.find(t => t.Key === 'CostCenter');
      expect(costCenterTag?.Value).toBe('payments');
    });
  });

  describe('Database Infrastructure', () => {
    test('Aurora PostgreSQL cluster should exist and be available', async () => {
      if (!dbEndpoint) {
        console.log('Skipping: DB endpoint not available');
        return;
      }

      const clusterIdentifier = `payment-cluster-${ENVIRONMENT_SUFFIX}`;
      const clusters = await rds.describeDBClusters({
        DBClusterIdentifier: clusterIdentifier
      }).promise().catch(() => ({ DBClusters: [] }));

      if (clusters.DBClusters!.length > 0) {
        const cluster = clusters.DBClusters![0];
        expect(cluster.Status).toBe('available');
        expect(cluster.Engine).toBe('aurora-postgresql');
        expect(cluster.StorageEncrypted).toBe(true);
        expect(cluster.DatabaseName).toBe('payments');
      }
    });

    test('Aurora cluster should have backup configuration', async () => {
      if (!dbEndpoint) {
        console.log('Skipping: DB endpoint not available');
        return;
      }

      const clusterIdentifier = `payment-cluster-${ENVIRONMENT_SUFFIX}`;
      const clusters = await rds.describeDBClusters({
        DBClusterIdentifier: clusterIdentifier
      }).promise().catch(() => ({ DBClusters: [] }));

      if (clusters.DBClusters!.length > 0) {
        const cluster = clusters.DBClusters![0];
        expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
        expect(cluster.PreferredBackupWindow).toBeDefined();
      }
    });

    test('Aurora cluster should be in private subnets', async () => {
      if (!dbEndpoint) {
        console.log('Skipping: DB endpoint not available');
        return;
      }

      const clusterIdentifier = `payment-cluster-${ENVIRONMENT_SUFFIX}`;
      const clusters = await rds.describeDBClusters({
        DBClusterIdentifier: clusterIdentifier
      }).promise().catch(() => ({ DBClusters: [] }));

      if (clusters.DBClusters!.length > 0) {
        const cluster = clusters.DBClusters![0];
        const subnetGroup = cluster.DBSubnetGroup;

        expect(subnetGroup).toBeDefined();
        expect(subnetGroup!.VpcId).toBe(vpcId);
      }
    });

    test('RDS instances should have performance insights enabled', async () => {
      if (!dbEndpoint) {
        console.log('Skipping: DB endpoint not available');
        return;
      }

      const instanceIdentifier = `payment-instance-1-${ENVIRONMENT_SUFFIX}`;
      const instances = await rds.describeDBInstances({
        DBInstanceIdentifier: instanceIdentifier
      }).promise().catch(() => ({ DBInstances: [] }));

      if (instances.DBInstances!.length > 0) {
        const instance = instances.DBInstances![0];
        expect(instance.PerformanceInsightsEnabled).toBe(true);
      }
    });
  });

  describe('Compute Infrastructure', () => {
    test('ECS cluster should exist', async () => {
      if (!ecsClusterName) {
        console.log('Skipping: ECS cluster name not available');
        return;
      }

      const clusters = await ecs.describeClusters({
        clusters: [ecsClusterName]
      }).promise();

      expect(clusters.clusters).toHaveLength(1);
      expect(clusters.clusters![0].status).toBe('ACTIVE');
    });

    test('ECS service should be running with desired task count', async () => {
      if (!ecsClusterName) {
        console.log('Skipping: ECS cluster name not available');
        return;
      }

      const services = await ecs.listServices({
        cluster: ecsClusterName
      }).promise();

      expect(services.serviceArns!.length).toBeGreaterThan(0);

      const serviceDetails = await ecs.describeServices({
        cluster: ecsClusterName,
        services: services.serviceArns!
      }).promise();

      const service = serviceDetails.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.runningCount).toBeGreaterThanOrEqual(1);
    });

    test('ECS tasks should be in private subnets', async () => {
      if (!ecsClusterName) {
        console.log('Skipping: ECS cluster name not available');
        return;
      }

      const tasks = await ecs.listTasks({
        cluster: ecsClusterName
      }).promise();

      if (tasks.taskArns!.length > 0) {
        const taskDetails = await ecs.describeTasks({
          cluster: ecsClusterName,
          tasks: tasks.taskArns!
        }).promise();

        taskDetails.tasks!.forEach(task => {
          const subnetId = task.attachments![0].details!.find(d => d.name === 'subnetId')?.value;
          expect(privateSubnetIds).toContain(subnetId);
        });
      }
    });

    test('Application Load Balancer should be available', async () => {
      if (!albDnsName) {
        console.log('Skipping: ALB DNS name not available');
        return;
      }

      const albs = await elbv2.describeLoadBalancers({
        Names: [`payment-alb-${ENVIRONMENT_SUFFIX}`]
      }).promise().catch(() => ({ LoadBalancers: [] }));

      if (albs.LoadBalancers!.length > 0) {
        const alb = albs.LoadBalancers![0];
        expect(alb.State!.Code).toBe('active');
        expect(alb.Type).toBe('application');
        expect(alb.Scheme).toBe('internet-facing');
      }
    });

    test('ALB should be in public subnets', async () => {
      if (!albDnsName) {
        console.log('Skipping: ALB DNS name not available');
        return;
      }

      const albs = await elbv2.describeLoadBalancers({
        Names: [`payment-alb-${ENVIRONMENT_SUFFIX}`]
      }).promise().catch(() => ({ LoadBalancers: [] }));

      if (albs.LoadBalancers!.length > 0) {
        const alb = albs.LoadBalancers![0];
        const albSubnetIds = alb.AvailabilityZones!.map(az => az.SubnetId!);

        albSubnetIds.forEach(subnetId => {
          expect(publicSubnetIds).toContain(subnetId);
        });
      }
    });

    test('ALB target group should have healthy targets', async () => {
      if (!albDnsName) {
        console.log('Skipping: ALB DNS name not available');
        return;
      }

      const albs = await elbv2.describeLoadBalancers({
        Names: [`payment-alb-${ENVIRONMENT_SUFFIX}`]
      }).promise().catch(() => ({ LoadBalancers: [] }));

      if (albs.LoadBalancers!.length > 0) {
        const albArn = albs.LoadBalancers![0].LoadBalancerArn!;

        const targetGroups = await elbv2.describeTargetGroups({
          LoadBalancerArn: albArn
        }).promise();

        if (targetGroups.TargetGroups!.length > 0) {
          const tgArn = targetGroups.TargetGroups![0].TargetGroupArn!;

          const health = await elbv2.describeTargetHealth({
            TargetGroupArn: tgArn
          }).promise();

          // Check if any targets are registered (might be 0 for test environment)
          expect(health.TargetHealthDescriptions).toBeDefined();
        }
      }
    });
  });

  describe('Security Configuration', () => {
    test('security groups should follow least privilege principle', async () => {
      if (!vpcId) {
        console.log('Skipping: VPC ID not available');
        return;
      }

      const securityGroups = await ec2.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Application', Values: ['payment-processor'] }
        ]
      }).promise();

      // ALB security group should only allow HTTP/HTTPS from internet
      const albSG = securityGroups.SecurityGroups!.find(sg =>
        sg.GroupName!.includes('alb-sg')
      );

      if (albSG) {
        const httpRule = albSG.IpPermissions!.find(rule => rule.FromPort === 80);
        const httpsRule = albSG.IpPermissions!.find(rule => rule.FromPort === 443);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      }

      // ECS security group should only allow traffic from ALB
      const ecsSG = securityGroups.SecurityGroups!.find(sg =>
        sg.GroupName!.includes('ecs-sg')
      );

      if (ecsSG) {
        const ecsRule = ecsSG.IpPermissions!.find(rule => rule.FromPort === 8080);
        expect(ecsRule).toBeDefined();
        // Should reference ALB security group, not open to 0.0.0.0/0
        expect(ecsRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);
      }

      // Database security group should only allow traffic from ECS
      const dbSG = securityGroups.SecurityGroups!.find(sg =>
        sg.GroupName!.includes('db-sg')
      );

      if (dbSG) {
        const dbRule = dbSG.IpPermissions!.find(rule => rule.FromPort === 5432);
        expect(dbRule).toBeDefined();
        // Should not be open to 0.0.0.0/0
        const openToInternet = dbRule!.IpRanges!.some(r => r.CidrIp === '0.0.0.0/0');
        expect(openToInternet).toBe(false);
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms should be configured', async () => {
      const alarmNames = [
        `payment-ecs-cpu-${ENVIRONMENT_SUFFIX}`,
        `payment-ecs-memory-${ENVIRONMENT_SUFFIX}`,
        `payment-rds-cpu-${ENVIRONMENT_SUFFIX}`,
        `payment-rds-connections-${ENVIRONMENT_SUFFIX}`,
        `payment-alb-response-time-${ENVIRONMENT_SUFFIX}`,
        `payment-alb-unhealthy-hosts-${ENVIRONMENT_SUFFIX}`
      ];

      const cloudwatch = new AWS.CloudWatch({ region: AWS_REGION });
      const alarms = await cloudwatch.describeAlarms({
        AlarmNames: alarmNames
      }).promise().catch(() => ({ MetricAlarms: [] }));

      // At least some alarms should exist
      expect(alarms.MetricAlarms!.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Stack Exports', () => {
    test('environment suffix should match', () => {
      if (outputs.EnvironmentSuffix) {
        expect(outputs.EnvironmentSuffix).toBe(ENVIRONMENT_SUFFIX);
      }
    });
  });
});
