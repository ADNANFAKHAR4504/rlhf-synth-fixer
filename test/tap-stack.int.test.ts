import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  GetLifecyclePolicyCommand,
} from '@aws-sdk/client-ecr';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synth-h2j8h9w4';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

describe('TAP Stack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Read deployment outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please deploy the stack first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.bucketName).toBeDefined();
      expect(outputs.ecrRepositoryUrl).toBeDefined();
      expect(outputs.pipelineName).toBeDefined();
      expect(outputs.notificationTopicArn).toBeDefined();
    });

    it('should have outputs with environment suffix', () => {
      expect(outputs.bucketName).toContain(ENVIRONMENT_SUFFIX);
      expect(outputs.ecrRepositoryUrl).toContain(ENVIRONMENT_SUFFIX);
      expect(outputs.pipelineName).toContain(ENVIRONMENT_SUFFIX);
      expect(outputs.notificationTopicArn).toContain(ENVIRONMENT_SUFFIX);
    });
  });

  describe('S3 Bucket', () => {
    const s3Client = new S3Client({ region: AWS_REGION });

    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: outputs.bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('ECR Repository', () => {
    const ecrClient = new ECRClient({ region: AWS_REGION });

    it('should exist with correct configuration', async () => {
      const repoName = outputs.ecrRepositoryUrl.split('/')[1];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toHaveLength(1);
      expect(response.repositories?.[0].repositoryName).toBe(repoName);
      expect(response.repositories?.[0].imageScanningConfiguration?.scanOnPush).toBe(
        true
      );
    });

    it('should have lifecycle policy configured', async () => {
      const repoName = outputs.ecrRepositoryUrl.split('/')[1];
      const command = new GetLifecyclePolicyCommand({
        repositoryName: repoName,
      });
      const response = await ecrClient.send(command);

      expect(response.lifecyclePolicyText).toBeDefined();
      const policy = JSON.parse(response.lifecyclePolicyText || '{}');
      expect(policy.rules).toBeDefined();
      expect(policy.rules.length).toBeGreaterThan(0);
    });
  });

  describe('CodePipeline', () => {
    const pipelineClient = new CodePipelineClient({ region: AWS_REGION });

    it('should exist with correct stages', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBeGreaterThanOrEqual(3);

      const stageNames = response.pipeline?.stages?.map((stage) => stage.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    it('should use the correct artifact bucket', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);

      const artifactStore =
        response.pipeline?.artifactStore || response.pipeline?.artifactStores?.[0];
      expect(artifactStore?.location).toBe(outputs.bucketName);
      expect(artifactStore?.type).toBe('S3');
    });
  });

  describe('SNS Topic', () => {
    const snsClient = new SNSClient({ region: AWS_REGION });

    it('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.notificationTopicArn,
      });
      await expect(snsClient.send(command)).resolves.toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

    it('should have log group for CodeBuild', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `build-logs-${ENVIRONMENT_SUFFIX}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].retentionInDays).toBe(7);
    });
  });

  describe('Resource Integration', () => {
    it('should have all resources properly linked', async () => {
      // Verify pipeline uses correct S3 bucket
      const pipelineClient = new CodePipelineClient({ region: AWS_REGION });
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const pipelineResponse = await pipelineClient.send(pipelineCommand);

      const artifactStore =
        pipelineResponse.pipeline?.artifactStore ||
        pipelineResponse.pipeline?.artifactStores?.[0];
      expect(artifactStore?.location).toBe(outputs.bucketName);

      // Verify ECR repository exists and is accessible
      const ecrClient = new ECRClient({ region: AWS_REGION });
      const repoName = outputs.ecrRepositoryUrl.split('/')[1];
      const ecrCommand = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const ecrResponse = await ecrClient.send(ecrCommand);

      expect(ecrResponse.repositories).toHaveLength(1);
    });
  });
});
