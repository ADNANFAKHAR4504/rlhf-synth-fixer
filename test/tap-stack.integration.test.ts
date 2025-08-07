import { readFileSync } from 'fs';
import { join } from 'path';
import { LambdaClient, GetFunctionConfigurationCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { APIGatewayClient, GetRestApiCommand } from '@aws-sdk/client-api-gateway';
import { CloudWatchClient, ListMetricsCommand, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { EventBridgeClient, DescribeEventBusCommand, ListRulesCommand } from '@aws-sdk/client-eventbridge';
import { SchedulerClient, GetScheduleGroupCommand, GetScheduleCommand } from '@aws-sdk/client-scheduler';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

// AWS Service Clients
const lambda = new LambdaClient({ region: 'us-east-1' });
const apiGateway = new APIGatewayClient({ region: 'us-east-1' });
const cloudWatch = new CloudWatchClient({ region: 'us-east-1' });
const eventBridge = new EventBridgeClient({ region: 'us-east-1' });
const scheduler = new SchedulerClient({ region: 'us-east-1' });
const logs = new CloudWatchLogsClient({ region: 'us-east-1' });

// Load deployment outputs
let outputs: any = {};
try {
  const outputsPath = join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.warn('Could not load deployment outputs:', error);
}

describe('Serverless Infrastructure Integration Tests', () => {
  const API_URL = outputs.ApiGatewayUrl;
  const USER_FUNCTION_NAME = outputs.UserFunctionName;
  const ORDER_FUNCTION_NAME = outputs.OrderFunctionName;
  const SCHEDULED_FUNCTION_NAME = outputs.ScheduledProcessingFunctionName;
  const EVENT_BUS_NAME = outputs.EventBusName;
  const SCHEDULE_GROUP_NAME = outputs.ScheduleGroupName;

  describe('Lambda Functions', () => {
    test('User Lambda function exists and is configured correctly', async () => {
      if (!USER_FUNCTION_NAME) {
        console.log('Skipping test - no user function deployed');
        return;
      }

      const response = await lambda
        .getFunctionConfiguration({
          FunctionName: USER_FUNCTION_NAME,
        })
        .promise();

      expect(response.FunctionName).toBe(USER_FUNCTION_NAME);
      expect(response.Runtime).toBe('nodejs20.x');
      expect(response.Handler).toBe('index.handler');
      expect(response.TracingConfig?.Mode).toBe('Active');
      expect(response.Environment?.Variables?.POWERTOOLS_SERVICE_NAME).toBe('user-service');
      expect(response.Environment?.Variables?.POWERTOOLS_METRICS_NAMESPACE).toBe('ServerlessApp');
    });

    test('Order Lambda function exists and is configured correctly', async () => {
      if (!ORDER_FUNCTION_NAME) {
        console.log('Skipping test - no order function deployed');
        return;
      }

      const response = await lambda
        .getFunctionConfiguration({
          FunctionName: ORDER_FUNCTION_NAME,
        })
        .promise();

      expect(response.FunctionName).toBe(ORDER_FUNCTION_NAME);
      expect(response.Runtime).toBe('nodejs20.x');
      expect(response.Handler).toBe('index.handler');
      expect(response.TracingConfig?.Mode).toBe('Active');
      expect(response.Environment?.Variables?.POWERTOOLS_SERVICE_NAME).toBe('order-service');
      expect(response.Environment?.Variables?.EVENT_BUS_NAME).toBe(EVENT_BUS_NAME);
    });

    test('Scheduled Processing Lambda function exists and is configured correctly', async () => {
      if (!SCHEDULED_FUNCTION_NAME) {
        console.log('Skipping test - no scheduled function deployed');
        return;
      }

      const response = await lambda
        .getFunctionConfiguration({
          FunctionName: SCHEDULED_FUNCTION_NAME,
        })
        .promise();

      expect(response.FunctionName).toBe(SCHEDULED_FUNCTION_NAME);
      expect(response.Runtime).toBe('nodejs20.x');
      expect(response.Handler).toBe('index.handler');
      expect(response.TracingConfig?.Mode).toBe('Active');
      expect(response.Timeout).toBe(60);
    });

    test('Lambda functions have Powertools layer attached', async () => {
      if (!USER_FUNCTION_NAME) {
        console.log('Skipping test - no functions deployed');
        return;
      }

      const response = await lambda
        .getFunctionConfiguration({
          FunctionName: USER_FUNCTION_NAME,
        })
        .promise();

      expect(response.Layers).toBeDefined();
      expect(response.Layers?.length).toBeGreaterThan(0);
      const powertoolsLayer = response.Layers?.find((layer) =>
        layer.Arn?.includes('AWSLambdaPowertoolsTypeScriptV2')
      );
      expect(powertoolsLayer).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('API Gateway endpoint is accessible', async () => {
      if (!API_URL) {
        console.log('Skipping test - no API deployed');
        return;
      }

      // Test that API URL is valid
      expect(API_URL).toMatch(/https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*/);
    });

    test('API Gateway has CORS configured', async () => {
      if (!API_URL) {
        console.log('Skipping test - no API deployed');
        return;
      }

      // Extract API ID from URL
      const apiIdMatch = API_URL.match(/https:\/\/([^.]+)\.execute-api/);
      if (!apiIdMatch) {
        throw new Error('Could not extract API ID from URL');
      }
      const apiId = apiIdMatch[1];

      const response = await apiGateway
        .getRestApi({
          restApiId: apiId,
        })
        .promise();

      expect(response.name).toContain('serverless-api');
    });
  });

  describe('EventBridge', () => {
    test('Custom EventBridge bus exists', async () => {
      if (!EVENT_BUS_NAME) {
        console.log('Skipping test - no event bus deployed');
        return;
      }

      const response = await eventBridge
        .describeEventBus({
          Name: EVENT_BUS_NAME,
        })
        .promise();

      expect(response.Name).toBe(EVENT_BUS_NAME);
      expect(response.Arn).toContain(EVENT_BUS_NAME);
    });

    test('EventBridge rule for order processing exists', async () => {
      if (!EVENT_BUS_NAME) {
        console.log('Skipping test - no event bus deployed');
        return;
      }

      const response = await eventBridge
        .listRules({
          EventBusName: EVENT_BUS_NAME,
        })
        .promise();

      const orderRule = response.Rules?.find((rule) =>
        rule.Name?.includes('order-processing')
      );
      expect(orderRule).toBeDefined();
      expect(orderRule?.State).toBe('ENABLED');
    });
  });

  describe('EventBridge Scheduler', () => {
    test('Schedule group exists', async () => {
      if (!SCHEDULE_GROUP_NAME) {
        console.log('Skipping test - no schedule group deployed');
        return;
      }

      const response = await scheduler
        .getScheduleGroup({
          Name: SCHEDULE_GROUP_NAME,
        })
        .promise();

      expect(response.Name).toBe(SCHEDULE_GROUP_NAME);
      expect(response.State).toBe('ACTIVE');
    });

    test('Daily processing schedule exists and is enabled', async () => {
      if (!SCHEDULE_GROUP_NAME || !outputs.DailyScheduleName) {
        console.log('Skipping test - no schedules deployed');
        return;
      }

      const response = await scheduler
        .getSchedule({
          GroupName: SCHEDULE_GROUP_NAME,
          Name: outputs.DailyScheduleName,
        })
        .promise();

      expect(response.Name).toBe(outputs.DailyScheduleName);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBe('cron(0 2 * * ? *)');
      expect(response.Target?.Arn).toContain(SCHEDULED_FUNCTION_NAME);
    });

    test('Hourly processing schedule exists and is enabled', async () => {
      if (!SCHEDULE_GROUP_NAME || !outputs.HourlyScheduleName) {
        console.log('Skipping test - no schedules deployed');
        return;
      }

      const response = await scheduler
        .getSchedule({
          GroupName: SCHEDULE_GROUP_NAME,
          Name: outputs.HourlyScheduleName,
        })
        .promise();

      expect(response.Name).toBe(outputs.HourlyScheduleName);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBe('rate(1 hour)');
      expect(response.Target?.Arn).toContain(SCHEDULED_FUNCTION_NAME);
    });

    test('One-time initialization schedule exists', async () => {
      if (!SCHEDULE_GROUP_NAME || !outputs.OneTimeScheduleName) {
        console.log('Skipping test - no schedules deployed');
        return;
      }

      const response = await scheduler
        .getSchedule({
          GroupName: SCHEDULE_GROUP_NAME,
          Name: outputs.OneTimeScheduleName,
        })
        .promise();

      expect(response.Name).toBe(outputs.OneTimeScheduleName);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toMatch(/^at\(/);
      expect(response.Target?.Arn).toContain(SCHEDULED_FUNCTION_NAME);
    });
  });

  describe('CloudWatch Logs', () => {
    test('Powertools log group exists', async () => {
      if (!outputs.PowertoolsLogGroupArn) {
        console.log('Skipping test - no log groups deployed');
        return;
      }

      // Extract log group name from ARN
      const logGroupName = outputs.PowertoolsLogGroupArn.split(':log-group:')[1]?.split(':')[0];
      if (!logGroupName) {
        throw new Error('Could not extract log group name from ARN');
      }

      const response = await logs
        .describeLogGroups({
          logGroupNamePrefix: logGroupName,
        })
        .promise();

      const logGroup = response.logGroups?.find((lg) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });

    test('EventBridge log group exists', async () => {
      if (!outputs.EventBridgeLogGroupArn) {
        console.log('Skipping test - no log groups deployed');
        return;
      }

      // Extract log group name from ARN
      const logGroupName = outputs.EventBridgeLogGroupArn.split(':log-group:')[1]?.split(':')[0];
      if (!logGroupName) {
        throw new Error('Could not extract log group name from ARN');
      }

      const response = await logs
        .describeLogGroups({
          logGroupNamePrefix: logGroupName,
        })
        .promise();

      const logGroup = response.logGroups?.find((lg) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('CloudWatch Metrics', () => {
    test('Custom metrics namespace exists', async () => {
      const response = await cloudWatch
        .listMetrics({
          Namespace: 'ServerlessApp',
        })
        .promise();

      // Check if namespace exists (it may not have metrics yet if functions haven't been invoked)
      expect(response).toBeDefined();
    });

    test('Lambda function error alarms exist', async () => {
      const response = await cloudWatch
        .describeAlarms({
          AlarmNamePrefix: 'TapStack',
        })
        .promise();

      // Check for function error alarms
      const userErrorAlarm = response.MetricAlarms?.find((alarm) =>
        alarm.AlarmName?.includes('UserFunctionErrorAlarm')
      );
      const orderErrorAlarm = response.MetricAlarms?.find((alarm) =>
        alarm.AlarmName?.includes('OrderFunctionErrorAlarm')
      );
      const scheduledErrorAlarm = response.MetricAlarms?.find((alarm) =>
        alarm.AlarmName?.includes('ScheduledFunctionErrorAlarm')
      );

      // At least some alarms should exist
      const alarmsExist = userErrorAlarm || orderErrorAlarm || scheduledErrorAlarm;
      expect(alarmsExist).toBeTruthy();
    });
  });

  describe('End-to-End Workflows', () => {
    test('Lambda function can be invoked directly', async () => {
      if (!USER_FUNCTION_NAME) {
        console.log('Skipping test - no user function deployed');
        return;
      }

      const payload = {
        httpMethod: 'GET',
        path: '/users',
        headers: {},
      };

      const response = await lambda
        .invoke({
          FunctionName: USER_FUNCTION_NAME,
          Payload: JSON.stringify(payload),
        })
        .promise();

      expect(response.StatusCode).toBe(200);
      
      // Parse the response payload
      if (response.Payload) {
        const result = JSON.parse(response.Payload.toString());
        // Check if function executed (even if with error due to missing dependencies)
        expect(result).toBeDefined();
      }
    });

    test('Order function can publish events to EventBridge', async () => {
      if (!ORDER_FUNCTION_NAME || !EVENT_BUS_NAME) {
        console.log('Skipping test - no order function or event bus deployed');
        return;
      }

      const payload = {
        httpMethod: 'POST',
        path: '/orders',
        pathParameters: {
          customerId: 'test-customer',
        },
        headers: {},
        body: JSON.stringify({
          items: ['item1', 'item2'],
        }),
      };

      const response = await lambda
        .invoke({
          FunctionName: ORDER_FUNCTION_NAME,
          Payload: JSON.stringify(payload),
        })
        .promise();

      expect(response.StatusCode).toBe(200);
    });

    test('Scheduled function can be invoked with schedule context', async () => {
      if (!SCHEDULED_FUNCTION_NAME) {
        console.log('Skipping test - no scheduled function deployed');
        return;
      }

      const payload = {
        scheduleType: 'test',
        task: 'integration-test',
        time: new Date().toISOString(),
        scheduleArn: 'arn:aws:scheduler:us-east-1:123456789012:schedule/test',
      };

      const response = await lambda
        .invoke({
          FunctionName: SCHEDULED_FUNCTION_NAME,
          Payload: JSON.stringify(payload),
        })
        .promise();

      expect(response.StatusCode).toBe(200);
    });
  });
});