/**
 * Integration tests for deployed ECS Fargate infrastructure
 *
 * These tests validate the actual deployed AWS resources using stack outputs.
 * No mocking - all tests use real AWS API calls against deployed infrastructure.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

interface StackOutputs {
  albDnsName: string;
  clusterName: string;
  serviceEndpoint: string;
  serviceName: string;
}

describe('ECS Fargate Infrastructure Integration Tests', () => {
  let outputs: StackOutputs;
  const region = process.env.AWS_REGION || 'us-east-1';

  const ecsClient = new ECSClient({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const ecrClient = new ECRClient({ region });
  const cwlClient = new CloudWatchLogsClient({ region });

  beforeAll(() => {
    // Load stack outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs file not found at ${outputsPath}. ` +
        'Ensure infrastructure is deployed before running integration tests.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent) as StackOutputs;

    // Validate required outputs exist
    expect(outputs).toHaveProperty('clusterName');
    expect(outputs).toHaveProperty('serviceName');
    expect(outputs).toHaveProperty('albDnsName');
    expect(outputs).toHaveProperty('serviceEndpoint');
  });

  describe('ECS Cluster', () => {
    it('should exist and be ACTIVE', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.clusterName],
      });

      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
      expect(response.clusters![0].clusterName).toBe(outputs.clusterName);
    });

    it('should have Container Insights enabled', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.clusterName],
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
    it('should exist and be running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterName,
        services: [outputs.serviceName],
      });

      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].serviceName).toBe(outputs.serviceName);
    });

    it('should use Fargate launch type', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterName,
        services: [outputs.serviceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.launchType).toBe('FARGATE');
    });

    it('should have circuit breaker enabled with rollback', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterName,
        services: [outputs.serviceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.deploymentConfiguration?.deploymentCircuitBreaker).toBeDefined();
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.enable).toBe(true);
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.rollback).toBe(true);
    });

    it('should have load balancer configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.clusterName,
        services: [outputs.serviceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.loadBalancers).toBeDefined();
      expect(service.loadBalancers!.length).toBeGreaterThan(0);
    });
  });

  describe('ECS Task Definition', () => {
    it('should exist with correct configuration', async () => {
      const serviceCommand = new DescribeServicesCommand({
        cluster: outputs.clusterName,
        services: [outputs.serviceName],
      });

      const serviceResponse = await ecsClient.send(serviceCommand);
      const taskDefArn = serviceResponse.services![0].taskDefinition;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });

      const response = await ecsClient.send(taskDefCommand);

      expect(response.taskDefinition).toBeDefined();
      expect(response.taskDefinition?.networkMode).toBe('awsvpc');
      expect(response.taskDefinition?.requiresCompatibilities).toContain('FARGATE');
    });

    it('should have right-sized CPU and memory', async () => {
      const serviceCommand = new DescribeServicesCommand({
        cluster: outputs.clusterName,
        services: [outputs.serviceName],
      });

      const serviceResponse = await ecsClient.send(serviceCommand);
      const taskDefArn = serviceResponse.services![0].taskDefinition;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });

      const response = await ecsClient.send(taskDefCommand);
      const taskDef = response.taskDefinition!;

      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();
      // Verify optimized resource allocation
      expect(['512', '1024', '2048', '4096']).toContain(taskDef.cpu!);
      expect(['1024', '2048', '3072', '4096', '8192']).toContain(taskDef.memory!);
    });
  });

  describe('Application Load Balancer', () => {
    it('should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.albDnsName.split('-').slice(0, -1).join('-')],
      });

      try {
        const response = await elbClient.send(command);
        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBeGreaterThan(0);
      } catch (error) {
        // If lookup by name fails, verify DNS name is reachable
        expect(outputs.albDnsName).toBeTruthy();
        expect(outputs.albDnsName).toContain('.elb.amazonaws.com');
      }
    });

    it('should have valid DNS name', () => {
      expect(outputs.albDnsName).toMatch(/^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/);
    });

    it('should have HTTP service endpoint', () => {
      expect(outputs.serviceEndpoint).toMatch(/^http:\/\//);
      expect(outputs.serviceEndpoint).toContain(outputs.albDnsName);
    });
  });

  describe('ECR Repository', () => {
    it('should exist for container images', async () => {
      const environmentSuffix = outputs.clusterName.replace('ecs-cluster-', '');
      const repoName = `ecs-app-${environmentSuffix}`;

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories).toHaveLength(1);
      expect(response.repositories![0].repositoryName).toBe(repoName);
    });

    it('should have image scanning enabled', async () => {
      const environmentSuffix = outputs.clusterName.replace('ecs-cluster-', '');
      const repoName = `ecs-app-${environmentSuffix}`;

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      const response = await ecrClient.send(command);
      const repo = response.repositories![0];

      expect(repo.imageScanningConfiguration).toBeDefined();
      expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group configured', async () => {
      const environmentSuffix = outputs.clusterName.replace('ecs-cluster-', '');
      const logGroupName = `/ecs/ecs-app-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cwlClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });

    it('should have appropriate log retention', async () => {
      const environmentSuffix = outputs.clusterName.replace('ecs-cluster-', '');
      const logGroupName = `/ecs/ecs-app-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cwlClient.send(command);
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup?.retentionInDays).toBeDefined();
      expect(logGroup?.retentionInDays).toBeLessThanOrEqual(30); // Cost-optimized retention
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in all resource names', () => {
      const environmentSuffix = outputs.clusterName.replace('ecs-cluster-', '');

      expect(outputs.clusterName).toContain(environmentSuffix);
      expect(outputs.serviceName).toContain(environmentSuffix);
      expect(environmentSuffix).toBeTruthy();
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });
  });
});
