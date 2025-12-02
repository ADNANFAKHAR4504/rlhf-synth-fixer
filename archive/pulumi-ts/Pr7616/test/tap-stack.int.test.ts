import * as fs from 'fs';
import * as path from 'path';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

describe('CodeBuild CI/CD Pipeline Integration Tests', () => {
  let outputs: any;
  let codeBuildClient: CodeBuildClient;
  let s3Client: S3Client;
  let logsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load Pulumi outputs
    const outputPath = path.join(__dirname, '../cfn-outputs/pulumi-outputs.json');
    if (!fs.existsSync(outputPath)) {
      throw new Error(
        'Pulumi outputs not found. Please run deployment first.'
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

    // Initialize AWS SDK clients
    codeBuildClient = new CodeBuildClient({ region: 'us-east-1' });
    s3Client = new S3Client({ region: 'us-east-1' });
    logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
  });

  describe('S3 Artifact Bucket Tests', () => {
    it('should have created the S3 bucket for artifacts', async () => {
      expect(outputs.artifactBucketArn).toBeDefined();
      expect(outputs.artifactBucketArn).toContain('arn:aws:s3:::');

      const bucketName = outputs.artifactBucketArn.split(':::')[1];
      const command = new HeadBucketCommand({ Bucket: bucketName });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled on the artifact bucket', async () => {
      const bucketName = outputs.artifactBucketArn.split(':::')[1];
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('CodeBuild Project Tests', () => {
    it('should have created the CodeBuild project', async () => {
      expect(outputs.codeBuildProjectName).toBeDefined();
      expect(outputs.codeBuildProjectName).toContain('tap-codebuild');

      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
    });

    it('should have correct build environment configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      expect(project).toBeDefined();
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.image).toContain('aws/codebuild/standard:');
    });

    it('should have correct build timeout (15 minutes)', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.timeoutInMinutes).toBe(15);
    });

    it('should have S3 artifacts configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.artifacts?.type).toBe('S3');
      expect(project?.artifacts?.packaging).toBe('ZIP');
    });

    it('should have GitHub as source type', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.source?.type).toBe('GITHUB');
      expect(project?.source?.location).toBeDefined();
    });

    it('should have required tags (Environment=Production, ManagedBy=Pulumi)', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects?.[0];

      const tags = project?.tags || [];
      const envTag = tags.find((t) => t.key === 'Environment');
      const managedByTag = tags.find((t) => t.key === 'ManagedBy');

      expect(envTag?.value).toBe('Production');
      expect(managedByTag?.value).toBe('Pulumi');
    });
  });

  describe('CloudWatch Logs Tests', () => {
    it('should have created CloudWatch log group for build logs', async () => {
      const logGroupName = `/aws/codebuild/${outputs.codeBuildProjectName.split('-')[0]}-${outputs.codeBuildProjectName.split('-')[1]}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/codebuild/',
      });

      const response = await logsClient.send(command);
      const logGroups = response.logGroups || [];

      const matchingLogGroup = logGroups.find((lg) =>
        lg.logGroupName?.includes('tap-codebuild')
      );
      expect(matchingLogGroup).toBeDefined();
    });

    it('should have 7-day retention policy for logs', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/codebuild/',
      });

      const response = await logsClient.send(command);
      const logGroups = response.logGroups || [];

      const matchingLogGroup = logGroups.find((lg) =>
        lg.logGroupName?.includes('tap-codebuild')
      );

      expect(matchingLogGroup?.retentionInDays).toBe(7);
    });
  });

  describe('Stack Outputs Validation', () => {
    it('should export CodeBuild project name', () => {
      expect(outputs.codeBuildProjectName).toBeDefined();
      expect(typeof outputs.codeBuildProjectName).toBe('string');
      expect(outputs.codeBuildProjectName.length).toBeGreaterThan(0);
    });

    it('should export S3 bucket ARN', () => {
      expect(outputs.artifactBucketArn).toBeDefined();
      expect(outputs.artifactBucketArn).toMatch(/^arn:aws:s3:::/);
    });

    it('should have valid output format', () => {
      expect(outputs).toHaveProperty('artifactBucketArn');
      expect(outputs).toHaveProperty('codeBuildProjectName');
    });
  });
});
