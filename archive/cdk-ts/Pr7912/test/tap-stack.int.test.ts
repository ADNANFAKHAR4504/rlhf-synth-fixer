// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CodeCommitClient,
  GetRepositoryCommand,
} from '@aws-sdk/client-codecommit';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Check if outputs file exists
let outputs: any = {};
const outputsPath = 'cfn-outputs/flat-outputs.json';
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// AWS SDK clients
const s3Client = new S3Client({});
const codeCommitClient = new CodeCommitClient({});
const codeBuildClient = new CodeBuildClient({});
const codePipelineClient = new CodePipelineClient({});
const snsClient = new SNSClient({});
const logsClient = new CloudWatchLogsClient({});
const eventsClient = new EventBridgeClient({});

// Resource names - read from CloudFormation outputs where available
const bucketName = outputs.ArtifactBucketName || `pipeline-artifacts-${environmentSuffix}`;
const pipelineName = outputs.PipelineName || `app-pipeline-${environmentSuffix}`;
const snsTopicArn = outputs.NotificationTopicArn;
const repositoryUrl = outputs.RepositoryCloneUrlHttp;

// Extract names from outputs
const repositoryName = repositoryUrl ? repositoryUrl.split('/').pop() : `app-repo-${environmentSuffix}`;
const snsTopicName = snsTopicArn ? snsTopicArn.split(':').pop() : `pipeline-notifications-${environmentSuffix}`;

// These don't have direct outputs, use pattern matching
const testProjectName = `test-project-${environmentSuffix}`;
const stagingProjectName = `staging-deploy-${environmentSuffix}`;
const productionProjectName = `production-deploy-${environmentSuffix}`;
const eventRuleName = `pipeline-failure-${environmentSuffix}`;

