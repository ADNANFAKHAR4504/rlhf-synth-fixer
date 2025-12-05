import fs from 'fs';
import {
  CodeCommitClient,
  GetRepositoryCommand,
} from '@aws-sdk/client-codecommit';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import { EventBridgeClient, ListRulesCommand, ListTargetsByRuleCommand } from '@aws-sdk/client-eventbridge';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'c7z6c7c5';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const codecommitClient = new CodeCommitClient({ region });
const s3Client = new S3Client({ region });
const codepipelineClient = new CodePipelineClient({ region });
const codebuildClient = new CodeBuildClient({ region });
const eventbridgeClient = new EventBridgeClient({ region });

describe('CI/CD Pipeline Integration Tests', () => {
  describe('CodeCommit Repository', () => {
    test('should exist with correct name and be accessible', async () => {
      const repositoryName = `nodejs-webapp-${environmentSuffix}`;

      const command = new GetRepositoryCommand({ repositoryName });
      const response = await codecommitClient.send(command);

      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repositoryName);
      // defaultBranch is undefined for newly created empty repositories
      // This is expected behavior for CodeCommit
      expect(response.repositoryMetadata?.cloneUrlHttp).toBe(
        outputs.RepositoryCloneURL
      );
    });

    test('repository clone URL should match stack output', () => {
      expect(outputs.RepositoryCloneURL).toContain(
        `nodejs-webapp-${environmentSuffix}`
      );
      expect(outputs.RepositoryCloneURL).toContain('codecommit');
      expect(outputs.RepositoryCloneURL).toContain(region);
    });
  });

  describe('S3 Deployment Bucket', () => {
    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.WebsiteBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('bucket name should include environmentSuffix', () => {
      expect(outputs.WebsiteBucketName).toContain(environmentSuffix);
      expect(outputs.WebsiteBucketName).toBe(
        `nodejs-webapp-site-${environmentSuffix}`
      );
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.WebsiteBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('S3 Cache Bucket', () => {
    test('should exist and be accessible', async () => {
      const cacheBucketName = `codebuild-cache-${environmentSuffix}`;

      const command = new HeadBucketCommand({
        Bucket: cacheBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('CodeBuild Project', () => {
    test('should exist with correct configuration', async () => {
      const projectName = `nodejs-webapp-build-${environmentSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);

      const project = response.projects![0];
      expect(project.name).toBe(projectName);
      expect(project.environment?.image).toBe('aws/codebuild/standard:7.0');
      expect(project.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('should have NODE_ENV environment variable configured', async () => {
      const projectName = `nodejs-webapp-build-${environmentSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      const project = response.projects![0];
      const envVars = project.environment?.environmentVariables || [];
      const nodeEnvVar = envVars.find((v) => v.name === 'NODE_ENV');

      expect(nodeEnvVar).toBeDefined();
      expect(nodeEnvVar?.value).toBe('production');
      expect(nodeEnvVar?.type).toBe('PLAINTEXT');
    });

    test('should have S3 caching enabled', async () => {
      const projectName = `nodejs-webapp-build-${environmentSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      const project = response.projects![0];
      expect(project.cache?.type).toBe('S3');
      expect(project.cache?.location).toContain('codebuild-cache');
      expect(project.cache?.location).toContain(environmentSuffix);
    });

    test('should have correct buildspec configuration', async () => {
      const projectName = `nodejs-webapp-build-${environmentSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      const project = response.projects![0];
      expect(project.source?.buildspec).toBeDefined();

      const buildspec = JSON.parse(project.source!.buildspec!);
      expect(buildspec.version).toBe('0.2');
      expect(buildspec.phases.install.commands).toContain('npm install');
      expect(buildspec.phases.pre_build.commands).toContain('npm test');
      expect(buildspec.phases.build.commands).toContain('npm run build');
      expect(buildspec.artifacts['base-directory']).toBe('build');
    });
  });

  describe('CodePipeline', () => {
    test('should exist with correct name', async () => {
      const pipelineName = `nodejs-webapp-pipeline-${environmentSuffix}`;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    test('pipeline ARN should match stack output', () => {
      expect(outputs.PipelineARN).toContain(
        `nodejs-webapp-pipeline-${environmentSuffix}`
      );
      expect(outputs.PipelineARN).toContain('codepipeline');
      expect(outputs.PipelineARN).toContain(region);
    });

    test('should have three stages: Source, Build, Deploy', async () => {
      const pipelineName = `nodejs-webapp-pipeline-${environmentSuffix}`;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      const stages = response.pipeline?.stages || [];
      expect(stages.length).toBe(3);

      expect(stages[0].name).toBe('Source');
      expect(stages[1].name).toBe('Build');
      expect(stages[2].name).toBe('Deploy');
    });

    test('Source stage should use CodeCommit with main branch', async () => {
      const pipelineName = `nodejs-webapp-pipeline-${environmentSuffix}`;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Source'
      );
      expect(sourceStage).toBeDefined();

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.actionTypeId?.category).toBe('Source');
      expect(sourceAction?.actionTypeId?.provider).toBe('CodeCommit');
      expect(sourceAction?.configuration?.BranchName).toBe('main');
      expect(sourceAction?.configuration?.PollForSourceChanges).toBe('false');
    });

    test('Build stage should use CodeBuild', async () => {
      const pipelineName = `nodejs-webapp-pipeline-${environmentSuffix}`;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      const buildStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Build'
      );
      expect(buildStage).toBeDefined();

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.actionTypeId?.category).toBe('Build');
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildAction?.configuration?.ProjectName).toContain(
        `nodejs-webapp-build-${environmentSuffix}`
      );
    });

    test('Deploy stage should use S3', async () => {
      const pipelineName = `nodejs-webapp-pipeline-${environmentSuffix}`;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      const deployStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Deploy'
      );
      expect(deployStage).toBeDefined();

      const deployAction = deployStage?.actions?.[0];
      expect(deployAction?.actionTypeId?.category).toBe('Deploy');
      expect(deployAction?.actionTypeId?.provider).toBe('S3');
      expect(deployAction?.configuration?.BucketName).toBe(
        outputs.WebsiteBucketName
      );
      expect(deployAction?.configuration?.Extract).toBe('true');
    });
  });

  describe('EventBridge Rule (Automatic Triggering)', () => {
    test('should exist for CodeCommit repository events', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'TapStackc7z6c7c5-NodejsWebappRepo',
      });
      const response = await eventbridgeClient.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const rule = response.Rules![0];
      expect(rule.State).toBe('ENABLED');
      expect(rule.EventPattern).toBeDefined();

      const eventPattern = JSON.parse(rule.EventPattern!);
      expect(eventPattern.source).toContain('aws.codecommit');
      expect(eventPattern['detail-type']).toContain(
        'CodeCommit Repository State Change'
      );
      expect(eventPattern.detail.referenceName).toContain('main');
    });

    test('EventBridge rule should target the pipeline', async () => {
      const listCommand = new ListRulesCommand({
        NamePrefix: 'TapStackc7z6c7c5-NodejsWebappRepo',
      });
      const listResponse = await eventbridgeClient.send(listCommand);

      const rule = listResponse.Rules![0];

      const targetsCommand = new ListTargetsByRuleCommand({
        Rule: rule.Name!,
      });
      const targetsResponse = await eventbridgeClient.send(targetsCommand);

      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets!.length).toBeGreaterThan(0);

      const target = targetsResponse.Targets![0];
      expect(target.Arn).toContain('codepipeline');
      expect(target.Arn).toContain(
        `nodejs-webapp-pipeline-${environmentSuffix}`
      );
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all resource names should include environmentSuffix', () => {
      expect(outputs.WebsiteBucketName).toContain(environmentSuffix);
      expect(outputs.RepositoryCloneURL).toContain(environmentSuffix);
      expect(outputs.PipelineARN).toContain(environmentSuffix);
    });

    test('all resources should be in the correct region', () => {
      expect(outputs.RepositoryCloneURL).toContain(region);
      expect(outputs.PipelineARN).toContain(region);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('complete CI/CD pipeline infrastructure should be functional', async () => {
      // Verify all key components exist and are properly connected
      const repositoryName = `nodejs-webapp-${environmentSuffix}`;
      const projectName = `nodejs-webapp-build-${environmentSuffix}`;
      const pipelineName = `nodejs-webapp-pipeline-${environmentSuffix}`;

      // Check repository
      const repoCommand = new GetRepositoryCommand({ repositoryName });
      const repoResponse = await codecommitClient.send(repoCommand);
      expect(repoResponse.repositoryMetadata).toBeDefined();

      // Check build project
      const buildCommand = new BatchGetProjectsCommand({ names: [projectName] });
      const buildResponse = await codebuildClient.send(buildCommand);
      expect(buildResponse.projects?.length).toBe(1);

      // Check pipeline
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);
      expect(pipelineResponse.pipeline).toBeDefined();

      // Check deployment bucket
      const bucketCommand = new HeadBucketCommand({
        Bucket: outputs.WebsiteBucketName,
      });
      const bucketResponse = await s3Client.send(bucketCommand);
      expect(bucketResponse.$metadata.httpStatusCode).toBe(200);

      // All components verified - pipeline is ready for use
      expect(true).toBe(true);
    });
  });
});
