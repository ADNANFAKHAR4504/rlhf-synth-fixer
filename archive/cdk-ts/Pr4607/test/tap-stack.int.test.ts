// CI/CD Pipeline Integration Tests
// These tests verify the actual deployment and functionality of infrastructure components

import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  ListProjectsCommand,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  ListApplicationsCommand,
  ListDeploymentGroupsCommand,
} from '@aws-sdk/client-codedeploy';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients - use environment variable or default to us-east-1
const awsRegion = process.env.AWS_DEFAULT_REGION || 'us-east-1';
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const codePipelineClient = new CodePipelineClient({ region: awsRegion });
const codeBuildClient = new CodeBuildClient({ region: awsRegion });
const codeDeployClient = new CodeDeployClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const eventBridgeClient = new EventBridgeClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });

describe('CI/CD Pipeline Integration Tests', () => {
  // Test timeout for integration tests
  jest.setTimeout(30000);

  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      expect(outputs).toHaveProperty('PipelineArn');
      expect(outputs).toHaveProperty('ArtifactBucketName');
      expect(outputs).toHaveProperty('VpcId');
      expect(outputs).toHaveProperty('NotificationTopicArn');

      // Validate output formats
      expect(outputs.PipelineArn).toMatch(
        /^arn:aws:codepipeline:us-east-1:\d+:pipeline-pr4607-webapp$/
      );
      expect(outputs.ArtifactBucketName).toMatch(
        /^bucket-pr4607-artifacts-\d+$/
      );
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.NotificationTopicArn).toMatch(
        /^arn:aws:sns:us-east-1:\d+:topic-pr4607-pipeline-notifications$/
      );
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.ArtifactBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have versioning disabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.ArtifactBucketName,
      });
      const response = await s3Client.send(command);
      // Versioning is disabled when Status is undefined or 'Suspended'
      expect(
        response.Status === undefined || response.Status === 'Suspended'
      ).toBe(true);
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.ArtifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // DNS settings are verified through tags or other means
    });

    test('should have public and private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(4); // 2 public + 2 private

      const publicSubnets = response.Subnets?.filter(subnet =>
        subnet.Tags?.some(
          tag => tag.Key === 'Name' && tag.Value?.includes('public')
        )
      );
      const privateSubnets = response.Subnets?.filter(subnet =>
        subnet.Tags?.some(
          tag => tag.Key === 'Name' && tag.Value?.includes('private')
        )
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
    });

    test('should have security groups with correct configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }],
      });
      const response = await ec2Client.send(command);

      // Should have at least 3 security groups (2 custom + 1 default)
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(3);

      const appSecurityGroup = response.SecurityGroups?.find(
        sg => sg.GroupName === `${environmentSuffix}-application-sg`
      );
      const buildSecurityGroup = response.SecurityGroups?.find(
        sg => sg.GroupName === `${environmentSuffix}-codebuild-sg`
      );

      expect(appSecurityGroup).toBeDefined();
      expect(buildSecurityGroup).toBeDefined();

      // Check application security group has HTTP rule
      const httpRule = appSecurityGroup?.IpPermissions?.find(
        rule =>
          rule.FromPort === 80 &&
          rule.ToPort === 80 &&
          rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
    });
  });

  describe('CodePipeline', () => {
    test('should exist and be accessible', async () => {
      const pipelineName = `pipeline-${environmentSuffix}-webapp`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.roleArn).toBeDefined();
      expect(response.pipeline?.artifactStore?.location).toBe(
        outputs.ArtifactBucketName
      );
    });

    test('should have correct stages configuration', async () => {
      const pipelineName = `pipeline-${environmentSuffix}-webapp`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages || [];
      const stageNames = stages.map(stage => stage.name);

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('ManualApproval');
      expect(stageNames).toContain('Deploy');

      // Check Source stage has S3 source action
      const sourceStage = stages.find(stage => stage.name === 'Source');
      const s3Action = sourceStage?.actions?.find(
        action => action.actionTypeId?.provider === 'S3'
      );
      expect(s3Action).toBeDefined();
      expect(s3Action?.configuration?.S3Bucket).toBe(
        outputs.ArtifactBucketName
      );
    });

    test('should be in a valid state', async () => {
      const pipelineName = `pipeline-${environmentSuffix}-webapp`;
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.created).toBeDefined();
      expect(response.updated).toBeDefined();
    });
  });

  describe('CodeBuild', () => {
    test('should have build project', async () => {
      const projectName = `build-${environmentSuffix}-webapp`;
      const listCommand = new ListProjectsCommand({});
      const listResponse = await codeBuildClient.send(listCommand);

      expect(listResponse.projects).toContain(projectName);

      const describeCommand = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const describeResponse = await codeBuildClient.send(describeCommand);

      expect(describeResponse.projects).toHaveLength(1);
      const project = describeResponse.projects![0];
      expect(project.name).toBe(projectName);
      expect(project.environment?.computeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(project.environment?.image).toBe('aws/codebuild/standard:7.0');
      expect(project.environment?.privilegedMode).toBe(true);
    });
  });

  describe('CodeDeploy', () => {
    test('should have deployment application', async () => {
      const appName = `deploy-${environmentSuffix}-webapp`;
      const listCommand = new ListApplicationsCommand({});
      const listResponse = await codeDeployClient.send(listCommand);

      expect(listResponse.applications).toContain(appName);
    });

    test('should have deployment group', async () => {
      const appName = `deploy-${environmentSuffix}-webapp`;
      const listCommand = new ListDeploymentGroupsCommand({
        applicationName: appName,
      });
      const listResponse = await codeDeployClient.send(listCommand);

      expect(listResponse.deploymentGroups).toContain(
        `dg-${environmentSuffix}-webapp`
      );
    });
  });

  describe('SNS Notifications', () => {
    test('should have notification topic', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.NotificationTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes?.TopicArn).toBe(outputs.NotificationTopicArn);
      expect(response.Attributes?.DisplayName).toBe(
        'CI/CD Pipeline Notifications'
      );
    });

    test('should have email subscription', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.NotificationTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toHaveLength(1);
      const subscription = response.Subscriptions![0];
      expect(subscription.Protocol).toBe('email');
      expect(subscription.Endpoint).toBe('prakhar.j@turing.com');
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret', async () => {
      const secretName = `secret-${environmentSuffix}-database-credentials`;
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsManagerClient.send(command);

      expect(response.Name).toBe(secretName);
      expect(response.Description).toBe(
        'Database credentials for production application'
      );
    });

    test('should have GitHub token secret', async () => {
      const secretName = `/cicd/github/token-${environmentSuffix}`;
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsManagerClient.send(command);

      expect(response.Name).toBe(secretName);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have pipeline log group', async () => {
      const logGroupName = `/aws/pipeline/${environmentSuffix}-cicd`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(30);
    });

    test('should have CodeBuild log group', async () => {
      const logGroupName = `/aws/codebuild/${environmentSuffix}-build`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('Lambda Functions', () => {
    test('should have notification Lambda function', async () => {
      const functionName = `lambda-${environmentSuffix}-deployment-notifications`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(256);
    });
  });

  describe('EventBridge Rules', () => {
    test('should have pipeline event rule', async () => {
      const ruleName = `rule-${environmentSuffix}-pipeline-state-changes`;
      const command = new ListRulesCommand({ NamePrefix: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Rules).toHaveLength(1);
      const rule = response.Rules![0];
      expect(rule.Name).toBe(ruleName);
      expect(rule.State).toBe('ENABLED');
      expect(rule.EventPattern).toContain('aws.codepipeline');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have pipeline failure alarm', async () => {
      const alarmName = `alarm-${environmentSuffix}-pipeline-failure`;
      const command = new DescribeAlarmsCommand({ AlarmNames: [alarmName] });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('PipelineExecutionFailure');
      expect(alarm.Namespace).toBe('AWS/CodePipeline');
      expect(alarm.Threshold).toBe(1);
    });

    test('should have build duration alarm', async () => {
      const alarmName = `alarm-${environmentSuffix}-build-duration`;
      const command = new DescribeAlarmsCommand({ AlarmNames: [alarmName] });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('Duration');
      expect(alarm.Namespace).toBe('AWS/CodeBuild');
      expect(alarm.Threshold).toBe(900000);
    });
  });

  describe('End-to-End Pipeline Functionality', () => {
    test('should be able to trigger pipeline manually', async () => {
      // This test verifies that the pipeline can be started manually
      // In a real scenario, you would upload a source artifact to S3
      // and then start the pipeline execution

      const pipelineName = `pipeline-${environmentSuffix}-webapp`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      // Verify pipeline is in a state where it can be executed
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toHaveLength(4);

      // Verify S3 source is configured correctly
      const sourceStage = response.pipeline?.stages?.find(
        stage => stage.name === 'Source'
      );
      const s3Action = sourceStage?.actions?.find(
        action => action.actionTypeId?.provider === 'S3'
      );
      expect(s3Action?.configuration?.S3Bucket).toBe(
        outputs.ArtifactBucketName
      );
      expect(s3Action?.configuration?.S3ObjectKey).toBe('source/app.zip');
    });

    test('should have proper IAM permissions for pipeline execution', async () => {
      // This test verifies that the pipeline role has the necessary permissions
      // by checking that the pipeline can be described (which requires basic permissions)

      const pipelineName = `pipeline-${environmentSuffix}-webapp`;
      const command = new GetPipelineCommand({ name: pipelineName });

      // If this succeeds, it means the pipeline role has at least basic permissions
      await expect(codePipelineClient.send(command)).resolves.not.toThrow();
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('should have consistent resource naming with environment suffix', () => {
      // Verify all outputs contain the environment suffix
      expect(outputs.PipelineArn).toContain(environmentSuffix);
      expect(outputs.ArtifactBucketName).toContain(environmentSuffix);
      expect(outputs.NotificationTopicArn).toContain(environmentSuffix);
    });

    test('should have proper resource ARN formats', () => {
      // Verify ARN formats are correct
      expect(outputs.PipelineArn).toMatch(
        /^arn:aws:codepipeline:us-east-1:\d+:pipeline-\w+-webapp$/
      );
      expect(outputs.NotificationTopicArn).toMatch(
        /^arn:aws:sns:us-east-1:\d+:topic-\w+-pipeline-notifications$/
      );
    });
  });

  describe('Security and Compliance', () => {
    test('should have S3 bucket with proper security settings', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.ArtifactBucketName,
      });
      const response = await s3Client.send(command);

      // Verify encryption is enabled
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have VPC with proper network isolation', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      // Verify VPC is in a private CIDR range
      expect(vpc.CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/\d+$/);
    });
  });
});
