import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  GetBucketVersioningCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  GetLifecyclePolicyCommand,
} from '@aws-sdk/client-ecr';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  ListRolesCommand,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  CodeBuildClient,
  ListProjectsCommand,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  ListPipelinesCommand,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'g1x4e1u1';

  const s3Client = new S3Client({ region });
  const ecrClient = new ECRClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });
  const iamClient = new IAMClient({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const codePipelineClient = new CodePipelineClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    expect(outputs).toBeDefined();
  });

  describe('Stack Outputs Validation', () => {
    it('should have pipelineUrl output', () => {
      expect(outputs.pipelineUrl).toBeDefined();
      expect(outputs.pipelineUrl).toContain('console.aws.amazon.com');
      expect(outputs.pipelineUrl).toContain('codepipeline');
    });

    it('should have ecrRepositoryUri output', () => {
      expect(outputs.ecrRepositoryUri).toBeDefined();
      expect(outputs.ecrRepositoryUri).toContain('dkr.ecr');
      expect(outputs.ecrRepositoryUri).toContain(region);
    });
  });

  describe('S3 Bucket Validation', () => {
    it('should exist with versioning enabled', async () => {
      const buckets = await s3Client.send(new ListBucketsCommand({}));
      const artifactBucket = buckets.Buckets?.find((b) =>
        b.Name?.includes(`pipeline-artifacts-${environmentSuffix}`)
      );

      expect(artifactBucket).toBeDefined();

      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: artifactBucket!.Name,
      });
      const versioning = await s3Client.send(versioningCommand);
      expect(versioning.Status).toBe('Enabled');
    });
  });

  describe('ECR Repository Validation', () => {
    let repositoryName: string;

    beforeAll(() => {
      // Extract repository name from URI
      const uri = outputs.ecrRepositoryUri;
      repositoryName = uri.split('/')[1];
    });

    it('should exist and be accessible', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });
      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories!.length).toBe(1);
    });

    it('should have lifecycle policy to keep last 10 images', async () => {
      const command = new GetLifecyclePolicyCommand({
        repositoryName,
      });
      const response = await ecrClient.send(command);
      const policy = JSON.parse(response.lifecyclePolicyText!);

      const rule = policy.rules[0];
      expect(rule.selection.countType).toBe('imageCountMoreThan');
      expect(rule.selection.countNumber).toBe(10);
      expect(rule.action.type).toBe('expire');
    });
  });

  describe('CloudWatch Log Group Validation', () => {
    it('should have 30-day retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `codebuild-logs-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  describe('IAM Role Validation - CodeBuild', () => {
    let roleName: string;

    beforeAll(async () => {
      const listRoles = await iamClient.send(new ListRolesCommand({}));
      const role = listRoles.Roles?.find((r) =>
        r.RoleName?.includes(`codebuild-role-${environmentSuffix}`)
      );
      roleName = role!.RoleName!;
    });

    it('should exist and have correct assume role policy', async () => {
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();

      const policy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(policy.Statement[0].Principal.Service).toContain(
        'codebuild.amazonaws.com'
      );
    });

    it('should have required IAM policies attached', async () => {
      const command = new ListRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const hasEcrPolicy = response.PolicyNames?.some((p) =>
        p.includes('ecr')
      );
      const hasS3Policy = response.PolicyNames?.some((p) =>
        p.includes('s3')
      );
      const hasLogsPolicy = response.PolicyNames?.some((p) =>
        p.includes('logs')
      );

      expect(hasEcrPolicy).toBe(true);
      expect(hasS3Policy).toBe(true);
      expect(hasLogsPolicy).toBe(true);
    });

    it('should have correct ECR permissions', async () => {
      const listCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const policies = await iamClient.send(listCommand);
      const ecrPolicyName = policies.PolicyNames?.find((p) =>
        p.includes('ecr')
      );

      const getCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: ecrPolicyName!,
      });
      const response = await iamClient.send(getCommand);
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));

      const actions = policy.Statement[0].Action;
      expect(actions).toContain('ecr:GetAuthorizationToken');
      expect(actions).toContain('ecr:PutImage');
    });
  });

  describe('IAM Role Validation - CodePipeline', () => {
    let roleName: string;

    beforeAll(async () => {
      const listRoles = await iamClient.send(new ListRolesCommand({}));
      const role = listRoles.Roles?.find((r) =>
        r.RoleName?.includes(`pipeline-role-${environmentSuffix}`)
      );
      roleName = role!.RoleName!;
    });

    it('should exist and have correct assume role policy', async () => {
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();

      const policy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(policy.Statement[0].Principal.Service).toContain(
        'codepipeline.amazonaws.com'
      );
    });

    it('should have pipeline policy attached', async () => {
      const command = new ListRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      const hasPipelinePolicy = response.PolicyNames?.some((p) =>
        p.includes('pipeline')
      );
      expect(hasPipelinePolicy).toBe(true);
    });
  });

  describe('CodeBuild Project Validation', () => {
    let projectName: string;

    beforeAll(async () => {
      const command = new ListProjectsCommand({});
      const response = await codeBuildClient.send(command);
      projectName = response.projects?.find((p) =>
        p.startsWith(`docker-build-${environmentSuffix}`)
      )!;
    });

    it('should exist and have correct environment configuration', async () => {
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBe(1);

      const project = response.projects![0];
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.privilegedMode).toBe(true);
    });

    it('should have required environment variables', async () => {
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);
      const project = response.projects![0];
      const envVars = project.environment!.environmentVariables!;

      const hasRegion = envVars.some((v) => v.name === 'AWS_DEFAULT_REGION');
      const hasAccountId = envVars.some((v) => v.name === 'AWS_ACCOUNT_ID');
      const hasRepoName = envVars.some((v) => v.name === 'IMAGE_REPO_NAME');
      const hasImageTag = envVars.some((v) => v.name === 'IMAGE_TAG');

      expect(hasRegion).toBe(true);
      expect(hasAccountId).toBe(true);
      expect(hasRepoName).toBe(true);
      expect(hasImageTag).toBe(true);
    });

    it('should use CODEPIPELINE as artifact type', async () => {
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);
      const project = response.projects![0];
      expect(project.artifacts!.type).toBe('CODEPIPELINE');
    });
  });

  describe('CodePipeline Validation', () => {
    let pipelineName: string;

    beforeAll(async () => {
      const command = new ListPipelinesCommand({});
      const response = await codePipelineClient.send(command);
      const pipeline = response.pipelines?.find((p) =>
        p.name?.startsWith(`app-pipeline-${environmentSuffix}`)
      );
      pipelineName = pipeline!.name!;
    });

    it('should exist and have required stages', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      expect(response.pipeline).toBeDefined();

      const stages = response.pipeline!.stages!;
      const sourceStage = stages.find((s) => s.name === 'Source');
      const buildStage = stages.find((s) => s.name === 'Build');
      const approvalStage = stages.find((s) => s.name === 'Approval');

      expect(sourceStage).toBeDefined();
      expect(buildStage).toBeDefined();
      expect(approvalStage).toBeDefined();
    });

    it('should use CodeStarSourceConnection for Source stage', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      const sourceStage = response.pipeline!.stages!.find(
        (s) => s.name === 'Source'
      );
      const sourceAction = sourceStage!.actions![0];
      expect(sourceAction.actionTypeId!.provider).toBe(
        'CodeStarSourceConnection'
      );
    });

    it('should use CodeBuild for Build stage', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      const buildStage = response.pipeline!.stages!.find(
        (s) => s.name === 'Build'
      );
      const buildAction = buildStage!.actions![0];
      expect(buildAction.actionTypeId!.provider).toBe('CodeBuild');
    });

    it('should use Manual approval for Approval stage', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      const approvalStage = response.pipeline!.stages!.find(
        (s) => s.name === 'Approval'
      );
      const approvalAction = approvalStage!.actions![0];
      expect(approvalAction.actionTypeId!.category).toBe('Approval');
      expect(approvalAction.actionTypeId!.provider).toBe('Manual');
    });

    it('should use S3 for artifact store', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      const artifactStore = response.pipeline!.artifactStore!;
      expect(artifactStore.type).toBe('S3');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have all resources properly connected', async () => {
      // Get pipeline
      const listPipelines = await codePipelineClient.send(
        new ListPipelinesCommand({})
      );
      const pipeline = listPipelines.pipelines?.find((p) =>
        p.name?.startsWith(`app-pipeline-${environmentSuffix}`)
      );

      // Get pipeline details
      const pipelineCommand = new GetPipelineCommand({
        name: pipeline!.name!,
      });
      const pipelineDetails = await codePipelineClient.send(pipelineCommand);

      const buildStage = pipelineDetails.pipeline!.stages!.find(
        (s) => s.name === 'Build'
      );
      const projectName = buildStage!.actions![0].configuration!.ProjectName;

      // Verify CodeBuild project exists
      const projectCommand = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const project = await codeBuildClient.send(projectCommand);
      expect(project.projects!.length).toBe(1);
    });
  });
});
