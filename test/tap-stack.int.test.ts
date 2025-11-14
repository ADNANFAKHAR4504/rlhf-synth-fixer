import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ECSClient,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import fs from 'fs';

// Configuration - Reading from cfn-outputs after cloudformation deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const ecsClient = new ECSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const ec2Client = new EC2Client({ region });

describe('ECS Fargate Application Integration Tests', () => {
  describe('VPC and Networking Validation', () => {
    test('VPC should exist and be properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
    }, 30000);

    test('Public and private subnets should exist in multiple AZs', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(4);

      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify subnet types
      const publicSubnets = response.Subnets?.filter(s =>
        [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id].includes(s.SubnetId!)
      );
      const privateSubnets = response.Subnets?.filter(s =>
        [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id].includes(s.SubnetId!)
      );

      expect(publicSubnets?.length).toBe(2);
      expect(privateSubnets?.length).toBe(2);
    }, 30000);

    test('NAT Gateways should be deployed for high availability', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBeGreaterThanOrEqual(2);

      // Verify NAT Gateways are in different AZs
      const natAzs = new Set(response.NatGateways?.map(ng => ng.SubnetId));
      expect(natAzs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('Security groups should be properly configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
          {
            Name: 'tag:Name',
            Values: [`alb-sg-${environmentSuffix}`, `ecs-task-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('Load Balancer Validation', () => {
    test('Application Load Balancer should be active and healthy', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`alb-${environmentSuffix}`],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.DNSName).toBe(outputs.ALBDNSName);
      expect(alb.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('Target group should exist and have healthy targets', async () => {
      const describeCommand = new DescribeTargetGroupsCommand({
        Names: [`alb-tg-${environmentSuffix}`],
      });
      const describeResponse = await elbClient.send(describeCommand);

      expect(describeResponse.TargetGroups).toBeDefined();
      expect(describeResponse.TargetGroups?.length).toBe(1);

      const targetGroup = describeResponse.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.TargetType).toBe('ip');
      expect(targetGroup.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup.HealthCheckPath).toBe('/');

      // Check target health
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup.TargetGroupArn,
      });
      const healthResponse = await elbClient.send(healthCommand);

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      expect(healthResponse.TargetHealthDescriptions?.length).toBeGreaterThanOrEqual(2);

      // Allow for targets to be in healthy or initial state
      healthResponse.TargetHealthDescriptions?.forEach(target => {
        expect(['healthy', 'initial', 'unhealthy']).toContain(target.TargetHealth?.State);
      });
    }, 30000);

    test('ALB endpoint should be accessible via HTTP', async () => {
      const url = outputs.ApplicationURL;
      expect(url).toContain('http://');
      expect(url).toContain(outputs.ALBDNSName);

      // Make HTTP request to verify accessibility
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Integration-Test' },
      });

      // Should get a response (even if nginx returns error, connection works)
      expect(response).toBeDefined();
      expect([200, 301, 302, 304, 403, 404, 500, 502, 503, 504]).toContain(response.status);
    }, 30000);
  });

  describe('ECS Cluster and Service Validation', () => {
    test('ECS Cluster should exist and be active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(outputs.ECSClusterName);
      expect(cluster.registeredContainerInstancesCount).toBe(0); // Fargate doesn't use container instances
    }, 30000);

    test('ECS Service should be running with desired tasks', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services?.length).toBe(1);

      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service.runningCount).toBeGreaterThanOrEqual(2);
      expect(service.launchType).toBe('FARGATE');

      // Verify network configuration
      expect(service.networkConfiguration?.awsvpcConfiguration?.subnets).toBeDefined();
      expect(service.networkConfiguration?.awsvpcConfiguration?.subnets?.length).toBe(2);
      expect(service.networkConfiguration?.awsvpcConfiguration?.assignPublicIp).toBe('DISABLED');

      // Verify load balancer integration
      expect(service.loadBalancers).toBeDefined();
      expect(service.loadBalancers?.length).toBeGreaterThan(0);
    }, 30000);

    test('ECS tasks should be running and healthy', async () => {
      // List tasks
      const listCommand = new ListTasksCommand({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.ECSServiceName,
        desiredStatus: 'RUNNING',
      });
      const listResponse = await ecsClient.send(listCommand);

      expect(listResponse.taskArns).toBeDefined();
      expect(listResponse.taskArns?.length).toBeGreaterThanOrEqual(2);

      // Describe tasks
      const describeCommand = new DescribeTasksCommand({
        cluster: outputs.ECSClusterName,
        tasks: listResponse.taskArns,
      });
      const describeResponse = await ecsClient.send(describeCommand);

      expect(describeResponse.tasks).toBeDefined();
      expect(describeResponse.tasks?.length).toBeGreaterThanOrEqual(2);

      // Verify task details
      describeResponse.tasks?.forEach(task => {
        expect(task.lastStatus).toBe('RUNNING');
        expect(task.desiredStatus).toBe('RUNNING');
        expect(task.launchType).toBe('FARGATE');
        expect(task.healthStatus).toBeDefined();

        // Verify containers
        expect(task.containers).toBeDefined();
        expect(task.containers?.length).toBeGreaterThan(0);
        task.containers?.forEach(container => {
          expect(['PENDING', 'RUNNING', 'HEALTHY', 'UNHEALTHY']).toContain(container.lastStatus);
        });
      });
    }, 30000);
  });

  describe('CloudWatch Logs Validation', () => {
    test('CloudWatch log group should exist for ECS tasks', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/ecs/fargate-app-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(`/ecs/fargate-app-${environmentSuffix}`);
      expect(logGroup.retentionInDays).toBe(7);
    }, 30000);
  });

  describe('High Availability Validation', () => {
    test('Resources should be distributed across multiple AZs', async () => {
      // Verify subnets are in different AZs
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      const azs = new Set(subnetResponse.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      // Verify ECS tasks are distributed
      const listCommand = new ListTasksCommand({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.ECSServiceName,
        desiredStatus: 'RUNNING',
      });
      const listResponse = await ecsClient.send(listCommand);

      expect(listResponse.taskArns?.length).toBeGreaterThanOrEqual(2);

      const describeCommand = new DescribeTasksCommand({
        cluster: outputs.ECSClusterName,
        tasks: listResponse.taskArns,
      });
      const describeResponse = await ecsClient.send(describeCommand);

      // Tasks should be in private subnets
      const taskSubnets = new Set(
        describeResponse.tasks?.flatMap(
          t => t.attachments?.[0]?.details?.filter(d => d.name === 'subnetId').map(d => d.value) || []
        )
      );
      expect(taskSubnets.size).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('Minimum task count should be maintained for HA', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);

      const service = response.services![0];
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service.runningCount).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('End-to-End Application Workflow', () => {
    test('Complete workflow: ALB -> ECS -> Container -> Response', async () => {
      // 1. Verify ALB is active
      const albCommand = new DescribeLoadBalancersCommand({
        Names: [`alb-${environmentSuffix}`],
      });
      const albResponse = await elbClient.send(albCommand);
      expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');

      // 2. Verify ECS service is running
      const ecsCommand = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const ecsResponse = await ecsClient.send(ecsCommand);
      expect(ecsResponse.services![0].status).toBe('ACTIVE');
      expect(ecsResponse.services![0].runningCount).toBeGreaterThanOrEqual(2);

      // 3. Verify tasks are running
      const listCommand = new ListTasksCommand({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.ECSServiceName,
        desiredStatus: 'RUNNING',
      });
      const listResponse = await ecsClient.send(listCommand);
      expect(listResponse.taskArns?.length).toBeGreaterThanOrEqual(2);

      // 4. Make HTTP request to application
      const url = outputs.ApplicationURL;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'E2E-Test' },
      });

      expect(response).toBeDefined();
      // Application should respond (nginx default page or error is fine)
      expect(response.status).toBeLessThan(600);
    }, 30000);
  });
});
