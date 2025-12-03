import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  GetLifecyclePolicyCommand,
} from '@aws-sdk/client-ecr';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
} from '@aws-sdk/client-s3';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import * as fs from 'fs';
import * as path from 'path';

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {
  let outputs: any;
  let region: string;
  let environmentSuffix: string;

  const codePipelineClient = new CodePipelineClient({});
  const ecrClient = new ECRClient({});
  const s3Client = new S3Client({});
  const codeBuildClient = new CodeBuildClient({});
  const iamClient = new IAMClient({});
  const eventBridgeClient = new EventBridgeClient({});

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Run deployment first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Get environment variables
    region = process.env.AWS_REGION || 'us-east-1';
    environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    expect(outputs).toBeDefined();
    expect(outputs.pipelineUrl).toBeDefined();
    expect(outputs.ecrRepositoryUri).toBeDefined();
  });

  describe('Deployment Outputs Validation', () => {
    it('should have valid pipeline URL', () => {
      expect(outputs.pipelineUrl).toContain('console.aws.amazon.com');
      expect(outputs.pipelineUrl).toContain('codepipeline');
      expect(outputs.pipelineUrl).toContain(region);
    });

    it('should have valid ECR repository URI', () => {
      expect(outputs.ecrRepositoryUri).toMatch(/\d+\.dkr\.ecr\..+\.amazonaws\.com\/.+/);
      expect(outputs.ecrRepositoryUri).toContain(region);
    });
  });

  describe('S3 Artifact Bucket', () => {
    const bucketName = `pipeline-artifacts-${process.env.ENVIRONMENT_SUFFIX || 'synthf0l4p0f7'}`;

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have proper tags', async () => {
      const command = new GetBucketTaggingCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      const tags = response.TagSet || [];
      const envTag = tags.find(tag => tag.Key === 'Environment');
      const teamTag = tags.find(tag => tag.Key === 'Team');

      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBe('Production');
      expect(teamTag).toBeDefined();
      expect(teamTag?.Value).toBe('DevOps');
    });
  });

  describe('ECR Repository', () => {
    it('should exist and be accessible', async () => {
      const repoName = `app-repo-${environmentSuffix}`;
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBeGreaterThan(0);
      expect(response.repositories?.[0].repositoryName).toBe(repoName);
    });

    it('should have lifecycle policy to keep last 10 images', async () => {
      const repoName = `app-repo-${environmentSuffix}`;
      const command = new GetLifecyclePolicyCommand({
        repositoryName: repoName,
      });
      const response = await ecrClient.send(command);

      expect(response.lifecyclePolicyText).toBeDefined();
      const policy = JSON.parse(response.lifecyclePolicyText || '{}');

      expect(policy.rules).toBeDefined();
      expect(policy.rules.length).toBeGreaterThan(0);

      const rule = policy.rules[0];
      expect(rule.selection.countType).toBe('imageCountMoreThan');
      expect(rule.selection.countNumber).toBe(10);
      expect(rule.action.type).toBe('expire');
    });

    it('should have repositoryUrl matching deployment output', async () => {
      const repoName = `app-repo-${environmentSuffix}`;
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      const repositoryUri = response.repositories?.[0].repositoryUri;
      expect(repositoryUri).toBe(outputs.ecrRepositoryUri);
    });
  });

  describe('CodeBuild Project', () => {
    it('should exist with correct configuration', async () => {
      const projectName = `docker-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBeGreaterThan(0);

      const project = response.projects?.[0];
      expect(project?.name).toBe(projectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.privilegedMode).toBe(true);
    });

    it('should have required environment variables', async () => {
      const projectName = `docker-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables || [];

      const hasRegion = envVars.some(v => v.name === 'AWS_DEFAULT_REGION');
      const hasAccountId = envVars.some(v => v.name === 'AWS_ACCOUNT_ID');
      const hasRepoName = envVars.some(v => v.name === 'IMAGE_REPO_NAME');
      const hasImageTag = envVars.some(v => v.name === 'IMAGE_TAG');

      expect(hasRegion).toBe(true);
      expect(hasAccountId).toBe(true);
      expect(hasRepoName).toBe(true);
      expect(hasImageTag).toBe(true);
    });

    it('should use buildspec.yml from source', async () => {
      const projectName = `docker-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.source?.type).toBe('CODEPIPELINE');
      expect(project?.source?.buildspec).toBe('buildspec.yml');
    });
  });

  describe('CodePipeline', () => {
    it('should exist and be accessible', async () => {
      const pipelineName = `cicd-pipeline-${environmentSuffix}`;
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    it('should have 3 stages: Source, Build, Deploy', async () => {
      const pipelineName = `cicd-pipeline-${environmentSuffix}`;
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages || [];
      expect(stages.length).toBe(3);

      expect(stages[0].name).toBe('Source');
      expect(stages[1].name).toBe('Build');
      expect(stages[2].name).toBe('Deploy');
    });

    it('should have Source stage configured with GitHub', async () => {
      const pipelineName = `cicd-pipeline-${environmentSuffix}`;
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await codePipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        s => s.name === 'Source'
      );
      const sourceAction = sourceStage?.actions?.[0];

      expect(sourceAction?.actionTypeId?.category).toBe('Source');
      expect(sourceAction?.actionTypeId?.provider).toBe('GitHub');
      expect(sourceAction?.outputArtifacts?.[0]?.name).toBe('source_output');
    });

    it('should have Build stage configured with CodeBuild', async () => {
      const pipelineName = `cicd-pipeline-${environmentSuffix}`;
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await codePipelineClient.send(command);

      const buildStage = response.pipeline?.stages?.find(s => s.name === 'Build');
      const buildAction = buildStage?.actions?.[0];

      expect(buildAction?.actionTypeId?.category).toBe('Build');
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildAction?.inputArtifacts?.[0]?.name).toBe('source_output');
      expect(buildAction?.outputArtifacts?.[0]?.name).toBe('build_output');
    });

    it('should use S3 artifact store', async () => {
      const pipelineName = `cicd-pipeline-${environmentSuffix}`;
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await codePipelineClient.send(command);

      // Check for either artifactStore (singular) or artifactStores (plural, multi-region)
      const artifactStore = response.pipeline?.artifactStore;
      const artifactStores = response.pipeline?.artifactStores;

      // Pipeline should have one or the other
      expect(artifactStore || artifactStores).toBeDefined();

      if (artifactStore) {
        // Single region pipeline
        expect(artifactStore.type).toBe('S3');
        expect(artifactStore.location).toContain('pipeline-artifacts');
      } else if (artifactStores) {
        // Multi-region pipeline
        expect(Object.keys(artifactStores).length).toBeGreaterThan(0);
        const firstStore = Object.values(artifactStores)[0];
        expect(firstStore?.type).toBe('S3');
        expect(firstStore?.location).toContain('pipeline-artifacts');
      }
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should have CodeBuild role with correct trust policy', async () => {
      const roleName = `codebuild-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );
      const statement = trustPolicy.Statement?.[0];

      expect(statement?.Effect).toBe('Allow');
      expect(statement?.Principal?.Service).toBe('codebuild.amazonaws.com');
      expect(statement?.Action).toBe('sts:AssumeRole');
    });

    it('should have CodePipeline role with correct trust policy', async () => {
      const roleName = `pipeline-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );
      const statement = trustPolicy.Statement?.[0];

      expect(statement?.Effect).toBe('Allow');
      expect(statement?.Principal?.Service).toBe('codepipeline.amazonaws.com');
      expect(statement?.Action).toBe('sts:AssumeRole');
    });

    it('should have CloudWatch Events role with correct trust policy', async () => {
      const roleName = `event-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );
      const statement = trustPolicy.Statement?.[0];

      expect(statement?.Effect).toBe('Allow');
      expect(statement?.Principal?.Service).toBe('events.amazonaws.com');
      expect(statement?.Action).toBe('sts:AssumeRole');
    });

    it('should have CodeBuild policy attached with proper permissions', async () => {
      const roleName = `codebuild-role-${environmentSuffix}`;
      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const policies = response.AttachedPolicies || [];
      expect(policies.length).toBeGreaterThan(0);

      const codeBuildPolicy = policies.find(p =>
        p.PolicyName?.includes('codebuild-policy')
      );
      expect(codeBuildPolicy).toBeDefined();
    });

    it('should have Pipeline policy attached with proper permissions', async () => {
      const roleName = `pipeline-role-${environmentSuffix}`;
      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const policies = response.AttachedPolicies || [];
      expect(policies.length).toBeGreaterThan(0);

      const pipelinePolicy = policies.find(p =>
        p.PolicyName?.includes('pipeline-policy')
      );
      expect(pipelinePolicy).toBeDefined();
    });
  });

  describe('CloudWatch Events', () => {
    it('should have EventRule for pipeline triggering', async () => {
      const ruleName = `pipeline-trigger-${environmentSuffix}`;
      const command = new DescribeRuleCommand({
        Name: ruleName,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();
    });

    it('should have EventTarget pointing to CodePipeline', async () => {
      const ruleName = `pipeline-trigger-${environmentSuffix}`;
      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });
      const response = await eventBridgeClient.send(command);

      const targets = response.Targets || [];
      expect(targets.length).toBeGreaterThan(0);

      const pipelineTarget = targets.find(t =>
        t.Arn?.includes('codepipeline')
      );
      expect(pipelineTarget).toBeDefined();
    });
  });

  describe('Resource Naming Consistency', () => {
    it('should use environmentSuffix consistently across all resources', () => {
      const suffix = environmentSuffix;

      // Verify naming pattern in outputs
      expect(outputs.ecrRepositoryUri).toContain(`app-repo-${suffix}`);
      expect(outputs.pipelineUrl).toContain(`cicd-pipeline-${suffix}`);
    });
  });

  describe('End-to-End Pipeline Workflow', () => {
    it('should have pipeline in valid state', async () => {
      const pipelineName = `cicd-pipeline-${environmentSuffix}`;
      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });
      const response = await codePipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates?.length).toBe(3);
    });
  });
});
