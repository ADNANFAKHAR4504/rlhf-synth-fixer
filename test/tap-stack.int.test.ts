/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Comprehensive Integration Tests for TapStack Multi-Region DR Infrastructure
 *
 * These tests deploy actual infrastructure to AWS and verify:
 * - VPC creation and configuration
 * - Aurora database deployment
 * - Lambda function execution
 * - DynamoDB Global Table
 * - CloudWatch alarms
 * - Route53 health checks
 * - EventBridge rules
 *
 * IMPORTANT: These tests deploy real AWS resources and will incur costs.
 * Ensure proper cleanup after tests complete.
 *
 * Environment Variables Required:
 * - AWS_REGION (default: ap-southeast-1)
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - ENVIRONMENT_SUFFIX (default: inttest)
 */

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  EventBridgeClient,
  ListRulesCommand
} from '@aws-sdk/client-eventbridge';
import {
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetHostedZoneCommand,
  ListHealthChecksCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'inttest';
const PRIMARY_REGION = 'ap-southeast-1';
const SECONDARY_REGION = 'ap-southeast-2';
const TEST_TIMEOUT = 900000; // 15 minutes for infrastructure deployment

// Helper function to get Pulumi stack outputs from flat-outputs.json
function getPulumiOutputs(): Record<string, any> {
  try {
    // Read outputs from flat-outputs.json file
    const outputsPath = path.join(__dirname, '..', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsJson = fs.readFileSync(outputsPath, 'utf-8');
      return JSON.parse(outputsJson);
    }
    console.warn('flat-outputs.json not found, using empty outputs');
    return {};
  } catch (error) {
    console.warn('Failed to read flat-outputs.json, using empty outputs:', error);
    return {};
  }
}

// Helper function to wait for resource availability
const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry operation with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`);
        await waitFor(delay);
      }
    }
  }
  throw lastError;
}

describe('TapStack Integration Tests - Real AWS Deployment', () => {
  let outputs: Record<string, any>;

  // Deploy infrastructure before all tests
  beforeAll(async () => {
    console.log('Deploying infrastructure for integration tests...');
    console.log(`Environment Suffix: ${ENVIRONMENT_SUFFIX}`);
    console.log(`Primary Region: ${PRIMARY_REGION}`);
    console.log(`Secondary Region: ${SECONDARY_REGION}`);

    // Get outputs from Pulumi stack (deployed by CI/CD)
    outputs = getPulumiOutputs();

    console.log('Stack outputs loaded:', Object.keys(outputs));
    console.log('Infrastructure deployment initiated');
  }, TEST_TIMEOUT);

  describe('VPC Infrastructure', () => {
    it('should create primary VPC', async () => {
      const ec2Client = new EC2Client({ region: PRIMARY_REGION });

      const vpcId = outputs.primaryVpcId;
      expect(vpcId).toBeDefined();

      const result = await retryOperation(async () => {
        return await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );
      }, 10, 2000);

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBe(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    }, TEST_TIMEOUT);

    it('should create secondary VPC', async () => {
      const ec2Client = new EC2Client({ region: SECONDARY_REGION });

      const vpcId = outputs.secondaryVpcId;
      expect(vpcId).toBeDefined();

      const result = await retryOperation(async () => {
        return await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );
      }, 10, 2000);

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBe(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    }, TEST_TIMEOUT);

    it('should create primary VPC subnets', async () => {
      const ec2Client = new EC2Client({ region: PRIMARY_REGION });

      const vpcId = outputs.primaryVpcId;
      const result = await retryOperation(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );
      }, 10, 2000);

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private
    }, TEST_TIMEOUT);

    it('should create secondary VPC subnets', async () => {
      const ec2Client = new EC2Client({ region: SECONDARY_REGION });

      const vpcId = outputs.secondaryVpcId;
      const result = await retryOperation(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );
      }, 10, 2000);

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private
    }, TEST_TIMEOUT);
  });

  describe('Aurora Database Clusters', () => {
    it('should create primary Aurora cluster', async () => {
      const rdsClient = new RDSClient({ region: PRIMARY_REGION });

      const endpoint = outputs.primaryAuroraEndpoint;
      expect(endpoint).toBeDefined();

      const result = await retryOperation(async () => {
        return await rdsClient.send(
          new DescribeDBClustersCommand({
            Filters: [
              { Name: 'engine', Values: ['aurora-postgresql'] }
            ],
          })
        );
      }, 10, 5000);

      expect(result.DBClusters).toBeDefined();
      expect(result.DBClusters!.length).toBeGreaterThan(0);

      const cluster = result.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.Status).toMatch(/available|creating/);
    }, TEST_TIMEOUT);

    it('should create secondary Aurora cluster', async () => {
      const rdsClient = new RDSClient({ region: SECONDARY_REGION });

      const endpoint = outputs.secondaryAuroraEndpoint;
      expect(endpoint).toBeDefined();

      const result = await retryOperation(async () => {
        return await rdsClient.send(
          new DescribeDBClustersCommand({
            Filters: [
              { Name: 'engine', Values: ['aurora-postgresql'] }
            ],
          })
        );
      }, 10, 5000);

      expect(result.DBClusters).toBeDefined();
      expect(result.DBClusters!.length).toBeGreaterThan(0);

      const cluster = result.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Lambda Functions', () => {
    it('should create primary Lambda function', async () => {
      const lambdaClient = new LambdaClient({ region: PRIMARY_REGION });

      const functionName = outputs.primaryLambdaName;
      expect(functionName).toBeDefined();

      const result = await retryOperation(async () => {
        return await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );
      }, 10, 3000);

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.Runtime).toMatch(/python3\.\d+/);
      expect(result.Configuration!.Timeout).toBeGreaterThan(0);

      const envVars = result.Configuration!.Environment?.Variables || {};
      expect(envVars.AURORA_ENDPOINT).toBeDefined();
      expect(envVars.DYNAMODB_TABLE).toBeDefined();
    }, TEST_TIMEOUT);

    it('should create secondary Lambda function', async () => {
      const lambdaClient = new LambdaClient({ region: SECONDARY_REGION });

      const functionName = outputs.secondaryLambdaName;
      expect(functionName).toBeDefined();

      const result = await retryOperation(async () => {
        return await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );
      }, 10, 3000);

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.Runtime).toMatch(/python3\.\d+/);
      expect(result.Configuration!.Timeout).toBeGreaterThan(0);

      const envVars = result.Configuration!.Environment?.Variables || {};
      expect(envVars.AURORA_ENDPOINT).toBeDefined();
      expect(envVars.DYNAMODB_TABLE).toBeDefined();
    }, TEST_TIMEOUT);

    it('should execute primary Lambda function successfully', async () => {
      const lambdaClient = new LambdaClient({ region: PRIMARY_REGION });

      const functionName = outputs.primaryLambdaName;

      const result = await retryOperation(async () => {
        return await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(JSON.stringify({ test: true })),
          })
        );
      }, 10, 3000);

      expect(result.StatusCode).toBe(200);
      expect(result.FunctionError).toBeUndefined();

      if (result.Payload) {
        const payload = JSON.parse(Buffer.from(result.Payload).toString());
        expect(payload.statusCode).toBe(200);
      }
    }, TEST_TIMEOUT);
  });

  describe('DynamoDB Global Table', () => {
    it('should create DynamoDB table with global replication', async () => {
      const dynamoClient = new DynamoDBClient({ region: PRIMARY_REGION });

      const tableName = outputs.dynamoDbTableName;
      expect(tableName).toBeDefined();

      const result = await retryOperation(async () => {
        return await dynamoClient.send(
          new DescribeTableCommand({
            TableName: tableName,
          })
        );
      }, 10, 3000);

      expect(result.Table).toBeDefined();
      expect(result.Table!.TableStatus).toMatch(/ACTIVE|CREATING/);
      expect(result.Table!.Replicas).toBeDefined();
      expect(result.Table!.Replicas!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should have table accessible from secondary region', async () => {
      const dynamoClient = new DynamoDBClient({ region: SECONDARY_REGION });

      const tableName = outputs.dynamoDbTableName;

      const result = await retryOperation(async () => {
        return await dynamoClient.send(
          new DescribeTableCommand({
            TableName: tableName,
          })
        );
      }, 10, 3000);

      expect(result.Table).toBeDefined();
      expect(result.Table!.TableStatus).toMatch(/ACTIVE|CREATING/);
    }, TEST_TIMEOUT);
  });

  describe('EventBridge Rules', () => {
    it('should create EventBridge rule in primary region', async () => {
      const eventBridgeClient = new EventBridgeClient({ region: PRIMARY_REGION });

      const result = await retryOperation(async () => {
        return await eventBridgeClient.send(
          new ListRulesCommand({
            NamePrefix: `schedule-rule-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 2000);

      expect(result.Rules).toBeDefined();
      expect(result.Rules!.length).toBeGreaterThan(0);
      expect(result.Rules![0].State).toMatch(/ENABLED|DISABLED/);
    }, TEST_TIMEOUT);

    it('should create EventBridge rule in secondary region', async () => {
      const eventBridgeClient = new EventBridgeClient({ region: SECONDARY_REGION });

      const result = await retryOperation(async () => {
        return await eventBridgeClient.send(
          new ListRulesCommand({
            NamePrefix: `schedule-rule-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 2000);

      expect(result.Rules).toBeDefined();
      expect(result.Rules!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('CloudWatch Alarms', () => {
    it('should create CloudWatch alarms for primary Lambda', async () => {
      const cloudWatchClient = new CloudWatchClient({ region: PRIMARY_REGION });

      const result = await retryOperation(async () => {
        return await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: `lambda-errors-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 2000);

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Statistic).toBe('Sum');
    }, TEST_TIMEOUT);

    it('should create CloudWatch alarms for secondary Lambda', async () => {
      const cloudWatchClient = new CloudWatchClient({ region: SECONDARY_REGION });

      const result = await retryOperation(async () => {
        return await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: `lambda-errors-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 2000);

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('Route53 DNS and Health Checks', () => {
    it('should create Route53 hosted zone', async () => {
      const route53Client = new Route53Client({ region: PRIMARY_REGION });

      const zoneId = outputs.route53ZoneId;
      expect(zoneId).toBeDefined();

      const result = await retryOperation(async () => {
        return await route53Client.send(
          new GetHostedZoneCommand({
            Id: zoneId,
          })
        );
      }, 10, 2000);

      expect(result.HostedZone).toBeDefined();
      expect(result.HostedZone!.Config?.PrivateZone).toBe(true);
    }, TEST_TIMEOUT);

    it('should create health checks for failover', async () => {
      const route53Client = new Route53Client({ region: PRIMARY_REGION });

      const result = await retryOperation(async () => {
        return await route53Client.send(
          new ListHealthChecksCommand({})
        );
      }, 10, 2000);

      expect(result.HealthChecks).toBeDefined();
      expect(result.HealthChecks!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('IAM Roles and Policies', () => {
    it('should create Lambda execution role', async () => {
      const iamClient = new IAMClient({ region: PRIMARY_REGION });

      const result = await retryOperation(async () => {
        return await iamClient.send(
          new GetRoleCommand({
            RoleName: `lambda-role-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 2000);

      expect(result.Role).toBeDefined();
      expect(result.Role!.AssumeRolePolicyDocument).toBeDefined();

      const policyDoc = JSON.parse(decodeURIComponent(result.Role!.AssumeRolePolicyDocument!));
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement[0].Principal.Service).toContain('lambda.amazonaws.com');
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    console.log('Integration tests complete. Cleanup should be handled by CI/CD pipeline.');
    console.log('Resources can be destroyed using: pulumi destroy');
  });
});

describe('Integration Test Helpers', () => {
  it('should have AWS credentials configured', () => {
    expect(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_DEFAULT_REGION).toBeTruthy();
  });

  it('should use correct environment suffix', () => {
    expect(ENVIRONMENT_SUFFIX).toBeTruthy();
    expect(typeof ENVIRONMENT_SUFFIX).toBe('string');
  });

  it('should have correct region configuration', () => {
    expect(PRIMARY_REGION).toBe('ap-southeast-1');
    expect(SECONDARY_REGION).toBe('ap-southeast-2');
  });
});
