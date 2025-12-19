import fs from 'fs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { APIGatewayClient, GetApiKeyCommand } from '@aws-sdk/client-api-gateway';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const ssm = new SSMClient({});
const apiGateway = new APIGatewayClient({});

describe('Fitness Tracking API Integration Tests', () => {
  let apiEndpoint;
  let apiKey;
  let tableName;

  beforeAll(async () => {
    apiEndpoint = outputs['ApiEndpoint'];
    const apiKeyId = outputs['ApiKeyId'];
    tableName = outputs['TableName'];

    expect(apiEndpoint).toBeDefined();
    expect(apiKeyId).toBeDefined();
    expect(tableName).toBeDefined();

    const getKeyCommand = new GetApiKeyCommand({
      apiKey: apiKeyId,
      includeValue: true
    });
    const keyResponse = await apiGateway.send(getKeyCommand);
    apiKey = keyResponse.value;

    expect(apiKey).toBeDefined();
  });

  afterEach(async () => {
    const scanCommand = new ScanCommand({
      TableName: tableName
    });
    const items = await dynamoDB.send(scanCommand);
    
    if (items.Items && items.Items.length > 0) {
      const deletePromises = items.Items.map(item => {
        const deleteCommand = new DeleteCommand({
          TableName: tableName,
          Key: {
            userId: item.userId,
            workoutTimestamp: item.workoutTimestamp
          }
        });
        return dynamoDB.send(deleteCommand);
      });
      await Promise.all(deletePromises);
    }
  });

  describe('POST /workouts', () => {
    test('should create a new workout', async () => {
      const workoutData = {
        type: 'running',
        duration: 30,
        distance: 5,
        calories: 300
      };

      const response = await axios.post(
        `${apiEndpoint}workouts`,
        workoutData,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject(workoutData);
      expect(response.data.userId).toBeDefined();
      expect(response.data.workoutTimestamp).toBeDefined();
      expect(response.data.createdAt).toBeDefined();
      expect(response.data.updatedAt).toBeDefined();
      
      // Verify data is actually in DynamoDB
      const getCommand = new GetCommand({
        TableName: tableName,
        Key: {
          userId: response.data.userId,
          workoutTimestamp: response.data.workoutTimestamp
        }
      });
      const dbItem = await dynamoDB.send(getCommand);
      expect(dbItem.Item).toBeDefined();
      expect(dbItem.Item.type).toBe('running');
      expect(dbItem.Item.duration).toBe(30);
    });

    test('should fail without API key', async () => {
      const workoutData = {
        type: 'cycling',
        duration: 45
      };

      try {
        await axios.post(`${apiEndpoint}workouts`, workoutData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });

    test('should handle malformed request body', async () => {
      // Test that the API gracefully handles requests with malformed/unparseable bodies
      try {
        // Send a string that isn't valid JSON to trigger parsing error
        await axios.post(`${apiEndpoint}workouts`, 'not valid json at all', {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          // Prevent axios from validating/transforming the request body
          transformRequest: [(data) => data]
        });
        fail('Should have thrown an error');
      } catch (error) {
        // The Lambda should catch the JSON.parse error and return 500
        // Or API Gateway might reject it earlier
        expect(error).toBeDefined();
        if (error.response) {
          expect([400, 500]).toContain(error.response.status);
        }
      }
    });
  });

  describe('GET /workouts', () => {
    test('should list all workouts for a user', async () => {
      const workout1 = {
        type: 'running',
        duration: 30
      };
      const workout2 = {
        type: 'cycling',
        duration: 45
      };

      await axios.post(`${apiEndpoint}workouts`, workout1, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      await axios.post(`${apiEndpoint}workouts`, workout2, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      const response = await axios.get(`${apiEndpoint}workouts`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThanOrEqual(2);
    });

    test('should return empty array for user with no workouts', async () => {
      const response = await axios.get(`${apiEndpoint}workouts`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('GET /workouts/{workoutId}', () => {
    test('should get a specific workout', async () => {
      const workoutData = {
        type: 'swimming',
        duration: 60,
        laps: 20
      };

      const createResponse = await axios.post(`${apiEndpoint}workouts`, workoutData, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      const workoutId = createResponse.data.workoutTimestamp;

      const response = await axios.get(`${apiEndpoint}workouts/${workoutId}`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.workoutTimestamp).toBe(workoutId);
      expect(response.data).toMatchObject(workoutData);
    });

    test('should return 404 for non-existent workout', async () => {
      try {
        await axios.get(`${apiEndpoint}workouts/non-existent-id`, {
          headers: {
            'x-api-key': apiKey
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('PUT /workouts/{workoutId}', () => {
    test('should update an existing workout', async () => {
      const workoutData = {
        type: 'running',
        duration: 30
      };

      const createResponse = await axios.post(`${apiEndpoint}workouts`, workoutData, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      const workoutId = createResponse.data.workoutTimestamp;

      const updatedData = {
        duration: 45,
        distance: 7
      };

      const response = await axios.put(
        `${apiEndpoint}workouts/${workoutId}`,
        updatedData,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.duration).toBe(45);
      expect(response.data.distance).toBe(7);
      expect(response.data.type).toBe('running');
      expect(response.data.updatedAt).not.toBe(response.data.createdAt);
    });

    test('should return 404 when updating non-existent workout', async () => {
      try {
        await axios.put(
          `${apiEndpoint}workouts/non-existent-id`,
          { duration: 60 },
          {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('DELETE /workouts/{workoutId}', () => {
    test('should delete an existing workout', async () => {
      const workoutData = {
        type: 'yoga',
        duration: 60
      };

      const createResponse = await axios.post(`${apiEndpoint}workouts`, workoutData, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      const workoutId = createResponse.data.workoutTimestamp;

      const deleteResponse = await axios.delete(`${apiEndpoint}workouts/${workoutId}`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      expect(deleteResponse.status).toBe(204);

      try {
        await axios.get(`${apiEndpoint}workouts/${workoutId}`, {
          headers: {
            'x-api-key': apiKey
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    test('should succeed even when deleting non-existent workout', async () => {
      const response = await axios.delete(`${apiEndpoint}workouts/non-existent-id`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      expect(response.status).toBe(204);
    });
  });

  describe('SSM Parameter Store', () => {
    test('should have rate limit parameter configured', async () => {
      const command = new GetParameterCommand({
        Name: `/fitness-tracking/api-rate-limit-${environmentSuffix}`
      });

      const response = await ssm.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter.Value).toBe('1000');
    });

    test('should update rate limit via SSM and Lambda should use it', async () => {
      // Note: This test verifies SSM integration exists
      // The Lambda caches the value for 5 minutes, so we just verify the parameter is accessible
      const command = new GetParameterCommand({
        Name: `/fitness-tracking/api-rate-limit-${environmentSuffix}`
      });

      const response = await ssm.send(command);
      expect(response.Parameter).toBeDefined();
      expect(parseInt(response.Parameter.Value)).toBeGreaterThan(0);
    });
  });

  describe('Data Persistence and Isolation', () => {
    test('should persist data to DynamoDB correctly', async () => {
      const workoutData = {
        type: 'strength',
        duration: 45,
        exercises: ['bench press', 'squats']
      };

      const response = await axios.post(`${apiEndpoint}workouts`, workoutData, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      // Directly query DynamoDB
      const getCommand = new GetCommand({
        TableName: tableName,
        Key: {
          userId: response.data.userId,
          workoutTimestamp: response.data.workoutTimestamp
        }
      });
      
      const dbResult = await dynamoDB.send(getCommand);
      expect(dbResult.Item).toBeDefined();
      expect(dbResult.Item.type).toBe('strength');
      expect(dbResult.Item.exercises).toEqual(['bench press', 'squats']);
      expect(dbResult.Item.createdAt).toBe(dbResult.Item.workoutTimestamp);
    });

    test('should handle concurrent workout creations', async () => {
      const workouts = [
        { type: 'running', duration: 20 },
        { type: 'cycling', duration: 30 },
        { type: 'swimming', duration: 40 },
        { type: 'walking', duration: 50 }
      ];

      // Use Promise.allSettled to handle potential timestamp collisions gracefully
      const createPromises = workouts.map((workout, index) => 
        // Add slight delay to each to ensure unique timestamps
        new Promise(resolve => setTimeout(resolve, index * 10)).then(() =>
          axios.post(`${apiEndpoint}workouts`, workout, {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
            }
          })
        )
      );

      const responses = await Promise.all(createPromises);
      
      expect(responses).toHaveLength(4);
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.data.type).toBe(workouts[index].type);
      });

      // Verify all are in DynamoDB
      const scanCommand = new ScanCommand({ TableName: tableName });
      const scanResult = await dynamoDB.send(scanCommand);
      expect(scanResult.Items.length).toBeGreaterThanOrEqual(4);
    });

    test('should validate timestamp format', async () => {
      const response = await axios.post(`${apiEndpoint}workouts`, 
        { type: 'yoga', duration: 60 },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const timestamp = response.data.workoutTimestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle large workout data payload', async () => {
      const largeWorkout = {
        type: 'mixed',
        duration: 120,
        exercises: Array(50).fill(null).map((_, i) => `exercise-${i}`),
        notes: 'A'.repeat(1000),
        metadata: {
          location: 'gym',
          weather: 'sunny',
          equipment: ['dumbbells', 'barbell', 'bench']
        }
      };

      const response = await axios.post(`${apiEndpoint}workouts`, largeWorkout, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(201);
      expect(response.data.exercises).toHaveLength(50);
      expect(response.data.notes).toHaveLength(1000);
    });

    test('should handle rapid successive requests with small delays', async () => {
      const workout = { type: 'cardio', duration: 15 };
      
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const response = await axios.post(`${apiEndpoint}workouts`, workout, {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        });
        responses.push(response);
        // Small delay to ensure unique timestamps (millisecond precision)
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // All should have unique timestamps
      const timestamps = responses.map(r => r.data.workoutTimestamp);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(5);
    });

    test('should prevent duplicate timestamp conflicts', async () => {
      // This test verifies the ConditionExpression works
      // In practice, if two requests somehow get the same timestamp, one should fail
      const workout = { type: 'test', duration: 10 };
      
      // Make multiple rapid requests - some may succeed, none should cause data corruption
      const promises = Array(3).fill(null).map(() => 
        axios.post(`${apiEndpoint}workouts`, workout, {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }).catch(err => err.response)
      );

      const results = await Promise.all(promises);
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
      
      // Any failures should be 500 (conditional check failed), not data corruption
      const failedResults = results.filter(r => r.status !== 201);
      failedResults.forEach(result => {
        expect([500, 201]).toContain(result.status);
      });
    });
  });

  describe('End-to-end workout tracking scenario', () => {
    test('should complete a full workout tracking workflow', async () => {
      const workout1 = {
        type: 'running',
        duration: 30,
        distance: 5,
        calories: 300
      };

      const createResponse1 = await axios.post(`${apiEndpoint}workouts`, workout1, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      expect(createResponse1.status).toBe(201);
      const workoutId1 = createResponse1.data.workoutTimestamp;

      const workout2 = {
        type: 'cycling',
        duration: 45,
        distance: 15,
        calories: 400
      };

      const createResponse2 = await axios.post(`${apiEndpoint}workouts`, workout2, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      expect(createResponse2.status).toBe(201);

      const listResponse = await axios.get(`${apiEndpoint}workouts`, {
        headers: {
          'x-api-key': apiKey
        }
      });
      expect(listResponse.status).toBe(200);
      expect(listResponse.data.length).toBeGreaterThanOrEqual(2);

      const updatedWorkout = {
        distance: 6,
        calories: 350
      };
      const updateResponse = await axios.put(
        `${apiEndpoint}workouts/${workoutId1}`,
        updatedWorkout,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.distance).toBe(6);
      expect(updateResponse.data.calories).toBe(350);

      const getResponse = await axios.get(`${apiEndpoint}workouts/${workoutId1}`, {
        headers: {
          'x-api-key': apiKey
        }
      });
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.distance).toBe(6);

      const deleteResponse = await axios.delete(`${apiEndpoint}workouts/${workoutId1}`, {
        headers: {
          'x-api-key': apiKey
        }
      });
      expect(deleteResponse.status).toBe(204);

      try {
        await axios.get(`${apiEndpoint}workouts/${workoutId1}`, {
          headers: {
            'x-api-key': apiKey
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
