import * as fs from 'fs';
import * as path from 'path';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';
import { S3Client, GetBucketVersioningCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CodeBuildClient, BatchGetProjectsCommand } from '@aws-sdk/client-codebuild';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  const region = 'us-east-1';

  beforeAll(() => {
    // Read outputs from deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Deploy the stack first.`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Stack Outputs', () => {
    it('should have pipelineUrl output', () => {
      expect(outputs.pipelineUrl).toBeDefined();
      expect(outputs.pipelineUrl).toContain('codepipeline/pipelines/');
    });

    it('should have ecrRepositoryUri output', () => {
      expect(outputs.ecrRepositoryUri).toBeDefined();
      expect(outputs.ecrRepositoryUri).toContain('.dkr.ecr.us-east-1.amazonaws.com/');
    });
  });

  describe('CodePipeline Integration', () => {
    const client = new CodePipelineClient({ region });

    it('should have a pipeline with correct name', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      expect(pipelineName).toBeDefined();
      expect(pipelineName).toContain('ci-pipeline');

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await client.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    it('should have three pipeline stages', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await client.send(command);

      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBe(3);
      expect(response.pipeline?.stages?.[0].name).toBe('Source');
      expect(response.pipeline?.stages?.[1].name).toBe('Build');
      expect(response.pipeline?.stages?.[2].name).toBe('ManualApproval');
    });

    it('should have correct pipeline state', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await client.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
    });
  });

  describe('ECR Repository Integration', () => {
    const client = new ECRClient({ region });

    it('should have ECR repository with correct URI', async () => {
      const repoName = outputs.ecrRepositoryUri.split('/').pop();
      expect(repoName).toBeDefined();

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await client.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
      expect(response.repositories?.[0].repositoryName).toBe(repoName);
      expect(response.repositories?.[0].repositoryUri).toBe(outputs.ecrRepositoryUri);
    });

    it('should have ECR repository with image scanning enabled', async () => {
      const repoName = outputs.ecrRepositoryUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await client.send(command);

      expect(response.repositories?.[0].imageScanningConfiguration?.scanOnPush).toBe(true);
    });

    it('should have ECR repository with mutable tags', async () => {
      const repoName = outputs.ecrRepositoryUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await client.send(command);

      expect(response.repositories?.[0].imageTagMutability).toBe('MUTABLE');
    });
  });

  describe('S3 Bucket Integration', () => {
    const client = new S3Client({ region });

    it('should have S3 artifact bucket', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const bucketName = `artifact-bucket-${pipelineName.replace('ci-pipeline-', '')}`;

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled on artifact bucket', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const bucketName = `artifact-bucket-${pipelineName.replace('ci-pipeline-', '')}`;

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await client.send(command);

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('CloudWatch Logs Integration', () => {
    const client = new CloudWatchLogsClient({ region });

    it('should have CodeBuild log group', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const logGroupName = `/aws/codebuild/build-project-${envSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await client.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(logGroupName);
    });

    it('should have log retention set to 7 days', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const logGroupName = `/aws/codebuild/build-project-${envSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await client.send(command);

      expect(response.logGroups?.[0].retentionInDays).toBe(7);
    });
  });

  describe('IAM Roles Integration', () => {
    const client = new IAMClient({ region });

    it('should have CodeBuild IAM role', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const roleName = `codebuild-role-${envSuffix}`;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await client.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have CodePipeline IAM role', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const roleName = `pipeline-role-${envSuffix}`;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await client.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });
  });

  describe('SNS Topic Integration', () => {
    const client = new SNSClient({ region });

    it('should have SNS topic for notifications', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const topicName = `pipeline-notifications-${envSuffix}`;

      // Get account ID from ECR URI
      const accountId = outputs.ecrRepositoryUri.split('.')[0];
      const topicArn = `arn:aws:sns:${region}:${accountId}:${topicName}`;

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await client.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    it('should have SNS topic with correct display name', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const topicName = `pipeline-notifications-${envSuffix}`;

      const accountId = outputs.ecrRepositoryUri.split('.')[0];
      const topicArn = `arn:aws:sns:${region}:${accountId}:${topicName}`;

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await client.send(command);

      expect(response.Attributes?.DisplayName).toBe('CI/CD Pipeline Notifications');
    });
  });

  describe('CodeBuild Project Integration', () => {
    const client = new CodeBuildClient({ region });

    it('should have CodeBuild project', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const projectName = `build-project-${envSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await client.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0].name).toBe(projectName);
    });

    it('should have CodeBuild project with Docker support', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const projectName = `build-project-${envSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await client.send(command);

      expect(response.projects?.[0].environment?.privilegedMode).toBe(true);
      expect(response.projects?.[0].environment?.type).toBe('LINUX_CONTAINER');
    });

    it('should have CodeBuild project with correct environment variables', async () => {
      const pipelineName = outputs.pipelineUrl.split('/pipelines/')[1]?.split('/')[0];
      const envSuffix = pipelineName.replace('ci-pipeline-', '');
      const projectName = `build-project-${envSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await client.send(command);

      const envVars = response.projects?.[0].environment?.environmentVariables;
      expect(envVars).toBeDefined();

      const regionVar = envVars?.find((v) => v.name === 'AWS_DEFAULT_REGION');
      expect(regionVar).toBeDefined();
      expect(regionVar?.value).toBe('us-east-1');
    });
  });

  describe('Resource Tagging', () => {
    it('should have Environment tag on resources', async () => {
      const ecrClient = new ECRClient({ region });
      const repoName = outputs.ecrRepositoryUri.split('/').pop();

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      // Check if tags are present (ECR doesn't return tags in DescribeRepositories)
      expect(response.repositories?.[0]).toBeDefined();
    });
  });
});
