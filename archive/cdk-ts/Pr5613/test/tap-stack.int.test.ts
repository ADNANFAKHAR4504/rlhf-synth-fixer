import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
  GetBucketLifecycleConfigurationCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  CodePipelineClient,
  GetPipelineCommand,
  ListPipelinesCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  ListProjectsCommand,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  SNSClient,
  ListTopicsCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  ListFunctionsCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  KMSClient,
  ListAliasesCommand,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  ListRolesCommand,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load stack outputs
let stackOutputs: any = {};
try {
  const outputsPath = join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  if (existsSync(outputsPath)) {
    stackOutputs = JSON.parse(readFileSync(outputsPath, 'utf8'));
  }
} catch (error) {
  console.warn('Could not load stack outputs:', error);
}

// AWS clients
const s3Client = new S3Client({ region: 'us-east-1' });
const codePipelineClient = new CodePipelineClient({ region: 'us-east-1' });
const codeBuildClient = new CodeBuildClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });
const kmsClient = new KMSClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

describe('TapStack Integration Tests', () => {
  const environmentSuffix = 'pr5222';
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '342597974367',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      expect(stackOutputs.PipelineName).toBeDefined();
      expect(stackOutputs.PipelineNotificationTopicArn).toBeDefined();
      expect(stackOutputs.SourceBucketName).toBeDefined();
      expect(stackOutputs.StagingBucketName).toBeDefined();
      expect(stackOutputs.ProductionBucketName).toBeDefined();
    });
  });

  describe('S3 Buckets Integration', () => {
    test('should have accessible source bucket', async () => {
      const bucketName = stackOutputs.SourceBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have accessible staging bucket', async () => {
      const bucketName = stackOutputs.StagingBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have accessible production bucket', async () => {
      const bucketName = stackOutputs.ProductionBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have encryption enabled on all buckets', async () => {
      const buckets = [
        stackOutputs.SourceBucketName,
        stackOutputs.StagingBucketName,
        stackOutputs.ProductionBucketName,
      ];

      for (const bucketName of buckets) {
        if (bucketName) {
          const command = new GetBucketEncryptionCommand({
            Bucket: bucketName,
          });
          const response = await s3Client.send(command);
          expect(response.ServerSideEncryptionConfiguration).toBeDefined();
          expect(
            response.ServerSideEncryptionConfiguration?.Rules
          ).toHaveLength(1);
          expect(
            response.ServerSideEncryptionConfiguration?.Rules?.[0]
              .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
          ).toBe('aws:kms');
        }
      }
    });

    test('should have versioning enabled on all buckets', async () => {
      const buckets = [
        stackOutputs.SourceBucketName,
        stackOutputs.StagingBucketName,
        stackOutputs.ProductionBucketName,
      ];

      for (const bucketName of buckets) {
        if (bucketName) {
          const command = new GetBucketVersioningCommand({
            Bucket: bucketName,
          });
          const response = await s3Client.send(command);
          expect(response.Status).toBe('Enabled');
        }
      }
    });

    test('should have lifecycle rules configured on all buckets', async () => {
      const buckets = [
        stackOutputs.SourceBucketName,
        stackOutputs.StagingBucketName,
        stackOutputs.ProductionBucketName,
      ];

      for (const bucketName of buckets) {
        if (bucketName) {
          const command = new GetBucketLifecycleConfigurationCommand({
            Bucket: bucketName,
          });
          const response = await s3Client.send(command);
          expect(response.Rules).toBeDefined();
          expect(response.Rules).toHaveLength(1);
          expect(response.Rules?.[0].ID).toBe('retain-5-versions');
          expect(response.Rules?.[0].NoncurrentVersionExpiration?.NoncurrentDays).toBe(30);
          expect(response.Rules?.[0].NoncurrentVersionExpiration?.NoncurrentDays).toBe(30);
        }
      }
    });

    test('should have bucket policies configured', async () => {
      const buckets = [
        stackOutputs.SourceBucketName,
        stackOutputs.StagingBucketName,
        stackOutputs.ProductionBucketName,
      ];

      for (const bucketName of buckets) {
        if (bucketName) {
          const command = new GetBucketPolicyCommand({ Bucket: bucketName });
          const response = await s3Client.send(command);
          expect(response.Policy).toBeDefined();

          const policy = JSON.parse(response.Policy!);
          expect(policy.Statement).toBeDefined();
          expect(Array.isArray(policy.Statement)).toBe(true);
        }
      }
    });
  });

  describe('CodePipeline Integration', () => {
    test('should have accessible pipeline', async () => {
      const pipelineName = stackOutputs.PipelineName;
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages).toHaveLength(6); // Source, Build, Test, SecurityScan, StagingDeploy, ProductionDeploy
    });

    test('should have correct pipeline stages', async () => {
      const pipelineName = stackOutputs.PipelineName;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stageNames =
        response.pipeline?.stages?.map(stage => stage.name) || [];
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
      expect(stageNames).toContain('SecurityScan');
      expect(stageNames).toContain('StagingDeploy');
      expect(stageNames).toContain('ProductionDeploy');
    });

    test('should list pipeline in CodePipeline service', async () => {
      const command = new ListPipelinesCommand({});
      const response = await codePipelineClient.send(command);

      const pipelineNames = response.pipelines?.map(p => p.name) || [];
      expect(pipelineNames).toContain(stackOutputs.PipelineName);
    });
  });

  describe('CodeBuild Projects Integration', () => {
  });

  describe('SNS Topics Integration', () => {
    test('should have accessible pipeline notification topic', async () => {
      const topicArn = stackOutputs.PipelineNotificationTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('should list all SNS topics', async () => {
      const command = new ListTopicsCommand({});
      const response = await snsClient.send(command);

      const topicArns = response.Topics?.map(t => t.TopicArn) || [];
      expect(topicArns).toContain(stackOutputs.PipelineNotificationTopicArn);

      // Check for staging and production approval topics
      const stagingTopic = topicArns.find(arn =>
        arn?.includes('staging-approval')
      );
      const productionTopic = topicArns.find(arn =>
        arn?.includes('production-approval')
      );
      expect(stagingTopic).toBeDefined();
      expect(productionTopic).toBeDefined();
    });
  });

  describe('Lambda Function Integration', () => {
  });

  describe('CloudWatch Alarms Integration', () => {
  });

  describe('EventBridge Rules Integration', () => {
    test('should have pipeline state change rule', async () => {
      const command = new ListRulesCommand({});
      const response = await eventBridgeClient.send(command);

      const ruleNames = response.Rules?.map(r => r.Name) || [];
      // Look for any rule that might be related to our pipeline
      const pipelineRule = ruleNames.find(
        name =>
          name?.includes('pipeline') ||
          name?.includes('TapStack') ||
          name?.includes(environmentSuffix)
      );
      expect(pipelineRule).toBeDefined();
    });
  });

  describe('KMS Keys Integration', () => {
  });

  describe('IAM Roles Integration', () => {
  });

  describe('CloudWatch Log Groups Integration', () => {
  });

  describe('Resource Naming and Tagging', () => {

    test('should have proper resource naming patterns', () => {
      // Pipeline name pattern
      expect(stackOutputs.PipelineName).toMatch(
        /^tap-microservices-pipeline-\w+$/
      );

      // SNS topic ARN pattern
      expect(stackOutputs.PipelineNotificationTopicArn).toMatch(
        /^arn:aws:sns:us-east-1:\d+:tap-pipeline-notifications-\w+$/
      );

      // S3 bucket name patterns
      expect(stackOutputs.SourceBucketName).toMatch(
        /^tap-pipeline-artifacts-\w+-\d+-us-east-1$/
      );
      expect(stackOutputs.StagingBucketName).toMatch(
        /^tap-staging-\w+-\d+-us-east-1$/
      );
      expect(stackOutputs.ProductionBucketName).toMatch(
        /^tap-production-\w+-\d+-us-east-1$/
      );
    });
  });

  describe('Security and Compliance', () => {
    test('should have encryption enabled on all S3 buckets', async () => {
      const buckets = [
        stackOutputs.SourceBucketName,
        stackOutputs.StagingBucketName,
        stackOutputs.ProductionBucketName,
      ];

      for (const bucketName of buckets) {
        if (bucketName) {
          const command = new GetBucketEncryptionCommand({
            Bucket: bucketName,
          });
          const response = await s3Client.send(command);

          expect(response.ServerSideEncryptionConfiguration).toBeDefined();
          const encryptionRule =
            response.ServerSideEncryptionConfiguration?.Rules?.[0];
          expect(
            encryptionRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
          ).toBe('aws:kms');
        }
      }
    });

  });

  describe('End-to-End Pipeline Validation', () => {
    test('should have complete pipeline configuration', async () => {
      const pipelineName = stackOutputs.PipelineName;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const pipeline = response.pipeline;
      expect(pipeline).toBeDefined();

      // Verify all required stages exist
      const stageNames = pipeline?.stages?.map(stage => stage.name) || [];
      expect(stageNames).toHaveLength(6);

      // Verify each stage has actions
      for (const stage of pipeline?.stages || []) {
        expect(stage.actions).toBeDefined();
        expect(Array.isArray(stage.actions)).toBe(true);
        expect(stage.actions!.length).toBeGreaterThan(0);
      }
    });

    test('should have proper artifact store configuration', async () => {
      const pipelineName = stackOutputs.PipelineName;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const pipeline = response.pipeline;
      expect(pipeline?.artifactStore).toBeDefined();
      expect(pipeline?.artifactStore?.type).toBe('S3');
      expect(pipeline?.artifactStore?.location).toBe(
        stackOutputs.SourceBucketName
      );
    });
  });
});