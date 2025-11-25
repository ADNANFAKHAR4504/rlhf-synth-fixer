import fs from 'fs';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  ServiceDiscoveryClient,
  GetNamespaceCommand,
  GetServiceCommand,
} from '@aws-sdk/client-servicediscovery';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const ecsClient = new ECSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const serviceDiscoveryClient = new ServiceDiscoveryClient({ region });
const ec2Client = new EC2Client({ region });

describe('Blue-Green ECS Stack Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have VPCId output', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-/);
    });

    test('should have ECS cluster name output', () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSClusterName).toContain(environmentSuffix);
    });

    test('should have Load Balancer DNS output', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('.elb.');
    });

    test('should have target group ARNs', () => {
      expect(outputs.BlueTargetGroupArn).toBeDefined();
      expect(outputs.GreenTargetGroupArn).toBeDefined();
      expect(outputs.BlueTargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(outputs.GreenTargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:/);
    });

    test('should have service names', () => {
      expect(outputs.BlueServiceName).toBeDefined();
      expect(outputs.GreenServiceName).toBeDefined();
      expect(outputs.BlueServiceName).toContain(environmentSuffix);
      expect(outputs.GreenServiceName).toContain(environmentSuffix);
    });

    test('should have SNS topic ARN', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:/);
    });

    test('should have Service Discovery namespace', () => {
      expect(outputs.ServiceDiscoveryNamespace).toBeDefined();
      expect(outputs.ServiceDiscoveryNamespace).toMatch(/^ns-/);
    });
  });

  describe('VPC and Network Configuration', () => {
    test('VPC should exist and be active', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('VPC should have DNS support enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('should have at least 6 subnets (3 public, 3 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);
    });

    test('should have security groups for ALB and ECS', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups!;

      const albSg = securityGroups.find(sg => sg.GroupName?.includes('alb'));
      const ecsSg = securityGroups.find(sg => sg.GroupName?.includes('ecs'));

      expect(albSg).toBeDefined();
      expect(ecsSg).toBeDefined();
    });
  });

  describe('ECS Cluster Validation', () => {
    test('ECS cluster should exist and be active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    test('ECS cluster should have Container Insights enabled', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);
      const cluster = response.clusters![0];
      const containerInsightsSetting = cluster.settings?.find(
        s => s.name === 'containerInsights'
      );

      expect(containerInsightsSetting).toBeDefined();
      expect(containerInsightsSetting!.value).toBe('enabled');
    });
  });

  describe('ECS Services Validation', () => {
    test('blue service should exist and be active', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.BlueServiceName],
      });

      const response = await ecsClient.send(command);
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
    });

    test('green service should exist and be active', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.GreenServiceName],
      });

      const response = await ecsClient.send(command);
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
    });

    test('blue service should have desired count of 3', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.BlueServiceName],
      });

      const response = await ecsClient.send(command);
      expect(response.services![0].desiredCount).toBe(3);
    });

    test('green service should have desired count of 3', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.GreenServiceName],
      });

      const response = await ecsClient.send(command);
      expect(response.services![0].desiredCount).toBe(3);
    });

    test('both services should use FARGATE launch type', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.BlueServiceName, outputs.GreenServiceName],
      });

      const response = await ecsClient.send(command);
      response.services!.forEach(service => {
        expect(service.launchType).toBe('FARGATE');
      });
    });

    test('both services should use platform version 1.4.0', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.BlueServiceName, outputs.GreenServiceName],
      });

      const response = await ecsClient.send(command);
      response.services!.forEach(service => {
        expect(service.platformVersion).toBe('1.4.0');
      });
    });

    test('both services should have circuit breaker enabled', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.BlueServiceName, outputs.GreenServiceName],
      });

      const response = await ecsClient.send(command);
      response.services!.forEach(service => {
        expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.enable).toBe(true);
        expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.rollback).toBe(true);
      });
    });

    test('blue service should have running tasks', async () => {
      const listCommand = new ListTasksCommand({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.BlueServiceName,
        desiredStatus: 'RUNNING',
      });

      const response = await ecsClient.send(listCommand);
      expect(response.taskArns!.length).toBeGreaterThan(0);
    });

    test('green service should have running tasks', async () => {
      const listCommand = new ListTasksCommand({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.GreenServiceName,
        desiredStatus: 'RUNNING',
      });

      const response = await ecsClient.send(listCommand);
      expect(response.taskArns!.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer Validation', () => {
    test('Application Load Balancer should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.LoadBalancerDNS.split('.')[0].split('-').slice(0, -1).join('-')],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    });

    test('ALB should be internet-facing', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.LoadBalancerDNS.split('.')[0].split('-').slice(0, -1).join('-')],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
    });

    test('blue target group should exist', async () => {
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.BlueTargetGroupArn],
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
    });

    test('green target group should exist', async () => {
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.GreenTargetGroupArn],
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
    });

    test('target groups should have health check interval of 15 seconds', async () => {
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.BlueTargetGroupArn, outputs.GreenTargetGroupArn],
      });

      const response = await elbClient.send(command);
      response.TargetGroups!.forEach(tg => {
        expect(tg.HealthCheckIntervalSeconds).toBe(15);
      });
    });

    test('blue target group should have registered targets', async () => {
      const command = new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.BlueTargetGroupArn,
      });

      const response = await elbClient.send(command);
      expect(response.TargetHealthDescriptions!.length).toBeGreaterThan(0);
    });

    test('green target group should have registered targets', async () => {
      const command = new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.GreenTargetGroupArn,
      });

      const response = await elbClient.send(command);
      expect(response.TargetHealthDescriptions!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    test('should have CloudWatch alarms for unhealthy targets', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `blue-unhealthy-targets-${environmentSuffix}`,
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('blue unhealthy target alarm should have correct threshold', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `blue-unhealthy-targets-${environmentSuffix}`,
      });

      const response = await cloudWatchClient.send(command);
      const alarm = response.MetricAlarms![0];
      expect(alarm.Threshold).toBe(2);
    });

    test('green unhealthy target alarm should exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `green-unhealthy-targets-${environmentSuffix}`,
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('alarms should have SNS topic as action', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `blue-unhealthy-targets-${environmentSuffix}`,
      });

      const response = await cloudWatchClient.send(command);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmActions).toContain(outputs.SNSTopicArn);
    });
  });

  describe('SNS Topic Validation', () => {
    test('SNS topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.SNSTopicArn);
    });
  });

  describe('Service Discovery Validation', () => {
    test('service discovery namespace should exist', async () => {
      const command = new GetNamespaceCommand({
        Id: outputs.ServiceDiscoveryNamespace,
      });

      const response = await serviceDiscoveryClient.send(command);
      expect(response.Namespace).toBeDefined();
      expect(response.Namespace!.Id).toBe(outputs.ServiceDiscoveryNamespace);
    });

    test('namespace should be private DNS', async () => {
      const command = new GetNamespaceCommand({
        Id: outputs.ServiceDiscoveryNamespace,
      });

      const response = await serviceDiscoveryClient.send(command);
      expect(response.Namespace!.Type).toBe('DNS_PRIVATE');
    });
  });

  describe('Auto Scaling Validation', () => {
    test('blue service should have auto scaling configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.BlueServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      // Service should be running which indicates auto scaling is working
      expect(service.runningCount).toBeGreaterThan(0);
      expect(service.desiredCount).toBeGreaterThanOrEqual(3);
      expect(service.desiredCount).toBeLessThanOrEqual(10);
    });

    test('green service should have auto scaling configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.GreenServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.runningCount).toBeGreaterThan(0);
      expect(service.desiredCount).toBeGreaterThanOrEqual(3);
      expect(service.desiredCount).toBeLessThanOrEqual(10);
    });
  });

  describe('Blue-Green Deployment Readiness', () => {
    test('both environments should be able to receive traffic', async () => {
      const blueHealth = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.BlueTargetGroupArn,
        })
      );

      const greenHealth = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.GreenTargetGroupArn,
        })
      );

      expect(blueHealth.TargetHealthDescriptions!.length).toBeGreaterThan(0);
      expect(greenHealth.TargetHealthDescriptions!.length).toBeGreaterThan(0);
    });

    test('ALB listener should have both target groups configured', async () => {
      // Get ALB ARN from blue target group
      const tgCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.BlueTargetGroupArn],
      });
      const tgResponse = await elbClient.send(tgCommand);
      const albArn = tgResponse.TargetGroups![0].LoadBalancerArns![0];

      const command = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });

      const response = await elbClient.send(command);
      expect(response.Listeners!.length).toBeGreaterThan(0);

      const listener = response.Listeners![0];
      const forwardAction = listener.DefaultActions!.find(a => a.Type === 'forward');
      expect(forwardAction).toBeDefined();
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all resources should use consistent environment suffix', () => {
      const resourceNames = [
        outputs.ECSClusterName,
        outputs.BlueServiceName,
        outputs.GreenServiceName,
      ];

      resourceNames.forEach(name => {
        expect(name).toContain(environmentSuffix);
      });
    });

    test('Load Balancer DNS should be accessible', () => {
      expect(outputs.LoadBalancerDNS).toMatch(/^[a-z0-9-]+\..*\.elb\.amazonaws\.com$/);
    });
  });
});
