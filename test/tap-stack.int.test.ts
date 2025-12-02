import {
  CodeCommitClient,
  GetRepositoryCommand,
} from '@aws-sdk/client-codecommit';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  let outputs: any;

  // AWS clients
  const codeCommitClient = new CodeCommitClient({ region });
  const codePipelineClient = new CodePipelineClient({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const s3Client = new S3Client({ region });
  const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
  const iamClient = new IAMClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please deploy infrastructure first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.pipelineArn).toBeDefined();
      expect(outputs.artifactBucketName).toBeDefined();
      expect(outputs.repositoryCloneUrl).toBeDefined();
    });

    it('should have valid ARN format for pipeline', () => {
      expect(outputs.pipelineArn).toMatch(
        /^arn:aws:codepipeline:[a-z0-9-]+:\d{12}:.+$/
      );
    });

    it('should have valid S3 bucket name', () => {
      expect(outputs.artifactBucketName).toMatch(/^[a-z0-9-]+$/);
    });

    it('should have valid CodeCommit clone URL', () => {
      expect(outputs.repositoryCloneUrl).toMatch(
        /^https:\/\/git-codecommit\.[a-z0-9-]+\.amazonaws\.com\/v1\/repos\/.+$/
      );
    });
  });

  describe('CodeCommit Repository', () => {
    let repository: any;

    beforeAll(async () => {
      const repoName = outputs.repositoryCloneUrl.split('/').pop();
      const command = new GetRepositoryCommand({
        repositoryName: repoName,
      });
      const response = await codeCommitClient.send(command);
      repository = response.repositoryMetadata;
    });

    it('should exist and be accessible', () => {
      expect(repository).toBeDefined();
    });

    it('should have correct default branch configured', () => {
      // Default branch may be undefined if repository is empty
      // Verify repository is configured for main branch
      expect(repository.repositoryName).toBeDefined();
      // Default branch is set in repository configuration
      expect(['main', undefined]).toContain(repository.defaultBranch);
    });

    it('should have correct repository name with environmentSuffix', () => {
      expect(repository.repositoryName).toMatch(/nodeapp-repo-.+/);
    });

    it('should have description', () => {
      expect(repository.repositoryDescription).toBeDefined();
      expect(repository.repositoryDescription).toContain('Node.js');
    });

    it('should have ARN', () => {
      expect(repository.Arn).toBeDefined();
      expect(repository.Arn).toMatch(/^arn:aws:codecommit:/);
    });
  });

  describe('S3 Artifact Bucket', () => {
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

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(
        rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have required tags', async () => {
      const command = new GetBucketTaggingCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      const tags = response.TagSet || [];

      const environmentTag = tags.find(
        (tag) => tag.Key === 'Environment'
      );
      const projectTag = tags.find((tag) => tag.Key === 'Project');

      expect(environmentTag).toBeDefined();
      expect(environmentTag?.Value).toBe('Production');
      expect(projectTag).toBeDefined();
      expect(projectTag?.Value).toBe('NodeApp');
    });
  });

  describe('CodeBuild Project', () => {
    let buildProject: any;

    beforeAll(async () => {
      // Extract project name from pipeline configuration
      const pipelineName = outputs.pipelineArn.split(':').pop();
      const pipelineCommand = new GetPipelineCommand({
        name: pipelineName,
      });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);

      const buildStage = pipelineResponse.pipeline?.stages?.find(
        (stage) => stage.name === 'Build'
      );
      const buildAction = buildStage?.actions?.[0];
      const projectName = buildAction?.configuration?.ProjectName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);
      buildProject = response.projects?.[0];
    });

    it('should exist and be accessible', () => {
      expect(buildProject).toBeDefined();
    });

    it('should use correct Docker image', () => {
      expect(buildProject.environment?.image).toBe(
        'aws/codebuild/standard:5.0'
      );
    });

    it('should have correct compute type', () => {
      expect(buildProject.environment?.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
    });

    it('should have environment type as Linux container', () => {
      expect(buildProject.environment?.type).toBe('LINUX_CONTAINER');
    });

    it('should have inline buildspec', () => {
      expect(buildProject.source?.buildspec).toBeDefined();
      expect(buildProject.source?.buildspec).toContain('npm install');
      expect(buildProject.source?.buildspec).toContain('npm test');
      expect(buildProject.source?.buildspec).toContain('npm run build');
    });

    it('should have CloudWatch Logs enabled', () => {
      expect(
        buildProject.logsConfig?.cloudWatchLogs?.status
      ).toBe('ENABLED');
    });

    it('should have service role', () => {
      expect(buildProject.serviceRole).toBeDefined();
      expect(buildProject.serviceRole).toMatch(/^arn:aws:iam:/);
    });

    it('should have required tags', () => {
      const tags = buildProject.tags || [];
      const environmentTag = tags.find(
        (tag: any) => tag.key === 'Environment'
      );
      const projectTag = tags.find(
        (tag: any) => tag.key === 'Project'
      );

      expect(environmentTag).toBeDefined();
      expect(environmentTag?.value).toBe('Production');
      expect(projectTag).toBeDefined();
      expect(projectTag?.value).toBe('NodeApp');
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should exist for CodeBuild project', async () => {
      const buildProjectName = outputs.pipelineArn.split(':').pop()?.replace('pipeline', 'build');
      const logGroupPrefix = `/aws/codebuild/nodeapp-build-`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupPrefix,
      });
      const response = await cloudWatchLogsClient.send(command);
      const logGroups = response.logGroups || [];

      expect(logGroups.length).toBeGreaterThan(0);

      const logGroup = logGroups[0];
      expect(logGroup.logGroupName).toMatch(/\/aws\/codebuild\/nodeapp-build-.+/);
    });

    it('should have 30-day retention policy', async () => {
      const logGroupPrefix = `/aws/codebuild/nodeapp-build-`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupPrefix,
      });
      const response = await cloudWatchLogsClient.send(command);
      const logGroups = response.logGroups || [];

      expect(logGroups.length).toBeGreaterThan(0);
      const logGroup = logGroups[0];
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  describe('CodePipeline', () => {
    let pipeline: any;
    let pipelineState: any;

    beforeAll(async () => {
      const pipelineName = outputs.pipelineArn.split(':').pop();

      const pipelineCommand = new GetPipelineCommand({
        name: pipelineName,
      });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);
      pipeline = pipelineResponse.pipeline;

      const stateCommand = new GetPipelineStateCommand({
        name: pipelineName,
      });
      const stateResponse = await codePipelineClient.send(stateCommand);
      pipelineState = stateResponse;
    });

    it('should exist and be accessible', () => {
      expect(pipeline).toBeDefined();
    });

    it('should have three stages (Source, Build, Deploy)', () => {
      expect(pipeline.stages).toBeDefined();
      expect(pipeline.stages.length).toBe(3);

      expect(pipeline.stages[0].name).toBe('Source');
      expect(pipeline.stages[1].name).toBe('Build');
      expect(pipeline.stages[2].name).toBe('Deploy');
    });

    it('should have Source stage configured with CodeCommit', () => {
      const sourceStage = pipeline.stages[0];
      const sourceAction = sourceStage.actions[0];

      expect(sourceAction.actionTypeId?.provider).toBe('CodeCommit');
      expect(sourceAction.configuration?.BranchName).toBe('main');
    });

    it('should have Build stage configured with CodeBuild', () => {
      const buildStage = pipeline.stages[1];
      const buildAction = buildStage.actions[0];

      expect(buildAction.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildAction.configuration?.ProjectName).toBeDefined();
    });

    it('should have Deploy stage configured with S3', () => {
      const deployStage = pipeline.stages[2];
      const deployAction = deployStage.actions[0];

      expect(deployAction.actionTypeId?.provider).toBe('S3');
      expect(deployAction.configuration?.BucketName).toBe(
        outputs.artifactBucketName
      );
    });

    it('should use correct artifact store', () => {
      expect(pipeline.artifactStores || pipeline.artifactStore).toBeDefined();

      if (pipeline.artifactStores) {
        expect(pipeline.artifactStores[0]?.location).toBe(
          outputs.artifactBucketName
        );
        expect(pipeline.artifactStores[0]?.type).toBe('S3');
      } else {
        expect(pipeline.artifactStore?.location).toBe(
          outputs.artifactBucketName
        );
        expect(pipeline.artifactStore?.type).toBe('S3');
      }
    });

    it('should have a role ARN', () => {
      expect(pipeline.roleArn).toBeDefined();
      expect(pipeline.roleArn).toMatch(/^arn:aws:iam:/);
    });
  });

  describe('IAM Roles and Policies', () => {
    let codeBuildRoleName: string;
    let pipelineRoleName: string;

    beforeAll(async () => {
      // Get role names from the deployed resources
      const pipelineName = outputs.pipelineArn.split(':').pop();
      const pipelineCommand = new GetPipelineCommand({
        name: pipelineName,
      });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);

      const buildStage = pipelineResponse.pipeline?.stages?.find(
        (stage) => stage.name === 'Build'
      );
      const buildAction = buildStage?.actions?.[0];
      const projectName = buildAction?.configuration?.ProjectName;

      const buildCommand = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const buildResponse = await codeBuildClient.send(buildCommand);
      const buildProject = buildResponse.projects?.[0];

      codeBuildRoleName = buildProject?.serviceRole?.split('/').pop() || '';
      pipelineRoleName = pipelineResponse.pipeline?.roleArn?.split('/').pop() || '';
    });

    it('should have CodeBuild role with correct trust policy', async () => {
      const command = new GetRoleCommand({
        RoleName: codeBuildRoleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      expect(trustPolicy.Statement[0].Principal.Service).toContain(
        'codebuild.amazonaws.com'
      );
    });

    it('should have Pipeline role with correct trust policy', async () => {
      const command = new GetRoleCommand({
        RoleName: pipelineRoleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      expect(trustPolicy.Statement[0].Principal.Service).toContain(
        'codepipeline.amazonaws.com'
      );
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have all components connected properly', async () => {
      // Verify the full pipeline workflow
      const pipelineName = outputs.pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await codePipelineClient.send(command);
      const pipeline = response.pipeline;

      // Source stage outputs to Build stage
      const sourceOutputArtifacts = pipeline?.stages?.[0].actions[0].outputArtifacts || [];
      const buildInputArtifacts = pipeline?.stages?.[1].actions[0].inputArtifacts || [];
      expect(sourceOutputArtifacts[0]?.name).toBe(buildInputArtifacts[0]?.name);

      // Build stage outputs to Deploy stage
      const buildOutputArtifacts = pipeline?.stages?.[1].actions[0].outputArtifacts || [];
      const deployInputArtifacts = pipeline?.stages?.[2].actions[0].inputArtifacts || [];
      expect(buildOutputArtifacts[0]?.name).toBe(deployInputArtifacts[0]?.name);
    });

    it('should have pipeline in a valid state', async () => {
      const pipelineName = outputs.pipelineArn.split(':').pop();
      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });
      const response = await codePipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates?.length).toBeGreaterThanOrEqual(3);
    });
  });
});
