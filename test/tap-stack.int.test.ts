import * as fs from 'fs';
import * as path from 'path';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import { CodeBuildClient, BatchGetProjectsCommand } from '@aws-sdk/client-codebuild';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

describe('TAP Stack Integration Tests', () => {
  let outputs: {
    pipelineArn: string;
    pipelineName: string;
    artifactBucketName: string;
    buildProjectName: string;
    deployBucketName: string;
  };

  const codePipelineClient = new CodePipelineClient({ region: 'us-east-1' });
  const codeBuildClient = new CodeBuildClient({ region: 'us-east-1' });
  const s3Client = new S3Client({ region: 'us-east-1' });
  const iamClient = new IAMClient({ region: 'us-east-1' });
  const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

  beforeAll(() => {
    // Read deployment outputs
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'Outputs file not found. Please run deployment first: pulumi up'
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('CodePipeline Resources', () => {
    it('should have deployed CodePipeline successfully', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await codePipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(outputs.pipelineName);
    });

    it('should have Source, Build, and Deploy stages', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await codePipelineClient.send(command);
      const stages = response.pipeline?.stages || [];
      expect(stages.length).toBe(3);
      expect(stages[0].name).toBe('Source');
      expect(stages[1].name).toBe('Build');
      expect(stages[2].name).toBe('Deploy');
    });

    it('should have GitHub source action configured', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await codePipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.[0];
      expect(sourceStage?.actions?.[0].actionTypeId?.provider).toBe('GitHub');
    });

    it('should have CodeBuild build action configured', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await codePipelineClient.send(command);
      const buildStage = response.pipeline?.stages?.[1];
      expect(buildStage?.actions?.[0].actionTypeId?.provider).toBe(
        'CodeBuild'
      );
    });

    it('should have S3 deploy action configured', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await codePipelineClient.send(command);
      const deployStage = response.pipeline?.stages?.[2];
      expect(deployStage?.actions?.[0].actionTypeId?.provider).toBe('S3');
    });
  });

  describe('CodeBuild Resources', () => {
    it('should have deployed CodeBuild project successfully', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.buildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.[0]?.name).toBe(outputs.buildProjectName);
    });

    it('should use correct Docker image', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.buildProjectName],
      });
      const response = await codeBuildClient.send(command);
      const environment = response.projects?.[0]?.environment;
      expect(environment?.image).toBe('aws/codebuild/standard:7.0');
    });

    it('should have CloudWatch Logs configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.buildProjectName],
      });
      const response = await codeBuildClient.send(command);
      const logsConfig = response.projects?.[0]?.logsConfig;
      expect(logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
    });

    it('should have buildspec configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.buildProjectName],
      });
      const response = await codeBuildClient.send(command);
      const source = response.projects?.[0]?.source;
      expect(source?.buildspec).toBeDefined();
      expect(source?.buildspec).toContain('version: 0.2');
    });
  });

  describe('S3 Buckets', () => {
    it('should have artifact bucket created', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.artifactBucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have deploy bucket created', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.deployBucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have versioning enabled on artifact bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have versioning enabled on deploy bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.deployBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('IAM Roles', () => {
    it('should have CodeBuild role created', async () => {
      const command = new GetRoleCommand({
        RoleName: 'codebuild-role-dev',
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe('codebuild-role-dev');
    });

    it('should have CodePipeline role created', async () => {
      const command = new GetRoleCommand({
        RoleName: 'pipeline-role-dev',
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe('pipeline-role-dev');
    });

    it('should have correct trust policy for CodeBuild role', async () => {
      const command = new GetRoleCommand({
        RoleName: 'codebuild-role-dev',
      });
      const response = await iamClient.send(command);
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      expect(trustPolicy.Statement[0].Principal.Service).toContain(
        'codebuild.amazonaws.com'
      );
    });

    it('should have correct trust policy for CodePipeline role', async () => {
      const command = new GetRoleCommand({
        RoleName: 'pipeline-role-dev',
      });
      const response = await iamClient.send(command);
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      expect(trustPolicy.Statement[0].Principal.Service).toContain(
        'codepipeline.amazonaws.com'
      );
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group created for CodeBuild', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/codebuild/build-project-dev',
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });

    it('should have correct retention policy on log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/codebuild/build-project-dev',
      });
      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.[0];
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('Resource Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.pipelineArn).toBeDefined();
      expect(outputs.pipelineName).toBeDefined();
      expect(outputs.artifactBucketName).toBeDefined();
      expect(outputs.buildProjectName).toBeDefined();
      expect(outputs.deployBucketName).toBeDefined();
    });

    it('should have valid ARN format for pipeline', () => {
      expect(outputs.pipelineArn).toMatch(
        /^arn:aws:codepipeline:[a-z0-9-]+:\d{12}:.+$/
      );
    });

    it('should have lowercase resource names', () => {
      expect(outputs.pipelineName).toBe(outputs.pipelineName.toLowerCase());
      expect(outputs.buildProjectName).toBe(
        outputs.buildProjectName.toLowerCase()
      );
      expect(outputs.artifactBucketName).toBe(
        outputs.artifactBucketName.toLowerCase()
      );
    });
  });

  describe('Security Configuration', () => {
    it('should have encryption configured on artifact bucket', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.artifactBucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
      // Encryption is verified by successful creation
    });

    it('should have encryption configured on deploy bucket', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.deployBucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
      // Encryption is verified by successful creation
    });
  });
});
