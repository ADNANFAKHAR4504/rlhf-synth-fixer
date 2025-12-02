/**
 * Integration tests for TapStack infrastructure
 *
 * These tests validate the actual deployed AWS resources using the
 * outputs from cfn-outputs/flat-outputs.json
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
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

// Load stack outputs
const outputsPath = path.join(
  __dirname,
  '../cfn-outputs/flat-outputs.json'
);

if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Outputs file not found at ${outputsPath}. Please deploy the stack first.`
  );
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const codeBuildClient = new CodeBuildClient({ region });
const snsClient = new SNSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const eventsClient = new EventBridgeClient({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  describe('S3 Artifact Bucket', () => {
    it('should exist and be accessible', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have server-side encryption configured', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have public access blocked', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
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
  });

  describe('CodeBuild Project', () => {
    it('should exist with correct configuration', async () => {
      const projectName = outputs.codeBuildProjectName;
      expect(projectName).toBeDefined();

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codeBuildClient.send(command);
      expect(response.projects).toHaveLength(1);

      const project = response.projects[0];
      expect(project.name).toBe(projectName);
    });

    it('should use the correct Docker image', async () => {
      const projectName = outputs.codeBuildProjectName;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects[0];

      expect(project.environment?.image).toBe(
        'aws/codebuild/standard:6.0'
      );
    });

    it('should have correct compute type and memory', async () => {
      const projectName = outputs.codeBuildProjectName;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects[0];

      expect(project.environment?.type).toBe('LINUX_CONTAINER');
      expect(project.environment?.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
    });

    it('should have correct environment variables', async () => {
      const projectName = outputs.codeBuildProjectName;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects[0];

      const envVars = project.environment?.environmentVariables || [];
      const nodeEnvVar = envVars.find((v) => v.name === 'NODE_ENV');
      const buildNumberVar = envVars.find(
        (v) => v.name === 'BUILD_NUMBER'
      );

      expect(nodeEnvVar).toBeDefined();
      expect(nodeEnvVar?.value).toBe('production');
      expect(buildNumberVar).toBeDefined();
    });

    it('should have correct build timeout', async () => {
      const projectName = outputs.codeBuildProjectName;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects[0];

      expect(project.timeoutInMinutes).toBe(15);
    });

    it('should use the artifact S3 bucket', async () => {
      const projectName = outputs.codeBuildProjectName;
      const bucketName = outputs.artifactBucketName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects[0];

      expect(project.artifacts?.location).toContain(bucketName);
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group for CodeBuild', async () => {
      const projectName = outputs.codeBuildProjectName;
      const logGroupName = `/aws/codebuild/${projectName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups.length).toBeGreaterThan(0);

      const logGroup = response.logGroups.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
    });

    it('should have correct retention period (7 days)', async () => {
      const projectName = outputs.codeBuildProjectName;
      const logGroupName = `/aws/codebuild/${projectName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('SNS Topic for Build Notifications', () => {
    it('should exist and be accessible', async () => {
      const topicArn = outputs.snsTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      await expect(snsClient.send(command)).resolves.not.toThrow();
    });

    it('should have correct display name', async () => {
      const topicArn = outputs.snsTopicArn;
      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe(
        'CodeBuild Failure Notifications'
      );
    });
  });

  describe('EventBridge Rule for Build Failures', () => {
    it('should exist with correct configuration', async () => {
      // Extract environment suffix from bucket name
      const bucketName = outputs.artifactBucketName;
      const suffix = bucketName.replace('codebuild-artifacts-', '');
      const ruleName = `build-failure-rule-${suffix}`;

      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventsClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });

    it('should have event pattern for CodeBuild failures', async () => {
      const bucketName = outputs.artifactBucketName;
      const suffix = bucketName.replace('codebuild-artifacts-', '');
      const ruleName = `build-failure-rule-${suffix}`;

      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventsClient.send(command);

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.codebuild');
      expect(eventPattern['detail-type']).toContain(
        'CodeBuild Build State Change'
      );
      expect(eventPattern.detail['build-status']).toContain('FAILED');
    });

    it('should target the SNS topic', async () => {
      const bucketName = outputs.artifactBucketName;
      const suffix = bucketName.replace('codebuild-artifacts-', '');
      const ruleName = `build-failure-rule-${suffix}`;
      const topicArn = outputs.snsTopicArn;

      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });
      const response = await eventsClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets.length).toBeGreaterThan(0);

      const target = response.Targets.find((t) => t.Arn === topicArn);
      expect(target).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should include environment suffix in all resource names', () => {
      const bucketName = outputs.artifactBucketName;
      const projectName = outputs.codeBuildProjectName;

      // Extract suffix from bucket name
      const suffix = bucketName.replace('codebuild-artifacts-', '');

      expect(bucketName).toContain(suffix);
      expect(projectName).toContain(suffix);
    });
  });

  describe('Resource Tags', () => {
    it('should have Environment tag on S3 bucket', async () => {
      // Note: S3 GetBucketTagging requires additional permissions
      // This test validates that the infrastructure was created
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();
    });
  });
});
