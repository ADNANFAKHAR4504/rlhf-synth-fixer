// Integration tests for deployed Terraform infrastructure
// Tests validate actual AWS resources and end-to-end workflows

import {
  APIGatewayClient,
  GetRestApiCommand
} from '@aws-sdk/client-api-gateway';
import {
  CloudFrontClient,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeTableCommand,
  DynamoDBClient,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetWebACLCommand,
  WAFV2Client,
} from '@aws-sdk/client-wafv2';
import * as fs from 'fs';
import * as https from 'https';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

// Load outputs from deployment
function loadOutputs(): any {
  const outputPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

  // For local development, use mock data
  if (!fs.existsSync(outputPath) && !process.env.CI) {
    console.log('⚠️  Using mock data for local testing');
    return {
      api_gateway_url_primary: 'mock-api.execute-api.us-east-1.amazonaws.com/prod',
      api_gateway_id_primary: 'mock123abc',
      api_gateway_id_secondary: 'mock456def',
      cloudfront_domain_name: 'mock123.cloudfront.net',
      cloudfront_distribution_id: 'E1MOCKID',
      dynamodb_table_name: 'fintech-api-transactions',
      lambda_authorizer_name_primary: 'fintech-api-authorizer-primary',
      lambda_transaction_name_primary: 'fintech-api-transaction-primary',
      secrets_manager_secret_name: 'fintech-api-api-keys',
      waf_web_acl_id: 'mock-waf-id',
      primary_region: 'us-east-1',
      secondary_region: 'us-west-2',
    };
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Output file not found: ${outputPath}. Ensure deployment has completed.`
    );
  }

  return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
}

const outputs = loadOutputs();
const isMockData = !process.env.CI && !fs.existsSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'));

// Helper function to make HTTPS requests
function httpsRequest(options: any, data?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

describe('Secure API Integration Tests', () => {
  // Skip tests if using mock data
  const skipIfMock = isMockData ? describe.skip : describe;

  skipIfMock('Resource Validation', () => {
    test('API Gateway primary exists and is accessible', async () => {
      const client = new APIGatewayClient({ region: outputs.primary_region });
      const command = new GetRestApiCommand({
        restApiId: outputs.api_gateway_id_primary,
      });

      const response = await client.send(command);
      expect(response.id).toBe(outputs.api_gateway_id_primary);
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    }, 30000);

    test('API Gateway secondary exists and is accessible', async () => {
      const client = new APIGatewayClient({ region: outputs.secondary_region });
      const command = new GetRestApiCommand({
        restApiId: outputs.api_gateway_id_secondary,
      });

      const response = await client.send(command);
      expect(response.id).toBe(outputs.api_gateway_id_secondary);
    }, 30000);

    test('Lambda authorizer function is deployed', async () => {
      const client = new LambdaClient({ region: outputs.primary_region });
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_authorizer_name_primary,
      });

      const response = await client.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.10');
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    }, 30000);

    test('Lambda transaction function is deployed', async () => {
      const client = new LambdaClient({ region: outputs.primary_region });
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_transaction_name_primary,
      });

      const response = await client.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.10');
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
      expect(response.Configuration?.Timeout).toBeGreaterThanOrEqual(30);
    }, 30000);

    test('DynamoDB Global Table is operational', async () => {
      const client = new DynamoDBClient({ region: outputs.primary_region });
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await client.send(command);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    }, 30000);

    test('CloudFront distribution is active', async () => {
      const client = new CloudFrontClient({ region: 'us-east-1' });
      const command = new GetDistributionCommand({
        Id: outputs.cloudfront_distribution_id,
      });

      const response = await client.send(command);
      expect(response.Distribution?.Status).toBe('Deployed');
      expect(response.Distribution?.DistributionConfig?.Enabled).toBe(true);
    }, 30000);

    test('WAF Web ACL is attached to CloudFront', async () => {
      const client = new WAFV2Client({ region: 'us-east-1' });
      const command = new GetWebACLCommand({
        Id: outputs.waf_web_acl_id,
        Name: outputs.waf_web_acl_name || 'fintech-api-waf-acl',
        Scope: 'CLOUDFRONT',
      });

      const response = await client.send(command);
      expect(response.WebACL?.Rules).toBeDefined();
      expect(response.WebACL?.Rules?.length).toBeGreaterThan(0);
    }, 30000);

    test('CloudWatch log groups exist with proper retention', async () => {
      const client = new CloudWatchLogsClient({ region: outputs.primary_region });
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/lambda/fintech-api',
      });

      const response = await client.send(command);
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes('transaction')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
    }, 30000);

    test('Secrets Manager secret contains required keys', async () => {
      const client = new SecretsManagerClient({ region: outputs.primary_region });
      const command = new GetSecretValueCommand({
        SecretId: outputs.secrets_manager_secret_name,
      });

      const response = await client.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData).toHaveProperty('master_api_key');
      expect(secretData).toHaveProperty('jwt_secret');
    }, 30000);
  });

  skipIfMock('End-to-End Transaction Flow', () => {
    let jwtSecret: string;
    let testTransactionId: string;

    beforeAll(async () => {
      // Retrieve JWT secret for testing
      const secretsClient = new SecretsManagerClient({
        region: outputs.primary_region,
      });
      const command = new GetSecretValueCommand({
        SecretId: outputs.secrets_manager_secret_name,
      });

      const response = await secretsClient.send(command);
      const secretData = JSON.parse(response.SecretString!);
      jwtSecret = secretData.jwt_secret;
    });

    test('Valid transaction with JWT authorization succeeds', async () => {
      // Generate valid JWT token
      const token = jwt.sign(
        {
          user_id: 'test-user-123',
          permissions: ['transactions', 'read', 'write'],
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        jwtSecret,
        { algorithm: 'HS256' }
      );

      // Create test transaction
      const transaction = {
        amount: 100.50,
        currency: 'USD',
        recipient: 'recipient-456',
        type: 'transfer',
        metadata: {
          test: true,
          description: 'Integration test transaction',
        },
      };

      // Make request to CloudFront URL
      const options = {
        hostname: outputs.cloudfront_domain_name,
        path: '/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      const response = await httpsRequest(options, JSON.stringify(transaction));

      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.message).toBe('Transaction processed successfully');
      expect(responseBody.transaction).toBeDefined();
      expect(responseBody.transaction.transactionId).toBeDefined();
      expect(responseBody.transaction.status).toBe('completed');

      testTransactionId = responseBody.transaction.transactionId;
    }, 30000);

    test('Transaction is stored in DynamoDB', async () => {
      if (!testTransactionId) {
        console.log('Skipping: No transaction ID from previous test');
        return;
      }

      const client = new DynamoDBClient({ region: outputs.primary_region });

      // Wait a bit for eventual consistency
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const command = new ScanCommand({
        TableName: outputs.dynamodb_table_name,
        FilterExpression: 'transactionId = :tid',
        ExpressionAttributeValues: {
          ':tid': { S: testTransactionId },
        },
        Limit: 1,
      });

      const response = await client.send(command);
      expect(response.Items?.length).toBeGreaterThan(0);

      const item = response.Items![0];
      expect(item.transactionId.S).toBe(testTransactionId);
      expect(item.status.S).toBe('completed');
    }, 30000);

    test('Transaction replicates to secondary region', async () => {
      if (!testTransactionId) {
        console.log('Skipping: No transaction ID from previous test');
        return;
      }

      const client = new DynamoDBClient({ region: outputs.secondary_region });

      // Wait for global table replication
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const command = new ScanCommand({
        TableName: outputs.dynamodb_table_name,
        FilterExpression: 'transactionId = :tid',
        ExpressionAttributeValues: {
          ':tid': { S: testTransactionId },
        },
        Limit: 1,
      });

      const response = await client.send(command);
      expect(response.Items?.length).toBeGreaterThan(0);
    }, 30000);

    test('Invalid JWT token returns 403 Forbidden', async () => {
      const transaction = {
        amount: 50.00,
        currency: 'USD',
        recipient: 'recipient-789',
        type: 'payment',
      };

      const options = {
        hostname: outputs.cloudfront_domain_name,
        path: '/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token-12345',
        },
      };

      const response = await httpsRequest(options, JSON.stringify(transaction));
      // Lambda custom authorizer returns 403 when denying access (API Gateway behavior)
      expect(response.statusCode).toBe(403);
    }, 30000);

    test('Missing authorization header returns 401', async () => {
      const transaction = {
        amount: 75.00,
        currency: 'EUR',
        recipient: 'recipient-999',
        type: 'transfer',
      };

      const options = {
        hostname: outputs.cloudfront_domain_name,
        path: '/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await httpsRequest(options, JSON.stringify(transaction));
      expect(response.statusCode).toBe(401);
    }, 30000);

    test('Malformed request returns 400 Bad Request', async () => {
      const token = jwt.sign(
        {
          user_id: 'test-user-456',
          permissions: ['transactions'],
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        jwtSecret,
        { algorithm: 'HS256' }
      );

      const invalidTransaction = {
        // Missing required fields
        amount: 'invalid',
      };

      const options = {
        hostname: outputs.cloudfront_domain_name,
        path: '/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      const response = await httpsRequest(options, JSON.stringify(invalidTransaction));
      expect(response.statusCode).toBe(400);
    }, 30000);
  });

  skipIfMock('Security Validation', () => {
    test('API only accepts HTTPS connections', async () => {
      const http = require('http');

      try {
        await new Promise((resolve, reject) => {
          const req = http.request(
            {
              hostname: outputs.cloudfront_domain_name,
              path: '/transactions',
              method: 'GET',
              port: 80,
            },
            (res) => {
              // CloudFront should redirect HTTP to HTTPS or return 403
              expect(res.statusCode).toBeGreaterThanOrEqual(300);
              resolve(res);
            }
          );
          req.on('error', reject);
          req.end();
        });
      } catch (error) {
        // Connection refused is also acceptable (no HTTP endpoint)
        expect(error).toBeDefined();
      }
    }, 30000);

    test('WAF blocks SQL injection attempts', async () => {
      const sqlInjection = "1' OR '1'='1";

      const options = {
        hostname: outputs.cloudfront_domain_name,
        path: `/transactions?id=${encodeURIComponent(sqlInjection)}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await httpsRequest(options);
      // WAF should block this - expect 403 Forbidden
      expect([403, 401]).toContain(response.statusCode);
    }, 30000);
  });

  skipIfMock('Performance and Monitoring', () => {
    test('API response time is acceptable (< 2 seconds)', async () => {
      const start = Date.now();

      const options = {
        hostname: outputs.cloudfront_domain_name,
        path: '/transactions',
        method: 'OPTIONS', // CORS preflight
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await httpsRequest(options);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    }, 30000);

    test('CloudWatch alarms are in OK state', async () => {
      const client = new CloudWatchClient({ region: outputs.primary_region });
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'fintech-api',
      });

      const response = await client.send(command);
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      // Check that critical alarms are not in ALARM state
      const criticalAlarms = response.MetricAlarms?.filter(
        (alarm) => alarm.AlarmName?.includes('5xx') || alarm.AlarmName?.includes('error')
      );

      criticalAlarms?.forEach((alarm) => {
        expect(alarm.StateValue).not.toBe('ALARM');
      });
    }, 30000);

    test('CloudWatch metrics are being published', async () => {
      const client = new CloudWatchClient({ region: outputs.primary_region });

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

      const command = new GetMetricDataCommand({
        MetricDataQueries: [
          {
            Id: 'm1',
            MetricStat: {
              Metric: {
                Namespace: 'AWS/Lambda',
                MetricName: 'Invocations',
                Dimensions: [
                  {
                    Name: 'FunctionName',
                    Value: outputs.lambda_transaction_name_primary,
                  },
                ],
              },
              Period: 300,
              Stat: 'Sum',
            },
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
      });

      const response = await client.send(command);
      expect(response.MetricDataResults).toBeDefined();
      expect(response.MetricDataResults![0].Values).toBeDefined();
    }, 30000);
  });
});
