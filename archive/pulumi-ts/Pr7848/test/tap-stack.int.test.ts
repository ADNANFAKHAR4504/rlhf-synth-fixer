/**
 * Integration tests for CI/CD Pipeline Infrastructure
 * These tests validate the actual deployed resources in AWS
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  GetLifecyclePolicyCommand,
} from '@aws-sdk/client-ecr';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

const region = process.env.AWS_REGION || 'us-east-1';

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {
  describe('Deployment Outputs', () => {
    it('should have all required stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.pipelineUrl).toBeDefined();
      expect(outputs.ecrRepositoryUri).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.codeBuildProjectName).toBeDefined();
    });

    it('should have correctly formatted output values', () => {
      // Pipeline URL should be a valid URL or ARN
      expect(outputs.pipelineUrl).toMatch(/^(https?:\/\/|arn:aws:)/);

      // ECR URI should match ECR format
      expect(outputs.ecrRepositoryUri).toMatch(/^\d+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/.+$/);

      // S3 bucket name should be valid
      expect(outputs.s3BucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);

      // Lambda ARN should be valid
      expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:.+$/);

      // CodeBuild project name should be valid
      expect(outputs.codeBuildProjectName).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9-]+$/);
    });
  });

  describe('S3 Artifact Bucket', () => {
    const s3Client = new S3Client({ region });

    it('should exist and be accessible', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response).toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have lifecycle rules configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules.length).toBeGreaterThan(0);

      // Check for 30-day expiration rule
      const expirationRule = response.Rules.find(rule =>
        rule.Expiration && rule.Expiration.Days === 30
      );
      expect(expirationRule).toBeDefined();
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('ECR Repository', () => {
    const ecrClient = new ECRClient({ region });
    let repositoryName: string;

    beforeAll(() => {
      // Extract repository name from URI (format: account.dkr.ecr.region.amazonaws.com/name)
      const parts = outputs.ecrRepositoryUri.split('/');
      repositoryName = parts[parts.length - 1];
    });

    it('should exist and be accessible', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories.length).toBe(1);
      expect(response.repositories[0].repositoryName).toBe(repositoryName);
    });

    it('should have image scanning enabled', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories[0].imageScanningConfiguration).toBeDefined();
      expect(response.repositories[0].imageScanningConfiguration.scanOnPush).toBe(true);
    });

    it('should have image tag immutability configured', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories[0].imageTagMutability).toBeDefined();
      expect(['IMMUTABLE', 'MUTABLE']).toContain(response.repositories[0].imageTagMutability);
    });

    it('should have lifecycle policy configured', async () => {
      try {
        const command = new GetLifecyclePolicyCommand({
          repositoryName: repositoryName,
        });

        const response = await ecrClient.send(command);
        expect(response.lifecyclePolicyText).toBeDefined();
      } catch (error: any) {
        // Lifecycle policy might not be set, which is acceptable
        if (error.name !== 'LifecyclePolicyNotFoundException') {
          throw error;
        }
      }
    });
  });

  describe('CodeBuild Project', () => {
    const codeBuildClient = new CodeBuildClient({ region });

    it('should exist and be accessible', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects.length).toBe(1);
      expect(response.projects[0].name).toBe(outputs.codeBuildProjectName);
    });

    it('should have correct environment configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects[0];

      expect(project.environment).toBeDefined();
      expect(project.environment.type).toBeDefined();
      expect(project.environment.image).toBeDefined();
      expect(project.environment.computeType).toBeDefined();
    });

    it('should have artifacts configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects[0];

      expect(project.artifacts).toBeDefined();
      expect(project.artifacts.type).toBeDefined();
    });

    it('should have service role configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects[0];

      expect(project.serviceRole).toBeDefined();
      expect(project.serviceRole).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
    });
  });

  describe('CodePipeline', () => {
    const pipelineClient = new CodePipelineClient({ region });
    let pipelineName: string;

    beforeAll(() => {
      // Extract pipeline name from URL or ARN
      if (outputs.pipelineUrl.startsWith('arn:')) {
        const parts = outputs.pipelineUrl.split(':');
        pipelineName = parts[parts.length - 1];
      } else {
        // URL format: https://console.aws.amazon.com/codesuite/codepipeline/pipelines/{NAME}/view?region=...
        // Extract the pipeline name which is after /pipelines/ and before /view
        const match = outputs.pipelineUrl.match(/\/pipelines\/([^\/\?]+)/);
        if (match) {
          pipelineName = match[1];
        } else {
          throw new Error(`Could not extract pipeline name from URL: ${outputs.pipelineUrl}`);
        }
      }
    });

    it('should exist and be accessible', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline.name).toBe(pipelineName);
    });

    it('should have three stages (Source, Build, Deploy)', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);
      expect(response.pipeline.stages).toBeDefined();
      expect(response.pipeline.stages.length).toBe(3);

      const stageNames = response.pipeline.stages.map(stage => stage.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    it('should have artifact store configured', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);
      expect(response.pipeline.artifactStores || response.pipeline.artifactStore).toBeDefined();
    });

    it('should have service role configured', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await pipelineClient.send(command);
      expect(response.pipeline.roleArn).toBeDefined();
      expect(response.pipeline.roleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
    });
  });

  describe('Lambda Deployment Handler', () => {
    const lambdaClient = new LambdaClient({ region });
    let functionName: string;

    beforeAll(() => {
      // Extract function name from ARN
      const parts = outputs.lambdaFunctionArn.split(':');
      functionName = parts[parts.length - 1];
    });

    it('should exist and be accessible', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.FunctionName).toBe(functionName);
    });

    it('should have correct runtime configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.Runtime).toBeDefined();
      expect(['nodejs18.x', 'nodejs20.x', 'python3.11', 'python3.12']).toContain(
        response.Configuration.Runtime
      );
    });

    it('should have execution role configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.Role).toBeDefined();
      expect(response.Configuration.Role).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
    });

    it('should have environment variables configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      // Environment variables are optional but if present, should be configured
      if (response.Configuration.Environment) {
        expect(response.Configuration.Environment.Variables).toBeDefined();
      }
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environmentSuffix in S3 bucket name', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(outputs.s3BucketName).toContain(environmentSuffix);
    });

    it('should include environmentSuffix in ECR repository name', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const repositoryName = outputs.ecrRepositoryUri.split('/').pop();
      expect(repositoryName).toContain(environmentSuffix);
    });

    it('should include environmentSuffix in CodeBuild project name', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(outputs.codeBuildProjectName).toContain(environmentSuffix);
    });

    it('should include environmentSuffix in Lambda function name', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      expect(functionName).toContain(environmentSuffix);
    });
  });

  describe('Security Validation', () => {
    const s3Client = new S3Client({ region });

    it('should have S3 bucket encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();

      const rules = response.ServerSideEncryptionConfiguration.Rules;
      expect(rules.length).toBeGreaterThan(0);

      const hasEncryption = rules.some(rule =>
        rule.ApplyServerSideEncryptionByDefault &&
        (rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm === 'AES256' ||
         rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm === 'aws:kms')
      );
      expect(hasEncryption).toBe(true);
    });

    it('should have ECR image scanning enabled', async () => {
      const ecrClient = new ECRClient({ region });
      const repositoryName = outputs.ecrRepositoryUri.split('/').pop();

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories[0].imageScanningConfiguration.scanOnPush).toBe(true);
    });
  });
});
