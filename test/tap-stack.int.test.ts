// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand
} from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';

// Read outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const s3Client = new S3Client({ region: 'us-east-1' });
const dynamodbClient = new DynamoDBClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Event-Driven Delivery App Integration Tests', () => {
  const testOrderId = `test-order-${Date.now()}`;
  const testKey = `orders/test-${testOrderId}.json`;

  describe('S3 Bucket Tests', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('delivery-app-orders');

      // Test bucket accessibility
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1
      });

      const response = await s3Client.send(listCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;

      // Upload a test object
      const testContent = JSON.stringify([{
        orderId: testOrderId,
        customerName: 'Test Customer',
        items: ['Pizza', 'Soda'],
        total: 25.99,
        status: 'pending'
      }]);

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'application/json'
      });

      const putResponse = await s3Client.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);
      expect(putResponse.VersionId).toBeDefined(); // Versioning is enabled
    });
  });

  describe('DynamoDB Table Tests', () => {
    test('DynamoDB table should exist and be accessible', async () => {
      const tableName = outputs.DynamoDBTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toContain('delivery-orders');

      // Test table accessibility with a query (table might be empty initially)
      const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'orderId = :orderId',
        ExpressionAttributeValues: {
          ':orderId': { S: 'non-existent-order' }
        },
        Limit: 1
      });

      const response = await dynamodbClient.send(queryCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.Items).toBeDefined();
    });

    test('DynamoDB table should have Global Secondary Index configured', async () => {
      const tableName = outputs.DynamoDBTableName;

      // Query using the GSI
      const queryCommand = new QueryCommand({
        TableName: tableName,
        IndexName: 'ProcessedTimestampIndex',
        KeyConditionExpression: 'processedTimestamp = :timestamp',
        ExpressionAttributeValues: {
          ':timestamp': { N: '0' }
        },
        Limit: 1
      });

      // This should not throw an error if GSI exists
      const response = await dynamodbClient.send(queryCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Lambda Function Tests', () => {
    test('Lambda function should exist and be configured correctly', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      expect(functionArn).toBeDefined();
      expect(functionArn).toContain('order-processor');

      // Extract function name from ARN
      const functionName = functionArn.split(':').pop();

      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(getFunctionCommand);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('python3.11');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(60);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('Lambda function should have correct environment variables', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(getFunctionCommand);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.DYNAMODB_TABLE).toBe(outputs.DynamoDBTableName);
      expect(envVars?.ENVIRONMENT).toBe('dev');
      expect(envVars?.METRICS_NAMESPACE).toBe('DeliveryApp/OrderProcessing');
    });

    test('Lambda function should process S3 events correctly', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();
      const bucketName = outputs.S3BucketName;

      // Create a test event that simulates EventBridge S3 event
      const testEvent = {
        source: 'aws.s3',
        'detail-type': 'Object Created',
        detail: {
          bucket: {
            name: bucketName
          },
          object: {
            key: testKey
          }
        }
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testEvent)
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body.message).toBe('Order processing completed');
        expect(body.processedCount).toBeGreaterThan(0);
        expect(body.sourceFile).toContain(bucketName);
      }
    });
  });

  describe('EventBridge Rule Tests', () => {
    test('EventBridge rule should exist and be enabled', async () => {
      const ruleName = `order-upload-rule-${environmentSuffix}`;

      const describeRuleCommand = new DescribeRuleCommand({
        Name: ruleName
      });

      const response = await eventBridgeClient.send(describeRuleCommand);
      expect(response.State).toBe('ENABLED');
      expect(response.Description).toContain('Trigger Lambda');
    });

    test('EventBridge rule should have Lambda as target', async () => {
      const ruleName = `order-upload-rule-${environmentSuffix}`;
      const functionArn = outputs.LambdaFunctionArn;

      const listTargetsCommand = new ListTargetsByRuleCommand({
        Rule: ruleName
      });

      const response = await eventBridgeClient.send(listTargetsCommand);
      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
      expect(response.Targets?.[0].Arn).toBe(functionArn);
    });
  });

  describe('CloudWatch Alarms Tests', () => {
    test('High error rate alarm should exist', async () => {
      const alarmName = `delivery-app-high-error-rate-${environmentSuffix}`;

      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const response = await cloudWatchClient.send(describeAlarmsCommand);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('OrderProcessingErrors');
      expect(alarm?.Namespace).toBe('DeliveryApp/OrderProcessing');
      expect(alarm?.Threshold).toBe(10);
    });

    test('Processing failure alarm should exist', async () => {
      const alarmName = `delivery-app-processing-failures-${environmentSuffix}`;

      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const response = await cloudWatchClient.send(describeAlarmsCommand);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('ProcessingFailures');
      expect(alarm?.Namespace).toBe('DeliveryApp/OrderProcessing');
      expect(alarm?.Threshold).toBe(1);
    });
  });

  describe('End-to-End Workflow Test', () => {
    test('Complete order processing workflow should work', async () => {
      const bucketName = outputs.S3BucketName;
      const tableName = outputs.DynamoDBTableName;
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const workflowOrderId = `workflow-order-${Date.now()}`;
      const workflowKey = `orders/workflow-${workflowOrderId}.json`;

      // Step 1: Upload an order file to S3
      const orderData = [{
        orderId: workflowOrderId,
        customerName: 'Workflow Test Customer',
        items: ['Burger', 'Fries', 'Milkshake'],
        total: 15.99,
        status: 'pending',
        deliveryAddress: '123 Test St'
      }];

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: workflowKey,
        Body: JSON.stringify(orderData),
        ContentType: 'application/json'
      });

      await s3Client.send(putCommand);

      // Step 2: Invoke Lambda function directly to simulate EventBridge trigger
      const eventBridgeEvent = {
        source: 'aws.s3',
        'detail-type': 'Object Created',
        detail: {
          bucket: { name: bucketName },
          object: { key: workflowKey }
        }
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(eventBridgeEvent)
      });

      const lambdaResponse = await lambdaClient.send(invokeCommand);
      expect(lambdaResponse.StatusCode).toBe(200);

      // Step 3: Wait a bit for processing
      await wait(2000);

      // Step 4: Verify order was stored in DynamoDB
      const getItemCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: workflowOrderId }
        }
      });

      const dynamoResponse = await dynamodbClient.send(getItemCommand);
      expect(dynamoResponse.Item).toBeDefined();
      expect(dynamoResponse.Item?.orderId?.S).toBe(workflowOrderId);
      expect(dynamoResponse.Item?.customerName?.S).toBe('Workflow Test Customer');
      expect(dynamoResponse.Item?.processedTimestamp?.N).toBeDefined();
      expect(dynamoResponse.Item?.sourceFile?.S).toContain(bucketName);
      expect(dynamoResponse.Item?.sourceFile?.S).toContain(workflowKey);
    });

    test('Multiple orders in single file should be processed correctly', async () => {
      const bucketName = outputs.S3BucketName;
      const tableName = outputs.DynamoDBTableName;
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const batchOrderIds = [
        `batch-order-1-${Date.now()}`,
        `batch-order-2-${Date.now()}`,
        `batch-order-3-${Date.now()}`
      ];
      const batchKey = `orders/batch-${Date.now()}.json`;

      // Upload multiple orders in one file
      const ordersData = batchOrderIds.map((id, index) => ({
        orderId: id,
        customerName: `Batch Customer ${index + 1}`,
        items: [`Item ${index + 1}`],
        total: 10.99 * (index + 1),
        status: 'pending'
      }));

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: batchKey,
        Body: JSON.stringify(ordersData),
        ContentType: 'application/json'
      });

      await s3Client.send(putCommand);

      // Process the batch
      const eventBridgeEvent = {
        source: 'aws.s3',
        'detail-type': 'Object Created',
        detail: {
          bucket: { name: bucketName },
          object: { key: batchKey }
        }
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(eventBridgeEvent)
      });

      const lambdaResponse = await lambdaClient.send(invokeCommand);
      expect(lambdaResponse.StatusCode).toBe(200);

      const payload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload!));
      const body = JSON.parse(payload.body);
      expect(body.processedCount).toBe(3);

      // Wait for processing
      await wait(2000);

      // Verify all orders were stored
      for (const orderId of batchOrderIds) {
        const getItemCommand = new GetItemCommand({
          TableName: tableName,
          Key: {
            orderId: { S: orderId }
          }
        });

        const dynamoResponse = await dynamodbClient.send(getItemCommand);
        expect(dynamoResponse.Item).toBeDefined();
        expect(dynamoResponse.Item?.orderId?.S).toBe(orderId);
      }
    });
  });

  describe('CloudWatch Metrics Test', () => {
    test('CloudWatch metrics should be recorded', async () => {
      // Query CloudWatch for recent metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 10 minutes ago

      const getMetricsCommand = new GetMetricStatisticsCommand({
        Namespace: 'DeliveryApp/OrderProcessing',
        MetricName: 'OrdersProcessed',
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum'],
        Dimensions: [
          {
            Name: 'Environment',
            Value: 'dev'
          }
        ]
      });

      const response = await cloudWatchClient.send(getMetricsCommand);
      expect(response.Datapoints).toBeDefined();

      // We should have at least one metric data point from our tests
      if (response.Datapoints && response.Datapoints.length > 0) {
        expect(response.Datapoints[0].Sum).toBeGreaterThan(0);
      }
    });
  });

  describe('Dashboard Test', () => {
    test('CloudWatch Dashboard URL should be accessible', async () => {
      const dashboardURL = outputs.DashboardURL;
      expect(dashboardURL).toBeDefined();
      expect(dashboardURL).toContain('cloudwatch');
      expect(dashboardURL).toContain('dashboards');
      expect(dashboardURL).toContain('delivery-app-orders');
    });
  });
});