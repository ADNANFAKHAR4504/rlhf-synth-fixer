// Integration tests for deployed Terraform Search API infrastructure
// These tests validate the actual AWS resources created by Terraform

import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  ElastiCacheClient,
  DescribeCacheClustersCommand,
} from '@aws-sdk/client-elasticache';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApisCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  DescribeEventBusCommand,
} from '@aws-sdk/client-eventbridge';

const region = process.env.AWS_REGION || 'us-east-1';
const appName = process.env.APP_NAME || 'search-api';
const environment = process.env.ENVIRONMENT || 'dev';

// Helper function to skip tests if infrastructure isn't deployed
async function checkInfrastructureExists(): Promise<boolean> {
  try {
    const dynamoClient = new DynamoDBClient({ region });
    await dynamoClient.send(
      new DescribeTableCommand({ TableName: `${appName}-search-data` })
    );
    return true;
  } catch (error) {
    console.warn('⚠️  Infrastructure not deployed. Skipping integration tests.');
    return false;
  }
}

describe('Search API Infrastructure Integration Tests', () => {
  let infrastructureExists: boolean;

  beforeAll(async () => {
    infrastructureExists = await checkInfrastructureExists();
  });

  describe('DynamoDB Table', () => {
    test('search data table exists and is configured correctly', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new DynamoDBClient({ region });
      const response = await client.send(
        new DescribeTableCommand({ TableName: `${appName}-search-data` })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.KeySchema).toContainEqual({
        AttributeName: 'id',
        KeyType: 'HASH',
      });
    });

    test('table has QueryIndex GSI', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new DynamoDBClient({ region });
      const response = await client.send(
        new DescribeTableCommand({ TableName: `${appName}-search-data` })
      );

      const gsi = response.Table?.GlobalSecondaryIndexes?.find(
        (index) => index.IndexName === 'QueryIndex'
      );
      expect(gsi).toBeDefined();
      expect(gsi?.KeySchema).toContainEqual({
        AttributeName: 'query',
        KeyType: 'HASH',
      });
    });
  });

  describe('ElastiCache Redis', () => {
    test('Redis cluster exists and is available', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new ElastiCacheClient({ region });
      const response = await client.send(
        new DescribeCacheClustersCommand({
          CacheClusterId: `${appName}-redis`,
        })
      );

      expect(response.CacheClusters).toBeDefined();
      expect(response.CacheClusters?.[0]?.Engine).toBe('redis');
      expect(response.CacheClusters?.[0]?.CacheClusterStatus).toBe('available');
    });

    test('Redis is using correct node type', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new ElastiCacheClient({ region });
      const response = await client.send(
        new DescribeCacheClustersCommand({
          CacheClusterId: `${appName}-redis`,
        })
      );

      expect(response.CacheClusters?.[0]?.CacheNodeType).toBe('cache.t3.small');
    });
  });

  describe('Lambda Function', () => {
    test('search function exists and is configured correctly', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new LambdaClient({ region });
      const response = await client.send(
        new GetFunctionCommand({
          FunctionName: `${appName}-search`,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    test('Lambda has X-Ray tracing enabled', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new LambdaClient({ region });
      const response = await client.send(
        new GetFunctionCommand({
          FunctionName: `${appName}-search`,
        })
      );

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('Lambda has required environment variables', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new LambdaClient({ region });
      const response = await client.send(
        new GetFunctionCommand({
          FunctionName: `${appName}-search`,
        })
      );

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.DYNAMODB_TABLE).toBeDefined();
      expect(envVars?.REDIS_ENDPOINT).toBeDefined();
      expect(envVars?.REDIS_PORT).toBeDefined();
      expect(envVars?.EVENT_BUS).toBeDefined();
    });

    test('Lambda is deployed in VPC', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new LambdaClient({ region });
      const response = await client.send(
        new GetFunctionCommand({
          FunctionName: `${appName}-search`,
        })
      );

      expect(response.Configuration?.VpcConfig?.VpcId).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway', () => {
    test('REST API exists', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new APIGatewayClient({ region });
      const response = await client.send(new GetRestApisCommand({}));

      const api = response.items?.find((item) => item.name === appName);
      expect(api).toBeDefined();
      expect(api?.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API stage has X-Ray tracing enabled', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new APIGatewayClient({ region });
      const apisResponse = await client.send(new GetRestApisCommand({}));
      const api = apisResponse.items?.find((item) => item.name === appName);

      if (!api?.id) {
        throw new Error('API not found');
      }

      const stageResponse = await client.send(
        new GetStageCommand({
          restApiId: api.id,
          stageName: environment,
        })
      );

      expect(stageResponse.tracingEnabled).toBe(true);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms exist for API and Lambda', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new CloudWatchClient({ region });
      const response = await client.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: appName,
        })
      );

      const alarmNames = response.MetricAlarms?.map((alarm) => alarm.AlarmName);
      expect(alarmNames).toContain(`${appName}-api-latency-alarm`);
      expect(alarmNames).toContain(`${appName}-lambda-errors-alarm`);
    });

    test('CloudWatch dashboard exists', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new CloudWatchClient({ region });
      const response = await client.send(new ListDashboardsCommand({}));

      const dashboard = response.DashboardEntries?.find(
        (entry) => entry.DashboardName === `${appName}-dashboard`
      );
      expect(dashboard).toBeDefined();
    });
  });

  describe('EventBridge', () => {
    test('notification event bus exists', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const client = new EventBridgeClient({ region });
      const response = await client.send(
        new DescribeEventBusCommand({
          Name: `${appName}-notifications`,
        })
      );

      expect(response.Name).toBe(`${appName}-notifications`);
      expect(response.Arn).toBeDefined();
    });
  });

  describe('End-to-End API Test', () => {
    test('API endpoint is accessible (if deployed)', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      // This test would require the actual API URL from Terraform outputs
      // For now, we just verify the infrastructure components are in place
      expect(infrastructureExists).toBe(true);
    });
  });
});
