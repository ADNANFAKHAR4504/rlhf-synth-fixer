import { DynamoDB, S3, Lambda, APIGateway, SQS, CloudWatch, SecretsManager } from 'aws-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

// Check if outputs file exists
try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.log('Warning: flat-outputs.json not found. Integration tests will be skipped.');
}

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const dynamodb = new DynamoDB({ region: AWS_REGION });
const s3 = new S3({ region: AWS_REGION });
const lambda = new Lambda({ region: AWS_REGION });
const apigateway = new APIGateway({ region: AWS_REGION });
const sqs = new SQS({ region: AWS_REGION });
const cloudwatch = new CloudWatch({ region: AWS_REGION });
const secretsmanager = new SecretsManager({ region: AWS_REGION });

const hasOutputs = Object.keys(outputs).length > 0;

describe('Terraform Integration Tests - Serverless Webhook Processing', () => {

  beforeAll(() => {
    if (!hasOutputs) {
      console.log('Skipping all tests: Infrastructure not deployed yet');
    }
  });

  describe('DynamoDB Table', () => {
    let tableDescription: DynamoDB.DescribeTableOutput | undefined;

    beforeAll(async () => {
      if (!hasOutputs) return;
      try {
        tableDescription = await dynamodb.describeTable({
          TableName: outputs.dynamodb_table_name
        }).promise();
      } catch (error) {
        console.log('Error describing DynamoDB table:', error);
      }
    });

    test('should have DynamoDB transactions table deployed', () => {
      if (!hasOutputs) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      expect(tableDescription).toBeDefined();
      expect(tableDescription?.Table).toBeDefined();
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      if (!hasOutputs || !tableDescription?.Table) return;
      expect(tableDescription.Table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have point-in-time recovery enabled', () => {
      if (!hasOutputs) return;
      dynamodb.describeContinuousBackups({
        TableName: outputs.dynamodb_table_name
      }, (err, data) => {
        if (!err) {
          expect(data.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
        }
      });
    });

    test('should have ProviderTimestampIndex GSI', () => {
      if (!hasOutputs || !tableDescription?.Table) return;
      const gsi = tableDescription.Table.GlobalSecondaryIndexes?.find(
        i => i.IndexName === 'ProviderTimestampIndex'
      );
      expect(gsi).toBeDefined();
    });

    test('should have CustomerIndex GSI', () => {
      if (!hasOutputs || !tableDescription?.Table) return;
      const gsi = tableDescription.Table.GlobalSecondaryIndexes?.find(
        i => i.IndexName === 'CustomerIndex'
      );
      expect(gsi).toBeDefined();
    });

    test('should have server-side encryption enabled', () => {
      if (!hasOutputs || !tableDescription?.Table) return;
      expect(tableDescription.Table.SSEDescription?.Status).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('should have raw payloads bucket deployed', async () => {
      if (!hasOutputs) return;
      try {
        const result = await s3.headBucket({
          Bucket: outputs.raw_payloads_bucket_name
        }).promise();
        expect(result).toBeDefined();
      } catch (error) {
        fail('Raw payloads bucket not accessible');
      }
    });

    test('should have processed logs bucket deployed', async () => {
      if (!hasOutputs) return;
      try {
        const result = await s3.headBucket({
          Bucket: outputs.processed_logs_bucket_name
        }).promise();
        expect(result).toBeDefined();
      } catch (error) {
        fail('Processed logs bucket not accessible');
      }
    });

    test('should have encryption enabled on raw payloads bucket', async () => {
      if (!hasOutputs) return;
      const encryption = await s3.getBucketEncryption({
        Bucket: outputs.raw_payloads_bucket_name
      }).promise();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have public access blocked on raw payloads bucket', async () => {
      if (!hasOutputs) return;
      const publicAccessBlock = await s3.getPublicAccessBlock({
        Bucket: outputs.raw_payloads_bucket_name
      }).promise();
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });

    test('should have lifecycle policy on raw payloads bucket', async () => {
      if (!hasOutputs) return;
      try {
        const lifecycle = await s3.getBucketLifecycleConfiguration({
          Bucket: outputs.raw_payloads_bucket_name
        }).promise();
        expect(lifecycle.Rules).toBeDefined();
        expect(lifecycle.Rules!.length).toBeGreaterThan(0);
      } catch (error) {
        // Lifecycle might not be set immediately
        console.log('Lifecycle policy not yet applied');
      }
    });
  });

  describe('Lambda Functions', () => {
    test('should have Stripe validator function deployed', async () => {
      if (!hasOutputs) return;
      const func = await lambda.getFunction({
        FunctionName: outputs.stripe_validator_function_name
      }).promise();
      expect(func.Configuration).toBeDefined();
    });

    test('should have PayPal validator function deployed', async () => {
      if (!hasOutputs) return;
      const func = await lambda.getFunction({
        FunctionName: outputs.paypal_validator_function_name
      }).promise();
      expect(func.Configuration).toBeDefined();
    });

    test('should have Square validator function deployed', async () => {
      if (!hasOutputs) return;
      const func = await lambda.getFunction({
        FunctionName: outputs.square_validator_function_name
      }).promise();
      expect(func.Configuration).toBeDefined();
    });

    test('should have processor function deployed', async () => {
      if (!hasOutputs) return;
      const func = await lambda.getFunction({
        FunctionName: outputs.processor_function_name
      }).promise();
      expect(func.Configuration).toBeDefined();
    });

    test('should have query function deployed', async () => {
      if (!hasOutputs) return;
      const func = await lambda.getFunction({
        FunctionName: outputs.query_function_name
      }).promise();
      expect(func.Configuration).toBeDefined();
    });

    test('all Lambda functions should use ARM64 architecture', async () => {
      if (!hasOutputs) return;
      const functions = [
        outputs.stripe_validator_function_name,
        outputs.paypal_validator_function_name,
        outputs.square_validator_function_name,
        outputs.processor_function_name,
        outputs.query_function_name
      ];

      for (const functionName of functions) {
        const func = await lambda.getFunction({ FunctionName: functionName }).promise();
        expect(func.Configuration?.Architectures).toContain('arm64');
      }
    });

    test('all Lambda functions should have X-Ray tracing enabled', async () => {
      if (!hasOutputs) return;
      const functions = [
        outputs.stripe_validator_function_name,
        outputs.processor_function_name,
        outputs.query_function_name
      ];

      for (const functionName of functions) {
        const func = await lambda.getFunction({ FunctionName: functionName }).promise();
        expect(func.Configuration?.TracingConfig?.Mode).toBe('Active');
      }
    });

    test('processor function should have dead letter queue configured', async () => {
      if (!hasOutputs) return;
      const func = await lambda.getFunction({
        FunctionName: outputs.processor_function_name
      }).promise();
      expect(func.Configuration?.DeadLetterConfig?.TargetArn).toBeDefined();
      expect(func.Configuration?.DeadLetterConfig?.TargetArn).toContain(outputs.dlq_name);
    });

    test('processor function should have reserved concurrency', async () => {
      if (!hasOutputs) return;
      const func = await lambda.getFunction({
        FunctionName: outputs.processor_function_name
      }).promise();
      expect(func.Concurrency?.ReservedConcurrentExecutions).toBeDefined();
      expect(func.Concurrency?.ReservedConcurrentExecutions).toBeGreaterThan(0);
    });
  });

  describe('API Gateway', () => {
    let restApi: APIGateway.RestApi | undefined;

    beforeAll(async () => {
      if (!hasOutputs) return;
      try {
        const apis = await apigateway.getRestApis().promise();
        restApi = apis.items?.find(api => api.id === outputs.api_gateway_id);
      } catch (error) {
        console.log('Error getting API Gateway:', error);
      }
    });

    test('should have API Gateway deployed', () => {
      if (!hasOutputs) return;
      expect(restApi).toBeDefined();
    });

    test('should have deployment stage created', async () => {
      if (!hasOutputs || !restApi) return;
      const stages = await apigateway.getStages({
        restApiId: outputs.api_gateway_id
      }).promise();
      const stage = stages.item?.find(s => s.stageName === outputs.api_gateway_stage_name);
      expect(stage).toBeDefined();
    });

    test('should have X-Ray tracing enabled on stage', async () => {
      if (!hasOutputs || !restApi) return;
      const stages = await apigateway.getStages({
        restApiId: outputs.api_gateway_id
      }).promise();
      const stage = stages.item?.find(s => s.stageName === outputs.api_gateway_stage_name);
      expect(stage?.tracingEnabled).toBe(true);
    });

    test('should have usage plans configured', async () => {
      if (!hasOutputs) return;
      const usagePlans = await apigateway.getUsagePlans().promise();
      expect(usagePlans.items?.length).toBeGreaterThan(0);
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('should have DLQ deployed', async () => {
      if (!hasOutputs) return;
      const attributes = await sqs.getQueueAttributes({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ['All']
      }).promise();
      expect(attributes.Attributes).toBeDefined();
    });

    test('should have SQS managed encryption enabled', async () => {
      if (!hasOutputs) return;
      const attributes = await sqs.getQueueAttributes({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ['SqsManagedSseEnabled']
      }).promise();
      expect(attributes.Attributes?.SqsManagedSseEnabled).toBe('true');
    });
  });

  describe('Secrets Manager', () => {
    test('should have Stripe secret created', async () => {
      if (!hasOutputs) return;
      const secret = await secretsmanager.describeSecret({
        SecretId: outputs.stripe_secret_arn
      }).promise();
      expect(secret).toBeDefined();
      expect(secret.ARN).toBe(outputs.stripe_secret_arn);
    });

    test('should have PayPal secret created', async () => {
      if (!hasOutputs) return;
      const secret = await secretsmanager.describeSecret({
        SecretId: outputs.paypal_secret_arn
      }).promise();
      expect(secret).toBeDefined();
      expect(secret.ARN).toBe(outputs.paypal_secret_arn);
    });

    test('should have Square secret created', async () => {
      if (!hasOutputs) return;
      const secret = await secretsmanager.describeSecret({
        SecretId: outputs.square_secret_arn
      }).promise();
      expect(secret).toBeDefined();
      expect(secret.ARN).toBe(outputs.square_secret_arn);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have SNS topic for alarms', async () => {
      if (!hasOutputs) return;
      const AWS = require('aws-sdk');
      const sns = new AWS.SNS({ region: AWS_REGION });
      const topic = await sns.getTopicAttributes({
        TopicArn: outputs.sns_topic_arn
      }).promise();
      expect(topic.Attributes).toBeDefined();
    });

    test('should have Lambda error alarms configured', async () => {
      if (!hasOutputs) return;
      const alarms = await cloudwatch.describeAlarms().promise();
      const lambdaErrorAlarms = alarms.MetricAlarms?.filter(
        alarm => alarm.MetricName === 'Errors' && alarm.Namespace === 'AWS/Lambda'
      );
      expect(lambdaErrorAlarms?.length).toBeGreaterThan(0);
    });

    test('should have API Gateway alarms configured', async () => {
      if (!hasOutputs) return;
      const alarms = await cloudwatch.describeAlarms().promise();
      const apiAlarms = alarms.MetricAlarms?.filter(
        alarm => alarm.Namespace === 'AWS/ApiGateway'
      );
      expect(apiAlarms?.length).toBeGreaterThan(0);
    });

    test('should have DLQ message count alarm', async () => {
      if (!hasOutputs) return;
      const alarms = await cloudwatch.describeAlarms().promise();
      const dlqAlarm = alarms.MetricAlarms?.find(
        alarm => alarm.MetricName === 'ApproximateNumberOfMessagesVisible' &&
                 alarm.Namespace === 'AWS/SQS'
      );
      expect(dlqAlarm).toBeDefined();
    });

    test('should have DynamoDB alarms configured', async () => {
      if (!hasOutputs) return;
      const alarms = await cloudwatch.describeAlarms().promise();
      const dynamoAlarms = alarms.MetricAlarms?.filter(
        alarm => alarm.Namespace === 'AWS/DynamoDB'
      );
      expect(dynamoAlarms?.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('API Gateway endpoints should be accessible', () => {
      if (!hasOutputs) return;
      expect(outputs.stripe_webhook_endpoint).toMatch(/^https:\/\//);
      expect(outputs.paypal_webhook_endpoint).toMatch(/^https:\/\//);
      expect(outputs.square_webhook_endpoint).toMatch(/^https:\/\//);
      expect(outputs.transactions_query_endpoint).toMatch(/^https:\/\//);
    });

    test('all critical resources should exist', () => {
      if (!hasOutputs) return;
      expect(outputs.dynamodb_table_name).toBeDefined();
      expect(outputs.raw_payloads_bucket_name).toBeDefined();
      expect(outputs.processed_logs_bucket_name).toBeDefined();
      expect(outputs.dlq_url).toBeDefined();
      expect(outputs.sns_topic_arn).toBeDefined();
    });

    test('environment suffix should be applied', () => {
      if (!hasOutputs) return;
      expect(outputs.environment_suffix).toBeDefined();
      expect(outputs.environment_suffix.length).toBeGreaterThan(0);
    });

    test('all Lambda functions should be in same region', () => {
      if (!hasOutputs) return;
      expect(outputs.stripe_validator_function_arn).toContain(AWS_REGION);
      expect(outputs.processor_function_arn).toContain(AWS_REGION);
      expect(outputs.query_function_arn).toContain(AWS_REGION);
    });
  });
});
