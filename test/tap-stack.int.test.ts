// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import axios from 'axios';
import AWS from 'aws-sdk';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();
const cloudwatch = new AWS.CloudWatch();

describe('Serverless API Integration Tests', () => {
  const apiUrl = outputs.ApiUrl;
  const tableName = outputs.DynamoDBTableName;
  const lambdaArn = outputs.LambdaFunctionArn;
  const parameterPrefix = outputs.ParameterStorePrefix;

  // Test data
  const testUserId = `test-user-${Date.now()}`;
  const testUserData = {
    name: 'Test User',
    email: 'test@example.com',
    preferences: { theme: 'dark', notifications: true }
  };

  describe('Health Check Endpoint', () => {
    test('should return healthy status', async () => {
      const response = await axios.get(`${apiUrl}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('environment');
      expect(response.data).toHaveProperty('timestamp');
    });

    test('should have correct content type', async () => {
      const response = await axios.get(`${apiUrl}/health`);
      
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('User Creation Endpoint', () => {
    test('should create a new user successfully', async () => {
      const payload = {
        userId: testUserId,
        data: testUserData
      };

      const response = await axios.post(`${apiUrl}/users`, payload);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message', 'User created successfully');
      expect(response.data).toHaveProperty('userId', testUserId);
    });

    test('should return 400 for missing userId', async () => {
      const payload = {
        data: testUserData
      };

      try {
        await axios.post(`${apiUrl}/users`, payload);
        fail('Expected request to fail with 400');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error', 'userId is required');
      }
    });

    test('should store user data in DynamoDB', async () => {
      const uniqueUserId = `integration-test-${Date.now()}`;
      const payload = {
        userId: uniqueUserId,
        data: testUserData
      };

      // Create user via API
      await axios.post(`${apiUrl}/users`, payload);

      // Verify in DynamoDB
      const params = {
        TableName: tableName,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': uniqueUserId
        }
      };

      const result = await dynamodb.query(params).promise();
      expect(result.Items.length).toBeGreaterThan(0);
      expect(result.Items[0].userId).toBe(uniqueUserId);
      expect(result.Items[0].data).toEqual(testUserData);
    });
  });

  describe('User Retrieval Endpoint', () => {
    beforeAll(async () => {
      // Create test user for retrieval tests
      const payload = {
        userId: testUserId,
        data: testUserData
      };
      await axios.post(`${apiUrl}/users`, payload);
    });

    test('should retrieve existing user data', async () => {
      const response = await axios.get(`${apiUrl}/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('items');
      expect(response.data.items).toBeInstanceOf(Array);
      expect(response.data.items.length).toBeGreaterThan(0);
      
      const userItem = response.data.items[0];
      expect(userItem.userId).toBe(testUserId);
      expect(userItem.data).toEqual(testUserData);
    });

    test('should return empty array for non-existent user', async () => {
      const nonExistentUserId = 'non-existent-user-12345';
      const response = await axios.get(`${apiUrl}/users/${nonExistentUserId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('items');
      expect(response.data.items).toEqual([]);
    });

    test('should limit results to 10 items', async () => {
      // Create multiple records for the same user
      const multiTestUserId = `multi-test-${Date.now()}`;
      const promises = [];
      
      for (let i = 0; i < 15; i++) {
        const payload = {
          userId: multiTestUserId,
          data: { ...testUserData, index: i }
        };
        promises.push(axios.post(`${apiUrl}/users`, payload));
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      await Promise.all(promises);
      
      // Retrieve user data
      const response = await axios.get(`${apiUrl}/users/${multiTestUserId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.items.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown endpoints', async () => {
      try {
        await axios.get(`${apiUrl}/unknown-endpoint`);
        fail('Expected request to fail with 404');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('error', 'Endpoint not found');
      }
    });

    test('should handle malformed JSON in POST requests', async () => {
      try {
        await axios.post(`${apiUrl}/users`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        fail('Expected request to fail');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });
  });

  describe('Parameter Store Integration', () => {
    test('should have all required configuration parameters', async () => {
      const requiredParams = ['max-retries', 'timeout', 'rate-limit'];
      
      for (const param of requiredParams) {
        const paramName = `${parameterPrefix}/config/${param}`;
        
        const result = await ssm.getParameter({ Name: paramName }).promise();
        expect(result.Parameter).toBeDefined();
        expect(result.Parameter.Value).toBeDefined();
      }
    });

    test('should have correct parameter values', async () => {
      const maxRetriesParam = await ssm.getParameter({
        Name: `${parameterPrefix}/config/max-retries`
      }).promise();
      
      const timeoutParam = await ssm.getParameter({
        Name: `${parameterPrefix}/config/timeout`
      }).promise();
      
      const rateLimitParam = await ssm.getParameter({
        Name: `${parameterPrefix}/config/rate-limit`
      }).promise();
      
      expect(maxRetriesParam.Parameter.Value).toBe('3');
      expect(timeoutParam.Parameter.Value).toBe('30');
      expect(rateLimitParam.Parameter.Value).toBe('1000');
    });
  });

  describe('CloudWatch Metrics Integration', () => {
    test('should create custom metrics when users are created', async () => {
      const uniqueUserId = `metrics-test-${Date.now()}`;
      const payload = {
        userId: uniqueUserId,
        data: testUserData
      };

      // Create user to trigger metrics
      await axios.post(`${apiUrl}/users`, payload);
      
      // Wait a bit for metrics to be published
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for custom metrics
      const metricParams = {
        Namespace: `ServerlessAPI/${environmentSuffix}`,
        MetricName: 'UserCreated',
        StartTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      };
      
      const metricsData = await cloudwatch.getMetricStatistics(metricParams).promise();
      expect(metricsData.Datapoints).toBeDefined();
    });

    test('should create custom metrics when users are queried', async () => {
      // Query user to trigger metrics
      await axios.get(`${apiUrl}/users/${testUserId}`);
      
      // Wait a bit for metrics to be published
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for custom metrics
      const metricParams = {
        Namespace: `ServerlessAPI/${environmentSuffix}`,
        MetricName: 'UserQueried',
        StartTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      };
      
      const metricsData = await cloudwatch.getMetricStatistics(metricParams).promise();
      expect(metricsData.Datapoints).toBeDefined();
    });
  });

  describe('API Performance', () => {
    test('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(axios.get(`${apiUrl}/health`));
      }
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.status).toBe('healthy');
      });
    });

    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await axios.get(`${apiUrl}/health`);
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data integrity across create and retrieve operations', async () => {
      const consistencyTestUserId = `consistency-test-${Date.now()}`;
      const complexData = {
        profile: {
          name: 'Consistency Test User',
          age: 30,
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          }
        },
        metadata: {
          createdBy: 'integration-test',
          version: '1.0',
          tags: ['test', 'integration', 'consistency']
        }
      };
      
      // Create user with complex data
      const createResponse = await axios.post(`${apiUrl}/users`, {
        userId: consistencyTestUserId,
        data: complexData
      });
      
      expect(createResponse.status).toBe(201);
      
      // Retrieve user data
      const retrieveResponse = await axios.get(`${apiUrl}/users/${consistencyTestUserId}`);
      
      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.data.items.length).toBeGreaterThan(0);
      
      const retrievedData = retrieveResponse.data.items[0].data;
      expect(retrievedData).toEqual(complexData);
    });
  });

  describe('Security and Validation', () => {
    test('should handle special characters in user IDs', async () => {
      const specialUserId = `user-with-special-chars-${Date.now()}`;
      const payload = {
        userId: specialUserId,
        data: testUserData
      };
      
      const response = await axios.post(`${apiUrl}/users`, payload);
      expect(response.status).toBe(201);
      
      const retrieveResponse = await axios.get(`${apiUrl}/users/${specialUserId}`);
      expect(retrieveResponse.status).toBe(200);
    });

    test('should handle large payloads within limits', async () => {
      const largeUserId = `large-payload-test-${Date.now()}`;
      const largeData = {
        ...testUserData,
        largeText: 'x'.repeat(10000) // 10KB of text
      };
      
      const payload = {
        userId: largeUserId,
        data: largeData
      };
      
      const response = await axios.post(`${apiUrl}/users`, payload);
      expect(response.status).toBe(201);
      
      const retrieveResponse = await axios.get(`${apiUrl}/users/${largeUserId}`);
      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.data.items[0].data.largeText).toBe(largeData.largeText);
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    try {
      // Clean up test data from DynamoDB
      const testUsers = [testUserId];
      
      for (const userId of testUsers) {
        const params = {
          TableName: tableName,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: {
            ':uid': userId
          }
        };
        
        const result = await dynamodb.query(params).promise();
        
        for (const item of result.Items) {
          await dynamodb.delete({
            TableName: tableName,
            Key: {
              userId: item.userId,
              timestamp: item.timestamp
            }
          }).promise();
        }
      }
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  });
});
