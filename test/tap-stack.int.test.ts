// Configuration - These are coming from cfn-outputs after deployment
import AWS from 'aws-sdk';
import axios from 'axios';
import fs from 'fs';
// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);


// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
AWS.config.update({ region: awsRegion });
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

  describe('Complete End-to-End Flow', () => {
    test('should validate complete system integration: API Gateway -> Lambda -> DynamoDB -> CloudWatch -> Parameter Store with IAM security', async () => {
      const e2eUserId = `e2e-test-${Date.now()}`;
      const e2eUserData = {
        name: 'End-to-End Test User',
        email: 'e2e@example.com',
        region: awsRegion,
        accountType: 'premium'
      };

      // Step 1: Verify Parameter Store configuration is accessible
      const configParams = await ssm.getParameters({
        Names: [
          `${parameterPrefix}/config/max-retries`,
          `${parameterPrefix}/config/timeout`,
          `${parameterPrefix}/config/rate-limit`
        ]
      }).promise();

      expect(configParams.Parameters).toBeDefined();
      expect(configParams.Parameters?.length).toBe(3);

      const maxRetries = configParams.Parameters?.find(p => p.Name?.includes('max-retries'));
      const timeout = configParams.Parameters?.find(p => p.Name?.includes('timeout'));
      const rateLimit = configParams.Parameters?.find(p => p.Name?.includes('rate-limit'));

      expect(maxRetries?.Value).toBe('3');
      expect(timeout?.Value).toBe('30');
      expect(rateLimit?.Value).toBe('1000');

      // Step 2: Call API Gateway endpoint to create user (triggers Lambda)
      const createStartTime = Date.now();
      const createResponse = await axios.post(`${apiUrl}/users`, {
        userId: e2eUserId,
        data: e2eUserData
      });
      const createDuration = Date.now() - createStartTime;

      expect(createResponse.status).toBe(201);
      expect(createResponse.data.message).toBe('User created successfully');
      expect(createResponse.data.userId).toBe(e2eUserId);
      expect(createResponse.headers['content-type']).toContain('application/json');

      // Step 3: Verify Lambda execution by checking CloudWatch Logs
      await new Promise(resolve => setTimeout(resolve, 2000));

      const lambda = new AWS.Lambda();
      const functionConfig = await lambda.getFunctionConfiguration({
        FunctionName: lambdaArn.split(':').pop() || ''
      }).promise();

      expect(functionConfig.FunctionName).toContain('api-handler');
      expect(functionConfig.Runtime).toBe('python3.10');
      expect(functionConfig.Handler).toBe('index.lambda_handler');
      expect(functionConfig.Timeout).toBe(30);
      expect(functionConfig.MemorySize).toBe(256);
      expect(functionConfig.Environment?.Variables?.TABLE_NAME).toBe(tableName);
      expect(functionConfig.Environment?.Variables?.ENVIRONMENT).toBeDefined();

      // Step 4: Verify data was written to DynamoDB
      const dbQueryParams = {
        TableName: tableName,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': e2eUserId
        }
      };

      const dbResult: any = await dynamodb.query(dbQueryParams).promise();
      expect(dbResult.Items).toBeDefined();
      expect(dbResult.Items.length).toBeGreaterThan(0);

      const storedItem = dbResult.Items[0];
      expect(storedItem.userId).toBe(e2eUserId);
      expect(storedItem.data).toEqual(e2eUserData);
      expect(storedItem.timestamp).toBeDefined();
      expect(storedItem.createdAt).toBeDefined();

      // Step 5: Retrieve user data via API Gateway (triggers Lambda read operation)
      const retrieveStartTime = Date.now();
      const retrieveResponse = await axios.get(`${apiUrl}/users/${e2eUserId}`);
      const retrieveDuration = Date.now() - retrieveStartTime;

      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.data.items).toBeDefined();
      expect(retrieveResponse.data.items.length).toBeGreaterThan(0);

      const retrievedUser = retrieveResponse.data.items[0];
      expect(retrievedUser.userId).toBe(e2eUserId);
      expect(retrievedUser.data).toEqual(e2eUserData);

      // Step 6: Verify CloudWatch custom metrics were published
      await new Promise(resolve => setTimeout(resolve, 3000));

      const userCreatedMetric = await cloudwatch.getMetricStatistics({
        Namespace: `ServerlessAPI/${environmentSuffix}`,
        MetricName: 'UserCreated',
        StartTime: new Date(Date.now() - 10 * 60 * 1000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(userCreatedMetric.Datapoints).toBeDefined();

      const userQueriedMetric = await cloudwatch.getMetricStatistics({
        Namespace: `ServerlessAPI/${environmentSuffix}`,
        MetricName: 'UserQueried',
        StartTime: new Date(Date.now() - 10 * 60 * 1000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(userQueriedMetric.Datapoints).toBeDefined();

      // Step 7: Verify Lambda CloudWatch metrics
      const lambdaInvocations = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [{
          Name: 'FunctionName',
          Value: functionConfig.FunctionName || ''
        }],
        StartTime: new Date(Date.now() - 10 * 60 * 1000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(lambdaInvocations.Datapoints).toBeDefined();

      // Step 8: Verify API Gateway metrics
      const apiGatewayRequests = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/ApiGateway',
        MetricName: 'Count',
        Dimensions: [{
          Name: 'ApiName',
          Value: `serverless-api-${environmentSuffix}`
        }],
        StartTime: new Date(Date.now() - 10 * 60 * 1000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(apiGatewayRequests.Datapoints).toBeDefined();

      // Step 9: Verify DynamoDB metrics
      const dynamoDbWrites = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/DynamoDB',
        MetricName: 'ConsumedWriteCapacityUnits',
        Dimensions: [{
          Name: 'TableName',
          Value: tableName
        }],
        StartTime: new Date(Date.now() - 10 * 60 * 1000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(dynamoDbWrites.Datapoints).toBeDefined();

      // Step 10: Verify IAM role and permissions
      const iam = new AWS.IAM();
      const roleNameFromArn = functionConfig.Role?.split('/').pop();

      if (roleNameFromArn) {
        const roleDetails = await iam.getRole({
          RoleName: roleNameFromArn
        }).promise();

        expect(roleDetails.Role).toBeDefined();
        expect(roleDetails.Role.AssumeRolePolicyDocument).toBeDefined();

        const assumePolicy = JSON.parse(decodeURIComponent(roleDetails.Role.AssumeRolePolicyDocument || '{}'));
        const lambdaService = assumePolicy.Statement?.find(
          (s: any) => s.Principal?.Service === 'lambda.amazonaws.com'
        );
        expect(lambdaService).toBeDefined();

        const rolePolicies = await iam.listAttachedRolePolicies({
          RoleName: roleNameFromArn
        }).promise();

        const hasBasicExecution = rolePolicies.AttachedPolicies?.some(
          p => p.PolicyArn?.includes('AWSLambdaBasicExecutionRole')
        );
        expect(hasBasicExecution).toBe(true);

        const inlinePolicies = await iam.listRolePolicies({
          RoleName: roleNameFromArn
        }).promise();

        expect(inlinePolicies.PolicyNames?.length).toBeGreaterThan(0);

        if (inlinePolicies.PolicyNames && inlinePolicies.PolicyNames.length > 0) {
          const policyDocument = await iam.getRolePolicy({
            RoleName: roleNameFromArn,
            PolicyName: inlinePolicies.PolicyNames[0]
          }).promise();

          const policy = JSON.parse(decodeURIComponent(policyDocument.PolicyDocument || '{}'));
          const dynamoStatement = policy.Statement?.find(
            (s: any) => s.Action?.some((a: string) => a.includes('dynamodb'))
          );
          expect(dynamoStatement).toBeDefined();

          const ssmStatement = policy.Statement?.find(
            (s: any) => s.Action?.some((a: string) => a.includes('ssm'))
          );
          expect(ssmStatement).toBeDefined();

          const cloudwatchStatement = policy.Statement?.find(
            (s: any) => s.Action?.some((a: string) => a.includes('cloudwatch'))
          );
          expect(cloudwatchStatement).toBeDefined();
        }
      }

      // Step 11: Performance validation
      expect(createDuration).toBeLessThan(3000);
      expect(retrieveDuration).toBeLessThan(3000);

      // Step 12: Data consistency validation
      expect(retrievedUser.data).toEqual(storedItem.data);
      expect(retrievedUser.timestamp).toBe(storedItem.timestamp);

      // Step 13: Health check validation
      const healthResponse = await axios.get(`${apiUrl}/health`);
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data.status).toBe('healthy');
      expect(healthResponse.data.environment).toBeDefined();

      // Cleanup test data
      await dynamodb.delete({
        TableName: tableName,
        Key: {
          userId: storedItem.userId,
          timestamp: storedItem.timestamp
        }
      }).promise();
    }, 30000);
  });

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
      } catch (error: any) {
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

      const result: any = await dynamodb.query(params).promise();
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
    test('should return 403 for unknown endpoints', async () => {
      try {
        await axios.get(`${apiUrl}/unknown-endpoint`);
        fail('Expected request to fail with 403');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });

    test('should handle malformed JSON in POST requests', async () => {
      try {
        await axios.post(`${apiUrl}/users`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }
    });
  });

  describe('Parameter Store Integration', () => {
    test('should have all required configuration parameters', async () => {
      const requiredParams = ['max-retries', 'timeout', 'rate-limit'];

      for (const param of requiredParams) {
        const paramName = `${parameterPrefix}/config/${param}`;

        const result: any = await ssm.getParameter({ Name: paramName }).promise();
        expect(result.Parameter).toBeDefined();
        expect(result.Parameter.Value).toBeDefined();
      }
    });

    test('should have correct parameter values', async () => {
      const maxRetriesParam: any = await ssm.getParameter({
        Name: `${parameterPrefix}/config/max-retries`
      }).promise();

      const timeoutParam: any = await ssm.getParameter({
        Name: `${parameterPrefix}/config/timeout`
      }).promise();

      const rateLimitParam: any = await ssm.getParameter({
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

        const result: any = await dynamodb.query(params).promise();

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
    } catch (error: any) {
      console.warn('Error during cleanup:', error.message);
    }
  });
});