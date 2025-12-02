/**
 * Unit tests for Pulumi Lambda Consolidation Infrastructure
 * These tests validate the infrastructure configuration and resource setup
 */

describe('Lambda Consolidation Infrastructure - Unit Tests', () => {
  // Read the infrastructure code to validate configuration
  const fs = require('fs');
  const path = require('path');
  const infraCode = fs.readFileSync(
    path.join(__dirname, '../lib/index.ts'),
    'utf8'
  );

  describe('Infrastructure Code Validation', () => {
    it('should define Lambda function with correct name pattern', () => {
      expect(infraCode).toContain('optimized-lambda');
      expect(infraCode).toContain('aws.lambda.Function');
    });

    it('should configure memory to 1024 MB (optimized)', () => {
      expect(infraCode).toContain('memorySize: 1024');
    });

    it('should configure timeout to 30 seconds', () => {
      expect(infraCode).toContain('timeout: 30');
    });

    it('should enable X-Ray tracing', () => {
      expect(infraCode).toContain('tracingConfig:');
      expect(infraCode).toContain("mode: 'Active'");
    });

    it('should configure Dead Letter Queue', () => {
      expect(infraCode).toContain('deadLetterConfig');
      expect(infraCode).toContain('targetArn: dlqQueue.arn');
    });

    it('should attach Lambda layer', () => {
      expect(infraCode).toContain('layers:');
      expect(infraCode).toContain('sharedLayer.arn');
    });

    it('should create DynamoDB table', () => {
      expect(infraCode).toContain('aws.dynamodb.Table');
      expect(infraCode).toContain('transactions-table');
    });

    it('should use PAY_PER_REQUEST billing for DynamoDB', () => {
      expect(infraCode).toContain("billingMode: 'PAY_PER_REQUEST'");
    });

    it('should create SQS queue for DLQ', () => {
      expect(infraCode).toContain('aws.sqs.Queue');
      expect(infraCode).toContain('lambda-dlq');
    });

    it('should set 14-day retention for DLQ', () => {
      expect(infraCode).toContain('messageRetentionSeconds: 1209600');
    });

    it('should create IAM role for Lambda', () => {
      expect(infraCode).toContain('aws.iam.Role');
      expect(infraCode).toContain('lambda-role');
    });

    it('should attach basic execution policy', () => {
      expect(infraCode).toContain('AWSLambdaBasicExecutionRole');
    });

    it('should attach X-Ray write policy', () => {
      expect(infraCode).toContain('AWSXRayDaemonWriteAccess');
    });

    it('should create DynamoDB access policy', () => {
      expect(infraCode).toContain('lambda-dynamodb-policy');
      expect(infraCode).toContain('dynamodb:GetItem');
      expect(infraCode).toContain('dynamodb:PutItem');
    });

    it('should create SQS access policy', () => {
      expect(infraCode).toContain('lambda-sqs-policy');
      expect(infraCode).toContain('sqs:SendMessage');
    });

    it('should create CloudWatch log group', () => {
      expect(infraCode).toContain('aws.cloudwatch.LogGroup');
      expect(infraCode).toContain('lambda-logs');
    });

    it('should set 7-day log retention', () => {
      expect(infraCode).toContain('retentionInDays: 7');
    });

    it('should create error rate alarm', () => {
      expect(infraCode).toContain('lambda-error-rate-alarm');
      expect(infraCode).toContain('aws.cloudwatch.MetricAlarm');
    });

    it('should use metric math for error rate calculation', () => {
      expect(infraCode).toContain('(errors / invocations) * 100');
    });

    it('should set 1% error rate threshold', () => {
      expect(infraCode).toContain('threshold: 1.0');
    });

    it('should create duration alarm', () => {
      expect(infraCode).toContain('lambda-duration-alarm');
      expect(infraCode).toContain('Duration');
    });

    it('should set 3000ms duration threshold', () => {
      expect(infraCode).toContain('threshold: 3000');
    });

    it('should use environmentSuffix in all resource names', () => {
      const resourceNamePatterns = [
        'lambda-role-${environmentSuffix}',
        'optimized-lambda-${environmentSuffix}',
        'transactions-table-${environmentSuffix}',
        'lambda-dlq-${environmentSuffix}',
        'shared-dependencies-${environmentSuffix}',
      ];

      resourceNamePatterns.forEach((pattern) => {
        expect(infraCode).toContain(pattern);
      });
    });

    it('should configure environment variables', () => {
      expect(infraCode).toContain('environment:');
      expect(infraCode).toContain('DYNAMODB_TABLE:');
      expect(infraCode).toContain('REGION:');
      expect(infraCode).toContain('ENVIRONMENT:');
    });

    it('should use nodejs18.x runtime', () => {
      expect(infraCode).toContain("runtime: 'nodejs18.x'");
    });

    it('should NOT use SnapStart (Node.js incompatible)', () => {
      // SnapStart only works with Java, not Node.js
      expect(infraCode).not.toContain('snapStart: {');
    });

    it('should have comment explaining SnapStart limitation', () => {
      expect(infraCode).toContain('SnapStart is NOT supported for Node.js');
    });

    it('should NOT configure reserved concurrency (quota limits)', () => {
      // Reserved concurrency removed due to AWS account quota constraints
      expect(infraCode).not.toContain('reservedConcurrentExecutions:');
    });

    it('should have comment explaining concurrency limitation', () => {
      expect(infraCode).toContain('Reserved concurrency NOT SET');
      expect(infraCode).toContain('account quota');
    });

    it('should create Lambda layer with Node.js runtime compatibility', () => {
      expect(infraCode).toContain('aws.lambda.LayerVersion');
      expect(infraCode).toContain('compatibleRuntimes');
      expect(infraCode).toContain('nodejs18.x');
      expect(infraCode).toContain('nodejs20.x');
    });

    it('should tag all resources with Environment and ManagedBy', () => {
      expect(infraCode).toMatch(/tags:\s*{\s*Environment:/g);
      expect(infraCode).toMatch(/ManagedBy:\s*'Pulumi'/g);
    });
  });

  describe('Lambda Function Code Validation', () => {
    it('should include payment processing route', () => {
      expect(infraCode).toContain("case 'payment':");
      expect(infraCode).toContain('processPayment');
    });

    it('should include fraud detection route', () => {
      expect(infraCode).toContain("case 'fraud':");
      expect(infraCode).toContain('detectFraud');
    });

    it('should include notification route', () => {
      expect(infraCode).toContain("case 'notification':");
      expect(infraCode).toContain('sendNotification');
    });

    it('should use AWS SDK v3 for DynamoDB', () => {
      expect(infraCode).toContain('@aws-sdk/client-dynamodb');
      expect(infraCode).toContain('DynamoDBClient');
      expect(infraCode).toContain('PutItemCommand');
    });

    it('should use AWS SDK v3 for SQS', () => {
      expect(infraCode).toContain('@aws-sdk/client-sqs');
      expect(infraCode).toContain('SQSClient');
    });

    it('should handle default route with error', () => {
      expect(infraCode).toContain('default:');
      expect(infraCode).toContain('Invalid route');
    });

    it('should implement error handling', () => {
      expect(infraCode).toContain('try {');
      expect(infraCode).toContain('catch (error)');
    });
  });

  describe('Export Validation', () => {
    it('should export lambdaFunctionName', () => {
      expect(infraCode).toContain('export const lambdaFunctionName');
    });

    it('should export lambdaFunctionArn', () => {
      expect(infraCode).toContain('export const lambdaFunctionArn');
    });

    it('should export lambdaRoleArn', () => {
      expect(infraCode).toContain('export const lambdaRoleArn');
    });

    it('should export dynamoTableName', () => {
      expect(infraCode).toContain('export const dynamoTableName');
    });

    it('should export dlqQueueUrl', () => {
      expect(infraCode).toContain('export const dlqQueueUrl');
    });

    it('should export dlqQueueArn', () => {
      expect(infraCode).toContain('export const dlqQueueArn');
    });

    it('should export layerArn', () => {
      expect(infraCode).toContain('export const layerArn');
    });

    it('should export errorRateAlarmArn', () => {
      expect(infraCode).toContain('export const errorRateAlarmArn');
    });

    it('should export durationAlarmArn', () => {
      expect(infraCode).toContain('export const durationAlarmArn');
    });
  });

  describe('Security Best Practices', () => {
    it('should use least privilege IAM for DynamoDB', () => {
      expect(infraCode).toContain('dynamodb:GetItem');
      expect(infraCode).toContain('dynamodb:PutItem');
      expect(infraCode).not.toContain('dynamodb:*');
    });

    it('should use least privilege IAM for SQS', () => {
      expect(infraCode).toContain('sqs:SendMessage');
      expect(infraCode).toContain('sqs:GetQueueAttributes');
      expect(infraCode).not.toContain('sqs:*');
    });

    it('should enable CloudWatch logging', () => {
      expect(infraCode).toContain('aws.cloudwatch.LogGroup');
    });

    it('should enable X-Ray tracing for monitoring', () => {
      expect(infraCode).toContain('tracingConfig');
    });
  });

  describe('Cost Optimization Validation', () => {
    it('should use optimized memory (1024 MB)', () => {
      expect(infraCode).toContain('memorySize: 1024');
      expect(infraCode).toContain('Optimized from 3008 MB');
    });

    it('should use Lambda layers to reduce package size', () => {
      expect(infraCode).toContain('aws.lambda.LayerVersion');
    });

    it('should use PAY_PER_REQUEST billing', () => {
      expect(infraCode).toContain("billingMode: 'PAY_PER_REQUEST'");
    });

    it('should consolidate three functions into one', () => {
      // Single function with routing
      expect(infraCode).toContain('switch(route)');
      expect(infraCode.match(/case\s+['"]payment['"]/g)?.length).toBe(1);
      expect(infraCode.match(/case\s+['"]fraud['"]/g)?.length).toBe(1);
      expect(infraCode.match(/case\s+['"]notification['"]/g)?.length).toBe(1);
    });
  });

  describe('Monitoring and Alerting', () => {
    it('should monitor error rate with 1% threshold', () => {
      expect(infraCode).toContain('lambda-error-rate-alarm');
      expect(infraCode).toContain('threshold: 1.0');
    });

    it('should monitor duration with 3-second threshold', () => {
      expect(infraCode).toContain('lambda-duration-alarm');
      expect(infraCode).toContain('threshold: 3000');
    });

    it('should use CloudWatch metric alarms', () => {
      expect(infraCode).toContain('aws.cloudwatch.MetricAlarm');
    });

    it('should configure alarm evaluation periods', () => {
      expect(infraCode).toContain('evaluationPeriods: 2');
    });

    it('should handle missing data appropriately', () => {
      expect(infraCode).toContain("treatMissingData: 'notBreaching'");
    });
  });

  describe('Consolidated Function Benefits', () => {
    it('should reduce number of functions from 3 to 1', () => {
      const functionCreations = infraCode.match(/new aws\.lambda\.Function/g);
      expect(functionCreations?.length).toBe(1);
    });

    it('should share execution role across routes', () => {
      expect(infraCode).toContain('role: lambdaRole.arn');
    });

    it('should share Lambda layer across routes', () => {
      expect(infraCode).toContain('layers: [sharedLayer.arn]');
    });

    it('should share DLQ across routes', () => {
      expect(infraCode).toContain('deadLetterConfig');
    });

    it('should share monitoring across routes', () => {
      // Single set of alarms for consolidated function
      const alarmCreations = infraCode.match(/new aws\.cloudwatch\.MetricAlarm/g);
      expect(alarmCreations?.length).toBe(2); // error rate + duration
    });
  });
});
