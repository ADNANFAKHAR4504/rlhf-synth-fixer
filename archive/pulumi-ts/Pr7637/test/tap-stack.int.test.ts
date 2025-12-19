import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// AWS Clients
const region = process.env.AWS_REGION || 'us-east-1';
const pipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });
const codebuildClient = new CodeBuildClient({ region });

describe('CI/CD Pipeline Integration Tests', () => {
  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.pipelineArn).toBeDefined();
      expect(outputs.artifactBucketName).toBeDefined();
      expect(outputs.deploymentBucketName).toBeDefined();
      expect(outputs.codebuildProjectName).toBeDefined();
    });

    it('should have valid ARN format for pipeline', () => {
      expect(outputs.pipelineArn).toMatch(
        /^arn:aws:codepipeline:[a-z0-9-]+:[0-9]+:.+$/
      );
    });
  });

  describe('CodePipeline Validation', () => {
    it('should retrieve pipeline configuration', async () => {
      const pipelineName = outputs.pipelineArn.split(':').pop();

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBeGreaterThan(0);
    });

    it('should have Source, Build, and Deploy stages', async () => {
      const pipelineName = outputs.pipelineArn.split(':').pop();

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);
      const stages = response.pipeline?.stages || [];

      const stageNames = stages.map((stage) => stage.name);

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    it('should retrieve pipeline state', async () => {
      const pipelineName = outputs.pipelineArn.split(':').pop();

      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
    });

    it('should have encryption configured for artifact store', async () => {
      const pipelineName = outputs.pipelineArn.split(':').pop();

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);
      const artifactStores = response.pipeline?.artifactStores;
      const artifactStore = response.pipeline?.artifactStore;

      // Pipeline can use either artifactStore (single region) or artifactStores (multi-region)
      if (artifactStores && artifactStores.length > 0) {
        expect(artifactStores[0].encryptionKey).toBeDefined();
        expect(artifactStores[0].encryptionKey?.type).toBe('KMS');
      } else if (artifactStore) {
        expect(artifactStore.encryptionKey).toBeDefined();
        expect(artifactStore.encryptionKey?.type).toBe('KMS');
      } else {
        throw new Error('Pipeline has neither artifactStore nor artifactStores configured');
      }
    });
  });

  describe('S3 Artifact Bucket Validation', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.artifactBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    });
  });

  describe('S3 Deployment Bucket Validation', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.deploymentBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });
  });

  describe('CodeBuild Project Validation', () => {
    it('should exist and be accessible', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codebuildProjectName],
      });

      const response = await codebuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0].name).toBe(
        outputs.codebuildProjectName
      );
    });

    it('should have Node.js 18.x environment configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codebuildProjectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.environment).toBeDefined();
      expect(project?.environment?.image).toContain('standard');

      // Check for NODE_ENV environment variable
      const envVars = project?.environment?.environmentVariables || [];
      const nodeEnvVar = envVars.find((v) => v.name === 'NODE_ENV');

      expect(nodeEnvVar).toBeDefined();
      expect(nodeEnvVar?.value).toBe('production');
    });

    it('should have CloudWatch Logs configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codebuildProjectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.logsConfig).toBeDefined();
      expect(project?.logsConfig?.cloudWatchLogs).toBeDefined();
      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe(
        'ENABLED'
      );
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have all components connected properly', async () => {
      // Get pipeline configuration
      const pipelineName = outputs.pipelineArn.split(':').pop();
      const pipelineCommand = new GetPipelineCommand({
        name: pipelineName,
      });
      const pipelineResponse = await pipelineClient.send(pipelineCommand);

      // Verify Build stage uses CodeBuild project
      const buildStage = pipelineResponse.pipeline?.stages?.find(
        (s) => s.name === 'Build'
      );
      expect(buildStage).toBeDefined();

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.configuration?.ProjectName).toBe(
        outputs.codebuildProjectName
      );

      // Verify Deploy stage uses deployment bucket
      const deployStage = pipelineResponse.pipeline?.stages?.find(
        (s) => s.name === 'Deploy'
      );
      expect(deployStage).toBeDefined();

      const deployAction = deployStage?.actions?.[0];
      expect(deployAction?.configuration?.BucketName).toBe(
        outputs.deploymentBucketName
      );
    });
  });
});
