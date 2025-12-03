import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

const region = process.env.AWS_REGION || 'us-east-1';

describe('Compliance Monitoring System - Integration Tests', () => {
  let lambdaClient: LambdaClient;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let logsClient: CloudWatchLogsClient;
  let eventBridgeClient: EventBridgeClient;

  beforeAll(() => {
    lambdaClient = new LambdaClient({ region });
    s3Client = new S3Client({ region });
    snsClient = new SNSClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
    eventBridgeClient = new EventBridgeClient({ region });
  });

  describe('Lambda Function', () => {
    it('should exist and be accessible', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.lambdaFunctionName);
    });

    it('should have correct runtime', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Runtime).toMatch(/nodejs18/);
    });

    it('should have correct timeout and memory configuration', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBe(300);
      expect(response.MemorySize).toBe(512);
    });

    it('should have required environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.REQUIRED_TAGS).toBeDefined();
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBe(outputs.snsTopicArn);
      expect(response.Environment?.Variables?.REPORTS_BUCKET).toBe(outputs.reportsBucketName);
    });

    it('should have correct environment variable for required tags', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);
      const requiredTags = response.Environment?.Variables?.REQUIRED_TAGS;
      expect(requiredTags).toBe('Environment,CostCenter,Owner');
    });
  });

  describe('S3 Bucket', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.reportsBucketName,
      });
      await s3Client.send(command);
      // If no error thrown, bucket exists
      expect(true).toBe(true);
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.reportsBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.reportsBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('SNS Topic', () => {
    it('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    it('should have email subscription', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.snsTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions?.length).toBeGreaterThan(0);
      const emailSubscription = response.Subscriptions?.find(sub => sub.Protocol === 'email');
      expect(emailSubscription).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.logGroupName,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.logGroupName);
      expect(logGroup).toBeDefined();
    });

    it('should have 30-day retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.logGroupName,
      });
      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.logGroupName);
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('EventBridge Schedule', () => {
    it('should have event rule for 6-hour schedule', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'compliance-scan-schedule',
      });
      const response = await eventBridgeClient.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      const scheduleRule = response.Rules?.find(rule => 
        rule.ScheduleExpression === 'rate(6 hours)'
      );
      expect(scheduleRule).toBeDefined();
    });

    it('should have Lambda function as target', async () => {
      const listRulesCommand = new ListRulesCommand({
        NamePrefix: 'compliance-scan-schedule',
      });
      const rulesResponse = await eventBridgeClient.send(listRulesCommand);
      const scheduleRule = rulesResponse.Rules?.find(rule => 
        rule.ScheduleExpression === 'rate(6 hours)'
      );
      
      expect(scheduleRule).toBeDefined();
      
      if (scheduleRule?.Name) {
        const listTargetsCommand = new ListTargetsByRuleCommand({
          Rule: scheduleRule.Name,
        });
        const targetsResponse = await eventBridgeClient.send(listTargetsCommand);
        expect(targetsResponse.Targets).toBeDefined();
        expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
        
        const lambdaTarget = targetsResponse.Targets?.find(target => 
          target.Arn?.includes('lambda')
        );
        expect(lambdaTarget).toBeDefined();
      }
    });
  });

  describe('Resource Naming Convention', () => {
    it('all resources should use environmentSuffix', () => {
      expect(outputs.lambdaFunctionName).toMatch(/synthu2b9e0z6/);
      expect(outputs.reportsBucketName).toMatch(/synthu2b9e0z6/);
      expect(outputs.snsTopicArn).toMatch(/synthu2b9e0z6/);
      expect(outputs.logGroupName).toMatch(/synthu2b9e0z6/);
    });
  });

  describe('Integration Completeness', () => {
    it('all required outputs are present', () => {
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(outputs.reportsBucketName).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.logGroupName).toBeDefined();
    });

    it('outputs are non-empty strings', () => {
      expect(typeof outputs.lambdaFunctionName).toBe('string');
      expect(outputs.lambdaFunctionName.length).toBeGreaterThan(0);
      
      expect(typeof outputs.reportsBucketName).toBe('string');
      expect(outputs.reportsBucketName.length).toBeGreaterThan(0);
      
      expect(typeof outputs.snsTopicArn).toBe('string');
      expect(outputs.snsTopicArn.length).toBeGreaterThan(0);
      
      expect(typeof outputs.logGroupName).toBe('string');
      expect(outputs.logGroupName.length).toBeGreaterThan(0);
    });
  });
});
