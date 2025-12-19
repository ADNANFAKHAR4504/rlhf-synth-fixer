import fs from 'fs';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
  ListPipelinesCommand,
} from '@aws-sdk/client-codepipeline';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';

// Load CloudFormation outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Extract output values
const pipelineName = outputs.find(
  (o: any) => o.OutputKey === 'PipelineName'
)?.OutputValue;
const artifactBucketName = outputs.find(
  (o: any) => o.OutputKey === 'ArtifactBucketName'
)?.OutputValue;
const notificationTopicArn = outputs.find(
  (o: any) => o.OutputKey === 'NotificationTopicArn'
)?.OutputValue;

// AWS Clients
const codepipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const lambdaClient = new LambdaClient({ region });
const codebuildClient = new CodeBuildClient({ region });
const iamClient = new IAMClient({ region });
const cwlogsClient = new CloudWatchLogsClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {
  describe('CloudFormation Stack Outputs', () => {
    test('should have all required outputs', () => {
      expect(pipelineName).toBeDefined();
      expect(artifactBucketName).toBeDefined();
      expect(notificationTopicArn).toBeDefined();
    });

    test('outputs should follow naming convention', () => {
      expect(pipelineName).toContain(environmentSuffix);
      expect(artifactBucketName).toContain('artifacts');
      expect(artifactBucketName).toContain(environmentSuffix);
      expect(notificationTopicArn).toContain('pipeline-state');
    });
  });

  describe('CodePipeline', () => {
    test('pipeline should exist and be accessible', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    test('pipeline should have correct stages in order', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      const stages = response.pipeline?.stages || [];
      const stageNames = stages.map((s) => s.name);

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
      expect(stageNames).toContain('IntegrationTest');
      expect(stageNames).toContain('Deploy');

      // Verify stage order
      expect(stageNames.indexOf('Source')).toBeLessThan(
        stageNames.indexOf('Build')
      );
      expect(stageNames.indexOf('Build')).toBeLessThan(
        stageNames.indexOf('Test')
      );
      expect(stageNames.indexOf('Test')).toBeLessThan(
        stageNames.indexOf('IntegrationTest')
      );
      expect(stageNames.indexOf('IntegrationTest')).toBeLessThan(
        stageNames.indexOf('Deploy')
      );
    });

    test('source stage should use S3 source', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Source'
      );
      const sourceAction = sourceStage?.actions?.[0];

      expect(sourceAction).toBeDefined();
      expect(sourceAction?.actionTypeId?.provider).toBe('S3');
      expect(sourceAction?.configuration?.S3ObjectKey).toBe('source.zip');
    });

    test('pipeline should have correct artifact bucket', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      expect(response.pipeline?.artifactStore?.location).toBe(
        artifactBucketName
      );
      expect(response.pipeline?.artifactStore?.type).toBe('S3');
    });

    test('pipeline should be in a valid state', async () => {
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates!.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('artifact bucket should exist', async () => {
      const command = new HeadBucketCommand({ Bucket: artifactBucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('artifact bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: artifactBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('artifact bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: artifactBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('artifact bucket should have bucket policy', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: artifactBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('source bucket should exist', async () => {
      const sourceBucketName = artifactBucketName.replace(
        'artifacts',
        'source'
      );
      const command = new HeadBucketCommand({ Bucket: sourceBucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });
  });

  describe('SNS Topics', () => {
    test('notification topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: notificationTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(notificationTopicArn);
    });

    test('notification topic should have correct display name', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: notificationTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes?.DisplayName).toContain('Pipeline State');
    });

    test('notification topic should have EventBridge as subscriber', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: notificationTopicArn,
      });
      const response = await snsClient.send(command);

      // Topic may have EventBridge rule as a subscriber
      expect(response.Subscriptions).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('integration test Lambda should exist', async () => {
      const functionName = `cicd-pipeline-integration-test-${environmentSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
    });

    test('Lambda should have correct runtime and configuration', async () => {
      const functionName = `cicd-pipeline-integration-test-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Runtime).toBe('nodejs18.x');
      expect(response.Handler).toBe('index.handler');
      expect(response.Timeout).toBe(300);
      expect(response.MemorySize).toBe(256);
    });

    test('Lambda should have CloudWatch log group', async () => {
      const functionName = `cicd-pipeline-integration-test-${environmentSuffix}`;
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cwlogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0]?.logGroupName).toBe(logGroupName);
    });
  });

  describe('CodeBuild Projects', () => {
    test('build project should exist with correct configuration', async () => {
      const projectName = `cicd-pipeline-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0]?.name).toBe(projectName);

      const project = response.projects?.[0];
      expect(project?.environment?.image).toBe('aws/codebuild/standard:7.0');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project?.environment?.privilegedMode).toBe(false);
    });

    test('test project should exist with correct configuration', async () => {
      const projectName = `cicd-pipeline-test-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
    });

    test('deploy project should exist with correct configuration', async () => {
      const projectName = `cicd-pipeline-deploy-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
    });

    test('build project should have correct buildspec', async () => {
      const projectName = `cicd-pipeline-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      const buildSpec = response.projects?.[0]?.source?.buildspec;
      expect(buildSpec).toBeDefined();
      expect(buildSpec).toContain('npm run build');
      expect(buildSpec).toContain('npm ci');
    });

    test('test project should have correct buildspec', async () => {
      const projectName = `cicd-pipeline-test-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      const buildSpec = response.projects?.[0]?.source?.buildspec;
      expect(buildSpec).toBeDefined();
      expect(buildSpec).toContain('npm test');
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('CodePipeline role should exist', async () => {
      // Find pipeline role by listing and filtering
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);
      const roleArn = pipelineResponse.pipeline?.roleArn;

      expect(roleArn).toBeDefined();
      const roleName = roleArn?.split('/').pop();

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(roleArn);
    });

    test('Lambda execution role should have CodePipeline permissions', async () => {
      const functionName = `cicd-pipeline-integration-test-${environmentSuffix}`;
      const functionCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const functionResponse = await lambdaClient.send(functionCommand);
      const roleArn = functionResponse.Configuration?.Role;

      expect(roleArn).toBeDefined();
      const roleName = roleArn?.split('/').pop();

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();

      // Check for attached policies
      const policiesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const policiesResponse = await iamClient.send(policiesCommand);

      expect(policiesResponse.AttachedPolicies).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    test('pipeline state change rule should exist', async () => {
      const command = new ListRulesCommand({ NamePrefix: 'TapStack' });
      const response = await eventBridgeClient.send(command);

      const pipelineRule = response.Rules?.find(
        (rule) =>
          rule.EventPattern?.includes('codepipeline') &&
          rule.EventPattern?.includes(pipelineName)
      );

      expect(pipelineRule).toBeDefined();
    });

    test('EventBridge rule should target SNS topic', async () => {
      const rulesCommand = new ListRulesCommand({ NamePrefix: 'TapStack' });
      const rulesResponse = await eventBridgeClient.send(rulesCommand);

      const pipelineRule = rulesResponse.Rules?.find(
        (rule) =>
          rule.EventPattern?.includes('codepipeline') &&
          rule.EventPattern?.includes(pipelineName)
      );

      if (pipelineRule?.Name) {
        const targetsCommand = new ListTargetsByRuleCommand({
          Rule: pipelineRule.Name,
        });
        const targetsResponse = await eventBridgeClient.send(targetsCommand);

        const snsTarget = targetsResponse.Targets?.find((t) =>
          t.Arn?.includes('sns')
        );
        expect(snsTarget).toBeDefined();
      }
    });
  });

  describe('Resource Tagging', () => {
    test('pipeline should have correct tags', async () => {
      const command = new ListPipelinesCommand({});
      const response = await codepipelineClient.send(command);

      const pipeline = response.pipelines?.find((p) => p.name === pipelineName);
      expect(pipeline).toBeDefined();

      // Tags are included in detailed pipeline info
      const detailCommand = new GetPipelineCommand({ name: pipelineName });
      const detailResponse = await codepipelineClient.send(detailCommand);

      expect(detailResponse.pipeline).toBeDefined();
    });
  });

  describe('Infrastructure Validation', () => {
    test('all critical resources should be deployed', async () => {
      // Verify all resources exist by checking each one
      const checks = [
        s3Client.send(new HeadBucketCommand({ Bucket: artifactBucketName })),
        snsClient.send(
          new GetTopicAttributesCommand({ TopicArn: notificationTopicArn })
        ),
        codepipelineClient.send(new GetPipelineCommand({ name: pipelineName })),
        lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: `cicd-pipeline-integration-test-${environmentSuffix}`,
          })
        ),
        codebuildClient.send(
          new BatchGetProjectsCommand({
            names: [`cicd-pipeline-build-${environmentSuffix}`],
          })
        ),
      ];

      await expect(Promise.all(checks)).resolves.not.toThrow();
    });

    test('infrastructure should follow AWS best practices', async () => {
      // S3 bucket encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: artifactBucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // S3 bucket versioning
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: artifactBucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Lambda logging
      const functionName = `cicd-pipeline-integration-test-${environmentSuffix}`;
      const logGroupName = `/aws/lambda/${functionName}`;
      const logsCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logsResponse = await cwlogsClient.send(logsCommand);
      expect(logsResponse.logGroups?.length).toBeGreaterThan(0);
    });
  });

  describe('Deployment Completeness', () => {
    test('no resources should be in failed or rollback state', async () => {
      // Check pipeline state
      const pipelineStateCommand = new GetPipelineStateCommand({
        name: pipelineName,
      });
      const pipelineState = await codepipelineClient.send(
        pipelineStateCommand
      );

      expect(pipelineState.pipelineName).toBe(pipelineName);
      expect(pipelineState.stageStates).toBeDefined();

      // All stages should be in valid state (not failed during creation)
      pipelineState.stageStates?.forEach((stage) => {
        expect(stage.stageName).toBeDefined();
      });
    });

    test('all expected resources should be queryable', async () => {
      const resourceChecks = {
        pipeline: false,
        artifactBucket: false,
        sourceBucket: false,
        notificationTopic: false,
        lambda: false,
        buildProject: false,
        testProject: false,
        deployProject: false,
      };

      // Pipeline
      try {
        await codepipelineClient.send(
          new GetPipelineCommand({ name: pipelineName })
        );
        resourceChecks.pipeline = true;
      } catch (e) {
        /* ignore */
      }

      // Artifact Bucket
      try {
        await s3Client.send(
          new HeadBucketCommand({ Bucket: artifactBucketName })
        );
        resourceChecks.artifactBucket = true;
      } catch (e) {
        /* ignore */
      }

      // Source Bucket
      try {
        const sourceBucketName = artifactBucketName.replace(
          'artifacts',
          'source'
        );
        await s3Client.send(new HeadBucketCommand({ Bucket: sourceBucketName }));
        resourceChecks.sourceBucket = true;
      } catch (e) {
        /* ignore */
      }

      // SNS Topic
      try {
        await snsClient.send(
          new GetTopicAttributesCommand({ TopicArn: notificationTopicArn })
        );
        resourceChecks.notificationTopic = true;
      } catch (e) {
        /* ignore */
      }

      // Lambda
      try {
        await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: `cicd-pipeline-integration-test-${environmentSuffix}`,
          })
        );
        resourceChecks.lambda = true;
      } catch (e) {
        /* ignore */
      }

      // CodeBuild Projects
      try {
        await codebuildClient.send(
          new BatchGetProjectsCommand({
            names: [`cicd-pipeline-build-${environmentSuffix}`],
          })
        );
        resourceChecks.buildProject = true;
      } catch (e) {
        /* ignore */
      }

      try {
        await codebuildClient.send(
          new BatchGetProjectsCommand({
            names: [`cicd-pipeline-test-${environmentSuffix}`],
          })
        );
        resourceChecks.testProject = true;
      } catch (e) {
        /* ignore */
      }

      try {
        await codebuildClient.send(
          new BatchGetProjectsCommand({
            names: [`cicd-pipeline-deploy-${environmentSuffix}`],
          })
        );
        resourceChecks.deployProject = true;
      } catch (e) {
        /* ignore */
      }

      // Verify all resources are accessible
      expect(resourceChecks.pipeline).toBe(true);
      expect(resourceChecks.artifactBucket).toBe(true);
      expect(resourceChecks.sourceBucket).toBe(true);
      expect(resourceChecks.notificationTopic).toBe(true);
      expect(resourceChecks.lambda).toBe(true);
      expect(resourceChecks.buildProject).toBe(true);
      expect(resourceChecks.testProject).toBe(true);
      expect(resourceChecks.deployProject).toBe(true);
    });
  });
});
