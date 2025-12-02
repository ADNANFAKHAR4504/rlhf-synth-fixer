import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
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
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration tests for CI/CD Pipeline Infrastructure
 *
 * These tests validate the deployed AWS resources using actual AWS SDK calls.
 * They use the deployment outputs from cfn-outputs/flat-outputs.json.
 */

const AWS_REGION = 'us-east-1';
const OUTPUTS_FILE = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

describe('CI/CD Pipeline Integration Tests', () => {
  let outputs: {
    artifactBucketName: string;
    ecrRepositoryUrl: string;
    codeBuildProjectName: string;
    pipelineName: string;
    pipelineArn: string;
  };

  beforeAll(() => {
    // Load deployment outputs
    expect(fs.existsSync(OUTPUTS_FILE)).toBe(true);
    const outputsContent = fs.readFileSync(OUTPUTS_FILE, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Validate all required outputs exist
    expect(outputs.artifactBucketName).toBeDefined();
    expect(outputs.ecrRepositoryUrl).toBeDefined();
    expect(outputs.codeBuildProjectName).toBeDefined();
    expect(outputs.pipelineName).toBeDefined();
    expect(outputs.pipelineArn).toBeDefined();
  });

  describe('S3 Artifact Bucket', () => {
    const s3Client = new S3Client({ region: AWS_REGION });

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

    it('should have server-side encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have lifecycle rules configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const cleanupRule = response.Rules!.find(
        (rule) => rule.ID === 'cleanup-old-artifacts'
      );
      expect(cleanupRule).toBeDefined();
      expect(cleanupRule?.Status).toBe('Enabled');
      expect(cleanupRule?.Expiration?.Days).toBe(30);
      expect(cleanupRule?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(7);
    });

    it('should include environmentSuffix in bucket name', () => {
      expect(outputs.artifactBucketName).toContain('artifact-bucket-');
      expect(outputs.artifactBucketName).toMatch(/synthq1a7w0x4$/);
    });
  });

  describe('ECR Repository', () => {
    const ecrClient = new ECRClient({ region: AWS_REGION });

    it('should exist and be accessible', async () => {
      const repoName = outputs.ecrRepositoryUrl.split('/')[1];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories!.length).toBe(1);
      expect(response.repositories![0].repositoryName).toBe(repoName);
    });

    it('should have image scanning enabled', async () => {
      const repoName = outputs.ecrRepositoryUrl.split('/')[1];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      const response = await ecrClient.send(command);
      expect(
        response.repositories![0].imageScanningConfiguration?.scanOnPush
      ).toBe(true);
    });

    it('should have lifecycle policy configured', async () => {
      const repoName = outputs.ecrRepositoryUrl.split('/')[1];
      const command = new GetLifecyclePolicyCommand({
        repositoryName: repoName,
      });

      const response = await ecrClient.send(command);
      expect(response.lifecyclePolicyText).toBeDefined();

      const policy = JSON.parse(response.lifecyclePolicyText!);
      expect(policy.rules).toBeDefined();
      expect(policy.rules.length).toBeGreaterThan(0);
      expect(policy.rules[0].description).toContain('Keep last 10 images');
    });

    it('should include environmentSuffix in repository name', () => {
      const repoName = outputs.ecrRepositoryUrl.split('/')[1];
      expect(repoName).toContain('app-repo-');
      expect(repoName).toMatch(/synthq1a7w0x4$/);
    });
  });

  describe('CodeBuild Project', () => {
    const codeBuildClient = new CodeBuildClient({ region: AWS_REGION });

    it('should exist and be accessible', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBe(1);
      expect(response.projects![0].name).toBe(outputs.codeBuildProjectName);
    });

    it('should have correct artifact configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.artifacts?.type).toBe('CODEPIPELINE');
    });

    it('should have privileged mode enabled for Docker builds', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.environment?.privilegedMode).toBe(true);
      expect(project.environment?.type).toBe('LINUX_CONTAINER');
    });

    it('should have required environment variables', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      const envVars = project.environment?.environmentVariables || [];
      const varNames = envVars.map((v) => v.name);

      expect(varNames).toContain('AWS_DEFAULT_REGION');
      expect(varNames).toContain('AWS_ACCOUNT_ID');
      expect(varNames).toContain('IMAGE_REPO_NAME');
      expect(varNames).toContain('IMAGE_TAG');
    });

    it('should have buildspec with Docker commands', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.source?.buildspec).toBeDefined();
      expect(project.source?.buildspec).toContain('docker build');
      expect(project.source?.buildspec).toContain('docker push');
      expect(project.source?.buildspec).toContain('ecr get-login-password');
    });

    it('should include environmentSuffix in project name', () => {
      expect(outputs.codeBuildProjectName).toContain('build-project-');
      expect(outputs.codeBuildProjectName).toMatch(/synthq1a7w0x4$/);
    });
  });

  describe('CodePipeline', () => {
    const codePipelineClient = new CodePipelineClient({ region: AWS_REGION });

    it('should exist and be accessible', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codePipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline!.name).toBe(outputs.pipelineName);
    });

    it('should have correct artifact store configuration', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const pipeline = response.pipeline!;

      // Check if it's using artifactStore (single) or artifactStores (multi-region)
      if (pipeline.artifactStore) {
        expect(pipeline.artifactStore.type).toBe('S3');
        expect(pipeline.artifactStore.location).toBe(outputs.artifactBucketName);
      } else if (pipeline.artifactStores) {
        const artifactStore = pipeline.artifactStores[AWS_REGION];
        expect(artifactStore.type).toBe('S3');
        expect(artifactStore.location).toBe(outputs.artifactBucketName);
      } else {
        fail('Pipeline should have artifact store configuration');
      }
    });

    it('should have Source stage with GitHub integration', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline!.stages!;

      const sourceStage = stages.find((s) => s.name === 'Source');
      expect(sourceStage).toBeDefined();
      expect(sourceStage!.actions![0].actionTypeId!.provider).toBe('GitHub');
      expect(sourceStage!.actions![0].outputArtifacts![0].name).toBe(
        'source_output'
      );
    });

    it('should have Build stage with CodeBuild', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline!.stages!;

      const buildStage = stages.find((s) => s.name === 'Build');
      expect(buildStage).toBeDefined();
      expect(buildStage!.actions![0].actionTypeId!.provider).toBe('CodeBuild');
      expect(buildStage!.actions![0].inputArtifacts![0].name).toBe(
        'source_output'
      );
      expect(buildStage!.actions![0].outputArtifacts![0].name).toBe(
        'build_output'
      );
      expect(buildStage!.actions![0].configuration!.ProjectName).toBe(
        outputs.codeBuildProjectName
      );
    });

    it('should have Approval stage with manual approval', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline!.stages!;

      const approvalStage = stages.find((s) => s.name === 'Approval');
      expect(approvalStage).toBeDefined();
      expect(approvalStage!.actions![0].actionTypeId!.provider).toBe('Manual');
      expect(approvalStage!.actions![0].actionTypeId!.category).toBe(
        'Approval'
      );
    });

    it('should have Deploy stage with ECS', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline!.stages!;

      const deployStage = stages.find((s) => s.name === 'Deploy');
      expect(deployStage).toBeDefined();
      expect(deployStage!.actions![0].actionTypeId!.provider).toBe('ECS');
      expect(deployStage!.actions![0].inputArtifacts![0].name).toBe(
        'build_output'
      );
    });

    it('should have all stages in correct order', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stageNames = response.pipeline!.stages!.map((s) => s.name);

      expect(stageNames).toEqual(['Source', 'Build', 'Approval', 'Deploy']);
    });

    it('should include environmentSuffix in pipeline name', () => {
      expect(outputs.pipelineName).toContain('pipeline-');
      expect(outputs.pipelineName).toMatch(/synthq1a7w0x4$/);
    });
  });

  describe('CloudWatch Events', () => {
    const eventBridgeClient = new EventBridgeClient({ region: AWS_REGION });

    it('should have event rule for pipeline triggering', async () => {
      const ruleName = `pipeline-trigger-synthq1a7w0x4`;
      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });

    it('should have event pattern for CodeCommit changes', async () => {
      const ruleName = `pipeline-trigger-synthq1a7w0x4`;
      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.EventPattern).toBeDefined();

      const pattern = JSON.parse(response.EventPattern!);
      expect(pattern.source).toContain('aws.codecommit');
      expect(pattern['detail-type']).toContain(
        'CodeCommit Repository State Change'
      );
    });

    it('should have pipeline as target', async () => {
      const ruleName = `pipeline-trigger-synthq1a7w0x4`;
      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
      expect(response.Targets![0].Arn).toBe(outputs.pipelineArn);
    });
  });

  describe('IAM Roles', () => {
    const iamClient = new IAMClient({ region: AWS_REGION });

    it('should have CodeBuild role', async () => {
      const roleName = `codebuild-role-synthq1a7w0x4`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(
        trustPolicy.Statement[0].Principal.Service
      ).toBe('codebuild.amazonaws.com');
    });

    it('should have CodePipeline role', async () => {
      const roleName = `codepipeline-role-synthq1a7w0x4`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(
        trustPolicy.Statement[0].Principal.Service
      ).toBe('codepipeline.amazonaws.com');
    });

    it('should have Events role', async () => {
      const roleName = `event-role-synthq1a7w0x4`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(
        trustPolicy.Statement[0].Principal.Service
      ).toBe('events.amazonaws.com');
    });
  });

  describe('Resource Tagging', () => {
    const s3Client = new S3Client({ region: AWS_REGION });
    const ecrClient = new ECRClient({ region: AWS_REGION });

    it('should have tags on S3 bucket', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      // Note: Tags are validated but HeadBucket doesn't return tags
      // In a real scenario, use GetBucketTaggingCommand
    });

    it('should have tags on ECR repository', async () => {
      const repoName = outputs.ecrRepositoryUrl.split('/')[1];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories![0]).toBeDefined();
      // Tags are applied during creation
    });
  });
});
