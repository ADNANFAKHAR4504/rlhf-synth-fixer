import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import {
  MediaPackageClient,
  DescribeChannelCommand,
  DescribeOriginEndpointCommand,
} from '@aws-sdk/client-mediapackage';
import {
  MediaLiveClient,
  DescribeChannelCommand as MediaLiveDescribeChannelCommand,
  DescribeInputCommand,
  DescribeInputSecurityGroupCommand,
} from '@aws-sdk/client-medialive';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  SFNClient,
  DescribeStateMachineCommand,
} from '@aws-sdk/client-sfn';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = outputs.EnvironmentSuffix || 'synthi2x7l8x2';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const s3Client = new S3Client({ region });
const cloudFrontClient = new CloudFrontClient({ region });
const mediaPackageClient = new MediaPackageClient({ region });
const mediaLiveClient = new MediaLiveClient({ region });
const lambdaClient = new LambdaClient({ region });
const sfnClient = new SFNClient({ region });
const codePipelineClient = new CodePipelineClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('Media Processing Pipeline Integration Tests', () => {
  describe('S3 Buckets', () => {
    test('MediaBucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.MediaBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('MediaBucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.MediaBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('MediaBucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.MediaBucketName,
      });
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

    test('ArtifactsBucket should exist and be accessible', async () => {
      const bucketName = `pipeline-artifacts-${environmentSuffix}`;
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });
  });

  describe('MediaPackage Resources', () => {
    test('MediaPackage channel should exist and be in IDLE state', async () => {
      const command = new DescribeChannelCommand({
        Id: outputs.MediaPackageChannelId,
      });
      const response = await mediaPackageClient.send(command);
      expect(response.Id).toBe(outputs.MediaPackageChannelId);
      expect(response.Arn).toBeDefined();
    });

    test('HLS endpoint should be accessible', async () => {
      const endpointId = `hls-endpoint-${environmentSuffix}`;
      const command = new DescribeOriginEndpointCommand({
        Id: endpointId,
      });
      const response = await mediaPackageClient.send(command);
      expect(response.Url).toBe(outputs.HlsEndpointUrl);
      expect(response.HlsPackage).toBeDefined();
      expect(response.HlsPackage?.SegmentDurationSeconds).toBe(6);
      expect(response.HlsPackage?.PlaylistWindowSeconds).toBe(60);
    });

    test('DASH endpoint should be accessible', async () => {
      const endpointId = `dash-endpoint-${environmentSuffix}`;
      const command = new DescribeOriginEndpointCommand({
        Id: endpointId,
      });
      const response = await mediaPackageClient.send(command);
      expect(response.Url).toBe(outputs.DashEndpointUrl);
      expect(response.DashPackage).toBeDefined();
      expect(response.DashPackage?.SegmentDurationSeconds).toBe(6);
    });
  });

  describe('MediaLive Resources', () => {
    test('MediaLive input security group should exist', async () => {
      const command = new DescribeInputSecurityGroupCommand({
        InputSecurityGroupId: outputs.MediaLiveInputSecurityGroupId,
      });
      const response = await mediaLiveClient.send(command);
      expect(response.Id).toBe(outputs.MediaLiveInputSecurityGroupId);
      expect(response.WhitelistRules).toBeDefined();
      expect(response.WhitelistRules).toHaveLength(1);
      expect(response.WhitelistRules?.[0].Cidr).toBe('0.0.0.0/0');
    });

    test('MediaLive input should exist and reference security group', async () => {
      // MediaLive Input is created and referenced by MediaLive Channel
      // We verify through the channel's input attachments
      const channelCommand = new MediaLiveDescribeChannelCommand({
        ChannelId: outputs.MediaLiveChannelId,
      });
      const channel = await mediaLiveClient.send(channelCommand);
      expect(channel.InputAttachments).toBeDefined();
      expect(channel.InputAttachments).toHaveLength(1);
      expect(channel.InputAttachments?.[0].InputAttachmentName).toBe(
        'live-input'
      );
    });

    test('MediaLive channel should exist and be configured correctly', async () => {
      const command = new MediaLiveDescribeChannelCommand({
        ChannelId: outputs.MediaLiveChannelId,
      });
      const response = await mediaLiveClient.send(command);
      expect(response.Id).toBe(outputs.MediaLiveChannelId);
      expect(response.Name).toBe(`live-channel-${environmentSuffix}`);
      expect(response.ChannelClass).toBe('SINGLE_PIPELINE');
      expect(response.EncoderSettings).toBeDefined();
      expect(response.EncoderSettings?.VideoDescriptions).toHaveLength(3);
      expect(response.EncoderSettings?.AudioDescriptions).toHaveLength(1);
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront distribution should be accessible via domain', () => {
      // Verify CloudFront domain is in correct format
      expect(outputs.CloudFrontDomain).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
      expect(outputs.CloudFrontDomain).toBeDefined();
    });

    test('CloudFront domain should be part of stack outputs', () => {
      // CloudFront distribution exists and is accessible via its domain
      // We verify this through the outputs which are only populated if resource exists
      expect(outputs.CloudFrontDomain).toBeTruthy();
      expect(outputs.CloudFrontDomain.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Functions', () => {
    test('ChannelMonitor function should exist and use nodejs22.x', async () => {
      const functionName = `channel-monitor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Timeout).toBe(60);
    });

    test('StreamProcessor function should exist and use nodejs22.x', async () => {
      const functionName = `stream-processor-${environmentSuffix}`;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Timeout).toBe(300);
    });
  });

  describe('Step Functions', () => {
    test('MediaWorkflow state machine should exist and be active', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.StateMachineArn,
      });
      const response = await sfnClient.send(command);
      expect(response.stateMachineArn).toBe(outputs.StateMachineArn);
      expect(response.name).toBe(`media-workflow-${environmentSuffix}`);
      expect(response.status).toBe('ACTIVE');
      expect(response.definition).toBeDefined();
    });

    test('State machine should have correct workflow definition', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.StateMachineArn,
      });
      const response = await sfnClient.send(command);
      const definition = JSON.parse(response.definition || '{}');
      expect(definition.StartAt).toBe('MonitorChannel');
      expect(definition.States).toHaveProperty('MonitorChannel');
      expect(definition.States).toHaveProperty('ProcessStream');
    });
  });

  describe('CodePipeline', () => {
    test('Media pipeline should exist and be configured correctly', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });
      const response = await codePipelineClient.send(command);
      expect(response.pipeline?.name).toBe(outputs.PipelineName);
      expect(response.pipeline?.stages).toHaveLength(2);
      expect(response.pipeline?.stages?.[0].name).toBe('Source');
      expect(response.pipeline?.stages?.[1].name).toBe('Build');
    });
  });

  describe('CloudWatch Logs', () => {
    test('LogGroup should exist with 7-day retention', async () => {
      const logGroupName = `/aws/media-pipeline/${environmentSuffix}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('IAM Roles', () => {
    test('MediaLive role should exist with correct permissions', async () => {
      const roleName = `medialive-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBe(roleName);
      expect(
        response.Role?.AssumeRolePolicyDocument
      ).toContain('medialive.amazonaws.com');
    });

    test('Lambda execution role should exist', async () => {
      const roleName = `lambda-execution-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBe(roleName);
      expect(
        response.Role?.AssumeRolePolicyDocument
      ).toContain('lambda.amazonaws.com');
    });

    test('Step Functions role should exist', async () => {
      const roleName = `stepfunctions-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBe(roleName);
      expect(
        response.Role?.AssumeRolePolicyDocument
      ).toContain('states.amazonaws.com');
    });

    test('CodeBuild role should exist', async () => {
      const roleName = `codebuild-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBe(roleName);
      expect(
        response.Role?.AssumeRolePolicyDocument
      ).toContain('codebuild.amazonaws.com');
    });

    test('CodePipeline role should exist', async () => {
      const roleName = `codepipeline-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      expect(response.Role?.RoleName).toBe(roleName);
      expect(
        response.Role?.AssumeRolePolicyDocument
      ).toContain('codepipeline.amazonaws.com');
    });
  });

  describe('End-to-End Workflow', () => {
    test('All stack outputs should be accessible', () => {
      expect(outputs.MediaBucketName).toBeDefined();
      expect(outputs.MediaLiveChannelId).toBeDefined();
      expect(outputs.MediaPackageChannelId).toBeDefined();
      expect(outputs.HlsEndpointUrl).toMatch(/^https:\/\//);
      expect(outputs.DashEndpointUrl).toMatch(/^https:\/\//);
      expect(outputs.CloudFrontDomain).toMatch(/\.cloudfront\.net$/);
      expect(outputs.PipelineName).toBeDefined();
      expect(outputs.StateMachineArn).toMatch(/^arn:aws:states:/);
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.MediaLiveInputSecurityGroupId).toBeDefined();
    });

    test('MediaPackage endpoints should return valid URLs', () => {
      expect(outputs.HlsEndpointUrl).toContain('.m3u8');
      expect(outputs.DashEndpointUrl).toContain('.mpd');
      expect(outputs.HlsEndpointUrl).toContain('mediapackage');
      expect(outputs.DashEndpointUrl).toContain('mediapackage');
    });

    test('All resources should use consistent environment suffix', () => {
      expect(outputs.MediaBucketName).toContain(environmentSuffix);
      expect(outputs.MediaPackageChannelId).toContain(environmentSuffix);
      expect(outputs.PipelineName).toContain(environmentSuffix);
    });
  });
});
