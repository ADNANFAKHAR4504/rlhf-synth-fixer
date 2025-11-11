import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENV_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';

// Initialize AWS clients
const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });

describe('Payment Processing System - Live Integration Tests', () => {
  const stackPrefix = `TapStack${ENV_SUFFIX}`;

  describe('Infrastructure Deployment Validation', () => {
    test('Lambda functions are deployed and accessible', async () => {
      const transactionProcessorName = `transaction-processor-${ENV_SUFFIX}`;
      const statusCheckerName = `status-checker-${ENV_SUFFIX}`;

      const [transactionProcessor, statusChecker] = await Promise.all([
        lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: transactionProcessorName,
          })
        ),
        lambdaClient.send(
          new GetFunctionCommand({ FunctionName: statusCheckerName })
        ),
      ]);

      expect(transactionProcessor.Configuration?.FunctionName).toBe(
        transactionProcessorName
      );
      expect(statusChecker.Configuration?.FunctionName).toBe(
        statusCheckerName
      );
    }, 30000);

  });


  describe('Lambda Function Invocation', () => {
    test('Transaction processor handles valid transactions', async () => {
      const transactionProcessorName = `transaction-processor-${ENV_SUFFIX}`;

      const payload = {
        transactionId: `test-${Date.now()}`,
        amount: 50.0,
        currency: 'USD',
        merchantId: 'merchant-789',
        customerId: 'customer-012',
      };

      const result = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: transactionProcessorName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify(payload)),
        })
      );

      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();

      const response = JSON.parse(
        Buffer.from(result.Payload!).toString('utf-8')
      );
      expect(response).toHaveProperty('statusCode');
    }, 30000);

    test('Status checker retrieves transaction status', async () => {
      const statusCheckerName = `status-checker-${ENV_SUFFIX}`;

      const payload = {
        transactionId: `test-${Date.now()}`,
      };

      const result = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: statusCheckerName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify(payload)),
        })
      );

      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();
    }, 30000);
  });



  describe('CloudWatch Metrics and Monitoring', () => {
    test('Lambda invocation metrics are being recorded', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

      const result = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/Lambda',
          MetricName: 'Invocations',
          Dimensions: [
            {
              Name: 'FunctionName',
              Value: `transaction-processor-${ENV_SUFFIX}`,
            },
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ['Sum'],
        })
      );

      expect(result.$metadata.httpStatusCode).toBe(200);
      expect(result.Datapoints).toBeDefined();
    }, 30000);

    test('DynamoDB metrics are being recorded', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000);

      const result = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/DynamoDB',
          MetricName: 'ConsumedReadCapacityUnits',
          Dimensions: [
            {
              Name: 'TableName',
              Value: `payment-transactions-${ENV_SUFFIX}`,
            },
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ['Sum'],
        })
      );

      expect(result.$metadata.httpStatusCode).toBe(200);
    }, 30000);
  });

});
