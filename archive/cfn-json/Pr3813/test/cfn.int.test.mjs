const { describe, test, expect, beforeAll } = require('@jest/globals');
const {
  S3Client,
  HeadBucketCommand,
  GetBucketAccelerateConfigurationCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketIntelligentTieringConfigurationCommand,
  ListBucketIntelligentTieringConfigurationsCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketInventoryConfigurationCommand,
  GetBucketPolicyCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const {
  CloudFrontClient,
  GetDistributionCommand,
  GetOriginAccessControlCommand,
} = require('@aws-sdk/client-cloudfront');
const {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} = require('@aws-sdk/client-iam');
const {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} = require('@aws-sdk/client-cloudwatch');
const {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} = require('@aws-sdk/client-cloudwatch-logs');
const {
  SNSClient,
  GetTopicAttributesCommand,
} = require('@aws-sdk/client-sns');
const fs = require('fs');
const path = require('path');

describe('CloudFormation Stack Integration Tests', () => {
  let outputs;
  let s3Client;
  let cloudFrontClient;
  let iamClient;
  let cloudWatchClient;
  let cloudWatchLogsClient;
  let snsClient;
  const region = process.env.AWS_REGION || 'us-east-2';

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    s3Client = new S3Client({ region });
    cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });
    iamClient = new IAMClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
    cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    snsClient = new SNSClient({ region });
  });

  describe('S3 Video Storage Bucket', () => {
    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.VideoStorageBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have Transfer Acceleration enabled', async () => {
      const command = new GetBucketAccelerateConfigurationCommand({
        Bucket: outputs.VideoStorageBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.VideoStorageBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.VideoStorageBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules.length).toBeGreaterThan(0);
      expect(response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have Intelligent-Tiering configurations', async () => {
      const command = new ListBucketIntelligentTieringConfigurationsCommand({
        Bucket: outputs.VideoStorageBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.IntelligentTieringConfigurationList).toBeDefined();
      expect(response.IntelligentTieringConfigurationList.length).toBeGreaterThan(0);

      const config = response.IntelligentTieringConfigurationList[0];
      expect(config.Status).toBe('Enabled');
      expect(config.Tierings).toBeDefined();
      expect(config.Tierings.length).toBeGreaterThan(0);
    });

    test('should have lifecycle configuration with Deep Archive transition', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.VideoStorageBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules.length).toBeGreaterThan(0);

      const deepArchiveRule = response.Rules.find(rule => rule.Transitions && rule.Transitions.some(t => t.StorageClass === 'DEEP_ARCHIVE'));
      expect(deepArchiveRule).toBeDefined();
      expect(deepArchiveRule.Status).toBe('Enabled');

      const deepArchiveTransition = deepArchiveRule.Transitions.find(t => t.StorageClass === 'DEEP_ARCHIVE');
      expect(deepArchiveTransition.Days).toBe(365);
    });

    test('should have inventory configuration', async () => {
      const command = new GetBucketInventoryConfigurationCommand({
        Bucket: outputs.VideoStorageBucketName,
        Id: 'WeeklyInventory',
      });
      const response = await s3Client.send(command);
      expect(response.InventoryConfiguration).toBeDefined();
      expect(response.InventoryConfiguration.IsEnabled).toBe(true);
      expect(response.InventoryConfiguration.Schedule.Frequency).toBe('Weekly');
      expect(response.InventoryConfiguration.OptionalFields).toContain('IntelligentTieringAccessTier');
    });

    test('should have bucket policy allowing CloudFront access', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.VideoStorageBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();

      const policy = JSON.parse(response.Policy);
      expect(policy.Statement).toBeDefined();

      const cloudFrontStatement = policy.Statement.find(
        s => s.Principal && s.Principal.Service === 'cloudfront.amazonaws.com'
      );
      expect(cloudFrontStatement).toBeDefined();
      expect(cloudFrontStatement.Action).toContain('s3:GetObject');
    });

    test('should allow uploading test file', async () => {
      const testContent = 'Test video content for integration testing';
      const testKey = 'test-video.txt';

      const putCommand = new PutObjectCommand({
        Bucket: outputs.VideoStorageBucketName,
        Key: testKey,
        Body: testContent,
      });

      await expect(s3Client.send(putCommand)).resolves.not.toThrow();

      const getCommand = new GetObjectCommand({
        Bucket: outputs.VideoStorageBucketName,
        Key: testKey,
      });

      const getResponse = await s3Client.send(getCommand);
      const retrievedContent = await getResponse.Body.transformToString();
      expect(retrievedContent).toBe(testContent);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: outputs.VideoStorageBucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    });
  });

  describe('S3 Inventory Bucket', () => {
    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.InventoryBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have lifecycle configuration for cleanup', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.InventoryBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules.length).toBeGreaterThan(0);

      const expirationRule = response.Rules.find(rule => rule.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule.Status).toBe('Enabled');
      expect(expirationRule.Expiration.Days).toBe(90);
    });

    test('should have bucket policy allowing S3 inventory delivery', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.InventoryBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();

      const policy = JSON.parse(response.Policy);
      const s3Statement = policy.Statement.find(
        s => s.Principal && s.Principal.Service === 's3.amazonaws.com'
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:PutObject');
    });
  });

  describe('CloudFront Distribution', () => {
    test('should exist and be enabled', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);
      expect(response.Distribution).toBeDefined();
      expect(response.Distribution.DistributionConfig.Enabled).toBe(true);
      expect(response.Distribution.Status).toBeDefined();
    });

    test('should have correct domain name', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);
      expect(response.Distribution.DomainName).toBe(outputs.CloudFrontDistributionDomain);
    });

    test('should use HTTP/2 and HTTP/3', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);
      expect(response.Distribution.DistributionConfig.HttpVersion).toBe('http2and3');
    });

    test('should have S3 origin configured', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);
      expect(response.Distribution.DistributionConfig.Origins.Items).toBeDefined();
      expect(response.Distribution.DistributionConfig.Origins.Items.length).toBeGreaterThan(0);

      const s3Origin = response.Distribution.DistributionConfig.Origins.Items[0];
      expect(s3Origin.DomainName).toContain(outputs.VideoStorageBucketName);
    });

    test('should enforce HTTPS', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);
      const cacheBehavior = response.Distribution.DistributionConfig.DefaultCacheBehavior;
      expect(cacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('should have Origin Access Control configured', async () => {
      const getDistCommand = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const distResponse = await cloudFrontClient.send(getDistCommand);

      const origin = distResponse.Distribution.DistributionConfig.Origins.Items[0];
      expect(origin.OriginAccessControlId).toBeDefined();

      const getOACCommand = new GetOriginAccessControlCommand({
        Id: origin.OriginAccessControlId,
      });
      const oacResponse = await cloudFrontClient.send(getOACCommand);
      expect(oacResponse.OriginAccessControl).toBeDefined();
      expect(oacResponse.OriginAccessControl.OriginAccessControlConfig.OriginAccessControlOriginType).toBe('s3');
      expect(oacResponse.OriginAccessControl.OriginAccessControlConfig.SigningBehavior).toBe('always');
    });
  });

  describe('IAM Resources', () => {
    test('Video Upload Role should exist', async () => {
      const roleName = outputs.VideoUploadRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role.Arn).toBe(outputs.VideoUploadRoleArn);
    });

    test('Video Upload Role should have correct trust policy', async () => {
      const roleName = outputs.VideoUploadRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
      expect(trustPolicy.Statement).toBeDefined();

      const ec2Statement = trustPolicy.Statement.find(
        s => s.Principal && s.Principal.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Action).toBe('sts:AssumeRole');
    });

    test('Video Upload Policy should be attached to role', async () => {
      const roleName = outputs.VideoUploadRoleArn.split('/').pop();

      const listInlineCommand = new ListRolePoliciesCommand({
        RoleName: roleName,
      });
      const inlineResponse = await iamClient.send(listInlineCommand);
      expect(inlineResponse.PolicyNames).toBeDefined();
      expect(inlineResponse.PolicyNames.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Bucket Size Alarm should exist and be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`video-bucket-size-alarm-${process.env.ENVIRONMENT_SUFFIX || 'synth60194723'}-TapStack${process.env.ENVIRONMENT_SUFFIX || 'synth60194723'}`],
      });
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms.length).toBe(1);

      const alarm = response.MetricAlarms[0];
      expect(alarm.MetricName).toBe('BucketSizeBytes');
      expect(alarm.Namespace).toBe('AWS/S3');
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Threshold).toBe(1099511627776);
    });

    test('Object Count Alarm should exist and be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`video-object-count-alarm-${process.env.ENVIRONMENT_SUFFIX || 'synth60194723'}-TapStack${process.env.ENVIRONMENT_SUFFIX || 'synth60194723'}`],
      });
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms.length).toBe(1);

      const alarm = response.MetricAlarms[0];
      expect(alarm.MetricName).toBe('NumberOfObjects');
      expect(alarm.Namespace).toBe('AWS/S3');
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Threshold).toBe(100000);
    });

    test('CloudWatch Dashboard should exist', async () => {
      const command = new GetDashboardCommand({
        DashboardName: `VideoStorageDashboard-${process.env.ENVIRONMENT_SUFFIX || 'synth60194723'}-TapStack${process.env.ENVIRONMENT_SUFFIX || 'synth60194723'}`,
      });
      const response = await cloudWatchClient.send(command);
      expect(response.DashboardBody).toBeDefined();

      const dashboard = JSON.parse(response.DashboardBody);
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThan(0);
    });

    test('CloudWatch Log Group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/s3/video-storage/${process.env.ENVIRONMENT_SUFFIX || 'synth60194723'}`,
      });
      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups.length).toBeGreaterThan(0);

      const logGroup = response.logGroups[0];
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  describe('End-to-End Workflows', () => {
    test('should allow complete video upload workflow', async () => {
      const testFileName = `test-video-${Date.now()}.mp4`;
      const testContent = Buffer.from('Mock video file content for testing');

      const putCommand = new PutObjectCommand({
        Bucket: outputs.VideoStorageBucketName,
        Key: testFileName,
        Body: testContent,
        ContentType: 'video/mp4',
      });

      const putResponse = await s3Client.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      const getCommand = new GetObjectCommand({
        Bucket: outputs.VideoStorageBucketName,
        Key: testFileName,
      });

      const getResponse = await s3Client.send(getCommand);
      expect(getResponse.$metadata.httpStatusCode).toBe(200);
      expect(getResponse.ContentType).toBe('video/mp4');

      const deleteCommand = new DeleteObjectCommand({
        Bucket: outputs.VideoStorageBucketName,
        Key: testFileName,
      });
      await s3Client.send(deleteCommand);
    });

    test('Transfer Acceleration endpoint should be properly formatted', () => {
      expect(outputs.TransferAccelerationEndpoint).toContain('s3-accelerate.amazonaws.com');
      expect(outputs.TransferAccelerationEndpoint).toContain(outputs.VideoStorageBucketName);
    });

    test('CloudFront distribution should be ready for content delivery', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);

      expect(['Deployed', 'InProgress']).toContain(response.Distribution.Status);
      expect(response.Distribution.DistributionConfig.DefaultCacheBehavior.Compress).toBe(true);
    });

    test('All outputs should be properly defined and accessible', () => {
      expect(outputs.VideoStorageBucketName).toBeDefined();
      expect(outputs.VideoStorageBucketArn).toBeDefined();
      expect(outputs.CloudFrontDistributionId).toBeDefined();
      expect(outputs.CloudFrontDistributionDomain).toBeDefined();
      expect(outputs.TransferAccelerationEndpoint).toBeDefined();
      expect(outputs.VideoUploadRoleArn).toBeDefined();
      expect(outputs.InventoryBucketName).toBeDefined();
      expect(outputs.DashboardURL).toBeDefined();

      expect(outputs.VideoStorageBucketArn).toContain('arn:aws:s3:::');
      expect(outputs.CloudFrontDistributionDomain).toContain('cloudfront.net');
      expect(outputs.VideoUploadRoleArn).toContain('arn:aws:iam::');
      expect(outputs.DashboardURL).toContain('console.aws.amazon.com/cloudwatch');
    });
  });
});
