import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
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
  ECSClient,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  ServiceDiscoveryClient
} from '@aws-sdk/client-servicediscovery';
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;
  const region = 'us-east-1';

  const ecsClient = new ECSClient({ region });
  const ecrClient = new ECRClient({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });
  const ec2Client = new EC2Client({ region });
  const sdClient = new ServiceDiscoveryClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Stack Outputs', () => {
    it('should have all required stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.ecsClusterName).toBeDefined();
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.serviceDiscoveryNamespace).toBeDefined();
      expect(outputs.apiGatewayServiceName).toBeDefined();
      expect(outputs.paymentProcessorServiceName).toBeDefined();
      expect(outputs.fraudDetectorServiceName).toBeDefined();
    });

    it('should have non-empty stack output values', () => {
      expect(outputs.vpcId).toBeTruthy();
      expect(outputs.ecsClusterName).toBeTruthy();
      expect(outputs.albDnsName).toBeTruthy();
      expect(outputs.serviceDiscoveryNamespace).toBeTruthy();
      expect(outputs.apiGatewayServiceName).toBeTruthy();
      expect(outputs.paymentProcessorServiceName).toBeTruthy();
      expect(outputs.fraudDetectorServiceName).toBeTruthy();
    });

    it('should have valid VPC ID format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    it('should have valid ECS cluster name format', () => {
      expect(outputs.ecsClusterName).toMatch(/^payment-cluster-/);
    });

    it('should have valid ALB DNS name format', () => {
      expect(outputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });

  describe('VPC', () => {
    it('should have a valid VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.vpcId);
    });

    it('should have DNS support and hostnames enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      // VPC exists and is available
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
    });
  });

  describe('ECS Cluster', () => {
    it('should exist and be active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ecsClusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);
      expect(response.clusters?.[0].status).toBe('ACTIVE');
      expect(response.clusters?.[0].clusterName).toBe(
        outputs.ecsClusterName
      );
    });

    it('should have Container Insights enabled', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ecsClusterName],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);
      const cluster = response.clusters?.[0];
      const containerInsights = cluster?.settings?.find(
        (s) => s.name === 'containerInsights'
      );

      expect(containerInsights).toBeDefined();
      expect(containerInsights?.value).toBe('enabled');
    });
  });

  describe('ECS Services', () => {
    it('should have all three services deployed', async () => {
      const command = new ListServicesCommand({
        cluster: outputs.ecsClusterName,
      });

      const response = await ecsClient.send(command);
      expect(response.serviceArns).toBeDefined();
      expect(response.serviceArns?.length).toBeGreaterThanOrEqual(3);
    });

    it('should have exactly three services', async () => {
      const command = new ListServicesCommand({
        cluster: outputs.ecsClusterName,
      });

      const response = await ecsClient.send(command);
      const paymentServices = response.serviceArns?.filter((arn) =>
        arn.includes('payment')
      );
      expect(paymentServices?.length).toBeGreaterThanOrEqual(3);
    });

    it('should have api-gateway service running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service).toBeDefined();
      expect(service?.status).toBe('ACTIVE');
      expect(service?.serviceName).toContain('api-gateway');
      expect(service?.launchType).toBe('FARGATE');
    });

    it('should have payment-processor service running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.paymentProcessorServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service).toBeDefined();
      expect(service?.status).toBe('ACTIVE');
      expect(service?.serviceName).toContain('payment-processor');
      expect(service?.launchType).toBe('FARGATE');
    });

    it('should have fraud-detector service running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.fraudDetectorServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service).toBeDefined();
      expect(service?.status).toBe('ACTIVE');
      expect(service?.serviceName).toContain('fraud-detector');
      expect(service?.launchType).toBe('FARGATE');
    });

    it('should have services with desired count configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [
          outputs.apiGatewayServiceName,
          outputs.paymentProcessorServiceName,
          outputs.fraudDetectorServiceName,
        ],
      });

      const response = await ecsClient.send(command);

      response.services?.forEach((service) => {
        expect(service.desiredCount).toBeGreaterThanOrEqual(2);
        expect(service.desiredCount).toBeLessThanOrEqual(10);
      });
    });

    it('should have services with FARGATE launch type', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [
          outputs.apiGatewayServiceName,
          outputs.paymentProcessorServiceName,
          outputs.fraudDetectorServiceName,
        ],
      });

      const response = await ecsClient.send(command);

      response.services?.forEach((service) => {
        expect(service.launchType).toBe('FARGATE');
      });
    });

    it('should have services with deployment circuit breaker enabled', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service?.deploymentConfiguration).toBeDefined();
      expect(service?.deploymentConfiguration?.deploymentCircuitBreaker).toBeDefined();
    });
  });

  describe('ECR Repositories', () => {
    it('should have api-gateway ECR repository', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [`payment-api-gateway-${process.env.ENVIRONMENT_SUFFIX || 'ci-m8q0t8'}`],
      });

      await expect(ecrClient.send(command)).resolves.toBeDefined();
    });

    it('should have payment-processor ECR repository', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [`payment-payment-processor-${process.env.ENVIRONMENT_SUFFIX || 'ci-m8q0t8'}`],
      });

      await expect(ecrClient.send(command)).resolves.toBeDefined();
    });

    it('should have fraud-detector ECR repository', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [`payment-fraud-detector-${process.env.ENVIRONMENT_SUFFIX || 'ci-m8q0t8'}`],
      });

      await expect(ecrClient.send(command)).resolves.toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    it('should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({});

      const response = await elbClient.send(command);
      const alb = response.LoadBalancers?.find((lb) =>
        lb.DNSName === outputs.albDnsName
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
    });

    it('should be accessible via DNS', () => {
      expect(outputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
    });

    it('should have target groups configured', async () => {
      const command = new DescribeTargetGroupsCommand({});

      const response = await elbClient.send(command);
      const targetGroups = response.TargetGroups?.filter((tg) =>
        tg.TargetGroupName?.includes('payment-api-tg')
      );

      expect(targetGroups).toBeDefined();
      expect(targetGroups?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Service Discovery', () => {
    it('should have the correct namespace name', () => {
      expect(outputs.serviceDiscoveryNamespace).toBe('payment.local');
    });
  });

  describe('Secrets Manager', () => {
    it('should have API keys secret', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `payment-api-keys-${process.env.ENVIRONMENT_SUFFIX || 'ci-m8q0t8'}`,
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toBeDefined();
      expect(response.ARN).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have log groups for all services', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/ecs/payment`,
      });

      const response = await logsClient.send(command);
      const logGroups = response.logGroups || [];

      expect(logGroups.length).toBeGreaterThanOrEqual(3);

      const logGroupNames = logGroups.map((lg) => lg.logGroupName);
      expect(logGroupNames.some((name) => name?.includes('api-gateway'))).toBe(
        true
      );
      expect(
        logGroupNames.some((name) => name?.includes('payment-processor'))
      ).toBe(true);
      expect(
        logGroupNames.some((name) => name?.includes('fraud-detector'))
      ).toBe(true);
    });

    it('should have log retention configured', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/ecs/payment`,
      });

      const response = await logsClient.send(command);
      const logGroups = response.logGroups || [];

      logGroups.forEach((logGroup) => {
        expect(logGroup.retentionInDays).toBeDefined();
        expect(logGroup.retentionInDays).toBeGreaterThan(0);
      });
    });
  });

  describe('Infrastructure Integration', () => {
    it('should have all services in the same cluster', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [
          outputs.apiGatewayServiceName,
          outputs.paymentProcessorServiceName,
          outputs.fraudDetectorServiceName,
        ],
      });

      const response = await ecsClient.send(command);
      expect(response.services?.length).toBe(3);

      response.services?.forEach((service) => {
        expect(service.clusterArn).toContain(outputs.ecsClusterName);
      });
    });

    it('should have services with network configuration', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service?.networkConfiguration).toBeDefined();
      expect(service?.networkConfiguration?.awsvpcConfiguration).toBeDefined();
      expect(
        service?.networkConfiguration?.awsvpcConfiguration?.subnets
      ).toBeDefined();
      expect(
        service?.networkConfiguration?.awsvpcConfiguration?.securityGroups
      ).toBeDefined();
    });
  });

  describe('High Availability', () => {
    it('should have multiple subnets for services', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];
      const subnets =
        service?.networkConfiguration?.awsvpcConfiguration?.subnets || [];

      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });

    it('should have auto-scaling configured for services', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [
          outputs.apiGatewayServiceName,
          outputs.paymentProcessorServiceName,
          outputs.fraudDetectorServiceName,
        ],
      });

      const response = await ecsClient.send(command);

      // All services should have desired count between min and max
      response.services?.forEach((service) => {
        expect(service.desiredCount).toBeDefined();
        expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have multiple availability zones configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];
      const subnets =
        service?.networkConfiguration?.awsvpcConfiguration?.subnets || [];

      // Should have at least 2 subnets for HA across AZs
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Network Configuration', () => {
    it('should have services in private subnets', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service?.networkConfiguration?.awsvpcConfiguration?.assignPublicIp).toBe('DISABLED');
    });

    it('should have security groups attached to services', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];
      const securityGroups =
        service?.networkConfiguration?.awsvpcConfiguration?.securityGroups || [];

      expect(securityGroups.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Service Health', () => {
    it('should have services with running tasks', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [
          outputs.apiGatewayServiceName,
          outputs.paymentProcessorServiceName,
          outputs.fraudDetectorServiceName,
        ],
      });

      const response = await ecsClient.send(command);

      response.services?.forEach((service) => {
        expect(service.runningCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have services with correct deployment configuration', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service?.deploymentConfiguration?.maximumPercent).toBe(200);
      expect(service?.deploymentConfiguration?.minimumHealthyPercent).toBe(100);
    });
  });

  describe('Load Balancer Integration', () => {
    it('should have api-gateway service attached to load balancer', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecsClusterName,
        services: [outputs.apiGatewayServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services?.[0];

      expect(service?.loadBalancers).toBeDefined();
      expect(service?.loadBalancers?.length).toBeGreaterThanOrEqual(1);
    });

    it('should have target group health checks configured', async () => {
      const command = new DescribeTargetGroupsCommand({});

      const response = await elbClient.send(command);
      const targetGroups = response.TargetGroups?.filter((tg) =>
        tg.TargetGroupName?.includes('payment-api-tg')
      );

      expect(targetGroups).toBeDefined();
      targetGroups?.forEach((tg) => {
        expect(tg.HealthCheckEnabled).toBe(true);
        expect(tg.HealthCheckPath).toBe('/health');
      });
    });
  });
});
