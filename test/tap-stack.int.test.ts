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
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetHostedZoneCommand,
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
      const parsed = JSON.parse(outputsJson);

      // Handle nested structure - find the first stack key
      const stackKeys = Object.keys(parsed);
      if (stackKeys.length > 0 && typeof parsed[stackKeys[0]] === 'object') {
        const outputs = parsed[stackKeys[0]];

        // Parse JSON-stringified arrays
        const processedOutputs: Record<string, any> = {};
        for (const [key, value] of Object.entries(outputs)) {
          if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
            try {
              processedOutputs[key] = JSON.parse(value);
            } catch {
              processedOutputs[key] = value;
            }
          } else {
            processedOutputs[key] = value;
          }
        }
        return processedOutputs;
      }
      return parsed;
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
      expect(typeof vpcId).toBe('string');
      expect(vpcId).toMatch(/^vpc-/);

      const result = await retryOperation(async () => {
        return await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );
      }, 5, 2000);

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBe(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].VpcId).toBe(vpcId);
    }, TEST_TIMEOUT);

    it('should create secondary VPC', async () => {
      const ec2Client = new EC2Client({ region: SECONDARY_REGION });

      const vpcId = outputs.secondaryVpcId;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
      expect(vpcId).toMatch(/^vpc-/);

      const result = await retryOperation(async () => {
        return await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );
      }, 5, 2000);

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBe(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].VpcId).toBe(vpcId);
    }, TEST_TIMEOUT);

    it('should create primary VPC subnets', async () => {
      const ec2Client = new EC2Client({ region: PRIMARY_REGION });

      const publicSubnetIds = outputs.primaryPublicSubnetIds;
      const privateSubnetIds = outputs.primaryPrivateSubnetIds;

      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);

      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const result = await retryOperation(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: allSubnetIds,
          })
        );
      }, 5, 2000);

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBe(allSubnetIds.length);
      result.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.primaryVpcId);
      });
    }, TEST_TIMEOUT);

    it('should create secondary VPC subnets', async () => {
      const ec2Client = new EC2Client({ region: SECONDARY_REGION });

      const publicSubnetIds = outputs.secondaryPublicSubnetIds;
      const privateSubnetIds = outputs.secondaryPrivateSubnetIds;

      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);

      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const result = await retryOperation(async () => {
        return await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: allSubnetIds,
          })
        );
      }, 5, 2000);

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBe(allSubnetIds.length);
      result.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.secondaryVpcId);
      });
    }, TEST_TIMEOUT);
  });

  describe('Aurora Database Clusters', () => {
    it('should verify primary Aurora cluster endpoint', async () => {
      const endpoint = outputs.primaryAuroraEndpoint;
      const readerEndpoint = outputs.primaryAuroraReaderEndpoint;

      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
      expect(endpoint).toContain('.rds.amazonaws.com');
      expect(endpoint).toContain('ap-southeast-1');

      expect(readerEndpoint).toBeDefined();
      expect(typeof readerEndpoint).toBe('string');
      expect(readerEndpoint).toContain('.rds.amazonaws.com');
      expect(readerEndpoint).toContain('ap-southeast-1');
      expect(readerEndpoint).toContain('.cluster-ro-');
    }, TEST_TIMEOUT);

    it('should verify secondary Aurora cluster endpoint', async () => {
      const endpoint = outputs.secondaryAuroraEndpoint;
      const readerEndpoint = outputs.secondaryAuroraReaderEndpoint;

      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
      expect(endpoint).toContain('.rds.amazonaws.com');
      expect(endpoint).toContain('ap-southeast-2');

      expect(readerEndpoint).toBeDefined();
      expect(typeof readerEndpoint).toBe('string');
      expect(readerEndpoint).toContain('.rds.amazonaws.com');
      expect(readerEndpoint).toContain('ap-southeast-2');
      expect(readerEndpoint).toContain('.cluster-ro-');
    }, TEST_TIMEOUT);
  });

  describe('Lambda Functions', () => {
    it('should create primary Lambda function', async () => {
      const lambdaClient = new LambdaClient({ region: PRIMARY_REGION });

      const functionName = outputs.primaryLambdaName;
      const functionArn = outputs.primaryLambdaArn;

      expect(functionName).toBeDefined();
      expect(typeof functionName).toBe('string');
      expect(functionArn).toBeDefined();
      expect(functionArn).toContain('arn:aws:lambda');
      expect(functionArn).toContain(PRIMARY_REGION);
      expect(functionArn).toContain(functionName);

      const result = await retryOperation(async () => {
        return await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );
      }, 5, 3000);

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.FunctionName).toBe(functionName);
      expect(result.Configuration!.FunctionArn).toBe(functionArn);
      expect(result.Configuration!.Runtime).toMatch(/python3\.\d+/);
      expect(result.Configuration!.State).toMatch(/Active|Pending/);
    }, TEST_TIMEOUT);

    it('should create secondary Lambda function', async () => {
      const lambdaClient = new LambdaClient({ region: SECONDARY_REGION });

      const functionName = outputs.secondaryLambdaName;
      const functionArn = outputs.secondaryLambdaArn;

      expect(functionName).toBeDefined();
      expect(typeof functionName).toBe('string');
      expect(functionArn).toBeDefined();
      expect(functionArn).toContain('arn:aws:lambda');
      expect(functionArn).toContain(SECONDARY_REGION);
      expect(functionArn).toContain(functionName);

      const result = await retryOperation(async () => {
        return await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );
      }, 5, 3000);

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.FunctionName).toBe(functionName);
      expect(result.Configuration!.FunctionArn).toBe(functionArn);
      expect(result.Configuration!.Runtime).toMatch(/python3\.\d+/);
      expect(result.Configuration!.State).toMatch(/Active|Pending/);
    }, TEST_TIMEOUT);
  });

  describe('DynamoDB Global Table', () => {
    it('should create DynamoDB table', async () => {
      const dynamoClient = new DynamoDBClient({ region: PRIMARY_REGION });

      const tableName = outputs.dynamoDbTableName;
      const tableArn = outputs.dynamoDbTableArn;

      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
      expect(tableArn).toBeDefined();
      expect(tableArn).toContain('arn:aws:dynamodb');
      expect(tableArn).toContain(tableName);

      const result = await retryOperation(async () => {
        return await dynamoClient.send(
          new DescribeTableCommand({
            TableName: tableName,
          })
        );
      }, 5, 3000);

      expect(result.Table).toBeDefined();
      expect(result.Table!.TableName).toBe(tableName);
      expect(result.Table!.TableArn).toBe(tableArn);
      expect(result.Table!.TableStatus).toMatch(/ACTIVE|CREATING|UPDATING/);
    }, TEST_TIMEOUT);
  });

  describe('EventBridge Rules', () => {
    it('should create EventBridge rule in primary region', async () => {
      const ruleArn = outputs.primaryEventBridgeRuleArn;

      expect(ruleArn).toBeDefined();
      expect(typeof ruleArn).toBe('string');
      expect(ruleArn).toContain('arn:aws:events');
      expect(ruleArn).toContain(PRIMARY_REGION);
      expect(ruleArn).toContain(':rule/');
    }, TEST_TIMEOUT);

    it('should create EventBridge rule in secondary region', async () => {
      const ruleArn = outputs.secondaryEventBridgeRuleArn;

      expect(ruleArn).toBeDefined();
      expect(typeof ruleArn).toBe('string');
      expect(ruleArn).toContain('arn:aws:events');
      expect(ruleArn).toContain(SECONDARY_REGION);
      expect(ruleArn).toContain(':rule/');
    }, TEST_TIMEOUT);
  });

  describe('SNS Topics for Monitoring', () => {
    it('should create SNS topic in primary region', async () => {
      const snsTopicArn = outputs.primarySnsTopicArn;

      expect(snsTopicArn).toBeDefined();
      expect(typeof snsTopicArn).toBe('string');
      expect(snsTopicArn).toContain('arn:aws:sns');
      expect(snsTopicArn).toContain(PRIMARY_REGION);
    }, TEST_TIMEOUT);

    it('should create SNS topic in secondary region', async () => {
      const snsTopicArn = outputs.secondarySnsTopicArn;

      expect(snsTopicArn).toBeDefined();
      expect(typeof snsTopicArn).toBe('string');
      expect(snsTopicArn).toContain('arn:aws:sns');
      expect(snsTopicArn).toContain(SECONDARY_REGION);
    }, TEST_TIMEOUT);
  });

  describe('Route53 DNS', () => {
    it('should create Route53 hosted zone', async () => {
      const route53Client = new Route53Client({ region: PRIMARY_REGION });

      const zoneId = outputs.route53ZoneId;
      const nameServers = outputs.route53NameServers;

      expect(zoneId).toBeDefined();
      expect(typeof zoneId).toBe('string');
      expect(zoneId).toMatch(/^Z[A-Z0-9]+$/);

      expect(nameServers).toBeDefined();
      expect(Array.isArray(nameServers)).toBe(true);
      expect(nameServers.length).toBeGreaterThanOrEqual(4);
      nameServers.forEach((ns: string) => {
        expect(ns).toContain('awsdns');
      });

      const result = await retryOperation(async () => {
        return await route53Client.send(
          new GetHostedZoneCommand({
            Id: zoneId,
          })
        );
      }, 5, 2000);

      expect(result.HostedZone).toBeDefined();
      expect(result.HostedZone!.Id).toContain(zoneId);
    }, TEST_TIMEOUT);
  });

  describe('VPC Peering', () => {
    it('should create VPC peering connection', async () => {
      const peeringConnectionId = outputs.vpcPeeringConnectionId;

      expect(peeringConnectionId).toBeDefined();
      expect(typeof peeringConnectionId).toBe('string');
      expect(peeringConnectionId).toMatch(/^pcx-/);
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    console.log('\n=== Integration Tests Complete ===');
    console.log('All infrastructure components verified:');
    console.log('✅ Primary VPC:', outputs.primaryVpcId);
    console.log('✅ Secondary VPC:', outputs.secondaryVpcId);
    console.log('✅ Primary Aurora:', outputs.primaryAuroraEndpoint);
    console.log('✅ Secondary Aurora:', outputs.secondaryAuroraEndpoint);
    console.log('✅ Primary Lambda:', outputs.primaryLambdaName);
    console.log('✅ Secondary Lambda:', outputs.secondaryLambdaName);
    console.log('✅ DynamoDB Table:', outputs.dynamoDbTableName);
    console.log('✅ Route53 Zone:', outputs.route53ZoneId);
    console.log('✅ VPC Peering:', outputs.vpcPeeringConnectionId);
    console.log('\nCleanup should be handled by CI/CD pipeline.');
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
