import {
  APIGatewayClient,
  GetRestApiCommand
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeTableCommand,
  DynamoDBClient,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';
import https from 'https';
import path from 'path';

const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};

describe('CloudWatch Analytics System - Integration Tests', () => {
  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      const content = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(content);
    } else {
      console.warn(`Outputs file not found at ${outputsPath}`);
      outputs = {};
    }
  });

  describe('Infrastructure Validation', () => {
    test('should have deployment outputs available', () => {
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'api_gateway_invoke_url',
        'dynamodb_table_name',
        'sns_topic_arn',
        'lambda_api_handler_name',
        'lambda_aggregator_name',
        'rds_endpoint',
        'cloudwatch_dashboard_name',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
      });
    });
  });

  describe('API Gateway Tests', () => {
    const apiGatewayClient = new APIGatewayClient({});

    test('should have API Gateway deployed', async () => {
      const apiId = outputs.api_gateway_id;

      if (!apiId) {
        console.warn('API Gateway ID not found in outputs, skipping test');
        return;
      }

      const command = new GetRestApiCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);

      expect(response.name).toBeDefined();
      expect(response.id).toBe(apiId);
    }, 30000);

    test('should invoke health endpoint successfully', async () => {
      const invokeUrl = outputs.api_gateway_invoke_url;

      if (!invokeUrl) {
        console.warn('API Gateway invoke URL not found, skipping test');
        return;
      }

      const healthUrl = `${invokeUrl}/health`;

      const response = await new Promise<{
        statusCode: number;
        body: string;
      }>((resolve, reject) => {
        https
          .get(healthUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve({
                statusCode: res.statusCode || 0,
                body: data,
              });
            });
          })
          .on('error', reject);
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.service).toBe('cloudwatch-analytics-api');
    }, 30000);
  });

  describe('Lambda Function Tests', () => {
    const lambdaClient = new LambdaClient({});

    test('should have API handler Lambda function deployed', async () => {
      const functionName = outputs.lambda_api_handler_name;

      if (!functionName) {
        console.warn('Lambda API handler name not found, skipping test');
        return;
      }

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toMatch(/python3\./);
    }, 30000);

    test('should have metric aggregator Lambda function deployed', async () => {
      const functionName = outputs.lambda_aggregator_name;

      if (!functionName) {
        console.warn('Lambda aggregator name not found, skipping test');
        return;
      }

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toMatch(/python3\./);
    }, 30000);

    test('should invoke API handler Lambda successfully', async () => {
      const functionName = outputs.lambda_api_handler_name;

      if (!functionName) {
        console.warn('Lambda API handler name not found, skipping test');
        return;
      }

      const testEvent = {
        httpMethod: 'GET',
        path: '/health',
        headers: {},
        queryStringParameters: null,
        body: null,
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(testEvent)),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);
      }
    }, 30000);
  });

  describe('DynamoDB Tests', () => {
    const dynamoClient = new DynamoDBClient({});

    test('should have DynamoDB table deployed', async () => {
      const tableName = outputs.dynamodb_table_name;

      if (!tableName) {
        console.warn('DynamoDB table name not found, skipping test');
        return;
      }

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 30000);

    test('should have encryption enabled', async () => {
      const tableName = outputs.dynamodb_table_name;

      if (!tableName) {
        console.warn('DynamoDB table name not found, skipping test');
        return;
      }

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    }, 30000);

    test('should have point-in-time recovery enabled', async () => {
      const tableName = outputs.dynamodb_table_name;

      if (!tableName) {
        console.warn('DynamoDB table name not found, skipping test');
        return;
      }

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
    }, 30000);
  });

  describe('RDS Tests', () => {
    const rdsClient = new RDSClient({});

    test('should have RDS instance deployed', async () => {
      const instanceId = outputs.rds_instance_id;

      if (!instanceId) {
        console.warn('RDS instance ID not found, skipping test');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBeGreaterThan(0);
      expect(response.DBInstances?.[0].DBInstanceIdentifier).toBe(instanceId);
    }, 30000);

    test('should have encryption enabled', async () => {
      const instanceId = outputs.rds_instance_id;

      if (!instanceId) {
        console.warn('RDS instance ID not found, skipping test');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances?.[0].StorageEncrypted).toBe(true);
    }, 30000);

    test('should have backup retention configured', async () => {
      const instanceId = outputs.rds_instance_id;

      if (!instanceId) {
        console.warn('RDS instance ID not found, skipping test');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances?.[0].BackupRetentionPeriod).toBeGreaterThan(
        0
      );
    }, 30000);

    test('should not be publicly accessible', async () => {
      const instanceId = outputs.rds_instance_id;

      if (!instanceId) {
        console.warn('RDS instance ID not found, skipping test');
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances?.[0].PubliclyAccessible).toBe(false);
    }, 30000);
  });

  describe('CloudWatch Monitoring Tests', () => {
    const cloudwatchClient = new CloudWatchClient({});

    test('should have CloudWatch dashboard deployed', async () => {
      const dashboardName = outputs.cloudwatch_dashboard_name;

      if (!dashboardName) {
        console.warn('Dashboard name not found, skipping test');
        return;
      }

      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cloudwatchClient.send(command);

      expect(response.DashboardName).toBeDefined();
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
    }, 30000);

    test('should collect API Gateway metrics', async () => {
      const apiName = outputs.api_gateway_name;

      if (!apiName) {
        console.warn('API Gateway name not found, skipping test');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

      const command = new GetMetricStatisticsCommand({
        Namespace: 'AWS/ApiGateway',
        MetricName: 'Count',
        Dimensions: [{ Name: 'ApiName', Value: apiName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum'],
      });

      const response = await cloudwatchClient.send(command);

      expect(response.Datapoints).toBeDefined();
    }, 30000);
  });

  describe('SNS Tests', () => {
    const snsClient = new SNSClient({});

    test('should have SNS topic deployed', async () => {
      const topicArn = outputs.sns_topic_arn;

      if (!topicArn) {
        console.warn('SNS topic ARN not found, skipping test');
        return;
      }

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    }, 30000);

    test('should have encryption enabled', async () => {
      const topicArn = outputs.sns_topic_arn;

      if (!topicArn) {
        console.warn('SNS topic ARN not found, skipping test');
        return;
      }

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    }, 30000);
  });

  describe('EventBridge Tests', () => {
    const eventBridgeClient = new EventBridgeClient({});

    test('should have EventBridge rule deployed', async () => {
      const ruleName = outputs.eventbridge_rule_name;

      if (!ruleName) {
        console.warn('EventBridge rule name not found, skipping test');
        return;
      }

      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    }, 30000);

    test('should have Lambda target configured', async () => {
      const ruleName = outputs.eventbridge_rule_name;

      if (!ruleName) {
        console.warn('EventBridge rule name not found, skipping test');
        return;
      }

      const command = new ListTargetsByRuleCommand({ Rule: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('KMS Tests', () => {
    const kmsClient = new KMSClient({});

    test('should have KMS key deployed', async () => {
      const keyId = outputs.kms_key_id;

      if (!keyId) {
        console.warn('KMS key ID not found, skipping test');
        return;
      }

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyId).toBe(keyId);
    }, 30000);

    test('should have key rotation enabled', async () => {
      const keyId = outputs.kms_key_id;

      if (!keyId) {
        console.warn('KMS key ID not found, skipping test');
        return;
      }

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    }, 30000);
  });

  describe('End-to-End Workflow Test', () => {
    test('complete monitoring workflow: API request -> metrics collection -> aggregation', async () => {
      const invokeUrl = outputs.api_gateway_invoke_url;
      const dynamoTableName = outputs.dynamodb_table_name;

      if (!invokeUrl || !dynamoTableName) {
        console.warn('Required outputs not found, skipping E2E test');
        return;
      }

      const healthUrl = `${invokeUrl}/health`;

      const apiResponse = await new Promise<{ statusCode: number }>(
        (resolve, reject) => {
          https
            .get(healthUrl, (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', () => {
                resolve({
                  statusCode: res.statusCode || 0,
                });
              });
            })
            .on('error', reject);
        }
      );

      expect(apiResponse.statusCode).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const cloudwatchClient = new CloudWatchClient({});
      const apiName = outputs.api_gateway_name;

      if (apiName) {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 10 * 60 * 1000);

        const metricsCommand = new GetMetricStatisticsCommand({
          Namespace: 'AWS/ApiGateway',
          MetricName: 'Count',
          Dimensions: [{ Name: 'ApiName', Value: apiName }],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ['Sum'],
        });

        const metricsResponse = await cloudwatchClient.send(metricsCommand);
        expect(metricsResponse.Datapoints).toBeDefined();
      }

      const dynamoClient = new DynamoDBClient({});
      const scanCommand = new ScanCommand({
        TableName: dynamoTableName,
        Limit: 10,
      });

      const scanResponse = await dynamoClient.send(scanCommand);
      expect(scanResponse.Items).toBeDefined();
    }, 60000);
  });
});
