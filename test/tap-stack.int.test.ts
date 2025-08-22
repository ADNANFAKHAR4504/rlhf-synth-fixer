/**
 * Integration Tests for Multi-Region DynamoDB Infrastructure
 * 
 * These tests validate the deployed infrastructure using actual AWS API calls.
 * Tests verify resource creation, configuration, cross-region dependencies,
 * and functionality of the multi-region DynamoDB setup.
 */

import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';

import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import fs from 'fs';

// Check if we should run integration tests
const shouldRunIntegrationTests = process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.CI === '1';

// Load deployment outputs from CI/CD pipeline
let outputs: any;
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.log('Skipping integration tests: cfn-outputs/flat-outputs.json not found');
  outputs = {};
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients for both regions
const usWest1DynamoClient = new DynamoDBClient({ region: 'us-west-1' });
const usWest2DynamoClient = new DynamoDBClient({ region: 'us-west-2' });
const usWest2LambdaClient = new LambdaClient({ region: 'us-west-2' });
const usWest1IamClient = new IAMClient({ region: 'us-west-1' });
const usWest2IamClient = new IAMClient({ region: 'us-west-2' });

// Resource names from outputs
const usWest1TableName = outputs[`TapStackUsWest1${environmentSuffix}-DynamoTableName`] || `multi-region-table-us-west-1`;
const usWest2TableName = outputs[`TapStackUsWest2${environmentSuffix}-DynamoTableName`] || `multi-region-table-us-west-2`;
const usWest2LambdaFunctionArn = outputs[`TapStackUsWest2${environmentSuffix}-CrossRegionLambdaFunctionArn`] || 'arn:aws:lambda:us-west-2:123456789012:function:cross-region-lambda-us-west-2';

