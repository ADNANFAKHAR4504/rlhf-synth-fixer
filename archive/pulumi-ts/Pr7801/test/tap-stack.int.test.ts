/**
 * Integration tests for CI/CD Pipeline Infrastructure
 *
 * These tests validate the actual AWS resources created by the stack.
 * They verify CodeCommit, CodeBuild, S3, IAM, CloudWatch, and SNS configurations.
 */

import {
  CodeCommitClient,
  GetRepositoryCommand,
  ListRepositoriesCommand,
} from '@aws-sdk/client-codecommit';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
  ListProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';

describe('CI/CD Pipeline Infrastructure - Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  const codeCommitClient = new CodeCommitClient({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const s3Client = new S3Client({ region });
  const iamClient = new IAMClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });
  const snsClient = new SNSClient({ region });
  const eventBridgeClient = new EventBridgeClient({ region });

  const repositoryName = `pulumi-infra-validation-${environmentSuffix}`;
  const buildProjectName = `pulumi-validation-${environmentSuffix}`;
  const bucketName = `pulumi-infra-artifacts-${environmentSuffix}`;
  const logGroupName = `/aws/codebuild/pulumi-validation-${environmentSuffix}`;
  const topicName = `pulumi-build-notifications-${environmentSuffix}`;
  const codeBuildRoleName = `pulumi-codebuild-role-${environmentSuffix}`;
  const eventBridgeRoleName = `pulumi-eventbridge-role-${environmentSuffix}`;
  const eventRuleName = `pulumi-codecommit-trigger-${environmentSuffix}`;

  describe('CodeCommit Repository', () => {
    let repositoryArn: string;

    it('should create the repository successfully', async () => {
      const command = new GetRepositoryCommand({
        repositoryName: repositoryName,
      });
      const response = await codeCommitClient.send(command);

      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repositoryName);
      expect(response.repositoryMetadata?.repositoryDescription).toContain(
        'infrastructure code'
      );

      repositoryArn = response.repositoryMetadata?.Arn || '';
      expect(repositoryArn).toBeTruthy();
    }, 30000);

    it('should have both HTTP and SSH clone URLs', async () => {
      const command = new GetRepositoryCommand({
        repositoryName: repositoryName,
      });
      const response = await codeCommitClient.send(command);

      expect(response.repositoryMetadata?.cloneUrlHttp).toBeTruthy();
      expect(response.repositoryMetadata?.cloneUrlSsh).toBeTruthy();
      expect(response.repositoryMetadata?.cloneUrlHttp).toContain('https://');
      expect(response.repositoryMetadata?.cloneUrlSsh).toContain('ssh://');
    }, 30000);

    it('should be included in repository list', async () => {
      const command = new ListRepositoriesCommand({});
      const response = await codeCommitClient.send(command);

      const repoExists = response.repositories?.some(
        (repo) => repo.repositoryName === repositoryName
      );
      expect(repoExists).toBe(true);
    }, 30000);
  });

  describe('S3 Artifacts Bucket', () => {
    it('should create the bucket successfully', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    }, 30000);

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    }, 30000);

    it('should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    }, 30000);
  });

  describe('SNS Notification Topic', () => {
    let topicArn: string;

    it('should create the SNS topic successfully', async () => {
      const listCommand = new ListTopicsCommand({});
      const listResponse = await snsClient.send(listCommand);

      const topic = listResponse.Topics?.find((t) =>
        t.TopicArn?.includes(topicName)
      );
      expect(topic).toBeDefined();
      topicArn = topic?.TopicArn || '';
      expect(topicArn).toBeTruthy();
    }, 30000);

    it('should have correct display name', async () => {
      const listCommand = new ListTopicsCommand({});
      const listResponse = await snsClient.send(listCommand);
      const topic = listResponse.Topics?.find((t) =>
        t.TopicArn?.includes(topicName)
      );

      if (topic?.TopicArn) {
        const command = new GetTopicAttributesCommand({
          TopicArn: topic.TopicArn,
        });
        const response = await snsClient.send(command);

        expect(response.Attributes?.DisplayName).toContain('Build');
        expect(response.Attributes?.DisplayName).toContain('Notification');
      }
    }, 30000);
  });

  describe('CloudWatch Log Group', () => {
    it('should create the log group successfully', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(logGroupName);
    }, 30000);

    it('should have 7-day retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup?.retentionInDays).toBe(7);
    }, 30000);
  });

  describe('IAM Roles and Policies', () => {
    describe('CodeBuild Role', () => {
      it('should create the CodeBuild IAM role', async () => {
        const command = new GetRoleCommand({ RoleName: codeBuildRoleName });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role?.RoleName).toBe(codeBuildRoleName);
      }, 30000);

      it('should have correct assume role policy', async () => {
        const command = new GetRoleCommand({ RoleName: codeBuildRoleName });
        const response = await iamClient.send(command);

        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
        );
        expect(assumeRolePolicy.Statement).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Principal: expect.objectContaining({
                Service: 'codebuild.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ])
        );
      }, 30000);

      it('should have least-privilege inline policy', async () => {
        const command = new GetRolePolicyCommand({
          RoleName: codeBuildRoleName,
          PolicyName: `codebuild-policy-${environmentSuffix}`,
        });
        const response = await iamClient.send(command);

        const policy = JSON.parse(
          decodeURIComponent(response.PolicyDocument || '{}')
        );
        expect(policy.Statement).toBeDefined();
        expect(policy.Statement.length).toBeGreaterThan(0);

        // Verify CloudWatch Logs permissions
        const logsStatement = policy.Statement.find((s: any) =>
          s.Action.some((a: string) => a.includes('logs:'))
        );
        expect(logsStatement).toBeDefined();

        // Verify S3 permissions
        const s3Statement = policy.Statement.find((s: any) =>
          s.Action.some((a: string) => a.includes('s3:'))
        );
        expect(s3Statement).toBeDefined();

        // Verify CodeCommit permissions
        const codecommitStatement = policy.Statement.find((s: any) =>
          s.Action.some((a: string) => a.includes('codecommit:'))
        );
        expect(codecommitStatement).toBeDefined();

        // Verify SNS permissions
        const snsStatement = policy.Statement.find((s: any) =>
          s.Action.some((a: string) => a.includes('sns:'))
        );
        expect(snsStatement).toBeDefined();
      }, 30000);
    });

    describe('EventBridge Role', () => {
      it('should create the EventBridge IAM role', async () => {
        const command = new GetRoleCommand({ RoleName: eventBridgeRoleName });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role?.RoleName).toBe(eventBridgeRoleName);
      }, 30000);

      it('should have correct assume role policy for events service', async () => {
        const command = new GetRoleCommand({ RoleName: eventBridgeRoleName });
        const response = await iamClient.send(command);

        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
        );
        expect(assumeRolePolicy.Statement).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Principal: expect.objectContaining({
                Service: 'events.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ])
        );
      }, 30000);
    });
  });

  describe('CodeBuild Project', () => {
    it('should create the build project successfully', async () => {
      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0].name).toBe(buildProjectName);
    }, 30000);

    it('should use Pulumi Docker image', async () => {
      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects?.[0].environment?.image).toContain('pulumi');
    }, 30000);

    it('should have correct environment variables', async () => {
      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);

      const envVars = response.projects?.[0].environment?.environmentVariables;
      expect(envVars).toBeDefined();

      const varNames = envVars?.map((v) => v.name) || [];
      expect(varNames).toContain('PULUMI_ACCESS_TOKEN');
      expect(varNames).toContain('PULUMI_STACK');
      expect(varNames).toContain('AWS_REGION');
      expect(varNames).toContain('SNS_TOPIC_ARN');
    }, 30000);

    it('should use CodeCommit as source', async () => {
      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects?.[0].source?.type).toBe('CODECOMMIT');
      expect(response.projects?.[0].source?.location).toContain(repositoryName);
    }, 30000);

    it('should output artifacts to S3', async () => {
      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects?.[0].artifacts?.type).toBe('S3');
      expect(response.projects?.[0].artifacts?.location).toBe(bucketName);
    }, 30000);

    it('should use CloudWatch Logs', async () => {
      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);

      expect(
        response.projects?.[0].logsConfig?.cloudWatchLogs?.status
      ).toBe('ENABLED');
      expect(
        response.projects?.[0].logsConfig?.cloudWatchLogs?.groupName
      ).toBe(logGroupName);
    }, 30000);

    it('should have proper tags', async () => {
      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);

      const tags = response.projects?.[0].tags;
      expect(tags).toBeDefined();

      const tagObj = tags?.reduce((acc: any, tag) => {
        if (tag.key) acc[tag.key] = tag.value;
        return acc;
      }, {});

      expect(tagObj?.Environment).toBe('CI');
      expect(tagObj?.Project).toBe('InfraValidation');
    }, 30000);
  });

  describe('EventBridge Rule and Trigger', () => {
    it('should create the EventBridge rule', async () => {
      const command = new DescribeRuleCommand({ Name: eventRuleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(eventRuleName);
      expect(response.State).toBe('ENABLED');
    }, 30000);

    it('should have correct event pattern for CodeCommit', async () => {
      const command = new DescribeRuleCommand({ Name: eventRuleName });
      const response = await eventBridgeClient.send(command);

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.codecommit');
      expect(eventPattern['detail-type']).toContain(
        'CodeCommit Repository State Change'
      );
      expect(eventPattern.detail.repositoryName).toContain(repositoryName);
    }, 30000);
  });

  describe('End-to-End Validation', () => {
    it('should have all components properly connected', async () => {
      // Verify repository exists
      const repoCommand = new GetRepositoryCommand({
        repositoryName: repositoryName,
      });
      const repoResponse = await codeCommitClient.send(repoCommand);
      expect(repoResponse.repositoryMetadata).toBeDefined();

      // Verify build project exists
      const buildCommand = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const buildResponse = await codeBuildClient.send(buildCommand);
      expect(buildResponse.projects?.length).toBe(1);

      // Verify S3 bucket exists
      const s3Command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(s3Command)).resolves.not.toThrow();

      // Verify log group exists
      const logCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logResponse = await logsClient.send(logCommand);
      expect(logResponse.logGroups?.length).toBeGreaterThan(0);

      // Verify SNS topic exists
      const snsCommand = new ListTopicsCommand({});
      const snsResponse = await snsClient.send(snsCommand);
      const topicExists = snsResponse.Topics?.some((t) =>
        t.TopicArn?.includes(topicName)
      );
      expect(topicExists).toBe(true);

      // Verify EventBridge rule exists
      const ruleCommand = new DescribeRuleCommand({ Name: eventRuleName });
      const ruleResponse = await eventBridgeClient.send(ruleCommand);
      expect(ruleResponse.State).toBe('ENABLED');
    }, 30000);
  });
});
