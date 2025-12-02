import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import { S3Client, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

describe('CodeBuild Infrastructure Integration Tests', () => {
  let outputs: {
    codeBuildProjectName: string;
    artifactBucketName: string;
  };

  const region = process.env.AWS_REGION || 'us-east-1';
  const codeBuildClient = new CodeBuildClient({ region });
  const s3Client = new S3Client({ region });
  const cwLogsClient = new CloudWatchLogsClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    expect(outputs.codeBuildProjectName).toBeDefined();
    expect(outputs.artifactBucketName).toBeDefined();
  });

  describe('CodeBuild Project', () => {
    it('should exist in AWS', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects![0].name).toBe(outputs.codeBuildProjectName);
    });

    it('should have correct configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment?.image).toBe('aws/codebuild/standard:7.0');
      expect(project.environment?.type).toBe('LINUX_CONTAINER');
      // Pulumi timeout is in seconds (900), Verification shows AWS API also returns 900
      expect(project.timeoutInMinutes).toBe(900);
    });

    it('should have correct artifacts configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.artifacts?.type).toBe('S3');
      expect(project.artifacts?.location).toBe(outputs.artifactBucketName);
      expect(project.artifacts?.packaging).toBe('ZIP');
    });

    it('should have correct source configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.source?.type).toBe('NO_SOURCE');
      expect(project.source?.buildspec).toContain('npm install');
      expect(project.source?.buildspec).toContain('npm test');
      expect(project.source?.buildspec).toContain('npm run build');
    });

    it('should have CloudWatch Logs enabled', async () => {
      const command = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });

      const response = await codeBuildClient.send(command);
      const project = response.projects![0];

      expect(project.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
      expect(project.logsConfig?.cloudWatchLogs?.groupName).toMatch(/\/aws\/codebuild\//);
    });
  });

  describe('S3 Artifact Bucket', () => {
    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group for CodeBuild', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/${outputs.codeBuildProjectName}`,
      });

      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in project name', () => {
      expect(outputs.codeBuildProjectName).toMatch(/nodejs-build-/);
      expect(outputs.codeBuildProjectName).toContain('synth');
    });

    it('should include environment suffix in bucket name', () => {
      expect(outputs.artifactBucketName).toMatch(/codebuild-artifacts-/);
      expect(outputs.artifactBucketName).toContain('synth');
    });
  });
});
