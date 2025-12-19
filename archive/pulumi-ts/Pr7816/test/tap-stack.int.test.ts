import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  ListDashboardsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const loadOutputs = () => {
  const outputPath = path.join(
    process.cwd(),
    'cfn-outputs',
    'flat-outputs.json'
  );

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Outputs file not found at ${outputPath}. Please deploy the stack first.`
    );
  }

  return JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
};

describe('AWS Config Compliance System Integration Tests', () => {
  let outputs: any;
  let configClient: ConfigServiceClient;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let lambdaClient: LambdaClient;
  let cloudwatchClient: CloudWatchClient;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    outputs = loadOutputs();
    configClient = new ConfigServiceClient({ region });
    s3Client = new S3Client({ region });
    snsClient = new SNSClient({ region });
    lambdaClient = new LambdaClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
  });

  describe('AWS Config Setup', () => {
    test('Config recorder exists and is enabled', async () => {
      const recorderName = outputs.configRecorderName;
      expect(recorderName).toBeDefined();
      expect(recorderName).toBeTruthy();

      const command = new DescribeConfigurationRecordersCommand({
        ConfigurationRecorderNames: [recorderName],
      });

      const result = await configClient.send(command);
      expect(result.ConfigurationRecorders).toBeDefined();
      expect(result.ConfigurationRecorders!.length).toBe(1);

      const recorder = result.ConfigurationRecorders![0];
      expect(recorder.name).toBe(recorderName);
      expect(recorder.roleARN).toBeDefined();
      expect(recorder.recordingGroup).toBeDefined();
      expect(recorder.recordingGroup!.allSupported).toBe(true);
    });

    test('Delivery channel exists and configured correctly', async () => {
      const command = new DescribeDeliveryChannelsCommand({});
      const result = await configClient.send(command);

      expect(result.DeliveryChannels).toBeDefined();
      expect(result.DeliveryChannels!.length).toBeGreaterThan(0);

      const channel = result.DeliveryChannels!.find(ch =>
        ch.s3BucketName?.includes('config-bucket')
      );
      expect(channel).toBeDefined();
      expect(channel!.s3BucketName).toBeTruthy();
    });

    test('Config rules exist and are configured', async () => {
      const command = new DescribeConfigRulesCommand({});
      const result = await configClient.send(command);

      expect(result.ConfigRules).toBeDefined();
      expect(result.ConfigRules!.length).toBeGreaterThan(0);

      // Check for S3 encryption rule
      const s3Rule = result.ConfigRules!.find(rule =>
        rule.ConfigRuleName?.includes('s3-bucket-encryption')
      );
      expect(s3Rule).toBeDefined();
      expect(s3Rule!.Source).toBeDefined();
      expect(s3Rule!.Source!.SourceIdentifier).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );

      // Check for EC2 tags rule
      const ec2Rule = result.ConfigRules!.find(rule =>
        rule.ConfigRuleName?.includes('ec2-required-tags')
      );
      expect(ec2Rule).toBeDefined();
      expect(ec2Rule!.Source).toBeDefined();
      expect(ec2Rule!.Source!.SourceIdentifier).toBe('REQUIRED_TAGS');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Config bucket exists and is accessible', async () => {
      const bucketArn = outputs.bucketArn;
      expect(bucketArn).toBeDefined();

      const bucketName = bucketArn.split(':::')[1] || bucketArn.split(':')[5];
      const command = new HeadBucketCommand({ Bucket: bucketName });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Bucket has versioning enabled', async () => {
      const bucketArn = outputs.bucketArn;
      const bucketName = bucketArn.split(':::')[1] || bucketArn.split(':')[5];

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const result = await s3Client.send(command);

      expect(result.Status).toBe('Enabled');
    });

    test('Bucket has encryption enabled', async () => {
      const bucketArn = outputs.bucketArn;
      const bucketName = bucketArn.split(':::')[1] || bucketArn.split(':')[5];

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const result = await s3Client.send(command);

      expect(result.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        result.ServerSideEncryptionConfiguration!.Rules!.length
      ).toBeGreaterThan(0);
      expect(
        result.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
    });
  });

  describe('SNS Topic Configuration', () => {
    test('Compliance notification topic exists', async () => {
      const topicArn = outputs.snsTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const result = await snsClient.send(command);
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.DisplayName).toBe(
        'Compliance Violation Notifications'
      );
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Compliance reporter function exists', async () => {
      const environmentSuffix =
        process.env.ENVIRONMENT_SUFFIX ||
        outputs.configRecorderName.split('-').pop();
      const functionName = `compliance-reporter-${environmentSuffix}`;

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const result = await lambdaClient.send(command);
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.Runtime).toBe('python3.11');
      expect(result.Configuration!.Handler).toBe('index.lambda_handler');
      expect(result.Configuration!.Timeout).toBe(300);
      expect(result.Configuration!.Environment).toBeDefined();
      expect(result.Configuration!.Environment!.Variables).toHaveProperty(
        'SNS_TOPIC_ARN'
      );
      expect(result.Configuration!.Environment!.Variables).toHaveProperty(
        'S3_BUCKET'
      );
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Compliance dashboard exists', async () => {
      const environmentSuffix =
        process.env.ENVIRONMENT_SUFFIX ||
        outputs.configRecorderName.split('-').pop();
      const dashboardName = `compliance-metrics-${environmentSuffix}`;

      const listCommand = new ListDashboardsCommand({
        DashboardNamePrefix: dashboardName,
      });

      const listResult = await cloudwatchClient.send(listCommand);
      expect(listResult.DashboardEntries).toBeDefined();
      expect(listResult.DashboardEntries!.length).toBeGreaterThan(0);

      const getCommand = new GetDashboardCommand({
        DashboardName: dashboardName,
      });

      const getResult = await cloudwatchClient.send(getCommand);
      expect(getResult.DashboardBody).toBeDefined();

      const dashboardBody = JSON.parse(getResult.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete compliance workflow is functional', async () => {
      // Verify all components are connected
      const recorderName = outputs.configRecorderName;
      const bucketArn = outputs.bucketArn;
      const topicArn = outputs.snsTopicArn;

      expect(recorderName).toBeTruthy();
      expect(bucketArn).toBeTruthy();
      expect(topicArn).toBeTruthy();

      // Verify Config recorder can write to S3
      const bucketName = bucketArn.split(':::')[1] || bucketArn.split(':')[5];
      const headBucketCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headBucketCommand)).resolves.not.toThrow();

      // Verify SNS topic exists for notifications
      const getTopicCommand = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });
      await expect(snsClient.send(getTopicCommand)).resolves.not.toThrow();

      // Verify Lambda can access Config
      const environmentSuffix = recorderName.split('-').pop();
      const functionName = `compliance-reporter-${environmentSuffix}`;
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const lambdaResult = await lambdaClient.send(getFunctionCommand);
      expect(lambdaResult.Configuration!.Environment!.Variables).toHaveProperty(
        'SNS_TOPIC_ARN',
        topicArn
      );
    });
  });
});
