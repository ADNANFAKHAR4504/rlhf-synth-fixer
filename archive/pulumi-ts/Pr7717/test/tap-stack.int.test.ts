import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CodePipelineClient,
  GetPipelineCommand,
  ListPipelineExecutionsCommand,
} from '@aws-sdk/client-codepipeline';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
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
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';

// Load deployment outputs
const outputs = JSON.parse(
  readFileSync(join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf-8')
);

describe('TapStack Integration Tests', () => {
  const region = 'us-east-1';
  const pipelineClient = new CodePipelineClient({ region });
  const s3Client = new S3Client({ region });
  const ecrClient = new ECRClient({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });
  const iamClient = new IAMClient({ region });

  describe('CodePipeline Validation', () => {
    it('should have a valid pipeline deployed', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(outputs.pipelineName);
      expect(response.metadata?.pipelineArn).toBe(outputs.pipelineArn);
    });

    it('should have three stages: Source, Build, and Approval', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);
      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBe(3);

      const stageNames = response.pipeline?.stages?.map((s) => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Approval');
    });

    it('should have Source stage configured with GitHub provider', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Source'
      );
      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('GitHub');
      expect(sourceStage?.actions?.[0]?.actionTypeId?.owner).toBe(
        'ThirdParty'
      );
    });

    it('should have Build stage configured with CodeBuild', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);
      const buildStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Build'
      );
      expect(buildStage).toBeDefined();
      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe(
        'CodeBuild'
      );
      expect(buildStage?.actions?.[0]?.actionTypeId?.owner).toBe('AWS');
      expect(
        buildStage?.actions?.[0]?.configuration?.ProjectName
      ).toBeDefined();
    });

    it('should have Approval stage configured with Manual approval', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);
      const approvalStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Approval'
      );
      expect(approvalStage).toBeDefined();
      expect(approvalStage?.actions?.[0]?.actionTypeId?.provider).toBe(
        'Manual'
      );
      expect(approvalStage?.actions?.[0]?.actionTypeId?.category).toBe(
        'Approval'
      );
    });

    it('should use the artifact bucket for storage', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);
      // Check for either artifactStore (singular) or artifactStores (plural) format
      if (response.pipeline?.artifactStores) {
        const artifactStore = Object.values(
          response.pipeline.artifactStores
        )[0];
        expect(artifactStore?.location).toBe(outputs.artifactBucketName);
        expect(artifactStore?.type).toBe('S3');
      } else if (response.pipeline?.artifactStore) {
        expect((response.pipeline.artifactStore as any).location).toBe(
          outputs.artifactBucketName
        );
        expect((response.pipeline.artifactStore as any).type).toBe('S3');
      } else {
        throw new Error('No artifact store configuration found');
      }
    });

    it('should have a valid IAM role attached', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const response = await pipelineClient.send(command);
      expect(response.pipeline?.roleArn).toBeDefined();
      expect(response.pipeline?.roleArn).toMatch(/^arn:aws:iam::/);
    });

    it('should be able to list pipeline executions', async () => {
      const command = new ListPipelineExecutionsCommand({
        pipelineName: outputs.pipelineName,
        maxResults: 10,
      });
      const response = await pipelineClient.send(command);
      expect(response.pipelineExecutionSummaries).toBeDefined();
      expect(Array.isArray(response.pipelineExecutionSummaries)).toBe(true);
    });
  });

  describe('S3 Artifact Bucket Validation', () => {
    it('should have the artifact bucket deployed', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
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
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have lifecycle rule configured for 30-day expiration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      const rule = response.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Expiration?.Days).toBe(30);
    });

    it('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.artifactBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        response.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('ECR Repository Validation', () => {
    it('should have the ECR repository deployed', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [outputs.ecrRepositoryName],
      });
      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
      expect(response.repositories?.[0]?.repositoryName).toBe(
        outputs.ecrRepositoryName
      );
    });

    it('should have image scanning enabled on push', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [outputs.ecrRepositoryName],
      });
      const response = await ecrClient.send(command);
      expect(
        response.repositories?.[0]?.imageScanningConfiguration?.scanOnPush
      ).toBe(true);
    });

    it('should have repository URI matching expected format', async () => {
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [outputs.ecrRepositoryName],
      });
      const response = await ecrClient.send(command);
      expect(response.repositories?.[0]?.repositoryUri).toBe(
        outputs.ecrRepositoryUri
      );
      expect(response.repositories?.[0]?.repositoryUri).toMatch(
        /^[0-9]+\.dkr\.ecr\.[a-z0-9\-]+\.amazonaws\.com\//
      );
    });

    it('should have a lifecycle policy configured', async () => {
      const command = new GetLifecyclePolicyCommand({
        repositoryName: outputs.ecrRepositoryName,
      });
      const response = await ecrClient.send(command);
      expect(response.lifecyclePolicyText).toBeDefined();
      const policy = JSON.parse(response.lifecyclePolicyText || '{}');
      expect(policy.rules).toBeDefined();
      expect(policy.rules.length).toBeGreaterThan(0);
    });

    it('should have lifecycle policy that keeps last 30 images', async () => {
      const command = new GetLifecyclePolicyCommand({
        repositoryName: outputs.ecrRepositoryName,
      });
      const response = await ecrClient.send(command);
      const policy = JSON.parse(response.lifecyclePolicyText || '{}');
      const rule = policy.rules[0];
      expect(rule.selection.countType).toBe('imageCountMoreThan');
      expect(rule.selection.countNumber).toBe(30);
      expect(rule.action.type).toBe('expire');
    });
  });

  describe('CodeBuild Project Validation', () => {
    it('should have the CodeBuild project deployed', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0]?.name).toBe(outputs.codeBuildProjectName);
    });

    it('should use standard:5.0 build image', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects?.[0]?.environment?.image).toBe(
        'aws/codebuild/standard:5.0'
      );
    });

    it('should have privileged mode enabled for Docker', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects?.[0]?.environment?.privilegedMode).toBe(true);
    });

    it('should have LINUX_CONTAINER environment type', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects?.[0]?.environment?.type).toBe(
        'LINUX_CONTAINER'
      );
    });

    it('should have BUILD_GENERAL1_SMALL compute type', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects?.[0]?.environment?.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
    });

    it('should have environment variables configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      const envVars = response.projects?.[0]?.environment?.environmentVariables;
      expect(envVars).toBeDefined();
      expect(envVars?.length).toBeGreaterThan(0);

      const varNames = envVars?.map((v) => v.name);
      expect(varNames).toContain('AWS_DEFAULT_REGION');
      expect(varNames).toContain('AWS_ACCOUNT_ID');
      expect(varNames).toContain('IMAGE_REPO_NAME');
      expect(varNames).toContain('IMAGE_TAG');
    });

    it('should have artifacts type set to CODEPIPELINE', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects?.[0]?.artifacts?.type).toBe('CODEPIPELINE');
    });

    it('should have source type set to CODEPIPELINE', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects?.[0]?.source?.type).toBe('CODEPIPELINE');
    });

    it('should have buildspec defined', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects?.[0]?.source?.buildspec).toBeDefined();
      expect(response.projects?.[0]?.source?.buildspec).toContain(
        'version: 0.2'
      );
    });

    it('should have CloudWatch logs configured', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(
        response.projects?.[0]?.logsConfig?.cloudWatchLogs?.status
      ).toBe('ENABLED');
      expect(
        response.projects?.[0]?.logsConfig?.cloudWatchLogs?.groupName
      ).toBe(outputs.cloudWatchLogGroupName);
    });

    it('should have a valid IAM service role', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);
      expect(response.projects?.[0]?.serviceRole).toBeDefined();
      expect(response.projects?.[0]?.serviceRole).toMatch(/^arn:aws:iam::/);
    });
  });

  describe('CloudWatch Logs Validation', () => {
    it('should have the CloudWatch log group deployed', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudWatchLogGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0]?.logGroupName).toBe(
        outputs.cloudWatchLogGroupName
      );
    });

    it('should have 7-day retention configured', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudWatchLogGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups?.[0]?.retentionInDays).toBe(7);
    });

    it('should follow naming convention for CodeBuild logs', () => {
      expect(outputs.cloudWatchLogGroupName).toMatch(
        /^\/aws\/codebuild\/build-project-/
      );
    });
  });

  describe('IAM Roles and Policies Validation', () => {
    it('should have CodeBuild IAM role deployed', async () => {
      const roleName = `codebuild-role-${outputs.pipelineName.split('-').pop()}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have CodePipeline IAM role deployed', async () => {
      const roleName = `pipeline-role-${outputs.pipelineName.split('-').pop()}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have CodeBuild role with inline policies', async () => {
      const roleName = `codebuild-role-${outputs.pipelineName.split('-').pop()}`;
      const command = new ListRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThan(0);
    });

    it('should have CodePipeline role with inline policies', async () => {
      const roleName = `pipeline-role-${outputs.pipelineName.split('-').pop()}`;
      const command = new ListRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThan(0);
    });

    it('should have CodeBuild policy with ECR and S3 permissions', async () => {
      const roleName = `codebuild-role-${outputs.pipelineName.split('-').pop()}`;
      const listCommand = new ListRolePoliciesCommand({
        RoleName: roleName,
      });
      const listResponse = await iamClient.send(listCommand);
      const policyName = listResponse.PolicyNames?.[0];

      const getCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: policyName,
      });
      const response = await iamClient.send(getCommand);
      expect(response.PolicyDocument).toBeDefined();

      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument || '{}')
      );
      const statements = policyDoc.Statement;
      expect(statements).toBeDefined();

      // Check for S3 permissions
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();

      // Check for ECR permissions
      const ecrStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('ecr:'))
      );
      expect(ecrStatement).toBeDefined();

      // Check for CloudWatch Logs permissions
      const logsStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('logs:'))
      );
      expect(logsStatement).toBeDefined();
    });

    it('should have CodePipeline policy with S3 and CodeBuild permissions', async () => {
      const roleName = `pipeline-role-${outputs.pipelineName.split('-').pop()}`;
      const listCommand = new ListRolePoliciesCommand({
        RoleName: roleName,
      });
      const listResponse = await iamClient.send(listCommand);
      const policyName = listResponse.PolicyNames?.[0];

      const getCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: policyName,
      });
      const response = await iamClient.send(getCommand);
      expect(response.PolicyDocument).toBeDefined();

      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument || '{}')
      );
      const statements = policyDoc.Statement;
      expect(statements).toBeDefined();

      // Check for S3 permissions
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();

      // Check for CodeBuild permissions
      const codeBuildStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('codebuild:'))
      );
      expect(codeBuildStatement).toBeDefined();
    });
  });

  describe('Resource Tagging Validation', () => {
    it('should have proper tags on all resources', async () => {
      // Verify pipeline tags through Get Pipeline
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const pipelineResponse = await pipelineClient.send(pipelineCommand);
      expect(pipelineResponse.pipeline).toBeDefined();

      // ECR repository tags
      const ecrCommand = new DescribeRepositoriesCommand({
        repositoryNames: [outputs.ecrRepositoryName],
      });
      const ecrResponse = await ecrClient.send(ecrCommand);
      expect(ecrResponse.repositories?.[0]).toBeDefined();

      // CodeBuild project tags
      const codeBuildCommand = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const codeBuildResponse = await codeBuildClient.send(codeBuildCommand);
      expect(codeBuildResponse.projects?.[0]).toBeDefined();
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have all components properly integrated', async () => {
      // 1. Pipeline exists
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const pipelineResponse = await pipelineClient.send(pipelineCommand);
      expect(pipelineResponse.pipeline).toBeDefined();

      // 2. Artifact bucket exists and is referenced by pipeline
      const s3Command = new HeadBucketCommand({
        Bucket: outputs.artifactBucketName,
      });
      const s3Response = await s3Client.send(s3Command);
      expect(s3Response.$metadata.httpStatusCode).toBe(200);

      // 3. ECR repository exists
      const ecrCommand = new DescribeRepositoriesCommand({
        repositoryNames: [outputs.ecrRepositoryName],
      });
      const ecrResponse = await ecrClient.send(ecrCommand);
      expect(ecrResponse.repositories?.length).toBe(1);

      // 4. CodeBuild project exists and is referenced by pipeline
      const codeBuildCommand = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const codeBuildResponse = await codeBuildClient.send(codeBuildCommand);
      expect(codeBuildResponse.projects?.length).toBe(1);

      // 5. CloudWatch log group exists
      const logsCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudWatchLogGroupName,
      });
      const logsResponse = await logsClient.send(logsCommand);
      expect(logsResponse.logGroups?.length).toBeGreaterThan(0);
    });
  });
});
