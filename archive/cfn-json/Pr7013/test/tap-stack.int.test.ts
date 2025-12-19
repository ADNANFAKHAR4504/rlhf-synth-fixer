/**
 * Integration tests for TAP Stack CloudFormation deployment.
 * Tests actual deployed DynamoDB table using CloudFormation stack outputs.
 */
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Deployment', () => {
  let outputs: any;
  let dynamodbClient: DynamoDBClient;

  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load stack outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please ensure deployment has completed.`
      );
    }
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS SDK clients
    dynamodbClient = new DynamoDBClient({ region });
  });

  afterAll(() => {
    // Clean up clients
    if (dynamodbClient) {
      dynamodbClient.destroy();
    }
  });

  describe('Deployment Outputs', () => {
    test('should have outputs file with content', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have TurnAroundPromptTableName output', () => {
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableName.length).toBeGreaterThan(0);
    });

    test('should have TurnAroundPromptTableArn output', () => {
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toMatch(/^arn:aws:dynamodb:/);
    });

    test('should have EnvironmentSuffix output', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix.length).toBeGreaterThan(0);
    });

    test('should have StackName output', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName.length).toBeGreaterThan(0);
    });

    test('should have table name with environment suffix', () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const envSuffix = outputs.EnvironmentSuffix;
      expect(tableName).toContain(envSuffix);
    });

    test('should have stack name with environment suffix', () => {
      const stackName = outputs.StackName;
      const envSuffix = outputs.EnvironmentSuffix;
      expect(stackName).toContain(envSuffix);
    });

    test('should have table ARN matching table name', () => {
      const tableArn = outputs.TurnAroundPromptTableArn;
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableArn).toContain(tableName);
    });
  });

  describe('DynamoDB Table', () => {
    let table: any;

    beforeAll(async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });
      const response = await dynamodbClient.send(command);
      table = response.Table;
    });

    test('should exist and be accessible', () => {
      expect(table).toBeDefined();
      expect(table.TableName).toBeDefined();
    });

    test('should be active', () => {
      expect(table.TableStatus).toBe('ACTIVE');
    });

    test('should have correct table name', () => {
      expect(table.TableName).toBe(outputs.TurnAroundPromptTableName);
    });

    test('should have correct ARN', () => {
      expect(table.TableArn).toBe(outputs.TurnAroundPromptTableArn);
    });

    test('should have key schema defined', () => {
      expect(table.KeySchema).toBeDefined();
      expect(table.KeySchema.length).toBeGreaterThan(0);
    });

    test('should have id as partition key', () => {
      const partitionKey = table.KeySchema.find(
        (key: any) => key.KeyType === 'HASH'
      );
      expect(partitionKey).toBeDefined();
      expect(partitionKey.AttributeName).toBe('id');
    });

    test('should have attribute definitions', () => {
      expect(table.AttributeDefinitions).toBeDefined();
      expect(table.AttributeDefinitions.length).toBeGreaterThan(0);
    });

    test('should have id attribute as string type', () => {
      const idAttr = table.AttributeDefinitions.find(
        (attr: any) => attr.AttributeName === 'id'
      );
      expect(idAttr).toBeDefined();
      expect(idAttr.AttributeType).toBe('S');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(table.BillingModeSummary).toBeDefined();
      expect(table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have creation date', () => {
      expect(table.CreationDateTime).toBeDefined();
      expect(table.CreationDateTime).toBeInstanceOf(Date);
    });

    test('should have table size information', () => {
      expect(table.TableSizeBytes).toBeDefined();
      expect(typeof table.TableSizeBytes).toBe('number');
      expect(table.TableSizeBytes).toBeGreaterThanOrEqual(0);
    });

    test('should have item count', () => {
      expect(table.ItemCount).toBeDefined();
      expect(typeof table.ItemCount).toBe('number');
      expect(table.ItemCount).toBeGreaterThanOrEqual(0);
    });

    test('should have table ID', () => {
      expect(table.TableId).toBeDefined();
      expect(table.TableId.length).toBeGreaterThan(0);
    });

    test('should be in the correct region', () => {
      expect(table.TableArn).toContain(region);
    });
  });

  describe('Table Configuration', () => {
    let table: any;

    beforeAll(async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });
      const response = await dynamodbClient.send(command);
      table = response.Table;
    });

    test('should not have provisioned throughput', () => {
      // When using PAY_PER_REQUEST, throughput should be 0 or not set
      if (table.ProvisionedThroughput) {
        expect(table.ProvisionedThroughput.ReadCapacityUnits).toBe(0);
        expect(table.ProvisionedThroughput.WriteCapacityUnits).toBe(0);
      }
    });

    test('should have stream specification if enabled', () => {
      // If streams are enabled, check configuration
      if (table.StreamSpecification) {
        expect(table.StreamSpecification.StreamEnabled).toBeDefined();
      }
    });

    test('should have deletion protection status', () => {
      expect(table.DeletionProtectionEnabled).toBeDefined();
      expect(typeof table.DeletionProtectionEnabled).toBe('boolean');
    });

    test('should have table class information', () => {
      if (table.TableClassSummary) {
        expect(table.TableClassSummary.TableClass).toBeDefined();
        expect(['STANDARD', 'STANDARD_INFREQUENT_ACCESS']).toContain(
          table.TableClassSummary.TableClass
        );
      }
    });
  });

  describe('Environment Configuration', () => {
    test('should have environment suffix in outputs', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(typeof outputs.EnvironmentSuffix).toBe('string');
    });

    test('should have consistent environment suffix across resources', () => {
      const envSuffix = outputs.EnvironmentSuffix;
      expect(outputs.TurnAroundPromptTableName).toContain(envSuffix);
      expect(outputs.StackName).toContain(envSuffix);
    });

    test('should have valid environment suffix format', () => {
      const envSuffix = outputs.EnvironmentSuffix;
      // Should be alphanumeric
      expect(envSuffix).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe('Stack Information', () => {
    test('should have stack name output', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toMatch(/^TapStack/);
    });

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'EnvironmentSuffix',
        'StackName',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
      });
    });

    test('should have exactly four outputs', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBe(4);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('should follow naming pattern for table', () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toMatch(/^TurnAroundPromptTable[a-zA-Z0-9]+$/);
    });

    test('should follow naming pattern for stack', () => {
      const stackName = outputs.StackName;
      expect(stackName).toMatch(/^TapStack[a-zA-Z0-9]+$/);
    });

    test('should have consistent suffix usage', () => {
      const envSuffix = outputs.EnvironmentSuffix;
      const tableName = outputs.TurnAroundPromptTableName;
      const stackName = outputs.StackName;

      expect(tableName.endsWith(envSuffix)).toBe(true);
      expect(stackName.endsWith(envSuffix)).toBe(true);
    });
  });

  describe('AWS Account and Region', () => {
    test('should have table in correct region', () => {
      const tableArn = outputs.TurnAroundPromptTableArn;
      expect(tableArn).toContain(`:${region}:`);
    });

    test('should have valid AWS account ID in ARN', () => {
      const tableArn = outputs.TurnAroundPromptTableArn;
      // ARN format: arn:aws:dynamodb:region:account-id:table/table-name
      const arnParts = tableArn.split(':');
      expect(arnParts.length).toBeGreaterThanOrEqual(6);
      expect(arnParts[0]).toBe('arn');
      expect(arnParts[1]).toBe('aws');
      expect(arnParts[2]).toBe('dynamodb');
      expect(arnParts[3]).toBe(region);
      // Account ID should be numeric
      expect(arnParts[4]).toMatch(/^\d+$/);
    });
  });

  describe('Table Performance and Limits', () => {
    let table: any;

    beforeAll(async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });
      const response = await dynamodbClient.send(command);
      table = response.Table;
    });

    test('should have valid table size', () => {
      expect(table.TableSizeBytes).toBeDefined();
      expect(table.TableSizeBytes).toBeGreaterThanOrEqual(0);
      // Table size should be reasonable (less than 10GB for test)
      expect(table.TableSizeBytes).toBeLessThan(10 * 1024 * 1024 * 1024);
    });

    test('should have reasonable item count', () => {
      expect(table.ItemCount).toBeDefined();
      expect(table.ItemCount).toBeGreaterThanOrEqual(0);
      // Item count should be reasonable for test environment
      expect(table.ItemCount).toBeLessThan(1000000);
    });
  });
});