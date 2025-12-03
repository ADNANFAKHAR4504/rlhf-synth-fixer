/**
 * Integration tests for AWS Compliance Monitoring Infrastructure
 * Tests use actual deployed resources from cfn-outputs/flat-outputs.json
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { SFNClient, DescribeStateMachineCommand } from '@aws-sdk/client-sfn';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';

// Load deployment outputs
const loadOutputs = () => {
  try {
    const outputsPath = join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    const outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
    return outputs;
  } catch (error) {
    console.error('Failed to load outputs:', error);
    throw new Error('Deployment outputs not found. Deploy infrastructure first.');
  }
};

describe('AWS Compliance Monitoring - Integration Tests', () => {
  let outputs: any;
  let configClient: ConfigServiceClient;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;
  let sqsClient: SQSClient;
  let sfnClient: SFNClient;
  let cloudWatchClient: CloudWatchClient;
  let s3Client: S3Client;

  beforeAll(() => {
    outputs = loadOutputs();
    configClient = new ConfigServiceClient({ region });
    lambdaClient = new LambdaClient({ region });
    snsClient = new SNSClient({ region });
    sqsClient = new SQSClient({ region });
    sfnClient = new SFNClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
    s3Client = new S3Client({ region });
  });

  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.configBucketName).toBeDefined();
      expect(outputs.configRecorderName).toBeDefined();
      expect(outputs.criticalTopicArn).toBeDefined();
      expect(outputs.warningTopicArn).toBeDefined();
      expect(outputs.complianceAnalyzerName).toBeDefined();
      expect(outputs.autoTaggerName).toBeDefined();
      expect(outputs.complianceWorkflowArn).toBeDefined();
      expect(outputs.complianceQueueUrl).toBeDefined();
      expect(outputs.dashboardName).toBeDefined();
      expect(outputs.s3EncryptionRuleName).toBeDefined();
      expect(outputs.rdsPublicAccessRuleName).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.configBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.configBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault
          ?.SSEAlgorithm
      ).toBe('AES256');
    });
  });

  describe('AWS Config Resources', () => {
    it('should have Config recorder configured', async () => {
      const command = new DescribeConfigurationRecordersCommand({
        ConfigurationRecorderNames: [outputs.configRecorderName],
      });
      const response = await configClient.send(command);
      expect(response.ConfigurationRecorders).toHaveLength(1);
      const recorder = response.ConfigurationRecorders[0];
      expect(recorder.name).toBe(outputs.configRecorderName);
      expect(recorder.recordingGroup?.allSupported).toBe(true);
      expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
    });

    it('should have delivery channel configured', async () => {
      const command = new DescribeDeliveryChannelsCommand({});
      const response = await configClient.send(command);
      expect(response.DeliveryChannels).toBeDefined();
      const channel = response.DeliveryChannels?.find(
        (c) => c.s3BucketName === outputs.configBucketName
      );
      expect(channel).toBeDefined();
      expect(channel?.s3BucketName).toBe(outputs.configBucketName);
    });

    it('should have S3 encryption Config rule', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [outputs.s3EncryptionRuleName],
      });
      const response = await configClient.send(command);
      expect(response.ConfigRules).toHaveLength(1);
      const rule = response.ConfigRules[0];
      expect(rule.ConfigRuleName).toBe(outputs.s3EncryptionRuleName);
      expect(rule.Source?.SourceIdentifier).toBe('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });

    it('should have RDS public access Config rule', async () => {
      const command = new DescribeConfigRulesCommand({
        ConfigRuleNames: [outputs.rdsPublicAccessRuleName],
      });
      const response = await configClient.send(command);
      expect(response.ConfigRules).toHaveLength(1);
      const rule = response.ConfigRules[0];
      expect(rule.ConfigRuleName).toBe(outputs.rdsPublicAccessRuleName);
      expect(rule.Source?.SourceIdentifier).toBe('RDS_INSTANCE_PUBLIC_ACCESS_CHECK');
    });
  });

  describe('Lambda Functions', () => {
    it('should have compliance analyzer function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.complianceAnalyzerName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(outputs.complianceAnalyzerName);
      expect(response.Configuration?.Runtime).toContain('nodejs18');
      expect(response.Configuration?.Timeout).toBe(180);
    });

    it('should have auto-tagger function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.autoTaggerName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(outputs.autoTaggerName);
      expect(response.Configuration?.Runtime).toContain('nodejs18');
      expect(response.Configuration?.Timeout).toBe(180);
    });

    it('should have environment variables configured for compliance analyzer', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.complianceAnalyzerName,
      });
      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.CRITICAL_TOPIC_ARN).toBeDefined();
      expect(envVars?.WARNING_TOPIC_ARN).toBeDefined();
    });
  });

  describe('SNS Topics', () => {
    it('should have critical alerts topic', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.criticalTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes?.TopicArn).toBe(outputs.criticalTopicArn);
      expect(response.Attributes?.DisplayName).toBe('Critical Compliance Alerts');
    });

    it('should have warning alerts topic', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.warningTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes?.TopicArn).toBe(outputs.warningTopicArn);
      expect(response.Attributes?.DisplayName).toBe('Warning Compliance Alerts');
    });
  });

  describe('SQS Queue', () => {
    it('should have compliance queue with correct attributes', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.complianceQueueUrl,
        AttributeNames: ['MessageRetentionPeriod', 'VisibilityTimeout'],
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
      expect(response.Attributes?.VisibilityTimeout).toBe('300'); // 5 minutes
    });
  });

  describe('Step Functions', () => {
    it('should have compliance workflow state machine', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.complianceWorkflowArn,
      });
      const response = await sfnClient.send(command);
      expect(response.stateMachineArn).toBe(outputs.complianceWorkflowArn);
      expect(response.name).toContain('compliance-workflow');
    });

    it('should have valid state machine definition', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.complianceWorkflowArn,
      });
      const response = await sfnClient.send(command);
      const definition = JSON.parse(response.definition || '{}');
      expect(definition.StartAt).toBe('AnalyzeCompliance');
      expect(definition.States.AnalyzeCompliance).toBeDefined();
      expect(definition.States.CheckComplianceStatus).toBeDefined();
      expect(definition.States.TagNonCompliantResources).toBeDefined();
      expect(definition.States.Success).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should have dashboard name in outputs', () => {
      expect(outputs.dashboardName).toContain('compliance-dashboard');
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should include environment suffix in all resource names', () => {
      const resources = [
        outputs.configBucketName,
        outputs.configRecorderName,
        outputs.complianceAnalyzerName,
        outputs.autoTaggerName,
        outputs.dashboardName,
        outputs.s3EncryptionRuleName,
        outputs.rdsPublicAccessRuleName,
      ];

      resources.forEach((name) => {
        expect(name).toMatch(/synths8m1k6l1$/);
      });
    });

    it('should have consistent naming pattern', () => {
      expect(outputs.configBucketName).toContain('config-delivery-');
      expect(outputs.configRecorderName).toContain('config-recorder-');
      expect(outputs.complianceAnalyzerName).toContain('compliance-analyzer-');
      expect(outputs.autoTaggerName).toContain('auto-tagger-');
      expect(outputs.dashboardName).toContain('compliance-dashboard-');
      expect(outputs.s3EncryptionRuleName).toContain('s3-encryption-rule-');
      expect(outputs.rdsPublicAccessRuleName).toContain('rds-public-access-rule-');
    });
  });

  describe('ARN Formats', () => {
    it('should have valid SNS topic ARNs', () => {
      expect(outputs.criticalTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d+:critical-alerts-/);
      expect(outputs.warningTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d+:warning-alerts-/);
    });

    it('should have valid Step Functions ARN', () => {
      expect(outputs.complianceWorkflowArn).toMatch(
        /^arn:aws:states:us-east-1:\d+:stateMachine:compliance-workflow-/
      );
    });

    it('should have valid SQS queue URL', () => {
      expect(outputs.complianceQueueUrl).toMatch(
        /^https:\/\/sqs\.us-east-1\.amazonaws\.com\/\d+\/compliance-queue-/
      );
    });
  });
});
