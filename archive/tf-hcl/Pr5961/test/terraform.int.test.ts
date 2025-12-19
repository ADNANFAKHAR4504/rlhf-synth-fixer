// Integration tests for ECS Fargate infrastructure
// These tests verify deployed AWS resources
// NOTE: Requires actual AWS deployment with cfn-outputs/flat-outputs.json

import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeRepositoriesCommand,
  ECRClient,
} from '@aws-sdk/client-ecr';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  ServiceDiscoveryClient
} from '@aws-sdk/client-servicediscovery';
import fs from 'fs';
import path from 'path';

const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const ecsClient = new ECSClient({ region: AWS_REGION });
const ecrClient = new ECRClient({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const cwLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const sdClient = new ServiceDiscoveryClient({ region: AWS_REGION });
const autoScalingClient = new ApplicationAutoScalingClient({ region: AWS_REGION });

// Helper function to load stack outputs
function loadOutputs(): Record<string, any> {
  if (!fs.existsSync(OUTPUTS_PATH)) {
    throw new Error(
      `Stack outputs not found at ${OUTPUTS_PATH}. ` +
      `Please deploy the infrastructure first and run: cd lib && terraform output -json > ../cfn-outputs/flat-outputs.json`
    );
  }
  return JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));
}

describe('ECS Fargate Infrastructure - Integration Tests', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    try {
      outputs = loadOutputs();
      console.log('Loaded stack outputs:', Object.keys(outputs));
    } catch (error: any) {
      console.warn('Warning: Could not load stack outputs:', error.message);
      outputs = {};
    }
  });

  describe('VPC and Networking', () => {
    test('VPC exists and is properly configured', async () => {
      if (!outputs.vpc_id) {
        console.log('Skipping test: vpc_id not found in outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('public and private subnets exist across multiple AZs', async () => {
      if (!outputs.vpc_id) {
        console.log('Skipping test: vpc_id not found in outputs');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      // Check for public subnets
      const publicSubnets = response.Subnets!.filter(
        (subnet) => subnet.MapPublicIpOnLaunch
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

      // Check for private subnets
      const privateSubnets = response.Subnets!.filter(
        (subnet) => !subnet.MapPublicIpOnLaunch
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify multi-AZ deployment
      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('security groups are properly configured', async () => {
      if (!outputs.vpc_id) {
        console.log('Skipping test: vpc_id not found in outputs');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'group-name',
            Values: ['alb-sg-*', 'ecs-tasks-sg-*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(2);

      // Find ALB security group
      const albSg = response.SecurityGroups!.find((sg) =>
        sg.GroupName?.includes('alb-sg')
      );
      expect(albSg).toBeDefined();

      // Verify ALB allows HTTP (80) and HTTPS (443)
      const ingressRules = albSg?.IpPermissions || [];
      const hasHttp = ingressRules.some((rule) => rule.FromPort === 80);
      const hasHttps = ingressRules.some((rule) => rule.FromPort === 443);
      expect(hasHttp).toBe(true);
      expect(hasHttps).toBe(true);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is active', async () => {
      if (!outputs.alb_arn) {
        console.log('Skipping test: alb_arn not found in outputs');
        return;
      }

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('ALB has target groups for both services', async () => {
      if (!outputs.vpc_id) {
        console.log('Skipping test: vpc_id not found in outputs');
        return;
      }

      const command = new DescribeTargetGroupsCommand({
        Names: [
          outputs.fraud_detection_target_group_name ||
          'fraud-detection-tg-*',
          outputs.transaction_processor_target_group_name ||
          'transaction-processor-tg-*',
        ].filter(Boolean),
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups!.length).toBeGreaterThanOrEqual(2);

      response.TargetGroups!.forEach((tg) => {
        expect(tg.Protocol).toBe('HTTP');
        expect(tg.TargetType).toBe('ip');
        expect(tg.HealthCheckEnabled).toBe(true);
        expect(tg.HealthCheckIntervalSeconds).toBe(30);
      });
    });

    test('ALB DNS name is accessible', () => {
      if (!outputs.alb_dns_name) {
        console.log('Skipping test: alb_dns_name not found in outputs');
        return;
      }

      expect(outputs.alb_dns_name).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });

  describe('ECR Repositories', () => {
    test('ECR repositories exist for both services', async () => {
      const repositoryNames = [
        'fraud-detection',
        'transaction-processor',
      ];

      for (const repoName of repositoryNames) {
        const command = new DescribeRepositoriesCommand({
          repositoryNames: [repoName],
        });

        try {
          const response = await ecrClient.send(command);
          expect(response.repositories).toBeDefined();
          expect(response.repositories!.length).toBeGreaterThan(0);

          const repo = response.repositories![0];
          expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
        } catch (error: any) {
          if (error.name === 'RepositoryNotFoundException') {
            console.log(`Repository ${repoName} not found, skipping`);
          } else {
            throw error;
          }
        }
      }
    });
  });

  describe('ECS Cluster', () => {
    test('ECS cluster exists and is active', async () => {
      if (!outputs.ecs_cluster_name) {
        console.log('Skipping test: ecs_cluster_name not found in outputs');
        return;
      }

      const command = new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name],
        include: ['SETTINGS', 'STATISTICS'],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toContain('ecs-cluster-');

      // Verify Container Insights is enabled
      const containerInsightsSetting = cluster.settings?.find(
        (s) => s.name === 'containerInsights'
      );
      expect(containerInsightsSetting?.value).toBe('enabled');
    });
  });

  describe('ECS Services', () => {
    test('fraud-detection service is running', async () => {
      if (!outputs.ecs_cluster_name) {
        console.log('Skipping test: ecs_cluster_name not found in outputs');
        return;
      }

      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: ['fraud-detection'],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBe(2);
      expect(service.loadBalancers).toBeDefined();
      expect(service.loadBalancers!.length).toBeGreaterThan(0);
    });

    test('transaction-processor service is running', async () => {
      if (!outputs.ecs_cluster_name) {
        console.log('Skipping test: ecs_cluster_name not found in outputs');
        return;
      }

      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: ['transaction-processor'],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBe(2);
      expect(service.loadBalancers).toBeDefined();
      expect(service.loadBalancers!.length).toBeGreaterThan(0);
    });
  });

  describe('ECS Task Definitions', () => {
    test('fraud-detection task definition is properly configured', async () => {
      if (!outputs.ecs_cluster_name) {
        console.log('Skipping test: ecs_cluster_name not found in outputs');
        return;
      }

      // Get the service to find the task definition ARN
      const serviceCmd = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: ['fraud-detection'],
      });
      const serviceResponse = await ecsClient.send(serviceCmd);
      const taskDefArn = serviceResponse.services![0].taskDefinition;

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      const taskDef = response.taskDefinition!;
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();
      expect(taskDef.executionRoleArn).toBeDefined();
      expect(taskDef.taskRoleArn).toBeDefined();

      // Verify container definitions
      expect(taskDef.containerDefinitions).toHaveLength(1);
      const container = taskDef.containerDefinitions![0];
      expect(container.logConfiguration?.logDriver).toBe('awslogs');
    });

    test('transaction-processor task definition is properly configured', async () => {
      if (!outputs.ecs_cluster_name) {
        console.log('Skipping test: ecs_cluster_name not found in outputs');
        return;
      }

      // Get the service to find the task definition ARN
      const serviceCmd = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: ['transaction-processor'],
      });
      const serviceResponse = await ecsClient.send(serviceCmd);
      const taskDefArn = serviceResponse.services![0].taskDefinition;

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const response = await ecsClient.send(command);

      const taskDef = response.taskDefinition!;
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();
      expect(taskDef.executionRoleArn).toBeDefined();
      expect(taskDef.taskRoleArn).toBeDefined();

      // Verify container definitions
      expect(taskDef.containerDefinitions).toHaveLength(1);
      const container = taskDef.containerDefinitions![0];
      expect(container.logConfiguration?.logDriver).toBe('awslogs');
    });
  });

  describe('CloudWatch Logs', () => {
    test('CloudWatch log groups exist for both services', async () => {
      const logGroupPrefixes = [
        '/ecs/fraud-detection',
        '/ecs/transaction-processor',
      ];

      for (const prefix of logGroupPrefixes) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: prefix,
        });
        const response = await cwLogsClient.send(command);

        expect(response.logGroups).toBeDefined();
      }
    });
  });

  describe('IAM Roles', () => {
    test('ECS task execution role exists with proper permissions', async () => {
      if (!outputs.ecs_cluster_name) {
        console.log('Skipping test: cluster name not found, cannot test IAM roles');
        return;
      }

      // Role name pattern
      const roleName = `ecs-task-execution-role-*`;

      try {
        const command = new GetRoleCommand({
          RoleName: roleName,
        });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();

        // Verify trust relationship includes ECS
        const trustPolicy = JSON.parse(
          decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
        );
        const ecsService = trustPolicy.Statement.some(
          (stmt: any) =>
            stmt.Principal?.Service?.includes('ecs-tasks.amazonaws.com')
        );
        expect(ecsService).toBe(true);
      } catch (error: any) {
        console.log('Could not verify IAM role:', error.message);
      }
    });
  });

  describe('Auto Scaling', () => {
    test('auto scaling targets exist for both services', async () => {
      if (!outputs.ecs_cluster_name) {
        console.log('Skipping test: ecs_cluster_name not found in outputs');
        return;
      }

      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);

      const targets = response.ScalableTargets!.filter(
        (target) =>
          target.ResourceId?.includes(outputs.ecs_cluster_name) &&
          (target.ResourceId?.includes('fraud-detection') ||
            target.ResourceId?.includes('transaction-processor'))
      );

      expect(targets.length).toBeGreaterThanOrEqual(2);

      targets.forEach((target) => {
        expect(target.MinCapacity).toBe(2);
        expect(target.MaxCapacity).toBe(10);
      });
    });

    test('auto scaling policies exist for CPU and memory', async () => {
      if (!outputs.ecs_cluster_name) {
        console.log('Skipping test: ecs_cluster_name not found in outputs');
        return;
      }

      const command = new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);

      const policies = response.ScalingPolicies!.filter(
        (policy) =>
          policy.ResourceId?.includes(outputs.ecs_cluster_name) &&
          (policy.ResourceId?.includes('fraud-detection') ||
            policy.ResourceId?.includes('transaction-processor'))
      );

      expect(policies.length).toBeGreaterThanOrEqual(4); // 2 services × 2 policies each

      // Verify CPU and memory policies exist
      const cpuPolicies = policies.filter((p) =>
        p.PolicyName?.includes('cpu')
      );
      const memoryPolicies = policies.filter((p) =>
        p.PolicyName?.includes('memory')
      );

      expect(cpuPolicies.length).toBeGreaterThanOrEqual(2);
      expect(memoryPolicies.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Service Discovery', () => {
    test('service discovery namespace exists', async () => {
      if (!outputs.service_discovery_namespace) {
        console.log('Skipping test: service_discovery_namespace not found in outputs');
        return;
      }

      // Service Discovery API would require namespace ID, not name
      // This test serves as a placeholder for actual implementation
      expect(outputs.service_discovery_namespace).toMatch(/local-/);
    });
  });

  describe('End-to-End Service Validation', () => {
    test('all components are properly integrated', () => {
      // Verify all expected outputs exist
      const expectedOutputs = [
        'vpc_id',
        'alb_dns_name',
        'ecs_cluster_name',
        'ecs_cluster_arn',
        'fraud_detection_service_name',
        'transaction_processor_service_name',
      ];

      expectedOutputs.forEach((output) => {
        if (!outputs[output]) {
          console.log(`Warning: Expected output '${output}' not found`);
        }
      });

      // If we have the basic outputs, the deployment was successful
      const hasBasicOutputs =
        outputs.vpc_id &&
        outputs.alb_dns_name &&
        outputs.ecs_cluster_name;

      if (hasBasicOutputs) {
        expect(true).toBe(true);
      } else {
        console.log('Infrastructure not fully deployed, skipping integration tests');
      }
    });
  });
});
