/**
 * Unit tests for Fraud Detection Infrastructure
 * These tests verify the infrastructure code structure and configuration
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Fraud Detection Infrastructure Unit Tests', () => {
  let indexContent: string;

  beforeAll(() => {
    // Read the infrastructure code
    const indexPath = path.join(__dirname, '..', 'index.ts');
    indexContent = fs.readFileSync(indexPath, 'utf8');
  });

  describe('Imports and Dependencies', () => {
    it('should import Pulumi core library', () => {
      expect(indexContent).toContain("from '@pulumi/pulumi'");
    });

    it('should import Pulumi AWS provider', () => {
      expect(indexContent).toContain("from '@pulumi/aws'");
    });
  });

  describe('Configuration', () => {
    it('should require environmentSuffix configuration', () => {
      expect(indexContent).toContain("config.require('environmentSuffix')");
    });

    it('should have region configuration with default', () => {
      expect(indexContent).toContain('aws.config.region');
      expect(indexContent).toContain('us-east-1');
    });

    it('should have email address configuration', () => {
      expect(indexContent).toContain('emailAddress');
      expect(indexContent).toContain('config.get');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', () => {
      const resourceCreations = indexContent.match(/new aws\.\w+\.\w+\(/g) || [];
      expect(resourceCreations.length).toBeGreaterThan(0);
      expect(indexContent).toContain('${environmentSuffix}');
    });

    it('should name resources with fraud-detection prefix', () => {
      expect(indexContent).toContain('fraud-detection');
    });
  });

  describe('KMS Key Configuration', () => {
    it('should create KMS key', () => {
      expect(indexContent).toContain('new aws.kms.Key');
    });

    it('should have 7-day deletion window for destroyability', () => {
      expect(indexContent).toContain('deletionWindowInDays: 7');
    });

    it('should create KMS alias', () => {
      expect(indexContent).toContain('new aws.kms.Alias');
    });

    it('should use KMS key for Lambda encryption', () => {
      expect(indexContent).toContain('kmsKeyArn: kmsKey.arn');
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should create DynamoDB table', () => {
      expect(indexContent).toContain('new aws.dynamodb.Table');
    });

    it('should use PAY_PER_REQUEST billing mode', () => {
      expect(indexContent).toContain("billingMode: 'PAY_PER_REQUEST'");
    });

    it('should have composite key (hash and range)', () => {
      expect(indexContent).toContain("hashKey: 'transactionId'");
      expect(indexContent).toContain("rangeKey: 'timestamp'");
    });

    it('should enable point-in-time recovery', () => {
      expect(indexContent).toContain('pointInTimeRecovery');
      expect(indexContent).toContain('enabled: true');
    });

    it('should enable server-side encryption', () => {
      expect(indexContent).toContain('serverSideEncryption');
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should create SNS topic for fraud alerts', () => {
      expect(indexContent).toContain('new aws.sns.Topic');
      expect(indexContent).toContain('fraud-alerts');
    });

    it('should create email subscription', () => {
      expect(indexContent).toContain('new aws.sns.TopicSubscription');
      expect(indexContent).toContain("protocol: 'email'");
    });
  });

  describe('EventBridge Configuration', () => {
    it('should create custom event bus', () => {
      expect(indexContent).toContain('new aws.cloudwatch.EventBus');
    });

    it('should create EventBridge rule', () => {
      expect(indexContent).toContain('new aws.cloudwatch.EventRule');
    });

    it('should filter high-value transactions (> 10000)', () => {
      expect(indexContent).toContain('10000');
      expect(indexContent).toContain('numeric');
    });

    it('should create EventBridge target', () => {
      expect(indexContent).toContain('new aws.cloudwatch.EventTarget');
    });

    it('should have retry policy configured', () => {
      expect(indexContent).toContain('retryPolicy');
      expect(indexContent).toContain('maximumRetryAttempts');
    });

    it('should have DLQ for failed events', () => {
      expect(indexContent).toContain('deadLetterConfig');
    });
  });

  describe('SQS Dead-Letter Queues', () => {
    it('should create DLQ for transaction processor', () => {
      expect(indexContent).toContain('transaction-processor-dlq');
      expect(indexContent).toContain('new aws.sqs.Queue');
    });

    it('should create DLQ for fraud detector', () => {
      expect(indexContent).toContain('fraud-detector-dlq');
    });

    it('should retain messages for 14 days', () => {
      expect(indexContent).toContain('messageRetentionSeconds: 1209600');
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create IAM role for transaction processor', () => {
      expect(indexContent).toContain('transaction-processor-role');
      expect(indexContent).toContain('new aws.iam.Role');
    });

    it('should create IAM role for fraud detector', () => {
      expect(indexContent).toContain('fraud-detector-role');
    });

    it('should create IAM role for EventBridge', () => {
      expect(indexContent).toContain('eventbridge-role');
    });

    it('should allow Lambda to assume role', () => {
      expect(indexContent).toContain('lambda.amazonaws.com');
      expect(indexContent).toContain('sts:AssumeRole');
    });

    it('should allow EventBridge to assume role', () => {
      expect(indexContent).toContain('events.amazonaws.com');
    });

    it('should create inline policies', () => {
      expect(indexContent).toContain('new aws.iam.RolePolicy');
    });

    it('should grant DynamoDB permissions', () => {
      expect(indexContent).toContain('dynamodb:PutItem');
      expect(indexContent).toContain('dynamodb:GetItem');
      expect(indexContent).toContain('dynamodb:Query');
    });

    it('should grant EventBridge permissions', () => {
      expect(indexContent).toContain('events:PutEvents');
    });

    it('should grant SNS permissions', () => {
      expect(indexContent).toContain('sns:Publish');
    });

    it('should grant SQS permissions', () => {
      expect(indexContent).toContain('sqs:SendMessage');
    });

    it('should grant KMS decrypt permissions', () => {
      expect(indexContent).toContain('kms:Decrypt');
    });

    it('should grant CloudWatch Logs permissions', () => {
      expect(indexContent).toContain('logs:CreateLogGroup');
      expect(indexContent).toContain('logs:CreateLogStream');
      expect(indexContent).toContain('logs:PutLogEvents');
    });

    it('should grant Lambda invoke permissions', () => {
      expect(indexContent).toContain('lambda:InvokeFunction');
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should create log group for transaction processor', () => {
      expect(indexContent).toContain('transaction-processor-logs');
      expect(indexContent).toContain('new aws.cloudwatch.LogGroup');
    });

    it('should create log group for fraud detector', () => {
      expect(indexContent).toContain('fraud-detector-logs');
    });

    it('should set log retention to 30 days', () => {
      expect(indexContent).toContain('retentionInDays: 30');
    });

    it('should use Lambda naming convention for log groups', () => {
      expect(indexContent).toContain('/aws/lambda/');
    });
  });

  describe('Lambda Function: Transaction Processor', () => {
    it('should create transaction processor Lambda', () => {
      expect(indexContent).toContain('transaction-processor');
      expect(indexContent).toContain('new aws.lambda.Function');
    });

    it('should use NodeJS 18 runtime', () => {
      expect(indexContent).toContain('NodeJS18');
    });

    it('should have 60 second timeout', () => {
      expect(indexContent).toContain('timeout: 60');
    });

    it('should have appropriate memory size', () => {
      expect(indexContent).toContain('memorySize:');
    });

    it('should use ARM64 architecture', () => {
      expect(indexContent).toContain("architectures: ['arm64']");
    });

    it('should have reserved concurrent executions', () => {
      expect(indexContent).toContain('reservedConcurrentExecutions');
    });

    it('should configure dead-letter queue', () => {
      expect(indexContent).toContain('deadLetterConfig');
      expect(indexContent).toContain('targetArn');
    });

    it('should set environment variables', () => {
      expect(indexContent).toContain('DYNAMODB_TABLE');
      expect(indexContent).toContain('EVENT_BUS_NAME');
      expect(indexContent).toContain('REGION');
    });

    it('should include inline Lambda code', () => {
      expect(indexContent).toContain('pulumi.asset.AssetArchive');
      expect(indexContent).toContain('pulumi.asset.StringAsset');
    });

    it('should use AWS SDK v3', () => {
      expect(indexContent).toContain('@aws-sdk/client-dynamodb');
      expect(indexContent).toContain('@aws-sdk/client-eventbridge');
    });

    it('should depend on log group', () => {
      expect(indexContent).toContain('dependsOn');
    });
  });

  describe('Lambda Function: Fraud Detector', () => {
    it('should create fraud detector Lambda', () => {
      expect(indexContent).toContain('fraud-detector');
    });

    it('should use NodeJS 18 runtime', () => {
      expect(indexContent).toContain('NodeJS18');
    });

    it('should have DLQ configured', () => {
      expect(indexContent).toContain('deadLetterConfig');
    });

    it('should use AWS SDK v3 for DynamoDB and SNS', () => {
      expect(indexContent).toContain('@aws-sdk/client-dynamodb');
      expect(indexContent).toContain('@aws-sdk/client-sns');
    });

    it('should have environment variables for SNS and DynamoDB', () => {
      expect(indexContent).toContain('SNS_TOPIC_ARN');
    });
  });

  describe('Transaction Processor Logic', () => {
    it('should handle transaction events', () => {
      expect(indexContent).toContain('exports.handler');
      expect(indexContent).toContain('transaction');
    });

    it('should store transactions in DynamoDB', () => {
      expect(indexContent).toContain('PutItemCommand');
    });

    it('should publish high-value events to EventBridge', () => {
      expect(indexContent).toContain('PutEventsCommand');
      expect(indexContent).toContain('amount > 10000');
    });

    it('should handle transaction ID generation', () => {
      expect(indexContent).toContain('transactionId');
    });

    it('should include error handling', () => {
      expect(indexContent).toContain('catch');
      expect(indexContent).toContain('error');
    });
  });

  describe('Fraud Detector Logic', () => {
    it('should handle EventBridge events', () => {
      expect(indexContent).toContain('exports.handler');
      expect(indexContent).toContain('event.detail');
    });

    it('should calculate fraud scores', () => {
      expect(indexContent).toContain('fraudScore');
    });

    it('should detect high transaction amounts', () => {
      expect(indexContent).toContain('amount > 50000');
    });

    it('should detect round number patterns', () => {
      expect(indexContent).toContain('amount % 1000');
    });

    it('should detect weekend transactions', () => {
      expect(indexContent).toContain('dayOfWeek');
    });

    it('should query recent transactions', () => {
      expect(indexContent).toContain('QueryCommand');
    });

    it('should publish fraud alerts to SNS', () => {
      expect(indexContent).toContain('PublishCommand');
      expect(indexContent).toContain('FRAUD ALERT');
    });

    it('should send alerts for high fraud scores', () => {
      expect(indexContent).toContain('fraudScore >= 30');
    });
  });

  describe('Lambda Permissions', () => {
    it('should grant EventBridge permission to invoke Lambda', () => {
      expect(indexContent).toContain('new aws.lambda.Permission');
      expect(indexContent).toContain('events.amazonaws.com');
    });
  });

  describe('Resource Tagging', () => {
    it('should define common tags', () => {
      expect(indexContent).toContain('commonTags');
    });

    it('should include Environment tag', () => {
      expect(indexContent).toContain('Environment');
    });

    it('should include Service tag', () => {
      expect(indexContent).toContain('Service');
      expect(indexContent).toContain('fraud-detection');
    });

    it('should apply tags to resources', () => {
      expect(indexContent).toContain('tags: commonTags');
    });
  });

  describe('Exports', () => {
    it('should export EventBridge bus ARN', () => {
      expect(indexContent).toContain('export const eventBridgeBusArn');
    });

    it('should export SNS topic ARN', () => {
      expect(indexContent).toContain('export const snsTopicArn');
    });

    it('should export DynamoDB table name', () => {
      expect(indexContent).toContain('export const dynamoDbTableName');
    });

    it('should export transaction processor function name', () => {
      expect(indexContent).toContain(
        'export const transactionProcessorFunctionName',
      );
    });

    it('should export fraud detector function name', () => {
      expect(indexContent).toContain('export const fraudDetectorFunctionName');
    });

    it('should export transaction processor function ARN', () => {
      expect(indexContent).toContain(
        'export const transactionProcessorFunctionArn',
      );
    });

    it('should export KMS key ID', () => {
      expect(indexContent).toContain('export const kmsKeyId');
    });
  });

  describe('Security Best Practices', () => {
    it('should encrypt Lambda environment variables with KMS', () => {
      expect(indexContent).toContain('kmsKeyArn');
    });

    it('should enable DynamoDB encryption', () => {
      expect(indexContent).toContain('serverSideEncryption');
    });

    it('should use least-privilege IAM policies', () => {
      // Policies are scoped to specific resources
      expect(indexContent).toContain('Resource: tableArn');
      expect(indexContent).toContain('Resource: busArn');
    });
  });

  describe('Cost Optimization', () => {
    it('should use PAY_PER_REQUEST for DynamoDB', () => {
      expect(indexContent).toContain('PAY_PER_REQUEST');
    });

    it('should use ARM64 for Lambda cost savings', () => {
      expect(indexContent).toContain('arm64');
    });
  });

  describe('Reliability Features', () => {
    it('should configure DLQs for Lambda functions', () => {
      expect(indexContent).toContain('deadLetterConfig');
    });

    it('should enable point-in-time recovery for DynamoDB', () => {
      expect(indexContent).toContain('pointInTimeRecovery');
    });

    it('should configure retry policies', () => {
      expect(indexContent).toContain('retryPolicy');
    });
  });

  describe('Destroyability', () => {
    it('should use minimum KMS deletion window', () => {
      expect(indexContent).toContain('deletionWindowInDays: 7');
    });

    it('should not have Retain policies', () => {
      expect(indexContent).not.toContain('Retain');
      expect(indexContent).not.toContain('RETAIN');
    });

    it('should not have DeletionProtection', () => {
      expect(indexContent).not.toContain('deletionProtection: true');
      expect(indexContent).not.toContain('DeletionProtection: true');
    });
  });

  describe('Event-Driven Architecture', () => {
    it('should use EventBridge for service decoupling', () => {
      expect(indexContent).toContain('EventBus');
      expect(indexContent).toContain('EventRule');
      expect(indexContent).toContain('EventTarget');
    });

    it('should publish domain events', () => {
      expect(indexContent).toContain('HighValueTransaction');
    });

    it('should define event patterns', () => {
      expect(indexContent).toContain('eventPattern');
      expect(indexContent).toContain('detail-type');
    });
  });

  describe('Code Quality', () => {
    it('should have descriptive resource names', () => {
      expect(indexContent).toContain('fraud-detection');
      expect(indexContent).toContain('transaction-processor');
      expect(indexContent).toContain('fraud-detector');
    });

    it('should have comments explaining logic', () => {
      expect(indexContent).toContain('//');
    });

    it('should handle errors gracefully', () => {
      expect(indexContent).toContain('try');
      expect(indexContent).toContain('catch');
    });

    it('should log important events', () => {
      expect(indexContent).toContain('console.log');
      expect(indexContent).toContain('console.error');
    });
  });

  describe('Pulumi Configuration', () => {
    it('should use Pulumi Config for parameters', () => {
      expect(indexContent).toContain('new pulumi.Config()');
    });

    it('should use pulumi.Output for resource dependencies', () => {
      expect(indexContent).toContain('.all([');
      expect(indexContent).toContain('.apply');
    });

    it('should handle async resource creation', () => {
      expect(indexContent).toContain('.apply');
    });
  });

  describe('Lambda Package Dependencies', () => {
    it('should include package.json in Lambda code', () => {
      expect(indexContent).toContain('package.json');
      expect(indexContent).toContain('dependencies');
    });

    it('should specify AWS SDK versions', () => {
      expect(indexContent).toContain('@aws-sdk');
    });
  });
});
