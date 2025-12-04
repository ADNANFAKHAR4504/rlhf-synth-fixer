// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { CodeCommitClient, GetRepositoryCommand } from '@aws-sdk/client-codecommit';
import { CodeBuildClient, BatchGetProjectsCommand } from '@aws-sdk/client-codebuild';
import { CodePipelineClient, GetPipelineCommand } from '@aws-sdk/client-codepipeline';
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'y5z9i9e0';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const codecommitClient = new CodeCommitClient({ region });
const codebuildClient = new CodeBuildClient({ region });
const codepipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('CI/CD Pipeline Integration Tests', () => {
  describe('CodeCommit Repository Validation', () => {
    test('Repository exists and has correct name', async () => {
      const repositoryName = outputs.CicdPipelineRepositoryNameDDCE57DC;
      expect(repositoryName).toBeDefined();
      expect(repositoryName).toContain(environmentSuffix);

      const command = new GetRepositoryCommand({ repositoryName });
      const response = await codecommitClient.send(command);

      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repositoryName);
      expect(response.repositoryMetadata?.cloneUrlHttp).toContain(repositoryName);
    });
  });

  describe('CodeBuild Project Validation', () => {
    test('Build project exists with correct configuration', async () => {
      const projectName = outputs.CicdPipelineBuildProjectNameB7DFF54C;
      expect(projectName).toBeDefined();
      expect(projectName).toContain(environmentSuffix);

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      expect(response.projects).toHaveLength(1);
      const project = response.projects![0];

      expect(project.name).toBe(projectName);
      expect(project.environment?.image).toContain('standard:7.0');

      // Verify NODE_ENV=production environment variable
      const nodeEnvVar = project.environment?.environmentVariables?.find(
        (v) => v.name === 'NODE_ENV'
      );
      expect(nodeEnvVar).toBeDefined();
      expect(nodeEnvVar?.value).toBe('production');
    });
  });

  describe('CodePipeline Validation', () => {
    test('Pipeline exists with three stages', async () => {
      const pipelineName = outputs.CicdPipelinePipelineNameDD9A5CCD;
      expect(pipelineName).toBeDefined();
      expect(pipelineName).toContain(environmentSuffix);

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toHaveLength(3);

      // Verify stage names
      const stageNames = response.pipeline?.stages?.map((s) => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });
  });

  describe('S3 Artifacts Bucket Validation', () => {
    test('Bucket exists with versioning and encryption enabled', async () => {
      const bucketName = outputs.CicdPipelineArtifactsBucketName127BA13E;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('CloudWatch Logs Validation', () => {
    test('Log group exists with 7-day retention', async () => {
      const logGroupName = outputs.CicdPipelineBuildLogGroupNameC986A6E8;
      expect(logGroupName).toBeDefined();
      expect(logGroupName).toContain(environmentSuffix);

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];

      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(7);
    });
  });
});
