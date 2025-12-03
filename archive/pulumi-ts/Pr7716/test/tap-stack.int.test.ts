import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import { S3Client, GetBucketVersioningCommand, GetBucketLifecycleConfigurationCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

const region = process.env.AWS_REGION || 'us-east-1';

describe('TAP Stack Integration Tests', () => {
  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.codeBuildProjectName).toBeDefined();
      expect(outputs.artifactBucketName).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
    });

    it('should have outputs with correct format', () => {
      expect(typeof outputs.codeBuildProjectName).toBe('string');
      expect(typeof outputs.artifactBucketName).toBe('string');
      expect(typeof outputs.snsTopicArn).toBe('string');
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('CodeBuild Project', () => {
    let codeBuildClient: CodeBuildClient;

    beforeAll(() => {
      codeBuildClient = new CodeBuildClient({ region });
    });

    it('should exist with correct configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);

      const project = response.projects![0];
      expect(project.name).toBe(outputs.codeBuildProjectName);
      expect(project.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment?.type).toBe('LINUX_CONTAINER');
      expect(project.timeoutInMinutes).toBe(15);
    });

    it('should have correct artifacts configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.artifacts?.type).toBe('S3');
      expect(project.artifacts?.location).toBe(outputs.artifactBucketName);
      expect(project.artifacts?.packaging).toBe('ZIP');
    });

    it('should have S3 cache configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.cache?.type).toBe('S3');
      expect(project.cache?.location).toContain(outputs.artifactBucketName);
    });

    it('should have CloudWatch Logs enabled', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
    });

    it('should have Node.js 18 environment variable', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      const nodeVersion = project.environment?.environmentVariables?.find(
        (v) => v.name === 'NODE_VERSION'
      );
      expect(nodeVersion).toBeDefined();
      expect(nodeVersion?.value).toBe('18');
    });
  });

  describe('S3 Artifact Bucket', () => {
    let s3Client: S3Client;

    beforeAll(() => {
      s3Client = new S3Client({ region });
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have lifecycle rules configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const expirationRule = response.Rules!.find((r) => r.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule!.Expiration!.Days).toBe(30);
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules!.length
      ).toBeGreaterThan(0);
    });
  });

  describe('SNS Topic', () => {
    let snsClient: SNSClient;

    beforeAll(() => {
      snsClient = new SNSClient({ region });
    });

    it('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    it('should have email subscription', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);

      const emailSubscription = response.Subscriptions!.find(
        (s) => s.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      logsClient = new CloudWatchLogsClient({ region });
    });

    it('should have log group for CodeBuild', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/${outputs.codeBuildProjectName}`,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('EventBridge Rules', () => {
    let eventBridgeClient: EventBridgeClient;

    beforeAll(() => {
      eventBridgeClient = new EventBridgeClient({ region });
    });

    it('should have rule for CodeBuild state changes', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'codebuild-state',
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Rules).toBeDefined();

      const rule = response.Rules!.find((r) =>
        r.Name?.includes(outputs.codeBuildProjectName.replace('nodejs-project-', ''))
      );
      expect(rule).toBeDefined();
    });

    it('should have SNS target configured', async () => {
      const listRulesCommand = new ListRulesCommand({
        NamePrefix: 'codebuild-state',
      });
      const rulesResponse = await eventBridgeClient.send(listRulesCommand);

      const rule = rulesResponse.Rules!.find((r) =>
        r.Name?.includes(outputs.codeBuildProjectName.replace('nodejs-project-', ''))
      );

      if (rule && rule.Name) {
        const listTargetsCommand = new ListTargetsByRuleCommand({
          Rule: rule.Name,
        });

        const targetsResponse = await eventBridgeClient.send(listTargetsCommand);
        expect(targetsResponse.Targets).toBeDefined();
        expect(targetsResponse.Targets!.length).toBeGreaterThan(0);

        const snsTarget = targetsResponse.Targets!.find((t) =>
          t.Arn?.includes('sns')
        );
        expect(snsTarget).toBeDefined();
        expect(snsTarget!.Arn).toBe(outputs.snsTopicArn);
      }
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in all resource names', () => {
      expect(outputs.codeBuildProjectName).toMatch(/synthx7q0t8u1/);
      expect(outputs.artifactBucketName).toMatch(/synthx7q0t8u1/);
      expect(outputs.snsTopicArn).toMatch(/synthx7q0t8u1/);
    });
  });
});
