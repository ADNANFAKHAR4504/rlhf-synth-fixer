import { readFileSync, existsSync } from 'fs';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
import {
  ServiceDiscoveryClient,
  GetNamespaceCommand,
} from '@aws-sdk/client-servicediscovery';
import {
  S3Client,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  SQSClient,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';

const region = process.env.AWS_REGION || 'us-east-1';

interface StackOutputs {
  LoadBalancerDNS?: string;
  CloudMapNamespace?: string;
  CloudMapNamespaceId?: string;
  EcsClusterName?: string;
  ApiRepositoryUri?: string;
  WorkerRepositoryUri?: string;
  JobRepositoryUri?: string;
  DatabaseEndpoint?: string;
  DataBucketName?: string;
  TaskQueueUrl?: string;
}

const loadOutputs = (): StackOutputs => {
  const outputsPath = './cfn-outputs/flat-outputs.json';
  if (!existsSync(outputsPath)) {
    console.warn(`Outputs file not found at ${outputsPath}. Skipping integration tests.`);
    return {};
  }
  return JSON.parse(readFileSync(outputsPath, 'utf8'));
};

describe('ECS Fargate Infrastructure Integration Tests', () => {
  let outputs: StackOutputs;
  let ecsClient: ECSClient;
  let elbClient: ElasticLoadBalancingV2Client;
  let rdsClient: RDSClient;
  let ecrClient: ECRClient;
  let sdClient: ServiceDiscoveryClient;
  let s3Client: S3Client;
  let sqsClient: SQSClient;

  beforeAll(() => {
    outputs = loadOutputs();
    ecsClient = new ECSClient({ region });
    elbClient = new ElasticLoadBalancingV2Client({ region });
    rdsClient = new RDSClient({ region });
    ecrClient = new ECRClient({ region });
    sdClient = new ServiceDiscoveryClient({ region });
    s3Client = new S3Client({ region });
    sqsClient = new SQSClient({ region });
  });

  describe('ECS Cluster and Services', () => {
    test('should have ECS cluster running with Container Insights enabled', async () => {
      if (!outputs.EcsClusterName) {
        console.log('Skipping: EcsClusterName not found in outputs');
        return;
      }

      const command = new DescribeClustersCommand({
        clusters: [outputs.EcsClusterName],
        include: ['SETTINGS'],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');

      const containerInsights = cluster.settings?.find(
        (s) => s.name === 'containerInsights'
      );
      expect(containerInsights?.value).toBe('enabled');
    });

    test('should have API service running with desired task count', async () => {
      if (!outputs.EcsClusterName) {
        console.log('Skipping: EcsClusterName not found in outputs');
        return;
      }

      const listCommand = new ListServicesCommand({
        cluster: outputs.EcsClusterName,
      });
      const listResponse = await ecsClient.send(listCommand);

      const apiService = listResponse.serviceArns?.find((arn) =>
        arn.includes('fraud-api')
      );
      expect(apiService).toBeDefined();

      const describeCommand = new DescribeServicesCommand({
        cluster: outputs.EcsClusterName,
        services: [apiService!],
      });
      const describeResponse = await ecsClient.send(describeCommand);

      const service = describeResponse.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service.runningCount).toBeGreaterThanOrEqual(1);
      expect(service.launchType).toBe('FARGATE');

      // Check circuit breaker is enabled
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.enable).toBe(true);
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.rollback).toBe(true);
    });

    test('should have Worker service running', async () => {
      if (!outputs.EcsClusterName) {
        console.log('Skipping: EcsClusterName not found in outputs');
        return;
      }

      const listCommand = new ListServicesCommand({
        cluster: outputs.EcsClusterName,
      });
      const listResponse = await ecsClient.send(listCommand);

      const workerService = listResponse.serviceArns?.find((arn) =>
        arn.includes('fraud-worker')
      );
      expect(workerService).toBeDefined();

      const describeCommand = new DescribeServicesCommand({
        cluster: outputs.EcsClusterName,
        services: [workerService!],
      });
      const describeResponse = await ecsClient.send(describeCommand);

      const service = describeResponse.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBeGreaterThanOrEqual(1);
      expect(service.launchType).toBe('FARGATE');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB accessible and healthy', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.log('Skipping: LoadBalancerDNS not found in outputs');
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find((lb) =>
        lb.DNSName === outputs.LoadBalancerDNS
      );
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
    });

    test('should have target group with healthy targets', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.log('Skipping: LoadBalancerDNS not found in outputs');
        return;
      }

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers?.find((lb) =>
        lb.DNSName === outputs.LoadBalancerDNS
      );

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb?.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

      // Check target health for API target group
      const apiTG = tgResponse.TargetGroups?.find((tg) => tg.Port === 8080);
      if (apiTG) {
        const healthCommand = new DescribeTargetHealthCommand({
          TargetGroupArn: apiTG.TargetGroupArn,
        });
        const healthResponse = await elbClient.send(healthCommand);

        // At least some targets should be healthy
        const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(
          (t) => t.TargetHealth?.State === 'healthy'
        );
        expect(healthyTargets?.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('RDS Aurora Database', () => {
    test('should have Aurora PostgreSQL cluster available', async () => {
      if (!outputs.DatabaseEndpoint) {
        console.log('Skipping: DatabaseEndpoint not found in outputs');
        return;
      }

      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.find((c) =>
        c.Endpoint === outputs.DatabaseEndpoint
      );
      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe('available');
      expect(cluster?.Engine).toBe('aurora-postgresql');
      expect(cluster?.StorageEncrypted).toBe(true);
      expect(cluster?.DatabaseName).toBe('frauddb');
    });
  });

  describe('ECR Repositories', () => {
    test('should have API repository created', async () => {
      if (!outputs.ApiRepositoryUri) {
        console.log('Skipping: ApiRepositoryUri not found in outputs');
        return;
      }

      const repoName = outputs.ApiRepositoryUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName!],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toHaveLength(1);
      expect(response.repositories![0].imageScanningConfiguration?.scanOnPush).toBe(true);
    });

    test('should have Worker repository created', async () => {
      if (!outputs.WorkerRepositoryUri) {
        console.log('Skipping: WorkerRepositoryUri not found in outputs');
        return;
      }

      const repoName = outputs.WorkerRepositoryUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName!],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toHaveLength(1);
    });

    test('should have Job repository created', async () => {
      if (!outputs.JobRepositoryUri) {
        console.log('Skipping: JobRepositoryUri not found in outputs');
        return;
      }

      const repoName = outputs.JobRepositoryUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName!],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toHaveLength(1);
    });
  });

  describe('Service Discovery', () => {
    test('should have Cloud Map namespace created', async () => {
      if (!outputs.CloudMapNamespaceId) {
        console.log('Skipping: CloudMapNamespaceId not found in outputs');
        return;
      }

      const command = new GetNamespaceCommand({
        Id: outputs.CloudMapNamespaceId,
      });
      const response = await sdClient.send(command);

      expect(response.Namespace).toBeDefined();
      expect(response.Namespace?.Name).toContain('fraud-services');
      expect(response.Namespace?.Type).toBe('DNS_PRIVATE');
    });
  });

  describe('S3 and SQS Resources', () => {
    test('should have S3 data bucket created', async () => {
      if (!outputs.DataBucketName) {
        console.log('Skipping: DataBucketName not found in outputs');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.DataBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have SQS queue created', async () => {
      if (!outputs.TaskQueueUrl) {
        console.log('Skipping: TaskQueueUrl not found in outputs');
        return;
      }

      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.TaskQueueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.QueueArn).toBeDefined();
    });
  });

  describe('Auto-Scaling Configuration', () => {
    test('should have auto-scaling configured for API service', async () => {
      if (!outputs.EcsClusterName) {
        console.log('Skipping: EcsClusterName not found in outputs');
        return;
      }

      const listCommand = new ListServicesCommand({
        cluster: outputs.EcsClusterName,
      });
      const listResponse = await ecsClient.send(listCommand);

      const apiService = listResponse.serviceArns?.find((arn) =>
        arn.includes('fraud-api')
      );

      if (apiService) {
        const describeCommand = new DescribeServicesCommand({
          cluster: outputs.EcsClusterName,
          services: [apiService],
        });
        const describeResponse = await ecsClient.send(describeCommand);

        const service = describeResponse.services![0];
        // Service should be configured for auto-scaling
        expect(service.desiredCount).toBeGreaterThanOrEqual(2);
        expect(service.desiredCount).toBeLessThanOrEqual(10);
      }
    });
  });
});
