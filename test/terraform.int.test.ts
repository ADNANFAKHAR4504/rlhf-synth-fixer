// tests/integration/terraform.int.test.ts
// Integration tests for deployed Terraform infrastructure
// These tests verify the infrastructure is correctly deployed and functioning

import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { APIGatewayClient, GetStageCommand } from "@aws-sdk/client-api-gateway";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import fs from "fs";
import path from "path";

// Load outputs from flat-outputs.json
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

const REGION = "ap-southeast-1";
const cloudwatchClient = new CloudWatchClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const apiGatewayClient = new APIGatewayClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });

describe("Webhook Processing System Integration Tests", () => {
  describe("Base Infrastructure", () => {
    test("Lambda functions are deployed", async () => {
      const functions = [
        outputs.validator_lambda_arn,
        outputs.processor_lambda_arn,
        outputs.notifier_lambda_arn,
      ];

      for (const arn of functions) {
        const functionName = arn.split(":").pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(functionName);
      }
    });

    test("SQS queues are deployed", async () => {
      const queues = [
        outputs.validation_queue_url,
        outputs.processing_queue_url,
        outputs.notification_queue_url,
        outputs.validation_dlq_url,
        outputs.processing_dlq_url,
        outputs.notification_dlq_url,
      ];

      for (const queueUrl of queues) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ["QueueArn"],
        });
        const response = await sqsClient.send(command);
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes?.QueueArn).toContain("arn:aws:sqs");
      }
    });

    test("API Gateway is deployed", async () => {
      const restApiId = outputs.api_gateway_id;
      const command = new GetStageCommand({
        restApiId,
        stageName: "production",
      });
      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBe("production");
    });
  });

  describe("Monitoring and Observability", () => {
    test("CloudWatch alarms are created", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: "",
        MaxRecords: 100,
      });
      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      // Filter alarms for this environment (synthf0oir)
      const ourAlarms = alarms.filter((alarm) =>
        alarm.AlarmName?.includes("synthf0oir")
      );

      // Expected: 18 alarms (12 Lambda + 6 SQS + 3 DLQ + 3 API Gateway)
      expect(ourAlarms.length).toBeGreaterThanOrEqual(18);
    });

    test("SNS topic for alarms exists", async () => {
      const topicArn = outputs.alarm_topic_arn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test("X-Ray tracing is enabled on Lambda functions", async () => {
      const functions = [
        outputs.validator_lambda_arn,
        outputs.processor_lambda_arn,
        outputs.notifier_lambda_arn,
      ];

      for (const arn of functions) {
        const functionName = arn.split(":").pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.TracingConfig?.Mode).toBe("Active");
      }
    });

    test("X-Ray tracing is enabled on API Gateway", async () => {
      const restApiId = outputs.api_gateway_id;
      const command = new GetStageCommand({
        restApiId,
        stageName: "production",
      });
      const response = await apiGatewayClient.send(command);
      expect(response.tracingEnabled).toBe(true);
    });
  });

  describe("Alarm Configuration", () => {
    test("Lambda error rate alarms are configured correctly", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [
          "lambda-validator-errors-synthf0oir",
          "lambda-processor-errors-synthf0oir",
          "lambda-notifier-errors-synthf0oir",
        ],
      });
      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      expect(alarms.length).toBe(3);
      alarms.forEach((alarm) => {
        expect(alarm.Threshold).toBe(5); // 5% error rate
        expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
      });
    });

    test("SQS queue age alarms are configured correctly", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [
          "sqs-validation-queue-age-synthf0oir",
          "sqs-processing-queue-age-synthf0oir",
          "sqs-notification-queue-age-synthf0oir",
        ],
      });
      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      expect(alarms.length).toBe(3);
      alarms.forEach((alarm) => {
        expect(alarm.Threshold).toBe(300); // 300 seconds
        expect(alarm.MetricName).toBe("ApproximateAgeOfOldestMessage");
      });
    });

    test("DLQ alarms trigger on any message", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [
          "sqs-validation-dlq-messages-synthf0oir",
          "sqs-processing-dlq-messages-synthf0oir",
          "sqs-notification-dlq-messages-synthf0oir",
        ],
      });
      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      expect(alarms.length).toBe(3);
      alarms.forEach((alarm) => {
        expect(alarm.Threshold).toBe(0); // Trigger on any message
        expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
      });
    });

    test("API Gateway error rate alarms are configured correctly", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [
          "apigateway-4xx-errors-synthf0oir",
          "apigateway-5xx-errors-synthf0oir",
        ],
      });
      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      expect(alarms.length).toBe(2);

      const alarm4xx = alarms.find((a) => a.AlarmName?.includes("4xx"));
      const alarm5xx = alarms.find((a) => a.AlarmName?.includes("5xx"));

      expect(alarm4xx?.Threshold).toBe(10); // 10% for 4xx
      expect(alarm5xx?.Threshold).toBe(1);  // 1% for 5xx
    });
  });
});
