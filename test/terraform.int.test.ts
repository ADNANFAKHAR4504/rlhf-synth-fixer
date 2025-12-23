import fs from "fs";
import path from "path";

// Ensure this path matches where your outputs are actually stored
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

describe("Terraform Payment Events Integration Tests", () => {
  let outputs: Record<string, any> = {};
  let envSuffix = "";

  beforeAll(() => {
    // 1. Load outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at: ${outputsPath}`);
    }
    const raw = fs.readFileSync(outputsPath, "utf-8");
    outputs = JSON.parse(raw);

    // 2. Extract environment suffix dynamically
    // Example Table Name: "payment-events-processed-events-dev9"
    // We expect the suffix to be the last part after the last hyphen (e.g., "dev9")
    if (outputs.dynamodb_table_name) {
      const parts = outputs.dynamodb_table_name.split('-');
      if (parts.length > 0) {
        envSuffix = parts[parts.length - 1]; // "dev9"
      }
    }

    console.log(`Detected environment suffix: ${envSuffix}`);
  });

  describe("Basic Outputs Validation", () => {
    test("All expected outputs exist and are non-empty strings", () => {
      const requiredKeys = [
        "cloudwatch_log_groups",
        "dynamodb_table_arn",
        "dynamodb_table_name",
        "ecr_repository_url",
        "enricher_dlq_url",
        "kms_key_arn",
        "processor_dlq_url",
        "sns_topic_arn",
        "validator_dlq_url"
      ];

      requiredKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(typeof outputs[key]).toBe("string");
        expect(outputs[key].trim().length).toBeGreaterThan(0);
      });
    });

    test("No outputs contain error markers", () => {
      const allOutputs = JSON.stringify(outputs).toLowerCase();
      expect(allOutputs).not.toContain("error");
      expect(allOutputs).not.toContain("failed");
      expect(allOutputs).not.toContain("invalid");
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("CloudWatch log groups JSON parses correctly", () => {
      const logGroups = JSON.parse(outputs.cloudwatch_log_groups);
      expect(logGroups).toHaveProperty("enricher");
      expect(logGroups).toHaveProperty("event_trigger");
      expect(logGroups).toHaveProperty("processor");
      expect(logGroups).toHaveProperty("step_functions");
      expect(logGroups).toHaveProperty("validator");
    });

    test("Log groups have correct service prefixes", () => {
      const logGroups = JSON.parse(outputs.cloudwatch_log_groups);
      expect(logGroups.enricher).toMatch(/^\/aws\/lambda\//);
      expect(logGroups.event_trigger).toMatch(/^\/aws\/lambda\//);
      expect(logGroups.processor).toMatch(/^\/aws\/lambda\//);
      expect(logGroups.validator).toMatch(/^\/aws\/lambda\//);
      expect(logGroups.step_functions).toMatch(/^\/aws\/states\//);
    });
  });

  describe("DynamoDB Table", () => {
    test("DynamoDB table ARN is valid us-east-1 format", () => {
      // Matches: arn:aws:dynamodb:us-east-1:123456789012:table/payment-events-processed-events-dev9
      expect(outputs.dynamodb_table_arn).toMatch(/^arn:aws:dynamodb:us-east-1:\d+:table\/payment-events-processed-events-/);
    });

    test("Table name matches ARN table name", () => {
      const arnTableName = outputs.dynamodb_table_arn.match(/table\/([^:\s]+)/)?.[1];
      expect(arnTableName).toBe(outputs.dynamodb_table_name);
    });
  });

  describe("ECR Repository", () => {
    test("ECR repository URL is in us-east-1 region", () => {
      // Accept both AWS and LocalStack ECR URLs
      expect(outputs.ecr_repository_url).toMatch(/\.dkr\.ecr\.us-east-1\.(amazonaws\.com|localhost\.localstack\.cloud(:4566)?)\//);
    });
  });

  describe("KMS Key", () => {
    test("KMS key ARN follows correct format", () => {
      // Matches: arn:aws:kms:us-east-1:123456789012:key/uuid
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:us-east-1:\d+:key\/[0-9a-f\-]{36}$/);
    });

    test("KMS key is in us-east-1 region", () => {
      expect(outputs.kms_key_arn).toContain("us-east-1");
    });
  });

  describe("SNS Topic", () => {
    test("SNS topic ARN is valid us-east-1 format", () => {
      expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:us-east-1:\d+:payment-events-topic-/);
    });

    test("SNS topic contains environment suffix", () => {
      if (envSuffix) {
        expect(outputs.sns_topic_arn).toContain(envSuffix);
      }
    });
  });

  describe("SQS Queues", () => {
    test("All DLQ URLs are valid SQS us-east-1 URLs", () => {
      const queues = [
        outputs.enricher_dlq_url,
        outputs.processor_dlq_url,
        outputs.validator_dlq_url
      ];

      queues.forEach(url => {
        // Matches both AWS and LocalStack SQS URLs:
        // AWS: https://sqs.us-east-1.amazonaws.com/123456789012/queue-name
        // LocalStack: http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/queue-name
        expect(url).toMatch(/^https?:\/\/sqs\.us-east-1\.(amazonaws\.com|localhost\.localstack\.cloud(:4566)?)\/\d+\/.+/);
      });
    });
  });

  describe("Cross-Service Consistency", () => {
    test("All AWS resources are in us-east-1 region", () => {
      const regionChecks = [
        outputs.dynamodb_table_arn,
        outputs.kms_key_arn,
        outputs.sns_topic_arn,
        outputs.ecr_repository_url,
        outputs.enricher_dlq_url,
        outputs.processor_dlq_url,
        outputs.validator_dlq_url
      ];

      regionChecks.forEach(value => {
        expect(value).toContain("us-east-1");
      });
    });

    test("All resources share the same environment suffix", () => {
      // If we found a suffix, ensure it exists in other key resources
      if (envSuffix) {
        expect(outputs.dynamodb_table_name).toContain(envSuffix);
        expect(outputs.sns_topic_arn).toContain(envSuffix);
        expect(outputs.ecr_repository_url).toContain(envSuffix);
        expect(outputs.enricher_dlq_url).toContain(envSuffix);
      }
    });
  });

  describe("Log Groups Naming Consistency", () => {
    test("All Lambda log groups share common prefix pattern", () => {
      const logGroups = JSON.parse(outputs.cloudwatch_log_groups);
      const lambdaKeys = ["enricher", "event_trigger", "processor", "validator"];

      // Check that all Lambda log groups start with /aws/lambda/payment-events-
      lambdaKeys.forEach(key => {
        const logGroupName = logGroups[key];
        // Split by '/' -> ["", "aws", "lambda", "payment-events-xxx"]
        // We expect the name to start with payment-events
        const namePart = logGroupName.split('/').pop();
        expect(namePart).toMatch(/^payment-events-/);
      });
    });
  });
});
