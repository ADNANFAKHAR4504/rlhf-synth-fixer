import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
} from '@aws-sdk/client-codedeploy';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

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
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('artifact bucket exists and is accessible', async () => {
      const bucketName = outputs['artifact-bucket-name'];
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('content bucket has versioning enabled', async () => {
      const bucketName = outputs['content-bucket-name'];
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('artifact bucket has versioning enabled', async () => {
      const bucketName = outputs['artifact-bucket-name'];
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('content bucket has encryption enabled', async () => {
      const bucketName = outputs['content-bucket-name'];
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
      expect(distributionId).toBeDefined();

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      expect(response.Distribution?.DistributionConfig?.Enabled).toBe(true);
    });

    test('distribution has correct domain name', async () => {
      const distributionId = outputs['cloudfront-distribution-id'];
      const expectedDomain = outputs['cloudfront-domain-name'];

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      expect(response.Distribution?.DomainName).toBe(expectedDomain);
    });

    test('distribution enforces HTTPS', async () => {
      const distributionId = outputs['cloudfront-distribution-id'];

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      const viewerProtocolPolicy =
        response.Distribution?.DistributionConfig?.DefaultCacheBehavior
          ?.ViewerProtocolPolicy;
      expect(viewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('distribution has origin access control configured', async () => {
      const distributionId = outputs['cloudfront-distribution-id'];

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
      expect(pipelineName).toBeDefined();

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

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        (s) => s.name === 'Source'
      );
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('S3');
    });

    test('CodeBuild project exists', async () => {
      const projectName = outputs['codebuild-project-name'];
      expect(projectName).toBeDefined();

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
    });

    test('CodeBuild project uses correct image', async () => {
      const projectName = outputs['codebuild-project-name'];

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      const image = response.projects?.[0]?.environment?.image;
      expect(image).toBe('aws/codebuild/standard:7.0');
    });

    test('CodeDeploy application exists', async () => {
      const appName = outputs['codedeploy-application-name'];
      expect(appName).toBeDefined();

      const command = new GetApplicationCommand({ applicationName: appName });
      const response = await codeDeployClient.send(command);

      expect(response.application?.applicationName).toBe(appName);
      expect(response.application?.computePlatform).toBe('Server');
    });

    test('CodeDeploy deployment group exists', async () => {
      const appName = outputs['codedeploy-application-name'];
      const dgName = outputs['codedeploy-deployment-group-name'];
      expect(dgName).toBeDefined();

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
      expect(instanceId).toBeDefined();

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

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceType).toBe('t3.micro');
    });

    test('EC2 instance has public IP assigned', async () => {
      const instanceId = outputs['ec2-instance-id'];

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.PublicIpAddress).toBeDefined();
    });

    test('EC2 instance has IAM instance profile attached', async () => {
      const instanceId = outputs['ec2-instance-id'];

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
      expect(topicArn).toBeDefined();

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

      pipelineLogGroups?.forEach((lg) => {
        expect(lg.retentionInDays).toBeDefined();
        expect(lg.retentionInDays).toBe(14);
      });
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('pipeline can access source bucket', async () => {
      const s3Client = new S3Client({});
      const sourceBucket = outputs['source-bucket'];
      const sourceKey = outputs['source-object-key'];

      expect(sourceBucket).toBeDefined();
      expect(sourceKey).toBeDefined();

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

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('resource naming includes environment suffix', () => {
      const resourcesWithSuffix = [
        outputs['content-bucket-name'],
        outputs['artifact-bucket-name'],
        outputs['codepipeline-name'],
        outputs['codebuild-project-name'],
        outputs['codedeploy-application-name'],
      ];

      // At least one resource should have a suffix pattern (like -dev, -prod, -test, etc.)
      const hasSuffix = resourcesWithSuffix.some((name) =>
        /-(dev|prod|test|staging|pr\d+|synth\d+)/.test(name)
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
      ];

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

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      const viewerProtocolPolicy =
        response.Distribution?.DistributionConfig?.DefaultCacheBehavior
          ?.ViewerProtocolPolicy;
      expect(viewerProtocolPolicy).toBe('redirect-to-https');
    });
  });
});
