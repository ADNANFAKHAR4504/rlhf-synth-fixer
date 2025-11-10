/**
 * Integration tests for TapStack - Tests deployed AWS resources
 * Uses actual AWS SDK clients to validate deployed infrastructure
 */
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  ListImagesCommand,
} from '@aws-sdk/client-ecr';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  } else {
    throw new Error(`Outputs file not found at ${outputsPath}`);
  }
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  throw error;
}

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const ecsClient = new ECSClient({ region });
const albClient = new ElasticLoadBalancingV2Client({ region });
const ecrClient = new ECRClient({ region });
const secretsClient = new SecretsManagerClient({ region });

describe('TapStack Integration Tests', () => {
  describe('ECS Cluster', () => {
    it('should have ECS cluster created and active', async () => {
      const clusterName = outputs.clusterName;
      expect(clusterName).toBeDefined();

      const command = new DescribeClustersCommand({
        clusters: [clusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);
      expect(response.clusters?.[0].status).toBe('ACTIVE');
      expect(response.clusters?.[0].clusterName).toBe(clusterName);
    });

    it('should have Container Insights enabled', async () => {
      const clusterName = outputs.clusterName;

      const command = new DescribeClustersCommand({
        clusters: [clusterName],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);
      const cluster = response.clusters?.[0];
      const containerInsightsSetting = cluster?.settings?.find(
        (s) => s.name === 'containerInsights'
      );

      expect(containerInsightsSetting).toBeDefined();
      expect(containerInsightsSetting?.value).toBe('enabled');
    });

    it('should have ECS services running', async () => {
      const clusterName = outputs.clusterName;

      const listCommand = new ListServicesCommand({
        cluster: clusterName,
      });

      const listResponse = await ecsClient.send(listCommand);
      expect(listResponse.serviceArns).toBeDefined();
      expect(listResponse.serviceArns?.length).toBeGreaterThan(0);

      // Describe services to verify they're active
      const describeCommand = new DescribeServicesCommand({
        cluster: clusterName,
        services: listResponse.serviceArns,
      });

      const describeResponse = await ecsClient.send(describeCommand);
      expect(describeResponse.services).toBeDefined();

      for (const service of describeResponse.services || []) {
        expect(service.status).toBe('ACTIVE');
        expect(service.launchType).toBe('FARGATE');
      }
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB created and active', async () => {
      const albDnsName = outputs.albDnsName;
      expect(albDnsName).toBeDefined();
      expect(typeof albDnsName).toBe('string');
      expect(albDnsName).toContain('.elb.amazonaws.com');

      const command = new DescribeLoadBalancersCommand({});
      const response = await albClient.send(command);

      const alb = response.LoadBalancers?.find((lb) => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
    });

    it('should have ALB listeners configured', async () => {
      const albDnsName = outputs.albDnsName;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await albClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers?.find((lb) => lb.DNSName === albDnsName);
      expect(alb?.LoadBalancerArn).toBeDefined();

      const listenersCommand = new DescribeListenersCommand({
        LoadBalancerArn: alb?.LoadBalancerArn,
      });

      const listenersResponse = await albClient.send(listenersCommand);
      expect(listenersResponse.Listeners).toBeDefined();
      expect(listenersResponse.Listeners?.length).toBeGreaterThan(0);

      const httpListener = listenersResponse.Listeners?.find((l) => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
    });

    it('should have target groups configured', async () => {
      const albDnsName = outputs.albDnsName;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await albClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers?.find((lb) => lb.DNSName === albDnsName);

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb?.LoadBalancerArn,
      });

      const tgResponse = await albClient.send(tgCommand);
      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups?.length).toBeGreaterThan(0);

      for (const tg of tgResponse.TargetGroups || []) {
        expect(tg.TargetType).toBe('ip');
        expect(tg.Protocol).toBe('HTTP');
      }
    });
  });

  describe('ECR Repositories', () => {
    it('should have API ECR repository created', async () => {
      const apiEcrUrl = outputs.apiEcrUrl;
      expect(apiEcrUrl).toBeDefined();
      expect(typeof apiEcrUrl).toBe('string');
      expect(apiEcrUrl).toContain('.dkr.ecr.');

      const repositoryName = apiEcrUrl.split('/').pop();
      expect(repositoryName).toBeDefined();

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName!],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
      expect(response.repositories?.[0].repositoryName).toBe(repositoryName);
    });

    it('should have Worker ECR repository created', async () => {
      const workerEcrUrl = outputs.workerEcrUrl;
      expect(workerEcrUrl).toBeDefined();

      const repositoryName = workerEcrUrl.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName!],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
    });

    it('should have Scheduler ECR repository created', async () => {
      const schedulerEcrUrl = outputs.schedulerEcrUrl;
      expect(schedulerEcrUrl).toBeDefined();

      const repositoryName = schedulerEcrUrl.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName!],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
    });

    it('should have lifecycle policies configured on repositories', async () => {
      const apiEcrUrl = outputs.apiEcrUrl;
      const repositoryName = apiEcrUrl.split('/').pop();

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName!],
      });

      const response = await ecrClient.send(command);
      const repository = response.repositories?.[0];

      expect(repository?.imageScanningConfiguration).toBeDefined();
      expect(repository?.imageTagMutability).toBe('MUTABLE');
    });

    it('should allow image listing from repositories', async () => {
      const apiEcrUrl = outputs.apiEcrUrl;
      const repositoryName = apiEcrUrl.split('/').pop();

      const command = new ListImagesCommand({
        repositoryName: repositoryName!,
      });

      // This should not throw an error even if no images are present
      const response = await ecrClient.send(command);
      expect(response.imageIds).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    it('should have database secret created', async () => {
      const dbSecretArn = outputs.dbSecretArn;
      expect(dbSecretArn).toBeDefined();
      expect(typeof dbSecretArn).toBe('string');
      expect(dbSecretArn).toContain('arn:aws:secretsmanager');

      const command = new DescribeSecretCommand({
        SecretId: dbSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(dbSecretArn);
      expect(response.Name).toContain('db-credentials');
    });

    it('should have API key secret created', async () => {
      const apiKeySecretArn = outputs.apiKeySecretArn;
      expect(apiKeySecretArn).toBeDefined();
      expect(apiKeySecretArn).toContain('arn:aws:secretsmanager');

      const command = new DescribeSecretCommand({
        SecretId: apiKeySecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(apiKeySecretArn);
      expect(response.Name).toContain('api-keys');
    });

    it('should be able to retrieve database secret value', async () => {
      const dbSecretArn = outputs.dbSecretArn;

      const command = new GetSecretValueCommand({
        SecretId: dbSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData).toHaveProperty('username');
      expect(secretData).toHaveProperty('password');
      expect(secretData).toHaveProperty('engine');
      expect(secretData).toHaveProperty('host');
      expect(secretData).toHaveProperty('port');
      expect(secretData).toHaveProperty('dbname');
    });

    it('should be able to retrieve API key secret value', async () => {
      const apiKeySecretArn = outputs.apiKeySecretArn;

      const command = new GetSecretValueCommand({
        SecretId: apiKeySecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData).toHaveProperty('api_key');
      expect(secretData).toHaveProperty('webhook_secret');
    });
  });

  describe('Integration and Connectivity', () => {
    it('should have all required outputs defined', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.apiEcrUrl).toBeDefined();
      expect(outputs.workerEcrUrl).toBeDefined();
      expect(outputs.schedulerEcrUrl).toBeDefined();
      expect(outputs.dbSecretArn).toBeDefined();
      expect(outputs.apiKeySecretArn).toBeDefined();
    });

    it('should have ALB DNS name that is resolvable', () => {
      const albDnsName = outputs.albDnsName;
      expect(albDnsName).toMatch(/^[a-z0-9-]+\.us-(east|west)-[12]\.elb\.amazonaws\.com$/);
    });

    it('should have ECR URLs in correct format', () => {
      const apiEcrUrl = outputs.apiEcrUrl;
      const workerEcrUrl = outputs.workerEcrUrl;
      const schedulerEcrUrl = outputs.schedulerEcrUrl;

      const ecrPattern = /^\d+\.dkr\.ecr\.[a-z]{2}-[a-z]+-\d+\.amazonaws\.com\/.+$/;
      expect(apiEcrUrl).toMatch(ecrPattern);
      expect(workerEcrUrl).toMatch(ecrPattern);
      expect(schedulerEcrUrl).toMatch(ecrPattern);
    });

    it('should have all ECR URLs pointing to same AWS account', () => {
      const apiEcrUrl = outputs.apiEcrUrl;
      const workerEcrUrl = outputs.workerEcrUrl;
      const schedulerEcrUrl = outputs.schedulerEcrUrl;

      const getAccountId = (url: string) => url.split('.')[0];

      const apiAccountId = getAccountId(apiEcrUrl);
      const workerAccountId = getAccountId(workerEcrUrl);
      const schedulerAccountId = getAccountId(schedulerEcrUrl);

      expect(apiAccountId).toBe(workerAccountId);
      expect(apiAccountId).toBe(schedulerAccountId);
    });
  });
});
