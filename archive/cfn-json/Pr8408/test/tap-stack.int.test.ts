import fs from 'fs';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import { S3Client, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';

const codebuildClient = new CodeBuildClient({ region });
const codepipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const snsClient = new SNSClient({ region });
const eventbridgeClient = new EventBridgeClient({ region });

describe('CI/CD Pipeline Integration Tests', () => {
  describe('CodeCommit Repository', () => {
  });

  describe('CodeBuild Project', () => {
    test('should have build project created', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });

      const response = await codebuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0].name).toBe(outputs.BuildProjectName);
    });

    test('should have correct artifact configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.artifacts?.type).toBe('CODEPIPELINE');
    });

    test('should have correct environment configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.environment).toBeDefined();
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBeDefined();
      expect(project?.environment?.image).toBeDefined();
    });

    test('should have CloudWatch Logs configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
      expect(project?.logsConfig?.cloudWatchLogs?.groupName).toBe(
        outputs.BuildLogGroupName
      );
    });

    test('should have service role configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.serviceRole).toBeDefined();
      expect(project?.serviceRole).toMatch(/^arn:aws:iam::/);
      expect(project?.serviceRole).toContain('codebuild-service-role');
    });

    test('should have buildspec defined', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.source?.buildspec).toBeDefined();
      expect(typeof project?.source?.buildspec).toBe('string');
      expect(project?.source?.buildspec).toContain('version: 0.2');
    });

    test('should have environment variables configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.environment?.environmentVariables).toBeDefined();
      expect(Array.isArray(project?.environment?.environmentVariables)).toBe(
        true
      );

      const artifactBucketVar = project?.environment?.environmentVariables?.find(
        v => v.name === 'ARTIFACT_BUCKET'
      );
      expect(artifactBucketVar).toBeDefined();
      expect(artifactBucketVar?.value).toBe(outputs.ArtifactBucketName);
    });
  });

  describe('CodePipeline', () => {
    test('should have pipeline created', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codepipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(outputs.PipelineName);
    });

    test('should have correct artifact store configuration', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codepipelineClient.send(command);

      expect(response.pipeline?.artifactStore).toBeDefined();
      expect(response.pipeline?.artifactStore?.type).toBe('S3');
      expect(response.pipeline?.artifactStore?.location).toBe(
        outputs.ArtifactBucketName
      );
    });

    test('should have Source stage with CodeCommit', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codepipelineClient.send(command);
      const stages = response.pipeline?.stages;

      expect(stages).toBeDefined();
      expect(Array.isArray(stages)).toBe(true);

      const sourceStage = stages?.find(s => s.name === 'Source');
      expect(sourceStage).toBeDefined();

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.actionTypeId?.category).toBe('Source');
      expect(sourceAction?.actionTypeId?.owner).toBe('AWS');
      expect(sourceAction?.actionTypeId?.provider).toBe('CodeCommit');
      expect(sourceAction?.configuration?.BranchName).toBe('main');
    });

    test('should have Build stage with CodeBuild', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codepipelineClient.send(command);
      const stages = response.pipeline?.stages;

      const buildStage = stages?.find(s => s.name === 'Build');
      expect(buildStage).toBeDefined();

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.actionTypeId?.category).toBe('Build');
      expect(buildAction?.actionTypeId?.owner).toBe('AWS');
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildAction?.configuration?.ProjectName).toBe(
        outputs.BuildProjectName
      );
    });

    test('should have pipeline role ARN configured', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codepipelineClient.send(command);

      expect(response.pipeline?.roleArn).toBeDefined();
      expect(response.pipeline?.roleArn).toMatch(/^arn:aws:iam::/);
      expect(response.pipeline?.roleArn).toContain('codepipeline-service-role');
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('should have artifact bucket created', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.ArtifactBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('should have bucket encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.ArtifactBucketName,
      });

      const response = await s3Client.send(command);

      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.length
      ).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(
        rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.ArtifactBucketName,
      });

      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        response.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('should have bucket name matching output', async () => {
      expect(outputs.ArtifactBucketName).toBeDefined();
      expect(outputs.ArtifactBucketName).toContain('cicd-artifacts');
      expect(outputs.ArtifactBucketName).toMatch(/^cicd-artifacts-[a-zA-Z0-9-]+$/);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have build log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.BuildLogGroupName,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === outputs.BuildLogGroupName
      );
      expect(logGroup).toBeDefined();
    });

    test('should have log group with proper ARN format', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.BuildLogGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === outputs.BuildLogGroupName
      );

      expect(logGroup?.arn).toBeDefined();
      expect(logGroup?.arn).toMatch(/^arn:aws:logs:/);
      expect(logGroup?.arn).toContain(region);
    });

    test('should have log group name matching output', async () => {
      expect(outputs.BuildLogGroupName).toBeDefined();
      expect(outputs.BuildLogGroupName).toContain('/aws/codebuild/');
      expect(outputs.BuildLogGroupName).toContain('education-build');
    });
  });

  describe('SNS Notification Topic', () => {
    test('should have notification topic created', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.NotificationTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(
        outputs.NotificationTopicArn
      );
    });

    test('should have topic with display name', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.NotificationTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes?.DisplayName).toBeDefined();
      expect(typeof response.Attributes?.DisplayName).toBe('string');
      expect(response.Attributes?.DisplayName.length).toBeGreaterThan(0);
    });

    test('should have topic ARN with proper format', async () => {
      expect(outputs.NotificationTopicArn).toBeDefined();
      expect(outputs.NotificationTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.NotificationTopicArn).toContain(region);
      expect(outputs.NotificationTopicArn).toContain('pipeline-notifications');
    });

    test('should have topic policy configured', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.NotificationTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes?.Policy).toBeDefined();
      const policy = JSON.parse(response.Attributes?.Policy || '{}');
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
    });
  });

  describe('EventBridge Rule', () => {
    test('should have pipeline event rule created', async () => {
      const ruleName = `pipeline-event-rule-${outputs.PipelineName.replace('education-pipeline-', '')}`;

      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventbridgeClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });

    test('should have correct event pattern for CodePipeline', async () => {
      const ruleName = `pipeline-event-rule-${outputs.PipelineName.replace('education-pipeline-', '')}`;

      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventbridgeClient.send(command);

      expect(response.EventPattern).toBeDefined();
      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.codepipeline');
      expect(eventPattern['detail-type']).toContain(
        'CodePipeline Pipeline Execution State Change'
      );
    });

    test('should target SNS notification topic', async () => {
      const ruleName = `pipeline-event-rule-${outputs.PipelineName.replace('education-pipeline-', '')}`;

      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });

      const response = await eventbridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(Array.isArray(response.Targets)).toBe(true);
      expect(response.Targets?.length).toBeGreaterThan(0);

      const snsTarget = response.Targets?.find(
        t => t.Arn === outputs.NotificationTopicArn
      );
      expect(snsTarget).toBeDefined();
    });

    test('should have rule ARN with proper format', async () => {
      const ruleName = `pipeline-event-rule-${outputs.PipelineName.replace('education-pipeline-', '')}`;

      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventbridgeClient.send(command);

      expect(response.Arn).toBeDefined();
      expect(response.Arn).toMatch(/^arn:aws:events:/);
      expect(response.Arn).toContain(region);
    });
  });

  describe('End-to-End Resource Integration', () => {
    test('pipeline should reference correct CodeCommit repository', async () => {
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.PipelineName,
      });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);

      const sourceStage = pipelineResponse.pipeline?.stages?.find(
        s => s.name === 'Source'
      );
      const sourceAction = sourceStage?.actions?.[0];
      const repoName = sourceAction?.configuration?.RepositoryName;

      const repositoryName = outputs.RepositoryCloneUrlHttp.split('/').pop();
      expect(repoName).toBe(repositoryName);
    });

    test('pipeline should reference correct CodeBuild project', async () => {
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.PipelineName,
      });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);

      const buildStage = pipelineResponse.pipeline?.stages?.find(
        s => s.name === 'Build'
      );
      const buildAction = buildStage?.actions?.[0];
      const projectName = buildAction?.configuration?.ProjectName;

      expect(projectName).toBe(outputs.BuildProjectName);
    });

    test('pipeline should reference correct S3 artifact bucket', async () => {
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.PipelineName,
      });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);

      const artifactLocation =
        pipelineResponse.pipeline?.artifactStore?.location;
      expect(artifactLocation).toBe(outputs.ArtifactBucketName);
    });

    test('CodeBuild project should reference correct log group', async () => {
      const buildCommand = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });
      const buildResponse = await codebuildClient.send(buildCommand);

      const logGroupName =
        buildResponse.projects?.[0]?.logsConfig?.cloudWatchLogs?.groupName;
      expect(logGroupName).toBe(outputs.BuildLogGroupName);
    });

    test('CodeBuild project should reference correct artifact bucket', async () => {
      const buildCommand = new BatchGetProjectsCommand({
        names: [outputs.BuildProjectName],
      });
      const buildResponse = await codebuildClient.send(buildCommand);

      const envVars =
        buildResponse.projects?.[0]?.environment?.environmentVariables;
      const artifactBucketVar = envVars?.find(
        v => v.name === 'ARTIFACT_BUCKET'
      );

      expect(artifactBucketVar?.value).toBe(outputs.ArtifactBucketName);
    });

    test('EventBridge rule should reference correct pipeline', async () => {
      const ruleName = `pipeline-event-rule-${outputs.PipelineName.replace('education-pipeline-', '')}`;

      const command = new DescribeRuleCommand({
        Name: ruleName,
      });
      const response = await eventbridgeClient.send(command);

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.detail?.pipeline).toContain(outputs.PipelineName);
    });
  });

  describe('Output Validation', () => {
    test('all required outputs should be present', () => {
      const requiredOutputs = [
        'BuildProjectName',
        'ArtifactBucketName',
        'PipelineName',
        'BuildLogGroupName',
        'RepositoryCloneUrlSsh',
        'RepositoryCloneUrlHttp',
        'NotificationTopicArn',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(typeof outputs[output]).toBe('string');
        expect(outputs[output].length).toBeGreaterThan(0);
      });
    });
  });
});
