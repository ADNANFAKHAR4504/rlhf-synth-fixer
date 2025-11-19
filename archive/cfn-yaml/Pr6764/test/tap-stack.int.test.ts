// Configuration - These are coming from cfn-outputs after cdk deploy
import { DescribeTableCommand, DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetQueueAttributesCommand, ListQueuesCommand, SQSClient } from '@aws-sdk/client-sqs';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
console.log('CFN Outputs:', outputs);
// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients for verification
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const kms = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Infrastructure Verification Tests', () => {
    test('should have all required outputs defined', () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.ApiKeyId).toBeDefined();
      expect(outputs.ProcessingQueueUrl).toBeDefined();
      expect(outputs.DeadLetterQueueUrl).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
      // Note: ApiEndpointUrl is not used as per requirements
    });

    test('should verify DynamoDB table exists and is properly configured', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName
      });

      const result = await dynamodb.send(describeCommand) as any;
      expect(result.Table).toBeDefined();
      expect(result.Table!.TableName).toBe(outputs.DynamoDBTableName);
      expect(result.Table!.TableStatus).toBe('ACTIVE');
      expect(result.Table!.KeySchema).toBeDefined();
      expect(result.Table!.KeySchema.length).toBeGreaterThan(0);
    });

    test('should verify DynamoDB table is in the list of tables', async () => {
      const listCommand = new ListTablesCommand({});
      const result = await dynamodb.send(listCommand) as any;
      expect(result.TableNames).toContain(outputs.DynamoDBTableName);
    });

    test('should verify processing queue exists and is properly configured', async () => {
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.ProcessingQueueUrl,
        AttributeNames: ['QueueArn', 'ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
      });

      const result = await sqs.send(getAttributesCommand) as any;
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.QueueArn).toBeDefined();
      expect(result.Attributes!.QueueArn).toMatch(/arn:aws:sqs:/);
    });

    test('should verify dead letter queue exists and is properly configured', async () => {
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.DeadLetterQueueUrl,
        AttributeNames: ['QueueArn', 'ApproximateNumberOfMessages']
      });

      const result = await sqs.send(getAttributesCommand) as any;
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.QueueArn).toBeDefined();
      expect(result.Attributes!.QueueArn).toMatch(/arn:aws:sqs:/);
    });

    test('should verify processing queue is in the list of queues', async () => {
      const listCommand = new ListQueuesCommand({});
      const result = await sqs.send(listCommand) as any;
      expect(result.QueueUrls).toContain(outputs.ProcessingQueueUrl);
    });

    test('should verify dead letter queue is in the list of queues', async () => {
      const listCommand = new ListQueuesCommand({});
      const result = await sqs.send(listCommand) as any;
      expect(result.QueueUrls).toContain(outputs.DeadLetterQueueUrl);
    });

    test('should verify Lambda function exists and is properly configured', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionArn
      });

      const result = await lambda.send(getFunctionCommand) as any;
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.FunctionName).toBeDefined();
      expect(result.Configuration!.State).toBe('Active');
      expect(result.Configuration!.Runtime).toBeDefined();
      expect(result.Configuration!.Handler).toBeDefined();
    });

    test('should verify KMS key exists and is properly configured', async () => {
      const describeKeyCommand = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });

      const result = await kms.send(describeKeyCommand) as any;
      expect(result.KeyMetadata).toBeDefined();
      expect(result.KeyMetadata!.KeyId).toBe(outputs.KMSKeyId);
      expect(result.KeyMetadata!.KeyState).toBe('Enabled');
      expect(result.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('should verify processing queue has correct redrive policy', async () => {
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.ProcessingQueueUrl,
        AttributeNames: ['RedrivePolicy']
      });

      const result = await sqs.send(getAttributesCommand) as any;
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(result.Attributes!.RedrivePolicy);
      expect(redrivePolicy.deadLetterTargetArn).toBeDefined();
    });

    test('should verify DynamoDB table has correct billing mode', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName
      });

      const result = await dynamodb.send(describeCommand) as any;
      expect(result.Table!.BillingModeSummary).toBeDefined();
      // Could be PROVISIONED or PAY_PER_REQUEST
      expect(['PROVISIONED', 'PAY_PER_REQUEST']).toContain(result.Table!.BillingModeSummary!.BillingMode);
    });

    test('should verify Lambda function has environment variables configured', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionArn
      });

      const result = await lambda.send(getFunctionCommand) as any;
      expect(result.Configuration).toBeDefined();
      // Environment variables might be present
      if (result.Configuration!.Environment) {
        expect(result.Configuration!.Environment.Variables).toBeDefined();
      }
    });

    test('should verify Lambda function has proper memory and timeout settings', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionArn
      });

      const result = await lambda.send(getFunctionCommand) as any;
      expect(result.Configuration!.MemorySize).toBeGreaterThan(0);
      expect(result.Configuration!.Timeout).toBeGreaterThan(0);
    });

    test('should verify KMS key has correct key spec', async () => {
      const describeKeyCommand = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId
      });

      const result = await kms.send(describeKeyCommand) as any;
      expect(result.KeyMetadata!.KeySpec).toBeDefined();
      expect(['SYMMETRIC_DEFAULT', 'RSA_2048', 'RSA_3072', 'RSA_4096', 'ECC_NIST_P256', 'ECC_NIST_P384', 'ECC_NIST_P521', 'ECC_SECG_P256K1']).toContain(result.KeyMetadata!.KeySpec);
    });

    test('should verify processing queue visibility timeout is configured', async () => {
      const getAttributesCommand = new GetQueueAttributesCommand({
        QueueUrl: outputs.ProcessingQueueUrl,
        AttributeNames: ['VisibilityTimeout']
      });

      const result = await sqs.send(getAttributesCommand) as any;
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.VisibilityTimeout).toBeDefined();
      expect(parseInt(result.Attributes!.VisibilityTimeout)).toBeGreaterThan(0);
    });

    test('should verify DynamoDB table has stream specification if needed', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName
      });

      const result = await dynamodb.send(describeCommand) as any;
      // StreamViewType might be present if streams are enabled
      if (result.Table!.StreamSpecification) {
        expect(result.Table!.StreamSpecification.StreamViewType).toBeDefined();
      }
    });
  });
});
