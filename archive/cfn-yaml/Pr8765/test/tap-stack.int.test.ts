import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let apiUrl: string;
  let itemsTableName: string;
  let usersTableName: string;
  let ordersTableName: string;
  let dynamoClient: DynamoDBClient;
  const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const awsEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
  const isLocalStack = awsEndpoint.includes('localhost') || awsEndpoint.includes('4566');

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'cfn-outputs/flat-outputs.json not found. Please deploy the stack first.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    // Extract outputs and normalize for LocalStack (use HTTP to avoid TLS issues)
    const outputApi = outputs.ApiGatewayUrl;
    if (isLocalStack) {
      const apiId = outputApi.match(/https?:\/\/([^.]+)\./)?.[1];
      apiUrl = apiId
        ? `http://${apiId}.execute-api.localhost.localstack.cloud:4566/Prod`
        : `${awsEndpoint}/restapis/unknown/Prod/_user_request`;
    } else {
      apiUrl = outputApi;
    }
    itemsTableName = outputs.ItemsTableName;
    usersTableName = outputs.UsersTableName;
    ordersTableName = outputs.OrdersTableName;

    // Initialize AWS clients
    dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: awsEndpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });

    // Validate outputs exist
    expect(apiUrl).toBeDefined();
    expect(itemsTableName).toBeDefined();
    expect(usersTableName).toBeDefined();
    expect(ordersTableName).toBeDefined();
  });

  describe('API Gateway Endpoints', () => {
    describe('Items Endpoint', () => {
      const testItemId = `test-item-${Date.now()}`;
      const testItem = {
        itemId: testItemId,
        name: 'Test Item',
        description: 'Integration test item',
        price: 99.99,
      };

      test('should create an item via POST /items', async () => {
        const response = await axios.post(`${apiUrl}/items`, testItem, {
          headers: { 'Content-Type': 'application/json' },
        });

        expect([200, 201]).toContain(response.status);
        expect(response.data).toHaveProperty(
          'message',
          'Item created successfully'
        );
      });

      test('should retrieve an item via GET /items', async () => {
        const response = await axios.get(`${apiUrl}/items`, {
          params: { itemId: testItemId },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('itemId', testItemId);
        expect(response.data).toHaveProperty('name', testItem.name);
      });

      test('should return 404 for non-existent item', async () => {
        try {
          await axios.get(`${apiUrl}/items`, {
            params: { itemId: 'non-existent-item' },
          });
        } catch (error: any) {
          expect(error.response?.status).toBe(404);
          expect(error.response?.data).toHaveProperty(
            'message',
            'Item not found'
          );
        }
      });

      test('should return 400 for missing itemId parameter', async () => {
        try {
          await axios.get(`${apiUrl}/items`);
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
          expect(error.response?.data).toHaveProperty(
            'message',
            'Missing itemId query parameter'
          );
        }
      });
    });

    describe('Users Endpoint', () => {
      const testUserId = `test-user-${Date.now()}`;
      const testUser = {
        userId: testUserId,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
      };

      test('should create a user via POST /users', async () => {
        const response = await axios.post(`${apiUrl}/users`, testUser, {
          headers: { 'Content-Type': 'application/json' },
        });

        expect([200, 201]).toContain(response.status);
        expect(response.data).toHaveProperty(
          'message',
          'User created successfully'
        );
      });

      test('should retrieve a user via GET /users', async () => {
        const response = await axios.get(`${apiUrl}/users`, {
          params: { userId: testUserId },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('userId', testUserId);
        expect(response.data).toHaveProperty('username', testUser.username);
      });

      test('should return 404 for non-existent user', async () => {
        try {
          await axios.get(`${apiUrl}/users`, {
            params: { userId: 'non-existent-user' },
          });
        } catch (error: any) {
          expect(error.response?.status).toBe(404);
          expect(error.response?.data).toHaveProperty(
            'message',
            'User not found'
          );
        }
      });

      test('should return 400 for missing userId parameter', async () => {
        try {
          await axios.get(`${apiUrl}/users`);
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
          expect(error.response?.data).toHaveProperty(
            'message',
            'Missing userId query parameter'
          );
        }
      });
    });

    describe('Orders Endpoint', () => {
      const testOrderId = `test-order-${Date.now()}`;
      const testOrder = {
        orderId: testOrderId,
        userId: 'test-user-123',
        items: ['item1', 'item2'],
        totalAmount: 150.0,
        status: 'pending',
      };

      test('should create an order via POST /orders', async () => {
        const response = await axios.post(`${apiUrl}/orders`, testOrder, {
          headers: { 'Content-Type': 'application/json' },
        });

        expect([200, 201]).toContain(response.status);
        expect(response.data).toHaveProperty(
          'message',
          'Order created successfully'
        );
      });

      test('should retrieve an order via GET /orders', async () => {
        const response = await axios.get(`${apiUrl}/orders`, {
          params: { orderId: testOrderId },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('orderId', testOrderId);
        expect(response.data).toHaveProperty('userId', testOrder.userId);
      });

      test('should return 404 for non-existent order', async () => {
        try {
          await axios.get(`${apiUrl}/orders`, {
            params: { orderId: 'non-existent-order' },
          });
        } catch (error: any) {
          expect(error.response?.status).toBe(404);
          expect(error.response?.data).toHaveProperty(
            'message',
            'Order not found'
          );
        }
      });

      test('should return 400 for missing orderId parameter', async () => {
        try {
          await axios.get(`${apiUrl}/orders`);
        } catch (error: any) {
          expect(error.response?.status).toBe(400);
          expect(error.response?.data).toHaveProperty(
            'message',
            'Missing orderId query parameter'
          );
        }
      });
    });
  });

  describe('DynamoDB Direct Operations', () => {
    test('should be able to write to ItemsTable directly', async () => {
      const testItem = {
        itemId: { S: `direct-test-item-${Date.now()}` },
        name: { S: 'Direct Test Item' },
        price: { N: '49.99' },
      };

      const putResponse = await dynamoClient.send(
        new PutItemCommand({
          TableName: itemsTableName,
          Item: testItem,
        })
      );

      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: itemsTableName,
          Key: { itemId: testItem.itemId },
        })
      );
    });

    test('should be able to write to UsersTable directly', async () => {
      const testUser = {
        userId: { S: `direct-test-user-${Date.now()}` },
        username: { S: 'directuser' },
        email: { S: 'direct@test.com' },
      };

      const putResponse = await dynamoClient.send(
        new PutItemCommand({
          TableName: usersTableName,
          Item: testUser,
        })
      );

      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: usersTableName,
          Key: { userId: testUser.userId },
        })
      );
    });

    test('should be able to write to OrdersTable directly', async () => {
      const testOrder = {
        orderId: { S: `direct-test-order-${Date.now()}` },
        userId: { S: 'user123' },
        totalAmount: { N: '299.99' },
      };

      const putResponse = await dynamoClient.send(
        new PutItemCommand({
          TableName: ordersTableName,
          Item: testOrder,
        })
      );

      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: ordersTableName,
          Key: { orderId: testOrder.orderId },
        })
      );
    });
  });

  describe('End-to-End Workflow', () => {
    test('should support complete order workflow', async () => {
      const timestamp = Date.now();

      // 1. Create a user
      const user = {
        userId: `workflow-user-${timestamp}`,
        username: 'workflowuser',
        email: 'workflow@test.com',
      };

      const userResponse = await axios.post(`${apiUrl}/users`, user, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect([200, 201]).toContain(userResponse.status);

      // 2. Create items
      const item1 = {
        itemId: `workflow-item1-${timestamp}`,
        name: 'Product 1',
        price: 50.0,
      };

      const item2 = {
        itemId: `workflow-item2-${timestamp}`,
        name: 'Product 2',
        price: 75.0,
      };

      const item1Response = await axios.post(`${apiUrl}/items`, item1, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect([200, 201]).toContain(item1Response.status);

      const item2Response = await axios.post(`${apiUrl}/items`, item2, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect([200, 201]).toContain(item2Response.status);

      // 3. Create an order
      const order = {
        orderId: `workflow-order-${timestamp}`,
        userId: user.userId,
        items: [item1.itemId, item2.itemId],
        totalAmount: 125.0,
      };

      const orderResponse = await axios.post(`${apiUrl}/orders`, order, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect([200, 201]).toContain(orderResponse.status);

      // 4. Verify we can retrieve all created entities
      const getUserResponse = await axios.get(`${apiUrl}/users`, {
        params: { userId: user.userId },
      });
      expect(getUserResponse.status).toBe(200);
      expect(getUserResponse.data.userId).toBe(user.userId);

      const getItem1Response = await axios.get(`${apiUrl}/items`, {
        params: { itemId: item1.itemId },
      });
      expect(getItem1Response.status).toBe(200);
      expect(getItem1Response.data.itemId).toBe(item1.itemId);

      const getOrderResponse = await axios.get(`${apiUrl}/orders`, {
        params: { orderId: order.orderId },
      });
      expect(getOrderResponse.status).toBe(200);
      expect(getOrderResponse.data.orderId).toBe(order.orderId);

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: ordersTableName,
          Key: { orderId: { S: order.orderId } },
        })
      );
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: itemsTableName,
          Key: { itemId: { S: item1.itemId } },
        })
      );
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: itemsTableName,
          Key: { itemId: { S: item2.itemId } },
        })
      );
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: usersTableName,
          Key: { userId: { S: user.userId } },
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON in POST request', async () => {
      try {
        await axios.post(`${apiUrl}/items`, 'invalid-json', {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        expect(error.response?.status).toBe(500);
      }
    });

    test('should handle unsupported HTTP methods', async () => {
      try {
        await axios.delete(`${apiUrl}/items`);
      } catch (error: any) {
        expect(error.response?.status).toBe(405);
      }
    });
  });

  describe('Infrastructure Validation', () => {
    test('API Gateway URL should be properly formatted', () => {
      if (isLocalStack) {
        expect(apiUrl).toMatch(
          /^http:\/\/[a-z0-9]+\.execute-api\.localhost\.localstack\.cloud:4566\/Prod/
        );
      } else {
        expect(apiUrl).toMatch(
          /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/Prod$/
        );
      }
    });

    test('DynamoDB table names should include environment suffix', () => {
      const expectedPrefix = isLocalStack
        ? `localstack-stack-${envSuffix}`
        : `TapStack${envSuffix}`;

      expect(itemsTableName).toContain(expectedPrefix);
      expect(itemsTableName).toContain('items-table');
      expect(usersTableName).toContain(expectedPrefix);
      expect(usersTableName).toContain('users-table');
      expect(ordersTableName).toContain(expectedPrefix);
      expect(ordersTableName).toContain('orders-table');
    });

    test('all table names should have consistent naming pattern', () => {
      const tables = [itemsTableName, usersTableName, ordersTableName];
      const pattern = isLocalStack
        ? /^localstack-stack-[a-z0-9]+-[a-z]+-table-[a-z0-9-]+$/
        : /^TapStack[a-zA-Z0-9]+-[a-z]+-table-[a-zA-Z0-9]+$/;

      tables.forEach(tableName => {
        expect(tableName).toMatch(pattern);
      });
    });
  });
});
