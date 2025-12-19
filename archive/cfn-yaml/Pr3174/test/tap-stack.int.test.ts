// Configuration - These are coming from cfn-outputs after cdk deploy
import axios from 'axios';
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr45';

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
        expect(error.response.status).toBe(400);
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

  describe('Complete User Lifecycle Flow', () => {
    test('should execute complete flow', async () => {
      // Step 1: Create a new user with full profile
      console.log('Step 1: Creating user...');
      const newUserData = {
        email: `lifecycle-test-${Date.now()}@example.com`,
        firstName: 'Alice',
        lastName: 'Johnson',
        phoneNumber: '+1555123456',
        metadata: {
          signupSource: 'mobile-app',
          preferences: {
            notifications: true,
            newsletter: false
          }
        }
      };

      const createResponse = await axios.post(`${apiEndpoint}/users`, newUserData);
      expect(createResponse.status).toBe(201);
      expect(createResponse.data).toHaveProperty('userId');
      expect(createResponse.data.active).toBe(true);

      const userId = createResponse.data.userId;
      const createdAt = createResponse.data.createdAt;
      console.log(`User created with ID: ${userId}`);

      // Step 2: Retrieve the user and verify all fields
      console.log('Step 2: Retrieving user...');
      const getResponse = await axios.get(`${apiEndpoint}/users/${userId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.userId).toBe(userId);
      expect(getResponse.data.email).toBe(newUserData.email);
      expect(getResponse.data.firstName).toBe(newUserData.firstName);
      expect(getResponse.data.lastName).toBe(newUserData.lastName);
      expect(getResponse.data.phoneNumber).toBe(newUserData.phoneNumber);
      expect(getResponse.data.metadata).toEqual(newUserData.metadata);
      expect(getResponse.data.createdAt).toBe(createdAt);
      console.log('User retrieved successfully');

      // Step 3: Update user profile
      console.log('Step 3: Updating user profile...');
      const updateData = {
        firstName: 'Alicia',
        phoneNumber: '+1555987654',
        metadata: {
          signupSource: 'mobile-app',
          preferences: {
            notifications: false,
            newsletter: true
          },
          lastLogin: new Date().toISOString()
        }
      };

      const updateResponse = await axios.put(`${apiEndpoint}/users/${userId}`, updateData);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.firstName).toBe(updateData.firstName);
      expect(updateResponse.data.phoneNumber).toBe(updateData.phoneNumber);
      expect(updateResponse.data.lastName).toBe(newUserData.lastName); // Unchanged
      expect(updateResponse.data.email).toBe(newUserData.email); // Unchanged
      expect(updateResponse.data.metadata).toEqual(updateData.metadata);
      expect(updateResponse.data.updatedAt).not.toBe(createdAt);
      console.log('User updated successfully');

      // Step 4: Verify update persisted
      console.log('Step 4: Verifying update persisted...');
      const verifyResponse = await axios.get(`${apiEndpoint}/users/${userId}`);
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.data.firstName).toBe(updateData.firstName);
      expect(verifyResponse.data.phoneNumber).toBe(updateData.phoneNumber);
      expect(verifyResponse.data.metadata.lastLogin).toBeDefined();
      console.log('Update verified');

      // Step 5: List users and find our test user
      console.log('Step 5: Listing users...');
      const listResponse = await axios.get(`${apiEndpoint}/users?limit=50`);
      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.data.users)).toBe(true);

      const foundUser = listResponse.data.users.find((user: any) => user.userId === userId);
      expect(foundUser).toBeDefined();
      expect(foundUser.firstName).toBe(updateData.firstName);
      console.log(`Found user in list of ${listResponse.data.count} users`);

      // Step 6: Deactivate user (soft delete simulation)
      console.log('Step 6: Deactivating user...');
      const deactivateResponse = await axios.put(`${apiEndpoint}/users/${userId}`, {
        active: false
      });
      expect(deactivateResponse.status).toBe(200);
      expect(deactivateResponse.data.active).toBe(false);
      console.log('User deactivated');

      // Step 7: Verify deactivation
      console.log('Step 7: Verifying deactivation...');
      const deactivatedUserResponse = await axios.get(`${apiEndpoint}/users/${userId}`);
      expect(deactivatedUserResponse.status).toBe(200);
      expect(deactivatedUserResponse.data.active).toBe(false);
      console.log('Deactivation verified');

      // Step 8: Perform multiple partial updates
      console.log('Step 8: Performing multiple partial updates...');
      await axios.put(`${apiEndpoint}/users/${userId}`, {
        firstName: 'Alicia-Updated'
      });

      await axios.put(`${apiEndpoint}/users/${userId}`, {
        phoneNumber: '+1555111222'
      });

      const multiUpdateResponse = await axios.get(`${apiEndpoint}/users/${userId}`);
      expect(multiUpdateResponse.data.firstName).toBe('Alicia-Updated');
      expect(multiUpdateResponse.data.phoneNumber).toBe('+1555111222');
      expect(multiUpdateResponse.data.email).toBe(newUserData.email); // Still unchanged
      console.log('Multiple updates completed');

      // Step 9: Delete the user (hard delete)
      console.log('Step 9: Deleting user...');
      const deleteResponse = await axios.delete(`${apiEndpoint}/users/${userId}`);
      expect(deleteResponse.status).toBe(204);
      console.log('User deleted');

      console.log('Step 10: Verifying user removed from list...');
      const finalListResponse = await axios.get(`${apiEndpoint}/users?limit=100`);
      const deletedUserInList = finalListResponse.data.users.find((user: any) => user.userId === userId);
      expect(deletedUserInList).toBeUndefined();
      console.log('Complete lifecycle test passed! ✓');
    }, 30000); // 30 second timeout for complete flow
  });
});
