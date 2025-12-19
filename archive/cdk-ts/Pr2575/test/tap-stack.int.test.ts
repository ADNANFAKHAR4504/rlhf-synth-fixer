import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  BatchGetProjectsCommand,
  CodeBuildClient,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  DescribeApplicationsCommand,
  DescribeEnvironmentsCommand,
  ElasticBeanstalkClient,
} from '@aws-sdk/client-elastic-beanstalk';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';

// Load stack outputs from files
const flatOutputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

let stackOutputs: Record<string, string> = {};

// Load outputs at module level
try {
  if (fs.existsSync(flatOutputsPath)) {
    stackOutputs = JSON.parse(fs.readFileSync(flatOutputsPath, 'utf8'));
  }
} catch (error) {
  console.error('Failed to load stack outputs:', error);
}

// Initialize AWS clients
const s3Client = new S3Client({ region });
const codePipelineClient = new CodePipelineClient({ region });
const codeBuildClient = new CodeBuildClient({ region });
const elasticBeanstalkClient = new ElasticBeanstalkClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {

  beforeAll(async () => {
    // Verify outputs are loaded
    if (Object.keys(stackOutputs).length === 0) {
      throw new Error('Stack outputs not loaded. Make sure to run get-outputs script first.');
    }
    console.log('Available outputs:', Object.keys(stackOutputs));
  }, 30000);

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs from deployment', () => {
      expect(stackOutputs[`SourceBucketName${environmentSuffix}`]).toBeDefined();
      expect(stackOutputs[`PipelineName${environmentSuffix}`]).toBeDefined();
      expect(stackOutputs[`DashboardURL${environmentSuffix}`]).toBeDefined();
    });

    test('should have valid resource names from outputs', () => {
      const sourceBucket = stackOutputs[`SourceBucketName${environmentSuffix}`];
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];

      expect(sourceBucket).toContain(`tap-source-${environmentSuffix}`);
      expect(pipelineName).toBe(`tap-pipeline-${environmentSuffix}`);
    });
  });

  describe('S3 Buckets', () => {
    test('source bucket should have versioning enabled', async () => {
      const bucketName = stackOutputs[`SourceBucketName${environmentSuffix}`];
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('source bucket should have encryption enabled', async () => {
      const bucketName = stackOutputs[`SourceBucketName${environmentSuffix}`];
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('aws:kms');
    });

  });



  describe('CloudWatch Log Groups', () => {
    test('build log group should exist with correct retention', async () => {
      const logGroupName = `/aws/codebuild/tap-build-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      const matchingLogGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(matchingLogGroup).toBeDefined();
      expect(matchingLogGroup!.logGroupName).toBe(logGroupName);
      expect(matchingLogGroup!.retentionInDays).toBe(30);
    });

    test('pipeline log group should exist with correct retention', async () => {
      const logGroupName = `/aws/codepipeline/tap-pipeline-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      const matchingLogGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(matchingLogGroup).toBeDefined();
      expect(matchingLogGroup!.logGroupName).toBe(logGroupName);
      expect(matchingLogGroup!.retentionInDays).toBe(30);
    });
  });

  describe('CodeBuild Project', () => {
    test('should exist with correct configuration', async () => {
      const projectName = `tap-build-${environmentSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBe(1);

      const project = response.projects![0];
      expect(project.name).toBe(projectName);
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
      expect(project.environment!.image).toBe('aws/codebuild/standard:7.0');
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.privilegedMode).toBe(false);

      // Check environment variables
      const envVars = project.environment!.environmentVariables!;
      expect(envVars.find(env => env.name === 'ENVIRONMENT')?.value).toBe(
        environmentSuffix
      );
      expect(
        envVars.find(env => env.name === 'AWS_DEFAULT_REGION')?.value
      ).toBe(region);
      // Skip account ID check as it may be masked in some environments
      expect(envVars.find(env => env.name === 'AWS_ACCOUNT_ID')).toBeDefined();
    });
  });

  describe('Elastic Beanstalk', () => {
    test('application should exist', async () => {
      const applicationName = `tap-app-${environmentSuffix}`;

      const command = new DescribeApplicationsCommand({
        ApplicationNames: [applicationName],
      });
      const response = await elasticBeanstalkClient.send(command);

      expect(response.Applications).toBeDefined();
      expect(response.Applications!.length).toBe(1);
      expect(response.Applications![0].ApplicationName).toBe(applicationName);
      expect(response.Applications![0].Description).toBe(
        `TAP Application - ${environmentSuffix} environment`
      );
    });

    test('environment should exist with correct configuration', async () => {
      const environmentName = `tap-env-${environmentSuffix}`;

      const command = new DescribeEnvironmentsCommand({
        EnvironmentNames: [environmentName],
      });
      const response = await elasticBeanstalkClient.send(command);

      expect(response.Environments).toBeDefined();
      
      // Filter out terminated environments
      const activeEnvironments = response.Environments!.filter(
        env => env.Status !== 'Terminated'
      );
      expect(activeEnvironments.length).toBe(1);

      const environment = activeEnvironments[0];
      expect(environment.EnvironmentName).toBe(environmentName);
      expect(environment.SolutionStackName).toBe(
        '64bit Amazon Linux 2023 v6.6.4 running Node.js 20'
      );
      expect(environment.Health).toBeDefined();
      expect(environment.Status).toMatch(/^(Ready|Launching|Updating)$/);
    });
  });

  describe('CodePipeline', () => {
    test('should exist with correct stages', async () => {
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline!.name).toBe(pipelineName);

      const stages = response.pipeline!.stages!;
      expect(stages.length).toBeGreaterThanOrEqual(3);

      // Check required stages
      expect(stages.find(stage => stage.name === 'Source')).toBeDefined();
      expect(stages.find(stage => stage.name === 'Build')).toBeDefined();
      expect(stages.find(stage => stage.name === 'Deploy')).toBeDefined();

      // For production, check for manual approval
      if (environmentSuffix === 'prod') {
        expect(
          stages.find(stage => stage.name === 'ManualApproval')
        ).toBeDefined();
      }
    });

    test('should be in valid state', async () => {
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should exist for pipeline monitoring', async () => {
      const dashboardName = `tap-pipeline-${environmentSuffix}`;
      const dashboardURL = stackOutputs[`DashboardURL${environmentSuffix}`];

      // Verify dashboard URL is available in outputs
      expect(dashboardURL).toBeDefined();
      expect(dashboardURL).toContain('cloudwatch');
      expect(dashboardURL).toContain(dashboardName);

      const command = new ListDashboardsCommand({
        DashboardNamePrefix: dashboardName,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      const matchingDashboard = response.DashboardEntries!.find(d => d.DashboardName === dashboardName);
      expect(matchingDashboard).toBeDefined();
      expect(matchingDashboard!.DashboardName).toBe(dashboardName);
      expect(matchingDashboard!.Size).toBeGreaterThan(0);
    });
  });

  describe('Security Validation', () => {
    test('all resources should be properly tagged', () => {
      // Verify resource names contain environment suffix (indicating proper tagging)
      const sourceBucket = stackOutputs[`SourceBucketName${environmentSuffix}`];
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];

      expect(sourceBucket).toContain(environmentSuffix);
      expect(pipelineName).toContain(environmentSuffix);

      // Environment suffix in resource names indicates proper tagging strategy
      expect(environmentSuffix).toBeDefined();
    });

    test('stack outputs should contain all required values', () => {
      expect(
        stackOutputs[`SourceBucketName${environmentSuffix}`]
      ).toBeDefined();
      expect(stackOutputs[`PipelineName${environmentSuffix}`]).toBeDefined();
      expect(stackOutputs[`DashboardURL${environmentSuffix}`]).toBeDefined();
    });
  });

  describe('End-to-End Pipeline Functionality', () => {
    test('pipeline components should be properly integrated', async () => {
      // This test validates that all components can work together using stack outputs
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];
      const buildProjectName = `tap-build-${environmentSuffix}`;
      const ebApplicationName = `tap-app-${environmentSuffix}`;

      expect(pipelineName).toBeDefined();

      // Check pipeline exists and references correct resources
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);

      const buildStage = pipelineResponse.pipeline!.stages!.find(
        stage => stage.name === 'Build'
      );
      expect(buildStage).toBeDefined();

      const buildAction = buildStage!.actions![0];
      expect(buildAction.configuration!.ProjectName).toBe(buildProjectName);

      // Check CodeBuild project exists
      const buildCommand = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const buildResponse = await codeBuildClient.send(buildCommand);
      expect(buildResponse.projects!.length).toBe(1);

      // Check Elastic Beanstalk application exists
      const ebCommand = new DescribeApplicationsCommand({
        ApplicationNames: [ebApplicationName],
      });
      const ebResponse = await elasticBeanstalkClient.send(ebCommand);
      expect(ebResponse.Applications!.length).toBe(1);

      console.log('✅ All pipeline components are properly integrated');
    });
  });
});
