/**
 * Integration Tests for TapStack CI/CD Infrastructure
 *
 * These tests validate the actual deployed AWS resources using real AWS SDK calls.
 * They verify resource existence, configuration, and connectivity.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CodeBuildClient, BatchGetProjectsCommand } from '@aws-sdk/client-codebuild';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand, ListRolePoliciesCommand } from '@aws-sdk/client-iam';

// Read deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.error('Failed to read outputs file:', error);
  throw new Error('Deployment outputs file not found. Ensure infrastructure is deployed first.');
}

// AWS clients configuration
const region = process.env.AWS_REGION || 'us-east-1';
const codeBuildClient = new CodeBuildClient({ region });
const s3Client = new S3Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('TapStack CI/CD Infrastructure Integration Tests', () => {

  describe('Deployment Outputs Validation', () => {
    test('should have codeBuildProjectName in outputs', () => {
      expect(outputs).toHaveProperty('codeBuildProjectName');
      expect(outputs.codeBuildProjectName).toBeTruthy();
      expect(typeof outputs.codeBuildProjectName).toBe('string');
    });

    test('should have artifactBucketArn in outputs', () => {
      expect(outputs).toHaveProperty('artifactBucketArn');
      expect(outputs.artifactBucketArn).toBeTruthy();
      expect(typeof outputs.artifactBucketArn).toBe('string');
      expect(outputs.artifactBucketArn).toMatch(/^arn:aws:s3:::/);
    });
  });

  describe('CodeBuild Project Validation', () => {
    let projectDetails: any;

    beforeAll(async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName]
      });
      const response = await codeBuildClient.send(command);
      projectDetails = response.projects?.[0];
    });

    test('should exist in AWS', () => {
      expect(projectDetails).toBeDefined();
      expect(projectDetails.name).toBe(outputs.codeBuildProjectName);
    });

    test('should have correct ARN format', () => {
      expect(projectDetails.arn).toMatch(/^arn:aws:codebuild:/);
      expect(projectDetails.arn).toContain(outputs.codeBuildProjectName);
    });

    test('should have service role configured', () => {
      expect(projectDetails.serviceRole).toBeDefined();
      expect(projectDetails.serviceRole).toMatch(/^arn:aws:iam::/);
      expect(projectDetails.serviceRole).toContain('codebuild-role');
    });

    test('should have Linux container environment', () => {
      expect(projectDetails.environment).toBeDefined();
      expect(projectDetails.environment.type).toBe('LINUX_CONTAINER');
      expect(projectDetails.environment.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('should have standard AWS image configured', () => {
      expect(projectDetails.environment.image).toBeDefined();
      expect(projectDetails.environment.image).toContain('aws/codebuild/standard');
    });

    test('should have NODE_ENV environment variable', () => {
      const envVars = projectDetails.environment.environmentVariables || [];
      const nodeEnv = envVars.find((v: any) => v.name === 'NODE_ENV');
      expect(nodeEnv).toBeDefined();
      expect(nodeEnv.value).toBe('production');
      expect(nodeEnv.type).toBe('PLAINTEXT');
    });

    test('should have BUILD_NUMBER environment variable', () => {
      const envVars = projectDetails.environment.environmentVariables || [];
      const buildNumber = envVars.find((v: any) => v.name === 'BUILD_NUMBER');
      expect(buildNumber).toBeDefined();
      expect(buildNumber.value).toContain('CODEBUILD_BUILD_NUMBER');
    });

    test('should have S3 artifacts configuration', () => {
      expect(projectDetails.artifacts).toBeDefined();
      expect(projectDetails.artifacts.type).toBe('S3');
      expect(projectDetails.artifacts.location).toBeDefined();
      expect(projectDetails.artifacts.path).toBe('builds/');
    });

    test('should have GitHub source configured', () => {
      expect(projectDetails.source).toBeDefined();
      expect(projectDetails.source.type).toBe('GITHUB');
      expect(projectDetails.source.location).toMatch(/github\.com/);
    });

    test('should have buildspec defined', () => {
      expect(projectDetails.source.buildspec).toBeDefined();
      expect(projectDetails.source.buildspec).toContain('version: 0.2');
      expect(projectDetails.source.buildspec).toContain('nodejs: 18');
    });

    test('should have CloudWatch logs configured', () => {
      expect(projectDetails.logsConfig).toBeDefined();
      expect(projectDetails.logsConfig.cloudWatchLogs).toBeDefined();
      expect(projectDetails.logsConfig.cloudWatchLogs.status).toBe('ENABLED');
      expect(projectDetails.logsConfig.cloudWatchLogs.groupName).toContain('codebuild');
    });

    test('should have 15 minute build timeout', () => {
      expect(projectDetails.timeoutInMinutes).toBe(15);
    });

    test('should have cache configured', () => {
      expect(projectDetails.cache).toBeDefined();
      expect(projectDetails.cache.type).toBe('LOCAL');
      expect(projectDetails.cache.modes).toBeDefined();
      expect(projectDetails.cache.modes.length).toBeGreaterThan(0);
    });

    test('should have proper tags', () => {
      expect(projectDetails.tags).toBeDefined();
      const tags = projectDetails.tags || [];
      const environmentTag = tags.find((t: any) => t.key === 'Environment');
      const teamTag = tags.find((t: any) => t.key === 'Team');

      expect(environmentTag).toBeDefined();
      expect(environmentTag.value).toBe('production');
      expect(teamTag).toBeDefined();
      expect(teamTag.value).toBe('engineering');
    });
  });

  describe('S3 Artifact Bucket Validation', () => {
    const bucketName = outputs.artifactBucketArn.replace('arn:aws:s3:::', '');

    test('should exist in AWS', async () => {
      const command = new HeadBucketCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      expect(response).toBeDefined();
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have environmentSuffix in bucket name', () => {
      expect(bucketName).toContain('codebuild-artifacts');
      // Bucket name should end with environment suffix
      expect(bucketName).toMatch(/-[a-z0-9]+$/);
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('should have log group for CodeBuild', async () => {
      const logGroupName = `/aws/codebuild/${outputs.codeBuildProjectName}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('IAM Role and Permissions', () => {
    let roleDetails: any;
    let rolePolicies: string[] = [];
    const roleName = outputs.codeBuildProjectName.replace('nodejs-build', 'codebuild-role');

    beforeAll(async () => {
      try {
        const command = new GetRoleCommand({
          RoleName: roleName
        });
        roleDetails = await iamClient.send(command);

        // List all inline policies for the role
        const listCommand = new ListRolePoliciesCommand({
          RoleName: roleName
        });
        const listResponse = await iamClient.send(listCommand);
        rolePolicies = listResponse.PolicyNames || [];
      } catch (error) {
        console.error('Failed to get IAM role:', error);
      }
    });

    test('should have CodeBuild service role', () => {
      expect(roleDetails).toBeDefined();
      expect(roleDetails.Role).toBeDefined();
      expect(roleDetails.Role.RoleName).toBe(roleName);
    });

    test('should have CodeBuild assume role policy', () => {
      expect(roleDetails.Role.AssumeRolePolicyDocument).toBeDefined();
      const policy = decodeURIComponent(roleDetails.Role.AssumeRolePolicyDocument);
      expect(policy).toContain('codebuild.amazonaws.com');
    });

    test('should have S3 access policy', async () => {
      // Find policy that starts with the expected prefix
      const s3PolicyName = rolePolicies.find(p => p.startsWith('codebuild-s3-policy-'));
      expect(s3PolicyName).toBeDefined();

      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: s3PolicyName
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policyDoc = decodeURIComponent(response.PolicyDocument || '');
      expect(policyDoc).toContain('s3:GetObject');
      expect(policyDoc).toContain('s3:PutObject');
    });

    test('should have CloudWatch Logs access policy', async () => {
      // Find policy that starts with the expected prefix
      const logsPolicy = rolePolicies.find(p => p.startsWith('codebuild-logs-policy-'));
      expect(logsPolicy).toBeDefined();

      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: logsPolicy
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policyDoc = decodeURIComponent(response.PolicyDocument || '');
      expect(policyDoc).toContain('logs:CreateLogStream');
      expect(policyDoc).toContain('logs:PutLogEvents');
    });
  });

  describe('Resource Naming Consistency', () => {
    test('should have consistent environmentSuffix across resources', () => {
      const suffix = outputs.codeBuildProjectName.replace('nodejs-build-', '');
      const bucketName = outputs.artifactBucketArn.replace('arn:aws:s3:::', '');

      expect(bucketName).toContain(suffix);
      expect(outputs.codeBuildProjectName).toContain(suffix);
    });

    test('should follow naming convention for CodeBuild', () => {
      expect(outputs.codeBuildProjectName).toMatch(/^nodejs-build-/);
    });

    test('should follow naming convention for S3 bucket', () => {
      const bucketName = outputs.artifactBucketArn.replace('arn:aws:s3:::', '');
      expect(bucketName).toMatch(/^codebuild-artifacts-/);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('should have complete CI/CD pipeline components', () => {
      // Verify all required components are present in outputs
      expect(outputs.codeBuildProjectName).toBeTruthy();
      expect(outputs.artifactBucketArn).toBeTruthy();
    });

    test('should have proper resource connectivity', async () => {
      // Verify CodeBuild project references the correct S3 bucket
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName]
      });
      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      const bucketName = outputs.artifactBucketArn.replace('arn:aws:s3:::', '');
      expect(project?.artifacts?.location).toBe(bucketName);
    });
  });
});
