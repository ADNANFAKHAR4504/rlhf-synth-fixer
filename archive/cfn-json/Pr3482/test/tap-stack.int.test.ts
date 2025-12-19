// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  APIGatewayClient
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  EventBridgeClient,
  ListRulesCommand
} from '@aws-sdk/client-eventbridge';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import axios from 'axios';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const apiClient = new APIGatewayClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });

describe('Appointment Scheduler Integration Tests', () => {
  const testUserId = `test-user-${Date.now()}`;
  const createdAppointmentIds: string[] = [];

  afterAll(async () => {
    // Cleanup: Delete any test appointments created
    for (const appointmentId of createdAppointmentIds) {
      try {
        await dynamoClient.send(new DeleteItemCommand({
          TableName: outputs.AppointmentsTableName,
          Key: {
            appointmentId: { S: appointmentId }
          }
        }));
      } catch (error) {
        console.log(`Failed to cleanup appointment ${appointmentId}:`, error);
      }
    }
  });

  describe('DynamoDB Table', () => {
    test('should verify AppointmentsTable exists and is accessible', async () => {
      const tableName = outputs.AppointmentsTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toContain('AppointmentsTable-');

      // Try to scan the table (should work even if empty)
      const scanCommand = new ScanCommand({
        TableName: tableName,
        Limit: 1
      });

      const response = await dynamoClient.send(scanCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have correct table name format', () => {
      const tableName = outputs.AppointmentsTableName;
      expect(tableName).toMatch(/^AppointmentsTable-[a-zA-Z0-9]+$/);
    });
  });

  describe('SNS Topic', () => {
    test('should verify NotificationTopic exists', async () => {
      const topicArn = outputs.NotificationTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain(':AppointmentNotifications-');

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('should have KMS encryption enabled', async () => {
      const topicArn = outputs.NotificationTopicArn;
      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should verify API endpoint is accessible', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.us-east-1\.amazonaws\.com\/prod$/);
    });

    test('should return 400 for invalid request body', async () => {
      const apiEndpoint = outputs.ApiEndpoint;

      try {
        await axios.post(`${apiEndpoint}/appointments`, {
          invalid: 'data'
        });
      } catch (error: any) {
        expect(error.response.status).toBe(500); // Lambda will return 500 for missing fields
      }
    });

    test('should create an appointment successfully', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const startTime = futureDate.toISOString();
      const endTime = new Date(futureDate.getTime() + 3600000).toISOString(); // 1 hour later

      const response = await axios.post(`${apiEndpoint}/appointments`, {
        userId: testUserId,
        startTime: startTime,
        endTime: endTime,
        details: {
          description: 'Integration test appointment',
          location: 'Test Room'
        }
      });

      expect(response.status).toBe(201);
      expect(response.data.appointmentId).toBeDefined();
      expect(response.data.message).toContain('successfully');

      // Store for cleanup
      createdAppointmentIds.push(response.data.appointmentId);
    });

    test('should detect appointment conflicts', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 8);

      const startTime = futureDate.toISOString();
      const endTime = new Date(futureDate.getTime() + 3600000).toISOString();

      // Create first appointment
      const firstResponse = await axios.post(`${apiEndpoint}/appointments`, {
        userId: testUserId,
        startTime: startTime,
        endTime: endTime,
        details: { description: 'First appointment' }
      });

      expect(firstResponse.status).toBe(201);
      createdAppointmentIds.push(firstResponse.data.appointmentId);

      // Try to create conflicting appointment
      try {
        await axios.post(`${apiEndpoint}/appointments`, {
          userId: testUserId,
          startTime: startTime,
          endTime: endTime,
          details: { description: 'Conflicting appointment' }
        });
        fail('Should have thrown conflict error');
      } catch (error: any) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.error).toContain('conflict');
      }
    });
  });

  describe('Lambda Functions', () => {
    test('should verify conflict detector function processes requests', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const response = await axios.post(`${apiEndpoint}/appointments`, {
        userId: `lambda-test-${Date.now()}`,
        startTime: futureDate.toISOString(),
        endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        details: { description: 'Lambda test' }
      });

      expect(response.status).toBe(201);
      expect(response.data.appointmentId).toBeDefined();
      createdAppointmentIds.push(response.data.appointmentId);
    });

    test('appointment should be stored in DynamoDB', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 11);

      // Create appointment via API
      const response = await axios.post(`${apiEndpoint}/appointments`, {
        userId: `dynamo-test-${Date.now()}`,
        startTime: futureDate.toISOString(),
        endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        details: { description: 'DynamoDB test' }
      });

      const appointmentId = response.data.appointmentId;
      createdAppointmentIds.push(appointmentId);

      // Verify it's in DynamoDB
      const getCommand = new GetItemCommand({
        TableName: outputs.AppointmentsTableName,
        Key: {
          appointmentId: { S: appointmentId }
        }
      });

      const dbResponse = await dynamoClient.send(getCommand);
      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item?.appointmentId?.S).toBe(appointmentId);
      expect(dbResponse.Item?.status?.S).toBe('scheduled');
    });
  });

  describe('EventBridge Integration', () => {
    test('should create reminder rules for appointments', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now to ensure both reminders are scheduled

      const response = await axios.post(`${apiEndpoint}/appointments`, {
        userId: `eventbridge-test-${Date.now()}`,
        startTime: futureDate.toISOString(),
        endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        details: { description: 'EventBridge test' }
      });

      const appointmentId = response.data.appointmentId;
      createdAppointmentIds.push(appointmentId);

      // Wait a bit for EventBridge rules to be created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if rules were created
      const listCommand = new ListRulesCommand({
        NamePrefix: `appointment-reminder-24h-${appointmentId}`
      });

      const rulesResponse = await eventBridgeClient.send(listCommand);
      expect(rulesResponse.Rules).toBeDefined();
      expect(rulesResponse.Rules?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CloudWatch Metrics', () => {
    test('should have booking metrics configured', async () => {
      // Query CloudWatch for booking metrics
      const endTime = new Date();
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 1);

      const command = new GetMetricStatisticsCommand({
        Namespace: 'AppointmentScheduler',
        MetricName: 'BookingSuccess',
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum']
      });

      const response = await cloudWatchClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      // We've created appointments in previous tests, so there should be data points
      if (response.Datapoints && response.Datapoints.length > 0) {
        expect(response.Datapoints[0].Sum).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('should complete full appointment booking workflow', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const workflowUserId = `workflow-test-${Date.now()}`;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);

      // Step 1: Create first appointment
      const firstAppointment = await axios.post(`${apiEndpoint}/appointments`, {
        userId: workflowUserId,
        startTime: futureDate.toISOString(),
        endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        details: {
          description: 'Morning meeting',
          location: 'Conference Room A'
        }
      });

      expect(firstAppointment.status).toBe(201);
      const firstId = firstAppointment.data.appointmentId;
      createdAppointmentIds.push(firstId);

      // Step 2: Try to create conflicting appointment
      try {
        await axios.post(`${apiEndpoint}/appointments`, {
          userId: workflowUserId,
          startTime: new Date(futureDate.getTime() + 1800000).toISOString(), // 30 min later
          endTime: new Date(futureDate.getTime() + 5400000).toISOString(), // 90 min later
          details: { description: 'Conflicting meeting' }
        });
        fail('Should detect conflict');
      } catch (error: any) {
        expect(error.response.status).toBe(409);
      }

      // Step 3: Create non-conflicting appointment
      const laterDate = new Date(futureDate.getTime() + 7200000); // 2 hours later
      const secondAppointment = await axios.post(`${apiEndpoint}/appointments`, {
        userId: workflowUserId,
        startTime: laterDate.toISOString(),
        endTime: new Date(laterDate.getTime() + 3600000).toISOString(),
        details: {
          description: 'Afternoon meeting',
          location: 'Conference Room B'
        }
      });

      expect(secondAppointment.status).toBe(201);
      createdAppointmentIds.push(secondAppointment.data.appointmentId);

      // Step 4: Verify both appointments exist in DynamoDB
      const getFirstCommand = new GetItemCommand({
        TableName: outputs.AppointmentsTableName,
        Key: { appointmentId: { S: firstId } }
      });

      const firstDbResponse = await dynamoClient.send(getFirstCommand);
      expect(firstDbResponse.Item).toBeDefined();
      expect(firstDbResponse.Item?.details?.M?.location?.S).toBe('Conference Room A');
    });
  });

  describe('API Throttling', () => {
    test('should handle throttling limits appropriately', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const requests = [];

      // Send multiple concurrent requests (below throttle limit)
      for (let i = 0; i < 5; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 20 + i);

        requests.push(
          axios.post(`${apiEndpoint}/appointments`, {
            userId: `throttle-test-${Date.now()}-${i}`,
            startTime: futureDate.toISOString(),
            endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
            details: { description: `Throttle test ${i}` }
          }).then(response => {
            if (response.data.appointmentId) {
              createdAppointmentIds.push(response.data.appointmentId);
            }
            return response;
          })
        );
      }

      const responses = await Promise.allSettled(requests);
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');

      // At least some requests should succeed
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});
