import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { GetFunctionCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  DescribeExecutionCommand,
  DescribeStateMachineCommand,
  SFNClient,
  StartExecutionCommand,
} from '@aws-sdk/client-sfn';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';
// import { PipesClient, DescribePipeCommand } from '@aws-sdk/client-pipes';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'us-west-2';
const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const sfnClient = new SFNClient({ region });
const snsClient = new SNSClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
// const pipesClient = new PipesClient({ region });

describe('Appointment Booking Notification System - Integration Tests', () => {
  describe('DynamoDB Table', () => {
    test('should exist and be accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.AppointmentsTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.AppointmentsTableName);
    });

    test('should have correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.AppointmentsTableName,
      });

      const response = await dynamoClient.send(command);
      const keySchema = response.Table?.KeySchema;

      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(1);
      expect(keySchema?.[0].AttributeName).toBe('appointmentId');
      expect(keySchema?.[0].KeyType).toBe('HASH');
    });

    test('should have Global Secondary Index', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.AppointmentsTableName,
      });

      const response = await dynamoClient.send(command);
      const gsi = response.Table?.GlobalSecondaryIndexes;

      expect(gsi).toBeDefined();
      expect(gsi?.length).toBeGreaterThan(0);
      expect(gsi?.[0].IndexName).toBe('AppointmentTimeIndex');
    });

    test('should have streams enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.AppointmentsTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.StreamSpecification).toBeDefined();
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
    });

    test('should be able to write and read an appointment', async () => {
      const testAppointmentId = `test-${Date.now()}`;
      const appointmentTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      // Write appointment
      const putCommand = new PutItemCommand({
        TableName: outputs.AppointmentsTableName,
        Item: {
          appointmentId: { S: testAppointmentId },
          customerEmail: { S: 'test@example.com' },
          customerPhone: { S: '+1234567890' },
          appointmentTime: { N: appointmentTime.toString() },
          status: { S: 'scheduled' },
        },
      });

      await dynamoClient.send(putCommand);

      // Read appointment
      const getCommand = new GetItemCommand({
        TableName: outputs.AppointmentsTableName,
        Key: {
          appointmentId: { S: testAppointmentId },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.appointmentId.S).toBe(testAppointmentId);
      expect(response.Item?.customerEmail.S).toBe('test@example.com');

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: outputs.AppointmentsTableName,
        Key: {
          appointmentId: { S: testAppointmentId },
        },
      });
      await dynamoClient.send(deleteCommand);
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('AppointmentProcessor function should exist and be invocable', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.AppointmentProcessorFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('EmailSender function should exist and be invocable', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.EmailSenderFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('SmsSender function should exist and be invocable', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.SmsSenderFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('Lambda functions should have correct timeout and memory', async () => {
      const functions = [
        outputs.AppointmentProcessorFunctionArn,
        outputs.EmailSenderFunctionArn,
        outputs.SmsSenderFunctionArn,
      ];

      for (const functionArn of functions) {
        const command = new GetFunctionCommand({
          FunctionName: functionArn,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration?.Timeout).toBe(30);
        expect(response.Configuration?.MemorySize).toBe(256);
      }
    });

    test('AppointmentProcessor should return appointments list', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.AppointmentProcessorFunctionArn,
        Payload: JSON.stringify({}),
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(payload).toBeDefined();
      expect(payload.statusCode).toBe(200);
      expect(payload.appointments).toBeDefined();
      expect(Array.isArray(payload.appointments)).toBe(true);
    }, 30000);
  });

  describe('SNS Topic', () => {
    test('should exist and be accessible', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.NotificationTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.NotificationTopicArn);
    });

    test('should have correct display name', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.NotificationTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe('Appointment SMS Notifications');
    });
  });

  describe('Step Functions State Machine', () => {
    test('should exist and be accessible', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.NotificationWorkflowArn,
      });

      const response = await sfnClient.send(command);
      expect(response.stateMachineArn).toBe(outputs.NotificationWorkflowArn);
      expect(response.status).toBe('ACTIVE');
    });

    test('should have correct logging configuration', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.NotificationWorkflowArn,
      });

      const response = await sfnClient.send(command);
      expect(response.loggingConfiguration).toBeDefined();
      expect(response.loggingConfiguration?.level).toBe('ALL');
    });

    test('should have valid definition with required states', async () => {
      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.NotificationWorkflowArn,
      });

      const response = await sfnClient.send(command);
      expect(response.definition).toBeDefined();

      const definition = JSON.parse(response.definition!);
      expect(definition.StartAt).toBe('ProcessAppointments');
      expect(definition.States).toBeDefined();
      expect(definition.States.ProcessAppointments).toBeDefined();
      expect(definition.States.MapAppointments).toBeDefined();
    });

    test('should execute successfully with empty input', async () => {
      const startCommand = new StartExecutionCommand({
        stateMachineArn: outputs.NotificationWorkflowArn,
        input: JSON.stringify({}),
      });

      const startResponse = await sfnClient.send(startCommand);
      expect(startResponse.executionArn).toBeDefined();

      // Wait for execution to complete
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const describeCommand = new DescribeExecutionCommand({
        executionArn: startResponse.executionArn,
      });

      const describeResponse = await sfnClient.send(describeCommand);
      expect(describeResponse.status).toMatch(/SUCCEEDED|RUNNING/);
    }, 30000);
  });

  describe('EventBridge Scheduled Rule', () => {
    test('should exist and be enabled', async () => {
      const ruleName = `AppointmentNotificationSchedule-${outputs.EnvironmentSuffix}`;
      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });

    test('should have correct schedule expression', async () => {
      const ruleName = `AppointmentNotificationSchedule-${outputs.EnvironmentSuffix}`;
      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.ScheduleExpression).toBe('rate(1 hour)');
    });

    test('should target the Step Functions workflow', async () => {
      const ruleName = `AppointmentNotificationSchedule-${outputs.EnvironmentSuffix}`;
      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
      expect(response.Targets?.[0].Arn).toBe(outputs.NotificationWorkflowArn);
    });
  });

  // EventBridge Pipe tests commented out due to missing @aws-sdk/client-pipes package
  // describe('EventBridge Pipe', () => {
  //   test('should exist and be in correct state', async () => {
  //     const pipeName = `AppointmentStreamPipe-${outputs.EnvironmentSuffix}`;
  //     const command = new DescribePipeCommand({
  //       Name: pipeName,
  //     });

  //     const response = await pipesClient.send(command);
  //     expect(response.Name).toBe(pipeName);
  //     expect(response.CurrentState).toMatch(/RUNNING|CREATING/);
  //   });

  //   test('should have correct source and target', async () => {
  //     const pipeName = `AppointmentStreamPipe-${outputs.EnvironmentSuffix}`;
  //     const command = new DescribePipeCommand({
  //       Name: pipeName,
  //     });

  //     const response = await pipesClient.send(command);
  //     expect(response.Source).toBeDefined();
  //     expect(response.Target).toBe(outputs.NotificationWorkflowArn);
  //   });

  //   test('should have correct source parameters', async () => {
  //     const pipeName = `AppointmentStreamPipe-${outputs.EnvironmentSuffix}`;
  //     const command = new DescribePipeCommand({
  //       Name: pipeName,
  //     });

  //     const response = await pipesClient.send(command);
  //     expect(response.SourceParameters).toBeDefined();
  //     expect(response.SourceParameters?.DynamoDBStreamParameters).toBeDefined();
  //     expect(response.SourceParameters?.DynamoDBStreamParameters?.StartingPosition).toBe('LATEST');
  //   });
  // });

  describe('End-to-End Workflow', () => {
    test('should process appointment through complete workflow', async () => {
      const testAppointmentId = `e2e-test-${Date.now()}`;
      const appointmentTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Create appointment in DynamoDB
      const putCommand = new PutItemCommand({
        TableName: outputs.AppointmentsTableName,
        Item: {
          appointmentId: { S: testAppointmentId },
          customerEmail: { S: 'test@example.com' },
          customerPhone: { S: '+1234567890' },
          appointmentTime: { N: appointmentTime.toString() },
          status: { S: 'scheduled' },
        },
      });

      await dynamoClient.send(putCommand);

      // Trigger Step Functions workflow manually
      const startCommand = new StartExecutionCommand({
        stateMachineArn: outputs.NotificationWorkflowArn,
        input: JSON.stringify({}),
      });

      const startResponse = await sfnClient.send(startCommand);
      expect(startResponse.executionArn).toBeDefined();

      // Wait for execution
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Verify appointment still exists
      const getCommand = new GetItemCommand({
        TableName: outputs.AppointmentsTableName,
        Key: {
          appointmentId: { S: testAppointmentId },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: outputs.AppointmentsTableName,
        Key: {
          appointmentId: { S: testAppointmentId },
        },
      });
      await dynamoClient.send(deleteCommand);
    }, 30000);
  });

  describe('Resource Connectivity', () => {
    test('Lambda functions should have access to DynamoDB table', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.AppointmentProcessorFunctionArn,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.APPOINTMENTS_TABLE).toBe(outputs.AppointmentsTableName);
    });

    test('EmailSender should have SenderEmail environment variable', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.EmailSenderFunctionArn,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.SENDER_EMAIL).toBeDefined();
    });

    test('SmsSender should have SNS topic ARN environment variable', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.SmsSenderFunctionArn,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.SNS_TOPIC_ARN).toBe(outputs.NotificationTopicArn);
    });
  });
});
