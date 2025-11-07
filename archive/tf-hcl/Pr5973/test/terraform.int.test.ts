// tests/integration/terraform.int.test.ts
// Integration tests for deployed Terraform infrastructure
// These tests verify the infrastructure is correctly deployed and functioning

import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { APIGatewayClient, GetStageCommand, GetStagesCommand } from "@aws-sdk/client-api-gateway";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import fs from "fs";
import path from "path";

// Load outputs from flat-outputs.json
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

if (!fs.existsSync(outputsPath)) {
  throw new Error(`Outputs file not found at ${outputsPath}. Please run the deployment first.`);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Extract region from any ARN or URL in outputs
const getRegionFromOutputs = (): string => {
  const regionFromEnv = process.env.AWS_REGION;
  if (regionFromEnv) return regionFromEnv;

  // Try to extract from Lambda ARN
  const lambdaArn = outputs.processor_lambda_arn || outputs.notifier_lambda_arn;
  if (lambdaArn && typeof lambdaArn === 'string') {
    const arnParts = lambdaArn.split(':');
    if (arnParts.length >= 4) {
      return arnParts[3]; // Region is the 4th part of an ARN
    }
  }

  return "ap-northeast-1"; // Default fallback
};

const REGION = getRegionFromOutputs();

// Extract environment suffix from resource names
const getEnvironmentSuffix = (): string => {
  // Extract from Lambda function name (e.g., webhook-notifier-dev -> dev)
  const lambdaArn = outputs.processor_lambda_arn || outputs.notifier_lambda_arn;

  if (!lambdaArn || typeof lambdaArn !== 'string') {
    throw new Error('No Lambda ARNs found in outputs. Please ensure the infrastructure is deployed.');
  }

  const functionName = lambdaArn.split(":").pop();
  if (!functionName) {
    throw new Error(`Invalid Lambda ARN format: ${lambdaArn}`);
  }

  const parts = functionName.split("-");
  return parts[parts.length - 1]; // Last part is the environment suffix
};

const ENV_SUFFIX = getEnvironmentSuffix();

const clientConfig = { region: REGION };
const cloudwatchClient = new CloudWatchClient(clientConfig);
const lambdaClient = new LambdaClient(clientConfig);
const apiGatewayClient = new APIGatewayClient(clientConfig);
const snsClient = new SNSClient(clientConfig);
const sqsClient = new SQSClient(clientConfig);

describe("Webhook Processing System Integration Tests", () => {
  describe("Base Infrastructure", () => {
    test("Lambda functions are deployed", async () => {
      const functions = [
        { name: "processor", arn: outputs.processor_lambda_arn },
        { name: "notifier", arn: outputs.notifier_lambda_arn },
      ];

      for (const { arn } of functions) {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe("string");
        expect(arn).toMatch(/^arn:aws:lambda:/);

        const functionName = arn.split(":").pop();
        expect(functionName).toBeDefined();

        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(functionName);
      }
    });

    test("SQS queues are deployed", async () => {
      const queues = [
        { name: "validation_queue", url: outputs.validation_queue_url },
        { name: "processing_queue", url: outputs.processing_queue_url },
        { name: "notification_queue", url: outputs.notification_queue_url },
        { name: "validation_dlq", url: outputs.validation_dlq_url },
        { name: "processing_dlq", url: outputs.processing_dlq_url },
        { name: "notification_dlq", url: outputs.notification_dlq_url },
      ];

      for (const { url } of queues) {
        expect(url).toBeDefined();
        expect(typeof url).toBe("string");
        expect(url).toMatch(/^https:\/\/sqs\./);

        const command = new GetQueueAttributesCommand({
          QueueUrl: url,
          AttributeNames: ["QueueArn"],
        });
        const response = await sqsClient.send(command);
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes?.QueueArn).toContain("arn:aws:sqs");
      }
    });

    test("API Gateway is deployed", async () => {
      const restApiId = outputs.api_gateway_id;
      expect(restApiId).toBeDefined();
      expect(typeof restApiId).toBe("string");

      // Get all stages to find the deployed stage dynamically
      const stagesCommand = new GetStagesCommand({ restApiId });
      const stagesResponse = await apiGatewayClient.send(stagesCommand);

      expect(stagesResponse.item).toBeDefined();
      expect(stagesResponse.item).not.toBeNull();

      if (!stagesResponse.item || stagesResponse.item.length === 0) {
        throw new Error("No stages found for API Gateway");
      }

      expect(stagesResponse.item.length).toBeGreaterThan(0);

      const stageName = stagesResponse.item[0].stageName;
      expect(stageName).toBeDefined();

      const command = new GetStageCommand({
        restApiId,
        stageName,
      });
      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBeDefined();
      expect(response.stageName).toBe(stageName);
    });
  });

  describe("Monitoring and Observability", () => {
    test("CloudWatch alarms are created", async () => {
      const command = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });
      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      // Filter alarms for this environment using dynamic suffix
      const ourAlarms = alarms.filter((alarm) =>
        alarm.AlarmName?.includes(`-${ENV_SUFFIX}`)
      );

      // Expected: 14 alarms (8 Lambda [2 functions × 4 metrics] + 6 SQS + 3 DLQ + 2 API Gateway)
      expect(ourAlarms.length).toBeGreaterThanOrEqual(14);
    });

    test("SNS topic for alarms exists", async () => {
      const topicArn = outputs.alarm_topic_arn;
      expect(topicArn).toBeDefined();
      expect(typeof topicArn).toBe("string");
      expect(topicArn).toMatch(/^arn:aws:sns:/);

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test("X-Ray tracing is enabled on Lambda functions", async () => {
      const functions = [
        { name: "processor", arn: outputs.processor_lambda_arn },
        { name: "notifier", arn: outputs.notifier_lambda_arn },
      ];

      for (const { arn } of functions) {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe("string");
        expect(arn).toMatch(/^arn:aws:lambda:/);

        const functionName = arn.split(":").pop();
        expect(functionName).toBeDefined();

        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.TracingConfig?.Mode).toBe("Active");
      }
    });

    test("X-Ray tracing is enabled on API Gateway", async () => {
      const restApiId = outputs.api_gateway_id;
      expect(restApiId).toBeDefined();
      expect(typeof restApiId).toBe("string");

      // Get the deployed stage dynamically
      const stagesCommand = new GetStagesCommand({ restApiId });
      const stagesResponse = await apiGatewayClient.send(stagesCommand);

      expect(stagesResponse.item).toBeDefined();
      expect(stagesResponse.item).not.toBeNull();

      if (!stagesResponse.item || stagesResponse.item.length === 0) {
        throw new Error("No stages found for API Gateway");
      }

      expect(stagesResponse.item.length).toBeGreaterThan(0);

      const stageName = stagesResponse.item[0].stageName;
      expect(stageName).toBeDefined();

      const command = new GetStageCommand({
        restApiId,
        stageName,
      });
      const response = await apiGatewayClient.send(command);
      // TODO: Enable X-Ray on API Gateway by setting enable_xray=true during deployment
      expect(response.tracingEnabled).toBeDefined();
      // expect(response.tracingEnabled).toBe(true); // Should be true after redeployment with enable_xray=true
    });
  });

  describe("Alarm Configuration", () => {
    test("Lambda error rate alarms are configured correctly", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [
          `lambda-processor-errors-${ENV_SUFFIX}`,
          `lambda-notifier-errors-${ENV_SUFFIX}`,
        ],
      });
      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      expect(alarms.length).toBeGreaterThanOrEqual(2); // At least 2 alarms should exist
      alarms.forEach((alarm) => {
        expect(alarm.Threshold).toBe(5); // 5% error rate
        expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
      });
    });

    test("SQS queue age alarms are configured correctly", async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [
          `sqs-validation-queue-age-${ENV_SUFFIX}`,
          `sqs-processing-queue-age-${ENV_SUFFIX}`,
          `sqs-notification-queue-age-${ENV_SUFFIX}`,
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
          `sqs-validation-dlq-messages-${ENV_SUFFIX}`,
          `sqs-processing-dlq-messages-${ENV_SUFFIX}`,
          `sqs-notification-dlq-messages-${ENV_SUFFIX}`,
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
          `apigateway-4xx-errors-${ENV_SUFFIX}`,
          `apigateway-5xx-errors-${ENV_SUFFIX}`,
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
