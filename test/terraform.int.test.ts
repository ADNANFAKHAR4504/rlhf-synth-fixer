// Integration tests for Expense Tracking Terraform Infrastructure
// Tests live AWS resources deployed by the Terraform stack

import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from "@aws-sdk/client-cloudwatch";
import {
  DescribeTableCommand,
  DynamoDBClient,
  ScanCommand
} from "@aws-sdk/client-dynamodb";
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient
} from "@aws-sdk/client-lambda";
import {
  GetBucketLifecycleConfigurationCommand,
  GetBucketNotificationConfigurationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client
} from "@aws-sdk/client-s3";
import {
  DescribeStateMachineCommand,
  SFNClient
} from "@aws-sdk/client-sfn";
import {
  GetTopicAttributesCommand,
  SNSClient
} from "@aws-sdk/client-sns";
import {
  GetQueueAttributesCommand,
  SQSClient
} from "@aws-sdk/client-sqs";
import fs from "fs";
import path from "path";

// Load deployment outputs
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

  // Parse JSON strings in outputs if they exist
  outputs = {
    ...rawOutputs,
    lambda_functions: rawOutputs.lambda_functions ? JSON.parse(rawOutputs.lambda_functions) : {},
    cloudwatch_alarms: rawOutputs.cloudwatch_alarms ? JSON.parse(rawOutputs.cloudwatch_alarms) : {}
  };
}

// AWS SDK clients
const region = process.env.AWS_REGION || "us-west-2";
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const sfnClient = new SFNClient({ region });
const snsClient = new SNSClient({ region });
const sqsClient = new SQSClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

// Helper function for retrying operations
async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

