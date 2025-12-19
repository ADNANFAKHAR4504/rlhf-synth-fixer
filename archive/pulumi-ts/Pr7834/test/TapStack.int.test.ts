/**
 * Integration tests for TapStack CI/CD Pipeline
 * Tests deployed AWS resources using actual deployment outputs
 */

import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const codepipeline = new AWS.CodePipeline();
const iam = new AWS.IAM();
const sns = new AWS.SNS();
const secretsmanager = new AWS.SecretsManager();
const cloudwatchevents = new AWS.CloudWatchEvents();
const codebuild = new AWS.CodeBuild();

describe('CI/CD Pipeline Integration Tests', () => {
  describe('S3 Artifact Bucket', () => {
    it('should exist with correct configuration', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      const { Versioning } = await s3
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(Versioning.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const bucketName = outputs.artifactBucketName;
      const { ServerSideEncryptionConfiguration } = await s3
        .getBucketEncryption({ Bucket: bucketName })
        .promise();

      expect(ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(
        ServerSideEncryptionConfiguration.Rules[0]
          .ApplyServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should be accessible', async () => {
      const bucketName = outputs.artifactBucketName;
      const { Location } = await s3
        .getBucketLocation({ Bucket: bucketName })
        .promise();
      expect(Location).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    it('should exist and be invocable', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      expect(functionArn).toBeDefined();

      const { Configuration } = await lambda
        .getFunction({ FunctionName: functionArn })
        .promise();

      expect(Configuration).toBeDefined();
      expect(Configuration.Runtime).toBe('nodejs18.x');
      expect(Configuration.Handler).toBe('index.handler');
    });

    it('should have correct environment variables', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      const { Configuration } = await lambda
        .getFunction({ FunctionName: functionArn })
        .promise();

      expect(Configuration.Environment).toBeDefined();
      expect(Configuration.Environment.Variables).toHaveProperty(
        'ENVIRONMENT_SUFFIX'
      );
    });

    it('should have proper IAM role', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      const { Configuration } = await lambda
        .getFunction({ FunctionName: functionArn })
        .promise();

      expect(Configuration.Role).toBeDefined();
      expect(Configuration.Role).toContain('lambda-execution-role');
    });

    it('should be invocable and return expected response', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      const response = await lambda
        .invoke({
          FunctionName: functionArn,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ test: true }),
        })
        .promise();

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      const payload = JSON.parse(response.Payload as string);
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toBeDefined();

      const body = JSON.parse(payload.body);
      expect(body.message).toContain('Lambda');
    });
  });

  describe('CodePipeline', () => {
    it('should exist with correct configuration', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();

      const { pipeline } = await codepipeline
        .getPipeline({ name: pipelineName! })
        .promise();

      expect(pipeline).toBeDefined();
      expect(pipeline.stages).toHaveLength(4);
    });

    it('should have Source stage configured', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();

      const { pipeline } = await codepipeline
        .getPipeline({ name: pipelineName! })
        .promise();

      const sourceStage = pipeline.stages.find(s => s.name === 'Source');
      expect(sourceStage).toBeDefined();
      expect(sourceStage!.actions).toHaveLength(1);
      expect(sourceStage!.actions[0].actionTypeId.provider).toBe('GitHub');
    });

    it('should have Build stage with CodeBuild', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();

      const { pipeline } = await codepipeline
        .getPipeline({ name: pipelineName! })
        .promise();

      const buildStage = pipeline.stages.find(s => s.name === 'Build');
      expect(buildStage).toBeDefined();
      expect(buildStage!.actions).toHaveLength(1);
      expect(buildStage!.actions[0].actionTypeId.provider).toBe('CodeBuild');
    });

    it('should have Approval stage', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();

      const { pipeline } = await codepipeline
        .getPipeline({ name: pipelineName! })
        .promise();

      const approvalStage = pipeline.stages.find(s => s.name === 'Approval');
      expect(approvalStage).toBeDefined();
      expect(approvalStage!.actions).toHaveLength(1);
      expect(approvalStage!.actions[0].actionTypeId.provider).toBe('Manual');
    });

    it('should have Deploy stage', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();

      const { pipeline } = await codepipeline
        .getPipeline({ name: pipelineName! })
        .promise();

      const deployStage = pipeline.stages.find(s => s.name === 'Deploy');
      expect(deployStage).toBeDefined();
      expect(deployStage!.actions).toHaveLength(1);
    });

    it('should use correct artifact bucket', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();

      const { pipeline } = await codepipeline
        .getPipeline({ name: pipelineName! })
        .promise();

      // CodePipeline uses either artifactStore (singular) or artifactStores (plural)
      const artifactStore =
        pipeline.artifactStore ||
        Object.values(pipeline.artifactStores || {})[0];
      expect(artifactStore).toBeDefined();
      expect(artifactStore.location).toBe(outputs.artifactBucketName);
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should have Lambda execution role with proper permissions', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      const { Configuration } = await lambda
        .getFunction({ FunctionName: functionArn })
        .promise();

      const roleName = Configuration.Role.split('/').pop();
      const { Role } = await iam.getRole({ RoleName: roleName! }).promise();

      expect(Role).toBeDefined();
      expect(Role.AssumeRolePolicyDocument).toBeDefined();
    });

    it('should have CodePipeline role', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();

      const { pipeline } = await codepipeline
        .getPipeline({ name: pipelineName! })
        .promise();

      const roleArn = pipeline.roleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('codepipeline-role');
    });
  });

  describe('Secrets Manager', () => {
    it('should have GitHub OAuth token secret', async () => {
      const environmentSuffix = outputs.lambdaFunctionArn
        .split(':')
        .pop()!
        .replace('app-function-', '');
      const secretName = `github-oauth-token-${environmentSuffix}`;

      const { ARN, Name } = await secretsmanager
        .describeSecret({ SecretId: secretName })
        .promise();

      expect(ARN).toBeDefined();
      expect(Name).toBe(secretName);
    });

    it('should have secret value stored', async () => {
      const environmentSuffix = outputs.lambdaFunctionArn
        .split(':')
        .pop()!
        .replace('app-function-', '');
      const secretName = `github-oauth-token-${environmentSuffix}`;

      const { SecretString } = await secretsmanager
        .getSecretValue({ SecretId: secretName })
        .promise();

      expect(SecretString).toBeDefined();
      const parsedSecret = JSON.parse(SecretString!);
      expect(parsedSecret).toHaveProperty('token');
    });
  });

  describe('SNS Topics', () => {
    it('should have SNS topics created', async () => {
      const { Topics } = await sns.listTopics().promise();
      expect(Topics).toBeDefined();
      expect(Topics!.length).toBeGreaterThan(0);
    });

    it('should verify SNS topic exists by listing', async () => {
      const environmentSuffix = outputs.lambdaFunctionArn
        .split(':')
        .pop()!
        .replace('app-function-', '');

      const { Topics } = await sns.listTopics().promise();
      const pipelineTopics = Topics!.filter(t =>
        t.TopicArn!.includes(environmentSuffix)
      );

      // At least one SNS topic should exist with the environment suffix
      expect(pipelineTopics.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Events', () => {
    it('should have EventBridge rules created', async () => {
      const { Rules } = await cloudwatchevents.listRules().promise();
      expect(Rules).toBeDefined();
      expect(Rules!.length).toBeGreaterThan(0);
    });

    it('should verify pipeline monitoring rules exist', async () => {
      const environmentSuffix = outputs.lambdaFunctionArn
        .split(':')
        .pop()!
        .replace('app-function-', '');

      const { Rules } = await cloudwatchevents.listRules().promise();
      const pipelineRules = Rules!.filter(
        r => r.Name && r.Name.includes(environmentSuffix)
      );

      // At least one EventBridge rule should exist for the pipeline
      expect(pipelineRules.length).toBeGreaterThan(0);
    });
  });

  describe('CodeBuild Projects', () => {
    it('should have build project configured', async () => {
      const environmentSuffix = outputs.lambdaFunctionArn
        .split(':')
        .pop()!
        .replace('app-function-', '');
      const projectName = `build-project-${environmentSuffix}`;

      const { projects } = await codebuild
        .batchGetProjects({ names: [projectName] })
        .promise();

      expect(projects).toHaveLength(1);
      expect(projects[0].environment.image).toBe('aws/codebuild/standard:7.0');
    });

    it('should have deploy project configured', async () => {
      const environmentSuffix = outputs.lambdaFunctionArn
        .split(':')
        .pop()!
        .replace('app-function-', '');
      const projectName = `deploy-project-${environmentSuffix}`;

      const { projects } = await codebuild
        .batchGetProjects({ names: [projectName] })
        .promise();

      expect(projects).toHaveLength(1);
      expect(projects[0].environment.image).toBe('aws/codebuild/standard:7.0');
    });

    it('should have correct environment variables in build project', async () => {
      const environmentSuffix = outputs.lambdaFunctionArn
        .split(':')
        .pop()!
        .replace('app-function-', '');
      const projectName = `build-project-${environmentSuffix}`;

      const { projects } = await codebuild
        .batchGetProjects({ names: [projectName] })
        .promise();

      const envVars = projects[0].environment.environmentVariables;
      const suffixVar = envVars!.find(v => v.name === 'ENVIRONMENT_SUFFIX');

      expect(suffixVar).toBeDefined();
      expect(suffixVar!.value).toBe(environmentSuffix);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should include environmentSuffix in all resource names', () => {
      const bucketName = outputs.artifactBucketName;
      const lambdaArn = outputs.lambdaFunctionArn;
      const pipelineArn = outputs.pipelineArn;

      // Extract environmentSuffix from Lambda ARN
      const environmentSuffix = lambdaArn
        .split(':')
        .pop()!
        .replace('app-function-', '');

      expect(bucketName).toContain(environmentSuffix);
      expect(lambdaArn).toContain(environmentSuffix);
      expect(pipelineArn).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should have all components connected correctly', async () => {
      // Verify pipeline exists
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();
      const { pipeline } = await codepipeline
        .getPipeline({ name: pipelineName! })
        .promise();

      // Verify artifact bucket is used
      const artifactStore =
        pipeline.artifactStore ||
        Object.values(pipeline.artifactStores || {})[0];
      expect(artifactStore).toBeDefined();
      expect(artifactStore.location).toBe(outputs.artifactBucketName);

      // Verify Lambda function exists
      const functionArn = outputs.lambdaFunctionArn;
      const { Configuration } = await lambda
        .getFunction({ FunctionName: functionArn })
        .promise();
      expect(Configuration).toBeDefined();

      // All components are connected and operational
      expect(true).toBe(true);
    });
  });
});