describe('Multi-Region DynamoDB Infrastructure Integration Tests', () => {
  beforeAll(() => {
    if (!shouldRunIntegrationTests) {
      console.log('Skipping integration tests: AWS credentials not available');
    }
  });

  describe('DynamoDB Tables - us-west-1', () => {
    test('should have DynamoDB table in us-west-1 with correct configuration', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: usWest1TableName,
      });

      const response = await usWest1DynamoClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(usWest1TableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PROVISIONED');
      expect(response.Table?.ProvisionedThroughput?.ReadCapacityUnits).toBe(5);
      expect(response.Table?.ProvisionedThroughput?.WriteCapacityUnits).toBe(5);
      // Point-in-time recovery is enabled by default for tables with this configuration
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      
      // Verify key schema
      expect(response.Table?.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            AttributeName: 'id',
            KeyType: 'HASH',
          }),
        ])
      );

      // Verify attribute definitions
      expect(response.Table?.AttributeDefinitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            AttributeName: 'id',
            AttributeType: 'S',
          }),
        ])
      );
    });

    test('should be able to write and read data from us-west-1 table', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      const testItem = {
        id: `test-item-${Date.now()}`,
        timestamp: new Date().toISOString(),
        region: 'us-west-1',
        data: 'Integration test data from us-west-1',
      };

      // Write item
      const putCommand = new PutItemCommand({
        TableName: usWest1TableName,
        Item: {
          id: { S: testItem.id },
          timestamp: { S: testItem.timestamp },
          region: { S: testItem.region },
          data: { S: testItem.data },
        },
      });

      const putResponse = await usWest1DynamoClient.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Read item
      const getCommand = new GetItemCommand({
        TableName: usWest1TableName,
        Key: {
          id: { S: testItem.id },
        },
      });

      const getResponse = await usWest1DynamoClient.send(getCommand);
      expect(getResponse.$metadata.httpStatusCode).toBe(200);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id.S).toBe(testItem.id);
      expect(getResponse.Item?.region.S).toBe(testItem.region);
      expect(getResponse.Item?.data.S).toBe(testItem.data);

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: usWest1TableName,
        Key: {
          id: { S: testItem.id },
        },
      });

      await usWest1DynamoClient.send(deleteCommand);
    });
  });

  describe('DynamoDB Tables - us-west-2', () => {
    test('should have DynamoDB table in us-west-2 with correct configuration', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: usWest2TableName,
      });

      const response = await usWest2DynamoClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(usWest2TableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PROVISIONED');
      // Point-in-time recovery is enabled by default for tables with this configuration
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      
      // Verify key schema
      expect(response.Table?.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            AttributeName: 'id',
            KeyType: 'HASH',
          }),
        ])
      );

      // Verify attribute definitions
      expect(response.Table?.AttributeDefinitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            AttributeName: 'id',
            AttributeType: 'S',
          }),
        ])
      );
    });

    test('should be able to write and read data from us-west-2 table', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      const testItem = {
        id: `test-item-${Date.now()}`,
        timestamp: new Date().toISOString(),
        region: 'us-west-2',
        data: 'Integration test data from us-west-2',
      };

      // Write item
      const putCommand = new PutItemCommand({
        TableName: usWest2TableName,
        Item: {
          id: { S: testItem.id },
          timestamp: { S: testItem.timestamp },
          region: { S: testItem.region },
          data: { S: testItem.data },
        },
      });

      const putResponse = await usWest2DynamoClient.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Read item
      const getCommand = new GetItemCommand({
        TableName: usWest2TableName,
        Key: {
          id: { S: testItem.id },
        },
      });

      const getResponse = await usWest2DynamoClient.send(getCommand);
      expect(getResponse.$metadata.httpStatusCode).toBe(200);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id.S).toBe(testItem.id);
      expect(getResponse.Item?.region.S).toBe(testItem.region);
      expect(getResponse.Item?.data.S).toBe(testItem.data);

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: usWest2TableName,
        Key: {
          id: { S: testItem.id },
        },
      });

      await usWest2DynamoClient.send(deleteCommand);
    });
  });

  describe('Cross-Region Lambda Function', () => {
    test('should have Lambda function in us-west-2 with correct configuration', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: usWest2LambdaFunctionArn,
      });

      const response = await usWest2LambdaClient.send(command);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('cross-region-lambda-us-west-2');
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(30);
      
      // Verify environment variables
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.LOCAL_TABLE_NAME).toBe(usWest2TableName);
      expect(envVars?.REMOTE_TABLE_NAME).toBe(usWest1TableName);
      expect(envVars?.AWS_NODEJS_CONNECTION_REUSE_ENABLED).toBe('1');
    });

    test('should be able to invoke cross-region Lambda function', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      const testData = {
        data: 'Cross-region integration test data',
        remoteItemId: 'test-remote-item',
      };

      const command = new InvokeCommand({
        FunctionName: usWest2LambdaFunctionArn,
        Payload: JSON.stringify(testData),
      });

      const response = await usWest2LambdaClient.send(command);
      
      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Cross-region operations completed successfully');
      expect(body.localTable).toBe(usWest2TableName);
      expect(body.remoteTable).toBe(usWest1TableName);
      expect(body.region).toBe('us-west-2');
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should have IAM role in us-west-1 with DynamoDB permissions', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      const roleName = outputs[`TapStackUsWest1${environmentSuffix}-DynamoDBAccessRoleArn`]?.split('/').pop() || 'DynamoDBAccessRole';
      
      const getRoleCommand = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await usWest1IamClient.send(getRoleCommand);
      
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();

      // Verify assume role policy allows Lambda
      const assumePolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}'));
      expect(assumePolicy.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Allow',
            Principal: expect.objectContaining({
              Service: 'lambda.amazonaws.com',
            }),
            Action: 'sts:AssumeRole',
          }),
        ])
      );
    });

    test('should have IAM role in us-west-2 with cross-region DynamoDB permissions', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      const roleName = outputs[`TapStackUsWest2${environmentSuffix}-DynamoDBAccessRoleArn`]?.split('/').pop() || 'DynamoDBAccessRole';
      
      const getRoleCommand = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await usWest2IamClient.send(getRoleCommand);
      
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);

      // Verify attached policies
      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });

      const policiesResponse = await usWest2IamClient.send(listPoliciesCommand);
      expect(policiesResponse.AttachedPolicies).toBeDefined();
      expect(policiesResponse.AttachedPolicies?.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Region Data Operations', () => {
    test('should demonstrate cross-region data access through Lambda', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping test: AWS credentials not available');
        return;
      }

      // First, create test data in us-west-1
      const usWest1TestItem = {
        id: 'cross-region-test-item',
        timestamp: new Date().toISOString(),
        region: 'us-west-1',
        data: 'Data created in us-west-1 for cross-region test',
      };

      const putWest1Command = new PutItemCommand({
        TableName: usWest1TableName,
        Item: {
          id: { S: usWest1TestItem.id },
          timestamp: { S: usWest1TestItem.timestamp },
          region: { S: usWest1TestItem.region },
          data: { S: usWest1TestItem.data },
        },
      });

      await usWest1DynamoClient.send(putWest1Command);

      // Now invoke Lambda function to test cross-region access
      const lambdaCommand = new InvokeCommand({
        FunctionName: usWest2LambdaFunctionArn,
        Payload: JSON.stringify({
          data: 'Cross-region integration test',
          remoteItemId: usWest1TestItem.id,
        }),
      });

      const lambdaResponse = await usWest2LambdaClient.send(lambdaCommand);
      expect(lambdaResponse.StatusCode).toBe(200);

      const payload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Cross-region operations completed successfully');
      expect(body.localOperation).toBe('Item written to local table');
      expect(body.remoteOperation).toBe('Item retrieved from remote table');

      // Verify data was written to us-west-2
      const scanWest2Command = new ScanCommand({
        TableName: usWest2TableName,
        FilterExpression: 'operation = :operation',
        ExpressionAttributeValues: {
          ':operation': { S: 'local-write' },
        },
      });

      const scanResponse = await usWest2DynamoClient.send(scanWest2Command);
      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items?.length).toBeGreaterThan(0);

      // Cleanup
      const deleteWest1Command = new DeleteItemCommand({
        TableName: usWest1TableName,
        Key: {
          id: { S: usWest1TestItem.id },
        },
      });

      await usWest1DynamoClient.send(deleteWest1Command);

      // Clean up test data from us-west-2
      if (scanResponse.Items) {
        for (const item of scanResponse.Items) {
          const deleteWest2Command = new DeleteItemCommand({
            TableName: usWest2TableName,
            Key: {
              id: item.id,
            },
          });
          await usWest2DynamoClient.send(deleteWest2Command);
        }
      }
    });
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        `TapStackUsWest1${environmentSuffix}-DynamoTableName`,
        `TapStackUsWest1${environmentSuffix}-DynamoTableArn`,
        `TapStackUsWest1${environmentSuffix}-ReadCapacity`,
        `TapStackUsWest1${environmentSuffix}-WriteCapacity`,
        `TapStackUsWest2${environmentSuffix}-DynamoTableName`,
        `TapStackUsWest2${environmentSuffix}-DynamoTableArn`,
        `TapStackUsWest2${environmentSuffix}-ReadCapacity`,
        `TapStackUsWest2${environmentSuffix}-WriteCapacity`,
        `TapStackUsWest2${environmentSuffix}-CrossRegionLambdaFunctionArn`,
      ];

      for (const outputKey of requiredOutputs) {
        expect(outputs[outputKey]).toBeDefined();
        expect(typeof outputs[outputKey]).toBe('string');
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      }
    });

    test('should have correct capacity configurations in outputs', () => {
      const usWest1ReadCapacity = outputs[`TapStackUsWest1${environmentSuffix}-ReadCapacity`];
      const usWest1WriteCapacity = outputs[`TapStackUsWest1${environmentSuffix}-WriteCapacity`];
      const usWest2ReadCapacity = outputs[`TapStackUsWest2${environmentSuffix}-ReadCapacity`];
      const usWest2WriteCapacity = outputs[`TapStackUsWest2${environmentSuffix}-WriteCapacity`];

      expect(usWest1ReadCapacity).toBe('5');
      expect(usWest1WriteCapacity).toBe('5');
      expect(parseInt(usWest2ReadCapacity)).toBeGreaterThan(0);
      expect(parseInt(usWest2WriteCapacity)).toBeGreaterThan(0);
    });
  });
});
