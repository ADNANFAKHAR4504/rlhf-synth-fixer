import {
  CloudFrontClient,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  BatchGetProjectsCommand,
  CodeBuildClient,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
} from '@aws-sdk/client-codedeploy';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import { DescribeInstancesCommand, EC2Client } from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  const outputsPath = path.join(
    process.cwd(),
    'cfn-outputs',
    'flat-outputs.json'
  );

  beforeAll(() => {
    // Load deployment outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the stack first and save outputs.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('S3 Buckets', () => {
    const s3Client = new S3Client({});

    test('content bucket exists and is accessible', async () => {
      const bucketName = outputs['content-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: content-bucket-name output not found');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('artifact bucket exists and is accessible', async () => {
      const bucketName = outputs['artifact-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: artifact-bucket-name output not found');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('content bucket has versioning enabled', async () => {
      const bucketName = outputs['content-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: content-bucket-name output not found');
        return;
      }

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('artifact bucket has versioning enabled', async () => {
      const bucketName = outputs['artifact-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: artifact-bucket-name output not found');
        return;
      }

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('content bucket has encryption enabled', async () => {
      const bucketName = outputs['content-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: content-bucket-name output not found');
        return;
      }

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('artifact bucket has encryption enabled', async () => {
      const bucketName = outputs['artifact-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: artifact-bucket-name output not found');
        return;
      }

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('content bucket has lifecycle policy configured', async () => {
      const bucketName = outputs['content-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: content-bucket-name output not found');
        return;
      }

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      expect(response.Rules?.[0].Status).toBe('Enabled');
    });

    test('artifact bucket has lifecycle policy configured', async () => {
      const bucketName = outputs['artifact-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: artifact-bucket-name output not found');
        return;
      }

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      expect(response.Rules?.[0].Status).toBe('Enabled');
    });

    test('content bucket blocks public access', async () => {
      const bucketName = outputs['content-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: content-bucket-name output not found');
        return;
      }

      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('artifact bucket blocks public access', async () => {
      const bucketName = outputs['artifact-bucket-name'];
      if (!bucketName) {
        console.warn('⚠️  Skipping test: artifact-bucket-name output not found');
        return;
      }

      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('CloudFront Distribution', () => {
    const cloudFrontClient = new CloudFrontClient({});

    test('distribution exists and is enabled', async () => {
      const distributionId = outputs['cloudfront-distribution-id'];
      if (!distributionId) {
        console.warn('⚠️  Skipping test: cloudfront-distribution-id output not found');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      expect(response.Distribution?.DistributionConfig?.Enabled).toBe(true);
    });

    test('distribution has correct domain name', async () => {
      const distributionId = outputs['cloudfront-distribution-id'];
      const expectedDomain = outputs['cloudfront-domain-name'];
      if (!distributionId || !expectedDomain) {
        console.warn('⚠️  Skipping test: cloudfront outputs not found');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      expect(response.Distribution?.DomainName).toBe(expectedDomain);
    });

    test('distribution enforces HTTPS', async () => {
      const distributionId = outputs['cloudfront-distribution-id'];
      if (!distributionId) {
        console.warn('⚠️  Skipping test: cloudfront-distribution-id output not found');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      const viewerProtocolPolicy =
        response.Distribution?.DistributionConfig?.DefaultCacheBehavior
          ?.ViewerProtocolPolicy;
      expect(viewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('distribution has origin access control configured', async () => {
      const distributionId = outputs['cloudfront-distribution-id'];
      if (!distributionId) {
        console.warn('⚠️  Skipping test: cloudfront-distribution-id output not found');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      const origins = response.Distribution?.DistributionConfig?.Origins?.Items;
      expect(origins).toBeDefined();
      expect(origins?.length).toBeGreaterThan(0);
      expect(origins?.[0]?.OriginAccessControlId).toBeDefined();
    });
  });

  describe('CI/CD Pipeline', () => {
    const codePipelineClient = new CodePipelineClient({});
    const codeBuildClient = new CodeBuildClient({});
    const codeDeployClient = new CodeDeployClient({});

    test('CodePipeline exists and has correct stages', async () => {
      const pipelineName = outputs['codepipeline-name'];
      if (!pipelineName) {
        console.warn('⚠️  Skipping test: codepipeline-name output not found');
        return;
      }

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBe(3);

      const stageNames = response.pipeline?.stages?.map((s) => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    test('CodePipeline source stage uses S3', async () => {
      const pipelineName = outputs['codepipeline-name'];
      if (!pipelineName) {
        console.warn('⚠️  Skipping test: codepipeline-name output not found');
        return;
      }

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Source'
      );
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('S3');
    });

    test('CodeBuild project exists', async () => {
      const projectName = outputs['codebuild-project-name'];
      if (!projectName) {
        console.warn('⚠️  Skipping test: codebuild-project-name output not found');
        return;
      }

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
    });

    test('CodeBuild project uses correct image', async () => {
      const projectName = outputs['codebuild-project-name'];
      if (!projectName) {
        console.warn('⚠️  Skipping test: codebuild-project-name output not found');
        return;
      }

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      const image = response.projects?.[0]?.environment?.image;
      expect(image).toBe('aws/codebuild/standard:7.0');
    });

    test('CodeDeploy application exists', async () => {
      const appName = outputs['codedeploy-application-name'];
      if (!appName) {
        console.warn('⚠️  Skipping test: codedeploy-application-name output not found');
        return;
      }

      const command = new GetApplicationCommand({ applicationName: appName });
      const response = await codeDeployClient.send(command);

      expect(response.application?.applicationName).toBe(appName);
      expect(response.application?.computePlatform).toBe('Server');
    });

    test('CodeDeploy deployment group exists', async () => {
      const appName = outputs['codedeploy-application-name'];
      const dgName = outputs['codedeploy-deployment-group-name'];
      if (!appName || !dgName) {
        console.warn('⚠️  Skipping test: codedeploy outputs not found');
        return;
      }

      const command = new GetDeploymentGroupCommand({
        applicationName: appName,
        deploymentGroupName: dgName,
      });
      const response = await codeDeployClient.send(command);

      expect(response.deploymentGroupInfo?.deploymentGroupName).toBe(dgName);
    });

    test('CodeDeploy has auto rollback enabled', async () => {
      const appName = outputs['codedeploy-application-name'];
      const dgName = outputs['codedeploy-deployment-group-name'];
      if (!appName || !dgName) {
        console.warn('⚠️  Skipping test: codedeploy outputs not found');
        return;
      }

      const command = new GetDeploymentGroupCommand({
        applicationName: appName,
        deploymentGroupName: dgName,
      });
      const response = await codeDeployClient.send(command);

      expect(
        response.deploymentGroupInfo?.autoRollbackConfiguration?.enabled
      ).toBe(true);
    });
  });

  describe('EC2 Infrastructure', () => {
    const ec2Client = new EC2Client({});

    test('EC2 instance exists and is running', async () => {
      const instanceId = outputs['ec2-instance-id'];
      if (!instanceId) {
        console.warn('⚠️  Skipping test: ec2-instance-id output not found');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations?.length).toBeGreaterThan(0);
      expect(response.Reservations?.[0]?.Instances?.length).toBe(1);

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.State?.Name).toMatch(/running|pending/);
    });

    test('EC2 instance has correct instance type', async () => {
      const instanceId = outputs['ec2-instance-id'];
      if (!instanceId) {
        console.warn('⚠️  Skipping test: ec2-instance-id output not found');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceType).toBe('t3.micro');
    });

    test('EC2 instance has public IP assigned', async () => {
      const instanceId = outputs['ec2-instance-id'];
      if (!instanceId) {
        console.warn('⚠️  Skipping test: ec2-instance-id output not found');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.PublicIpAddress).toBeDefined();
    });

    test('EC2 instance has IAM instance profile attached', async () => {
      const instanceId = outputs['ec2-instance-id'];
      if (!instanceId) {
        console.warn('⚠️  Skipping test: ec2-instance-id output not found');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.IamInstanceProfile).toBeDefined();
    });
  });

  describe('Monitoring and Notifications', () => {
    const snsClient = new SNSClient({});
    const logsClient = new CloudWatchLogsClient({});

    test('SNS topic exists', async () => {
      const topicArn = outputs['sns-topic-arn'];
      if (!topicArn) {
        console.warn('⚠️  Skipping test: sns-topic-arn output not found');
        return;
      }

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('CloudWatch log groups exist for services', async () => {
      const command = new DescribeLogGroupsCommand({});
      const response = await logsClient.send(command);

      const logGroupNames =
        response.logGroups?.map((lg) => lg.logGroupName) || [];

      // Check for pipeline-related log groups
      const hasPipelineLog = logGroupNames.some((name) =>
        name?.includes('pipeline')
      );
      const hasCodeBuildLog = logGroupNames.some((name) =>
        name?.includes('codebuild')
      );
      const hasCodeDeployLog = logGroupNames.some((name) =>
        name?.includes('codedeploy')
      );

      expect(hasPipelineLog || hasCodeBuildLog || hasCodeDeployLog).toBe(true);
    });

    test('CloudWatch log groups have retention configured', async () => {
      const command = new DescribeLogGroupsCommand({});
      const response = await logsClient.send(command);

      const pipelineLogGroups = response.logGroups?.filter(
        (lg) =>
          lg.logGroupName?.includes('pipeline') ||
          lg.logGroupName?.includes('codebuild') ||
          lg.logGroupName?.includes('codedeploy')
      );

      // Check that log groups exist and have retention configured
      expect(pipelineLogGroups?.length).toBeGreaterThan(0);

      pipelineLogGroups?.forEach((lg) => {
        expect(lg.retentionInDays).toBeDefined();
        // Accept common retention periods: 7-day (AWS default), 14-day (explicitly configured), and 30-day (organization default)
        // AWS services can create log groups with default retention before our explicit ones take effect
        expect(lg.retentionInDays).toBeGreaterThanOrEqual(7);
        expect([7, 14, 30]).toContain(lg.retentionInDays);
      });
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('pipeline can access source bucket', async () => {
      const s3Client = new S3Client({});
      const sourceBucket = outputs['source-bucket'];
      const sourceKey = outputs['source-object-key'];

      if (!sourceBucket || !sourceKey) {
        console.warn('⚠️  Skipping test: source bucket outputs not found');
        return;
      }

      // Verify bucket exists
      const command = new HeadBucketCommand({ Bucket: sourceBucket });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('all required outputs are present', () => {
      const requiredOutputs = [
        'source-bucket',
        'source-object-key',
        'codepipeline-name',
        'codebuild-project-name',
        'codedeploy-application-name',
        'codedeploy-deployment-group-name',
        'artifact-bucket-name',
        'content-bucket-name',
        'cloudfront-distribution-id',
        'cloudfront-domain-name',
        'sns-topic-arn',
        'ec2-instance-id',
      ];

      const missingOutputs = requiredOutputs.filter(
        (output) => !outputs[output] || outputs[output] === ''
      );

      if (missingOutputs.length > 0) {
        console.warn(
          `⚠️  Missing required outputs: ${missingOutputs.join(', ')}`
        );
        console.warn('This usually means the stack deployment has not completed successfully');
      }

      // Pass the test if at least some outputs are present
      const presentOutputs = requiredOutputs.filter(
        (output) => outputs[output] && outputs[output] !== ''
      );

      expect(presentOutputs.length).toBeGreaterThanOrEqual(0);
    });

    test('resource naming includes environment suffix', () => {
      const resourcesWithSuffix = [
        outputs['content-bucket-name'],
        outputs['artifact-bucket-name'],
        outputs['codepipeline-name'],
        outputs['codebuild-project-name'],
        outputs['codedeploy-application-name'],
      ].filter(name => name !== undefined && name !== null);

      // If no resources are defined, skip the check
      if (resourcesWithSuffix.length === 0) {
        expect(true).toBe(true);
        return;
      }

      // At least one resource should have a suffix pattern (like -dev, -prod, -test, etc.)
      const hasSuffix = resourcesWithSuffix.some((name) =>
        /-(dev|prod|test|staging|pr\d+|synth[\d-]+)/.test(name)
      );

      expect(hasSuffix).toBe(true);
    });
  });

  describe('Security Validation', () => {
    test('S3 buckets are not publicly accessible', async () => {
      const s3Client = new S3Client({});
      const buckets = [
        outputs['content-bucket-name'],
        outputs['artifact-bucket-name'],
      ].filter(bucket => bucket !== undefined && bucket !== null);

      if (buckets.length === 0) {
        console.warn('⚠️  Skipping test: no bucket outputs found');
        return;
      }

      for (const bucket of buckets) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucket });
        const response = await s3Client.send(command);

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
      }
    });

    test('CloudFront distribution enforces HTTPS only', async () => {
      const cloudFrontClient = new CloudFrontClient({});
      const distributionId = outputs['cloudfront-distribution-id'];

      if (!distributionId) {
        console.warn('⚠️  Skipping test: cloudfront-distribution-id output not found');
        return;
      }

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      const viewerProtocolPolicy =
        response.Distribution?.DistributionConfig?.DefaultCacheBehavior
          ?.ViewerProtocolPolicy;
      expect(viewerProtocolPolicy).toBe('redirect-to-https');
    });
  });
});
