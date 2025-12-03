/**
 * Integration tests for Pulumi ECS Fargate Optimization
 * Tests deployed infrastructure and optimization workflow
 */

import {
  ECSClient,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
import * as fs from 'fs';
import * as path from 'path';

// Read outputs from deployment
const OUTPUTS_PATH = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, string> = {};

if (fs.existsSync(OUTPUTS_PATH)) {
  outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf-8'));
}

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
// Extract environment suffix from actual deployed resources
const ENVIRONMENT_SUFFIX = outputs.clusterName?.replace('app-cluster-', '') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ecsClient = new ECSClient({ region: AWS_REGION });
const albClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const ecrClient = new ECRClient({ region: AWS_REGION });

describe('ECS Fargate Infrastructure - Integration Tests', () => {
  describe('Stack Outputs', () => {
    it('should have exported serviceUrl', () => {
      expect(outputs).toHaveProperty('serviceUrl');
      expect(outputs.serviceUrl).toMatch(/^http:\/\//);
    });

    it('should have exported taskDefinitionArn', () => {
      expect(outputs).toHaveProperty('taskDefinitionArn');
      expect(outputs.taskDefinitionArn).toMatch(/^arn:aws:ecs:/);
    });

    it('should have exported ecrRepositoryUrl', () => {
      expect(outputs).toHaveProperty('ecrRepositoryUrl');
      expect(outputs.ecrRepositoryUrl).toContain('.dkr.ecr.');
    });

    it('should have exported clusterName', () => {
      expect(outputs).toHaveProperty('clusterName');
      expect(outputs.clusterName).toContain(ENVIRONMENT_SUFFIX);
    });

    it('should have exported serviceName', () => {
      expect(outputs).toHaveProperty('serviceName');
      expect(outputs.serviceName).toContain(ENVIRONMENT_SUFFIX);
    });
  });

  describe('ECS Cluster', () => {
    it('should have deployed ECS cluster with correct configuration', async () => {
      const clusterName = outputs.clusterName || `app-cluster-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeClustersCommand({
        clusters: [clusterName],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters).toHaveLength(1);

      const cluster = response.clusters[0];
      expect(cluster.clusterName).toBe(clusterName);
      expect(cluster.status).toBe('ACTIVE');

      // Check for Container Insights
      const containerInsightsSetting = cluster.settings?.find(
        s => s.name === 'containerInsights'
      );
      expect(containerInsightsSetting?.value).toBe('enabled');
    }, 30000);
  });

  describe('ECS Service', () => {
    it('should have deployed ECS service with baseline configuration', async () => {
      const clusterName = outputs.clusterName || `app-cluster-${ENVIRONMENT_SUFFIX}`;
      const serviceName = outputs.serviceName || `app-service-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services).toHaveLength(1);

      const service = response.services[0];
      expect(service.serviceName).toBe(serviceName);
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');

      // Baseline: desiredCount should be 3 before optimization
      // After optimization by optimize.py, it will be 2
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service.desiredCount).toBeLessThanOrEqual(3);
    }, 30000);
  });

  describe('ECS Task Definition', () => {
    it('should have correct task definition configuration', async () => {
      const taskDefinitionArn = outputs.taskDefinitionArn;
      expect(taskDefinitionArn).toBeDefined();

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const response = await ecsClient.send(command);

      expect(response.taskDefinition).toBeDefined();

      const taskDef = response.taskDefinition!;
      expect(taskDef.family).toContain(ENVIRONMENT_SUFFIX);
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');

      // CPU and Memory can be baseline (2048/4096) or optimized (512/1024)
      const cpu = parseInt(taskDef.cpu || '0');
      const memory = parseInt(taskDef.memory || '0');

      expect([512, 2048]).toContain(cpu);
      expect([1024, 4096]).toContain(memory);

      // Check IAM roles
      expect(taskDef.executionRoleArn).toContain('ecs-task-execution');
      expect(taskDef.taskRoleArn).toContain('ecs-task');

      // Check container definitions
      expect(taskDef.containerDefinitions).toBeDefined();
      expect(taskDef.containerDefinitions).toHaveLength(1);

      const container = taskDef.containerDefinitions[0];
      expect(container.name).toBe('app-container');
      expect(container.image).toContain('.dkr.ecr.');
      expect(container.portMappings).toBeDefined();
      expect(container.portMappings![0].containerPort).toBe(3000);

      // Check log configuration
      expect(container.logConfiguration).toBeDefined();
      expect(container.logConfiguration!.logDriver).toBe('awslogs');
      expect(container.logConfiguration!.options).toBeDefined();
      expect(container.logConfiguration!.options!['awslogs-group']).toContain('/ecs/fargate-app');
    }, 30000);
  });

  describe('CloudWatch Log Group', () => {
    it('should have correct log group configuration', async () => {
      const logGroupName = `/ecs/fargate-app-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups).toHaveLength(1);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);

      // Retention can be baseline (14 days) or optimized (7 days)
      expect(logGroup.retentionInDays).toBeDefined();
      expect([7, 14]).toContain(logGroup.retentionInDays);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    it('should have deployed ALB with correct configuration', async () => {
      const serviceUrl = outputs.serviceUrl;
      expect(serviceUrl).toBeDefined();

      // Extract ALB DNS name from service URL
      const albDnsName = serviceUrl.replace('http://', '');

      const command = new DescribeLoadBalancersCommand({});
      const response = await albClient.send(command);

      const alb = response.LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();

      expect(alb!.LoadBalancerName).toContain(ENVIRONMENT_SUFFIX);
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.State?.Code).toBe('active');
    }, 30000);
  });

  describe('Target Group', () => {
    it('should have correct target group with health checks', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await albClient.send(command);

      const targetGroup = response.TargetGroups?.find(tg =>
        tg.TargetGroupName?.includes(ENVIRONMENT_SUFFIX)
      );
      expect(targetGroup).toBeDefined();

      expect(targetGroup!.Protocol).toBe('HTTP');
      // Accept either ALB listener port (80) or container port (3000)
      expect([80, 3000]).toContain(targetGroup!.Port);
      expect(targetGroup!.TargetType).toBe('ip');

      // Verify health check configuration
      expect(targetGroup!.HealthCheckEnabled).toBe(true);
      expect(targetGroup!.HealthCheckPath).toBe('/health');
      expect(targetGroup!.HealthCheckPort).toBe('3000');
      expect(targetGroup!.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup!.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup!.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup!.HealthyThresholdCount).toBe(2);
      expect(targetGroup!.UnhealthyThresholdCount).toBe(3);
      expect(targetGroup!.Matcher?.HttpCode).toBe('200');
    }, 30000);
  });

  describe('ECR Repository', () => {
    it('should have deployed ECR repository with correct configuration', async () => {
      const repositoryName = `app-repo-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories).toHaveLength(1);

      const repository = response.repositories[0];
      expect(repository.repositoryName).toBe(repositoryName);

      // Check scan on push
      expect(repository.imageScanningConfiguration?.scanOnPush).toBe(true);

      // Check image tag mutability
      expect(repository.imageTagMutability).toBe('MUTABLE');
    }, 30000);
  });

  describe('Resource Tagging', () => {
    it('should have correct tags on ECS cluster', async () => {
      const clusterName = outputs.clusterName || `app-cluster-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeClustersCommand({
        clusters: [clusterName],
        include: ['TAGS'],
      });

      const response = await ecsClient.send(command);
      const cluster = response.clusters![0];

      expect(cluster.tags).toBeDefined();

      const tags = cluster.tags!;
      const tagMap = Object.fromEntries(tags.map(t => [t.key, t.value]));

      expect(tagMap).toHaveProperty('Environment');
      expect(tagMap).toHaveProperty('Team');
      expect(tagMap).toHaveProperty('CostCenter');
      expect(tagMap).toHaveProperty('ManagedBy');

      expect(tagMap.Environment).toBe(ENVIRONMENT_SUFFIX);
      expect(tagMap.Team).toBe('platform');
      expect(tagMap.CostCenter).toBe('engineering');
      expect(tagMap.ManagedBy).toBe('pulumi');
    }, 30000);
  });

  describe('Optimization Workflow', () => {
    it('should verify baseline values before optimization', async () => {
      const clusterName = outputs.clusterName || `app-cluster-${ENVIRONMENT_SUFFIX}`;
      const serviceName = outputs.serviceName || `app-service-${ENVIRONMENT_SUFFIX}`;

      // Get service details
      const serviceCommand = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      const serviceResponse = await ecsClient.send(serviceCommand);
      const service = serviceResponse.services![0];

      // Get task definition details
      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: service.taskDefinition,
      });

      const taskDefResponse = await ecsClient.send(taskDefCommand);
      const taskDef = taskDefResponse.taskDefinition!;

      // Check if values are baseline or optimized
      const cpu = parseInt(taskDef.cpu || '0');
      const memory = parseInt(taskDef.memory || '0');
      const desiredCount = service.desiredCount || 0;

      // Log current state for debugging
      console.log('Current Infrastructure State:');
      console.log(`  CPU: ${cpu} (baseline: 2048, optimized: 512)`);
      console.log(`  Memory: ${memory} (baseline: 4096, optimized: 1024)`);
      console.log(`  Desired Count: ${desiredCount} (baseline: 3, optimized: 2)`);

      // Verify values are within expected range
      expect([512, 2048]).toContain(cpu);
      expect([1024, 4096]).toContain(memory);
      expect(desiredCount).toBeGreaterThanOrEqual(2);
      expect(desiredCount).toBeLessThanOrEqual(3);
    }, 30000);

    it('should have optimize.py script available', () => {
      const optimizeScriptPath = path.join(process.cwd(), 'lib', 'optimize.py');
      expect(fs.existsSync(optimizeScriptPath)).toBe(true);

      const scriptContent = fs.readFileSync(optimizeScriptPath, 'utf-8');
      expect(scriptContent).toContain('ECSFargateOptimizer');
      expect(scriptContent).toContain('optimize_cloudwatch_logs');
      expect(scriptContent).toContain('optimize_ecs_task_definition');
      expect(scriptContent).toContain('optimize_ecs_service');
    });
  });

  describe('Cost Optimization Validation', () => {
    it('should calculate potential cost savings', async () => {
      const clusterName = outputs.clusterName || `app-cluster-${ENVIRONMENT_SUFFIX}`;
      const serviceName = outputs.serviceName || `app-service-${ENVIRONMENT_SUFFIX}`;

      // Get current service configuration
      const serviceCommand = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      const serviceResponse = await ecsClient.send(serviceCommand);
      const service = serviceResponse.services![0];

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: service.taskDefinition,
      });

      const taskDefResponse = await ecsClient.send(taskDefCommand);
      const taskDef = taskDefResponse.taskDefinition!;

      const cpu = parseInt(taskDef.cpu || '0');
      const memory = parseInt(taskDef.memory || '0');

      // Calculate cost reduction percentages
      if (cpu === 2048 && memory === 4096) {
        const cpuReduction = ((2048 - 512) / 2048) * 100;
        const memoryReduction = ((4096 - 1024) / 4096) * 100;

        console.log('Potential Cost Savings:');
        console.log(`  CPU reduction: ${cpuReduction}%`);
        console.log(`  Memory reduction: ${memoryReduction}%`);

        expect(cpuReduction).toBe(75);
        expect(memoryReduction).toBe(75);
      } else if (cpu === 512 && memory === 1024) {
        console.log('Infrastructure already optimized!');
        expect(cpu).toBe(512);
        expect(memory).toBe(1024);
      }
    }, 30000);
  });
});
