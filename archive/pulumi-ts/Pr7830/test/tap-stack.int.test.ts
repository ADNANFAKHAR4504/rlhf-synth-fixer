import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
    'utf-8'
  )
);

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const codeBuildClient = new CodeBuildClient({ region });
const codePipelineClient = new CodePipelineClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const eventsClient = new EventBridgeClient({ region });
const iamClient = new IAMClient({ region });

describe('TAP Stack Integration Tests', () => {
  describe('S3 Buckets', () => {
    it('should create artifact bucket with versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should create deploy bucket with versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.deployBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should enable encryption for artifact bucket', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    it('should enable encryption for deploy bucket', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.deployBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    it('should configure lifecycle rules for artifact bucket', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      const rule = response.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Expiration?.Days).toBe(30);
    });
  });

  describe('CodeBuild Project', () => {
    it('should create CodeBuild project with correct configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      const project = response.projects?.[0];
      expect(project?.name).toBe(outputs.codeBuildProjectName);
      expect(project?.environment?.image).toBe('aws/codebuild/standard:5.0');
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    it('should configure environment variables', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables || [];
      const nodeEnvVar = envVars.find(v => v.name === 'NODE_ENV');
      expect(nodeEnvVar).toBeDefined();
      expect(nodeEnvVar?.value).toBe('production');
      const buildNumVar = envVars.find(v => v.name === 'BUILD_NUMBER');
      expect(buildNumVar).toBeDefined();
    });

    it('should configure CloudWatch Logs', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];
      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
      expect(project?.logsConfig?.cloudWatchLogs?.groupName).toBe(
        outputs.codeBuildLogGroupName
      );
    });

    it('should have proper IAM role', async () => {
      const command = new GetRoleCommand({
        RoleName: outputs.codeBuildRoleArn.split('/').pop()!,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.codeBuildRoleArn);
    });
  });

  describe('CodePipeline', () => {
    it('should create pipeline with three stages', async () => {
      const command = new GetPipelineCommand({
        name: outputs.codePipelineName,
      });
      const response = await codePipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBe(3);
      const stageNames = response.pipeline?.stages?.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    it('should configure Source stage with S3', async () => {
      const command = new GetPipelineCommand({
        name: outputs.codePipelineName,
      });
      const response = await codePipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.find(
        s => s.name === 'Source'
      );
      expect(sourceStage).toBeDefined();
      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.actionTypeId?.provider).toBe('S3');
      expect(sourceAction?.configuration?.S3Bucket).toBe(
        outputs.artifactBucketName
      );
      expect(sourceAction?.configuration?.S3ObjectKey).toBe('source.zip');
    });

    it('should configure Build stage with CodeBuild', async () => {
      const command = new GetPipelineCommand({
        name: outputs.codePipelineName,
      });
      const response = await codePipelineClient.send(command);
      const buildStage = response.pipeline?.stages?.find(s => s.name === 'Build');
      expect(buildStage).toBeDefined();
      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildAction?.configuration?.ProjectName).toBe(
        outputs.codeBuildProjectName
      );
    });

    it('should configure Deploy stage with S3', async () => {
      const command = new GetPipelineCommand({
        name: outputs.codePipelineName,
      });
      const response = await codePipelineClient.send(command);
      const deployStage = response.pipeline?.stages?.find(
        s => s.name === 'Deploy'
      );
      expect(deployStage).toBeDefined();
      const deployAction = deployStage?.actions?.[0];
      expect(deployAction?.actionTypeId?.provider).toBe('S3');
      expect(deployAction?.configuration?.BucketName).toBe(
        outputs.deployBucketName
      );
    });

    it('should have proper IAM role', async () => {
      const command = new GetRoleCommand({
        RoleName: outputs.codePipelineRoleArn.split('/').pop()!,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.codePipelineRoleArn);
    });
  });

  describe('CloudWatch Logs', () => {
    it('should create CodeBuild log group with 7-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.codeBuildLogGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === outputs.codeBuildLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });

    it('should create build failure log group with 7-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/events/codebuild-failures',
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('synthe9d7g2t8')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('EventBridge Rules', () => {
    it('should create build failure event rule', async () => {
      const ruleName = outputs.eventRuleArn.split('/').pop();
      const command = new DescribeRuleCommand({
        Name: ruleName,
      });
      const response = await eventsClient.send(command);
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.codebuild');
      expect(eventPattern['detail-type']).toContain(
        'CodeBuild Build State Change'
      );
    });

    it('should create S3 trigger event rule', async () => {
      const command = new DescribeRuleCommand({
        Name: `s3-trigger-rule-synthe9d7g2t8`,
      });
      const response = await eventsClient.send(command);
      expect(response.Name).toBe(`s3-trigger-rule-synthe9d7g2t8`);
      expect(response.State).toBe('ENABLED');
      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.s3');
      expect(eventPattern['detail-type']).toContain('Object Created');
    });

    it('should configure targets for build failure rule', async () => {
      const ruleName = outputs.eventRuleArn.split('/').pop();
      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });
      const response = await eventsClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
    });

    it('should configure targets for S3 trigger rule', async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: `s3-trigger-rule-synthe9d7g2t8`,
      });
      const response = await eventsClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
      const target = response.Targets?.[0];
      expect(target?.Arn).toContain('codepipeline');
    });
  });

  describe('Resource Tagging', () => {
    it('should tag S3 buckets', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];
      expect(project?.tags).toBeDefined();
      const envTag = project?.tags?.find(t => t.key === 'Environment');
      expect(envTag?.value).toBe('production');
      const managedByTag = project?.tags?.find(t => t.key === 'ManagedBy');
      expect(managedByTag?.value).toBe('pulumi');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', () => {
      const environmentSuffix = 'synthe9d7g2t8';
      expect(outputs.artifactBucketName).toContain(environmentSuffix);
      expect(outputs.deployBucketName).toContain(environmentSuffix);
      expect(outputs.codeBuildProjectName).toContain(environmentSuffix);
      expect(outputs.codePipelineName).toContain(environmentSuffix);
      expect(outputs.codeBuildLogGroupName).toContain(environmentSuffix);
      expect(outputs.codeBuildRoleArn).toContain(environmentSuffix);
      expect(outputs.codePipelineRoleArn).toContain(environmentSuffix);
      expect(outputs.eventRuleArn).toContain(environmentSuffix);
    });
  });
});
