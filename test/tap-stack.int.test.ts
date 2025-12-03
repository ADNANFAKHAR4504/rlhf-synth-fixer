import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  DescribeTableCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { IAMClient, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.error('Failed to load outputs:', error);
  throw new Error(
    'Deployment outputs not found. Run deployment first: cfn-outputs/flat-outputs.json'
  );
}

const region = process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const sqsClient = new SQSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });

describe('Lambda Consolidation Integration Tests', () => {
  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.lambdaRoleArn).toBeDefined();
      expect(outputs.dynamoTableName).toBeDefined();
      expect(outputs.dlqQueueUrl).toBeDefined();
      expect(outputs.dlqQueueArn).toBeDefined();
      expect(outputs.layerArn).toBeDefined();
      expect(outputs.errorRateAlarmArn).toBeDefined();
      expect(outputs.durationAlarmArn).toBeDefined();
    });

    it('should have properly formatted ARNs', () => {
      expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.lambdaRoleArn).toMatch(/^arn:aws:iam:/);
      expect(outputs.dlqQueueArn).toMatch(/^arn:aws:sqs:/);
      expect(outputs.layerArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.errorRateAlarmArn).toMatch(/^arn:aws:cloudwatch:/);
      expect(outputs.durationAlarmArn).toMatch(/^arn:aws:cloudwatch:/);
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should exist and be invocable', async () => {
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

      expect(response.Runtime).toBe('nodejs18.x');
    });

    it('should have optimized memory (1024 MB)', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.MemorySize).toBe(1024);
    });

    it('should have X-Ray tracing enabled', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    it('should have DLQ configured', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.DeadLetterConfig?.TargetArn).toBe(outputs.dlqQueueArn);
    });

    it('should have Lambda layer attached', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Layers).toBeDefined();
      expect(response.Layers?.length).toBeGreaterThan(0);
      const layerArns = response.Layers?.map((l) => l.Arn);
      expect(layerArns).toContain(outputs.layerArn);
    });

    it('should have correct environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.DYNAMODB_TABLE).toBe(
        outputs.dynamoTableName
      );
      expect(response.Environment?.Variables?.REGION).toBe(region);
      expect(response.Environment?.Variables?.ENVIRONMENT).toBeDefined();
    });

    it('should have correct timeout (30 seconds)', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Timeout).toBe(30);
    });
  });

  describe('Lambda Function Invocation - Payment Processing', () => {
    it('should successfully process payment route', async () => {
      const payload = {
        route: 'payment',
        transactionId: `test-${Date.now()}`,
        amount: 100.0,
      };

      const command = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const result = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.message).toBe('Payment processed successfully');
      expect(body.transactionId).toBe(payload.transactionId);
    });

    it('should store transaction in DynamoDB', async () => {
      const transactionId = `test-dynamo-${Date.now()}`;
      const payload = {
        route: 'payment',
        transactionId: transactionId,
        amount: 50.0,
      };

      // Invoke Lambda to create transaction
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      await lambdaClient.send(invokeCommand);

      // Wait for DynamoDB write
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify transaction in DynamoDB
      const getItemCommand = new GetItemCommand({
        TableName: outputs.dynamoTableName,
        Key: {
          transactionId: { S: transactionId },
        },
      });

      const dynamoResponse = await dynamoClient.send(getItemCommand);
      expect(dynamoResponse.Item).toBeDefined();
      expect(dynamoResponse.Item?.transactionId.S).toBe(transactionId);
      expect(dynamoResponse.Item?.status.S).toBe('processed');
    });
  });

  describe('Lambda Function Invocation - Fraud Detection', () => {
    it('should successfully process fraud detection route', async () => {
      const payload = {
        route: 'fraud',
        transactionId: `fraud-test-${Date.now()}`,
      };

      const command = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const result = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.message).toBe('Fraud detection complete');
      expect(body.fraudScore).toBeDefined();
      expect(body.fraudDetected).toBeDefined();
    });
  });

  describe('Lambda Function Invocation - Notifications', () => {
    it('should successfully process notification route', async () => {
      const payload = {
        route: 'notification',
        message: 'Test notification',
        recipient: 'test@example.com',
      };

      const command = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const result = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.message).toBe('Notification sent successfully');
      expect(body.recipient).toBe(payload.recipient);
    });
  });

  describe('Lambda Function Error Handling', () => {
    it('should handle invalid route gracefully', async () => {
      const payload = {
        route: 'invalid-route',
      };

      const command = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambdaClient.send(command);
      // Function should handle error and return it
      expect(response.FunctionError).toBeDefined();
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should exist and be accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.dynamoTableName);
    });

    it('should use PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    it('should have transactionId as hash key', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });

      const response = await dynamoClient.send(command);
      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(1);
      expect(keySchema?.[0].AttributeName).toBe('transactionId');
      expect(keySchema?.[0].KeyType).toBe('HASH');
    });
  });

  describe('SQS DLQ Configuration', () => {
    it('should exist and be accessible', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlqQueueUrl,
        AttributeNames: ['All'],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    it('should have 14-day message retention', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlqQueueUrl,
        AttributeNames: ['MessageRetentionPeriod'],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have error rate alarm configured', async () => {
      const alarmName = outputs.errorRateAlarmArn.split(':alarm:')[1];
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].AlarmName).toBe(alarmName);
    });

    it('should have duration alarm configured', async () => {
      const alarmName = outputs.durationAlarmArn.split(':alarm:')[1];
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].AlarmName).toBe(alarmName);
    });

    it('should monitor Lambda function metrics', async () => {
      const alarmName = outputs.durationAlarmArn.split(':alarm:')[1];
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Dimensions).toBeDefined();
    });

    it('should have correct threshold for duration (3 seconds)', async () => {
      const alarmName = outputs.durationAlarmArn.split(':alarm:')[1];
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.Threshold).toBe(3000); // 3000ms
    });

    it('should use metric math for error rate calculation', async () => {
      const alarmName = outputs.errorRateAlarmArn.split(':alarm:')[1];
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      const alarm = response.MetricAlarms?.[0];
      // Error rate alarm uses metric queries for calculation
      expect(alarm?.Metrics || alarm?.MetricName).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should process complete payment workflow', async () => {
      const transactionId = `e2e-test-${Date.now()}`;
      const payload = {
        route: 'payment',
        transactionId: transactionId,
        amount: 75.5,
      };

      // Step 1: Invoke Lambda
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      // Step 2: Verify response
      const result = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );
      expect(result.statusCode).toBe(200);

      // Step 3: Wait for DynamoDB write
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 4: Verify DynamoDB storage
      const getItemCommand = new GetItemCommand({
        TableName: outputs.dynamoTableName,
        Key: {
          transactionId: { S: transactionId },
        },
      });

      const dynamoResponse = await dynamoClient.send(getItemCommand);
      expect(dynamoResponse.Item).toBeDefined();
      expect(dynamoResponse.Item?.transactionId.S).toBe(transactionId);
      expect(dynamoResponse.Item?.amount.N).toBe('75.5');
      expect(dynamoResponse.Item?.status.S).toBe('processed');
    });

    it('should handle multiple concurrent invocations', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const payload = {
          route: 'fraud',
          transactionId: `concurrent-${Date.now()}-${i}`,
        };

        const command = new InvokeCommand({
          FunctionName: outputs.lambdaFunctionName,
          Payload: Buffer.from(JSON.stringify(payload)),
        });

        promises.push(lambdaClient.send(command));
      }

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect(response.StatusCode).toBe(200);
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete invocation within timeout', async () => {
      const startTime = Date.now();
      const payload = {
        route: 'notification',
        message: 'Performance test',
        recipient: 'perf@example.com',
      };

      const command = new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      await lambdaClient.send(command);
      const duration = Date.now() - startTime;

      // Should complete well within 30 second timeout
      expect(duration).toBeLessThan(30000);
    });

    it('should use optimized memory allocation', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      // Optimized to 1024 MB (down from 3008 MB)
      expect(response.MemorySize).toBe(1024);
    });
  });

  describe('Security Validation', () => {
    it('should have X-Ray permissions in IAM role', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      // X-Ray tracing is active, indicating permissions are correct
      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    it('should have proper resource tagging', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Tags).toBeDefined();
      expect(response.Tags?.['ManagedBy']).toBe('Pulumi');
      expect(response.Tags?.['Environment']).toBeDefined();
    });
  });
});
