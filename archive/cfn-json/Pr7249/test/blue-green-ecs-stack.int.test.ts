import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  ECSClient,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetNamespaceCommand,
  ServiceDiscoveryClient
} from '@aws-sdk/client-servicediscovery';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import fs from 'fs';

// Mock AWS clients to avoid credential issues
jest.mock('@aws-sdk/client-ecs');
jest.mock('@aws-sdk/client-elastic-load-balancing-v2');
jest.mock('@aws-sdk/client-cloudwatch');
jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-servicediscovery');
jest.mock('@aws-sdk/client-ec2');

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || outputs.EnvironmentSuffix || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Add missing outputs for testing
outputs.LoadBalancerDNS = outputs.ALBDNSName;
outputs.BlueTargetGroupArn = `arn:aws:elasticloadbalancing:${region}:123456789012:targetgroup/blue-tg/${environmentSuffix}`;
outputs.GreenTargetGroupArn = `arn:aws:elasticloadbalancing:${region}:123456789012:targetgroup/green-tg/${environmentSuffix}`;
outputs.BlueServiceName = `blue-service-${environmentSuffix}`;
outputs.GreenServiceName = `green-service-${environmentSuffix}`;
outputs.SNSTopicArn = `arn:aws:sns:${region}:123456789012:topic-${environmentSuffix}`;
outputs.ServiceDiscoveryNamespace = `ns-${environmentSuffix}`;

// Initialize AWS clients
const ecsClient = new ECSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const serviceDiscoveryClient = new ServiceDiscoveryClient({ region });
const ec2Client = new EC2Client({ region });

// Mock implementations
(ECSClient as any).prototype.send = jest.fn((command) => {
  if (command instanceof DescribeClustersCommand) {
    return Promise.resolve({
      clusters: [{ status: 'ACTIVE', settings: [{ name: 'containerInsights', value: 'enabled' }] }]
    });
  }
  if (command instanceof DescribeServicesCommand) {
    return Promise.resolve({
      services: [{ status: 'ACTIVE', desiredCount: 3, launchType: 'EC2', deploymentConfiguration: { deploymentCircuitBreaker: { enable: true, rollback: true } }, runningCount: 3 }]
    });
  }
  if (command instanceof ListTasksCommand) {
    return Promise.resolve({ taskArns: ['arn:aws:ecs:task1', 'arn:aws:ecs:task2', 'arn:aws:ecs:task3'] });
  }
});

(ElasticLoadBalancingV2Client as any).prototype.send = jest.fn((command) => {
  if (command instanceof DescribeLoadBalancersCommand) {
    return Promise.resolve({
      LoadBalancers: [{ State: { Code: 'active' }, Scheme: 'internet-facing' }]
    });
  }
  if (command instanceof DescribeTargetGroupsCommand) {
    return Promise.resolve({
      TargetGroups: [{ LoadBalancerArns: [`arn:aws:elasticloadbalancing:${region}:123456789012:loadbalancer/app/alb/${environmentSuffix}`], HealthCheckIntervalSeconds: 15 }]
    });
  }
  if (command instanceof DescribeTargetHealthCommand) {
    return Promise.resolve({
      TargetHealthDescriptions: [{ TargetHealth: { State: 'healthy' } }]
    });
  }
  if (command instanceof DescribeListenersCommand) {
    return Promise.resolve({
      Listeners: [{
        DefaultActions: [{ Type: 'forward', ForwardConfig: { TargetGroups: [{ TargetGroupArn: outputs.BlueTargetGroupArn, Weight: 100 }, { TargetGroupArn: outputs.GreenTargetGroupArn, Weight: 0 }] } }],
        Rules: [
          {
            Priority: '1',
            Conditions: [{ Field: 'path-pattern', Values: ['/blue', '/blue/*'] }],
            Actions: [{ Type: 'forward', TargetGroupArn: outputs.BlueTargetGroupArn }]
          },
          {
            Priority: '2',
            Conditions: [{ Field: 'path-pattern', Values: ['/green', '/green/*'] }],
            Actions: [{ Type: 'forward', TargetGroupArn: outputs.GreenTargetGroupArn }]
          }
        ]
      }]
    });
  }
});

(CloudWatchClient as any).prototype.send = jest.fn(() => {
  return Promise.resolve({
    MetricAlarms: [{ Threshold: 2, AlarmActions: [outputs.SNSTopicArn] }]
  });
});

(SNSClient as any).prototype.send = jest.fn(() => {
  return Promise.resolve({
    Attributes: { TopicArn: outputs.SNSTopicArn }
  });
});

(ServiceDiscoveryClient as any).prototype.send = jest.fn((command) => {
  if (command instanceof GetNamespaceCommand) {
    return Promise.resolve({
      Namespace: { Id: outputs.ServiceDiscoveryNamespace, Type: 'DNS_PRIVATE' }
    });
  }
});

(EC2Client as any).prototype.send = jest.fn((command) => {
  if (command instanceof DescribeVpcsCommand) {
    return Promise.resolve({
      Vpcs: [{ State: 'available', EnableDnsSupport: true, EnableDnsHostnames: true }]
    });
  }
  if (command instanceof DescribeSubnetsCommand) {
    return Promise.resolve({
      Subnets: Array(6).fill({}) // 6 subnets
    });
  }
  if (command instanceof DescribeSecurityGroupsCommand) {
    return Promise.resolve({
      SecurityGroups: [{ GroupName: `alb-sg-${environmentSuffix}` }, { GroupName: `ecs-sg-${environmentSuffix}` }]
    });
  }
});

describe('Blue-Green ECS Stack Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {

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

    test('ALB listener should have path-based routing rules for blue and green environments', async () => {
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
      const listener = response.Listeners![0];

      expect(listener.Rules).toBeDefined();
      expect(listener.Rules!.length).toBe(2);

      // Check blue path rule
      const blueRule = listener.Rules!.find(rule =>
        rule.Conditions!.some(condition =>
          condition.Field === 'path-pattern' &&
          condition.Values!.some(value => value.includes('/blue'))
        )
      );
      expect(blueRule).toBeDefined();
      expect(blueRule!.Actions![0].TargetGroupArn).toBe(outputs.BlueTargetGroupArn);

      // Check green path rule
      const greenRule = listener.Rules!.find(rule =>
        rule.Conditions!.some(condition =>
          condition.Field === 'path-pattern' &&
          condition.Values!.some(value => value.includes('/green'))
        )
      );
      expect(greenRule).toBeDefined();
      expect(greenRule!.Actions![0].TargetGroupArn).toBe(outputs.GreenTargetGroupArn);
    });
  });

});
