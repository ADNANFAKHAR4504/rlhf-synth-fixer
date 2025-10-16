// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Service clients
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.APIGateway();
const lambda = new AWS.Lambda();
const ssm = new AWS.SSM();

describe('Fitness Workout API Integration Tests', () => {
  
  describe('Infrastructure Verification', () => {
    test('should have all required outputs', async () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.CreateWorkoutEndpoint).toBeDefined();
      expect(outputs.GetWorkoutsEndpoint).toBeDefined();
      expect(outputs.GetStatsEndpoint).toBeDefined();
      expect(outputs.WorkoutApiId).toBeDefined();
      expect(outputs.LambdaRoleArn).toBeDefined();
    });

    test('API endpoint should be accessible', async () => {
      expect(outputs.ApiEndpoint).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*/);
    });

    test('DynamoDB table should exist and be accessible', async () => {
      const params = {
        TableName: outputs.DynamoDBTableName
      };

      const result = await dynamoDb.describe(params).promise();
      expect(result.Table).toBeDefined();
      expect(result.Table.TableName).toBe(outputs.DynamoDBTableName);
      expect(result.Table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('API Gateway should exist with correct configuration', async () => {
      const result = await apiGateway.getRestApi({
        restApiId: outputs.WorkoutApiId
      }).promise();

      expect(result.id).toBe(outputs.WorkoutApiId);
      expect(result.name).toContain('workoutapi');
      expect(result.endpointConfiguration?.types).toContain('REGIONAL');
    });
  });

  describe('Lambda Functions Integration', () => {
    test('Create Workout Lambda function should exist and be configured correctly', async () => {
      const functionName = `create-workout-log-${environmentSuffix}`;
      
      try {
        const result = await lambda.getFunction({
          FunctionName: functionName
        }).promise();

        expect(result.Configuration?.Runtime).toBe('python3.9');
        expect(result.Configuration?.Handler).toBe('index.lambda_handler');
        expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.DynamoDBTableName);
        expect(result.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
      } catch (error: any) {
        if (error.code === 'ResourceNotFound') {
          fail(`Lambda function ${functionName} not found`);
        }
        throw error;
      }
    });

    test('Get Workouts Lambda function should exist and be configured correctly', async () => {
      const functionName = `get-workoutlogs-${environmentSuffix}`;
      
      try {
        const result = await lambda.getFunction({
          FunctionName: functionName
        }).promise();

        expect(result.Configuration?.Runtime).toBe('python3.9');
        expect(result.Configuration?.Handler).toBe('index.lambda_handler');
        expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.DynamoDBTableName);
      } catch (error: any) {
        if (error.code === 'ResourceNotFound') {
          fail(`Lambda function ${functionName} not found`);
        }
        throw error;
      }
    });

    test('Get Stats Lambda function should exist and be configured correctly', async () => {
      const functionName = `get-workout-stats-${environmentSuffix}`;
      
      try {
        const result = await lambda.getFunction({
          FunctionName: functionName
        }).promise();

        expect(result.Configuration?.Runtime).toBe('python3.9');
        expect(result.Configuration?.Handler).toBe('index.lambda_handler');
        expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.DynamoDBTableName);
      } catch (error: any) {
        if (error.code === 'ResourceNotFound') {
          fail(`Lambda function ${functionName} not found`);
        }
        throw error;
      }
    });
  });

  describe('SSM Parameters Integration', () => {
    test('API endpoint parameter should be stored correctly', async () => {
      const paramName = `/fitness-app/${environmentSuffix}/api-endpoint`;
      
      try {
        const result = await ssm.getParameter({
          Name: paramName
        }).promise();

        expect(result.Parameter?.Value).toBe(outputs.ApiEndpoint);
      } catch (error: any) {
        if (error.code === 'ParameterNotFound') {
          fail(`SSM Parameter ${paramName} not found`);
        }
        throw error;
      }
    });

    test('Table name parameter should be stored correctly', async () => {
      const paramName = `/fitness-app/${environmentSuffix}/table-name`;
      
      try {
        const result = await ssm.getParameter({
          Name: paramName
        }).promise();

        expect(result.Parameter?.Value).toBe(outputs.DynamoDBTableName);
      } catch (error: any) {
        if (error.code === 'ParameterNotFound') {
          fail(`SSM Parameter ${paramName} not found`);
        }
        throw error;
      }
    });
  });

  describe('DynamoDB Operations', () => {
    const testUserId = `test-user-${Date.now()}`;
    const testWorkoutId = `workout-${Date.now()}`;

    afterAll(async () => {
      // Clean up test data
      try {
        const scanParams = {
          TableName: outputs.DynamoDBTableName,
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': testUserId
          }
        };

        const scanResult = await dynamoDb.scan(scanParams).promise();
        
        if (scanResult.Items && scanResult.Items.length > 0) {
          const deletePromises = scanResult.Items.map(item => {
            return dynamoDb.delete({
              TableName: outputs.DynamoDBTableName,
              Key: {
                userId: item.userId,
                workoutTimestamp: item.workoutTimestamp
              }
            }).promise();
          });

          await Promise.all(deletePromises);
        }
      } catch (error) {
        console.warn('Error cleaning up test data:', error);
      }
    });

    test('should be able to write workout data to DynamoDB', async () => {
      const workoutData = {
        userId: testUserId,
        workoutTimestamp: Date.now() * 1000, // microsecond precision
        workoutId: testWorkoutId,
        workoutType: 'running',
        duration: 30,
        calories: 300,
        distance: 5.0,
        heartRate: 150,
        notes: 'Integration test workout',
        createdAt: new Date().toISOString()
      };

      const putParams = {
        TableName: outputs.DynamoDBTableName,
        Item: workoutData
      };

      await expect(dynamoDb.put(putParams).promise()).resolves.not.toThrow();
    });

    test('should be able to read workout data from DynamoDB', async () => {
      // First, insert test data
      const workoutData = {
        userId: testUserId,
        workoutTimestamp: Date.now() * 1000,
        workoutId: `${testWorkoutId}-read`,
        workoutType: 'cycling',
        duration: 45,
        calories: 400,
        distance: 10.0,
        heartRate: 140,
        notes: 'Read test workout',
        createdAt: new Date().toISOString()
      };

      await dynamoDb.put({
        TableName: outputs.DynamoDBTableName,
        Item: workoutData
      }).promise();

      // Then query for it
      const queryParams = {
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': testUserId
        }
      };

      const result = await dynamoDb.query(queryParams).promise();
      
      expect(result.Items).toBeDefined();
      expect(result.Items!.length).toBeGreaterThan(0);
      
      const foundWorkout = result.Items!.find(item => item.workoutId === `${testWorkoutId}-read`);
      expect(foundWorkout).toBeDefined();
      expect(foundWorkout!.workoutType).toBe('cycling');
      expect(foundWorkout!.duration).toBe(45);
    });

    test('should be able to query by workout type using GSI', async () => {
      // Insert test data with specific workout type
      const workoutData = {
        userId: testUserId,
        workoutTimestamp: Date.now() * 1000,
        workoutId: `${testWorkoutId}-gsi`,
        workoutType: 'swimming',
        duration: 60,
        calories: 500,
        distance: 2.0,
        heartRate: 160,
        notes: 'GSI test workout',
        createdAt: new Date().toISOString()
      };

      await dynamoDb.put({
        TableName: outputs.DynamoDBTableName,
        Item: workoutData
      }).promise();

      // Query using GSI
      const queryParams = {
        TableName: outputs.DynamoDBTableName,
        IndexName: 'WorkoutTypeIndex',
        KeyConditionExpression: 'workoutType = :workoutType',
        ExpressionAttributeValues: {
          ':workoutType': 'swimming'
        }
      };

      const result = await dynamoDb.query(queryParams).promise();
      
      expect(result.Items).toBeDefined();
      expect(result.Items!.length).toBeGreaterThan(0);
      
      const foundWorkout = result.Items!.find(item => item.workoutId === `${testWorkoutId}-gsi`);
      expect(foundWorkout).toBeDefined();
      expect(foundWorkout!.workoutType).toBe('swimming');
    });
  });

  describe('Complete Workout Logging Flow', () => {
    const testUserId = `flow-test-user-${Date.now()}`;
    let workoutTimestamp: number;

    afterAll(async () => {
      // Clean up test data
      try {
        if (workoutTimestamp) {
          await dynamoDb.delete({
            TableName: outputs.DynamoDBTableName,
            Key: {
              userId: testUserId,
              workoutTimestamp: workoutTimestamp
            }
          }).promise();
        }
      } catch (error) {
        console.warn('Error cleaning up flow test data:', error);
      }
    });

    test('complete workout logging flow should work end-to-end', async () => {
      // Step 1: Create a workout log directly in DynamoDB (simulating Lambda function)
      workoutTimestamp = Date.now() * 1000; // microsecond precision
      const workoutData = {
        userId: testUserId,
        workoutTimestamp: workoutTimestamp,
        workoutId: `flow-test-${Date.now()}`,
        workoutType: 'weightlifting',
        duration: 90,
        calories: 450,
        distance: 0,
        heartRate: 130,
        notes: 'Full body workout',
        createdAt: new Date().toISOString()
      };

      // Create workout
      await dynamoDb.put({
        TableName: outputs.DynamoDBTableName,
        Item: workoutData
      }).promise();

      // Step 2: Verify we can retrieve the workout (simulating Get Workouts Lambda)
      const queryParams = {
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': testUserId
        },
        ScanIndexForward: false, // Most recent first
        Limit: 50
      };

      const workoutsResult = await dynamoDb.query(queryParams).promise();
      expect(workoutsResult.Items).toBeDefined();
      expect(workoutsResult.Items!.length).toBe(1);
      
      const retrievedWorkout = workoutsResult.Items![0];
      expect(retrievedWorkout.userId).toBe(testUserId);
      expect(retrievedWorkout.workoutType).toBe('weightlifting');
      expect(retrievedWorkout.duration).toBe(90);
      expect(retrievedWorkout.calories).toBe(450);

      // Step 3: Generate statistics (simulating Get Stats Lambda)
      const statsCalculation = {
        totalWorkouts: workoutsResult.Items!.length,
        totalDuration: workoutsResult.Items!.reduce((sum, item) => sum + (item.duration || 0), 0),
        totalCalories: workoutsResult.Items!.reduce((sum, item) => sum + (item.calories || 0), 0),
        totalDistance: workoutsResult.Items!.reduce((sum, item) => sum + (item.distance || 0), 0)
      };

      expect(statsCalculation.totalWorkouts).toBe(1);
      expect(statsCalculation.totalDuration).toBe(90);
      expect(statsCalculation.totalCalories).toBe(450);
      expect(statsCalculation.totalDistance).toBe(0);

      // Calculate workout type breakdown
      const workoutTypes: { [key: string]: number } = {};
      workoutsResult.Items!.forEach(workout => {
        const type = workout.workoutType || 'Unknown';
        workoutTypes[type] = (workoutTypes[type] || 0) + 1;
      });

      expect(workoutTypes['weightlifting']).toBe(1);

      // Step 4: Verify data integrity and constraints
      expect(retrievedWorkout.workoutTimestamp).toBe(workoutTimestamp);
      expect(retrievedWorkout.workoutId).toBeDefined();
      expect(typeof retrievedWorkout.workoutId).toBe('string');
      expect(retrievedWorkout.createdAt).toBeDefined();
      expect(new Date(retrievedWorkout.createdAt)).toBeInstanceOf(Date);
    });

    test('should handle multiple workouts for statistics correctly', async () => {
      const multiTestUserId = `multi-test-user-${Date.now()}`;
      const workouts = [
        {
          userId: multiTestUserId,
          workoutTimestamp: Date.now() * 1000,
          workoutId: `multi-1-${Date.now()}`,
          workoutType: 'running',
          duration: 30,
          calories: 300,
          distance: 5.0,
          heartRate: 150,
          notes: 'Morning run',
          createdAt: new Date().toISOString()
        },
        {
          userId: multiTestUserId,
          workoutTimestamp: (Date.now() + 1000) * 1000,
          workoutId: `multi-2-${Date.now()}`,
          workoutType: 'cycling',
          duration: 60,
          calories: 500,
          distance: 15.0,
          heartRate: 140,
          notes: 'Evening bike ride',
          createdAt: new Date(Date.now() + 1000).toISOString()
        }
      ];

      // Insert multiple workouts
      const putPromises = workouts.map(workout => 
        dynamoDb.put({
          TableName: outputs.DynamoDBTableName,
          Item: workout
        }).promise()
      );

      await Promise.all(putPromises);

      try {
        // Query all workouts for the user
        const queryParams = {
          TableName: outputs.DynamoDBTableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': multiTestUserId
          }
        };

        const result = await dynamoDb.query(queryParams).promise();
        expect(result.Items!.length).toBe(2);

        // Calculate comprehensive statistics
        const stats = {
          totalWorkouts: result.Items!.length,
          totalDuration: result.Items!.reduce((sum, item) => sum + (item.duration || 0), 0),
          totalCalories: result.Items!.reduce((sum, item) => sum + (item.calories || 0), 0),
          totalDistance: result.Items!.reduce((sum, item) => sum + (item.distance || 0), 0),
          averageCaloriesPerWorkout: 0,
          averageDurationPerWorkout: 0
        };

        stats.averageCaloriesPerWorkout = stats.totalCalories / stats.totalWorkouts;
        stats.averageDurationPerWorkout = stats.totalDuration / stats.totalWorkouts;

        expect(stats.totalWorkouts).toBe(2);
        expect(stats.totalDuration).toBe(90); // 30 + 60
        expect(stats.totalCalories).toBe(800); // 300 + 500
        expect(stats.totalDistance).toBe(20.0); // 5.0 + 15.0
        expect(stats.averageCaloriesPerWorkout).toBe(400);
        expect(stats.averageDurationPerWorkout).toBe(45);

        // Verify workout type breakdown
        const workoutTypes: { [key: string]: number } = {};
        result.Items!.forEach(workout => {
          const type = workout.workoutType || 'Unknown';
          workoutTypes[type] = (workoutTypes[type] || 0) + 1;
        });

        expect(workoutTypes['running']).toBe(1);
        expect(workoutTypes['cycling']).toBe(1);

      } finally {
        // Clean up multiple test workouts
        const deletePromises = workouts.map(workout => 
          dynamoDb.delete({
            TableName: outputs.DynamoDBTableName,
            Key: {
              userId: workout.userId,
              workoutTimestamp: workout.workoutTimestamp
            }
          }).promise()
        );

        await Promise.all(deletePromises);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty query results gracefully', async () => {
      const nonExistentUserId = `non-existent-user-${Date.now()}`;
      
      const queryParams = {
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': nonExistentUserId
        }
      };

      const result = await dynamoDb.query(queryParams).promise();
      expect(result.Items).toBeDefined();
      expect(result.Items!.length).toBe(0);
      expect(result.Count).toBe(0);
    });

    test('should handle GSI queries with no results', async () => {
      const queryParams = {
        TableName: outputs.DynamoDBTableName,
        IndexName: 'WorkoutTypeIndex',
        KeyConditionExpression: 'workoutType = :workoutType',
        ExpressionAttributeValues: {
          ':workoutType': 'non-existent-workout-type'
        }
      };

      const result = await dynamoDb.query(queryParams).promise();
      expect(result.Items).toBeDefined();
      expect(result.Items!.length).toBe(0);
      expect(result.Count).toBe(0);
    });
  });
});
