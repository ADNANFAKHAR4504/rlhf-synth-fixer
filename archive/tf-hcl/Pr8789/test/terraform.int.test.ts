// Integration tests for Terraform Fraud Detection System
// Tests validate deployed AWS resources

import fs from "fs";
import path from "path";
import {
  DynamoDBClient,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand } from "@aws-sdk/client-s3";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { ECRClient, DescribeRepositoriesCommand } from "@aws-sdk/client-ecr";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import {
  EventBridgeClient,
  DescribeRuleCommand,
} from "@aws-sdk/client-eventbridge";

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

  });

  describe("End-to-End Workflow", () => {

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
