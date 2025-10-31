/**
 * Integration tests for TapStack deployed infrastructure
 * These tests validate actual AWS resources created by the deployment
 */

import {
  S3Client,
  HeadBucketCommand,
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
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  throw new Error('Deployment outputs not found. Run deployment first.');
}

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synthhhfsa';

// Initialize AWS SDK clients
const s3Client = new S3Client({ region: REGION });
const ecrClient = new ECRClient({ region: REGION });
const codeBuildClient = new CodeBuildClient({ region: REGION });
const codePipelineClient = new CodePipelineClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const iamClient = new IAMClient({ region: REGION });

describe('TapStack Integration Tests - Real AWS Resources', () => {
  describe('S3 Artifact Bucket', () => {
    it('should exist and be accessible', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(ENVIRONMENT_SUFFIX);

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have lifecycle policy configured', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const expirationRule = response.Rules!.find(r => r.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule!.Expiration!.Days).toBe(30);
    });

    it('should have KMS encryption enabled', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });
  });

  describe('ECR Repository', () => {
    it('should exist with correct configuration', async () => {
      const repositoryUrl = outputs.ecrRepositoryUrl;
      expect(repositoryUrl).toBeDefined();
      expect(repositoryUrl).toContain(ENVIRONMENT_SUFFIX);

      const repositoryName = repositoryUrl.split('/')[1];
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories!.length).toBe(1);

      const repo = response.repositories![0];
      expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
    });

    it('should have lifecycle policy to keep last 10 images', async () => {
      const repositoryUrl = outputs.ecrRepositoryUrl;
      const repositoryName = repositoryUrl.split('/')[1];

      const command = new GetLifecyclePolicyCommand({
        repositoryName: repositoryName,
      });
      const response = await ecrClient.send(command);

      expect(response.lifecyclePolicyText).toBeDefined();
      const policy = JSON.parse(response.lifecyclePolicyText!);

      expect(policy.rules).toBeDefined();
      const rule = policy.rules.find(
        (r: any) => r.selection?.countNumber === 10
      );
      expect(rule).toBeDefined();
      expect(rule.action.type).toBe('expire');
    });
  });

  describe('CodeBuild Projects', () => {
    it('should have docker-build project configured correctly', async () => {
      const projectName = `docker-build-${ENVIRONMENT_SUFFIX}`;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBe(1);

      const project = response.projects![0];
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.image).toBe('aws/codebuild/standard:7.0');
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
      expect(project.environment!.privilegedMode).toBe(true);
    });

    it('should have pulumi-deploy project configured correctly', async () => {
      const projectName = `pulumi-deploy-${ENVIRONMENT_SUFFIX}`;
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBe(1);

      const project = response.projects![0];
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.image).toBe('aws/codebuild/standard:7.0');
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
    });
  });

  describe('CodePipeline', () => {
    it('should exist with correct stages', async () => {
      const pipelineName = outputs.pipelineName;
      expect(pipelineName).toBeDefined();
      expect(pipelineName).toContain(ENVIRONMENT_SUFFIX);

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      const pipeline = response.pipeline!;

      expect(pipeline.stages).toBeDefined();
      expect(pipeline.stages!.length).toBe(4);

      const stageNames = pipeline.stages!.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Approval');
      expect(stageNames).toContain('Deploy');
    });

    it('should have manual approval stage configured', async () => {
      const pipelineName = outputs.pipelineName;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const approvalStage = response.pipeline!.stages!.find(
        s => s.name === 'Approval'
      );
      expect(approvalStage).toBeDefined();

      const approvalAction = approvalStage!.actions![0];
      expect(approvalAction.actionTypeId!.category).toBe('Approval');
      expect(approvalAction.actionTypeId!.provider).toBe('Manual');
    });

    it('should use S3 as source with correct artifact bucket', async () => {
      const pipelineName = outputs.pipelineName;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const sourceStage = response.pipeline!.stages!.find(
        s => s.name === 'Source'
      );
      expect(sourceStage).toBeDefined();

      const sourceAction = sourceStage!.actions![0];
      expect(sourceAction.actionTypeId!.provider).toBe('S3');
      expect(sourceAction.configuration!.S3Bucket).toBe(
        outputs.artifactBucketName
      );
    });
  });

  describe('SNS Topic', () => {
    it('should exist for pipeline notifications', async () => {
      const topicArn = outputs.snsTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain(ENVIRONMENT_SUFFIX);
      expect(topicArn).toContain('pipeline-notifications');

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe(
        'Pipeline Failure Notifications'
      );
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should have codebuild-docker-role with appropriate permissions', async () => {
      const roleName = `codebuild-docker-role-${ENVIRONMENT_SUFFIX}`;

      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      expect(roleResponse.Role).toBeDefined();

      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: `codebuild-docker-policy-${ENVIRONMENT_SUFFIX}`,
      });
      const policyResponse = await iamClient.send(getPolicyCommand);

      expect(policyResponse.PolicyDocument).toBeDefined();
      const policy = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument!)
      );

      // Verify ECR permissions
      const ecrStatement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a.includes('ecr:'))
      );
      expect(ecrStatement).toBeDefined();
    });

    it('should have codebuild-pulumi-role with appropriate permissions', async () => {
      const roleName = `codebuild-pulumi-role-${ENVIRONMENT_SUFFIX}`;

      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      expect(roleResponse.Role).toBeDefined();

      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: `codebuild-pulumi-policy-${ENVIRONMENT_SUFFIX}`,
      });
      const policyResponse = await iamClient.send(getPolicyCommand);

      expect(policyResponse.PolicyDocument).toBeDefined();
      const policy = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument!)
      );

      // Verify S3 and logs permissions
      const s3Statement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a.includes('s3:'))
      );
      expect(s3Statement).toBeDefined();
    });

    it('should have codepipeline-role with appropriate permissions', async () => {
      const roleName = `codepipeline-role-${ENVIRONMENT_SUFFIX}`;

      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      expect(roleResponse.Role).toBeDefined();

      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: `codepipeline-policy-${ENVIRONMENT_SUFFIX}`,
      });
      const policyResponse = await iamClient.send(getPolicyCommand);

      expect(policyResponse.PolicyDocument).toBeDefined();
      const policy = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument!)
      );

      // Verify CodeBuild and S3 permissions
      const codeBuildStatement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a.includes('codebuild:'))
      );
      expect(codeBuildStatement).toBeDefined();

      const snsStatement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a.includes('sns:'))
      );
      expect(snsStatement).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should have all resources tagged with environmentSuffix', async () => {
      // S3 Bucket name includes suffix
      expect(outputs.artifactBucketName).toContain(ENVIRONMENT_SUFFIX);

      // ECR Repository URL includes suffix
      expect(outputs.ecrRepositoryUrl).toContain(ENVIRONMENT_SUFFIX);

      // Pipeline name includes suffix
      expect(outputs.pipelineName).toContain(ENVIRONMENT_SUFFIX);

      // SNS Topic ARN includes suffix
      expect(outputs.snsTopicArn).toContain(ENVIRONMENT_SUFFIX);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have complete CI/CD pipeline connectivity', async () => {
      // Verify pipeline can access S3 bucket
      const pipelineName = outputs.pipelineName;
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);

      const sourceStage = pipelineResponse.pipeline!.stages!.find(
        s => s.name === 'Source'
      );
      const sourceBucket = sourceStage!.actions![0].configuration!.S3Bucket;
      expect(sourceBucket).toBe(outputs.artifactBucketName);

      // Verify bucket exists
      const bucketCommand = new HeadBucketCommand({ Bucket: sourceBucket });
      await expect(s3Client.send(bucketCommand)).resolves.not.toThrow();
    });

    it('should have CodeBuild projects accessible by pipeline', async () => {
      const pipelineName = outputs.pipelineName;
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);

      const buildStage = pipelineResponse.pipeline!.stages!.find(
        s => s.name === 'Build'
      );
      const buildProjectName =
        buildStage!.actions![0].configuration!.ProjectName;

      const buildCommand = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const buildResponse = await codeBuildClient.send(buildCommand);
      expect(buildResponse.projects!.length).toBe(1);
    });
  });
});
