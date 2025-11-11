import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create TransactionTable with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `TransactionTable-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should have partition key and sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('should have correct attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create main TransactionQueue with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-queue-${environmentSuffix}`,
        VisibilityTimeout: 300,
      });
    });

    test('should create dead letter queue with 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('should configure dead letter queue in main queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-queue-${environmentSuffix}`,
        RedrivePolicy: {
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create ReportsBucket with correct name and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `transaction-reports-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('should have lifecycle rule for Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'archive-old-reports',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('Lambda Layer', () => {
    test('should create SharedLayer with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        CompatibleRuntimes: ['nodejs18.x'],
        Description: 'AWS SDK v3 and validation libraries',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create ProcessTransaction function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `processTransaction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        ReservedConcurrentExecutions: 100,
        Architectures: ['arm64'],
      });
    });

    test('should create AuditTransaction function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `auditTransaction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        ReservedConcurrentExecutions: 100,
        Architectures: ['arm64'],
      });
    });

    test('should create DailySummary function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `dailySummary-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        Architectures: ['arm64'],
      });
    });

    test('should configure environment variables for ProcessTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `processTransaction-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            QUEUE_URL: Match.anyValue(),
          },
        },
      });
    });

    test('should configure environment variables for AuditTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `auditTransaction-${environmentSuffix}`,
        Environment: {
          Variables: {
            BUCKET_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('should configure environment variables for DailySummary', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `dailySummary-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            BUCKET_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('should attach SharedLayer to Lambda functions', () => {
      // Verify SharedLayer is referenced in Lambda functions
      const functions = template.findResources('AWS::Lambda::Function');
      const functionsWithLayers = Object.values(functions).filter(
        (fn: any) => fn.Properties.Layers && fn.Properties.Layers.length > 0
      );
      expect(functionsWithLayers.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct name and endpoint type', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `transaction-api-${environmentSuffix}`,
        Description: 'Transaction Processing API',
        EndpointConfiguration: {
          Types: ['EDGE'],
        },
      });
    });

    test('should configure throttling limits in deployment options', () => {
      // Throttling is configured via deployOptions on RestApi
      const stages = template.findResources('AWS::ApiGateway::Stage');
      expect(Object.keys(stages).length).toBeGreaterThan(0);

      // Verify throttling is set in method settings
      const stageValues = Object.values(stages);
      const hasThrottling = stageValues.some((stage: any) =>
        stage.Properties.MethodSettings &&
        stage.Properties.MethodSettings.some((ms: any) =>
          ms.ThrottlingBurstLimit !== undefined || ms.ThrottlingRateLimit !== undefined
        )
      );
      expect(hasThrottling).toBe(true);
    });

    test('should create /transactions resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'transactions',
      });
    });

    test('should create POST method with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should create request model for validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: 'TransactionRequest',
        ContentType: 'application/json',
        Schema: {
          type: 'object',
          required: ['transactionId', 'amount', 'currency'],
          properties: {
            transactionId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            timestamp: { type: 'number' },
            customerId: { type: 'string' },
          },
        },
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create DailySummaryRule with correct schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `daily-summary-${environmentSuffix}`,
        ScheduleExpression: 'cron(0 2 * * ? *)',
      });
    });

    test('should target DailySummary Lambda function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `daily-summary-${environmentSuffix}`,
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create alarm for ProcessTransaction errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `processTransaction-errors-${environmentSuffix}`,
        Threshold: 0.01,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create alarm for AuditTransaction errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `auditTransaction-errors-${environmentSuffix}`,
        Threshold: 0.01,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should monitor Lambda errors with correct metric', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'Errors',
          Namespace: 'AWS/Lambda',
          Statistic: 'Average',
        },
      });
      expect(Object.keys(alarms).length).toBe(2);
    });
  });

  describe('IAM Permissions', () => {
    test('should grant DynamoDB write permissions to ProcessTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['dynamodb:PutItem']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SQS send permissions to ProcessTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['sqs:SendMessage']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant S3 write permissions to AuditTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:PutObject']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant DynamoDB read permissions to DailySummary', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*Scan.*'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Event Source Mapping', () => {
    test('should create SQS event source for AuditTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        EventSourceArn: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have Lambda functions that will create log groups', () => {
      // Log groups are automatically created by Lambda functions
      // Verify Lambda functions exist which will create their own log groups
      const functions = template.findResources('AWS::Lambda::Function');
      const functionNames = Object.values(functions).map(
        (fn: any) => fn.Properties.FunctionName
      );

      expect(functionNames).toContain(`processTransaction-${environmentSuffix}`);
      expect(functionNames).toContain(`auditTransaction-${environmentSuffix}`);
      expect(functionNames).toContain(`dailySummary-${environmentSuffix}`);
    });
  });

  describe('Stack Outputs', () => {
    test('should export API URL', () => {
      template.hasOutput('ApiUrl', {
        Description: 'Transaction API URL',
      });
    });

    test('should export Table Name', () => {
      template.hasOutput('TableName', {
        Description: 'DynamoDB Table Name',
      });
    });

    test('should export Queue URL', () => {
      template.hasOutput('QueueUrl', {
        Description: 'SQS Queue URL',
      });
    });

    test('should export Bucket Name', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 Bucket for Reports',
      });
    });
  });

  describe('Resource Count', () => {
    test('should create all required resources', () => {
      // Verify minimum resource counts
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map(
        (r: any) => r.Type
      );

      expect(
        resourceTypes.filter((t) => t === 'AWS::DynamoDB::Table').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::SQS::Queue').length
      ).toBe(2);
      expect(
        resourceTypes.filter((t) => t === 'AWS::S3::Bucket').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::Lambda::Function').length
      ).toBeGreaterThanOrEqual(3);
      expect(
        resourceTypes.filter((t) => t === 'AWS::ApiGateway::RestApi').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::Events::Rule').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::CloudWatch::Alarm').length
      ).toBe(2);
    });
  });
});

// Lambda Function Unit Tests
import { APIGatewayProxyEvent, SQSEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { handler as processTransactionHandler } from '../lib/lambda/processTransaction/index';
import { handler as auditTransactionHandler } from '../lib/lambda/auditTransaction/index';
import { handler as dailySummaryHandler } from '../lib/lambda/dailySummary/index';

const dynamoDBMock = mockClient(DynamoDBClient);
const sqsMock = mockClient(SQSClient);
const s3Mock = mockClient(S3Client);

describe('Lambda Function Unit Tests', () => {
  beforeEach(() => {
    dynamoDBMock.reset();
    sqsMock.reset();
    s3Mock.reset();
  });

  describe('ProcessTransaction Lambda', () => {
    beforeEach(() => {
      process.env.TABLE_NAME = 'test-table';
      process.env.QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
    });

    afterEach(() => {
      delete process.env.TABLE_NAME;
      delete process.env.QUEUE_URL;
    });

    const createEvent = (body: any): APIGatewayProxyEvent => ({
      body: JSON.stringify(body),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/transactions',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    });

    test('should process valid transaction successfully', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const event = createEvent({
        transactionId: 'txn-123',
        amount: 100.50,
        currency: 'USD',
        customerId: 'customer-456',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Transaction processed successfully');
      expect(body.transactionId).toBe('txn-123');
      expect(dynamoDBMock.calls()).toHaveLength(1);
      expect(sqsMock.calls()).toHaveLength(1);
    });

    test('should use default timestamp when not provided', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const event = createEvent({
        transactionId: 'txn-789',
        amount: 50.25,
        currency: 'EUR',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(200);
      const putItemCall = dynamoDBMock.calls()[0];
      const putItemInput = putItemCall.args[0].input as any;
      expect(putItemInput.Item?.timestamp).toBeDefined();
    });

    test('should use default customerId when not provided', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const event = createEvent({
        transactionId: 'txn-999',
        amount: 75.00,
        currency: 'GBP',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(200);
      const putItemCall = dynamoDBMock.calls()[0];
      const putItemInput = putItemCall.args[0].input as any;
      expect(putItemInput.Item?.customerId.S).toBe('unknown');
    });

    test('should return 400 when transactionId is missing', async () => {
      const event = createEvent({ amount: 100, currency: 'USD' });
      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Missing required fields');
      expect(dynamoDBMock.calls()).toHaveLength(0);
      expect(sqsMock.calls()).toHaveLength(0);
    });

    test('should return 400 when amount is missing', async () => {
      const event = createEvent({ transactionId: 'txn-123', currency: 'USD' });
      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Missing required fields');
    });

    test('should return 400 when currency is missing', async () => {
      const event = createEvent({ transactionId: 'txn-123', amount: 100 });
      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Missing required fields');
    });

    test('should return 500 when DynamoDB fails', async () => {
      dynamoDBMock.on(PutItemCommand).rejects(new Error('DynamoDB error'));

      const event = createEvent({
        transactionId: 'txn-error',
        amount: 100,
        currency: 'USD',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Failed to process transaction');
      expect(body.error).toBe('DynamoDB error');
    });

    test('should return 500 when SQS fails', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).rejects(new Error('SQS error'));

      const event = createEvent({
        transactionId: 'txn-error',
        amount: 100,
        currency: 'USD',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Failed to process transaction');
      expect(body.error).toBe('SQS error');
    });

    test('should store transaction with correct DynamoDB format', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const timestamp = Date.now();
      const event = createEvent({
        transactionId: 'txn-555',
        amount: 200.75,
        currency: 'CAD',
        customerId: 'customer-777',
        timestamp,
      });

      await processTransactionHandler(event);

      const putItemCall = dynamoDBMock.calls()[0];
      const putItemInput = putItemCall.args[0].input as any;
      const item = putItemInput.Item;

      expect(item?.transactionId.S).toBe('txn-555');
      expect(item?.amount.N).toBe('200.75');
      expect(item?.currency.S).toBe('CAD');
      expect(item?.customerId.S).toBe('customer-777');
      expect(item?.timestamp.N).toBe(timestamp.toString());
      expect(item?.status.S).toBe('processed');
    });

    test('should return correct Content-Type header', async () => {
      dynamoDBMock.on(PutItemCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const event = createEvent({
        transactionId: 'txn-123',
        amount: 100,
        currency: 'USD',
      });

      const result = await processTransactionHandler(event);

      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    test('should handle null event body', async () => {
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/transactions',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
      };

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Missing required fields');
    });

    test('should handle non-Error exceptions', async () => {
      dynamoDBMock.on(PutItemCommand).rejects('String error' as any);

      const event = createEvent({
        transactionId: 'txn-error',
        amount: 100,
        currency: 'USD',
      });

      const result = await processTransactionHandler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Failed to process transaction');
      expect(body.error).toBeDefined();
    });
  });

  describe('AuditTransaction Lambda', () => {
    beforeEach(() => {
      process.env.BUCKET_NAME = 'test-bucket';
    });

    afterEach(() => {
      delete process.env.BUCKET_NAME;
    });

    const createSQSEvent = (messageBody: any): SQSEvent => ({
      Records: [
        {
          messageId: 'msg-123',
          receiptHandle: 'receipt-123',
          body: JSON.stringify(messageBody),
          attributes: {} as any,
          messageAttributes: {},
          md5OfBody: '',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
          awsRegion: 'us-east-1',
        },
      ],
    });

    test('should create audit log in S3 successfully', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const transaction = {
        transactionId: 'txn-123',
        amount: 100,
        currency: 'USD',
        customerId: 'customer-456',
        status: 'processed',
      };

      const event = createSQSEvent(transaction);
      await auditTransactionHandler(event);

      expect(s3Mock.calls()).toHaveLength(1);
      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      expect(s3Input.Key).toMatch(/^audit\/txn-123-\d+\.json$/);
      expect(s3Input.ContentType).toBe('application/json');
    });

    test('should include audit metadata in S3 object', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const transaction = {
        transactionId: 'txn-456',
        amount: 200,
        currency: 'EUR',
      };

      const event = createSQSEvent(transaction);
      await auditTransactionHandler(event);

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.transactionId).toBe('txn-456');
      expect(body.amount).toBe(200);
      expect(body.currency).toBe('EUR');
      expect(body.auditedAt).toBeDefined();
      expect(body.messageId).toBe('msg-123');
    });

    test('should process multiple SQS records', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({ transactionId: 'txn-1', amount: 100, currency: 'USD' }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: '',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
          {
            messageId: 'msg-2',
            receiptHandle: 'receipt-2',
            body: JSON.stringify({ transactionId: 'txn-2', amount: 200, currency: 'EUR' }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: '',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await auditTransactionHandler(event);

      expect(s3Mock.calls()).toHaveLength(2);
    });

    test('should throw error when S3 upload fails', async () => {
      s3Mock.on(PutObjectCommand).rejects(new Error('S3 error'));

      const transaction = { transactionId: 'txn-error', amount: 100, currency: 'USD' };
      const event = createSQSEvent(transaction);

      await expect(auditTransactionHandler(event)).rejects.toThrow('S3 error');
    });

    test('should throw error when message body is invalid JSON', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-123',
            receiptHandle: 'receipt-123',
            body: '{invalid json}',
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: '',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await expect(auditTransactionHandler(event)).rejects.toThrow();
    });
  });

  describe('DailySummary Lambda', () => {
    beforeEach(() => {
      process.env.TABLE_NAME = 'test-table';
      process.env.BUCKET_NAME = 'test-bucket';
    });

    afterEach(() => {
      delete process.env.TABLE_NAME;
      delete process.env.BUCKET_NAME;
    });

    test('should generate daily summary successfully', async () => {
      const mockItems = [
        { transactionId: { S: 'txn-1' }, amount: { N: '100' }, timestamp: { N: String(Date.now()) } },
        { transactionId: { S: 'txn-2' }, amount: { N: '200' }, timestamp: { N: String(Date.now()) } },
        { transactionId: { S: 'txn-3' }, amount: { N: '50' }, timestamp: { N: String(Date.now()) } },
      ];

      dynamoDBMock.on(ScanCommand).resolves({ Items: mockItems });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      expect(dynamoDBMock.calls()).toHaveLength(1);
      expect(s3Mock.calls()).toHaveLength(1);

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalTransactions).toBe(3);
      expect(body.totalAmount).toBe(350);
      expect(body.date).toBeDefined();
      expect(body.generatedAt).toBeDefined();
    });

    test('should filter transactions from last 24 hours', async () => {
      dynamoDBMock.on(ScanCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const scanCall = dynamoDBMock.calls()[0];
      const scanInput = scanCall.args[0].input as any;
      expect(scanInput.FilterExpression).toBe('#ts > :yesterday');
      expect(scanInput.ExpressionAttributeNames).toEqual({ '#ts': 'timestamp' });
      expect(scanInput.ExpressionAttributeValues?.[':yesterday']).toBeDefined();
    });

    test('should handle empty transaction list', async () => {
      dynamoDBMock.on(ScanCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalTransactions).toBe(0);
      expect(body.totalAmount).toBe(0);
    });

    test('should create S3 object with correct key format', async () => {
      dynamoDBMock.on(ScanCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const today = new Date().toISOString().split('T')[0];

      expect(s3Input.Key).toBe(`summaries/daily-${today}.json`);
      expect(s3Input.ContentType).toBe('application/json');
    });

    test('should throw error when DynamoDB scan fails', async () => {
      dynamoDBMock.on(ScanCommand).rejects(new Error('DynamoDB error'));

      await expect(dailySummaryHandler()).rejects.toThrow('DynamoDB error');
    });

    test('should throw error when S3 upload fails', async () => {
      dynamoDBMock.on(ScanCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).rejects(new Error('S3 error'));

      await expect(dailySummaryHandler()).rejects.toThrow('S3 error');
    });

    test('should calculate total amount correctly', async () => {
      const mockItems = [
        { amount: { N: '100.50' }, timestamp: { N: String(Date.now()) } },
        { amount: { N: '200.75' }, timestamp: { N: String(Date.now()) } },
        { amount: { N: '50.25' }, timestamp: { N: String(Date.now()) } },
      ];

      dynamoDBMock.on(ScanCommand).resolves({ Items: mockItems });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalAmount).toBe(351.5);
    });

    test('should handle items with missing amount', async () => {
      const mockItems: any[] = [
        { amount: { N: '100' }, timestamp: { N: String(Date.now()) } },
        { timestamp: { N: String(Date.now()) } },
        { amount: { N: '50' }, timestamp: { N: String(Date.now()) } },
      ];

      dynamoDBMock.on(ScanCommand).resolves({ Items: mockItems });
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalAmount).toBe(150);
      expect(body.totalTransactions).toBe(3);
    });

    test('should handle undefined Items in scan result', async () => {
      dynamoDBMock.on(ScanCommand).resolves({});
      s3Mock.on(PutObjectCommand).resolves({});

      await dailySummaryHandler();

      const s3Call = s3Mock.calls()[0];
      const s3Input = s3Call.args[0].input as any;
      const body = JSON.parse(s3Input.Body as string);

      expect(body.totalTransactions).toBe(0);
      expect(body.totalAmount).toBe(0);
    });
  });
});
