import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand
} from '@aws-sdk/client-s3';
import {
  CodePipelineClient,
  GetPipelineCommand
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand
} from '@aws-sdk/client-codebuild';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand
} from '@aws-sdk/client-iam';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} else {
  throw new Error('cfn-outputs/flat-outputs.json not found. Ensure deployment succeeded.');
}

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const codepipelineClient = new CodePipelineClient({ region });
const codebuildClient = new CodeBuildClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('TAP Infrastructure Integration Tests', () => {
  describe('S3 Artifact Bucket', () => {
    test('should exist and be accessible', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have versioning enabled', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption configured', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have lifecycle policy configured', async () => {
      const bucketName = outputs.artifactBucketName;
      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      const expirationRule = response.Rules?.find(r => r.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Expiration?.Days).toBe(30);
    });
  });

  describe('CodePipeline', () => {
    test('should exist and be configured', async () => {
      const pipelineArn = outputs.pipelineArn;
      expect(pipelineArn).toBeDefined();

      // Extract pipeline name from ARN
      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    test('should have required stages', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      const stages = response.pipeline?.stages || [];
      const stageNames = stages.map(s => s.name);

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Approval');
      expect(stageNames).toContain('Deploy');
    });

    test('should have artifact store configured', async () => {
      const pipelineArn = outputs.pipelineArn;
      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);

      // Check for either artifactStore (single) or artifactStores (array)
      const artifactStore = response.pipeline?.artifactStore || response.pipeline?.artifactStores?.[0];
      expect(artifactStore).toBeDefined();
      expect(artifactStore?.type).toBe('S3');
      expect(artifactStore?.location).toBe(outputs.artifactBucketName);
    });
  });

  describe('CodeBuild Project', () => {
    test('should exist and be configured', async () => {
      const projectName = outputs.buildProjectName;
      expect(projectName).toBeDefined();

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      expect(response.projects).toHaveLength(1);
      expect(response.projects?.[0].name).toBe(projectName);
    });

    test('should have correct environment configuration', async () => {
      const projectName = outputs.buildProjectName;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.environment).toBeDefined();
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBeDefined();
    });

    test('should have IAM role attached', async () => {
      const projectName = outputs.buildProjectName;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codebuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.serviceRole).toBeDefined();
      expect(project?.serviceRole).toContain('codebuild-role');
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should exist for CodeBuild logs', async () => {
      // CodeBuild automatically creates log group with pattern: /aws/codebuild/{project-name}
      const projectName = outputs.buildProjectName;
      const logGroupName = `/aws/codebuild/${projectName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      // Verify the exact log group name matches
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have CodePipeline role', async () => {
      // Extract full environment suffix from bucket name (e.g., "dev-dfc1e548")
      const bucketName = outputs.artifactBucketName;
      const environmentSuffix = bucketName.replace('pipeline-artifacts-', '');
      const roleName = `codepipeline-role-${environmentSuffix}`;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    test('should have CodeBuild role', async () => {
      const bucketName = outputs.artifactBucketName;
      const environmentSuffix = bucketName.replace('pipeline-artifacts-', '');
      const roleName = `codebuild-role-${environmentSuffix}`;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    test('should have inline policies attached', async () => {
      const bucketName = outputs.artifactBucketName;
      const environmentSuffix = bucketName.replace('pipeline-artifacts-', '');
      const pipelineRoleName = `codepipeline-role-${environmentSuffix}`;
      const policyName = `codepipeline-policy-${environmentSuffix}`;

      const command = new GetRolePolicyCommand({
        RoleName: pipelineRoleName,
        PolicyName: policyName
      });

      await expect(iamClient.send(command)).resolves.not.toThrow();
    });
  });
});
