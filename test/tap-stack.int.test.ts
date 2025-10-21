// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import axios from 'axios';
import fs from 'fs';

// Read outputs from deployed stack - required for live testing
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Live AWS resource configurations
const apiEndpoint = outputs.ApiEndpoint;
const dynamoTableName = outputs.DynamoTableName;
const lambdaFunctionName = outputs.LambdaFunctionName;

// AWS SDK clients for direct resource testing
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });

// Test data
const testItemId = `test-item-${Date.now()}`;
const testItem = {
  id: testItemId,
  name: 'Integration Test Item',
  description: 'Created by integration tests',
  createdAt: new Date().toISOString(),
};

describe('Turn Around Prompt API Integration Tests - Live AWS Resources', () => {
  beforeAll(async () => {
    // Verify required outputs exist
    expect(apiEndpoint).toBeDefined();
    expect(apiEndpoint).toMatch(
      /^https:\/\/.*\.execute-api\.us-east-1\.amazonaws\.com/
    );
    expect(dynamoTableName).toBeDefined();
    expect(dynamoTableName).toMatch(/^tap-api-items-/);
    expect(lambdaFunctionName).toBeDefined();
    expect(lambdaFunctionName).toMatch(/^tap-api-function-/);

    // Verify all resources use environment suffix
    expect(dynamoTableName).toContain(environmentSuffix);
    expect(lambdaFunctionName).toContain(environmentSuffix);
    expect(apiEndpoint).toMatch(new RegExp(environmentSuffix));
  });

  describe('API Gateway Endpoints - Live HTTP Testing', () => {
    test('GET /items should return success response', async () => {
      const response = await axios.get(`${apiEndpoint}/items`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('object');
      expect(response.data).toHaveProperty('message');
    }, 30000);

    test('POST /items should create new item via API Gateway', async () => {
      const response = await axios.post(`${apiEndpoint}/items`, testItem);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'Item created');
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('name', testItem.name);
    }, 30000);

    test('GET /items/{id} should return created item', async () => {
      const response = await axios.get(`${apiEndpoint}/items/${testItemId}`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Get item');
      expect(response.data).toHaveProperty('id', testItemId);
    }, 30000);

    test('PUT /items/{id} should update item via API Gateway', async () => {
      const updateData = {
        name: 'Updated Integration Test Item',
        description: 'Updated by integration tests',
      };

      const response = await axios.put(
        `${apiEndpoint}/items/${testItemId}`,
        updateData
      );
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Item updated');
      expect(response.data).toHaveProperty('id', testItemId);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('name', updateData.name);
    }, 30000);

    test('DELETE /items/{id} should delete item via API Gateway', async () => {
      const response = await axios.delete(`${apiEndpoint}/items/${testItemId}`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'Item deleted');
      expect(response.data).toHaveProperty('id', testItemId);
    }, 30000);

    test('GET /items/{id} should return 404 for deleted item', async () => {
      try {
        await axios.get(`${apiEndpoint}/items/${testItemId}`);
        fail('Expected 404 for deleted item');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    }, 30000);
  });

  describe('DynamoDB Direct Testing - Live Resource Access', () => {
    const directTestItemId = `direct-test-item-${Date.now()}`;

    test('should be able to put item directly in DynamoDB', async () => {
      const command = new PutItemCommand({
        TableName: dynamoTableName,
        Item: {
          id: { S: directTestItemId },
          name: { S: 'Direct DynamoDB Test' },
          description: { S: 'Created directly via SDK' },
          createdAt: { S: new Date().toISOString() },
        },
      });

      const result = await dynamoClient.send(command);
      expect(result).toBeDefined();
      expect(result.$metadata.httpStatusCode).toBe(200);
    });

    test('should be able to get item directly from DynamoDB', async () => {
      const command = new GetItemCommand({
        TableName: dynamoTableName,
        Key: {
          id: { S: directTestItemId },
        },
      });

      const result = await dynamoClient.send(command);
      expect(result.Item).toBeDefined();
      expect(result.Item!.name.S).toBe('Direct DynamoDB Test');
      expect(result.Item!.description.S).toBe('Created directly via SDK');
    });

    test('should be able to update item directly in DynamoDB', async () => {
      const command = new UpdateItemCommand({
        TableName: dynamoTableName,
        Key: {
          id: { S: directTestItemId },
        },
        UpdateExpression: 'SET #n = :name, #d = :desc',
        ExpressionAttributeNames: {
          '#n': 'name',
          '#d': 'description',
        },
        ExpressionAttributeValues: {
          ':name': { S: 'Updated Direct Test' },
          ':desc': { S: 'Updated directly via SDK' },
        },
        ReturnValues: 'ALL_NEW',
      });

      const result = await dynamoClient.send(command);
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.name.S).toBe('Updated Direct Test');
    });

    test('should be able to scan items from DynamoDB', async () => {
      const command = new ScanCommand({
        TableName: dynamoTableName,
        Limit: 10,
      });

      const result = await dynamoClient.send(command);
      expect(result.Items).toBeDefined();
      expect(Array.isArray(result.Items)).toBe(true);
      expect(result.Items!.length).toBeGreaterThanOrEqual(1);
    });

    test('should be able to delete item directly from DynamoDB', async () => {
      const command = new DeleteItemCommand({
        TableName: dynamoTableName,
        Key: {
          id: { S: directTestItemId },
        },
        ReturnValues: 'ALL_OLD',
      });

      const result = await dynamoClient.send(command);
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.name.S).toBe('Updated Direct Test');
    });
  });

  describe('Lambda Function Direct Testing - Live Invocation', () => {
    test('should be able to invoke Lambda function directly', async () => {
      const payload = {
        httpMethod: 'GET',
        path: '/items',
        body: null,
        pathParameters: null,
        queryStringParameters: null,
      };

      const command = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(command);
      expect(result).toBeDefined();
      expect(result.StatusCode).toBe(200);

      const responsePayload = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );
      expect(responsePayload).toHaveProperty('statusCode', 200);
      expect(responsePayload).toHaveProperty('body');
    });

    test('should handle POST request in Lambda function', async () => {
      const payload = {
        httpMethod: 'POST',
        path: '/items',
        body: JSON.stringify({
          name: 'Lambda Direct Test',
          description: 'Created via direct Lambda invocation',
        }),
        pathParameters: null,
        queryStringParameters: null,
      };

      const command = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(command);
      expect(result.StatusCode).toBe(200);

      const responsePayload = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );
      expect(responsePayload.statusCode).toBe(201);
      expect(JSON.parse(responsePayload.body)).toHaveProperty(
        'message',
        'Item created'
      );
    });

    test('should handle PUT request in Lambda function', async () => {
      const payload = {
        httpMethod: 'PUT',
        path: '/items/test-id',
        body: JSON.stringify({
          name: 'Updated via Lambda',
          description: 'Updated directly via Lambda invocation',
        }),
        pathParameters: { id: 'test-id' },
        queryStringParameters: null,
      };

      const command = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(command);
      expect(result.StatusCode).toBe(200);

      const responsePayload = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );
      expect(responsePayload.statusCode).toBe(200);
      expect(JSON.parse(responsePayload.body)).toHaveProperty(
        'message',
        'Item updated'
      );
    });

    test('should handle DELETE request in Lambda function', async () => {
      const payload = {
        httpMethod: 'DELETE',
        path: '/items/test-delete-id',
        body: null,
        pathParameters: { id: 'test-delete-id' },
        queryStringParameters: null,
      };

      const command = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify(payload),
      });

      const result = await lambdaClient.send(command);
      expect(result.StatusCode).toBe(200);

      const responsePayload = JSON.parse(
        new TextDecoder().decode(result.Payload)
      );
      expect(responsePayload.statusCode).toBe(200);
      expect(JSON.parse(responsePayload.body)).toHaveProperty(
        'message',
        'Item deleted'
      );
    });
  });

  describe('CORS and Security Testing', () => {
    test('API should handle CORS preflight requests', async () => {
      const response = await axios.options(`${apiEndpoint}/items`, {
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain(
        'POST'
      );
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
      expect(response.headers['access-control-allow-methods']).toContain(
        'DELETE'
      );
      expect(response.headers['access-control-allow-headers']).toContain(
        'Content-Type'
      );
      expect(response.headers['access-control-allow-headers']).toContain(
        'Authorization'
      );
    }, 30000);

    test('API should handle OPTIONS on specific resource', async () => {
      const response = await axios.options(`${apiEndpoint}/items/test-id`);

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
      expect(response.headers['access-control-allow-methods']).toContain(
        'DELETE'
      );
    }, 30000);
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid HTTP methods', async () => {
      try {
        await axios.patch(`${apiEndpoint}/items`);
        fail('Should have thrown error for unsupported method');
      } catch (error: any) {
        expect(error.response.status).toBe(405);
        expect(JSON.parse(error.response.data)).toHaveProperty(
          'error',
          'Method not allowed'
        );
      }
    }, 30000);

    test('should handle malformed JSON gracefully', async () => {
      try {
        await axios.post(`${apiEndpoint}/items`, '{invalid json');
        fail('Should have thrown error for malformed JSON');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(JSON.parse(error.response.data)).toHaveProperty(
          'error',
          'Internal server error'
        );
      }
    }, 30000);

    test('should handle missing required fields in PUT requests', async () => {
      try {
        await axios.put(`${apiEndpoint}/items/${testItemId}`, {});
        fail('Should have thrown error for missing ID in path');
      } catch (error: any) {
        // Lambda should handle this gracefully
        expect([400, 500]).toContain(error.response.status);
      }
    }, 30000);

    test('should handle very long item IDs', async () => {
      const longId = 'a'.repeat(1000); // Very long ID
      const response = await axios.get(`${apiEndpoint}/items/${longId}`);
      // Should not crash, should return some response
      expect([200, 404]).toContain(response.status);
    }, 30000);
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map((_, i) =>
          axios.get(`${apiEndpoint}/items`).then(response => ({
            index: i,
            status: response.status,
            success: response.status === 200,
          }))
        );

      const results = await Promise.all(requests);
      const successfulRequests = results.filter(r => r.success);

      expect(successfulRequests.length).toBe(10); // All should succeed
      expect(results.every(r => r.status === 200)).toBe(true);
    }, 60000);

    test('should handle rapid successive requests', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await axios.get(`${apiEndpoint}/items`);
        expect(response.status).toBe(200);
      }
    }, 30000);
  });
});
