// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('User Profile API Integration Tests', () => {
  const apiEndpoint = outputs.ApiEndpoint;
  let testUserId: string;
  
  beforeAll(() => {
    expect(apiEndpoint).toBeDefined();
    expect(apiEndpoint).toContain('https://');
  });

  describe('User Profile CRUD Operations', () => {
    test('should create a new user profile', async () => {
      const newUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890'
      };

      const response = await axios.post(`${apiEndpoint}/users`, newUser);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('userId');
      expect(response.data.email).toBe(newUser.email);
      expect(response.data.firstName).toBe(newUser.firstName);
      expect(response.data.lastName).toBe(newUser.lastName);
      expect(response.data.phoneNumber).toBe(newUser.phoneNumber);
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('updatedAt');
      expect(response.data.active).toBe(true);

      testUserId = response.data.userId;
    });

    test('should retrieve a user profile by ID', async () => {
      const response = await axios.get(`${apiEndpoint}/users/${testUserId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.userId).toBe(testUserId);
      expect(response.data.email).toBe('test@example.com');
      expect(response.data.firstName).toBe('John');
      expect(response.data.lastName).toBe('Doe');
    });

    test('should update a user profile', async () => {
      const updatedData = {
        firstName: 'Jane',
        phoneNumber: '+0987654321'
      };

      const response = await axios.put(`${apiEndpoint}/users/${testUserId}`, updatedData);
      
      expect(response.status).toBe(200);
      expect(response.data.userId).toBe(testUserId);
      expect(response.data.firstName).toBe('Jane');
      expect(response.data.phoneNumber).toBe('+0987654321');
      expect(response.data.lastName).toBe('Doe'); // Should remain unchanged
      expect(response.data).toHaveProperty('updatedAt');
    });

    test('should list all users', async () => {
      const response = await axios.get(`${apiEndpoint}/users`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('users');
      expect(response.data).toHaveProperty('count');
      expect(Array.isArray(response.data.users)).toBe(true);
      expect(response.data.count).toBeGreaterThan(0);
      
      // Find our test user in the list
      const testUser = response.data.users.find((user: any) => user.userId === testUserId);
      expect(testUser).toBeDefined();
    });

    test('should list users with pagination', async () => {
      const response = await axios.get(`${apiEndpoint}/users?limit=1`);
      
      expect(response.status).toBe(200);
      expect(response.data.users).toHaveLength(1);
      expect(response.data.count).toBe(1);
    });

    test('should delete a user profile', async () => {
      const response = await axios.delete(`${apiEndpoint}/users/${testUserId}`);
      
      expect(response.status).toBe(204);
    });

    test('should return 404 for deleted user', async () => {
      try {
        await axios.get(`${apiEndpoint}/users/${testUserId}`);
        fail('Expected request to fail with 404');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('User not found');
      }
    });
  });

  describe('API Validation', () => {
    test('should reject user creation with missing required fields', async () => {
      const invalidUser = {
        email: 'incomplete@example.com'
        // Missing firstName and lastName
      };

      try {
        await axios.post(`${apiEndpoint}/users`, invalidUser);
        fail('Expected request to fail with 400');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });

    test('should handle invalid user ID', async () => {
      try {
        await axios.get(`${apiEndpoint}/users/invalid-user-id`);
        fail('Expected request to fail with 404');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('User not found');
      }
    });

    test('should handle invalid JSON in request body', async () => {
      try {
        await axios.post(`${apiEndpoint}/users`, 'invalid json', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        fail('Expected request to fail with 400');
      } catch (error: any) {
        expect(error.response.status).toBe(500); // Lambda will return 500 for JSON parse errors
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  describe('CORS Support', () => {
    test('should handle OPTIONS requests for CORS', async () => {
      const response = await axios.options(`${apiEndpoint}/users`);
      
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    test('should include CORS headers in all responses', async () => {
      // Create a test user to verify CORS headers
      const testUser = {
        email: 'cors-test@example.com',
        firstName: 'CORS',
        lastName: 'Test'
      };

      const response = await axios.post(`${apiEndpoint}/users`, testUser);
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      
      // Clean up
      await axios.delete(`${apiEndpoint}/users/${response.data.userId}`);
    });
  });

  describe('Infrastructure Validation', () => {
    test('should validate required outputs are available', () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableArn).toBeDefined();
      expect(outputs.Environment).toBeDefined();
    });

    test('should validate Lambda function outputs are available', () => {
      expect(outputs.CreateUserFunctionArn).toBeDefined();
      expect(outputs.GetUserFunctionArn).toBeDefined();
      expect(outputs.UpdateUserFunctionArn).toBeDefined();
      expect(outputs.DeleteUserFunctionArn).toBeDefined();
      expect(outputs.ListUsersFunctionArn).toBeDefined();
    });

    test('API endpoint should be properly formatted', () => {
      expect(outputs.ApiEndpoint).toMatch(/^https:\/\/[\w-]+\.execute-api\.[\w-]+\.amazonaws\.com\/[\w-]+$/);
    });

    test('DynamoDB table name should include environment suffix', () => {
      expect(outputs.DynamoDBTableName).toContain(environmentSuffix);
    });

    test('Lambda function ARNs should be valid', () => {
      const functionArns = [
        outputs.CreateUserFunctionArn,
        outputs.GetUserFunctionArn,
        outputs.UpdateUserFunctionArn,
        outputs.DeleteUserFunctionArn,
        outputs.ListUsersFunctionArn
      ];

      functionArns.forEach(arn => {
        expect(arn).toMatch(/^arn:aws:lambda:[\w-]+:\d+:function:[\w-]+$/);
      });
    });
  });
});
