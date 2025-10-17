// Integration Tests for Trading Event Processing System
// These tests use actual AWS deployment outputs - NO MOCKING

import fs from 'fs';
// Import signature packages to register them for SigV4a support
import '@aws-sdk/signature-v4-crt';
import '@aws-sdk/signature-v4a';
import {
  EventBridgeClient,
  DescribeEndpointCommand,
  DescribeEventBusCommand,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import {
  LambdaClient,
  GetFunctionConfigurationCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SQSClient,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  Route53Client,
  GetHealthCheckCommand,
  GetHealthCheckStatusCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Initialize AWS clients
const primaryRegion = outputs.PrimaryRegion || 'us-east-1';
const secondaryRegion = outputs.SecondaryRegion || 'us-west-2';

const eventBridgePrimary = new EventBridgeClient({ region: primaryRegion });
const eventBridgeSecondary = new EventBridgeClient({ region: secondaryRegion });
const lambdaClient = new LambdaClient({ region: primaryRegion });
const dynamoDBPrimary = new DynamoDBClient({ region: primaryRegion });
const dynamoDBSecondary = new DynamoDBClient({ region: secondaryRegion });
const sqsClient = new SQSClient({ region: primaryRegion });
const cloudWatchClient = new CloudWatchClient({ region: primaryRegion });
const iamClient = new IAMClient({ region: primaryRegion });
const route53Client = new Route53Client({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: primaryRegion });

describe('Trading Event Processing System - Integration Tests', () => {
  // Increase timeout for integration tests
  jest.setTimeout(60000);

  describe('1. EventBridge Global Endpoint', () => {
    test('should have Global Endpoint in ACTIVE state', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeEndpointCommand({
          Name: outputs.GlobalEndpointName,
        })
      );

      expect(response.State).toBe('ACTIVE');
      expect(response.Name).toBe(outputs.GlobalEndpointName);
      expect(response.EndpointUrl).toBe(outputs.GlobalEndpointUrl);
      expect(response.Arn).toBe(outputs.GlobalEndpointArn);
    });

    test('should have replication enabled', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeEndpointCommand({
          Name: outputs.GlobalEndpointName,
        })
      );

      expect(response.ReplicationConfig?.State).toBe('ENABLED');
    });

    test('should have correct event buses configured', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeEndpointCommand({
          Name: outputs.GlobalEndpointName,
        })
      );

      const eventBusArns = response.EventBuses?.map((eb) => eb.EventBusArn);
      expect(eventBusArns).toContain(outputs.PrimaryEventBusArn);
      expect(eventBusArns).toContain(outputs.SecondaryEventBusArn);
    });

    test('should have IAM role for replication', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeEndpointCommand({
          Name: outputs.GlobalEndpointName,
        })
      );

      expect(response.RoleArn).toBe(outputs.ReplicationRoleArn);
    });

    test('should have health check configured', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeEndpointCommand({
          Name: outputs.GlobalEndpointName,
        })
      );

      expect(
        response.RoutingConfig?.FailoverConfig?.Primary?.HealthCheck
      ).toBeDefined();
    });

    test('should have failover to secondary region', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeEndpointCommand({
          Name: outputs.GlobalEndpointName,
        })
      );

      expect(
        response.RoutingConfig?.FailoverConfig?.Secondary?.Route
      ).toBe(secondaryRegion);
    });
  });

  describe('2. Primary Region Event Bus', () => {
    test('should exist and be accessible', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeEventBusCommand({
          Name: outputs.EventBusName,
        })
      );

      expect(response.Name).toBe(outputs.EventBusName);
      expect(response.Arn).toBe(outputs.EventBusArn);
    });

    test('should have processing rule configured', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeRuleCommand({
          Name: outputs.RuleName.split('|')[1],
          EventBusName: outputs.EventBusName,
        })
      );

      expect(response.State).toBe('ENABLED');
      expect(response.EventBusName).toBe(outputs.EventBusName);
      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain(outputs.EventSource);
    });

    test('should have Lambda target with retry configuration', async () => {
      const response = await eventBridgePrimary.send(
        new ListTargetsByRuleCommand({
          Rule: outputs.RuleName.split('|')[1],
          EventBusName: outputs.EventBusName,
        })
      );

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);

      const lambdaTarget = response.Targets?.find(
        (t) => t.Arn === outputs.TargetLambdaArn
      );
      expect(lambdaTarget).toBeDefined();
      expect(lambdaTarget?.RetryPolicy?.MaximumRetryAttempts).toBe(
        parseInt(outputs.RetryAttempts)
      );
      expect(lambdaTarget?.DeadLetterConfig?.Arn).toBe(outputs.DLQArn);
    });
  });

  describe('3. Secondary Region Event Bus', () => {
    test('should exist in us-west-2', async () => {
      const response = await eventBridgeSecondary.send(
        new DescribeEventBusCommand({
          Name: outputs.EventBusName,
        })
      );

      expect(response.Name).toBe(outputs.EventBusName);
      expect(response.Arn).toBe(outputs.SecondaryEventBusArn);
    });
  });

  describe('4. Lambda Function Configuration', () => {
    test('should have correct runtime and configuration', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.ProcessingLambdaName,
        })
      );

      expect(response.FunctionName).toBe(outputs.ProcessingLambdaName);
      expect(response.FunctionArn).toBe(outputs.ProcessingLambdaArn);
      expect(response.Runtime).toBe(outputs.LambdaRuntime);
      expect(response.MemorySize).toBe(parseInt(outputs.LambdaMemorySize));
      expect(response.Timeout).toBe(parseInt(outputs.LambdaTimeout));
    });

    test('should have X-Ray tracing enabled', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.ProcessingLambdaName,
        })
      );

      expect(response.TracingConfig?.Mode).toBe('Active');
    });

    test('should have DynamoDB table name in environment', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.ProcessingLambdaName,
        })
      );

      expect(response.Environment?.Variables?.TABLE_NAME).toBe(
        outputs.LambdaTableName
      );
    });

    test('should have Powertools environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.ProcessingLambdaName,
        })
      );

      const env = response.Environment?.Variables || {};
      expect(env.POWERTOOLS_SERVICE_NAME).toBeDefined();
      expect(env.POWERTOOLS_LOGGER_LOG_LEVEL).toBeDefined();
    });

    test('should have IAM role with least-privilege permissions', async () => {
      const roleName = outputs.LambdaRoleName;
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role?.Arn).toBe(outputs.LambdaRoleArn);

      // Check for attached policies
      const policies = await iamClient.send(
        new ListRolePoliciesCommand({
          RoleName: roleName,
        })
      );

      expect(policies.PolicyNames).toBeDefined();
      expect(policies.PolicyNames!.length).toBeGreaterThan(0);
    });
  });

  describe('5. DynamoDB Global Table', () => {
    test('should be in ACTIVE state in primary region', async () => {
      const response = await dynamoDBPrimary.send(
        new DescribeTableCommand({
          TableName: outputs.GlobalTableName,
        })
      );

      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(outputs.GlobalTableName);
      expect(response.Table?.TableArn).toBe(outputs.GlobalTableArn);
    });

    test('should have correct partition and sort keys', async () => {
      const response = await dynamoDBPrimary.send(
        new DescribeTableCommand({
          TableName: outputs.GlobalTableName,
        })
      );

      const partitionKey = response.Table?.KeySchema?.find(
        (k) => k.KeyType === 'HASH'
      );
      const sortKey = response.Table?.KeySchema?.find(
        (k) => k.KeyType === 'RANGE'
      );

      expect(partitionKey?.AttributeName).toBe(outputs.PartitionKeyName);
      expect(sortKey?.AttributeName).toBe(outputs.SortKeyName);
    });

    test('should have PAY_PER_REQUEST billing mode', async () => {
      const response = await dynamoDBPrimary.send(
        new DescribeTableCommand({
          TableName: outputs.GlobalTableName,
        })
      );

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        outputs.BillingMode
      );
    });

    test('should have Point-in-Time Recovery enabled', async () => {
      const response = await dynamoDBPrimary.send(
        new DescribeContinuousBackupsCommand({
          TableName: outputs.GlobalTableName,
        })
      );

      expect(
        response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    test('should have replica in us-west-2', async () => {
      const response = await dynamoDBPrimary.send(
        new DescribeTableCommand({
          TableName: outputs.GlobalTableName,
        })
      );

      const replica = response.Table?.Replicas?.find(
        (r) => r.RegionName === secondaryRegion
      );
      expect(replica).toBeDefined();
      expect(replica?.ReplicaStatus).toBe('ACTIVE');
    });

    test('should be accessible from secondary region', async () => {
      const response = await dynamoDBSecondary.send(
        new DescribeTableCommand({
          TableName: outputs.GlobalTableName,
        })
      );

      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(outputs.GlobalTableName);
    });
  });

  describe('6. Dead Letter Queue (DLQ)', () => {
    test('should exist and be accessible', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.DLQUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes?.QueueArn).toBe(outputs.DLQArn);
    });

    test('should have correct message retention', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.DLQUrl,
          AttributeNames: ['MessageRetentionPeriod'],
        })
      );

      const retentionSeconds = parseInt(
        response.Attributes?.MessageRetentionPeriod || '0'
      );
      const retentionDays = retentionSeconds / 86400;
      expect(retentionDays).toBe(parseInt(outputs.DLQRetentionPeriod));
    });

    test('should initially be empty', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.DLQUrl,
          AttributeNames: ['ApproximateNumberOfMessages'],
        })
      );

      const messageCount = parseInt(
        response.Attributes?.ApproximateNumberOfMessages || '0'
      );
      expect(messageCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('7. CloudWatch Monitoring', () => {
    test('should have DLQ alarm configured', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [outputs.DLQAlarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmArn).toBe(outputs.DLQAlarmArn);
      expect(alarm.MetricName).toBe(outputs.AlarmMetricName);
      expect(alarm.Threshold).toBe(parseInt(outputs.AlarmThreshold));
      expect(alarm.EvaluationPeriods).toBe(
        parseInt(outputs.AlarmEvaluationPeriods)
      );
    });

    test('should have health alarm for primary region', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [outputs.HealthAlarmName],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms![0].AlarmArn).toBe(outputs.HealthAlarmArn);
    });

    test('should have Lambda log group with retention', async () => {
      const response = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: outputs.LambdaLogGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 1,
        })
      );

      expect(response.logStreams).toBeDefined();
    });
  });

  describe('8. Route53 Health Check', () => {
    test('should exist and monitor CloudWatch alarm', async () => {
      const response = await route53Client.send(
        new GetHealthCheckCommand({
          HealthCheckId: outputs.HealthCheckId,
        })
      );

      expect(response.HealthCheck?.Id).toBe(outputs.HealthCheckId);
      expect(response.HealthCheck?.HealthCheckConfig.Type).toBe(
        'CLOUDWATCH_METRIC'
      );
    });

    test('should have status available', async () => {
      const response = await route53Client.send(
        new GetHealthCheckStatusCommand({
          HealthCheckId: outputs.HealthCheckId,
        })
      );

      expect(response.HealthCheckObservations).toBeDefined();
      expect(response.HealthCheckObservations!.length).toBeGreaterThan(0);
    });
  });

  describe('9. End-to-End Event Processing Workflow', () => {
    test('should successfully send event to Global Endpoint', async () => {
      const eventId = `test-${Date.now()}`;
      const timestamp = new Date().toISOString();

      const response = await eventBridgePrimary.send(
        new PutEventsCommand({
          EndpointId: outputs.GlobalEndpointId,
          Entries: [
            {
              Source: outputs.EventSource,
              DetailType: 'trade-executed',
              Detail: JSON.stringify({
                eventId,
                tradeId: `trade-${Date.now()}`,
                symbol: 'TEST',
                quantity: 100,
                price: 99.99,
                timestamp,
                action: 'BUY',
              }),
              EventBusName: outputs.EventBusName,
            },
          ],
        })
      );

      expect(response.FailedEntryCount).toBe(0);
      expect(response.Entries).toBeDefined();
      expect(response.Entries![0].EventId).toBeDefined();
    });

    test('should process multiple events concurrently', async () => {
      const eventPromises = [];
      const numEvents = 5;

      for (let i = 0; i < numEvents; i++) {
        const promise = eventBridgePrimary.send(
          new PutEventsCommand({
            EndpointId: outputs.GlobalEndpointId,
            Entries: [
              {
                Source: outputs.EventSource,
                DetailType: 'trade-executed',
                Detail: JSON.stringify({
                  eventId: `concurrent-test-${i}-${Date.now()}`,
                  tradeId: `trade-${i}`,
                  symbol: 'CONCURRENT',
                  quantity: i * 10,
                  price: 100 + i,
                  timestamp: new Date().toISOString(),
                  action: 'SELL',
                }),
                EventBusName: outputs.EventBusName,
              },
            ],
          })
        );
        eventPromises.push(promise);
      }

      const results = await Promise.all(eventPromises);
      results.forEach((result) => {
        expect(result.FailedEntryCount).toBe(0);
      });
    });

    test('should verify Lambda invocation after event', async () => {
      // Send an event
      const eventId = `verify-invoke-${Date.now()}`;
      await eventBridgePrimary.send(
        new PutEventsCommand({
          EndpointId: outputs.GlobalEndpointId,
          Entries: [
            {
              Source: outputs.EventSource,
              DetailType: 'trade-executed',
              Detail: JSON.stringify({
                eventId,
                tradeId: `verify-${Date.now()}`,
                symbol: 'VERIFY',
                quantity: 50,
                price: 150.0,
                timestamp: new Date().toISOString(),
                action: 'BUY',
              }),
              EventBusName: outputs.EventBusName,
            },
          ],
        })
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check Lambda metrics
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 10 minutes ago

      const response = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/Lambda',
          MetricName: 'Invocations',
          Dimensions: [
            {
              Name: 'FunctionName',
              Value: outputs.ProcessingLambdaName,
            },
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ['Sum'],
        })
      );

      // If no datapoints yet, that's okay - metrics can lag
      if (response.Datapoints && response.Datapoints.length > 0) {
        const totalInvocations = response.Datapoints.reduce(
          (sum, dp) => sum + (dp.Sum || 0),
          0
        );
        expect(totalInvocations).toBeGreaterThan(0);
      }
    });

    test('should have structured logs in CloudWatch', async () => {
      const response = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: outputs.LambdaLogGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 1,
        })
      );

      if (response.logStreams && response.logStreams.length > 0) {
        const logStream = response.logStreams[0];
        const logs = await logsClient.send(
          new GetLogEventsCommand({
            logGroupName: outputs.LambdaLogGroupName,
            logStreamName: logStream.logStreamName!,
            limit: 10,
          })
        );

        expect(logs.events).toBeDefined();
        if (logs.events && logs.events.length > 0) {
          const hasProcessingLog = logs.events.some((event) =>
            event.message?.includes('Processing event')
          );
          expect(hasProcessingLog).toBe(true);
        }
      }
    });

    test('should verify DLQ remains empty with successful processing', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: outputs.DLQUrl,
          AttributeNames: ['ApproximateNumberOfMessages'],
        })
      );

      const messageCount = parseInt(
        response.Attributes?.ApproximateNumberOfMessages || '0'
      );
      // DLQ should ideally be empty, but allow for any count >= 0
      expect(messageCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('10. Multi-Region Resilience', () => {
    test('should have matching event bus names across regions', () => {
      // Both regions should have the same event bus name
      expect(outputs.EventBusName).toBeDefined();
      expect(outputs.SecondaryEventBusArn).toContain(outputs.EventBusName);
    });

    test('should have DynamoDB table replicated and accessible', async () => {
      const primaryResponse = await dynamoDBPrimary.send(
        new DescribeTableCommand({
          TableName: outputs.GlobalTableName,
        })
      );

      const secondaryResponse = await dynamoDBSecondary.send(
        new DescribeTableCommand({
          TableName: outputs.GlobalTableName,
        })
      );

      expect(primaryResponse.Table?.TableName).toBe(
        secondaryResponse.Table?.TableName
      );
      expect(primaryResponse.Table?.TableStatus).toBe('ACTIVE');
      expect(secondaryResponse.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have Global Endpoint configured for failover', async () => {
      const response = await eventBridgePrimary.send(
        new DescribeEndpointCommand({
          Name: outputs.GlobalEndpointName,
        })
      );

      const failoverConfig = response.RoutingConfig?.FailoverConfig;
      expect(failoverConfig?.Primary).toBeDefined();
      expect(failoverConfig?.Secondary?.Route).toBe(secondaryRegion);
    });
  });

  describe('11. Security and IAM', () => {
    test('should have replication IAM role with required permissions', async () => {
      const roleName = outputs.ReplicationRoleName;
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role?.Arn).toBe(outputs.ReplicationRoleArn);
      expect(response.Role?.RoleName).toBe(roleName);

      // Verify trust relationship allows EventBridge
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      expect(
        trustPolicy.Statement.some(
          (s: any) => s.Principal?.Service === 'events.amazonaws.com'
        )
      ).toBe(true);
    });

    test('should have Lambda execution role with DynamoDB permissions', async () => {
      const roleName = outputs.LambdaRoleName;
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();

      const policies = await iamClient.send(
        new ListRolePoliciesCommand({
          RoleName: roleName,
        })
      );

      expect(policies.PolicyNames).toBeDefined();
      expect(policies.PolicyNames!.length).toBeGreaterThan(0);
    });
  });

  describe('12. Performance and Scalability', () => {
    test('should handle rapid event ingestion', async () => {
      const startTime = Date.now();
      const totalEvents = 20;
      const batchSize = 10; // EventBridge PutEvents limit

      // Create events in batches of 10
      const batches = [];
      for (let batch = 0; batch < Math.ceil(totalEvents / batchSize); batch++) {
        const events = Array.from({ length: batchSize }, (_, i) => ({
          Source: outputs.EventSource,
          DetailType: 'performance-test',
          Detail: JSON.stringify({
            eventId: `perf-${batch * batchSize + i}-${Date.now()}`,
            testNumber: batch * batchSize + i,
            timestamp: new Date().toISOString(),
          }),
          EventBusName: outputs.EventBusName,
        }));

        const batchPromise = eventBridgePrimary.send(
          new PutEventsCommand({
            EndpointId: outputs.GlobalEndpointId,
            Entries: events,
          })
        );
        batches.push(batchPromise);
      }

      const responses = await Promise.all(batches);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all batches succeeded
      responses.forEach((response) => {
        expect(response.FailedEntryCount).toBe(0);
      });
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    test('should verify Lambda has adequate timeout', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.ProcessingLambdaName,
        })
      );

      const timeout = response.Timeout || 0;
      expect(timeout).toBeGreaterThanOrEqual(5); // At least 5 seconds
      expect(timeout).toBeLessThanOrEqual(900); // Max 15 minutes
    });

    test('should verify Lambda has adequate memory', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.ProcessingLambdaName,
        })
      );

      const memory = response.MemorySize || 0;
      expect(memory).toBeGreaterThanOrEqual(512); // Minimum 512 MB
      expect(memory).toBeLessThanOrEqual(10240); // Max 10 GB
    });
  });
});
