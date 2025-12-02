/**
 * Integration tests for TapStack
 * Tests deployed AWS resources using actual stack outputs
 */
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { CodeBuildClient, BatchGetProjectsCommand } from '@aws-sdk/client-codebuild';
import { CodePipelineClient, GetPipelineCommand } from '@aws-sdk/client-codepipeline';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand, ListRolePoliciesCommand } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};

try {
  const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
  outputs = JSON.parse(outputsContent);
} catch (error) {
  console.error('Failed to load stack outputs:', error);
}

// AWS Clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const codeBuildClient = new CodeBuildClient({ region: process.env.AWS_REGION || 'us-east-1' });
const codePipelineClient = new CodePipelineClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'syntha7c6u0x3';

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.artifactBucket).toBeDefined();
      expect(outputs.deployBucket).toBeDefined();
      expect(outputs.codeBuildProject).toBeDefined();
      expect(outputs.pipelineExecutionUrl).toBeDefined();
    });

    it('should have valid output values', () => {
      expect(typeof outputs.artifactBucket).toBe('string');
      expect(typeof outputs.deployBucket).toBe('string');
      expect(typeof outputs.codeBuildProject).toBe('string');
      expect(typeof outputs.pipelineExecutionUrl).toBe('string');

      expect(outputs.artifactBucket.length).toBeGreaterThan(0);
      expect(outputs.deployBucket.length).toBeGreaterThan(0);
      expect(outputs.codeBuildProject.length).toBeGreaterThan(0);
      expect(outputs.pipelineExecutionUrl).toContain('https://');
    });
  });

  describe('S3 Artifact Bucket', () => {
    it('should exist in AWS', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.artifactBucket,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.artifactBucket,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have environment suffix in name', () => {
      expect(outputs.artifactBucket).toContain(ENVIRONMENT_SUFFIX.toLowerCase());
    });
  });

  describe('S3 Deploy Bucket', () => {
    it('should exist in AWS', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.deployBucket,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have environment suffix in name', () => {
      expect(outputs.deployBucket).toContain(ENVIRONMENT_SUFFIX.toLowerCase());
    });
  });

  describe('CodeBuild Project', () => {
    it('should exist in AWS', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProject],
      });

      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
    });

    it('should have correct configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProject],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      expect(project).toBeDefined();
      expect(project?.name).toBe(outputs.codeBuildProject);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    it('should have environment variables set', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProject],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      const envVars = project?.environment?.environmentVariables || [];
      const envSuffixVar = envVars.find(v => v.name === 'ENVIRONMENT_SUFFIX');

      expect(envSuffixVar).toBeDefined();
      expect(envSuffixVar?.value).toBeDefined();
    });

    it('should have environment suffix in name', () => {
      expect(outputs.codeBuildProject).toContain(ENVIRONMENT_SUFFIX);
    });
  });

  describe('CodePipeline', () => {
    const pipelineName = `pipeline-main-${ENVIRONMENT_SUFFIX}`;

    it('should exist in AWS', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    it('should have Source, Build, and Deploy stages', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline?.stages || [];

      expect(stages.length).toBeGreaterThanOrEqual(3);

      const stageNames = stages.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    it('should use GitHub as source', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline?.stages || [];
      const sourceStage = stages.find(s => s.name === 'Source');

      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('GitHub');
    });

    it('should use CodeBuild for build stage', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline?.stages || [];
      const buildStage = stages.find(s => s.name === 'Build');

      expect(buildStage).toBeDefined();
      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildStage?.actions?.[0]?.configuration?.ProjectName).toBe(outputs.codeBuildProject);
    });

    it('should use S3 for deploy stage', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline?.stages || [];
      const deployStage = stages.find(s => s.name === 'Deploy');

      expect(deployStage).toBeDefined();
      expect(deployStage?.actions?.[0]?.actionTypeId?.provider).toBe('S3');
      expect(deployStage?.actions?.[0]?.configuration?.BucketName).toBe(outputs.deployBucket);
    });
  });

  describe('CloudWatch Log Group', () => {
    const logGroupName = `/aws/codebuild/${outputs.codeBuildProject}`;

    it('should exist in AWS', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
    });

    it('should have 30-day retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('IAM Roles', () => {
    const codeBuildRoleName = `codebuild-role-${ENVIRONMENT_SUFFIX}`;
    const codePipelineRoleName = `codepipeline-role-${ENVIRONMENT_SUFFIX}`;

    it('should have CodeBuild role', async () => {
      const command = new GetRoleCommand({
        RoleName: codeBuildRoleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(codeBuildRoleName);
    });

    it('should have CodePipeline role', async () => {
      const command = new GetRoleCommand({
        RoleName: codePipelineRoleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(codePipelineRoleName);
    });

    it('should have CodeBuild IAM policy attached', async () => {
      // Pulumi adds a suffix to inline policy names, so we list and check
      const listCommand = new ListRolePoliciesCommand({
        RoleName: codeBuildRoleName,
      });

      const listResponse = await iamClient.send(listCommand);
      const policyNames = listResponse.PolicyNames || [];

      // Check if any policy name starts with the expected name
      const hasPolicy = policyNames.some(name => name.startsWith(`codebuild-policy-${ENVIRONMENT_SUFFIX}`));
      expect(hasPolicy).toBe(true);
      expect(policyNames.length).toBeGreaterThan(0);
    });

    it('should have CodePipeline IAM policy attached', async () => {
      // Pulumi adds a suffix to inline policy names, so we list and check
      const listCommand = new ListRolePoliciesCommand({
        RoleName: codePipelineRoleName,
      });

      const listResponse = await iamClient.send(listCommand);
      const policyNames = listResponse.PolicyNames || [];

      // Check if any policy name starts with the expected name
      const hasPolicy = policyNames.some(name => name.startsWith(`codepipeline-policy-${ENVIRONMENT_SUFFIX}`));
      expect(hasPolicy).toBe(true);
      expect(policyNames.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Tagging', () => {
    it('should have consistent environment suffix across resources', () => {
      const lowerSuffix = ENVIRONMENT_SUFFIX.toLowerCase();

      expect(outputs.artifactBucket).toContain(lowerSuffix);
      expect(outputs.deployBucket).toContain(lowerSuffix);
      expect(outputs.codeBuildProject).toContain(ENVIRONMENT_SUFFIX);
    });
  });

  describe('Pipeline URL', () => {
    it('should be a valid AWS console URL', () => {
      expect(outputs.pipelineExecutionUrl).toMatch(/^https:\/\/console\.aws\.amazon\.com/);
      expect(outputs.pipelineExecutionUrl).toContain('codepipeline');
      expect(outputs.pipelineExecutionUrl).toContain(`pipeline-main-${ENVIRONMENT_SUFFIX}`);
    });

    it('should include correct region', () => {
      const region = process.env.AWS_REGION || 'us-east-1';
      expect(outputs.pipelineExecutionUrl).toContain(`region=${region}`);
    });
  });
});
