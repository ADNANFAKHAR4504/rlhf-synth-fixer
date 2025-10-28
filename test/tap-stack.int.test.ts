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

    test('should have correct pipeline name format', () => {
      expect(stackOutputs.PipelineName).toMatch(
        /^tap-microservices-pipeline-pr5222$/
      );
    });

    test('should have correct SNS topic ARN format', () => {
      expect(stackOutputs.PipelineNotificationTopicArn).toMatch(
        /^arn:aws:sns:us-east-1:342597974367:tap-pipeline-notifications-pr5222$/
      );
    });

    test('should have correct S3 bucket name formats', () => {
      expect(stackOutputs.SourceBucketName).toMatch(
        /^tap-pipeline-artifacts-pr5222-\d+-us-east-1$/
      );
      expect(stackOutputs.StagingBucketName).toMatch(
        /^tap-staging-pr5222-\d+-us-east-1$/
      );
      expect(stackOutputs.ProductionBucketName).toMatch(
        /^tap-production-pr5222-\d+-us-east-1$/
      );
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
    test('should have all CodeBuild projects', async () => {
      const command = new ListProjectsCommand({});
      const response = await codeBuildClient.send(command);

      const projectNames = response.projects || [];
      expect(projectNames).toContain(`tap-build-${environmentSuffix}`);
      expect(projectNames).toContain(`tap-unit-test-${environmentSuffix}`);
      expect(projectNames).toContain(
        `tap-integration-test-${environmentSuffix}`
      );
      expect(projectNames).toContain(`tap-security-scan-${environmentSuffix}`);
    });

    test('should have accessible build project', async () => {
      const projectName = `tap-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toHaveLength(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
      expect(response.projects?.[0]?.serviceRole).toBeDefined();
      expect(response.projects?.[0]?.artifacts?.type).toBe('CODEPIPELINE');
    });

    test('should have accessible unit test project', async () => {
      const projectName = `tap-unit-test-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toHaveLength(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
      expect(response.projects?.[0]?.environment?.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
    });

    test('should have accessible integration test project', async () => {
      const projectName = `tap-integration-test-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toHaveLength(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
      expect(response.projects?.[0]?.environment?.image).toBe(
        'aws/codebuild/standard:7.0'
      );
    });

    test('should have accessible security scan project', async () => {
      const projectName = `tap-security-scan-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toHaveLength(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
      expect(response.projects?.[0]?.environment?.image).toBe(
        'aws/codebuild/standard:7.0'
      );
    });
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
    test('should have accessible security scan Lambda function', async () => {
      const functionName = `tap-security-scan-analysis-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(300); // 5 minutes
    });

    test('should list Lambda function in service', async () => {
      // Get all functions with pagination
      let allFunctions: any[] = [];
      let marker: string | undefined;
      
      do {
        const command = new ListFunctionsCommand({ Marker: marker });
        const response = await lambdaClient.send(command);
        allFunctions = allFunctions.concat(response.Functions || []);
        marker = response.NextMarker;
      } while (marker);

      const functionNames = allFunctions.map(f => f.FunctionName) || [];
      expect(functionNames).toContain(
        `tap-security-scan-analysis-${environmentSuffix}`
      );
    });
  });

  describe('CloudWatch Alarms Integration', () => {
    test('should have pipeline failure alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`tap-pipeline-failure-${environmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0]?.AlarmName).toBe(
        `tap-pipeline-failure-${environmentSuffix}`
      );
      expect(response.MetricAlarms?.[0]?.MetricName).toBe(
        'PipelineExecutionFailed'
      );
      expect(response.MetricAlarms?.[0]?.Namespace).toBe('AWS/CodePipeline');
    });

    test('should have pipeline stuck alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`tap-pipeline-stuck-${environmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0]?.AlarmName).toBe(
        `tap-pipeline-stuck-${environmentSuffix}`
      );
      expect(response.MetricAlarms?.[0]?.MetricName).toBe(
        'PipelineExecutionDuration'
      );
      expect(response.MetricAlarms?.[0]?.Namespace).toBe('AWS/CodePipeline');
    });
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
    test('should have KMS aliases for all environments', async () => {
      // Test each alias individually since ListAliases might be paginated
      const aliases = [
        `alias/tap-pipeline-key-${environmentSuffix}`,
        `alias/tap-staging-key-${environmentSuffix}`,
        `alias/tap-production-key-${environmentSuffix}`,
      ];

      for (const aliasName of aliases) {
        const command = new DescribeKeyCommand({ KeyId: aliasName });
        const response = await kmsClient.send(command);

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata?.KeyId).toBeDefined();
        expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      }
    });

    test('should have accessible KMS keys', async () => {
      const aliases = [
        `alias/tap-pipeline-key-${environmentSuffix}`,
        `alias/tap-staging-key-${environmentSuffix}`,
        `alias/tap-production-key-${environmentSuffix}`,
      ];

      for (const aliasName of aliases) {
        const command = new DescribeKeyCommand({ KeyId: aliasName });
        const response = await kmsClient.send(command);

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata?.KeyId).toBeDefined();
        expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      }
    });
  });

  describe('IAM Roles Integration', () => {
    test('should have CodeBuild role', async () => {
      // Get all roles with pagination
      let allRoles: any[] = [];
      let marker: string | undefined;
      
      do {
        const listCommand = new ListRolesCommand({ Marker: marker });
        const listResponse = await iamClient.send(listCommand);
        allRoles = allRoles.concat(listResponse.Roles || []);
        marker = listResponse.Marker;
      } while (marker);

      const codeBuildRole = allRoles.find(role => 
        role.RoleName?.startsWith(`TapStack${environmentSuffix}-CodeBuildRole`)
      );
      
      expect(codeBuildRole).toBeDefined();
      expect(codeBuildRole?.RoleName).toContain(`TapStack${environmentSuffix}-CodeBuildRole`);
      expect(codeBuildRole?.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have CodePipeline role', async () => {
      // Get all roles with pagination
      let allRoles: any[] = [];
      let marker: string | undefined;
      
      do {
        const listCommand = new ListRolesCommand({ Marker: marker });
        const listResponse = await iamClient.send(listCommand);
        allRoles = allRoles.concat(listResponse.Roles || []);
        marker = listResponse.Marker;
      } while (marker);

      const codePipelineRole = allRoles.find(role => 
        role.RoleName?.startsWith(`TapStack${environmentSuffix}-CodePipelineRole`)
      );
      
      expect(codePipelineRole).toBeDefined();
      expect(codePipelineRole?.RoleName).toContain(`TapStack${environmentSuffix}-CodePipelineRole`);
      expect(codePipelineRole?.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have Lambda execution role', async () => {
      // Get all roles with pagination
      let allRoles: any[] = [];
      let marker: string | undefined;
      
      do {
        const listCommand = new ListRolesCommand({ Marker: marker });
        const listResponse = await iamClient.send(listCommand);
        allRoles = allRoles.concat(listResponse.Roles || []);
        marker = listResponse.Marker;
      } while (marker);

      const lambdaRole = allRoles.find(role => 
        role.RoleName?.startsWith(`TapStack${environmentSuffix}-SecurityScanLambdaRole`)
      );
      
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole?.RoleName).toContain(`TapStack${environmentSuffix}-SecurityScanLambdaRole`);
      expect(lambdaRole?.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups Integration', () => {
    test('should have log groups for all services', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/tap-`,
      });
      const response = await cloudWatchLogsClient.send(command);

      const logGroupNames =
        response.logGroups?.map(lg => lg.logGroupName) || [];
      expect(logGroupNames).toContain(
        `/aws/codebuild/tap-build-${environmentSuffix}`
      );
      expect(logGroupNames).toContain(
        `/aws/codebuild/tap-unit-test-${environmentSuffix}`
      );
      expect(logGroupNames).toContain(
        `/aws/codebuild/tap-integration-test-${environmentSuffix}`
      );
      expect(logGroupNames).toContain(
        `/aws/codebuild/tap-security-scan-${environmentSuffix}`
      );
    });

    test('should have Lambda log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/tap-security-scan-analysis-${environmentSuffix}`,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups?.[0]?.logGroupName).toBe(
        `/aws/lambda/tap-security-scan-analysis-${environmentSuffix}`
      );
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should have consistent environment suffix in all resource names', () => {
      // Check that all stack outputs contain the environment suffix
      expect(stackOutputs.PipelineName).toContain(environmentSuffix);
      expect(stackOutputs.PipelineNotificationTopicArn).toContain(
        environmentSuffix
      );
      expect(stackOutputs.SourceBucketName).toContain(environmentSuffix);
      expect(stackOutputs.StagingBucketName).toContain(environmentSuffix);
      expect(stackOutputs.ProductionBucketName).toContain(environmentSuffix);
    });

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

    test('should have proper IAM role trust relationships', async () => {
      // Get all roles with pagination
      let allRoles: any[] = [];
      let marker: string | undefined;
      
      do {
        const listCommand = new ListRolesCommand({ Marker: marker });
        const listResponse = await iamClient.send(listCommand);
        allRoles = allRoles.concat(listResponse.Roles || []);
        marker = listResponse.Marker;
      } while (marker);

      const roles = allRoles.filter(role => 
        role.RoleName?.startsWith(`TapStack${environmentSuffix}-`) &&
        (role.RoleName?.includes('CodeBuildRole') ||
         role.RoleName?.includes('CodePipelineRole') ||
         role.RoleName?.includes('SecurityScanLambdaRole'))
      );

      expect(roles.length).toBeGreaterThan(0);

      for (const role of roles) {
        const command = new GetRoleCommand({ RoleName: role.RoleName! });
        const response = await iamClient.send(command);

        expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
        // The policy document might be URL encoded, so decode it first
        const policyDoc = decodeURIComponent(
          response.Role!.AssumeRolePolicyDocument!
        );
        const trustPolicy = JSON.parse(policyDoc);
        expect(trustPolicy.Statement).toBeDefined();
        expect(Array.isArray(trustPolicy.Statement)).toBe(true);
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
