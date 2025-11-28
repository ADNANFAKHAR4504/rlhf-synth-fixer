import fs from "fs";
import path from "path";

const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

describe("Terraform Payment Events Integration Tests", () => {
  let outputs: Record<string, any> = {};
  let envSuffix = "";

  beforeAll(() => {
    const raw = fs.readFileSync(outputsPath, "utf-8");
    outputs = JSON.parse(raw);

    // Extract environment suffix dynamically from any resource name
    const candidates = [
      outputs.dynamodb_table_name,
      outputs.sns_topic_arn,
      outputs.ecr_repository_url
    ];

    for (const candidate of candidates) {
      if (candidate) {
        const match = candidate.match(/payment-events-[^-]+-dev/);
        if (match) {
          envSuffix = match[0];
          break;
        }
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

    test("All log groups follow expected naming pattern with env suffix", () => {
      const logGroups = JSON.parse(outputs.cloudwatch_log_groups);
      const logGroupKeys = ["enricher", "event_trigger", "processor", "step_functions", "validator"];

      logGroupKeys.forEach(key => {
        expect(logGroups[key]).toMatch(new RegExp(`/aws/(lambda|states)/payment-events-[a-z-]+-${envSuffix}`));
      });
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
    test("DynamoDB table name follows naming convention", () => {
      expect(outputs.dynamodb_table_name).toMatch(new RegExp(`payment-events-processed-events-${envSuffix}`));
    });

    test("DynamoDB table ARN is valid us-east-1 format", () => {
      expect(outputs.dynamodb_table_arn).toMatch(/^arn:aws:dynamodb:us-east-1:\d+:table\/payment-events-processed-events-/);
    });

    test("Table name matches ARN table name", () => {
      const arnTableName = outputs.dynamodb_table_arn.match(/table\/([^:\s]+)/)?.[1];
      expect(arnTableName).toBe(outputs.dynamodb_table_name);
    });
  });

  describe("ECR Repository", () => {
    test("ECR repository URL is in us-east-1 region", () => {
      expect(outputs.ecr_repository_url).toContain(".dkr.ecr.us-east-1.amazonaws.com/");
    });

    test("ECR repository has correct naming pattern", () => {
      expect(outputs.ecr_repository_url).toMatch(/payment-events-lambda-${envSuffix}$/);
    });
  });

  describe("Dead Letter Queues (DLQs)", () => {
    test("All DLQ URLs are valid SQS endpoints in us-east-1", () => {
      const dlqKeys = ["enricher_dlq_url", "processor_dlq_url", "validator_dlq_url"];
      dlqKeys.forEach(key => {
        expect(outputs[key]).toMatch(/^https:\/\/sqs\.us-east-1\.amazonaws\.com\/\d+\/payment-events-[a-z-]+-dlq-${envSuffix}/);
      });
    });

    test("All DLQs contain environment suffix", () => {
      const dlqKeys = ["enricher_dlq_url", "processor_dlq_url", "validator_dlq_url"];
      dlqKeys.forEach(key => {
        expect(outputs[key]).toContain(envSuffix);
      });
    });
  });

  describe("KMS Key", () => {
    test("KMS key ARN follows correct format", () => {
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
      expect(outputs.sns_topic_arn).toContain(envSuffix);
    });
  });

  describe("Cross-Service Consistency", () => {
    test("All resources use consistent environment suffix", () => {
      const suffixChecks = [
        { key: "dynamodb_table_name", pattern: new RegExp(`${envSuffix}$`) },
        { key: "sns_topic_arn", pattern: new RegExp(`${envSuffix}$`) },
        { key: "ecr_repository_url", pattern: new RegExp(`-${envSuffix}$`) }
      ];

      suffixChecks.forEach(({ key, pattern }) => {
        expect(outputs[key]).toMatch(pattern);
      });
    });

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
  });

  describe("Log Groups Naming Consistency", () => {
    test("All Lambda log groups share common prefix pattern", () => {
      const logGroups = JSON.parse(outputs.cloudwatch_log_groups);
      const lambdaKeys = ["enricher", "event_trigger", "processor", "validator"];

      const prefixes = lambdaKeys.map(key => logGroups[key].split('/')[3]);
      const commonPrefix = prefixes[0];

      prefixes.forEach(prefix => {
        expect(prefix).toMatch(/^payment-events-/);
      });
    });
  });
});
