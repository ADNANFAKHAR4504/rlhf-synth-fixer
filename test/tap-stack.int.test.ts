import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
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
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';

const REGION = 'us-east-1';
const OUTPUTS_FILE = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {
  let outputs: any;
  let s3Client: S3Client;
  let ecrClient: ECRClient;
  let codeBuildClient: CodeBuildClient;
  let codePipelineClient: CodePipelineClient;
  let iamClient: IAMClient;

  beforeAll(() => {
    // Read deployment outputs
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(
        `Outputs file not found at ${OUTPUTS_FILE}. Please deploy the infrastructure first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, 'utf-8'));

    // Initialize AWS clients
    s3Client = new S3Client({ region: REGION });
    ecrClient = new ECRClient({ region: REGION });
    codeBuildClient = new CodeBuildClient({ region: REGION });
    codePipelineClient = new CodePipelineClient({ region: REGION });
    iamClient = new IAMClient({ region: REGION });
  });

  describe('S3 Artifact Bucket', () => {
    it('should exist and be accessible', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.artifactBucketName;

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have server-side encryption enabled', async () => {
      const bucketName = outputs.artifactBucketName;

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });
  });

  describe('ECR Repository', () => {
    it('should exist and be accessible', async () => {
      const repositoryUrl = outputs.ecrRepositoryUrl;
      expect(repositoryUrl).toBeDefined();

      const repositoryName = repositoryUrl.split('/')[1];

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toHaveLength(1);
      expect(response.repositories?.[0]?.repositoryName).toBe(repositoryName);
    });

    it('should have lifecycle policy configured', async () => {
      const repositoryUrl = outputs.ecrRepositoryUrl;
      const repositoryName = repositoryUrl.split('/')[1];

      const command = new GetLifecyclePolicyCommand({
        repositoryName: repositoryName,
      });
      const response = await ecrClient.send(command);

      expect(response.lifecyclePolicyText).toBeDefined();

      const policy = JSON.parse(response.lifecyclePolicyText || '{}');
      expect(policy.rules).toBeDefined();
      expect(policy.rules).toHaveLength(1);

      // Verify rule retains last 10 images
      expect(policy.rules[0].selection.countNumber).toBe(10);
      expect(policy.rules[0].selection.countType).toBe('imageCountMoreThan');
    });
  });

  describe('CodeBuild Project', () => {
    it('should exist and be configured correctly', async () => {
      const pipelineName = outputs.pipelineName;
      const projectName = pipelineName.replace('ecs-pipeline-', 'docker-build-');

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toHaveLength(1);
      const project = response.projects?.[0];

      expect(project?.name).toBe(projectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project?.environment?.privilegedMode).toBe(true);
    });

    it('should have inline buildspec configured', async () => {
      const pipelineName = outputs.pipelineName;
      const projectName = pipelineName.replace('ecs-pipeline-', 'docker-build-');

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.source?.buildspec).toBeDefined();
      expect(project?.source?.buildspec).toContain('version: 0.2');
      expect(project?.source?.buildspec).toContain('phases');
    });
  });

  describe('CodePipeline', () => {
    it('should exist and be accessible', async () => {
      const pipelineName = outputs.pipelineName;
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    it('should have exactly 3 stages', async () => {
      const pipelineName = outputs.pipelineName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.stages).toHaveLength(3);
    });

    it('should have Source, Build, and Deploy stages', async () => {
      const pipelineName = outputs.pipelineName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stageNames =
        response.pipeline?.stages?.map((stage) => stage.name) || [];

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    it('should have Source stage with GitHub provider', async () => {
      const pipelineName = outputs.pipelineName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        (stage) => stage.name === 'Source'
      );

      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions).toHaveLength(1);
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('GitHub');
      expect(sourceStage?.actions?.[0]?.actionTypeId?.owner).toBe('ThirdParty');
    });

    it('should have Build stage with CodeBuild action', async () => {
      const pipelineName = outputs.pipelineName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const buildStage = response.pipeline?.stages?.find(
        (stage) => stage.name === 'Build'
      );

      expect(buildStage).toBeDefined();
      expect(buildStage?.actions).toHaveLength(1);
      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe(
        'CodeBuild'
      );
      expect(buildStage?.actions?.[0]?.actionTypeId?.owner).toBe('AWS');
    });

    it('should have Deploy stage with ECS action', async () => {
      const pipelineName = outputs.pipelineName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const deployStage = response.pipeline?.stages?.find(
        (stage) => stage.name === 'Deploy'
      );

      expect(deployStage).toBeDefined();
      expect(deployStage?.actions).toHaveLength(1);
      expect(deployStage?.actions?.[0]?.actionTypeId?.provider).toBe('ECS');
      expect(deployStage?.actions?.[0]?.actionTypeId?.owner).toBe('AWS');
    });
  });

  describe('IAM Roles', () => {
    it('should have CodeBuild and CodePipeline roles', async () => {
      const pipelineName = outputs.pipelineName;
      const codeBuildRolePrefix = pipelineName.replace('ecs-pipeline-', 'codebuild-role-');
      const codePipelineRolePrefix = pipelineName.replace(
        'ecs-pipeline-',
        'codepipeline-role-'
      );

      // List all roles with pagination
      let allRoles: any[] = [];
      let marker: string | undefined;

      do {
        const listCommand = new ListRolesCommand({ Marker: marker });
        const listResponse = await iamClient.send(listCommand);
        allRoles = allRoles.concat(listResponse.Roles || []);
        marker = listResponse.Marker;
      } while (marker);

      const codeBuildRole = allRoles.find((r) =>
        r.RoleName?.startsWith(codeBuildRolePrefix)
      );
      const codePipelineRole = allRoles.find((r) =>
        r.RoleName?.startsWith(codePipelineRolePrefix)
      );

      expect(codeBuildRole).toBeDefined();
      expect(codeBuildRole?.RoleName).toContain(codeBuildRolePrefix);

      expect(codePipelineRole).toBeDefined();
      expect(codePipelineRole?.RoleName).toContain(codePipelineRolePrefix);

      // Verify trust policies
      const codeBuildTrustPolicy = JSON.parse(
        decodeURIComponent(codeBuildRole?.AssumeRolePolicyDocument || '')
      );
      expect(codeBuildTrustPolicy.Statement[0].Effect).toBe('Allow');
      expect(codeBuildTrustPolicy.Statement[0].Principal.Service).toBe(
        'codebuild.amazonaws.com'
      );

      const codePipelineTrustPolicy = JSON.parse(
        decodeURIComponent(codePipelineRole?.AssumeRolePolicyDocument || '')
      );
      expect(codePipelineTrustPolicy.Statement[0].Effect).toBe('Allow');
      expect(codePipelineTrustPolicy.Statement[0].Principal.Service).toBe(
        'codepipeline.amazonaws.com'
      );
    });

    it('should have CodeBuild and CodePipeline roles with required permissions', async () => {
      const pipelineName = outputs.pipelineName;
      const codeBuildRolePrefix = pipelineName.replace('ecs-pipeline-', 'codebuild-role-');
      const codePipelineRolePrefix = pipelineName.replace(
        'ecs-pipeline-',
        'codepipeline-role-'
      );

      // List all roles with pagination
      let allRoles: any[] = [];
      let marker: string | undefined;

      do {
        const listCommand = new ListRolesCommand({ Marker: marker });
        const listResponse = await iamClient.send(listCommand);
        allRoles = allRoles.concat(listResponse.Roles || []);
        marker = listResponse.Marker;
      } while (marker);

      const codeBuildRole = allRoles.find((r) =>
        r.RoleName?.startsWith(codeBuildRolePrefix)
      );
      const codePipelineRole = allRoles.find((r) =>
        r.RoleName?.startsWith(codePipelineRolePrefix)
      );

      expect(codeBuildRole).toBeDefined();
      expect(codePipelineRole).toBeDefined();

      // Check CodeBuild role permissions
      const codeBuildRoleName = codeBuildRole?.RoleName as string;
      const codeBuildPoliciesCommand = new ListRolePoliciesCommand({
        RoleName: codeBuildRoleName,
      });
      const codeBuildPoliciesResponse = await iamClient.send(
        codeBuildPoliciesCommand
      );

      expect(codeBuildPoliciesResponse.PolicyNames).toBeDefined();
      expect(codeBuildPoliciesResponse.PolicyNames?.length).toBeGreaterThan(0);

      const codeBuildPolicyName = codeBuildPoliciesResponse.PolicyNames?.[0] as string;
      const codeBuildPolicyCommand = new GetRolePolicyCommand({
        RoleName: codeBuildRoleName,
        PolicyName: codeBuildPolicyName,
      });
      const codeBuildPolicyResponse = await iamClient.send(codeBuildPolicyCommand);

      const codeBuildPolicy = JSON.parse(
        decodeURIComponent(codeBuildPolicyResponse.PolicyDocument || '')
      );
      const codeBuildActions = codeBuildPolicy.Statement.flatMap(
        (stmt: any) => stmt.Action
      );

      expect(codeBuildActions).toContain('s3:GetObject');
      expect(codeBuildActions).toContain('s3:PutObject');
      expect(codeBuildActions).toContain('ecr:GetAuthorizationToken');
      expect(codeBuildActions).toContain('ecr:BatchCheckLayerAvailability');
      expect(codeBuildActions).toContain('ecr:PutImage');

      // Check CodePipeline role permissions
      const codePipelineRoleName = codePipelineRole?.RoleName as string;
      const codePipelinePoliciesCommand = new ListRolePoliciesCommand({
        RoleName: codePipelineRoleName,
      });
      const codePipelinePoliciesResponse = await iamClient.send(
        codePipelinePoliciesCommand
      );

      expect(codePipelinePoliciesResponse.PolicyNames).toBeDefined();
      expect(codePipelinePoliciesResponse.PolicyNames?.length).toBeGreaterThan(
        0
      );

      const codePipelinePolicyName = codePipelinePoliciesResponse.PolicyNames?.[0] as string;
      const codePipelinePolicyCommand = new GetRolePolicyCommand({
        RoleName: codePipelineRoleName,
        PolicyName: codePipelinePolicyName,
      });
      const codePipelinePolicyResponse = await iamClient.send(
        codePipelinePolicyCommand
      );

      const codePipelinePolicy = JSON.parse(
        decodeURIComponent(codePipelinePolicyResponse.PolicyDocument || '')
      );
      const codePipelineActions = codePipelinePolicy.Statement.flatMap(
        (stmt: any) => stmt.Action
      );

      expect(codePipelineActions).toContain('s3:GetObject');
      expect(codePipelineActions).toContain('s3:PutObject');
      expect(codePipelineActions).toContain('codebuild:StartBuild');
      expect(codePipelineActions).toContain('codebuild:BatchGetBuilds');
      expect(codePipelineActions).toContain('ecs:DescribeServices');
      expect(codePipelineActions).toContain('ecs:UpdateService');
    });
  });
});
