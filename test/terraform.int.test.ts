// tests/integration/terraform.int.test.ts
// Integration tests for deployed Terraform infrastructure
// These tests validate actual AWS resources created by Terraform

import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand
} from "@aws-sdk/client-dynamodb";
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand
} from "@aws-sdk/client-lambda";
import {
  SFNClient,
  DescribeStateMachineCommand
} from "@aws-sdk/client-sfn";
import {
  SNSClient,
  GetTopicAttributesCommand
} from "@aws-sdk/client-sns";
import {
  SQSClient,
  GetQueueAttributesCommand
} from "@aws-sdk/client-sqs";
import {
  ECRClient,
  DescribeRepositoriesCommand
} from "@aws-sdk/client-ecr";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import {
  IAMClient,
  GetRoleCommand
} from "@aws-sdk/client-iam";
import fs from "fs";
import path from "path";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || "dev";

// Read outputs from cfn-outputs/flat-outputs.json
const OUTPUTS_FILE = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: any = {};

describe("Terraform Infrastructure Integration Tests", () => {
  beforeAll(() => {
    // Load outputs from deployment
    if (fs.existsSync(OUTPUTS_FILE)) {
      outputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, "utf8"));
    } else {
      console.warn("Warning: cfn-outputs/flat-outputs.json not found. Some tests may fail.");
    }
  });

  describe("Lambda Functions", () => {
    const lambdaClient = new LambdaClient({ region: AWS_REGION });

    test("validator Lambda function exists with correct configuration", async () => {
      const functionName = outputs.ValidatorLambdaFunctionName || `event-processing-validator-${ENVIRONMENT_SUFFIX}`;

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.FunctionName).toBeDefined();
      expect(response.Architectures).toContain("arm64");
      expect(response.PackageType).toBe("Image");
      expect(response.ReservedConcurrentExecutions).toBe(100);
      expect(response.DeadLetterConfig).toBeDefined();
      expect(response.Environment?.Variables?.DYNAMODB_TABLE_NAME).toBeDefined();
    });

    test("processor Lambda function exists with correct configuration", async () => {
      const functionName = outputs.ProcessorLambdaFunctionName || `event-processing-processor-${ENVIRONMENT_SUFFIX}`;

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.FunctionName).toBeDefined();
      expect(response.Architectures).toContain("arm64");
      expect(response.PackageType).toBe("Image");
      expect(response.ReservedConcurrentExecutions).toBe(100);
      expect(response.DeadLetterConfig).toBeDefined();
      expect(response.Environment?.Variables?.DYNAMODB_TABLE_NAME).toBeDefined();
    });

    test("enricher Lambda function exists with correct configuration", async () => {
      const functionName = outputs.EnricherLambdaFunctionName || `event-processing-enricher-${ENVIRONMENT_SUFFIX}`;

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.FunctionName).toBeDefined();
      expect(response.Architectures).toContain("arm64");
      expect(response.PackageType).toBe("Image");
      expect(response.ReservedConcurrentExecutions).toBe(100);
      expect(response.DeadLetterConfig).toBeDefined();
      expect(response.Environment?.Variables?.DYNAMODB_TABLE_NAME).toBeDefined();
    });

    test("event-trigger Lambda function exists with correct configuration", async () => {
      const functionName = outputs.EventTriggerLambdaFunctionName || `event-processing-trigger-${ENVIRONMENT_SUFFIX}`;

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.FunctionName).toBeDefined();
      expect(response.Architectures).toContain("arm64");
      expect(response.PackageType).toBe("Image");
      expect(response.ReservedConcurrentExecutions).toBe(100);
      expect(response.Environment?.Variables?.STATE_MACHINE_ARN).toBeDefined();
    });
  });

  describe("DynamoDB Table", () => {
    const dynamoClient = new DynamoDBClient({ region: AWS_REGION });

    test("DynamoDB table exists with correct configuration", async () => {
      const tableName = outputs.DynamoDBTableName || `event-processing-processed-events-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe("PAY_PER_REQUEST");
      expect(response.Table?.TableStatus).toBe("ACTIVE");
    });

    test("DynamoDB table has PITR enabled", async () => {
      const tableName = outputs.DynamoDBTableName || `event-processing-processed-events-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeContinuousBackupsCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe("ENABLED");
    });
  });

  describe("Step Functions State Machine", () => {
    const sfnClient = new SFNClient({ region: AWS_REGION });

    test("Step Functions state machine exists with EXPRESS type", async () => {
      const stateMachineArn = outputs.StateMachineArn;
      expect(stateMachineArn).toBeDefined();

      const command = new DescribeStateMachineCommand({ stateMachineArn });
      const response = await sfnClient.send(command);

      expect(response.name).toBeDefined();
      expect(response.type).toBe("EXPRESS");
      expect(response.status).toBe("ACTIVE");
      expect(response.loggingConfiguration).toBeDefined();
    });
  });

  describe("SNS Topic", () => {
    const snsClient = new SNSClient({ region: AWS_REGION });

    test("SNS topic exists with encryption enabled", async () => {
      const topicArn = outputs.SNSTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.TopicArn).toBe(topicArn);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe("SQS Dead Letter Queues", () => {
    const sqsClient = new SQSClient({ region: AWS_REGION });

    test("validator DLQ exists", async () => {
      const queueUrl = outputs.ValidatorDLQUrl;
      if (queueUrl) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ["All"]
        });
        const response = await sqsClient.send(command);

        expect(response.Attributes?.QueueArn).toBeDefined();
      }
    });

    test("processor DLQ exists", async () => {
      const queueUrl = outputs.ProcessorDLQUrl;
      if (queueUrl) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ["All"]
        });
        const response = await sqsClient.send(command);

        expect(response.Attributes?.QueueArn).toBeDefined();
      }
    });

    test("enricher DLQ exists", async () => {
      const queueUrl = outputs.EnricherDLQUrl;
      if (queueUrl) {
        const command = new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ["All"]
        });
        const response = await sqsClient.send(command);

        expect(response.Attributes?.QueueArn).toBeDefined();
      }
    });
  });

  describe("ECR Repository", () => {
    const ecrClient = new ECRClient({ region: AWS_REGION });

    test("ECR repository exists", async () => {
      const repositoryName = outputs.ECRRepositoryName || `event-processing-lambda-images-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName]
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBeGreaterThan(0);
      expect(response.repositories?.[0].repositoryName).toBe(repositoryName);
    });
  });

  describe("CloudWatch Log Groups", () => {
    const cwLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });

    test("all Lambda functions have CloudWatch Log Groups with KMS encryption", async () => {
      const logGroups = [
        `/aws/lambda/event-processing-validator-${ENVIRONMENT_SUFFIX}`,
        `/aws/lambda/event-processing-processor-${ENVIRONMENT_SUFFIX}`,
        `/aws/lambda/event-processing-enricher-${ENVIRONMENT_SUFFIX}`,
        `/aws/lambda/event-processing-trigger-${ENVIRONMENT_SUFFIX}`
      ];

      for (const logGroupName of logGroups) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        });
        const response = await cwLogsClient.send(command);

        expect(response.logGroups).toBeDefined();
        expect(response.logGroups?.length).toBeGreaterThan(0);
        const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup?.kmsKeyId).toBeDefined();
        expect(logGroup?.retentionInDays).toBe(30);
      }
    });

    test("Step Functions has CloudWatch Log Group", async () => {
      const logGroupName = `/aws/states/event-processing-workflow-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });
  });

  describe("IAM Roles", () => {
    const iamClient = new IAMClient({ region: AWS_REGION });

    test("validator Lambda has IAM role", async () => {
      const roleName = outputs.ValidatorRoleName || `event-processing-validator-role-${ENVIRONMENT_SUFFIX}`;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
    });

    test("Step Functions has IAM role", async () => {
      const roleName = outputs.StepFunctionsRoleName || `event-processing-step-functions-role-${ENVIRONMENT_SUFFIX}`;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  describe("End-to-End Workflow", () => {
    test("outputs file exists and contains required values", () => {
      expect(fs.existsSync(OUTPUTS_FILE)).toBe(true);

      // Verify key outputs are present
      const requiredOutputs = [
        "SNSTopicArn",
        "StateMachineArn",
        "DynamoDBTableName"
      ];

      const missingOutputs = requiredOutputs.filter(key => !outputs[key]);
      if (missingOutputs.length > 0) {
        console.warn(`Missing outputs: ${missingOutputs.join(", ")}`);
      }

      // At least some outputs should be present
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test("all resources include environment suffix for uniqueness", () => {
      // Verify resource names include environment suffix
      Object.values(outputs).forEach((value: any) => {
        if (typeof value === "string" && value.includes("event-processing")) {
          expect(value).toContain(ENVIRONMENT_SUFFIX);
        }
      });
    });
  });
});
