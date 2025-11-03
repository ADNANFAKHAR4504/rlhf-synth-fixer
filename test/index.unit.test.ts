/**
 * Unit tests for index.ts infrastructure code
 * Tests actual resource definitions and configurations
 */

import * as fs from 'fs';
import * as path from 'path';

describe('index.ts Infrastructure Code Tests', () => {
  let indexContent: string;

  beforeAll(() => {
    indexContent = fs.readFileSync(
      path.join(__dirname, '../index.ts'),
      'utf-8'
    );
  });

  describe('Resource Definitions', () => {
    it('should import required Pulumi modules', () => {
      expect(indexContent).toContain("import * as pulumi from '@pulumi/pulumi'");
      expect(indexContent).toContain("import * as aws from '@pulumi/aws'");
    });

    it('should define environmentSuffix configuration', () => {
      expect(indexContent).toContain("config.require('environmentSuffix')");
    });

    it('should define KMS key for encryption', () => {
      expect(indexContent).toContain('aws.kms.Key');
      expect(indexContent).toContain('lambda-encryption-key');
      expect(indexContent).toContain('enableKeyRotation: true');
    });

    it('should define KMS key alias', () => {
      expect(indexContent).toContain('aws.kms.Alias');
      expect(indexContent).toContain('lambda-key-alias');
    });

    it('should define S3 bucket for data', () => {
      expect(indexContent).toContain('aws.s3.Bucket');
      expect(indexContent).toContain('etl-data-bucket');
      expect(indexContent).toContain('forceDestroy: true');
    });

    it('should define DynamoDB table', () => {
      expect(indexContent).toContain('aws.dynamodb.Table');
      expect(indexContent).toContain('etl-metadata-table');
      expect(indexContent).toContain("billingMode: 'PAY_PER_REQUEST'");
    });

    it('should define SQS dead letter queue', () => {
      expect(indexContent).toContain('aws.sqs.Queue');
      expect(indexContent).toContain('etl-dlq');
      expect(indexContent).toContain('messageRetentionSeconds: 1209600');
    });

    it('should define Lambda layer', () => {
      expect(indexContent).toContain('aws.lambda.LayerVersion');
      expect(indexContent).toContain('shared-deps-layer');
      expect(indexContent).toContain("'nodejs18.x'");
    });

    it('should define IAM roles for Lambda functions', () => {
      expect(indexContent).toContain('aws.iam.Role');
      expect(indexContent).toContain('api-handler-role');
      expect(indexContent).toContain('batch-processor-role');
      expect(indexContent).toContain("'sts:AssumeRole'");
    });

    it('should define IAM policies with least privilege', () => {
      expect(indexContent).toContain('aws.iam.RolePolicy');
      expect(indexContent).toContain('api-handler-policy');
      expect(indexContent).toContain('batch-processor-policy');
    });

    it('should define CloudWatch Log Groups', () => {
      expect(indexContent).toContain('aws.cloudwatch.LogGroup');
      expect(indexContent).toContain('api-handler-logs');
      expect(indexContent).toContain('batch-processor-logs');
      expect(indexContent).toContain('/aws/lambda/');
    });

    it('should define Lambda functions', () => {
      expect(indexContent).toContain('aws.lambda.Function');
      expect(indexContent).toContain('api-handler');
      expect(indexContent).toContain('batch-processor');
      expect(indexContent).toContain("runtime: aws.lambda.Runtime.NodeJS18dX");
    });

    it('should define Lambda permissions', () => {
      expect(indexContent).toContain('aws.lambda.Permission');
      expect(indexContent).toContain('api-handler-dlq-permission');
      expect(indexContent).toContain('batch-processor-dlq-permission');
      expect(indexContent).toContain('s3-invoke-permission');
    });

    it('should define S3 bucket notification', () => {
      expect(indexContent).toContain('aws.s3.BucketNotification');
      expect(indexContent).toContain('etl-bucket-notification');
      expect(indexContent).toContain("events: ['s3:ObjectCreated:*']");
      expect(indexContent).toContain("filterPrefix: 'incoming/'");
    });

    it('should define CloudWatch alarms', () => {
      expect(indexContent).toContain('aws.cloudwatch.MetricAlarm');
      expect(indexContent).toContain('api-handler-errors');
      expect(indexContent).toContain('batch-processor-errors');
      expect(indexContent).toContain('dlq-depth');
    });
  });

  describe('Lambda Configuration Validation', () => {
    it('should configure API handler with 512MB memory', () => {
      expect(indexContent).toContain('memorySize: 512');
    });

    it('should configure batch processor with 1024MB memory', () => {
      expect(indexContent).toContain('memorySize: 1024');
    });

    it('should configure API handler with 30s timeout', () => {
      expect(indexContent).toContain('timeout: 30');
    });

    it('should configure batch processor with 300s timeout', () => {
      expect(indexContent).toContain('timeout: 300');
    });

    it('should configure reserved concurrent executions', () => {
      expect(indexContent).toContain('reservedConcurrentExecutions: 5');
    });

    it('should enable X-Ray tracing', () => {
      expect(indexContent).toContain('tracingConfig');
      expect(indexContent).toContain("mode: 'Active'");
    });

    it('should configure environment variables', () => {
      expect(indexContent).toContain('DATA_BUCKET');
      expect(indexContent).toContain('METADATA_TABLE');
      expect(indexContent).toContain('MAX_CONNECTIONS');
      expect(indexContent).toContain("MAX_CONNECTIONS: '10'");
    });

    it('should encrypt environment variables with KMS', () => {
      expect(indexContent).toContain('kmsKeyArn: kmsKey.arn');
    });

    it('should configure dead letter queue', () => {
      expect(indexContent).toContain('deadLetterConfig');
      expect(indexContent).toContain('targetArn: deadLetterQueue.arn');
    });
  });

  describe('IAM Permissions Validation', () => {
    it('should grant CloudWatch Logs permissions', () => {
      expect(indexContent).toContain("'logs:CreateLogGroup'");
      expect(indexContent).toContain("'logs:CreateLogStream'");
      expect(indexContent).toContain("'logs:PutLogEvents'");
    });

    it('should grant S3 permissions', () => {
      expect(indexContent).toContain("'s3:GetObject'");
      expect(indexContent).toContain("'s3:PutObject'");
    });

    it('should grant batch processor S3 ListBucket permission', () => {
      expect(indexContent).toContain("'s3:ListBucket'");
    });

    it('should grant DynamoDB permissions', () => {
      expect(indexContent).toContain("'dynamodb:GetItem'");
      expect(indexContent).toContain("'dynamodb:PutItem'");
      expect(indexContent).toContain("'dynamodb:Query'");
    });

    it('should grant batch processor extended DynamoDB permissions', () => {
      expect(indexContent).toContain("'dynamodb:Scan'");
      expect(indexContent).toContain("'dynamodb:UpdateItem'");
      expect(indexContent).toContain("'dynamodb:BatchWriteItem'");
    });

    it('should grant KMS permissions', () => {
      expect(indexContent).toContain("'kms:Decrypt'");
      expect(indexContent).toContain("'kms:Encrypt'");
      expect(indexContent).toContain("'kms:GenerateDataKey'");
    });

    it('should grant X-Ray permissions', () => {
      expect(indexContent).toContain("'xray:PutTraceSegments'");
      expect(indexContent).toContain("'xray:PutTelemetryRecords'");
    });

    it('should grant SQS permissions', () => {
      expect(indexContent).toContain("'sqs:SendMessage'");
    });
  });

  describe('Resource Naming and Tags', () => {
    it('should use environmentSuffix in all resource names', () => {
      const resourcePatterns = [
        'lambda-encryption-key-${environmentSuffix}',
        'etl-data-bucket-${environmentSuffix}',
        'etl-metadata-table-${environmentSuffix}',
        'etl-dlq-${environmentSuffix}',
        'shared-deps-layer-${environmentSuffix}',
        'api-handler-role-${environmentSuffix}',
        'batch-processor-role-${environmentSuffix}',
        'api-handler-${environmentSuffix}',
        'batch-processor-${environmentSuffix}',
      ];

      resourcePatterns.forEach((pattern) => {
        expect(indexContent).toContain(pattern);
      });
    });

    it('should define common tags', () => {
      expect(indexContent).toContain('commonTags');
      expect(indexContent).toContain('Environment: environment');
      expect(indexContent).toContain("CostCenter: 'data-engineering'");
      expect(indexContent).toContain("ManagedBy: 'pulumi'");
      expect(indexContent).toContain("Project: 'etl-optimization'");
    });

    it('should apply tags to all resources', () => {
      const taggedResources = indexContent.match(/tags: commonTags/g);
      expect(taggedResources).toBeTruthy();
      expect(taggedResources!.length).toBeGreaterThan(10);
    });
  });

  describe('CloudWatch Configuration', () => {
    it('should configure log retention based on environment', () => {
      expect(indexContent).toContain(
        "environment === 'prod' ? 30 : 7"
      );
      expect(indexContent).toContain('retentionInDays: logRetentionDays');
    });

    it('should configure appropriate alarm thresholds', () => {
      expect(indexContent).toContain('threshold: 10'); // API handler
      expect(indexContent).toContain('threshold: 5'); // Batch processor
    });

    it('should configure alarm evaluation periods', () => {
      expect(indexContent).toContain('evaluationPeriods: 2');
      expect(indexContent).toContain('evaluationPeriods: 1');
    });

    it('should configure alarm statistics', () => {
      expect(indexContent).toContain("statistic: 'Sum'");
      expect(indexContent).toContain("statistic: 'Average'");
    });
  });

  describe('DynamoDB Table Structure', () => {
    it('should configure correct hash and range keys', () => {
      expect(indexContent).toContain("hashKey: 'jobId'");
      expect(indexContent).toContain("rangeKey: 'timestamp'");
    });

    it('should define attributes correctly', () => {
      expect(indexContent).toContain("{ name: 'jobId', type: 'S' }");
      expect(indexContent).toContain("{ name: 'timestamp', type: 'N' }");
    });

    it('should enable server-side encryption', () => {
      expect(indexContent).toContain('serverSideEncryption');
      expect(indexContent).toContain('enabled: true');
    });

    it('should enable point-in-time recovery', () => {
      expect(indexContent).toContain('pointInTimeRecovery');
    });
  });

  describe('S3 Encryption', () => {
    it('should configure server-side encryption', () => {
      expect(indexContent).toContain('serverSideEncryptionConfiguration');
      expect(indexContent).toContain('applyServerSideEncryptionByDefault');
      expect(indexContent).toContain("sseAlgorithm: 'AES256'");
    });
  });

  describe('Lambda Dependencies', () => {
    it('should configure Lambda layer dependency', () => {
      expect(indexContent).toContain('layers: [sharedDependenciesLayer.arn]');
    });

    it('should configure log group dependency', () => {
      expect(indexContent).toContain('dependsOn: [apiHandlerLogGroup]');
      expect(indexContent).toContain('dependsOn: [batchProcessorLogGroup]');
    });

    it('should configure S3 notification dependency', () => {
      expect(indexContent).toContain('dependsOn: [s3InvokePermission]');
    });
  });

  describe('Stack Outputs', () => {
    it('should export all required outputs', () => {
      const outputs = [
        'export const dataBucketName',
        'export const dataBucketArn',
        'export const metadataTableName',
        'export const metadataTableArn',
        'export const deadLetterQueueUrl',
        'export const deadLetterQueueArn',
        'export const apiHandlerFunctionName',
        'export const apiHandlerFunctionArn',
        'export const batchProcessorFunctionName',
        'export const batchProcessorFunctionArn',
        'export const kmsKeyId',
        'export const kmsKeyArn',
        'export const sharedLayerArn',
      ];

      outputs.forEach((output) => {
        expect(indexContent).toContain(output);
      });
    });
  });

  describe('Code Quality', () => {
    it('should use eslint-disable for intentionally unused variables', () => {
      expect(indexContent).toContain('eslint-disable-next-line');
    });

    it('should not have console.log statements', () => {
      expect(indexContent).not.toContain('console.log');
    });

    it('should use single quotes for strings', () => {
      const doubleQuoteStrings = indexContent.match(/"[^"]*"/g) || [];
      const singleQuoteStrings = indexContent.match(/'[^']*'/g) || [];
      expect(singleQuoteStrings.length).toBeGreaterThan(doubleQuoteStrings.length);
    });
  });
});
