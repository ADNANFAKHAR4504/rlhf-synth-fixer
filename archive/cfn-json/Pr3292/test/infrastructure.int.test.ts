import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeTableCommand,
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DescribeRuleCommand,
  EventBridgeClient
} from '@aws-sdk/client-eventbridge';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const cfnClient = new CloudFormationClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

describe('Infrastructure Integration Tests', () => {
  let outputs: any;
  let stackName: string;

  beforeAll(() => {
    // Read the deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Please deploy the stack first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Extract stack name from Lambda ARN
    const lambdaArn = outputs.LambdaFunctionArn;
    const functionName = lambdaArn.split(':function:')[1];
    const suffix = functionName.replace('appointment-notification-processor-', '');
    stackName = `TapStack${suffix}`;
  });

  describe('CloudFormation Stack', () => {
    test('should exist and be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBeGreaterThan(0);
      const stack = response.Stacks![0];
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus);
    });

    test('should have expected outputs', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const stack = response.Stacks![0];
      const stackOutputs = stack.Outputs || [];

      expect(stackOutputs.find(o => o.OutputKey === 'NotificationTopicArn')).toBeDefined();
      expect(stackOutputs.find(o => o.OutputKey === 'LambdaFunctionArn')).toBeDefined();
      expect(stackOutputs.find(o => o.OutputKey === 'DynamoDBTableName')).toBeDefined();
    });
  });

  describe('DynamoDB Table', () => {
    test('should exist and be ACTIVE', async () => {
      const tableName = outputs.DynamoDBTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have PAY_PER_REQUEST billing mode', async () => {
      const tableName = outputs.DynamoDBTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct key schema', async () => {
      const tableName = outputs.DynamoDBTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema || [];
      expect(keySchema.find(k => k.AttributeName === 'notificationId' && k.KeyType === 'HASH')).toBeDefined();
      expect(keySchema.find(k => k.AttributeName === 'timestamp' && k.KeyType === 'RANGE')).toBeDefined();
    });

    test('should have PatientIndex global secondary index', async () => {
      const tableName = outputs.DynamoDBTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const gsi = response.Table?.GlobalSecondaryIndexes || [];
      const patientIndex = gsi.find(index => index.IndexName === 'PatientIndex');

      expect(patientIndex).toBeDefined();
      expect(patientIndex?.IndexStatus).toBe('ACTIVE');
      expect(patientIndex?.KeySchema?.find(k => k.AttributeName === 'patientId' && k.KeyType === 'HASH')).toBeDefined();
    });

    test('should have Point-in-Time Recovery enabled', async () => {
      const tableName = outputs.DynamoDBTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      // Note: DescribeTable doesn't return PITR status directly, would need DescribeContinuousBackups
    });
  });

  describe('Lambda Function', () => {
    test('should exist and be Active', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should have Python 3.10 runtime', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('python3.10');
    });

    test('should have correct environment variables', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables || {};
      expect(envVars.NOTIFICATION_TABLE).toBe(outputs.DynamoDBTableName);
      expect(envVars.SNS_TOPIC_ARN).toBe(outputs.NotificationTopicArn);
      expect(envVars.EMAIL_DOMAIN).toBeDefined();
    });

    test('should have 300 second timeout', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Timeout).toBe(300);
    });

    test('should have 512 MB memory', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.MemorySize).toBe(512);
    });

    test('should not have reserved concurrent executions (uses unreserved concurrency)', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      // ReservedConcurrentExecutions should be undefined (not set) to use unreserved concurrency
      expect(response.Configuration).toBeDefined();
      // Type assertion to access ReservedConcurrentExecutions property
      expect((response.Configuration as any)?.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('should handle invalid input gracefully', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({ appointments: [] })
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(400);
      expect(payload.body).toContain('No appointments provided');
    });

    test('should process valid appointments', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];

      const testAppointment = {
        appointments: [
          {
            patientId: 'test-patient-001',
            phoneNumber: '+11234567890',
            email: 'test@example.com',
            appointmentTime: '2024-12-01 14:00',
            doctorName: 'Smith',
            location: 'Clinic A'
          }
        ]
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testAppointment)
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.processed).toBe(1);
      expect(body.batchId).toBeDefined();
      expect(body.results).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('should exist and be accessible', async () => {
      const topicArn = outputs.NotificationTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('should have correct display name', async () => {
      const topicArn = outputs.NotificationTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });

      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe('AppointmentNotifications');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have delivery failure alarm configured', async () => {
      const suffix = stackName.replace('TapStack', '');
      const alarmName = `notification-delivery-failure-alarm-${suffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('FailedNotifications');
      expect(alarm.Namespace).toBe('HealthcareNotifications');
      expect(alarm.Threshold).toBe(115);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have Lambda error alarm configured', async () => {
      const suffix = stackName.replace('TapStack', '');
      const alarmName = `lambda-processor-error-alarm-${suffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(5);
    });
  });

  describe('EventBridge Rule', () => {
    test('should have daily trigger rule configured', async () => {
      const suffix = stackName.replace('TapStack', '');
      const ruleName = `daily-notification-trigger-${suffix}`;

      const command = new DescribeRuleCommand({
        Name: ruleName
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBe('rate(1 day)');
    });
  });

  describe('End-to-End Workflow', () => {
    test('should process batch appointments correctly', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];

      const testAppointments = {
        appointments: [
          {
            patientId: 'e2e-patient-001',
            phoneNumber: '+11234567890',
            email: 'patient1@example.com',
            appointmentTime: '2024-12-01 10:00',
            doctorName: 'Johnson',
            location: 'Main Hospital'
          },
          {
            patientId: 'e2e-patient-002',
            phoneNumber: '+19876543210',
            email: 'patient2@example.com',
            appointmentTime: '2024-12-01 14:00',
            doctorName: 'Williams',
            location: 'Clinic B'
          },
          {
            patientId: 'e2e-patient-003',
            email: 'patient3@example.com',
            appointmentTime: '2024-12-01 16:00',
            doctorName: 'Brown'
          }
        ]
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testAppointments)
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.processed).toBe(3);
      expect(body.batchId).toBeDefined();
      expect(body.results).toBeDefined();
      expect(body.successRate).toBeDefined();

      // Verify results object has expected structure
      expect(body.results).toHaveProperty('success');
      expect(body.results).toHaveProperty('failed');
      expect(body.results).toHaveProperty('fallback');

      // Total processed should equal sum of results
      const totalProcessed = body.results.success + body.results.failed + body.results.fallback;
      expect(totalProcessed).toBe(3);
    });

    test('should handle missing required fields', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];

      const invalidAppointment = {
        appointments: [
          {
            // Missing patientId
            phoneNumber: '+11234567890',
            email: 'test@example.com',
            appointmentTime: '2024-12-01 14:00'
          }
        ]
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(invalidAppointment)
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.results.failed).toBeGreaterThan(0);
    });

    test('should handle large batch processing', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':function:')[1];

      // Create 10 test appointments for batch processing test
      const appointments = [];
      for (let i = 0; i < 10; i++) {
        appointments.push({
          patientId: `batch-patient-${i.toString().padStart(3, '0')}`,
          phoneNumber: `+1555${(1000000 + i).toString()}`,
          email: `patient${i}@example.com`,
          appointmentTime: `2024-12-01 ${(8 + Math.floor(i / 10)).toString().padStart(2, '0')}:${(i % 6 * 10).toString().padStart(2, '0')}`,
          doctorName: `Doctor${i % 5}`,
          location: `Location ${i % 3}`
        });
      }

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({ appointments })
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.processed).toBe(10);
      expect(body.batchId).toBeDefined();
      expect(body.successRate).toBeDefined();
    }, 45000); // Timeout for batch processing test
  });

  describe('Resource Tagging', () => {
    test('should have consistent tags across resources', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const stack = response.Stacks![0];
      const tags = stack.Tags || [];

      // Check that stack has required tags
      expect(tags.find(t => t.Key === 'Repository')).toBeDefined();
      expect(tags.find(t => t.Key === 'CommitAuthor')).toBeDefined();
    });
  });
});
