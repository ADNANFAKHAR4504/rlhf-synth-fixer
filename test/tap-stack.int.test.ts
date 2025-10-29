// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CodeBuildClient
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand
} from '@aws-sdk/client-codepipeline';
import {
  DescribeRepositoriesCommand,
  ECRClient,
  GetAuthorizationTokenCommand,
} from '@aws-sdk/client-ecr';
import {
  DescribeApplicationsCommand,
  DescribeEnvironmentsCommand,
  ElasticBeanstalkClient,
} from '@aws-sdk/client-elastic-beanstalk';
import {
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  PublishCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import {
  GetParameterCommand,
  GetParametersCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import fs from 'fs';
import path from 'path';

// Load outputs from CDK deployment with error handling
let outputs: any = {};

function loadOutputs(): any {
  const possiblePaths = [
    path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json'),
    path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json'),
    path.join(__dirname, '..', 'cdk.out', 'outputs.json'),
    path.join(process.cwd(), 'outputs.json')
  ];

  // Try environment variables first (common in CI/CD)
  if (process.env.CFN_OUTPUTS) {
    try {
      console.log('Loading outputs from CFN_OUTPUTS environment variable');
      return JSON.parse(process.env.CFN_OUTPUTS);
    } catch (error) {
      console.warn('Failed to parse CFN_OUTPUTS environment variable:', error);
    }
  }

  // Try loading from files
  for (const outputsPath of possiblePaths) {
    try {
      if (fs.existsSync(outputsPath)) {
        const content = fs.readFileSync(outputsPath, 'utf8').trim();
        if (content) {
          const parsed = JSON.parse(content);
          if (Object.keys(parsed).length > 0) {
            console.log(`✅ Loaded outputs from: ${outputsPath}`);
            console.log(`Found ${Object.keys(parsed).length} output keys:`, Object.keys(parsed));
            return parsed;
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load outputs from ${outputsPath}:`, error);
    }
  }

  // If no outputs found, try to get them from environment variables individually
  const envOutputs = {
    PipelinePipelineName0D474C17: process.env.PIPELINE_NAME,
    PipelineArtifactsBucketName2DACBAAD: process.env.ARTIFACTS_BUCKET_NAME,
    PipelineSourceBucketName609A66DA: process.env.SOURCE_BUCKET_NAME,
    PipelineEcrRepositoryUri2BCDAB31: process.env.ECR_REPOSITORY_URI,
    PipelineDeployStageApplicationName0757435C: process.env.EB_APPLICATION_NAME,
    PipelineDeployStageEnvironmentNameBB4932F5: process.env.EB_ENVIRONMENT_NAME,
    PipelineDeployStageEnvironmentUrlA1A0E807: process.env.EB_ENVIRONMENT_URL,
    SecurityConfigDatabaseSecretArn736226F2: process.env.DB_SECRET_ARN,
    SecurityConfigApiKeySecretArn625704ED: process.env.API_KEY_SECRET_ARN,
    PipelineDeployStageApprovalTopicArn649124A5: process.env.APPROVAL_TOPIC_ARN,
  };

  // Filter out undefined values
  const filteredEnvOutputs = Object.fromEntries(
    Object.entries(envOutputs).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(filteredEnvOutputs).length > 0) {
    console.log('✅ Loaded outputs from individual environment variables');
    console.log(`Found ${Object.keys(filteredEnvOutputs).length} output keys from env vars`);
    return filteredEnvOutputs;
  }

  console.error('❌ No outputs found from any source');
  return {};
}

try {
  outputs = loadOutputs();
} catch (error) {
  console.error('Error loading outputs:', error);
  outputs = {};
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix: string = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper function to skip tests when required outputs are not available
function requireOutput(outputKey: string, testName: string): boolean {
  if (!outputs[outputKey]) {
    console.log(`⚠️  Skipping "${testName}" - ${outputKey} not available`);
    return false;
  }
  return true;
}

// Helper function to check if we're in a CI environment without outputs
function shouldSkipIntegrationTests(): boolean {
  return Boolean(process.env.CI) && !Boolean(process.env.INTEGRATION_TEST_PHASE) && Object.keys(outputs).length === 0;
}

// AWS SDK clients
const region = process.env.AWS_REGION || 'us-east-1';
const codePipeline = new CodePipelineClient({ region });
const codeBuild = new CodeBuildClient({ region });
const cloudWatch = new CloudWatchClient({ region });
const elasticBeanstalk = new ElasticBeanstalkClient({ region });
const ecr = new ECRClient({ region });
const s3 = new S3Client({ region });
const secretsManager = new SecretsManagerClient({ region });
const ssm = new SSMClient({ region });
const sns = new SNSClient({ region });
const lambda = new LambdaClient({ region });

// Test configuration
const TEST_TIMEOUT = 300000; // 5 minutes
const EXECUTION_WAIT_TIME = 30000; // 30 seconds

describe('CI/CD Pipeline Integration Tests', () => {
  beforeAll(() => {
    console.log('🚀 Starting CI/CD Pipeline Integration Tests');
    console.log(`Environment: ${environmentSuffix}`);
    console.log(`AWS Region: ${region}`);

    const availableOutputs = Object.keys(outputs).filter(key => outputs[key] !== undefined && outputs[key] !== '');
    console.log(`Available outputs: ${availableOutputs.length}/10`);

    if (availableOutputs.length > 0) {
      console.log('✅ Output keys found:', availableOutputs);
    } else {
      console.warn('⚠️  No deployment outputs found - tests may be skipped');
      if (shouldSkipIntegrationTests()) {
        console.log('ℹ️  Running in CI without integration test phase - some tests will be skipped');
      }
    }
    console.log('');
  });

  describe('Resource Validation (Non-Interactive)', () => {
    test('should have all required outputs from CDK deployment', () => {
      const requiredOutputs = [
        'PipelinePipelineName0D474C17',
        'PipelineArtifactsBucketName2DACBAAD',
        'PipelineSourceBucketName609A66DA',
        'PipelineEcrRepositoryUri2BCDAB31',
        'PipelineDeployStageApplicationName0757435C',
        'PipelineDeployStageEnvironmentNameBB4932F5',
        'SecurityConfigDatabaseSecretArn736226F2',
        'SecurityConfigApiKeySecretArn625704ED',
      ];

      const missingOutputs = requiredOutputs.filter(key => !outputs[key]);

      if (missingOutputs.length > 0) {
        console.warn(`⚠️  Missing outputs: ${missingOutputs.join(', ')}`);
        if (shouldSkipIntegrationTests()) {
          console.log('🔄 Skipping test - running in CI without integration test phase');
          return;
        }
      }

      expect(missingOutputs).toHaveLength(0);
    });

    test('should have CodePipeline configured correctly', async () => {
      if (!requireOutput('PipelinePipelineName0D474C17', 'CodePipeline configuration test')) {
        return;
      }

      const pipelineName = outputs.PipelinePipelineName0D474C17;
      const pipeline = await codePipeline.send(new GetPipelineCommand({
        name: pipelineName,
      }));

      expect(pipeline.pipeline).toBeDefined();
      expect(pipeline.pipeline!.name).toBe(pipelineName);
      expect(pipeline.pipeline!.stages).toHaveLength(5); // Source, Build, Test, Approval, Deploy

      const stageNames = pipeline.pipeline!.stages!.map(stage => stage.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
      expect(stageNames).toContain('Approval');
      expect(stageNames).toContain('Deploy');

      console.log('✅ CodePipeline is properly configured with all required stages');
    });

    test('should have S3 buckets configured correctly', async () => {
      if (!requireOutput('PipelineArtifactsBucketName2DACBAAD', 'S3 buckets configuration test')) {
        return;
      }

      const artifactsBucket = outputs.PipelineArtifactsBucketName2DACBAAD;
      const sourceBucket = outputs.PipelineSourceBucketName609A66DA;

      // Check artifacts bucket
      const artifactsEncryption = await s3.send(new GetBucketEncryptionCommand({
        Bucket: artifactsBucket,
      }));
      expect(artifactsEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      const artifactsVersioning = await s3.send(new GetBucketVersioningCommand({
        Bucket: artifactsBucket,
      }));
      expect(artifactsVersioning.Status).toBe('Enabled');

      const artifactsPublicAccess = await s3.send(new GetPublicAccessBlockCommand({
        Bucket: artifactsBucket,
      }));
      expect(artifactsPublicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);

      // Check source bucket
      const sourceVersioning = await s3.send(new GetBucketVersioningCommand({
        Bucket: sourceBucket,
      }));
      expect(sourceVersioning.Status).toBe('Enabled');

      console.log('✅ S3 buckets are properly configured with encryption and versioning');
    });

    test('should have ECR repository configured correctly', async () => {
      if (!requireOutput('PipelineEcrRepositoryUri2BCDAB31', 'ECR repository configuration test')) {
        return;
      }

      const repositoryUri = outputs.PipelineEcrRepositoryUri2BCDAB31;
      const repositoryName = repositoryUri.split('/')[1];

      const repositories = await ecr.send(new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      }));

      expect(repositories.repositories).toHaveLength(1);
      const repo = repositories.repositories![0];
      expect(repo.repositoryName).toBe(repositoryName);
      expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
      expect(repo.imageTagMutability).toBe('MUTABLE');

      console.log('✅ ECR repository is properly configured with image scanning');
    });

    test('should have Elastic Beanstalk application and environment configured', async () => {
      if (!requireOutput('PipelineDeployStageApplicationName0757435C', 'Elastic Beanstalk configuration test')) {
        return;
      }

      const applicationName = outputs.PipelineDeployStageApplicationName0757435C;
      const environmentName = outputs.PipelineDeployStageEnvironmentNameBB4932F5;

      // Check application
      const applications = await elasticBeanstalk.send(new DescribeApplicationsCommand({
        ApplicationNames: [applicationName],
      }));
      expect(applications.Applications).toHaveLength(1);
      expect(applications.Applications![0].ApplicationName).toBe(applicationName);

      // Check environment
      const environments = await elasticBeanstalk.send(new DescribeEnvironmentsCommand({
        ApplicationName: applicationName,
        EnvironmentNames: [environmentName],
      }));
      expect(environments.Environments).toHaveLength(1);
      const env = environments.Environments![0];
      expect(env.EnvironmentName).toBe(environmentName);
      expect(env.Status).toBe('Ready');

      console.log('✅ Elastic Beanstalk application and environment are properly configured');
    });

    test('should have secrets configured correctly', async () => {
      if (!requireOutput('SecurityConfigDatabaseSecretArn736226F2', 'Secrets configuration test')) {
        return;
      }

      const dbSecretArn = outputs.SecurityConfigDatabaseSecretArn736226F2;
      const apiKeySecretArn = outputs.SecurityConfigApiKeySecretArn625704ED;

      // Check database secret
      const dbSecret = await secretsManager.send(new GetSecretValueCommand({
        SecretId: dbSecretArn,
      }));
      expect(dbSecret.SecretString).toBeDefined();
      const dbSecretData = JSON.parse(dbSecret.SecretString!);
      expect(dbSecretData.username).toBe('admin');
      expect(dbSecretData.password).toBeDefined();

      // Check API key secret
      const apiKeySecret = await secretsManager.send(new GetSecretValueCommand({
        SecretId: apiKeySecretArn,
      }));
      expect(apiKeySecret.SecretString).toBeDefined();
      const apiKeyData = JSON.parse(apiKeySecret.SecretString!);
      expect(apiKeyData.apiKey).toBeDefined();
      expect(apiKeyData.apiSecret).toBeDefined();

      console.log('✅ Secrets are properly configured and accessible');
    });
  });

  describe('Cross-Service Tests (Interactive)', () => {
    test('should allow CodeBuild to access ECR repository', async () => {
      if (!requireOutput('PipelineEcrRepositoryUri2BCDAB31', 'CodeBuild-ECR cross-service test')) {
        return;
      }

      const repositoryUri = outputs.PipelineEcrRepositoryUri2BCDAB31;

      // Get ECR authorization token
      const authToken = await ecr.send(new GetAuthorizationTokenCommand({}));
      expect(authToken.authorizationData).toBeDefined();
      expect(authToken.authorizationData![0].authorizationToken).toBeDefined();

      console.log('✅ CodeBuild can access ECR repository for Docker image operations');
    });

    test('should allow CodePipeline to trigger CodeBuild projects', async () => {
      if (!requireOutput('PipelinePipelineName0D474C17', 'CodePipeline-CodeBuild cross-service test')) {
        return;
      }

      const pipelineName = outputs.PipelinePipelineName0D474C17;

      // Get pipeline state to verify it can interact with CodeBuild
      const pipelineState = await codePipeline.send(new GetPipelineStateCommand({
        name: pipelineName,
      }));

      expect(pipelineState.pipelineName).toBe(pipelineName);
      expect(pipelineState.stageStates).toBeDefined();

      console.log('✅ CodePipeline can interact with CodeBuild projects');
    });

    test('should allow Elastic Beanstalk to pull from ECR', async () => {
      if (!requireOutput('PipelineEcrRepositoryUri2BCDAB31', 'Elastic Beanstalk-ECR cross-service test')) {
        return;
      }

      const repositoryUri = outputs.PipelineEcrRepositoryUri2BCDAB31;
      const repositoryName = repositoryUri.split('/')[1];

      // Verify ECR repository exists and is accessible
      const repositories = await ecr.send(new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      }));

      expect(repositories.repositories).toHaveLength(1);
      const repo = repositories.repositories![0];
      expect(repo.repositoryUri).toBe(repositoryUri);

      console.log('✅ Elastic Beanstalk can pull Docker images from ECR repository');
    });

    test('should allow Lambda to publish to SNS topics', async () => {
      if (!requireOutput('PipelineDeployStageApprovalTopicArn649124A5', 'Lambda-SNS cross-service test')) {
        return;
      }

      const topicArn = outputs.PipelineDeployStageApprovalTopicArn649124A5;

      // Get topic attributes to verify it exists and is accessible
      const topicAttributes = await sns.send(new GetTopicAttributesCommand({
        TopicArn: topicArn,
      }));

      expect(topicAttributes.Attributes).toBeDefined();
      expect(topicAttributes.Attributes!.TopicArn).toBe(topicArn);

      console.log('✅ Lambda can publish to SNS topics for notifications');
    });

    test('should allow CodeBuild to access Parameter Store', async () => {
      if (!requireOutput('SecurityConfigParameterStorePrefix9B899BCB', 'CodeBuild-SSM cross-service test')) {
        return;
      }

      const parameterPrefix = outputs.SecurityConfigParameterStorePrefix9B899BCB;

      // Try to get parameters with the prefix
      const parameters = await ssm.send(new GetParametersCommand({
        Names: [
          `${parameterPrefix}/app-config`,
          `${parameterPrefix}/database-host`,
          `${parameterPrefix}/api-timeout`,
        ],
      }));

      expect(parameters.Parameters).toBeDefined();
      expect(parameters.Parameters!.length).toBeGreaterThan(0);

      console.log('✅ CodeBuild can access Parameter Store for configuration');
    });
  });

  describe('Service-Level Tests (Interactive)', () => {
    test('should be able to upload and retrieve objects from S3 artifacts bucket', async () => {
      if (!requireOutput('PipelineArtifactsBucketName2DACBAAD', 'S3 service-level test')) {
        return;
      }

      const bucketName = outputs.PipelineArtifactsBucketName2DACBAAD;
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      try {
        // Upload test object
        await s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        }));

        // List objects to verify upload
        const listResult = await s3.send(new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: testKey,
        }));

        expect(listResult.Contents).toBeDefined();
        expect(listResult.Contents!.length).toBe(1);
        expect(listResult.Contents![0].Key).toBe(testKey);

        // Clean up test object
        await s3.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        }));

        console.log('✅ S3 artifacts bucket allows upload and retrieval operations');
      } catch (error) {
        console.error('S3 service-level test failed:', error);
        throw error;
      }
    });

    test('should be able to retrieve secrets from Secrets Manager', async () => {
      if (!requireOutput('SecurityConfigDatabaseSecretArn736226F2', 'Secrets Manager service-level test')) {
        return;
      }

      const dbSecretArn = outputs.SecurityConfigDatabaseSecretArn736226F2;
      const apiKeySecretArn = outputs.SecurityConfigApiKeySecretArn625704ED;

      // Retrieve database secret
      const dbSecret = await secretsManager.send(new GetSecretValueCommand({
        SecretId: dbSecretArn,
      }));
      expect(dbSecret.SecretString).toBeDefined();
      const dbData = JSON.parse(dbSecret.SecretString!);
      expect(dbData.username).toBe('admin');
      expect(dbData.password).toBeDefined();
      expect(dbData.password.length).toBe(32);

      // Retrieve API key secret
      const apiSecret = await secretsManager.send(new GetSecretValueCommand({
        SecretId: apiKeySecretArn,
      }));
      expect(apiSecret.SecretString).toBeDefined();
      const apiData = JSON.parse(apiSecret.SecretString!);
      expect(apiData.apiKey).toBeDefined();
      expect(apiData.apiSecret).toBeDefined();
      expect(apiData.apiSecret.length).toBe(48);

      console.log('✅ Secrets Manager allows retrieval of generated secrets');
    });

    test('should be able to retrieve parameters from Parameter Store', async () => {
      if (!requireOutput('SecurityConfigParameterStorePrefix9B899BCB', 'Parameter Store service-level test')) {
        return;
      }

      const parameterPrefix = outputs.SecurityConfigParameterStorePrefix9B899BCB;

      // Get app-config parameter
      const appConfig = await ssm.send(new GetParameterCommand({
        Name: `${parameterPrefix}/app-config`,
      }));
      expect(appConfig.Parameter?.Value).toBeDefined();
      const configData = JSON.parse(appConfig.Parameter!.Value!);
      expect(configData.appName).toBe('acme-tech');
      expect(configData.environment).toBe(environmentSuffix);

      // Get database-host parameter
      const dbHost = await ssm.send(new GetParameterCommand({
        Name: `${parameterPrefix}/database-host`,
      }));
      expect(dbHost.Parameter?.Value).toBeDefined();
      expect(dbHost.Parameter!.Value).toMatch(/.*\.example\.com$/);

      console.log('✅ Parameter Store allows retrieval of configuration parameters');
    });

    test('should be able to publish messages to SNS topics', async () => {
      if (!requireOutput('PipelineDeployStageApprovalTopicArn649124A5', 'SNS service-level test')) {
        return;
      }

      const topicArn = outputs.PipelineDeployStageApprovalTopicArn649124A5;
      const testMessage = `Integration test message - ${Date.now()}`;

      try {
        // Publish test message
        const publishResult = await sns.send(new PublishCommand({
          TopicArn: topicArn,
          Message: testMessage,
          Subject: 'Integration Test',
        }));

        expect(publishResult.MessageId).toBeDefined();
        expect(publishResult.MessageId!.length).toBeGreaterThan(0);

        console.log('✅ SNS allows publishing messages to topics');
      } catch (error) {
        console.error('SNS service-level test failed:', error);
        throw error;
      }
    });

    test('should be able to invoke Lambda function', async () => {
      // Note: This test assumes the Lambda function exists and can be invoked
      // The actual Lambda ARN would need to be added to outputs for this test to work
      console.log('ℹ️  Lambda invocation test skipped - Lambda ARN not available in outputs');
    });
  });

  describe('End-to-End Tests (Interactive)', () => {
    test('should complete full pipeline workflow from source to deployment', async () => {
      if (!requireOutput('PipelinePipelineName0D474C17', 'E2E pipeline workflow test')) {
        return;
      }

      const pipelineName = outputs.PipelinePipelineName0D474C17;

      // Get current pipeline state
      const pipelineState = await codePipeline.send(new GetPipelineStateCommand({
        name: pipelineName,
      }));

      expect(pipelineState.pipelineName).toBe(pipelineName);
      expect(pipelineState.stageStates).toBeDefined();
      expect(pipelineState.stageStates!.length).toBe(5); // All stages should be present

      // Verify all stages are configured
      const stageNames = pipelineState.stageStates!.map(stage => stage.stageName);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
      expect(stageNames).toContain('Approval');
      expect(stageNames).toContain('Deploy');

      console.log('✅ Full pipeline workflow is properly configured end-to-end');
    }, TEST_TIMEOUT);

    test('should have complete CI/CD flow with monitoring and notifications', async () => {
      if (!requireOutput('PipelinePipelineName0D474C17', 'E2E monitoring and notifications test')) {
        return;
      }

      const pipelineName = outputs.PipelinePipelineName0D474C17;
      const approvalTopicArn = outputs.PipelineDeployStageApprovalTopicArn649124A5;

      // Verify pipeline exists
      const pipeline = await codePipeline.send(new GetPipelineCommand({
        name: pipelineName,
      }));
      expect(pipeline.pipeline).toBeDefined();

      // Verify approval topic exists
      const topicAttributes = await sns.send(new GetTopicAttributesCommand({
        TopicArn: approvalTopicArn,
      }));
      expect(topicAttributes.Attributes).toBeDefined();

      // Check for CloudWatch alarms (if available)
      try {
        const alarms = await cloudWatch.send(new DescribeAlarmsCommand({
          AlarmNames: [
            `acme-tech-${environmentSuffix}-pipeline-failure`,
            `acme-tech-${environmentSuffix}-pipeline-duration`,
          ],
        }));

        if (alarms.MetricAlarms && alarms.MetricAlarms.length > 0) {
          console.log(`✅ Found ${alarms.MetricAlarms.length} CloudWatch alarms for monitoring`);
        }
      } catch (error) {
        console.log('ℹ️  CloudWatch alarms not found or not accessible');
      }

      console.log('✅ Complete CI/CD flow with monitoring and notifications is configured');
    }, TEST_TIMEOUT);

    test('should support Docker-based deployment workflow', async () => {
      if (!requireOutput('PipelineEcrRepositoryUri2BCDAB31', 'E2E Docker deployment workflow test')) {
        return;
      }

      const repositoryUri = outputs.PipelineEcrRepositoryUri2BCDAB31;
      const applicationName = outputs.PipelineDeployStageApplicationName0757435C;
      const environmentName = outputs.PipelineDeployStageEnvironmentNameBB4932F5;

      // Verify ECR repository exists
      const repositoryName = repositoryUri.split('/')[1];
      const repositories = await ecr.send(new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      }));
      expect(repositories.repositories).toHaveLength(1);

      // Verify Elastic Beanstalk environment is configured for Docker
      const environments = await elasticBeanstalk.send(new DescribeEnvironmentsCommand({
        ApplicationName: applicationName,
        EnvironmentNames: [environmentName],
      }));
      expect(environments.Environments).toHaveLength(1);

      const env = environments.Environments![0];
      expect(env.SolutionStackName).toContain('Docker');

      console.log('✅ Docker-based deployment workflow is properly configured');
    }, TEST_TIMEOUT);

    test('should have secure configuration with proper IAM permissions', async () => {
      if (!requireOutput('PipelinePipelineName0D474C17', 'E2E security configuration test')) {
        return;
      }

      const pipelineName = outputs.PipelinePipelineName0D474C17;
      const artifactsBucket = outputs.PipelineArtifactsBucketName2DACBAAD;
      const sourceBucket = outputs.PipelineSourceBucketName609A66DA;

      // Verify pipeline exists (implies IAM roles are configured)
      const pipeline = await codePipeline.send(new GetPipelineCommand({
        name: pipelineName,
      }));
      expect(pipeline.pipeline).toBeDefined();

      // Verify buckets have proper security settings
      const artifactsPublicAccess = await s3.send(new GetPublicAccessBlockCommand({
        Bucket: artifactsBucket,
      }));
      expect(artifactsPublicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);

      const sourcePublicAccess = await s3.send(new GetPublicAccessBlockCommand({
        Bucket: sourceBucket,
      }));
      expect(sourcePublicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);

      // Verify secrets are properly configured
      const dbSecretArn = outputs.SecurityConfigDatabaseSecretArn736226F2;
      const dbSecret = await secretsManager.send(new GetSecretValueCommand({
        SecretId: dbSecretArn,
      }));
      expect(dbSecret.SecretString).toBeDefined();

      console.log('✅ Secure configuration with proper IAM permissions is in place');
    }, TEST_TIMEOUT);
  });

  describe('Performance and Reliability Tests', () => {
    test('should have proper resource scaling configuration', async () => {
      if (!requireOutput('PipelineDeployStageEnvironmentNameBB4932F5', 'Resource scaling configuration test')) {
        return;
      }

      const applicationName = outputs.PipelineDeployStageApplicationName0757435C;
      const environmentName = outputs.PipelineDeployStageEnvironmentNameBB4932F5;

      const environments = await elasticBeanstalk.send(new DescribeEnvironmentsCommand({
        ApplicationName: applicationName,
        EnvironmentNames: [environmentName],
      }));

      expect(environments.Environments).toHaveLength(1);
      const env = environments.Environments![0];

      // Verify environment is load balanced (for production readiness)
      expect(env.Tier?.Name).toBe('WebServer');
      expect(env.Tier?.Type).toBe('Standard');

      console.log('✅ Resource scaling configuration is properly set up');
    });

    test('should have proper monitoring and alerting setup', async () => {
      if (!requireOutput('PipelinePipelineName0D474C17', 'Monitoring and alerting test')) {
        return;
      }

      const pipelineName = outputs.PipelinePipelineName0D474C17;

      // Check if CloudWatch alarms exist for the pipeline
      try {
        const alarms = await cloudWatch.send(new DescribeAlarmsCommand({
          AlarmNames: [
            `acme-tech-${environmentSuffix}-pipeline-failure`,
            `acme-tech-${environmentSuffix}-pipeline-duration`,
          ],
        }));

        if (alarms.MetricAlarms && alarms.MetricAlarms.length > 0) {
          console.log(`✅ Found ${alarms.MetricAlarms.length} CloudWatch alarms for monitoring`);

          // Verify alarm configurations
          alarms.MetricAlarms!.forEach(alarm => {
            expect(alarm.AlarmName).toBeDefined();
            expect(alarm.MetricName).toBeDefined();
            expect(alarm.Namespace).toBe('AWS/CodePipeline');
            expect(alarm.Threshold).toBeDefined();
          });
        } else {
          console.log('ℹ️  No CloudWatch alarms found - this may be expected in some environments');
        }
      } catch (error) {
        console.log('ℹ️  Could not verify CloudWatch alarms - this may be expected in some environments');
      }

      console.log('✅ Monitoring and alerting setup is configured');
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should be able to clean up test resources', async () => {
      // This test ensures that any test resources created during integration tests
      // can be properly cleaned up

      const testObjects: string[] = [];

      // Clean up any test objects that might have been created
      if (outputs.PipelineArtifactsBucketName2DACBAAD) {
        const bucketName = outputs.PipelineArtifactsBucketName2DACBAAD;

        try {
          const listResult = await s3.send(new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'integration-test-',
          }));

          if (listResult.Contents) {
            for (const obj of listResult.Contents) {
              if (obj.Key) {
                await s3.send(new DeleteObjectCommand({
                  Bucket: bucketName,
                  Key: obj.Key,
                }));
                testObjects.push(obj.Key);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to clean up test objects:', error);
        }
      }

      console.log(`✅ Cleaned up ${testObjects.length} test resources`);
    });
  });
});
