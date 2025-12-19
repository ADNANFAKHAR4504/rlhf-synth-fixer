import fs from 'fs';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeCommitClient,
  GetRepositoryCommand,
} from '@aws-sdk/client-codecommit';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load outputs from CloudFormation deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CI/CD Pipeline Integration Tests', () => {
  const codePipelineClient = new CodePipelineClient({ region });
  const codeCommitClient = new CodeCommitClient({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const s3Client = new S3Client({ region });
  const snsClient = new SNSClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });

  describe('CodeCommit Repository', () => {
    test('should have repository accessible with correct configuration', async () => {
      const repositoryName = `media-processing-repo-${environmentSuffix}`;

      const command = new GetRepositoryCommand({
        repositoryName,
      });

      const response = await codeCommitClient.send(command);

      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repositoryName);
      expect(response.repositoryMetadata?.cloneUrlHttp).toBe(outputs.RepositoryCloneUrlHttp);
      expect(response.repositoryMetadata?.cloneUrlSsh).toBe(outputs.RepositoryCloneUrlSsh);
      expect(response.repositoryMetadata?.Arn).toBe(outputs.RepositoryArn);
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('should have artifact bucket accessible', async () => {
      const bucketName = outputs.ArtifactBucketName;

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have encryption enabled', async () => {
      const bucketName = outputs.ArtifactBucketName;

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have versioning enabled', async () => {
      const bucketName = outputs.ArtifactBucketName;

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('CodeBuild Project', () => {
    test('should have build project with correct configuration', async () => {
      const projectName = outputs.BuildProjectName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);

      const project = response.projects?.[0];
      expect(project?.name).toBe(projectName);
      expect(project?.arn).toBe(outputs.BuildProjectArn);
      expect(project?.artifacts?.type).toBe('CODEPIPELINE');
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('should have environment variables configured', async () => {
      const projectName = outputs.BuildProjectName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.environment?.environmentVariables).toBeDefined();

      const envVars = project?.environment?.environmentVariables || [];
      const artifactBucketVar = envVars.find(v => v.name === 'ARTIFACT_BUCKET');
      const regionVar = envVars.find(v => v.name === 'AWS_DEFAULT_REGION');
      const envSuffixVar = envVars.find(v => v.name === 'ENVIRONMENT_SUFFIX');

      expect(artifactBucketVar).toBeDefined();
      expect(regionVar).toBeDefined();
      expect(envSuffixVar).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have log group created with correct retention', async () => {
      const logGroupName = outputs.BuildLogGroupName;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(logGroupName);
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('SNS Topic', () => {
    test('should have notification topic accessible', async () => {
      const topicArn = outputs.NotificationTopicArn;

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
      expect(response.Attributes?.DisplayName).toBe('Media Processing Pipeline Notifications');
    });
  });

  describe('CodePipeline', () => {
    test('should have pipeline with correct configuration', async () => {
      const pipelineName = outputs.PipelineName;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBe(3);
    });

    test('should have Source stage configured with CodeCommit', async () => {
      const pipelineName = outputs.PipelineName;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.[0];

      expect(sourceStage?.name).toBe('Source');
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('CodeCommit');
      expect(sourceStage?.actions?.[0]?.configuration?.BranchName).toBe('main');
    });

    test('should have Build stage configured with CodeBuild', async () => {
      const pipelineName = outputs.PipelineName;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const buildStage = response.pipeline?.stages?.[1];

      expect(buildStage?.name).toBe('Build');
      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildStage?.actions?.[0]?.configuration?.ProjectName).toBe(outputs.BuildProjectName);
    });

    test('should have Deploy stage configured with S3', async () => {
      const pipelineName = outputs.PipelineName;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const deployStage = response.pipeline?.stages?.[2];

      expect(deployStage?.name).toBe('Deploy');
      expect(deployStage?.actions?.[0]?.actionTypeId?.provider).toBe('S3');
      expect(deployStage?.actions?.[0]?.configuration?.BucketName).toBe(outputs.ArtifactBucketName);
    });

    test('should have artifact store configured', async () => {
      const pipelineName = outputs.PipelineName;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.artifactStore).toBeDefined();
      expect(response.pipeline?.artifactStore?.type).toBe('S3');
      expect(response.pipeline?.artifactStore?.location).toBe(outputs.ArtifactBucketName);
    });

    test('should be in a valid state', async () => {
      const pipelineName = outputs.PipelineName;

      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates?.length).toBe(3);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('should have all resources properly connected', async () => {
      // Verify pipeline references correct repository
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.PipelineName,
      });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);
      const sourceAction = pipelineResponse.pipeline?.stages?.[0]?.actions?.[0];

      expect(sourceAction?.configuration?.RepositoryName).toBe(`media-processing-repo-${environmentSuffix}`);

      // Verify pipeline references correct build project
      const buildAction = pipelineResponse.pipeline?.stages?.[1]?.actions?.[0];
      expect(buildAction?.configuration?.ProjectName).toBe(outputs.BuildProjectName);

      // Verify pipeline uses correct artifact bucket
      expect(pipelineResponse.pipeline?.artifactStore?.location).toBe(outputs.ArtifactBucketName);
    });

    test('should have proper resource naming with environmentSuffix', () => {
      expect(outputs.RepositoryCloneUrlHttp).toContain(environmentSuffix);
      expect(outputs.BuildProjectName).toContain(environmentSuffix);
      expect(outputs.PipelineName).toContain(environmentSuffix);
      expect(outputs.ArtifactBucketName).toContain(environmentSuffix);
      expect(outputs.BuildLogGroupName).toContain(environmentSuffix);
      expect(outputs.NotificationTopicName).toContain(environmentSuffix);
    });
  });
});
