/**
 * Integration tests for TapStack infrastructure
 * Uses real AWS resources deployed via Pulumi
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const lambdaClient = new LambdaClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const sqsClient = new SQSClient({ region });
const configClient = new ConfigServiceClient({ region });

describe('TapStack Integration Tests', () => {
  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.configBucketName).toBeDefined();
      expect(outputs.complianceTableName).toBeDefined();
      expect(outputs.complianceFunctionArn).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.dashboardName).toBeDefined();
    });

    it('should have outputs in correct format', () => {
      expect(typeof outputs.configBucketName).toBe('string');
      expect(typeof outputs.complianceTableName).toBe('string');
      expect(typeof outputs.complianceFunctionArn).toBe('string');
      expect(typeof outputs.snsTopicArn).toBe('string');
      expect(typeof outputs.dashboardName).toBe('string');
    });
  });

  describe('DynamoDB Table', () => {
    it('should exist and be active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.complianceTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table.TableStatus).toBe('ACTIVE');
    });

    it('should have correct schema with partition and sort keys', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.complianceTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table.KeySchema).toBeDefined();

      const partitionKey = response.Table.KeySchema.find(
        (key) => key.KeyType === 'HASH'
      );
      const sortKey = response.Table.KeySchema.find(
        (key) => key.KeyType === 'RANGE'
      );

      expect(partitionKey).toBeDefined();
      expect(partitionKey.AttributeName).toBe('resourceId');
      expect(sortKey).toBeDefined();
      expect(sortKey.AttributeName).toBe('timestamp');
    });

    it('should use on-demand billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.complianceTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table.BillingModeSummary.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });
  });

  describe('S3 Config Bucket', () => {
    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.configBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.configBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration.Rules
      ).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration.Rules.length
      ).toBeGreaterThan(0);
    });
  });

  describe('Lambda Function', () => {
    it('should exist and be active', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.complianceFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.State).toBe('Active');
    });

    it('should use Node.js 18.x runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.complianceFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.Runtime).toMatch(/nodejs18/);
    });

    it('should have correct memory size', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.complianceFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.MemorySize).toBe(256);
    });

    it('should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.complianceFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.TracingConfig).toBeDefined();
      expect(response.Configuration.TracingConfig.Mode).toBe('Active');
    });

    it('should have dead letter queue configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.complianceFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.DeadLetterConfig).toBeDefined();
      expect(
        response.Configuration.DeadLetterConfig.TargetArn
      ).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    it('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.TopicArn).toBe(outputs.snsTopicArn);
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should exist', async () => {
      const command = new ListDashboardsCommand({});

      const response = await cloudwatchClient.send(command);
      const dashboard = response.DashboardEntries.find(
        (d) => d.DashboardName === outputs.dashboardName
      );

      expect(dashboard).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    it('should have compliance schedule rule created', async () => {
      const command = new ListRulesCommand({});

      const response = await eventBridgeClient.send(command);
      const scheduleRule = response.Rules.find((rule) =>
        rule.Name.includes('compliance-schedule')
      );

      expect(scheduleRule).toBeDefined();
      expect(scheduleRule.ScheduleExpression).toBe('rate(6 hours)');
    });

    it('should have compliance config change rule created', async () => {
      const command = new ListRulesCommand({});

      const response = await eventBridgeClient.send(command);
      const configChangeRule = response.Rules.find((rule) =>
        rule.Name.includes('compliance-config-change')
      );

      expect(configChangeRule).toBeDefined();
    });

    it('should have compliance rule change rule created', async () => {
      const command = new ListRulesCommand({});

      const response = await eventBridgeClient.send(command);
      const ruleChangeRule = response.Rules.find((rule) =>
        rule.Name.includes('compliance-rule-change')
      );

      expect(ruleChangeRule).toBeDefined();
    });

    it('should have Lambda targets configured for schedule rule', async () => {
      const listRulesCommand = new ListRulesCommand({});
      const rulesResponse = await eventBridgeClient.send(listRulesCommand);
      const scheduleRule = rulesResponse.Rules.find((rule) =>
        rule.Name.includes('compliance-schedule')
      );

      const listTargetsCommand = new ListTargetsByRuleCommand({
        Rule: scheduleRule.Name,
      });

      const targetsResponse = await eventBridgeClient.send(
        listTargetsCommand
      );
      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets.length).toBeGreaterThan(0);

      const lambdaTarget = targetsResponse.Targets.find((target) =>
        target.Arn.includes('lambda')
      );
      expect(lambdaTarget).toBeDefined();
    });
  });

  describe('AWS Config Rules', () => {
    it('should have S3 encryption rule created', async () => {
      const command = new DescribeConfigRulesCommand({});

      const response = await configClient.send(command);
      const s3EncryptionRule = response.ConfigRules.find((rule) =>
        rule.ConfigRuleName.includes('s3-encryption-rule')
      );

      expect(s3EncryptionRule).toBeDefined();
      expect(s3EncryptionRule.Source.SourceIdentifier).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );
    });

    it('should have S3 versioning rule created', async () => {
      const command = new DescribeConfigRulesCommand({});

      const response = await configClient.send(command);
      const s3VersioningRule = response.ConfigRules.find((rule) =>
        rule.ConfigRuleName.includes('s3-versioning-rule')
      );

      expect(s3VersioningRule).toBeDefined();
      expect(s3VersioningRule.Source.SourceIdentifier).toBe(
        'S3_BUCKET_VERSIONING_ENABLED'
      );
    });

    it('should have RDS encryption rule created', async () => {
      const command = new DescribeConfigRulesCommand({});

      const response = await configClient.send(command);
      const rdsEncryptionRule = response.ConfigRules.find((rule) =>
        rule.ConfigRuleName.includes('rds-encryption-rule')
      );

      expect(rdsEncryptionRule).toBeDefined();
      expect(rdsEncryptionRule.Source.SourceIdentifier).toBe(
        'RDS_STORAGE_ENCRYPTED'
      );
    });

    it('should have EC2 monitoring rule created', async () => {
      const command = new DescribeConfigRulesCommand({});

      const response = await configClient.send(command);
      const ec2MonitoringRule = response.ConfigRules.find((rule) =>
        rule.ConfigRuleName.includes('ec2-monitoring-rule')
      );

      expect(ec2MonitoringRule).toBeDefined();
      expect(ec2MonitoringRule.Source.SourceIdentifier).toBe(
        'EC2_INSTANCE_DETAILED_MONITORING_ENABLED'
      );
    });
  });

  describe('End-to-End Compliance Workflow', () => {
    it('should have all components for compliance monitoring', async () => {
      // Verify Lambda function exists
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.complianceFunctionArn,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.Configuration).toBeDefined();

      // Verify DynamoDB table exists
      const dynamoCommand = new DescribeTableCommand({
        TableName: outputs.complianceTableName,
      });
      const dynamoResponse = await dynamoClient.send(dynamoCommand);
      expect(dynamoResponse.Table).toBeDefined();

      // Verify SNS topic exists
      const snsCommand = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });
      const snsResponse = await snsClient.send(snsCommand);
      expect(snsResponse.Attributes).toBeDefined();

      // Verify Config rules exist
      const configCommand = new DescribeConfigRulesCommand({});
      const configResponse = await configClient.send(configCommand);
      const configRules = configResponse.ConfigRules.filter((rule) =>
        rule.ConfigRuleName.includes('synthr7y9l9d0')
      );
      expect(configRules.length).toBeGreaterThanOrEqual(4);
    });
  });
});
