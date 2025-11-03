import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import { S3Client, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any;

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  } else {
    throw new Error(
      `Deployment outputs not found at ${outputsPath}. Please deploy the stack first.`
    );
  }
});

describe('Compliance Monitoring Stack Integration Tests', () => {
  const region = 'eu-west-1';

  describe('AWS Config Recorder', () => {
    test('Config Recorder is active and recording', async () => {
      const client = new ConfigServiceClient({ region });
      const command = new DescribeConfigurationRecordersCommand({});

      const response = await client.send(command);

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const recorder = response.ConfigurationRecorders!.find(r =>
        r.name?.includes('config-recorder')
      );
      expect(recorder).toBeDefined();
      expect(recorder!.recordingGroup).toBeDefined();
      expect(recorder!.recordingGroup!.allSupported).toBe(true);
    });
  });

  describe('AWS Config Rules', () => {
    test('Config Rules are deployed and active', async () => {
      const client = new ConfigServiceClient({ region });
      const command = new DescribeConfigRulesCommand({});

      const response = await client.send(command);

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules!.length).toBeGreaterThan(0);

      // Check for EC2 instance type rule
      const ec2Rule = response.ConfigRules!.find(r =>
        r.ConfigRuleName?.includes('ec2-instance-type')
      );
      expect(ec2Rule).toBeDefined();
      expect(ec2Rule!.ConfigRuleState).toBe('ACTIVE');

      // Check for S3 encryption rule
      const s3Rule = response.ConfigRules!.find(r =>
        r.ConfigRuleName?.includes('s3-bucket-encryption')
      );
      expect(s3Rule).toBeDefined();
      expect(s3Rule!.ConfigRuleState).toBe('ACTIVE');
    });
  });

  describe('S3 Compliance Bucket', () => {
    test('S3 bucket exists and has KMS encryption enabled', async () => {
      const client = new S3Client({ region });
      const bucketName = outputs.complianceBucketName;

      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(/compliance-reports-/);

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules
      ).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('aws:kms');
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic exists and is configured correctly', async () => {
      const client = new SNSClient({ region });
      const topicArn = outputs.snsTopicArn;

      expect(topicArn).toBeDefined();
      expect(topicArn).toMatch(/arn:aws:sns:/);
      expect(topicArn).toContain('compliance-alerts');

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await client.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('CloudWatch dashboard exists', async () => {
      const client = new CloudWatchClient({ region });
      const dashboardName = outputs.dashboardName;

      expect(dashboardName).toBeDefined();
      expect(dashboardName).toMatch(/compliance-monitoring-/);

      const command = new GetDashboardCommand({ DashboardName: dashboardName });
      const response = await client.send(command);

      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();

      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('All outputs include environment suffix', () => {
      expect(outputs.configRecorderName).toContain('synthi14kbq');
      expect(outputs.complianceBucketName).toContain('synthi14kbq');
      expect(outputs.dashboardName).toContain('synthi14kbq');
    });
  });
});
