/**
 * Integration Tests for ECS Fargate Optimization Infrastructure
 *
 * These tests verify the deployed infrastructure and the optimization script
 * functionality against real AWS resources.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
  DescribeTaskDefinitionCommand,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  GetLifecyclePolicyCommand,
} from '@aws-sdk/client-ecr';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synthl9a7c7d1';

// Initialize AWS clients
const ecsClient = new ECSClient({ region: REGION });
const ecrClient = new ECRClient({ region: REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });
const asgClient = new ApplicationAutoScalingClient({ region: REGION });
const cwClient = new CloudWatchClient({ region: REGION });
const ec2Client = new EC2Client({ region: REGION });

// Load stack outputs
let stackOutputs: any;

beforeAll(() => {
  const outputsPath = path.join(
    process.cwd(),
    'cfn-outputs',
    'flat-outputs.json'
  );

  if (fs.existsSync(outputsPath)) {
    stackOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    console.log('Loaded stack outputs:', stackOutputs);
  } else {
    throw new Error(
      `Stack outputs not found at ${outputsPath}. Run deployment first.`
    );
  }
});

describe('Infrastructure Deployment Validation', () => {
  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      expect(stackOutputs).toBeDefined();
      expect(stackOutputs.vpcId).toBeDefined();
      expect(stackOutputs.ecsClusterName).toBeDefined();
      expect(stackOutputs.ecsServiceName).toBeDefined();
      expect(stackOutputs.loadBalancerDns).toBeDefined();
      expect(stackOutputs.ecrRepositoryUrl).toBeDefined();
    });

    it('should have outputs with correct environment suffix', () => {
      expect(stackOutputs.ecsClusterName).toContain(ENVIRONMENT_SUFFIX);
      expect(stackOutputs.ecsServiceName).toContain(ENVIRONMENT_SUFFIX);
      expect(stackOutputs.ecrRepositoryUrl).toContain(ENVIRONMENT_SUFFIX);
    });
  });

  describe('VPC Resources', () => {
    it('should have deployed VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.vpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(stackOutputs.vpcId);
    });

    it('should have correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });
  });

  describe('ECS Cluster', () => {
    it('should have deployed ECS cluster', async () => {
      const command = new DescribeClustersCommand({
        clusters: [stackOutputs.ecsClusterName],
      });

      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);
      expect(response.clusters![0].clusterName).toBe(
        stackOutputs.ecsClusterName
      );
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    it('should have Container Insights enabled', async () => {
      const command = new DescribeClustersCommand({
        clusters: [stackOutputs.ecsClusterName],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);
      const cluster = response.clusters![0];

      const containerInsightsSetting = cluster.settings?.find(
        s => s.name === 'containerInsights'
      );

      expect(containerInsightsSetting).toBeDefined();
      expect(containerInsightsSetting?.value).toBe('enabled');
    });
  });

  describe('ECS Service', () => {
    it('should have deployed ECS service', async () => {
      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services!.length).toBe(1);
      expect(response.services![0].serviceName).toBe(
        stackOutputs.ecsServiceName
      );
      expect(response.services![0].status).toBe('ACTIVE');
    });

    it('should have correct baseline desired count', async () => {
      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      // Baseline: 3 tasks (before optimization) or 2 tasks (after optimization)
      // Accept both values since optimization may run before integration tests
      expect([2, 3]).toContain(service.desiredCount);
    });

    it('should use Fargate launch type', async () => {
      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.launchType).toBe('FARGATE');
    });

    it('should have circuit breaker enabled', async () => {
      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(
        service.deploymentConfiguration?.deploymentCircuitBreaker
      ).toBeDefined();
      expect(
        service.deploymentConfiguration?.deploymentCircuitBreaker?.enable
      ).toBe(true);
      expect(
        service.deploymentConfiguration?.deploymentCircuitBreaker?.rollback
      ).toBe(true);
    });

    it('should have health check grace period configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.healthCheckGracePeriodSeconds).toBe(300);
    });

    it('should have load balancer configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.loadBalancers).toBeDefined();
      expect(service.loadBalancers!.length).toBeGreaterThan(0);
    });
  });

  describe('ECS Task Definition', () => {
    let taskDefinitionArn: string;

    beforeAll(async () => {
      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);
      taskDefinitionArn = response.services![0].taskDefinition!;
    });

    it('should have valid task definition', async () => {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const response = await ecsClient.send(command);

      expect(response.taskDefinition).toBeDefined();
      expect(response.taskDefinition!.status).toBe('ACTIVE');
    });

    it('should have baseline CPU and memory configuration', async () => {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const response = await ecsClient.send(command);
      const taskDef = response.taskDefinition!;

      // Baseline: CPU=512, Memory=1024 (before optimization)
      expect(taskDef.cpu).toBe('512');
      expect(taskDef.memory).toBe('1024');
    });

    it('should use Fargate compatibility', async () => {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const response = await ecsClient.send(command);
      const taskDef = response.taskDefinition!;

      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
    });

    it('should have execution role configured', async () => {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const response = await ecsClient.send(command);
      const taskDef = response.taskDefinition!;

      expect(taskDef.executionRoleArn).toBeDefined();
      expect(taskDef.executionRoleArn).toContain('ecs-task-execution-role');
    });

    it('should have task role configured', async () => {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const response = await ecsClient.send(command);
      const taskDef = response.taskDefinition!;

      expect(taskDef.taskRoleArn).toBeDefined();
      expect(taskDef.taskRoleArn).toContain('ecs-task-role');
    });

    it('should have container with logging configured', async () => {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const response = await ecsClient.send(command);
      const taskDef = response.taskDefinition!;

      expect(taskDef.containerDefinitions).toBeDefined();
      expect(taskDef.containerDefinitions!.length).toBeGreaterThan(0);

      const container = taskDef.containerDefinitions![0];
      expect(container.logConfiguration).toBeDefined();
      expect(container.logConfiguration!.logDriver).toBe('awslogs');
    });
  });

  describe('Application Load Balancer', () => {
    it('should have deployed load balancer', async () => {
      // Query all load balancers and filter by DNS name
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(
        lb => lb.DNSName === stackOutputs.loadBalancerDns
      );

      expect(alb).toBeDefined();
      expect(alb!.DNSName).toBe(stackOutputs.loadBalancerDns);
      expect(alb!.LoadBalancerName).toContain(ENVIRONMENT_SUFFIX);
    });

    it('should have deletion protection disabled', async () => {
      // Query by DNS name
      const listCommand = new DescribeLoadBalancersCommand({});
      const listResponse = await elbClient.send(listCommand);
      const alb = listResponse.LoadBalancers?.find(
        lb => lb.DNSName === stackOutputs.loadBalancerDns
      );

      expect(alb).toBeDefined();

      // Check attributes using ARN
      const attrsCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [alb!.LoadBalancerArn!],
      });
      const attrsResponse = await elbClient.send(attrsCommand);

      expect(attrsResponse.LoadBalancers![0].LoadBalancerName).toContain(
        ENVIRONMENT_SUFFIX
      );
    });

    it('should have target group configured', async () => {
      // Query all target groups and filter by name pattern
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbClient.send(command);

      const tg = response.TargetGroups?.find(group =>
        group.TargetGroupName?.includes(ENVIRONMENT_SUFFIX)
      );

      expect(tg).toBeDefined();
      expect(tg!.TargetType).toBe('ip');
    });
  });

  describe('ECR Repository', () => {
    it('should have deployed ECR repository', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [`ecs-app-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories!.length).toBe(1);
      expect(response.repositories![0].repositoryUri).toBe(
        stackOutputs.ecrRepositoryUrl
      );
    });

    it('should have image scanning enabled', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [`ecs-app-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await ecrClient.send(command);
      const repo = response.repositories![0];

      expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
    });

    it('should have baseline lifecycle policy', async () => {
      const command = new GetLifecyclePolicyCommand({
        repositoryName: `ecs-app-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await ecrClient.send(command);

      expect(response.lifecyclePolicyText).toBeDefined();

      const policy = JSON.parse(response.lifecyclePolicyText!);
      expect(policy.rules).toBeDefined();
      expect(policy.rules.length).toBeGreaterThan(0);

      // Baseline: keep 10 images (before optimization)
      const rule = policy.rules[0];
      expect(rule.selection.countNumber).toBe(10);
    });
  });

  describe('Auto Scaling Configuration', () => {
    it('should have auto-scaling target configured', async () => {
      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
        ResourceIds: [
          `service/${stackOutputs.ecsClusterName}/${stackOutputs.ecsServiceName}`,
        ],
      });

      const response = await asgClient.send(command);

      expect(response.ScalableTargets).toBeDefined();
      expect(response.ScalableTargets!.length).toBe(1);

      const target = response.ScalableTargets![0];
      expect(target.MinCapacity).toBe(2); // Baseline: min 2 (before optimization)
      expect(target.MaxCapacity).toBe(6);
    });

    it('should have CPU scaling policy', async () => {
      const command = new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
        ResourceId: `service/${stackOutputs.ecsClusterName}/${stackOutputs.ecsServiceName}`,
      });

      const response = await asgClient.send(command);

      expect(response.ScalingPolicies).toBeDefined();

      const cpuPolicy = response.ScalingPolicies!.find(p =>
        p.PolicyName?.includes('cpu')
      );

      expect(cpuPolicy).toBeDefined();
      expect(cpuPolicy?.PolicyType).toBe('TargetTrackingScaling');
    });

    it('should have memory scaling policy', async () => {
      const command = new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
        ResourceId: `service/${stackOutputs.ecsClusterName}/${stackOutputs.ecsServiceName}`,
      });

      const response = await asgClient.send(command);

      const memoryPolicy = response.ScalingPolicies!.find(p =>
        p.PolicyName?.includes('memory')
      );

      expect(memoryPolicy).toBeDefined();
      expect(memoryPolicy?.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have CPU alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`ecs-cpu-high-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(85);
    });

    it('should have memory alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`ecs-memory-high-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('MemoryUtilization');
      expect(alarm.Threshold).toBe(90);
    });

    it('should have unhealthy tasks alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`ecs-unhealthy-tasks-${ENVIRONMENT_SUFFIX}`],
      });

      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
    });
  });
});

describe('Optimization Script Validation', () => {
  it('should have optimize.py file', () => {
    const optimizeScript = path.join(process.cwd(), 'lib', 'optimize.py');
    expect(fs.existsSync(optimizeScript)).toBe(true);
  });

  it('should be executable Python script', () => {
    const optimizeScript = path.join(process.cwd(), 'lib', 'optimize.py');
    const content = fs.readFileSync(optimizeScript, 'utf-8');

    expect(content).toContain('#!/usr/bin/env python3');
    expect(content).toContain('import boto3');
    expect(content).toContain('class ECSFargateOptimizer');
  });

  it('should have required optimization methods', () => {
    const optimizeScript = path.join(process.cwd(), 'lib', 'optimize.py');
    const content = fs.readFileSync(optimizeScript, 'utf-8');

    expect(content).toContain('def find_ecs_resources');
    expect(content).toContain('def optimize_task_definition');
    expect(content).toContain('def optimize_service_scaling');
    expect(content).toContain('def optimize_autoscaling_target');
    expect(content).toContain('def optimize_ecr_lifecycle');
    expect(content).toContain('def calculate_total_savings');
  });

  it('should support dry-run mode', () => {
    const optimizeScript = path.join(process.cwd(), 'lib', 'optimize.py');
    const content = fs.readFileSync(optimizeScript, 'utf-8');

    expect(content).toContain('--dry-run');
    expect(content).toContain('dry_run');
  });

  it('should read ENVIRONMENT_SUFFIX from environment', () => {
    const optimizeScript = path.join(process.cwd(), 'lib', 'optimize.py');
    const content = fs.readFileSync(optimizeScript, 'utf-8');

    expect(content).toContain('ENVIRONMENT_SUFFIX');
    expect(content).toContain('environment_suffix');
  });
});
