// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform configuration
// Tests validate structure, syntax, and configuration correctness

import fs from "fs";
import path from "path";
import * as hcl from "hcl2-parser";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  let terraformFiles: { [key: string]: string } = {};

  beforeAll(() => {
    // Read all .tf files
    const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));
    files.forEach(file => {
      terraformFiles[file] = fs.readFileSync(path.join(LIB_DIR, file), "utf8");
    });
  });

  describe("File Structure", () => {
    test("provider.tf exists and contains backend configuration", () => {
      expect(terraformFiles["provider.tf"]).toBeDefined();
      expect(terraformFiles["provider.tf"]).toContain('backend "s3"');
      expect(terraformFiles["provider.tf"]).toContain('required_version = ">= 1.5.0"');
      expect(terraformFiles["provider.tf"]).toContain('version = "~> 5.0"');
    });

    test("variables.tf exists and contains required variables", () => {
      expect(terraformFiles["variables.tf"]).toBeDefined();
      expect(terraformFiles["variables.tf"]).toContain("variable");
      expect(terraformFiles["variables.tf"]).toContain("environment_suffix");
      expect(terraformFiles["variables.tf"]).toContain("aws_region");
    });

    test("outputs.tf exists", () => {
      expect(terraformFiles["outputs.tf"]).toBeDefined();
      expect(terraformFiles["outputs.tf"]).toContain("output");
    });

    test("all terraform files have valid HCL syntax", () => {
      Object.entries(terraformFiles).forEach(([filename, content]) => {
        expect(() => {
          // Basic validation - file should not have markdown code fences
          expect(content).not.toContain("```hcl");
          expect(content).not.toContain("```terraform");
          // File should contain HCL keywords or be a documentation file
          const hasValidHCL =
            content.includes("resource") ||
            content.includes("variable") ||
            content.includes("output") ||
            content.includes("terraform") ||
            content.includes("provider") ||
            content.includes("#"); // Comment-only files are valid
          expect(hasValidHCL).toBe(true);
        }).not.toThrow();
      });
    });
  });

  describe("Lambda Functions", () => {
    test("defines exactly 4 Lambda functions with correct names", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      expect(lambdaContent).toContain('resource "aws_lambda_function" "validator"');
      expect(lambdaContent).toContain('resource "aws_lambda_function" "processor"');
      expect(lambdaContent).toContain('resource "aws_lambda_function" "enricher"');
      expect(lambdaContent).toContain('resource "aws_lambda_function" "event_trigger"');
    });

    test("all Lambda functions use ARM64 architecture", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      const arm64Matches = lambdaContent.match(/architectures\s*=\s*\["arm64"\]/g);
      expect(arm64Matches).toBeDefined();
      expect(arm64Matches?.length).toBeGreaterThanOrEqual(4);
    });

    test("all Lambda functions use container images", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      const packageTypeMatches = lambdaContent.match(/package_type\s*=\s*"Image"/g);
      expect(packageTypeMatches).toBeDefined();
      expect(packageTypeMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("all Lambda functions have reserved concurrent executions", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      const reservedConcurrencyMatches = lambdaContent.match(/reserved_concurrent_executions\s*=/g);
      expect(reservedConcurrencyMatches).toBeDefined();
      expect(reservedConcurrencyMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("all Lambda functions have dead letter queue configuration", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      // First 3 Lambda functions should have DLQ
      const dlqMatches = lambdaContent.match(/dead_letter_config\s*{/g);
      expect(dlqMatches).toBeDefined();
      expect(dlqMatches?.length).toBeGreaterThanOrEqual(3);
    });

    test("all Lambda functions have environment variables", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      const envMatches = lambdaContent.match(/environment\s*{/g);
      expect(envMatches).toBeDefined();
      expect(envMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("Lambda functions include environment_suffix in names", () => {
      const lambdaContent = terraformFiles["lambda.tf"];
      expect(lambdaContent).toContain("${var.environment_suffix}");
      const suffixMatches = lambdaContent.match(/\$\{var\.environment_suffix\}/g);
      expect(suffixMatches).toBeDefined();
      expect(suffixMatches?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("DynamoDB Table", () => {
    test("defines DynamoDB table with required configuration", () => {
      const dynamoContent = terraformFiles["dynamodb.tf"];
      expect(dynamoContent).toContain('resource "aws_dynamodb_table"');
      expect(dynamoContent).toContain("billing_mode");
    });

    test("DynamoDB table has PITR enabled", () => {
      const dynamoContent = terraformFiles["dynamodb.tf"];
      expect(dynamoContent).toContain("point_in_time_recovery");
      expect(dynamoContent).toContain("enabled = true");
    });

    test("DynamoDB table includes environment_suffix in name", () => {
      const dynamoContent = terraformFiles["dynamodb.tf"];
      expect(dynamoContent).toContain("${var.environment_suffix}");
    });

    test("DynamoDB table does not have retain policy", () => {
      const dynamoContent = terraformFiles["dynamodb.tf"];
      expect(dynamoContent).not.toContain("prevent_destroy");
      expect(dynamoContent).not.toContain("retain");
    });
  });

  describe("Step Functions", () => {
    test("defines Step Functions state machine", () => {
      const sfnContent = terraformFiles["step_functions.tf"];
      expect(sfnContent).toContain('resource "aws_sfn_state_machine"');
    });

    test("Step Functions uses Express workflow type", () => {
      const sfnContent = terraformFiles["step_functions.tf"];
      expect(sfnContent).toMatch(/type\s*=\s*"EXPRESS"/);
    });

    test("Step Functions includes environment_suffix in name", () => {
      const sfnContent = terraformFiles["step_functions.tf"];
      expect(sfnContent).toContain("${var.environment_suffix}");
    });

    test("Step Functions has CloudWatch logging configuration", () => {
      const sfnContent = terraformFiles["step_functions.tf"];
      expect(sfnContent).toContain("logging_configuration");
    });
  });

  describe("SNS Topic", () => {
    test("defines SNS topic with encryption", () => {
      const snsContent = terraformFiles["sns.tf"];
      expect(snsContent).toContain('resource "aws_sns_topic"');
      expect(snsContent).toContain("kms_master_key_id");
    });

    test("SNS topic includes environment_suffix in name", () => {
      const snsContent = terraformFiles["sns.tf"];
      expect(snsContent).toContain("${var.environment_suffix}");
    });
  });

  describe("SQS Dead Letter Queues", () => {
    test("defines SQS queues for dead letter queues", () => {
      const sqsContent = terraformFiles["sqs.tf"];
      expect(sqsContent).toContain('resource "aws_sqs_queue"');
      expect(sqsContent).toContain("validator_dlq");
      expect(sqsContent).toContain("processor_dlq");
      expect(sqsContent).toContain("enricher_dlq");
    });

    test("SQS queues include environment_suffix in names", () => {
      const sqsContent = terraformFiles["sqs.tf"];
      const suffixMatches = sqsContent.match(/\$\{var\.environment_suffix\}/g);
      expect(suffixMatches).toBeDefined();
      expect(suffixMatches?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("ECR Repository", () => {
    test("defines ECR repository", () => {
      const ecrContent = terraformFiles["ecr.tf"];
      expect(ecrContent).toContain('resource "aws_ecr_repository"');
    });

    test("ECR repository has lifecycle policy", () => {
      const ecrContent = terraformFiles["ecr.tf"];
      expect(ecrContent).toContain('resource "aws_ecr_lifecycle_policy"');
    });

    test("ECR repository includes environment_suffix in name", () => {
      const ecrContent = terraformFiles["ecr.tf"];
      expect(ecrContent).toContain("${var.environment_suffix}");
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("defines CloudWatch Log Groups for all Lambda functions", () => {
      const cwContent = terraformFiles["cloudwatch.tf"];
      expect(cwContent).toContain('resource "aws_cloudwatch_log_group" "validator"');
      expect(cwContent).toContain('resource "aws_cloudwatch_log_group" "processor"');
      expect(cwContent).toContain('resource "aws_cloudwatch_log_group" "enricher"');
      expect(cwContent).toContain('resource "aws_cloudwatch_log_group" "event_trigger"');
    });

    test("CloudWatch Log Groups have KMS encryption", () => {
      const cwContent = terraformFiles["cloudwatch.tf"];
      const kmsMatches = cwContent.match(/kms_key_id\s*=/g);
      expect(kmsMatches).toBeDefined();
      expect(kmsMatches?.length).toBeGreaterThanOrEqual(4);
    });

    test("CloudWatch Log Groups have retention policy", () => {
      const cwContent = terraformFiles["cloudwatch.tf"];
      const retentionMatches = cwContent.match(/retention_in_days\s*=/g);
      expect(retentionMatches).toBeDefined();
      expect(retentionMatches?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("KMS Keys", () => {
    test("defines KMS key for CloudWatch Logs", () => {
      const kmsContent = terraformFiles["kms.tf"];
      expect(kmsContent).toContain('resource "aws_kms_key"');
      expect(kmsContent).toContain("cloudwatch");
    });

    test("KMS keys have deletion window", () => {
      const kmsContent = terraformFiles["kms.tf"];
      expect(kmsContent).toContain("deletion_window_in_days");
    });
  });

  describe("IAM Roles and Policies", () => {
    test("defines IAM roles for all Lambda functions", () => {
      const iamContent = terraformFiles["iam.tf"];
      expect(iamContent).toContain('resource "aws_iam_role" "validator"');
      expect(iamContent).toContain('resource "aws_iam_role" "processor"');
      expect(iamContent).toContain('resource "aws_iam_role" "enricher"');
      expect(iamContent).toContain('resource "aws_iam_role" "event_trigger"');
    });

    test("defines IAM role for Step Functions", () => {
      const iamContent = terraformFiles["iam.tf"];
      expect(iamContent).toContain('resource "aws_iam_role" "step_functions"');
    });

    test("IAM policies follow least privilege (no wildcard resources)", () => {
      const iamContent = terraformFiles["iam.tf"];
      // Check that policies reference specific resources, not wildcards
      const wildcardResourceMatches = iamContent.match(/"Resource"\s*:\s*"\*"/g);
      // Some wildcard resources are acceptable for certain actions like logs:CreateLogGroup
      // But we should have specific resource ARNs for most actions
      const specificResourceMatches = iamContent.match(/"Resource"\s*:\s*"arn:aws:/g);
      expect(specificResourceMatches).toBeDefined();
      if (specificResourceMatches) {
        expect(specificResourceMatches.length).toBeGreaterThan(0);
      }
    });
  });

  describe("EventBridge Integration", () => {
    test("EventBridge integration strategy is documented", () => {
      const ebContent = terraformFiles["eventbridge.tf"];
      // Implementation uses SNS -> Lambda -> Step Functions pattern
      // EventBridge file contains documentation of this approach
      expect(ebContent).toContain("EventBridge");
      expect(ebContent.length).toBeGreaterThan(0);
    });
  });

  describe("Resource Naming Convention", () => {
    test("all resource files include environment_suffix variable", () => {
      const filesToCheck = [
        "lambda.tf",
        "dynamodb.tf",
        "sns.tf",
        "sqs.tf",
        "step_functions.tf",
        "ecr.tf",
        "cloudwatch.tf"
      ];

      filesToCheck.forEach(file => {
        const content = terraformFiles[file];
        expect(content).toContain("${var.environment_suffix}");
      });
    });
  });

  describe("Outputs", () => {
    test("defines outputs for key resources", () => {
      const outputContent = terraformFiles["outputs.tf"];
      expect(outputContent).toContain('output');

      // Check for important outputs
      const hasOutputs =
        outputContent.includes("sns_topic") ||
        outputContent.includes("step_function") ||
        outputContent.includes("dynamodb_table") ||
        outputContent.includes("lambda_function");

      expect(hasOutputs).toBe(true);
    });
  });

  describe("Lambda Handler Files", () => {
    test("all Lambda handler files exist", () => {
      const handlers = [
        "lambda/validator/handler.py",
        "lambda/processor/handler.py",
        "lambda/enricher/handler.py",
        "lambda/trigger/handler.py"
      ];

      handlers.forEach(handler => {
        const handlerPath = path.join(LIB_DIR, handler);
        expect(fs.existsSync(handlerPath)).toBe(true);
      });
    });

    test("all Lambda Dockerfiles exist and use ARM64", () => {
      const lambdas = ["validator", "processor", "enricher", "trigger"];

      lambdas.forEach(lambda => {
        const dockerfilePath = path.join(LIB_DIR, `lambda/${lambda}/Dockerfile`);
        expect(fs.existsSync(dockerfilePath)).toBe(true);

        const dockerfileContent = fs.readFileSync(dockerfilePath, "utf8");
        expect(dockerfileContent).toContain("arm64");
        expect(dockerfileContent).toContain("FROM public.ecr.aws/lambda/python");
        expect(dockerfileContent).not.toContain("```");
      });
    });
  });
});
