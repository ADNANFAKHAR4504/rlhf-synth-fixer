// Configuration - These are coming from cfn-outputs after deployment
import { APIGatewayClient } from '@aws-sdk/client-api-gateway';
import {
  DeleteItemCommand,
  DynamoDBClient,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import axios from 'axios';
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs from deployment (this file is created during deployment)
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found. Taking default.');
  outputs = {
    ApiGatewayInvokeURL:
      'https://x2i3onuwyc.execute-api.us-east-1.amazonaws.com/dev',
    VPCId: 'vpc-00e7208a37a22841a',
    PublicSubnetId: 'subnet-056451dd592cf079a',
    DynamoDBTableName: 'MyCrudTable',
    PrivateSubnetId: 'subnet-04b0001f1d3155144',
  };
}

// Helper function to generate test item
const generateTestItem = (id: string) => ({
  id,
  name: `Test Item ${id}`,
  description: `This is a test item with ID ${id}`,
  category: 'test',
  active: true,
  testTimestamp: new Date().toISOString(),
});

describe('Serverless CRUD API Integration Tests', () => {
  // Skip all tests if outputs are not available (no deployment)
  const hasOutputs = Object.keys(outputs).length > 0;

  if (!hasOutputs) {
    test('No deployment outputs found - skipping integration tests', () => {
      console.log(
        'Integration tests require deployment outputs. Deploy the stack first.'
      );
      expect(true).toBe(true);
    });
    return;
  }

  const apiUrl =
    outputs.ApiGatewayInvokeURL ||
    outputs[`TapStacksynth291875-ApiGatewayInvokeURL`];
  const tableName =
    outputs.DynamoDBTableName ||
    outputs[`TapStacksynth291875-DynamoDBTableName`];

  // AWS Clients (using credentials from environment)
  const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });
  const apiGatewayClient = new APIGatewayClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });
  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  beforeAll(async () => {
    console.log(`Testing API at: ${apiUrl}`);
    console.log(`Using DynamoDB table: ${tableName}`);
  });

  afterAll(async () => {
    // Clean up any test data
    try {
      const scanResult = await dynamoClient.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: 'contains(id, :testPrefix)',
          ExpressionAttributeValues: {
            ':testPrefix': { S: 'test-' },
          },
        })
      );

      if (scanResult.Items) {
        for (const item of scanResult.Items) {
          await dynamoClient.send(
            new DeleteItemCommand({
              TableName: tableName,
              Key: { id: item.id },
            })
          );
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Infrastructure Validation', () => {
    test('should have valid API Gateway URL', () => {
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toMatch(
        /^https:\/\/.*\.execute-api\..*\.amazonaws\.com\//
      );
    });

    test('should have valid DynamoDB table name', () => {
      expect(tableName).toBeDefined();
      expect(tableName).toContain('MyCrudTable');
    });

    test('API Gateway should be accessible', async () => {
      try {
        // Test OPTIONS request (CORS preflight)
        const response = await axios.options(`${apiUrl}/items`, {
          timeout: 5000,
        });
        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe('*');
      } catch (error) {
        console.warn('API Gateway accessibility test failed:', error);
        throw error;
      }
    });

    test('Lambda functions should be deployed and accessible', async () => {
      try {
        const functions = await lambdaClient.send(new ListFunctionsCommand({}));
        const ourFunctions =
          functions.Functions?.filter(f =>
            f.FunctionName?.includes(environmentSuffix)
          ) || [];

        expect(ourFunctions.length).toBeGreaterThan(0);

        // Check for CRUD functions
        const functionNames = ourFunctions.map(f => f.FunctionName);
        expect(functionNames.some(name => name?.includes('create-item'))).toBe(
          true
        );
        expect(functionNames.some(name => name?.includes('get-item'))).toBe(
          true
        );
        expect(functionNames.some(name => name?.includes('update-item'))).toBe(
          true
        );
        expect(functionNames.some(name => name?.includes('delete-item'))).toBe(
          true
        );
      } catch (error) {
        console.warn('Lambda function validation failed:', error);
        throw error;
      }
    }, 10000);
  });

  describe('CRUD Operations - End-to-End', () => {
    const testItemId = `test-${Date.now()}`;
    let createdItem: any;

    test('CREATE: should create a new item via POST /items', async () => {
      const testData = generateTestItem(testItemId);

      const response = await axios.post(`${apiUrl}/items`, testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      expect(response.status).toBe(201);
      expect(response.data.message).toBe('Item created successfully');
      expect(response.data.item.id).toBe(testItemId);
      expect(response.data.item.created_at).toBeDefined();

      createdItem = response.data.item;
    }, 15000);

    test('READ: should retrieve the created item via GET /items/{id}', async () => {
      const response = await axios.get(`${apiUrl}/items/${testItemId}`, {
        timeout: 10000,
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testItemId);
      expect(response.data.name).toBe(`Test Item ${testItemId}`);
      expect(response.data.created_at).toBeDefined();
    }, 15000);

    test('UPDATE: should update the item via PUT /items/{id}', async () => {
      const updateData = {
        name: `Updated Test Item ${testItemId}`,
        description: 'This item has been updated',
        version: 2,
      };

      const response = await axios.put(
        `${apiUrl}/items/${testItemId}`,
        updateData,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Item updated successfully');
      expect(response.data.item.name).toBe(updateData.name);
      expect(response.data.item.version).toBe(2);
      expect(response.data.item.updated_at).toBeDefined();
    }, 15000);

    test('DELETE: should delete the item via DELETE /items/{id}', async () => {
      const response = await axios.delete(`${apiUrl}/items/${testItemId}`, {
        timeout: 10000,
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Item deleted successfully');
      expect(response.data.deleted_item.id).toBe(testItemId);
    }, 15000);

    test('READ after DELETE: should return 404 for deleted item', async () => {
      try {
        await axios.get(`${apiUrl}/items/${testItemId}`, {
          timeout: 10000,
        });
        fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Item not found');
      }
    }, 15000);
  });

  describe('Error Handling', () => {
    test('should return 400 for POST without required fields', async () => {
      try {
        await axios.post(
          `${apiUrl}/items`,
          {},
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
          }
        );
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('required');
      }
    });

    test('should return 404 for GET with non-existent ID', async () => {
      try {
        await axios.get(`${apiUrl}/items/non-existent-id`, {
          timeout: 5000,
        });
        fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Item not found');
      }
    });

    test('should return 400 for PUT without body', async () => {
      try {
        await axios.put(`${apiUrl}/items/some-id`, '', {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        });
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('body');
      }
    });

    test('should return 404 for DELETE with non-existent ID', async () => {
      try {
        await axios.delete(`${apiUrl}/items/non-existent-id`, {
          timeout: 5000,
        });
        fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Item not found');
      }
    });
  });

  describe('CORS Validation', () => {
    test('should handle OPTIONS preflight request for /items', async () => {
      const response = await axios.options(`${apiUrl}/items`, {
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
          Origin: 'http://localhost:3000',
        },
        timeout: 5000,
      });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain(
        'POST'
      );
      expect(response.headers['access-control-allow-headers']).toContain(
        'Content-Type'
      );
    });

    test('should handle OPTIONS preflight request for /items/{id}', async () => {
      const response = await axios.options(`${apiUrl}/items/test-id`, {
        headers: {
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
          Origin: 'http://localhost:3000',
        },
        timeout: 5000,
      });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
      expect(response.headers['access-control-allow-methods']).toContain(
        'DELETE'
      );
    });

    test('All CRUD responses should include CORS headers', async () => {
      const testId = `cors-test-${Date.now()}`;
      const testData = generateTestItem(testId);

      // CREATE
      const createResponse = await axios.post(`${apiUrl}/items`, testData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      expect(createResponse.headers['access-control-allow-origin']).toBe('*');

      // READ
      const getResponse = await axios.get(`${apiUrl}/items/${testId}`, {
        timeout: 5000,
      });
      expect(getResponse.headers['access-control-allow-origin']).toBe('*');

      // UPDATE
      const updateResponse = await axios.put(
        `${apiUrl}/items/${testId}`,
        { name: 'Updated' },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );
      expect(updateResponse.headers['access-control-allow-origin']).toBe('*');

      // DELETE
      const deleteResponse = await axios.delete(`${apiUrl}/items/${testId}`, {
        timeout: 5000,
      });
      expect(deleteResponse.headers['access-control-allow-origin']).toBe('*');
    }, 20000);
  });

  describe('Performance and Reliability', () => {
    test('API should respond within reasonable time limits', async () => {
      const startTime = Date.now();

      await axios.options(`${apiUrl}/items`, { timeout: 3000 });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(3000); // 3 second timeout
    });

    test('should handle concurrent requests', async () => {
      const promises = [];
      const testIds = [];

      // Create 5 items concurrently
      for (let i = 0; i < 5; i++) {
        const testId = `concurrent-test-${Date.now()}-${i}`;
        testIds.push(testId);
        promises.push(
          axios.post(`${apiUrl}/items`, generateTestItem(testId), {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          })
        );
      }

      const responses = await Promise.all(promises);

      // Verify all requests succeeded
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.data.item.id).toBe(testIds[index]);
      });

      // Cleanup
      for (const testId of testIds) {
        try {
          await axios.delete(`${apiUrl}/items/${testId}`, { timeout: 5000 });
        } catch (error) {
          console.warn(`Cleanup failed for ${testId}:`, error);
        }
      }
    }, 30000);
  });

  describe('Data Validation', () => {
    test('should persist data correctly with various data types', async () => {
      const testId = `data-validation-${Date.now()}`;
      const complexData = {
        id: testId,
        stringField: 'test string',
        numberField: 42,
        booleanField: true,
        arrayField: ['item1', 'item2', 'item3'],
        objectField: {
          nested: 'value',
          count: 10,
        },
        nullField: null,
      };

      // Create item
      const createResponse = await axios.post(`${apiUrl}/items`, complexData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      expect(createResponse.status).toBe(201);

      // Retrieve and validate
      const getResponse = await axios.get(`${apiUrl}/items/${testId}`, {
        timeout: 5000,
      });
      const retrievedItem = getResponse.data;

      expect(retrievedItem.stringField).toBe('test string');
      expect(+retrievedItem.numberField).toBe(42);
      expect(retrievedItem.booleanField).toBe(true);
      expect(retrievedItem.arrayField).toEqual(['item1', 'item2', 'item3']);
      expect(retrievedItem.objectField.nested).toBe('value');
      expect(retrievedItem.objectField.count).toBe(10);

      // Cleanup
      await axios.delete(`${apiUrl}/items/${testId}`, { timeout: 5000 });
    }, 15000);
  });
});
