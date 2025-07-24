// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DeleteItemCommand,
  DynamoDBClient,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import axios from 'axios';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// AWS clients
const cfnClient = new CloudFormationClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

// Stack outputs
let apiUrl: string;
let tableName: string;

describe('TapStack API Integration Tests', () => {
  beforeAll(async () => {
    // Get stack outputs
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfnClient.send(command);

    const stack = response.Stacks?.[0];
    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const outputs = stack.Outputs || [];
    apiUrl = outputs.find(o => o.OutputKey === 'ApiUrl')?.OutputValue || '';
    tableName =
      outputs.find(o => o.OutputKey === 'UsersTableName')?.OutputValue || '';

    if (!apiUrl || !tableName) {
      throw new Error('Required stack outputs not found');
    }

    console.log(`Testing API: ${apiUrl}`);
    console.log(`Using table: ${tableName}`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      const scanCommand = new ScanCommand({ TableName: tableName });
      const scanResult = await dynamoClient.send(scanCommand);

      if (scanResult.Items) {
        for (const item of scanResult.Items) {
          if (item.UserId?.S?.startsWith('test-')) {
            await dynamoClient.send(
              new DeleteItemCommand({
                TableName: tableName,
                Key: { UserId: { S: item.UserId.S } },
              })
            );
          }
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('API Gateway Endpoints', () => {
    test('should have accessible API Gateway endpoint', async () => {
      expect(apiUrl).toMatch(
        /^https:\/\/.*\.execute-api\.us-east-1\.amazonaws\.com\//
      );
    });

    test('should return 403 for non-existent endpoints', async () => {
      try {
        await axios.get(`${apiUrl}/nonexistent`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response?.status).toBe(403);
      }
    });
  });

  describe('CreateUser API (POST /users)', () => {
    test('should create a new user successfully', async () => {
      const userId = 'test-user-001';
      const response = await axios.post(
        `${apiUrl}/users`,
        {
          UserId: userId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('User created');
      expect(response.data.UserId).toBe(userId);
    });

    test('should handle missing UserId in request body', async () => {
      try {
        await axios.post(
          `${apiUrl}/users`,
          {},
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        expect(error.response?.data?.error).toBeDefined();
      }
    });

    test('should handle invalid JSON in request body', async () => {
      try {
        await axios.post(`${apiUrl}/users`, 'invalid-json', {
          headers: { 'Content-Type': 'application/json' },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });

    test('should create multiple users with different IDs', async () => {
      const userIds = ['test-user-002', 'test-user-003', 'test-user-004'];

      for (const userId of userIds) {
        const response = await axios.post(
          `${apiUrl}/users`,
          {
            UserId: userId,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        expect(response.status).toBe(200);
        expect(response.data.UserId).toBe(userId);
      }
    });
  });

  describe('GetUser API (GET /users/{userid})', () => {
    beforeEach(async () => {
      // Create test user
      await axios.post(
        `${apiUrl}/users`,
        {
          UserId: 'test-user-get',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    test('should retrieve an existing user', async () => {
      const response = await axios.get(`${apiUrl}/users/test-user-get`);

      expect(response.status).toBe(200);
      expect(response.data.UserId).toBe('test-user-get');
    });

    test('should return 404 for non-existent user', async () => {
      try {
        await axios.get(`${apiUrl}/users/non-existent-user`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
        expect(error.response?.data?.error).toBe('User not found');
      }
    });

    test('should handle special characters in user ID', async () => {
      const specialUserId = 'test-user-special-123_456';

      // Create user with special characters
      await axios.post(
        `${apiUrl}/users`,
        {
          UserId: specialUserId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Retrieve user
      const response = await axios.get(
        `${apiUrl}/users/${encodeURIComponent(specialUserId)}`
      );
      expect(response.status).toBe(200);
      expect(response.data.UserId).toBe(specialUserId);
    });
  });

  describe('DeleteUser API (DELETE /users/{userid})', () => {
    beforeEach(async () => {
      // Create test user
      await axios.post(
        `${apiUrl}/users`,
        {
          UserId: 'test-user-delete',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    test('should delete an existing user', async () => {
      const response = await axios.delete(`${apiUrl}/users/test-user-delete`);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('User deleted');
      expect(response.data.UserId).toBe('test-user-delete');

      // Verify user is deleted
      try {
        await axios.get(`${apiUrl}/users/test-user-delete`);
        fail('User should be deleted');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    test('should handle deletion of non-existent user gracefully', async () => {
      const response = await axios.delete(`${apiUrl}/users/non-existent-user`);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('User deleted');
      expect(response.data.UserId).toBe('non-existent-user');
    });
  });

  describe('End-to-End User Workflow', () => {
    test('should support complete CRUD operations', async () => {
      const userId = 'test-user-e2e';

      // 1. Create user
      const createResponse = await axios.post(
        `${apiUrl}/users`,
        {
          UserId: userId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(createResponse.status).toBe(200);

      // 2. Get user
      const getResponse = await axios.get(`${apiUrl}/users/${userId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.UserId).toBe(userId);

      // 3. Delete user
      const deleteResponse = await axios.delete(`${apiUrl}/users/${userId}`);
      expect(deleteResponse.status).toBe(200);

      // 4. Verify user is deleted
      try {
        await axios.get(`${apiUrl}/users/${userId}`);
        fail('User should be deleted');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    test('should handle concurrent operations', async () => {
      const userIds = Array.from(
        { length: 5 },
        (_, i) => `test-user-concurrent-${i}`
      );

      // Create users concurrently
      const createPromises = userIds.map(userId =>
        axios.post(
          `${apiUrl}/users`,
          { UserId: userId },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const createResults = await Promise.all(createPromises);
      createResults.forEach(result => expect(result.status).toBe(200));

      // Get users concurrently
      const getPromises = userIds.map(userId =>
        axios.get(`${apiUrl}/users/${userId}`)
      );

      const getResults = await Promise.all(getPromises);
      getResults.forEach((result, index) => {
        expect(result.status).toBe(200);
        expect(result.data.UserId).toBe(userIds[index]);
      });

      // Delete users concurrently
      const deletePromises = userIds.map(userId =>
        axios.delete(`${apiUrl}/users/${userId}`)
      );

      const deleteResults = await Promise.all(deletePromises);
      deleteResults.forEach(result => expect(result.status).toBe(200));
    });
  });

  describe('Security and Error Handling', () => {
    test('should have proper CORS headers', async () => {
      const response = await axios.post(
        `${apiUrl}/users`,
        {
          UserId: 'test-user-cors',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      expect(response.headers['content-type']).toContain('application/json');
    });

    test('should handle large user IDs', async () => {
      const largeUserId = 'test-user-' + 'a'.repeat(100);

      const response = await axios.post(
        `${apiUrl}/users`,
        {
          UserId: largeUserId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.UserId).toBe(largeUserId);
    });

    test('should handle empty user ID', async () => {
      try {
        await axios.post(
          `${apiUrl}/users`,
          {
            UserId: '',
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('Performance and Load', () => {
    test('should handle rapid sequential requests', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.post(
            `${apiUrl}/users`,
            {
              UserId: `test-user-load-${i}`,
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          )
        );
      }

      const results = await Promise.all(promises);
      results.forEach(result => expect(result.status).toBe(200));
    }, 15000);

    test('should respond within reasonable time limits', async () => {
      const startTime = Date.now();

      await axios.post(
        `${apiUrl}/users`,
        {
          UserId: 'test-user-performance',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});