describe('CI/CD Pipeline Integration Tests', () => {
  describe('S3 Artifact Bucket', () => {
    test('bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('bucket has encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });
  });

  describe('CodeCommit Repository', () => {
    test('repository exists', async () => {
      const command = new GetRepositoryCommand({
        repositoryName: repositoryName,
      });
      const response = await codeCommitClient.send(command);
      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repositoryName);
    });

    test('repository has correct description', async () => {
      const command = new GetRepositoryCommand({
        repositoryName: repositoryName,
      });
      const response = await codeCommitClient.send(command);
      expect(response.repositoryMetadata?.repositoryDescription).toBe(
        'Node.js application repository'
      );
    });

    test('repository has clone URLs', async () => {
      const command = new GetRepositoryCommand({
        repositoryName: repositoryName,
      });
      const response = await codeCommitClient.send(command);
      expect(response.repositoryMetadata?.cloneUrlHttp).toBeDefined();
      expect(response.repositoryMetadata?.cloneUrlSsh).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('test project log group exists with 7-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/test-project-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0]?.retentionInDays).toBe(7);
    });

    test('staging project log group exists with 7-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/staging-deploy-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0]?.retentionInDays).toBe(7);
    });

    test('production project log group exists with 7-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/production-deploy-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0]?.retentionInDays).toBe(7);
    });
  });

  describe('CodeBuild Projects', () => {
    test('test project exists with correct configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [testProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);

      const project = response.projects?.[0];
      expect(project?.name).toBe(testProjectName);
      expect(project?.description).toBe('Run unit tests for Node.js application');
      expect(project?.environment?.image).toContain('aws/codebuild/standard');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('test project has Node.js 18 configured in buildspec', async () => {
      const command = new BatchGetProjectsCommand({
        names: [testProjectName],
      });
      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      // Check buildspec contains nodejs 18
      const buildSpec = project?.source?.buildspec;
      expect(buildSpec).toBeDefined();
      if (buildSpec) {
        const parsed = typeof buildSpec === 'string' ? JSON.parse(buildSpec) : buildSpec;
        expect(parsed.phases?.install?.['runtime-versions']?.nodejs).toBe('18');
      }
    });

    test('staging project exists with environment variables', async () => {
      const command = new BatchGetProjectsCommand({
        names: [stagingProjectName],
      });
      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.name).toBe(stagingProjectName);
      expect(project?.description).toBe('Deploy to staging environment');

      const envVars = project?.environment?.environmentVariables;
      expect(envVars).toBeDefined();
      const envVar = envVars?.find((v) => v.name === 'ENVIRONMENT');
      expect(envVar?.value).toBe('staging');
    });

    test('production project exists with environment variables', async () => {
      const command = new BatchGetProjectsCommand({
        names: [productionProjectName],
      });
      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.name).toBe(productionProjectName);
      expect(project?.description).toBe('Deploy to production environment');

      const envVars = project?.environment?.environmentVariables;
      expect(envVars).toBeDefined();
      const envVar = envVars?.find((v) => v.name === 'ENVIRONMENT');
      expect(envVar?.value).toBe('production');
    });

    test('all projects have CloudWatch logging enabled', async () => {
      const command = new BatchGetProjectsCommand({
        names: [testProjectName, stagingProjectName, productionProjectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects?.length).toBe(3);
      response.projects?.forEach((project) => {
        expect(project.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
        expect(project.logsConfig?.cloudWatchLogs?.groupName).toBeDefined();
      });
    });
  });

  describe('SNS Topic', () => {
    test('notification topic exists', async () => {
      // Need to get topic ARN from outputs or construct it
      const topicArn = outputs.NotificationTopicArn ||
        `arn:aws:sns:${process.env.AWS_REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT_ID}:${snsTopicName}`;

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toContain(snsTopicName);
    });

    test('notification topic has display name', async () => {
      const topicArn = outputs.NotificationTopicArn ||
        `arn:aws:sns:${process.env.AWS_REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT_ID}:${snsTopicName}`;

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe('CI/CD Pipeline Notifications');
    });
  });

  describe('CodePipeline', () => {
    test('pipeline exists', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    test('pipeline uses correct artifact bucket', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.artifactStore?.type).toBe('S3');
      expect(response.pipeline?.artifactStore?.location).toContain(
        `pipeline-artifacts-${environmentSuffix}`
      );
    });

    test('pipeline has Source stage with CodeCommit', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Source'
      );
      expect(sourceStage).toBeDefined();

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.name).toBe('CodeCommit_Source');
      expect(sourceAction?.actionTypeId?.category).toBe('Source');
      expect(sourceAction?.actionTypeId?.provider).toBe('CodeCommit');
      expect(sourceAction?.configuration?.BranchName).toBe('main');
    });

    test('pipeline has Build stage', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const buildStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Build'
      );
      expect(buildStage).toBeDefined();

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.name).toBe('Run_Unit_Tests');
      expect(buildAction?.actionTypeId?.category).toBe('Build');
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
    });

    test('pipeline has Deploy_Staging stage', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stagingStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Deploy_Staging'
      );
      expect(stagingStage).toBeDefined();

      const stagingAction = stagingStage?.actions?.[0];
      expect(stagingAction?.name).toBe('Deploy_to_Staging');
    });

    test('pipeline has Manual Approval stage', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const approvalStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Approval'
      );
      expect(approvalStage).toBeDefined();

      const approvalAction = approvalStage?.actions?.[0];
      expect(approvalAction?.name).toBe('Manual_Approval');
      expect(approvalAction?.actionTypeId?.category).toBe('Approval');
      expect(approvalAction?.actionTypeId?.provider).toBe('Manual');
    });

    test('pipeline has Deploy_Production stage', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const productionStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Deploy_Production'
      );
      expect(productionStage).toBeDefined();

      const productionAction = productionStage?.actions?.[0];
      expect(productionAction?.name).toBe('Deploy_to_Production');
    });

    test('pipeline stages are in correct order', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages?.map((s) => s.name);
      expect(stages).toEqual([
        'Source',
        'Build',
        'Deploy_Staging',
        'Approval',
        'Deploy_Production',
      ]);
    });
  });

  describe('EventBridge Rule', () => {
    test('pipeline failure rule exists', async () => {
      const command = new DescribeRuleCommand({ Name: eventRuleName });
      const response = await eventsClient.send(command);

      expect(response.Name).toBe(eventRuleName);
      expect(response.Description).toBe('Notify on pipeline failures');
      expect(response.State).toBe('ENABLED');
    });

    test('rule has correct event pattern', async () => {
      const command = new DescribeRuleCommand({ Name: eventRuleName });
      const response = await eventsClient.send(command);

      const eventPattern = response.EventPattern
        ? JSON.parse(response.EventPattern)
        : null;

      expect(eventPattern).toBeDefined();
      expect(eventPattern.source).toContain('aws.codepipeline');
      expect(eventPattern['detail-type']).toContain(
        'CodePipeline Pipeline Execution State Change'
      );
      expect(eventPattern.detail?.state).toContain('FAILED');
    });

    test('rule targets SNS topic', async () => {
      const command = new ListTargetsByRuleCommand({ Rule: eventRuleName });
      const response = await eventsClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);

      const snsTarget = response.Targets?.find((t) =>
        t.Arn?.includes('sns')
      );
      expect(snsTarget).toBeDefined();
      expect(snsTarget?.Arn).toContain(snsTopicName);
    });
  });

  describe('Stack Outputs', () => {
    test('outputs file contains expected values', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('Warning: cfn-outputs/flat-outputs.json not found - skipping output tests');
        return;
      }

      expect(outputs.RepositoryCloneUrlHttp).toBeDefined();
      expect(outputs.RepositoryCloneUrlHttp).toContain(repositoryName);

      expect(outputs.PipelineName).toBe(pipelineName);

      expect(outputs.ArtifactBucketName).toBe(bucketName);

      expect(outputs.NotificationTopicArn).toBeDefined();
      expect(outputs.NotificationTopicArn).toContain(snsTopicName);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources include environment suffix', async () => {
      // Verify bucket name
      const bucketCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(bucketCommand)).resolves.not.toThrow();
      expect(bucketName).toContain(environmentSuffix);

      // Verify repository name
      const repoCommand = new GetRepositoryCommand({
        repositoryName: repositoryName,
      });
      const repoResponse = await codeCommitClient.send(repoCommand);
      expect(repoResponse.repositoryMetadata?.repositoryName).toContain(
        environmentSuffix
      );

      // Verify pipeline name
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);
      expect(pipelineResponse.pipeline?.name).toContain(environmentSuffix);
    });
  });
});
