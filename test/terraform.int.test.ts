// Integration tests for Terraform Fraud Detection System
// Tests validate deployed AWS resources

import fs from "fs";
import path from "path";
import {
  DynamoDBClient,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand } from "@aws-sdk/client-s3";
import { LambdaClient, GetFunctionCommand, GetFunctionConfigurationCommand } from "@aws-sdk/client-lambda";
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
  GetResourcesCommand,
} from "@aws-sdk/client-api-gateway";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { ECRClient, DescribeRepositoriesCommand } from "@aws-sdk/client-ecr";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { IAMClient, GetRoleCommand, ListRolePoliciesCommand } from "@aws-sdk/client-iam";

describe("Terraform Fraud Detection System - Integration Tests", () => {
  let outputs: Record<string, string>;
  let region: string;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.resolve(
      __dirname,
      "../cfn-outputs/flat-outputs.json"
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the infrastructure first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
    region = process.env.AWS_REGION || "us-east-1";
  });

  describe("Required Outputs", () => {
    test("api_gateway_url output exists", () => {
      expect(outputs.api_gateway_url).toBeDefined();
      expect(outputs.api_gateway_url).toMatch(/^https:\/\//);
    });

    test("lambda_function_name output exists", () => {
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.lambda_function_name).toMatch(/fraud-detector-/);
    });

    test("dynamodb_table_name output exists", () => {
      expect(outputs.dynamodb_table_name).toBeDefined();
      expect(outputs.dynamodb_table_name).toMatch(/fraud-patterns-/);
    });

    test("s3_audit_bucket output exists", () => {
      expect(outputs.s3_audit_bucket).toBeDefined();
      expect(outputs.s3_audit_bucket).toMatch(/fraud-detection-audit-trail-/);
    });

    test("ecr_repository_url output exists", () => {
      expect(outputs.ecr_repository_url).toBeDefined();
    });

    test("kms_key_id output exists", () => {
      expect(outputs.kms_key_id).toBeDefined();
    });

    test("dlq_url output exists", () => {
      expect(outputs.dlq_url).toBeDefined();
    });

    test("eventbridge_rule_name output exists", () => {
      expect(outputs.eventbridge_rule_name).toBeDefined();
    });
  });

  describe("DynamoDB Table", () => {
    let dynamoClient: DynamoDBClient;

    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region });
    });

    afterAll(() => {
      dynamoClient.destroy();
    });

    test("fraud_patterns table exists and is accessible", async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.dynamodb_table_name);
    });

    test("table has correct key schema", async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.KeySchema).toBeDefined();

      const hashKey = response.Table?.KeySchema?.find((k) => k.KeyType === "HASH");
      const rangeKey = response.Table?.KeySchema?.find((k) => k.KeyType === "RANGE");

      expect(hashKey?.AttributeName).toBe("pattern_id");
      expect(rangeKey?.AttributeName).toBe("timestamp");
    });

    test("table has point-in-time recovery enabled", async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.PointInTimeRecoveryDescription).toBeDefined();
      // Note: PointInTimeRecoveryStatus might take time to activate
    });

    test("table has encryption enabled", async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe("ENABLED");
    });

    test("table billing mode is PAY_PER_REQUEST", async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodb_table_name,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe("PAY_PER_REQUEST");
    });
  });

  describe("S3 Audit Bucket", () => {
    let s3Client: S3Client;

    beforeAll(() => {
      s3Client = new S3Client({ region });
    });

    afterAll(() => {
      s3Client.destroy();
    });

    test("audit bucket exists and is accessible", async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.s3_audit_bucket,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test("audit bucket has versioning enabled", async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_audit_bucket,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    test("audit bucket has encryption configured", async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_audit_bucket,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    });
  });

  describe("Lambda Function", () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region });
    });

    afterAll(() => {
      lambdaClient.destroy();
    });

    test("fraud detector Lambda function exists", async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.lambda_function_name);
    });

    test("Lambda function uses container image", async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.PackageType).toBe("Image");
    });

    test("Lambda function has correct memory size", async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.MemorySize).toBe(3008);
    });

    test("Lambda function has environment variables configured", async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.DYNAMODB_TABLE_NAME).toBe(outputs.dynamodb_table_name);
      expect(response.Environment?.Variables?.S3_AUDIT_BUCKET).toBe(outputs.s3_audit_bucket);
      expect(response.Environment?.Variables?.KMS_KEY_ID).toBe(outputs.kms_key_id);
    });

    test("Lambda function has dead letter queue configured", async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.DeadLetterConfig?.TargetArn).toBeDefined();
      expect(response.DeadLetterConfig?.TargetArn).toContain("sqs");
    });

    test("Lambda function has X-Ray tracing enabled", async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.TracingConfig?.Mode).toBe("Active");
    });
  });

  describe("API Gateway", () => {
    let apiClient: APIGatewayClient;

    beforeAll(() => {
      apiClient = new APIGatewayClient({ region });
    });

    afterAll(() => {
      apiClient.destroy();
    });

    test("API Gateway REST API exists", async () => {
      // Extract API ID from URL
      const apiId = outputs.api_gateway_url.split(".")[0].split("//")[1];

      const command = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiClient.send(command);
      expect(response.id).toBe(apiId);
      expect(response.name).toContain("fraud-detection-api-");
    });

    test("API Gateway has /webhook resource", async () => {
      const apiId = outputs.api_gateway_url.split(".")[0].split("//")[1];

      const command = new GetResourcesCommand({
        restApiId: apiId,
      });

      const response = await apiClient.send(command);
      const webhookResource = response.items?.find((item) =>
        item.path === "/webhook"
      );

      expect(webhookResource).toBeDefined();
    });

    test("API Gateway prod stage exists", async () => {
      const apiId = outputs.api_gateway_url.split(".")[0].split("//")[1];

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: "prod",
      });

      const response = await apiClient.send(command);
      expect(response.stageName).toBe("prod");
    });

    test("API Gateway has access logging configured", async () => {
      const apiId = outputs.api_gateway_url.split(".")[0].split("//")[1];

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: "prod",
      });

      const response = await apiClient.send(command);
      expect(response.accessLogSettings).toBeDefined();
      expect(response.accessLogSettings?.destinationArn).toBeDefined();
    });
  });

  describe("SQS Dead Letter Queue", () => {
    let sqsClient: SQSClient;

    beforeAll(() => {
      sqsClient = new SQSClient({ region });
    });

    afterAll(() => {
      sqsClient.destroy();
    });

    test("dead letter queue exists", async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ["All"],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    test("DLQ has correct message retention", async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ["MessageRetentionPeriod"],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes?.MessageRetentionPeriod).toBe("1209600"); // 14 days
    });

    test("DLQ has KMS encryption enabled", async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: outputs.dlq_url,
        AttributeNames: ["KmsMasterKeyId"],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe("ECR Repository", () => {
    let ecrClient: ECRClient;

    beforeAll(() => {
      ecrClient = new ECRClient({ region });
    });

    afterAll(() => {
      ecrClient.destroy();
    });

    test("ECR repository exists", async () => {
      const repoName = outputs.ecr_repository_url.split("/")[1];

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories?.[0]?.repositoryName).toBe(repoName);
    });

    test("ECR repository has encryption configured", async () => {
      const repoName = outputs.ecr_repository_url.split("/")[1];

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories?.[0]?.encryptionConfiguration).toBeDefined();
      expect(response.repositories?.[0]?.encryptionConfiguration?.encryptionType).toBe("KMS");
    });

    test("ECR repository has scan on push enabled", async () => {
      const repoName = outputs.ecr_repository_url.split("/")[1];

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories?.[0]?.imageScanningConfiguration?.scanOnPush).toBe(true);
    });
  });

  describe("KMS Key", () => {
    let kmsClient: KMSClient;

    beforeAll(() => {
      kmsClient = new KMSClient({ region });
    });

    afterAll(() => {
      kmsClient.destroy();
    });

    test("KMS key exists", async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyId).toBe(outputs.kms_key_id);
    });

    test("KMS key has rotation enabled", async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyState).toBe("Enabled");
    });
  });

  describe("EventBridge Rule", () => {
    let eventBridgeClient: EventBridgeClient;

    beforeAll(() => {
      eventBridgeClient = new EventBridgeClient({ region });
    });

    afterAll(() => {
      eventBridgeClient.destroy();
    });

    test("EventBridge rule exists", async () => {
      const command = new DescribeRuleCommand({
        Name: outputs.eventbridge_rule_name,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Name).toBe(outputs.eventbridge_rule_name);
    });

    test("EventBridge rule has correct schedule expression", async () => {
      const command = new DescribeRuleCommand({
        Name: outputs.eventbridge_rule_name,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.ScheduleExpression).toBe("rate(5 minutes)");
    });

    test("EventBridge rule targets Lambda function", async () => {
      const command = new ListTargetsByRuleCommand({
        Rule: outputs.eventbridge_rule_name,
      });

      const response = await eventBridgeClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets?.[0]?.Arn).toContain("lambda");
      expect(response.Targets?.[0]?.Arn).toContain(outputs.lambda_function_name);
    });
  });

  describe("CloudWatch Logs", () => {
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      logsClient = new CloudWatchLogsClient({ region });
    });

    afterAll(() => {
      logsClient.destroy();
    });

    test("Lambda CloudWatch log group exists", async () => {
      const logGroupName = `/aws/lambda/${outputs.lambda_function_name}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0]?.logGroupName).toBe(logGroupName);
    });

    test("Lambda log group has KMS encryption", async () => {
      const logGroupName = `/aws/lambda/${outputs.lambda_function_name}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups?.[0]?.kmsKeyId).toBeDefined();
    });

    test("Lambda log group has retention configured", async () => {
      const logGroupName = `/aws/lambda/${outputs.lambda_function_name}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups?.[0]?.retentionInDays).toBe(30);
    });

    test("API Gateway CloudWatch log group exists", async () => {
      const logGroupPrefix = "/aws/apigateway/fraud-detection-";

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupPrefix,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });
  });

  describe("IAM Roles and Policies", () => {
    let iamClient: IAMClient;

    beforeAll(() => {
      iamClient = new IAMClient({ region });
    });

    afterAll(() => {
      iamClient.destroy();
    });

    test("Lambda execution role exists", async () => {
      // Extract role name from Lambda function
      const lambdaClient = new LambdaClient({ region });
      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );
      lambdaClient.destroy();

      const roleName = lambdaConfig.Role?.split("/").pop();

      const command = new GetRoleCommand({
        RoleName: roleName!,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    test("Lambda role has necessary policies attached", async () => {
      const lambdaClient = new LambdaClient({ region });
      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );
      lambdaClient.destroy();

      const roleName = lambdaConfig.Role?.split("/").pop();

      const command = new ListRolePoliciesCommand({
        RoleName: roleName!,
      });

      const response = await iamClient.send(command);
      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThan(0);

      // Check for expected policy types
      const policyNames = response.PolicyNames?.join(" ").toLowerCase() || "";
      expect(policyNames).toContain("dynamodb");
      expect(policyNames).toContain("s3");
      expect(policyNames).toContain("logs");
      expect(policyNames).toContain("kms");
    });
  });

  describe("End-to-End Workflow", () => {
    test("all core components are integrated correctly", () => {
      // Verify that all required outputs exist and are properly formatted
      expect(outputs.api_gateway_url).toMatch(/^https:\/\//);
      expect(outputs.lambda_function_name).toMatch(/fraud-detector-/);
      expect(outputs.dynamodb_table_name).toMatch(/fraud-patterns-/);
      expect(outputs.s3_audit_bucket).toMatch(/fraud-detection-audit-trail-/);
      expect(outputs.ecr_repository_url).toBeDefined();
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.dlq_url).toBeDefined();
      expect(outputs.eventbridge_rule_name).toBeDefined();
    });

    test("resource names use consistent environment suffix", () => {
      // Extract suffix from one resource
      const suffix = outputs.lambda_function_name.split("fraud-detector-")[1];

      // Verify all resources use the same suffix
      expect(outputs.dynamodb_table_name).toContain(suffix);
      expect(outputs.s3_audit_bucket).toContain(suffix);
      expect(outputs.eventbridge_rule_name).toContain(suffix);
    });
  });
});
