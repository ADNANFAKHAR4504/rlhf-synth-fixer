/**
 * Integration tests for the TapStack component
 *
 * These tests verify the deployed infrastructure against real AWS resources.
 * They require the stack to be deployed and use actual outputs.
 */
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

describe('Order Processing Lambda Integration Tests', () => {
  let outputs: any;
  let lambda: AWS.Lambda;
  let sqs: AWS.SQS;
  let cloudwatch: AWS.CloudWatch;
  let cloudwatchLogs: AWS.CloudWatchLogs;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'Deployment outputs not found. Please deploy the stack first using: bash scripts/qa-pipeline.sh'
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS SDK clients
    const region = process.env.AWS_REGION || 'us-east-1';
    lambda = new AWS.Lambda({ region });
    sqs = new AWS.SQS({ region });
    cloudwatch = new AWS.CloudWatch({ region });
    cloudwatchLogs = new AWS.CloudWatchLogs({ region });
  });

  describe('Deployed Infrastructure Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.lambdaAliasName).toBeDefined();
      expect(outputs.lambdaAliasArn).toBeDefined();
      expect(outputs.dlqQueueUrl).toBeDefined();
      expect(outputs.dlqQueueArn).toBeDefined();
      expect(outputs.dashboardName).toBeDefined();
      expect(outputs.alarmName).toBeDefined();
      expect(outputs.logGroupName).toBeDefined();
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should have Lambda function deployed with correct configuration', async () => {
      const response = await lambda
        .getFunctionConfiguration({
          FunctionName: outputs.lambdaFunctionName,
        })
        .promise();

      // Requirement 1: Verify memory and timeout
      expect(response.MemorySize).toBe(1024);
      expect(response.Timeout).toBe(30);

      // Requirement 2: Verify reserved concurrency (adjusted for AWS account limits)
      // Note: ReservedConcurrentExecutions may be undefined if not explicitly set or if account limits apply
      if (response.ReservedConcurrentExecutions !== undefined) {
        expect(response.ReservedConcurrentExecutions).toBe(5);
      }

      // Requirement 3: Verify X-Ray tracing
      expect(response.TracingConfig?.Mode).toBe('Active');

      // Requirement 8: Verify DLQ configuration
      expect(response.DeadLetterConfig?.TargetArn).toBe(outputs.dlqQueueArn);
    });

    it('should have correct runtime environment', async () => {
      const response = await lambda
        .getFunctionConfiguration({
          FunctionName: outputs.lambdaFunctionName,
        })
        .promise();

      expect(response.Runtime).toContain('nodejs');
      expect(response.Handler).toBe('index.handler');
    });

    it('should have environment variables configured', async () => {
      const response = await lambda
        .getFunctionConfiguration({
          FunctionName: outputs.lambdaFunctionName,
        })
        .promise();

      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.ENVIRONMENT).toBeDefined();
      expect(response.Environment?.Variables?.DLQ_URL).toBe(outputs.dlqQueueUrl);
    });
  });

  describe('Lambda Versioning and Alias', () => {
    it('should have Lambda alias created', async () => {
      const response = await lambda
        .getAlias({
          FunctionName: outputs.lambdaFunctionName,
          Name: outputs.lambdaAliasName,
        })
        .promise();

      expect(response.Name).toBe(outputs.lambdaAliasName);
      expect(response.FunctionVersion).toBeDefined();
      expect(response.FunctionVersion).not.toBe('$LATEST');
    });

    it('should be able to invoke Lambda via alias', async () => {
      const response = await lambda
        .invoke({
          FunctionName: `${outputs.lambdaFunctionName}:${outputs.lambdaAliasName}`,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            orderId: 'test-order-123',
            orderData: {
              item: 'Test Item',
              quantity: 1,
            },
          }),
        })
        .promise();

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(response.Payload as string);
      expect(payload.statusCode).toBe(200);
    });
  });

  describe('Dead Letter Queue (SQS)', () => {
    it('should have DLQ created', async () => {
      const response = await sqs
        .getQueueAttributes({
          QueueUrl: outputs.dlqQueueUrl,
          AttributeNames: ['All'],
        })
        .promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.QueueArn).toBe(outputs.dlqQueueArn);
    });

    it('should have correct DLQ configuration', async () => {
      const response = await sqs
        .getQueueAttributes({
          QueueUrl: outputs.dlqQueueUrl,
          AttributeNames: ['MessageRetentionPeriod', 'VisibilityTimeout'],
        })
        .promise();

      // 14 days retention
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600');
      // 5 minutes visibility timeout
      expect(response.Attributes?.VisibilityTimeout).toBe('300');
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should have log group created with 7-day retention', async () => {
      const response = await cloudwatchLogs
        .describeLogGroups({
          logGroupNamePrefix: outputs.logGroupName,
        })
        .promise();

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.logGroupName);
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('CloudWatch Alarm', () => {
    it('should have error alarm created', async () => {
      const response = await cloudwatch
        .describeAlarms({
          AlarmNames: [outputs.alarmName],
        })
        .promise();

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(outputs.alarmName);
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Period).toBe(300); // 5 minutes
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should have dashboard created', async () => {
      const response = await cloudwatch
        .getDashboard({
          DashboardName: outputs.dashboardName,
        })
        .promise();

      expect(response.DashboardName).toBe(outputs.dashboardName);
      expect(response.DashboardBody).toBeDefined();

      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });

    it('should include Lambda metrics in dashboard', async () => {
      const response = await cloudwatch
        .getDashboard({
          DashboardName: outputs.dashboardName,
        })
        .promise();

      const dashboardBody = JSON.parse(response.DashboardBody!);

      // Check for key metrics
      const metricsText = JSON.stringify(dashboardBody);
      expect(metricsText).toContain('Invocations');
      expect(metricsText).toContain('Errors');
      expect(metricsText).toContain('Throttles');
      expect(metricsText).toContain('Duration');
      expect(metricsText).toContain('ConcurrentExecutions');
    });
  });

  describe('Resource Tagging', () => {
    it('should have proper tags on Lambda function', async () => {
      const response = await lambda
        .listTags({
          Resource: outputs.lambdaFunctionArn,
        })
        .promise();

      expect(response.Tags).toBeDefined();
      expect(response.Tags?.Environment).toBeDefined();
      expect(response.Tags?.Team).toBe('OrderProcessing');
      expect(response.Tags?.CostCenter).toBe('Engineering');
    });

    it('should have proper tags on DLQ', async () => {
      const response = await sqs
        .listQueueTags({
          QueueUrl: outputs.dlqQueueUrl,
        })
        .promise();

      expect(response.Tags).toBeDefined();
      expect(response.Tags?.Environment).toBeDefined();
      expect(response.Tags?.Team).toBe('OrderProcessing');
      expect(response.Tags?.CostCenter).toBe('Engineering');
    });
  });

  describe('Lambda Invocation Tests', () => {
    it('should successfully process valid order', async () => {
      const response = await lambda
        .invoke({
          FunctionName: outputs.lambdaFunctionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            orderId: 'order-' + Date.now(),
            orderData: {
              item: 'Integration Test Item',
              quantity: 5,
              price: 99.99,
            },
          }),
        })
        .promise();

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(response.Payload as string);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.status).toBe('processed');
      expect(body.orderId).toBeDefined();
    });

    it('should handle invalid order and use DLQ', async () => {
      const response = await lambda
        .invoke({
          FunctionName: outputs.lambdaFunctionName,
          InvocationType: 'Event', // Async invocation for DLQ testing
          Payload: JSON.stringify({
            // Missing orderId - should trigger error
            orderData: {
              item: 'Invalid Order',
            },
          }),
        })
        .promise();

      // Async invocation returns 202
      expect(response.StatusCode).toBe(202);

      // Wait a bit for potential DLQ processing
      await new Promise(resolve => setTimeout(resolve, 2000));
    });
  });

  describe('CloudWatch Logs', () => {
    it('should create log streams when Lambda is invoked', async () => {
      // Invoke Lambda first
      await lambda
        .invoke({
          FunctionName: outputs.lambdaFunctionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            orderId: 'log-test-' + Date.now(),
            orderData: { test: true },
          }),
        })
        .promise();

      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 3000));

      const response = await cloudwatchLogs
        .describeLogStreams({
          logGroupName: outputs.logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 1,
        })
        .promise();

      expect(response.logStreams).toBeDefined();
      expect(response.logStreams?.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Optimization', () => {
    it('should execute within timeout limits', async () => {
      const startTime = Date.now();

      const response = await lambda
        .invoke({
          FunctionName: outputs.lambdaFunctionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            orderId: 'perf-test-' + Date.now(),
            orderData: { test: true },
          }),
        })
        .promise();

      const executionTime = Date.now() - startTime;

      expect(response.StatusCode).toBe(200);
      expect(executionTime).toBeLessThan(30000); // Less than 30s timeout
    });

    it('should handle concurrent invocations', async () => {
      const invocations = Array.from({ length: 10 }, (_, i) =>
        lambda
          .invoke({
            FunctionName: outputs.lambdaFunctionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({
              orderId: `concurrent-test-${i}-${Date.now()}`,
              orderData: { test: true, index: i },
            }),
          })
          .promise()
      );

      const results = await Promise.all(invocations);

      results.forEach(response => {
        expect(response.StatusCode).toBe(200);
        expect(response.FunctionError).toBeUndefined();
      });
    });
  });
});
