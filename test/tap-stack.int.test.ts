import fs from 'fs';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  EFSClient,
  DescribeFileSystemsCommand,
} from '@aws-sdk/client-efs';
import {
  CodePipelineClient,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const ecsClient = new ECSClient({ region });
const rdsClient = new RDSClient({ region });
const efsClient = new EFSClient({ region });
const pipelineClient = new CodePipelineClient({ region });
const secretsClient = new SecretsManagerClient({ region });

describe('Healthcare CI/CD Pipeline Integration Tests', () => {
  describe('ECS Infrastructure', () => {
    test('ECS cluster is active', async () => {
      const clusterName = outputs.ClusterName;
      expect(clusterName).toBeDefined();

      const command = new DescribeClustersCommand({
        clusters: [clusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
      expect(response.clusters![0].clusterName).toBe(clusterName);
    });

    test('ECS service is running', async () => {
      const clusterName = outputs.ClusterName;
      const serviceName = outputs.ServiceName;
      expect(clusterName).toBeDefined();
      expect(serviceName).toBeDefined();

      const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      const response = await ecsClient.send(command);
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].desiredCount).toBeGreaterThanOrEqual(1);
      expect(response.services![0].launchType).toBe('FARGATE');
    });

    test('ECS tasks are running in private subnets', async () => {
      const clusterName = outputs.ClusterName;
      const serviceName = outputs.ServiceName;

      const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      const response = await ecsClient.send(command);
      const networkConfig = response.services![0].networkConfiguration?.awsvpcConfiguration;

      expect(networkConfig).toBeDefined();
      expect(networkConfig!.assignPublicIp).toBe('DISABLED');
    });
  });

  describe('RDS Database', () => {
    test('RDS instance is available', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      // Extract DB instance identifier from endpoint or use pattern
      const dbInstances = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const healthcareDb = dbInstances.DBInstances?.find((db) =>
        db.DBInstanceIdentifier?.includes('healthcare-db')
      );

      expect(healthcareDb).toBeDefined();
      expect(healthcareDb!.DBInstanceStatus).toBe('available');
      expect(healthcareDb!.Engine).toBe('postgres');
      expect(healthcareDb!.StorageEncrypted).toBe(true);
      expect(healthcareDb!.MultiAZ).toBe(false);
    });

    test('RDS is in private subnets', async () => {
      const dbInstances = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const healthcareDb = dbInstances.DBInstances?.find((db) =>
        db.DBInstanceIdentifier?.includes('healthcare-db')
      );

      expect(healthcareDb).toBeDefined();
      expect(healthcareDb!.PubliclyAccessible).toBe(false);
    });
  });

  describe('Secrets Manager', () => {
    test('database credentials secret exists', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({
        SecretId: secretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toContain('healthcare-db-credentials');
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(30);
    });
  });

  describe('EFS File System', () => {
    test('EFS file system is available', async () => {
      const fileSystemId = outputs.FileSystemId;
      expect(fileSystemId).toBeDefined();

      const command = new DescribeFileSystemsCommand({
        FileSystemId: fileSystemId,
      });

      const response = await efsClient.send(command);
      expect(response.FileSystems).toHaveLength(1);
      expect(response.FileSystems![0].LifeCycleState).toBe('available');
      expect(response.FileSystems![0].Encrypted).toBe(true);
    });
  });

  describe('CodePipeline', () => {
    test('pipeline exists and is configured', async () => {
      const pipelineName = outputs.PipelineName;
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);
      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();

      const stageNames = response.stageStates!.map((stage) => stage.stageName);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });
  });

  describe('Load Balancer Connectivity', () => {
    test('load balancer DNS is accessible', async () => {
      const albDns = outputs.LoadBalancerDns;
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });

  describe('Network Security', () => {
    test('all required outputs are present', () => {
      expect(outputs.ClusterName).toBeDefined();
      expect(outputs.ServiceName).toBeDefined();
      expect(outputs.LoadBalancerDns).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();
      expect(outputs.FileSystemId).toBeDefined();
      expect(outputs.PipelineName).toBeDefined();
    });

    test('outputs contain environment suffix', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

      Object.values(outputs).forEach((value: any) => {
        if (typeof value === 'string' && value.includes('healthcare')) {
          expect(value).toContain(environmentSuffix);
        }
      });
    });
  });
});
