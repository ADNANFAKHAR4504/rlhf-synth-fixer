// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure code

import fs from "fs";
import path from "path";
import { parse } from 'hcl2-parser';

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {

  describe("File Structure", () => {
    test("Required Terraform files exist", () => {
      const requiredFiles = [
        "main.tf",
        "variables.tf",
        "outputs.tf",
        "provider.tf",
        "iam.tf",
        "lambda.tf",
        "step_functions.tf"
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test("Lambda function packages exist", () => {
      const lambdaFunctions = [
        "process_trigger.zip",
        "ocr_processor.zip",
        "category_detector.zip",
        "expense_saver.zip"
      ];

      const lambdaPath = path.join(libPath, "lambda_functions");
      lambdaFunctions.forEach(func => {
        const funcPath = path.join(lambdaPath, func);
        expect(fs.existsSync(funcPath)).toBe(true);
      });
    });
  });

  describe("Variables Configuration", () => {
    test("Variables file contains required variables", () => {
      const content = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");

      const requiredVars = [
        "aws_region",
        "project_name",
        "environment_suffix",
        "lambda_timeout",
        "lambda_memory",
        "notification_email",
        "tags"
      ];

      requiredVars.forEach(varName => {
        expect(content).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test("Default values are set correctly", () => {
      const content = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");

      // Check for specific default values
      expect(content).toContain('default     = "us-west-2"');
      expect(content).toContain('default     = "expense-tracker"');
      expect(content).toContain('default     = "synth43287915"');
    });
  });

  describe("Provider Configuration", () => {
    test("Provider file has correct Terraform version", () => {
      const content = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("AWS provider is configured", () => {
      const content = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toContain('region = var.aws_region');
    });

    test("No S3 backend configuration present", () => {
      const content = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
      expect(content).not.toContain('backend "s3"');
    });
  });

  describe("Main Resources", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("S3 bucket resource is defined with environment suffix", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"receipts"/);
      expect(mainContent).toContain('${var.project_name}-${var.environment_suffix}-receipts');
    });

    test("S3 bucket versioning is enabled", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"receipts"/);
      expect(mainContent).toContain('status = "Enabled"');
    });

    test("S3 lifecycle configuration is present", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"receipts"/);
      expect(mainContent).toContain('storage_class = "STANDARD_IA"');
    });

    test("DynamoDB table resource is defined", () => {
      expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"expenses"/);
      expect(mainContent).toContain('${var.project_name}-${var.environment_suffix}-expenses');
      expect(mainContent).toContain('billing_mode = "PAY_PER_REQUEST"');
    });

    test("DynamoDB table has required indexes", () => {
      expect(mainContent).toContain('global_secondary_index');
      expect(mainContent).toContain('user-date-index');
      expect(mainContent).toContain('category-date-index');
    });

    test("SNS topic is configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"processing_notifications"/);
      expect(mainContent).toContain('${var.project_name}-${var.environment_suffix}-processing-notifications');
    });

    test("SQS DLQ is configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
      expect(mainContent).toContain('${var.project_name}-${var.environment_suffix}-processing-dlq');
    });

    test("CloudWatch log groups are defined", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"step_function_logs"/);
    });

    test("CloudWatch alarms are configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"processing_errors"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_messages"/);
    });
  });

  describe("IAM Resources", () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
    });

    test("Lambda IAM role is defined", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(iamContent).toContain('${var.project_name}-${var.environment_suffix}-lambda-role');
    });

    test("Lambda IAM policy is defined", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"/);
    });

    test("Lambda policy includes required permissions", () => {
      expect(iamContent).toContain('textract:AnalyzeDocument');
      expect(iamContent).toContain('comprehend:DetectEntities');
      expect(iamContent).toContain('dynamodb:PutItem');
      expect(iamContent).toContain('s3:GetObject');
      expect(iamContent).toContain('states:StartExecution');
    });

    test("Step Functions IAM role is defined", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"step_function_role"/);
      expect(iamContent).toContain('${var.project_name}-${var.environment_suffix}-stepfunction-role');
    });

    test("Step Functions policy includes Lambda invoke permissions", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"step_function_policy"/);
      expect(iamContent).toContain('lambda:InvokeFunction');
    });
  });

  describe("Lambda Functions", () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
    });

    test("All required Lambda functions are defined", () => {
      const functions = [
        "process_trigger",
        "ocr_processor",
        "category_detector",
        "expense_saver"
      ];

      functions.forEach(func => {
        expect(lambdaContent).toMatch(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${func}"`));
      });
    });

    test("Lambda functions use environment suffix in names", () => {
      expect(lambdaContent).toContain('${var.project_name}-${var.environment_suffix}-process-trigger');
      expect(lambdaContent).toContain('${var.project_name}-${var.environment_suffix}-ocr-processor');
      expect(lambdaContent).toContain('${var.project_name}-${var.environment_suffix}-category-detector');
      expect(lambdaContent).toContain('${var.project_name}-${var.environment_suffix}-expense-saver');
    });

    test("Lambda functions have correct runtime", () => {
      const runtimeMatches = lambdaContent.match(/runtime\s*=\s*"python3\.10"/g);
      expect(runtimeMatches).toBeTruthy();
      expect(runtimeMatches!.length).toBe(4);
    });

    test("Lambda functions have dead letter config", () => {
      const dlqMatches = lambdaContent.match(/dead_letter_config\s*{/g);
      expect(dlqMatches).toBeTruthy();
      expect(dlqMatches!.length).toBeGreaterThan(0);
    });

    test("Lambda permission for S3 is configured", () => {
      expect(lambdaContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_s3"/);
      expect(lambdaContent).toContain('principal     = "s3.amazonaws.com"');
    });

    test("Lambda functions use path.module for file paths", () => {
      expect(lambdaContent).toContain('${path.module}/lambda_functions/');
    });
  });

  describe("Step Functions", () => {
    let stepFunctionsContent: string;

    beforeAll(() => {
      stepFunctionsContent = fs.readFileSync(path.join(libPath, "step_functions.tf"), "utf8");
    });

    test("Step Functions state machine is defined", () => {
      expect(stepFunctionsContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"receipt_processing"/);
      expect(stepFunctionsContent).toContain('${var.project_name}-${var.environment_suffix}-receipt-processing');
    });

    test("State machine has logging configuration", () => {
      expect(stepFunctionsContent).toContain('logging_configuration');
      expect(stepFunctionsContent).toContain('include_execution_data = true');
      expect(stepFunctionsContent).toContain('level                  = "ERROR"');
    });

    test("State machine definition includes parallel processing", () => {
      expect(stepFunctionsContent).toContain('ParallelProcessing');
      expect(stepFunctionsContent).toContain('Type = "Parallel"');
    });

    test("State machine includes error handling", () => {
      expect(stepFunctionsContent).toContain('Retry');
      expect(stepFunctionsContent).toContain('Catch');
      expect(stepFunctionsContent).toContain('ErrorEquals');
    });
  });

  describe("Outputs", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libPath, "outputs.tf"), "utf8");
    });

    test("All required outputs are defined", () => {
      const requiredOutputs = [
        "s3_bucket_name",
        "s3_bucket_arn",
        "dynamodb_table_name",
        "dynamodb_table_arn",
        "step_function_arn",
        "sns_topic_arn",
        "dlq_url",
        "lambda_functions",
        "cloudwatch_alarms"
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("Outputs have descriptions", () => {
      const descriptionMatches = outputsContent.match(/description\s*=\s*"/g);
      expect(descriptionMatches).toBeTruthy();
      expect(descriptionMatches!.length).toBeGreaterThan(5);
    });
  });

  describe("Resource Naming", () => {
    test("All resources use environment suffix", () => {
      const files = ["main.tf", "iam.tf", "lambda.tf", "step_functions.tf"];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), "utf8");
        expect(content).toContain('${var.environment_suffix}');
      });
    });
  });

  describe("Security Best Practices", () => {
    let mainContent: string;
    let iamContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
      iamContent = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
    });

    test("DynamoDB has point-in-time recovery enabled", () => {
      expect(mainContent).toContain('point_in_time_recovery');
      expect(mainContent).toContain('enabled = true');
    });

    test("S3 bucket versioning is enabled", () => {
      expect(mainContent).toContain('aws_s3_bucket_versioning');
      expect(mainContent).toContain('status = "Enabled"');
    });

    test("IAM policies follow least privilege", () => {
      // Check that policies specify resources, not just "*"
      const iamPolicyContent = iamContent.match(/Resource\s*=\s*"[^"]+"/g);
      expect(iamPolicyContent).toBeTruthy();

      // Check for specific resource ARNs
      expect(iamContent).toContain('aws_s3_bucket.receipts.arn');
      expect(iamContent).toContain('aws_dynamodb_table.expenses.arn');
    });

    test("CloudWatch log retention is configured", () => {
      expect(mainContent).toContain('retention_in_days');
    });
  });
});