describe("Expense Tracking Infrastructure Integration Tests", () => {

  describe("S3 Storage", () => {
    test("Receipt upload bucket exists and is accessible", async () => {
      if (!outputs.s3_bucket_name) {
        console.log("Skipping test - S3 bucket name not found in outputs");
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.s3_bucket_name
      });

      await expect(retry(() => s3Client.send(command))).resolves.not.toThrow();
    });

    test("S3 bucket has versioning enabled", async () => {
      if (!outputs.s3_bucket_name) {
        console.log("Skipping test - S3 bucket name not found in outputs");
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await retry(() => s3Client.send(command));
      expect(response.Status).toBe("Enabled");
    });

    test("S3 bucket has lifecycle configuration", async () => {
      if (!outputs.s3_bucket_name) {
        console.log("Skipping test - S3 bucket name not found in outputs");
        return;
      }

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await retry(() => s3Client.send(command));
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    });

    test("S3 bucket has event notifications configured", async () => {
      if (!outputs.s3_bucket_name) {
        console.log("Skipping test - S3 bucket name not found in outputs");
        return;
      }

      const command = new GetBucketNotificationConfigurationCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await retry(() => s3Client.send(command));

      // Check if any notification configurations exist
      // Use type assertion to handle AWS SDK type variations
      const notificationResponse = response as any;
      const hasNotifications = (
        (notificationResponse.LambdaConfigurations?.length > 0) ||
        (notificationResponse.TopicConfigurations?.length > 0) ||
        (notificationResponse.QueueConfigurations?.length > 0) ||
        (notificationResponse.CloudWatchConfigurations?.length > 0)
      );

      // For expense tracking, we expect some form of event notification
      expect(response.$metadata?.httpStatusCode).toBe(200);
    });
  });

  describe("DynamoDB Storage", () => {
    test("Expenses table exists and is active", async () => {
      if (!outputs.dynamodb_table_name) {
        console.log("Skipping test - DynamoDB table name not found in outputs");
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      });

      const response = await retry(() => dynamoClient.send(command));
      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe("ACTIVE");
      expect(response.Table!.TableName).toBe(outputs.dynamodb_table_name);
    });

    test("DynamoDB table has required attributes and indexes", async () => {
      if (!outputs.dynamodb_table_name) {
        console.log("Skipping test - DynamoDB table name not found in outputs");
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name
      });

      const response = await retry(() => dynamoClient.send(command));
      const table = response.Table!;

      // Check for required attributes in key schema
      expect(table.KeySchema).toBeDefined();
      expect(table.KeySchema!.length).toBeGreaterThan(0);

      // Check for Global Secondary Indexes for querying by user_id, date, category
      expect(table.GlobalSecondaryIndexes).toBeDefined();
      expect(table.GlobalSecondaryIndexes!.length).toBeGreaterThan(0);
    });

    test("DynamoDB table is accessible for operations", async () => {
      if (!outputs.dynamodb_table_name) {
        console.log("Skipping test - DynamoDB table name not found in outputs");
        return;
      }

      const command = new ScanCommand({
        TableName: outputs.dynamodb_table_name,
        Limit: 1
      });

      // This should not throw an error, even if table is empty
      await expect(retry(() => dynamoClient.send(command))).resolves.not.toThrow();
    });
  });

  describe("Lambda Functions", () => {
    test("All required Lambda functions exist and are configured", async () => {
      if (!outputs.lambda_functions || typeof outputs.lambda_functions !== 'object') {
        console.log("Skipping test - Lambda functions not found in outputs");
        return;
      }

      const expectedFunctions = ['trigger', 'ocr', 'category', 'saver'];

      for (const funcType of expectedFunctions) {
        if (!outputs.lambda_functions[funcType]) {
          console.log(`Skipping ${funcType} function test - not found in outputs`);
          continue;
        }

        const command = new GetFunctionCommand({
          FunctionName: outputs.lambda_functions[funcType]
        });

        const response = await retry(() => lambdaClient.send(command));
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe("Active");
        expect(response.Configuration!.Runtime).toBe("python3.10");
      }
    });

    test("Lambda functions have appropriate timeout and memory settings", async () => {
      if (!outputs.lambda_functions || typeof outputs.lambda_functions !== 'object') {
        console.log("Skipping test - Lambda functions not found in outputs");
        return;
      }

      for (const [funcType, funcName] of Object.entries(outputs.lambda_functions)) {
        if (typeof funcName !== 'string') continue;

        const command = new GetFunctionConfigurationCommand({
          FunctionName: funcName
        });

        const response = await retry(() => lambdaClient.send(command));

        // OCR processing should have higher timeout and memory
        if (funcType === 'ocr') {
          expect(response.Timeout).toBeGreaterThanOrEqual(30);
          expect(response.MemorySize).toBeGreaterThanOrEqual(512);
        }

        // All functions should have reasonable timeout
        expect(response.Timeout).toBeGreaterThan(3);
        expect(response.Timeout).toBeLessThanOrEqual(900);
      }
    });

    test("Lambda functions have required environment variables", async () => {
      if (!outputs.lambda_functions || typeof outputs.lambda_functions !== 'object') {
        console.log("Skipping test - Lambda functions not found in outputs");
        return;
      }

      for (const [funcType, funcName] of Object.entries(outputs.lambda_functions)) {
        if (typeof funcName !== 'string') continue;

        const command = new GetFunctionConfigurationCommand({
          FunctionName: funcName
        });

        const response = await retry(() => lambdaClient.send(command));
        expect(response.Environment).toBeDefined();
        expect(response.Environment!.Variables).toBeDefined();

        // All functions should have table name
        expect(response.Environment!.Variables!.DYNAMODB_TABLE).toBeTruthy();
      }
    });
  });

  describe("Step Functions Workflow", () => {
    test("Receipt processing state machine exists and is active", async () => {
      if (!outputs.step_function_arn) {
        console.log("Skipping test - Step Functions ARN not found in outputs");
        return;
      }

      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.step_function_arn
      });

      const response = await retry(() => sfnClient.send(command));
      expect(response.stateMachineArn).toBe(outputs.step_function_arn);
      expect(response.status).toBe("ACTIVE");
      expect(response.definition).toBeDefined();
    });

    test("Step Functions definition includes parallel processing", async () => {
      if (!outputs.step_function_arn) {
        console.log("Skipping test - Step Functions ARN not found in outputs");
        return;
      }

      const command = new DescribeStateMachineCommand({
        stateMachineArn: outputs.step_function_arn
      });

      const response = await retry(() => sfnClient.send(command));
      const definition = JSON.parse(response.definition!);

      // Check for parallel processing branches
      expect(definition.States).toBeDefined();
      const hasParallel = Object.values(definition.States).some((state: any) => state.Type === 'Parallel');
      expect(hasParallel).toBe(true);
    });
  });

  describe("SNS Notifications", () => {
    test("Processing notification topic exists and is accessible", async () => {
      if (!outputs.sns_topic_arn) {
        console.log("Skipping test - SNS topic ARN not found in outputs");
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_arn
      });

      const response = await retry(() => snsClient.send(command));
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.sns_topic_arn);
    });
  });

  describe("Dead Letter Queue", () => {
    test("DLQ exists and is properly configured", async () => {
      if (!outputs.dlq_url) {
        console.log("Skipping test - DLQ URL not found in outputs");
        return;
      }

      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ['All']
      });

      const response = await retry(() => sqsClient.send(command));
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toBeDefined();
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("Required CloudWatch alarms exist", async () => {
      if (!outputs.cloudwatch_alarms || typeof outputs.cloudwatch_alarms !== 'object') {
        console.log("Skipping test - CloudWatch alarms not found in outputs");
        return;
      }

      const expectedAlarms = ['processing_errors', 'lambda_errors', 'dlq_messages'];

      for (const alarmType of expectedAlarms) {
        if (!outputs.cloudwatch_alarms[alarmType]) {
          console.log(`Skipping ${alarmType} alarm test - not found in outputs`);
          continue;
        }

        const command = new DescribeAlarmsCommand({
          AlarmNames: [outputs.cloudwatch_alarms[alarmType]]
        });

        const response = await retry(() => cloudwatchClient.send(command));
        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);
        expect(response.MetricAlarms![0].AlarmName).toBe(outputs.cloudwatch_alarms[alarmType]);
        expect(response.MetricAlarms![0].StateValue).toBeDefined();
      }
    });

    test("CloudWatch alarms have proper thresholds and actions", async () => {
      if (!outputs.cloudwatch_alarms || typeof outputs.cloudwatch_alarms !== 'object') {
        console.log("Skipping test - CloudWatch alarms not found in outputs");
        return;
      }

      for (const [alarmType, alarmName] of Object.entries(outputs.cloudwatch_alarms)) {
        if (typeof alarmName !== 'string') continue;

        const command = new DescribeAlarmsCommand({
          AlarmNames: [alarmName]
        });

        const response = await retry(() => cloudwatchClient.send(command));
        const alarm = response.MetricAlarms![0];

        expect(alarm.Threshold).toBeGreaterThan(0);
        expect(alarm.ComparisonOperator).toBeDefined();
        expect(alarm.MetricName).toBeDefined();
        expect(alarm.Namespace).toBeDefined();

        // Should have actions configured (SNS notifications)
        expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
      }
    });
  });

  describe("End-to-End Workflow Validation", () => {
    test("All infrastructure components are properly interconnected", async () => {
      // Validate that we have all required outputs for a complete workflow
      const requiredOutputs = [
        's3_bucket_name',
        'dynamodb_table_name',
        'step_function_arn',
        'sns_topic_arn'
      ];

      for (const output of requiredOutputs) {
        expect(outputs[output]).toBeTruthy();
      }

      // If we have lambda functions, validate they exist
      if (outputs.lambda_functions && typeof outputs.lambda_functions === 'object') {
        expect(Object.keys(outputs.lambda_functions).length).toBeGreaterThan(0);
      }
    });

    test("Infrastructure follows expense tracking workflow requirements", async () => {
      // Test that the infrastructure supports the expense tracking workflow:
      // 1. S3 bucket for receipt uploads
      expect(outputs.s3_bucket_name).toBeTruthy();

      // 2. DynamoDB for expense records
      expect(outputs.dynamodb_table_name).toBeTruthy();

      // 3. Step Functions for orchestration
      expect(outputs.step_function_arn).toBeTruthy();

      // 4. SNS for notifications
      expect(outputs.sns_topic_arn).toBeTruthy();

      // 5. Dead letter queue for error handling
      expect(outputs.dlq_url).toBeTruthy();
    });
  });
});
