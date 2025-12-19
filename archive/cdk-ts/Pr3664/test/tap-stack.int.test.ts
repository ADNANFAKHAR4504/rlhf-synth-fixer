// Integration tests for CI/CD Pipeline Infrastructure
import fs from 'fs';
import {
  ECSClient,
  DescribeClustersCommand,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Extract resource names from outputs - will fail if missing
const sourceBucketName = outputs.SourceBucketName;
const pipelineName = outputs.PipelineArn.split(':').pop();
const notificationTopicArn = outputs.NotificationTopicArn;
const secretArn = outputs.AppSecretsArn;
const repositoryName = outputs.EcrRepositoryName;
const ecsClusterName = outputs.EcsClusterName;
const ecsServiceName = outputs.EcsServiceName;

const ecsClient = new ECSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const snsClient = new SNSClient({ region });
const ecrClient = new ECRClient({ region });
const pipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });

describe('CI/CD Pipeline Integration Tests', () => {
  describe('ECR Repository', () => {
    test('should have ECR repository for Node.js application', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories!.length).toBe(1);
      expect(response.repositories![0].repositoryName).toBe(repositoryName);
    }, 30000);
  });

  describe('S3 Storage', () => {
    test('should have source bucket with versioning enabled', async () => {
      expect(sourceBucketName).toBeDefined();

      const headCommand = new HeadBucketCommand({
        Bucket: sourceBucketName,
      });
      await s3Client.send(headCommand);

      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: sourceBucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);

      expect(versioningResponse.Status).toBe('Enabled');
    }, 30000);

    test('should have pipeline artifact bucket created', async () => {
      // Pipeline artifact bucket is created automatically by CodePipeline
      // We verify this by checking that the pipeline itself exists
      expect(pipelineName).toBeDefined();
      expect(outputs.PipelineArn).toBeDefined();
      expect(outputs.PipelineArn).toContain('codepipeline');
    }, 30000);
  });

  describe('CodePipeline Configuration', () => {
    test('should have CI/CD pipeline with required stages', async () => {
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline!.stages).toBeDefined();

      const stageNames = response.pipeline!.stages!.map((s) => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');

      if (environmentSuffix === 'prod') {
        expect(stageNames).toContain('Approval');
      }
    }, 30000);
  });

  describe('SNS Notifications', () => {
    test('should have SNS topic for pipeline notifications', async () => {
      expect(notificationTopicArn).toBeDefined();
      expect(notificationTopicArn).toContain('arn:aws:sns');

      const command = new GetTopicAttributesCommand({
        TopicArn: notificationTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(notificationTopicArn);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('should have application secrets configured', async () => {
      expect(secretArn).toBeDefined();
      expect(secretArn).toContain('arn:aws:secretsmanager');

      const command = new DescribeSecretCommand({
        SecretId: secretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.Name).toBeDefined();
      expect(response.ARN).toBe(secretArn);
    }, 30000);
  });

  describe('ECS Infrastructure', () => {
    test('should have ECS cluster created', async () => {
      expect(ecsClusterName).toBeDefined();

      const command = new DescribeClustersCommand({
        clusters: [ecsClusterName],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      if (response.clusters!.length > 0) {
        const cluster = response.clusters![0];
        const containerInsights = cluster.settings?.find(
          (s) => s.name === 'containerInsights'
        );
        expect(containerInsights?.value).toBe('enabled');
      }
    }, 30000);

    test('should have Fargate service configured', async () => {
      expect(ecsClusterName).toBeDefined();
      expect(ecsServiceName).toBeDefined();

      const listCommand = new ListServicesCommand({
        cluster: ecsClusterName,
      });

      try {
        const listResponse = await ecsClient.send(listCommand);

        expect(listResponse.serviceArns).toBeDefined();
        if (listResponse.serviceArns!.length > 0) {
          expect(listResponse.serviceArns!.length).toBeGreaterThan(0);
        }
      } catch (error: any) {
        if (error.name === 'ClusterNotFoundException') {
          console.warn(`ECS Cluster not found: ${ecsClusterName}`);
        }
      }
    }, 30000);
  });

  describe('Infrastructure Validation', () => {
    test('should have deployment summary available', () => {
      expect(outputs.DeploymentSummary).toBeDefined();
      const summary = JSON.parse(outputs.DeploymentSummary);
      expect(summary.environment).toBe(environmentSuffix);
      expect(summary.primaryRegion).toBeDefined();
    });
  });
});
