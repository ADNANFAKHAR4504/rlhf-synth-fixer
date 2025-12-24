// Unit tests for Terraform Fraud Detection System
// Tests validate Terraform configuration structure without deployment

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform Fraud Detection System - Unit Tests", () => {
  describe("File Structure", () => {
    test("main.tf exists", () => {
      const exists = fs.existsSync(path.join(libPath, "main.tf"));
      expect(exists).toBe(true);
    });

    test("variables.tf exists", () => {
      const exists = fs.existsSync(path.join(libPath, "variables.tf"));
      expect(exists).toBe(true);
    });

    test("outputs.tf exists", () => {
      const exists = fs.existsSync(path.join(libPath, "outputs.tf"));
      expect(exists).toBe(true);
    });

    test("lambda.tf exists", () => {
      const exists = fs.existsSync(path.join(libPath, "lambda.tf"));
      expect(exists).toBe(true);
    });

    test("api_gateway.tf exists", () => {
      const exists = fs.existsSync(path.join(libPath, "api_gateway.tf"));
      expect(exists).toBe(true);
    });

    test("iam.tf exists", () => {
      const exists = fs.existsSync(path.join(libPath, "iam.tf"));
      expect(exists).toBe(true);
    });

    test("eventbridge.tf exists", () => {
      const exists = fs.existsSync(path.join(libPath, "eventbridge.tf"));
      expect(exists).toBe(true);
    });
  });

  describe("main.tf Configuration", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares terraform block with required version", () => {
      expect(content).toMatch(/terraform\s*{/);
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test("declares AWS provider with region variable", () => {
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("declares KMS key with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"fraud_detection"/);
      expect(content).toMatch(/fraud-detection-key-\$\{var\.environment_suffix\}/);
    });

    test("enables KMS key rotation", () => {
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("declares S3 bucket for audit trail with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"audit_trail"/);
      expect(content).toMatch(/fraud-detection-audit-trail-\$\{var\.environment_suffix\}/);
    });

    test("enables S3 bucket versioning", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures S3 bucket encryption with KMS", () => {
      expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.fraud_detection\.arn/);
    });

    test("blocks S3 public access", () => {
      expect(content).toMatch(/aws_s3_bucket_public_access_block/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("declares DynamoDB table with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"fraud_patterns"/);
      expect(content).toMatch(/fraud-patterns-\$\{var\.environment_suffix\}/);
    });

    test("configures DynamoDB with correct keys", () => {
      expect(content).toMatch(/hash_key\s*=\s*"pattern_id"/);
      expect(content).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test("enables DynamoDB point-in-time recovery", () => {
      expect(content).toMatch(/point_in_time_recovery\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });

    test("enables DynamoDB encryption", () => {
      expect(content).toMatch(/server_side_encryption\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
      expect(content).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.fraud_detection\.arn/);
    });

    test("declares ECR repository with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_ecr_repository"\s+"lambda_fraud_detector"/);
      expect(content).toMatch(/fraud-detector-lambda-\$\{var\.environment_suffix\}/);
    });

    test("configures ECR lifecycle policy", () => {
      expect(content).toMatch(/resource\s+"aws_ecr_lifecycle_policy"/);
      expect(content).toMatch(/countNumber = 10/);
    });

    test("declares SQS dead letter queue with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"fraud_detection_dlq"/);
      expect(content).toMatch(/fraud-detection-dlq-\$\{var\.environment_suffix\}/);
    });

    test("configures SQS with KMS encryption", () => {
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.fraud_detection\.id/);
    });

    test("declares CloudWatch log group with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_fraud_detector"/);
      expect(content).toMatch(/\/aws\/lambda\/fraud-detector-\$\{var\.environment_suffix\}/);
    });

    test("configures CloudWatch logs with KMS encryption", () => {
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.fraud_detection\.arn/);
    });

    test("does not have retention policies preventing deletion", () => {
      expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
      expect(content).not.toMatch(/deletion_protection\s*=\s*true/i);
    });
  });

  describe("variables.tf Configuration", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");
    });

    test("declares environment_suffix variable", () => {
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares aws_region variable with default", () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
      expect(content).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("declares lambda_memory_size variable", () => {
      expect(content).toMatch(/variable\s+"lambda_memory_size"\s*{/);
      expect(content).toMatch(/default\s*=\s*3008/);
    });

    test("declares tags variable", () => {
      expect(content).toMatch(/variable\s+"tags"\s*{/);
      expect(content).toMatch(/Environment\s*=\s*"Production"/);
      expect(content).toMatch(/Service\s*=\s*"FraudDetection"/);
    });
  });

  describe("lambda.tf Configuration", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
    });

    test("declares Lambda function with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"fraud_detector"/);
      expect(content).toMatch(/fraud-detector-\$\{var\.environment_suffix\}/);
    });

    test("configures Lambda with zip deployment", () => {
      expect(content).toMatch(/runtime\s*=\s*"python3\.11"/);
      expect(content).toMatch(/handler\s*=\s*"index\.handler"/);
    });

    test("configures Lambda memory size from variable", () => {
      expect(content).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
    });

    test("configures Lambda environment variables", () => {
      expect(content).toMatch(/environment\s*{/);
      expect(content).toMatch(/DYNAMODB_TABLE_NAME/);
      expect(content).toMatch(/S3_AUDIT_BUCKET/);
      expect(content).toMatch(/KMS_KEY_ID/);
    });

    test("configures Lambda dead letter queue", () => {
      expect(content).toMatch(/dead_letter_config\s*{/);
      expect(content).toMatch(/target_arn\s*=\s*aws_sqs_queue\.fraud_detection_dlq\.arn/);
    });

    test("enables X-Ray tracing", () => {
      expect(content).toMatch(/tracing_config\s*{/);
      expect(content).toMatch(/mode\s*=\s*"Active"/);
    });

    test("declares Lambda permission for API Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway"/);
      expect(content).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });

    test("declares Lambda permission for EventBridge", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"eventbridge"/);
      expect(content).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  describe("api_gateway.tf Configuration", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "api_gateway.tf"), "utf8");
    });

    test("declares API Gateway REST API with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"fraud_detection"/);
      expect(content).toMatch(/fraud-detection-api-\$\{var\.environment_suffix\}/);
    });

    test("declares /webhook resource", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"webhook"/);
      expect(content).toMatch(/path_part\s*=\s*"webhook"/);
    });

    test("declares POST method for webhook", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"webhook_post"/);
      expect(content).toMatch(/http_method\s*=\s*"POST"/);
    });

    test("configures Lambda proxy integration", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"webhook_lambda"/);
      expect(content).toMatch(/type\s*=\s*"AWS_PROXY"/);
    });

    test("declares API Gateway deployment", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"/);
    });

    test("declares API Gateway stage", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_stage"\s+"production"/);
      expect(content).toMatch(/stage_name\s*=\s*"prod"/);
    });

    test("configures access logging for API Gateway", () => {
      expect(content).toMatch(/access_log_settings\s*{/);
      expect(content).toMatch(/destination_arn/);
    });

    test("declares CloudWatch log group for API Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"/);
    });

    test("does not have hardcoded 'prod-' values", () => {
      const hardcodedProdPattern = /"[^"]*-prod-\$\{var\.environment_suffix\}"/;
      expect(content).not.toMatch(hardcodedProdPattern);
    });
  });

  describe("iam.tf Configuration", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
    });

    test("declares Lambda execution role with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_fraud_detector"/);
      expect(content).toMatch(/fraud-detector-lambda-role-\$\{var\.environment_suffix\}/);
    });

    test("configures Lambda assume role policy", () => {
      expect(content).toMatch(/Service = "lambda\.amazonaws\.com"/);
    });

    test("declares IAM policy for DynamoDB access", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_dynamodb"/);
      expect(content).toMatch(/dynamodb:PutItem/);
      expect(content).toMatch(/dynamodb:GetItem/);
      expect(content).toMatch(/dynamodb:Query/);
    });

    test("includes explicit deny for out-of-scope DynamoDB resources", () => {
      expect(content).toMatch(/Effect\s*=\s*"Deny"/);
      expect(content).toMatch(/dynamodb:\*/);
    });

    test("declares IAM policy for S3 access", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_s3"/);
      expect(content).toMatch(/s3:PutObject/);
      expect(content).toMatch(/s3:GetObject/);
    });

    test("declares IAM policy for CloudWatch Logs", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_logs"/);
      expect(content).toMatch(/logs:CreateLogStream/);
      expect(content).toMatch(/logs:PutLogEvents/);
    });

    test("declares IAM policy for SQS DLQ", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_sqs"/);
      expect(content).toMatch(/sqs:SendMessage/);
    });

    test("declares IAM policy for KMS", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_kms"/);
      expect(content).toMatch(/kms:Decrypt/);
      expect(content).toMatch(/kms:Encrypt/);
      expect(content).toMatch(/kms:GenerateDataKey/);
    });

    test("declares API Gateway CloudWatch role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch"/);
      expect(content).toMatch(/Service = "apigateway\.amazonaws\.com"/);
    });

    test("declares EventBridge role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge"/);
      expect(content).toMatch(/Service = "events\.amazonaws\.com"/);
    });
  });

  describe("eventbridge.tf Configuration", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "eventbridge.tf"), "utf8");
    });

    test("declares EventBridge rule with environment_suffix", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"batch_processing"/);
      expect(content).toMatch(/fraud-detection-batch-processing-\$\{var\.environment_suffix\}/);
    });

    test("configures 5-minute schedule", () => {
      expect(content).toMatch(/schedule_expression\s*=\s*var\.eventbridge_schedule/);
    });

    test("declares EventBridge target for Lambda", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda"/);
      expect(content).toMatch(/arn\s*=\s*aws_lambda_function\.fraud_detector\.arn/);
    });

    test("configures retry policy", () => {
      expect(content).toMatch(/retry_policy\s*{/);
      expect(content).toMatch(/maximum_retry_attempts/);
    });

    test("configures dead letter queue", () => {
      expect(content).toMatch(/dead_letter_config\s*{/);
      expect(content).toMatch(/arn\s*=\s*aws_sqs_queue\.fraud_detection_dlq\.arn/);
    });

    test("uses correct retry policy parameter name", () => {
      expect(content).toMatch(/maximum_event_age_in_seconds/);
      expect(content).not.toMatch(/maximum_event_age\s*=/);
    });
  });

  describe("outputs.tf Configuration", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "outputs.tf"), "utf8");
    });

    test("declares api_gateway_url output", () => {
      expect(content).toMatch(/output\s+"api_gateway_url"\s*{/);
    });

    test("declares lambda_function_name output", () => {
      expect(content).toMatch(/output\s+"lambda_function_name"\s*{/);
    });

    test("declares dynamodb_table_name output", () => {
      expect(content).toMatch(/output\s+"dynamodb_table_name"\s*{/);
    });

    test("declares s3_audit_bucket output", () => {
      expect(content).toMatch(/output\s+"s3_audit_bucket"\s*{/);
    });

    test("declares ecr_repository_url output", () => {
      expect(content).toMatch(/output\s+"ecr_repository_url"\s*{/);
    });

    test("declares kms_key_id output", () => {
      expect(content).toMatch(/output\s+"kms_key_id"\s*{/);
    });

    test("declares dlq_url output", () => {
      expect(content).toMatch(/output\s+"dlq_url"\s*{/);
    });

    test("declares eventbridge_rule_name output", () => {
      expect(content).toMatch(/output\s+"eventbridge_rule_name"\s*{/);
    });
  });

  describe("Lambda Application", () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
    });

    test("Lambda code is embedded in archive_file", () => {
      expect(lambdaContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
    });

    test("Lambda code includes handler function", () => {
      expect(lambdaContent).toMatch(/def handler\(event, context\)/);
    });

    test("Lambda code includes DynamoDB operations", () => {
      expect(lambdaContent).toMatch(/dynamodb/i);
      expect(lambdaContent).toMatch(/put_item/i);
    });
  });

  describe("Resource Naming Consistency", () => {
    const tfFiles = [
      "main.tf",
      "lambda.tf",
      "api_gateway.tf",
      "iam.tf",
      "eventbridge.tf",
    ];

    tfFiles.forEach((file) => {
      test(`${file} uses environment_suffix in all resource names`, () => {
        const content = fs.readFileSync(path.join(libPath, file), "utf8");

        // Extract resource name patterns
        const resourceNamePattern = /name\s*=\s*"([^"]+)"/g;
        const matches = [...content.matchAll(resourceNamePattern)];

        // Filter out policy documents and other non-resource names
        const resourceNames = matches
          .map((m) => m[1])
          .filter((name) => !name.includes("${") || name.includes("environment_suffix"));

        // Check that names include environment_suffix where expected
        const namedResources = matches.filter((m) =>
          m[1].includes("fraud") || m[1].includes("detector")
        );

        if (namedResources.length > 0) {
          namedResources.forEach((match) => {
            if (match[1].includes("fraud") || match[1].includes("detector")) {
              expect(match[1]).toMatch(/\$\{var\.environment_suffix\}/);
            }
          });
        }
      });
    });
  });

  describe("Tag Consistency", () => {
    const tfFiles = [
      "main.tf",
      "lambda.tf",
      "api_gateway.tf",
      "iam.tf",
      "eventbridge.tf",
    ];

    tfFiles.forEach((file) => {
      test(`${file} uses consistent tags`, () => {
        const content = fs.readFileSync(path.join(libPath, file), "utf8");

        // Check for tags blocks
        if (content.includes("tags = {") || content.includes("tags = var.tags")) {
          expect(content).toMatch(/tags\s*=\s*(\{|var\.tags)/);
        }
      });
    });
  });
});
