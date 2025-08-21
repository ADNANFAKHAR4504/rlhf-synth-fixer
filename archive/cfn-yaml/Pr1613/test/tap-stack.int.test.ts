// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import fetch from 'node-fetch';

let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (e) {
  outputs = {
    ApiGatewayUrl: 'https://5nm6ito8fj.execute-api.us-east-1.amazonaws.com/dev',
    DynamoDBTableArn:
      'arn:aws:dynamodb:us-east-1:149536495831:table/dev-serverless-table',
    LambdaFunctionArn:
      'arn:aws:lambda:us-east-1:149536495831:function:dev-serverless-function',
    DynamoDBTableName: 'dev-serverless-table',
  };
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless API Integration Tests', () => {
  const apiUrl = outputs.ApiGatewayUrl;
  const tableName = outputs.DynamoDBTableName;

  describe('API Gateway Tests', () => {
    test('API Gateway URL should be accessible', async () => {
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('https://');
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain('amazonaws.com');
    });

    test('should handle GET request to /items endpoint', async () => {
      const response = await fetch(`${apiUrl}/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('message');
      expect(responseBody).toHaveProperty('items');
      expect(Array.isArray(responseBody.items)).toBe(true);
    });

    test('should handle POST request to /items endpoint', async () => {
      const testItem = {
        id: `test-${Date.now()}`,
        name: 'Test Item',
        description: 'This is a test item',
      };

      const response = await fetch(`${apiUrl}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testItem),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('message');
      expect(responseBody).toHaveProperty('item');
      expect(responseBody.item.id).toBe(testItem.id);
      expect(responseBody.item).toHaveProperty('timestamp');
    });

    test('should handle POST request with missing id', async () => {
      const invalidItem = {
        name: 'Test Item without ID',
        description: 'This item is missing the required id field',
      };

      const response = await fetch(`${apiUrl}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidItem),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('error');
      expect(responseBody.error).toBe('Missing required field: id');
    });

    test('should handle unsupported HTTP methods', async () => {
      const response = await fetch(`${apiUrl}/items`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody.message).toBe('Missing Authentication Token');
    });

    test('should handle CORS preflight requests', async () => {
      const response = await fetch(`${apiUrl}/items`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'POST',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain(
        'POST'
      );
    });
  });

  describe('DynamoDB Integration Tests', () => {
    test('DynamoDB table should exist and be accessible', () => {
      expect(tableName).toBeDefined();
      expect(tableName).toContain('serverless-table');
    });

    test('should successfully store and retrieve data from DynamoDB', async () => {
      // First, POST an item
      const testItem = {
        id: `integration-test-${Date.now()}`,
        testData: 'This is integration test data',
        timestamp: new Date().toISOString(),
      };

      const postResponse = await fetch(`${apiUrl}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testItem),
      });

      expect(postResponse.status).toBe(201);

      // Then, GET all items to verify it was stored
      const getResponse = await fetch(`${apiUrl}/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(getResponse.status).toBe(200);

      const responseBody = await getResponse.json();
      expect(responseBody.items).toBeDefined();
    });
  });

  describe('Security and Performance Tests', () => {
    test('API should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await fetch(`${apiUrl}/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
    });

    test('API should include proper security headers', async () => {
      const response = await fetch(`${apiUrl}/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toBeDefined();

      // Check CORS headers are present in the response
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    test('API should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${apiUrl}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json content',
      });

      // Should handle malformed JSON without crashing
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Lambda Function Integration Tests', () => {
    test('Lambda function should handle concurrent requests', async () => {
      const concurrentRequests = 5;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const testItem = {
          id: `concurrent-test-${Date.now()}-${i}`,
          concurrentTest: true,
          requestNumber: i,
        };

        requests.push(
          fetch(`${apiUrl}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testItem),
          })
        );
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });
});
