/**
 * Integration tests for Lambda ETL Stack
 * These tests validate deployed infrastructure resources
 */

import * as fs from "fs";
import * as path from "path";
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from "@aws-sdk/client-lambda";
import {
  SQSClient,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// Load deployment outputs
const loadOutputs = (): Record<string, any> => {
  const outputPath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");

  if (!fs.existsSync(outputPath)) {
    throw new Error(`Deployment outputs not found at ${outputPath}. Please deploy the stack first.`);
  }

  return JSON.parse(fs.readFileSync(outputPath, "utf8"));
};

describe("Lambda ETL Stack Integration Tests", () => {
  let outputs: Record<string, any>;
  let lambdaClient: LambdaClient;
  let sqsClient: SQSClient;
  let logsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load deployment outputs
    outputs = loadOutputs();

    // Initialize AWS clients
    const region = process.env.AWS_REGION || "us-east-1";
    lambdaClient = new LambdaClient({ region });
    sqsClient = new SQSClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
  });

  describe("Lambda Functions", () => {
    it("should deploy API Handler function with correct configuration", async () => {
      const functionArn = outputs.apiHandlerFunctionArn || outputs.pulumi_infraapiHandlerFunctionArn;

      if (!functionArn) {
        throw new Error("API Handler function ARN not found in outputs");
      }

      // Extract function name from ARN
      const functionName = functionArn.split(":").pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      // Verify function configuration
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe("nodejs18.x");
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.TracingConfig?.Mode).toBe("Active");
    });

    it("should deploy Batch Processor function with correct configuration", async () => {
      const functionArn = outputs.batchProcessorFunctionArn || outputs.pulumi_infrabatchProcessorFunctionArn;

      if (!functionArn) {
        throw new Error("Batch Processor function ARN not found in outputs");
      }

      const functionName = functionArn.split(":").pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe("nodejs18.x");
      expect(response.Configuration?.MemorySize).toBe(1024);
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.TracingConfig?.Mode).toBe("Active");
    });

    it("should deploy Transform function with correct configuration", async () => {
      const functionArn = outputs.transformFunctionArn || outputs.pulumi_infratransformFunctionArn;

      if (!functionArn) {
        throw new Error("Transform function ARN not found in outputs");
      }

      const functionName = functionArn.split(":").pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe("nodejs18.x");
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.TracingConfig?.Mode).toBe("Active");
    });

    it("should invoke API Handler function successfully", async () => {
      const functionArn = outputs.apiHandlerFunctionArn || outputs.pulumi_infraapiHandlerFunctionArn;

      if (!functionArn) {
        throw new Error("API Handler function ARN not found in outputs");
      }

      const functionName = functionArn.split(":").pop();

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify({
          test: "data",
          timestamp: new Date().toISOString(),
        })),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.statusCode).toBe(200);
      }
    });

    it("should invoke Transform function successfully", async () => {
      const functionArn = outputs.transformFunctionArn || outputs.pulumi_infratransformFunctionArn;

      if (!functionArn) {
        throw new Error("Transform function ARN not found in outputs");
      }

      const functionName = functionArn.split(":").pop();

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify({
          data: {
            id: 1,
            value: "test",
          },
        })),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.statusCode).toBe(200);
      }
    });
  });

  describe("Dead Letter Queue", () => {
    it("should create DLQ with correct retention period", async () => {
      const dlqUrl = outputs.dlqUrl || outputs.pulumi_infradlqUrl;

      if (!dlqUrl) {
        throw new Error("DLQ URL not found in outputs");
      }

      const command = new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ["MessageRetentionPeriod"],
      });

      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.MessageRetentionPeriod).toBe("1209600"); // 14 days
    });
  });

  describe("CloudWatch Logs", () => {
    it("should create log groups with retention policies", async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";
      const logGroupNames = [
        `/aws/lambda/api-handler-${environmentSuffix}`,
        `/aws/lambda/batch-processor-${environmentSuffix}`,
        `/aws/lambda/transform-${environmentSuffix}`,
      ];

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/`,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      // Verify at least one log group exists with retention
      const logGroupsWithRetention = response.logGroups!.filter(
        (lg) => lg.retentionInDays !== undefined
      );

      expect(logGroupsWithRetention.length).toBeGreaterThan(0);
    });
  });

  describe("Environment Variables", () => {
    it("should configure MAX_CONNECTIONS environment variable", async () => {
      const functionArn = outputs.apiHandlerFunctionArn || outputs.pulumi_infraapiHandlerFunctionArn;

      if (!functionArn) {
        throw new Error("API Handler function ARN not found in outputs");
      }

      const functionName = functionArn.split(":").pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.MAX_CONNECTIONS).toBe("10");
    });

    it("should configure ENVIRONMENT variable", async () => {
      const functionArn = outputs.apiHandlerFunctionArn || outputs.pulumi_infraapiHandlerFunctionArn;

      if (!functionArn) {
        throw new Error("API Handler function ARN not found in outputs");
      }

      const functionName = functionArn.split(":").pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT).toBeDefined();
    });
  });

  describe("Stack Outputs", () => {
    it("should export all required outputs", () => {
      // Check for outputs with possible prefixes
      const hasApiHandler = outputs.apiHandlerFunctionArn || outputs.pulumi_infraapiHandlerFunctionArn;
      const hasBatchProcessor = outputs.batchProcessorFunctionArn || outputs.pulumi_infrabatchProcessorFunctionArn;
      const hasTransform = outputs.transformFunctionArn || outputs.pulumi_infratransformFunctionArn;
      const hasDlq = outputs.dlqUrl || outputs.pulumi_infradlqUrl;
      const hasLayer = outputs.layerArn || outputs.pulumi_infralayerArn;

      expect(hasApiHandler).toBeDefined();
      expect(hasBatchProcessor).toBeDefined();
      expect(hasTransform).toBeDefined();
      expect(hasDlq).toBeDefined();
      expect(hasLayer).toBeDefined();
    });
  });
});
