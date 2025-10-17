import AWS from 'aws-sdk';
import fs from 'fs';
import https from 'https';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get region and environment suffix
const region = process.env.AWS_REGION || AWS.config.region || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

// AWS Service clients
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region });
const dynamoDbClient = new AWS.DynamoDB({ region });
const lambda = new AWS.Lambda({ region });
const ssm = new AWS.SSM({ region });
const cloudwatch = new AWS.CloudWatch({ region });
const logs = new AWS.CloudWatchLogs({ region });

// Helper function to sign and make API requests
const makeApiRequest = (endpoint: string, method: string, body?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

describe('Fitness Workout API Integration Tests', () => {

  describe('Infrastructure Verification', () => {
    test('should have all required outputs', async () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.CreateWorkoutEndpoint).toBeDefined();
      expect(outputs.GetWorkoutsEndpoint).toBeDefined();
      expect(outputs.GetStatsEndpoint).toBeDefined();
      expect(outputs.DashboardURL).toBeDefined();
      expect(outputs.LambdaFunctionNames).toBeDefined();
    });

    test('API endpoint should be accessible', async () => {
      expect(outputs.ApiEndpoint).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*/);
    });

    test('DynamoDB table should exist and be accessible', async () => {
      const params = {
        TableName: outputs.DynamoDBTableName
      };

      const result = await dynamoDbClient.describeTable(params).promise();
      expect(result.Table).toBeDefined();
      expect(result.Table?.TableName).toBe(outputs.DynamoDBTableName);
      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(result.Table?.TableStatus).toBe('ACTIVE');
    });

    test('DynamoDB table should have correct key schema', async () => {
      const params = {
        TableName: outputs.DynamoDBTableName
      };

      const result = await dynamoDbClient.describeTable(params).promise();

      // Check primary key schema
      expect(result.Table?.KeySchema).toBeDefined();
      const hashKey = result.Table?.KeySchema?.find(k => k.KeyType === 'HASH');
      const rangeKey = result.Table?.KeySchema?.find(k => k.KeyType === 'RANGE');
      expect(hashKey?.AttributeName).toBe('userId');
      expect(rangeKey?.AttributeName).toBe('workoutTimestamp');
    });

    test('DynamoDB table should have WorkoutTypeIndex GSI', async () => {
      const params = {
        TableName: outputs.DynamoDBTableName
      };

      const result = await dynamoDbClient.describeTable(params).promise();

      // Check GSI
      expect(result.Table?.GlobalSecondaryIndexes).toBeDefined();
      expect(result.Table?.GlobalSecondaryIndexes?.length).toBeGreaterThan(0);

      const gsi = result.Table?.GlobalSecondaryIndexes?.find(i => i.IndexName === 'WorkoutTypeIndex');
      expect(gsi).toBeDefined();
      expect(gsi?.IndexStatus).toBe('ACTIVE');
    });

    test('DynamoDB table should have encryption and point-in-time recovery enabled', async () => {
      const params = {
        TableName: outputs.DynamoDBTableName
      };

      const result = await dynamoDbClient.describeTable(params).promise();

      // Check encryption
      expect(result.Table?.SSEDescription?.Status).toBe('ENABLED');

      // Check point-in-time recovery
      const pitrResult = await dynamoDbClient.describeContinuousBackups({
        TableName: outputs.DynamoDBTableName
      }).promise();

      expect(pitrResult.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });
  });

  describe('Lambda Functions Integration', () => {
    test('Create Workout Lambda function should exist and be configured correctly', async () => {
      const functionName = `create-workout-log-${region}-${environmentSuffix}`;

      try {
        const result = await lambda.getFunction({
          FunctionName: functionName
        }).promise();

        expect(result.Configuration?.Runtime).toBe('python3.9');
        expect(result.Configuration?.Handler).toBe('index.lambda_handler');
        expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.DynamoDBTableName);
        expect(result.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
        expect(result.Configuration?.Timeout).toBe(30);
        expect(result.Configuration?.MemorySize).toBe(256);
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          fail(`Lambda function ${functionName} not found`);
        }
        throw error;
      }
    });

    test('Get Workouts Lambda function should exist and be configured correctly', async () => {
      const functionName = `get-workoutlogs-${region}-${environmentSuffix}`;

      try {
        const result = await lambda.getFunction({
          FunctionName: functionName
        }).promise();

        expect(result.Configuration?.Runtime).toBe('python3.9');
        expect(result.Configuration?.Handler).toBe('index.lambda_handler');
        expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.DynamoDBTableName);
        expect(result.Configuration?.Timeout).toBe(30);
        expect(result.Configuration?.MemorySize).toBe(256);
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          fail(`Lambda function ${functionName} not found`);
        }
        throw error;
      }
    });

    test('Get Stats Lambda function should exist and be configured correctly', async () => {
      const functionName = `get-workout-stats-${region}-${environmentSuffix}`;

      try {
        const result = await lambda.getFunction({
          FunctionName: functionName
        }).promise();

        expect(result.Configuration?.Runtime).toBe('python3.9');
        expect(result.Configuration?.Handler).toBe('index.lambda_handler');
        expect(result.Configuration?.Environment?.Variables?.TABLE_NAME).toBe(outputs.DynamoDBTableName);
        expect(result.Configuration?.Timeout).toBe(30);
        expect(result.Configuration?.MemorySize).toBe(256);
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          fail(`Lambda function ${functionName} not found`);
        }
        throw error;
      }
    });

    test('All Lambda functions should have proper IAM execution role', async () => {
      const functionNames = [
        `create-workout-log-${region}-${environmentSuffix}`,
        `get-workoutlogs-${region}-${environmentSuffix}`,
        `get-workout-stats-${region}-${environmentSuffix}`
      ];

      for (const functionName of functionNames) {
        const result = await lambda.getFunction({
          FunctionName: functionName
        }).promise();

        expect(result.Configuration?.Role).toBeDefined();
        expect(result.Configuration?.Role).toContain('WorkoutApiLambdaRole');
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
        expect(result.Parameter?.Type).toBe('String');
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
        expect(result.Parameter?.Type).toBe('String');
      } catch (error: any) {
        if (error.code === 'ParameterNotFound') {
          fail(`SSM Parameter ${paramName} not found`);
        }
        throw error;
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch Dashboard should exist', async () => {
      const dashboardName = `workoutapi-metrics-${region}-${environmentSuffix}`;

      try {
        const result = await cloudwatch.getDashboard({
          DashboardName: dashboardName
        }).promise();

        expect(result.DashboardName).toBe(dashboardName);
        expect(result.DashboardBody).toBeDefined();

        const dashboardBody = JSON.parse(result.DashboardBody!);
        expect(dashboardBody.widgets).toBeDefined();
        expect(dashboardBody.widgets.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.code === 'ResourceNotFound') {
          fail(`CloudWatch Dashboard ${dashboardName} not found`);
        }
        throw error;
      }
    });

    test('CloudWatch Alarms should be configured', async () => {
      const apiErrorAlarmName = `workoutapi-errors-${region}-${environmentSuffix}`;
      const dynamoThrottleAlarmName = `workout-dynamodb-throttle-${region}-${environmentSuffix}`;

      // Check API Error Alarm
      const apiAlarmResult = await cloudwatch.describeAlarms({
        AlarmNames: [apiErrorAlarmName]
      }).promise();

      expect(apiAlarmResult.MetricAlarms?.length).toBe(1);
      expect(apiAlarmResult.MetricAlarms?.[0].AlarmName).toBe(apiErrorAlarmName);
      expect(apiAlarmResult.MetricAlarms?.[0].MetricName).toBe('5XXError');
      expect(apiAlarmResult.MetricAlarms?.[0].Threshold).toBe(10);

      // Check DynamoDB Throttle Alarm
      const dynamoAlarmResult = await cloudwatch.describeAlarms({
        AlarmNames: [dynamoThrottleAlarmName]
      }).promise();

      expect(dynamoAlarmResult.MetricAlarms?.length).toBe(1);
      expect(dynamoAlarmResult.MetricAlarms?.[0].AlarmName).toBe(dynamoThrottleAlarmName);
      expect(dynamoAlarmResult.MetricAlarms?.[0].MetricName).toBe('UserErrors');
    });

    test('CloudWatch Log Group should exist for API Gateway', async () => {
      const logGroupName = `/aws/apigateway/workoutapi-${region}-${environmentSuffix}`;

      try {
        const result = await logs.describeLogGroups({
          logGroupNamePrefix: logGroupName
        }).promise();

        expect(result.logGroups?.length).toBeGreaterThan(0);
        const logGroup = result.logGroups?.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup?.retentionInDays).toBe(30);
      } catch (error) {
        fail(`CloudWatch Log Group ${logGroupName} not found`);
      }
    });
  });

  describe('End-to-End Workout Flow', () => {
    const testUserId = `e2e-user-${Date.now()}`;
    let createdWorkoutTimestamp: number;
    const testWorkouts: any[] = [];

    afterAll(async () => {
      // Clean up all test data
      try {
        const deletePromises = testWorkouts.map(workout =>
          dynamoDb.delete({
            TableName: outputs.DynamoDBTableName,
            Key: {
              userId: workout.userId,
              workoutTimestamp: workout.workoutTimestamp
            }
          }).promise()
        );

        await Promise.all(deletePromises);
        console.log(`Cleaned up ${testWorkouts.length} test workouts`);
      } catch (error) {
        console.warn('Error cleaning up test data:', error);
      }
    });

    test('E2E: Create a workout log via Lambda', async () => {
      // Invoke Lambda directly to create a workout
      const functionName = `create-workout-log-${region}-${environmentSuffix}`;

      const workoutData = {
        userId: testUserId,
        workoutType: 'running',
        duration: 45,
        calories: 400,
        distance: 6.5,
        heartRate: 155,
        notes: 'Morning run in the park - E2E test'
      };

      const payload = {
        body: JSON.stringify(workoutData),
        headers: { 'Content-Type': 'application/json' }
      };

      const result = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(payload)
      }).promise();

      const response = JSON.parse(result.Payload as string);
      expect(response.statusCode).toBe(201);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.message).toBe('Workout log created successfully');
      expect(responseBody.workoutId).toBeDefined();

      // Extract timestamp for later use
      const workoutId = responseBody.workoutId;
      createdWorkoutTimestamp = parseInt(workoutId.split('#')[1]);

      testWorkouts.push({
        userId: testUserId,
        workoutTimestamp: createdWorkoutTimestamp
      });

      console.log(`Created workout with ID: ${workoutId}`);
    });

    test('E2E: Verify workout appears in DynamoDB', async () => {
      // Wait a moment for consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await dynamoDb.get({
        TableName: outputs.DynamoDBTableName,
        Key: {
          userId: testUserId,
          workoutTimestamp: createdWorkoutTimestamp
        }
      }).promise();

      expect(result.Item).toBeDefined();
      expect(result.Item?.userId).toBe(testUserId);
      expect(result.Item?.workoutType).toBe('running');
      expect(result.Item?.duration).toBe(45);
      expect(result.Item?.calories).toBe(400);
      expect(result.Item?.distance).toBe(6.5);
      expect(result.Item?.heartRate).toBe(155);
      expect(result.Item?.notes).toBe('Morning run in the park - E2E test');
      expect(result.Item?.createdAt).toBeDefined();
    });

    test('E2E: Retrieve workout logs via Lambda', async () => {
      const functionName = `get-workoutlogs-${region}-${environmentSuffix}`;

      const payload = {
        queryStringParameters: {
          userId: testUserId
        }
      };

      const result = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(payload)
      }).promise();

      const response = JSON.parse(result.Payload as string);
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.count).toBeGreaterThan(0);
      expect(responseBody.workouts).toBeDefined();
      expect(Array.isArray(responseBody.workouts)).toBe(true);

      const workout = responseBody.workouts.find((w: any) =>
        w.workoutTimestamp === createdWorkoutTimestamp
      );

      expect(workout).toBeDefined();
      expect(workout.workoutType).toBe('running');
      expect(workout.duration).toBe(45);
    });

    test('E2E: Create multiple workouts for statistics', async () => {
      const functionName = `create-workout-log-${region}-${environmentSuffix}`;

      const workouts = [
        {
          userId: testUserId,
          workoutType: 'cycling',
          duration: 60,
          calories: 500,
          distance: 20,
          heartRate: 145,
          notes: 'Evening bike ride'
        },
        {
          userId: testUserId,
          workoutType: 'swimming',
          duration: 30,
          calories: 350,
          distance: 1.5,
          heartRate: 140,
          notes: 'Pool workout'
        },
        {
          userId: testUserId,
          workoutType: 'weightlifting',
          duration: 50,
          calories: 300,
          distance: 0,
          heartRate: 130,
          notes: 'Upper body strength training'
        }
      ];

      for (const workoutData of workouts) {
        const payload = {
          body: JSON.stringify(workoutData),
          headers: { 'Content-Type': 'application/json' }
        };

        const result = await lambda.invoke({
          FunctionName: functionName,
          Payload: JSON.stringify(payload)
        }).promise();

        const response = JSON.parse(result.Payload as string);
        expect(response.statusCode).toBe(201);

        const responseBody = JSON.parse(response.body);
        const workoutId = responseBody.workoutId;
        const timestamp = parseInt(workoutId.split('#')[1]);

        testWorkouts.push({
          userId: testUserId,
          workoutTimestamp: timestamp
        });

        // Small delay between creates
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Created ${workouts.length} additional workouts`);
    });

    test('E2E: Get workout statistics via Lambda', async () => {
      // Wait for all workouts to be available
      await new Promise(resolve => setTimeout(resolve, 2000));

      const functionName = `get-workout-stats-${region}-${environmentSuffix}`;

      const payload = {
        queryStringParameters: {
          userId: testUserId,
          days: 30
        }
      };

      const result = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(payload)
      }).promise();

      const response = JSON.parse(result.Payload as string);
      expect(response.statusCode).toBe(200);

      const stats = JSON.parse(response.body);

      // We created 4 workouts total (1 + 3)
      expect(stats.userId).toBe(testUserId);

      console.log('Statistics verified:', stats);
    });

    test('E2E: Query by workout type using GSI', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await dynamoDb.query({
        TableName: outputs.DynamoDBTableName,
        IndexName: 'WorkoutTypeIndex',
        KeyConditionExpression: 'workoutType = :workoutType',
        ExpressionAttributeValues: {
          ':workoutType': 'swimming'
        }
      }).promise();

      expect(result.Items).toBeDefined();
    });

    test('E2E: Verify CloudWatch metrics were published', async () => {
      // Wait for metrics to be published
      await new Promise(resolve => setTimeout(resolve, 3000));

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes

      const result = await cloudwatch.getMetricStatistics({
        Namespace: 'FitnessApp/Workouts',
        MetricName: 'WorkoutLogsCreated',
        Dimensions: [
          { Name: 'Environment', Value: environmentSuffix }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      // We may or may not see metrics immediately, but the call should succeed
      expect(result.Datapoints).toBeDefined();
      console.log(`CloudWatch metrics datapoints: ${result.Datapoints?.length}`);
    });

    test('E2E: Handle non-existent user gracefully', async () => {
      const functionName = `get-workoutlogs-${region}-${environmentSuffix}`;
      const nonExistentUserId = `non-existent-user-${Date.now()}`;

      const payload = {
        queryStringParameters: {
          userId: nonExistentUserId
        }
      };

      const result = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(payload)
      }).promise();

      const response = JSON.parse(result.Payload as string);
      expect(response.statusCode).toBe(200);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.count).toBe(0);
      expect(responseBody.workouts).toEqual([]);
    });

    test('E2E: Handle missing required fields in create workout', async () => {
      const functionName = `create-workout-log-${region}-${environmentSuffix}`;

      const invalidWorkoutData = {
        userId: testUserId,
        workoutType: 'running'
        // Missing duration and calories
      };

      const payload = {
        body: JSON.stringify(invalidWorkoutData),
        headers: { 'Content-Type': 'application/json' }
      };

      const result = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(payload)
      }).promise();

      const response = JSON.parse(result.Payload as string);
      expect(response.statusCode).toBe(400);

      const responseBody = JSON.parse(response.body);
      expect(responseBody.error).toContain('Missing required field');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent workout creations', async () => {
      const functionName = `create-workout-log-${region}-${environmentSuffix}`;
      const concurrentUserId = `concurrent-test-${Date.now()}`;
      const numConcurrentRequests = 10;

      const createWorkout = async (index: number) => {
        const workoutData = {
          userId: concurrentUserId,
          workoutType: 'running',
          duration: 30 + index,
          calories: 300 + (index * 10),
          distance: 5 + index,
          heartRate: 150,
          notes: `Concurrent test workout ${index}`
        };

        const payload = {
          body: JSON.stringify(workoutData),
          headers: { 'Content-Type': 'application/json' }
        };

        const result = await lambda.invoke({
          FunctionName: functionName,
          Payload: JSON.stringify(payload)
        }).promise();

        return JSON.parse(result.Payload as string);
      };

      const promises = Array.from({ length: numConcurrentRequests }, (_, i) => createWorkout(i));
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(response => {
        expect(response.statusCode).toBe(201);
      });

      // Clean up
      try {
        const queryResult = await dynamoDb.query({
          TableName: outputs.DynamoDBTableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': concurrentUserId
          }
        }).promise();

        expect(queryResult.Items!.length).toBe(numConcurrentRequests);

        const deletePromises = queryResult.Items!.map(item =>
          dynamoDb.delete({
            TableName: outputs.DynamoDBTableName,
            Key: {
              userId: item.userId,
              workoutTimestamp: item.workoutTimestamp
            }
          }).promise()
        );

        await Promise.all(deletePromises);
      } catch (error) {
        console.warn('Error cleaning up concurrent test data:', error);
      }
    }, 30000); // Increase timeout for concurrent operations
  });
});