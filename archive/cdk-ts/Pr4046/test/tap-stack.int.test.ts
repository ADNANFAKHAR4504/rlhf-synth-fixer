// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  QueryCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import axios, { AxiosError } from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });

// Get outputs from flat-outputs.json
const apiEndpoint = outputs.ApiEndpoint;
const apiKey = outputs.ApiKeyValue;
const tableName = outputs.UserTableName;

describe('User Profile API Integration Tests', () => {
  let testUserId: string;
  const testUsername = `testuser-${Date.now()}`;

  afterAll(async () => {
    // Cleanup: Delete test user if created
    if (testUserId) {
      try {
        await dynamoClient.send(
          new DeleteItemCommand({
            TableName: tableName,
            Key: marshall({ userId: testUserId }),
          })
        );
      } catch (error) {
        console.log('Cleanup: Test user already deleted or not found');
      }
    }
  });

  describe('DynamoDB Table', () => {
    test('Should verify DynamoDB table exists and has correct configuration', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );

      // Check for GSI
      const gsi = response.Table!.GlobalSecondaryIndexes?.find(
        (index) => index.IndexName === 'username-index'
      );
      expect(gsi).toBeDefined();
      expect(gsi!.IndexStatus).toBe('ACTIVE');
    });
  });

  describe('API Gateway - Create User (POST /users)', () => {
    test('Should create a new user successfully', async () => {
      const userData = {
        username: testUsername,
        email: `${testUsername}@example.com`,
        fullName: 'Test User',
        phoneNumber: '+1234567890',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'TestLand',
        },
      };

      const response = await axios.post(`${apiEndpoint}users`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.message).toBe('User created successfully');
      expect(response.data.user).toBeDefined();
      expect(response.data.user.userId).toBeDefined();
      expect(response.data.user.username).toBe(testUsername);
      expect(response.data.user.email).toBe(userData.email);

      testUserId = response.data.user.userId;
    });

    test('Should fail to create user without API key', async () => {
      const userData = {
        username: `nokey-${Date.now()}`,
        email: 'nokey@example.com',
        fullName: 'No Key User',
      };

      try {
        await axios.post(`${apiEndpoint}users`, userData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(403);
      }
    });

    test('Should fail to create user with missing required fields', async () => {
      const invalidData = {
        username: `invalid-${Date.now()}`,
        // Missing email and fullName
      };

      try {
        await axios.post(`${apiEndpoint}users`, invalidData, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
      }
    });

    test('Should fail to create duplicate username', async () => {
      const duplicateData = {
        username: testUsername,
        email: 'duplicate@example.com',
        fullName: 'Duplicate User',
      };

      try {
        await axios.post(`${apiEndpoint}users`, duplicateData, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(409);
        expect(axiosError.response?.data).toMatchObject({
          error: 'Username already exists',
        });
      }
    });
  });

  describe('API Gateway - Get User by ID (GET /users/{userId})', () => {
    test('Should retrieve user by userId', async () => {
      const response = await axios.get(`${apiEndpoint}users/${testUserId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.user).toBeDefined();
      expect(response.data.user.userId).toBe(testUserId);
      expect(response.data.user.username).toBe(testUsername);
    });

    test('Should return 404 for non-existent user', async () => {
      const fakeUserId = 'non-existent-user-id';

      try {
        await axios.get(`${apiEndpoint}users/${fakeUserId}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });
  });

  describe('API Gateway - Get User by Username (GET /users/username/{username})', () => {
    test('Should retrieve user by username using GSI', async () => {
      const response = await axios.get(
        `${apiEndpoint}users/username/${testUsername}`,
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.user).toBeDefined();
      expect(response.data.user.username).toBe(testUsername);
      expect(response.data.user.userId).toBe(testUserId);
    });

    test('Should return 404 for non-existent username', async () => {
      const fakeUsername = 'non-existent-username';

      try {
        await axios.get(`${apiEndpoint}users/username/${fakeUsername}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });
  });

  describe('API Gateway - Update User (PUT /users/{userId})', () => {
    test('Should update user successfully', async () => {
      const updateData = {
        email: 'updated@example.com',
        fullName: 'Updated Test User',
        phoneNumber: '+9876543210',
      };

      const response = await axios.put(
        `${apiEndpoint}users/${testUserId}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('User updated successfully');
      expect(response.data.user.email).toBe(updateData.email);
      expect(response.data.user.fullName).toBe(updateData.fullName);
      expect(response.data.user.phoneNumber).toBe(updateData.phoneNumber);
    });

    test('Should return 404 when updating non-existent user', async () => {
      const fakeUserId = 'non-existent-user-id';
      const updateData = {
        email: 'updated@example.com',
      };

      try {
        await axios.put(`${apiEndpoint}users/${fakeUserId}`, updateData, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });
  });

  describe('API Gateway - Delete User (DELETE /users/{userId})', () => {
    test('Should delete user successfully', async () => {
      const response = await axios.delete(`${apiEndpoint}users/${testUserId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('User deleted successfully');

      // Verify user is deleted from DynamoDB
      const getResult = await dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: marshall({ userId: testUserId }),
        })
      );
      expect(getResult.Item).toBeUndefined();

      // Clear testUserId so afterAll doesn't try to delete again
      testUserId = '';
    });

    test('Should return 404 when deleting non-existent user', async () => {
      const fakeUserId = 'non-existent-user-id';

      try {
        await axios.delete(`${apiEndpoint}users/${fakeUserId}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });
  });

  describe('DynamoDB Direct Operations', () => {
    test('Should be able to query DynamoDB table directly', async () => {
      // Create a test user directly in DynamoDB
      const directUserId = `direct-test-${Date.now()}`;
      const directUsername = `directuser-${Date.now()}`;

      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: marshall({
            userId: directUserId,
            username: directUsername,
            email: 'direct@example.com',
            fullName: 'Direct Test User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        })
      );

      // Query by username using GSI
      const queryResult = await dynamoClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: 'username-index',
          KeyConditionExpression: 'username = :username',
          ExpressionAttributeValues: marshall({
            ':username': directUsername,
          }),
        })
      );

      expect(queryResult.Items).toBeDefined();
      expect(queryResult.Items!.length).toBe(1);
      const user = unmarshall(queryResult.Items![0]);
      expect(user.username).toBe(directUsername);

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: marshall({ userId: directUserId }),
        })
      );
    });
  });

  describe('CORS and API Configuration', () => {
    test('Should have CORS headers in response', async () => {
      const response = await axios.options(`${apiEndpoint}users`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});
