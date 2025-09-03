// Comprehensive unit tests for Terraform infrastructure
// Tests lib/tap_stack.tf without executing Terraform commands (static validation only)

import fs from "fs";
import path from "path";

const MAIN_TF_REL = "../lib/tap_stack.tf";
const PROVIDER_TF_REL = "../lib/provider.tf";
const mainTfPath = path.resolve(__dirname, MAIN_TF_REL);
const providerTfPath = path.resolve(__dirname, PROVIDER_TF_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let mainTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    providerTfContent = fs.readFileSync(providerTfPath, "utf8");
  });

  // File Existence Tests
  describe("File Structure", () => {
    test("main.tf exists", () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
    });
  });

  // Provider Configuration Tests
  describe("Provider Configuration", () => {
    test("main.tf does NOT declare provider blocks", () => {
      expect(mainTfContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("provider.tf contains required AWS providers", () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*var\.aws_region/);
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"use1"[\s\S]*?region\s*=\s*var\.use1_region/);
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"usw2"[\s\S]*?region\s*=\s*var\.usw2_region/);
    });

    test("provider.tf has correct terraform block", () => {
      expect(providerTfContent).toMatch(/terraform\s*{[\s\S]*?required_providers[\s\S]*?aws[\s\S]*?version[\s\S]*?>=\s*5\.0/);
    });
  });

  // Variable Tests
  describe("Variable Declarations", () => {
    test("declares required variables", () => {
      expect(mainTfContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(mainTfContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(mainTfContent).toMatch(/variable\s+"environment"\s*{/);
      expect(mainTfContent).toMatch(/variable\s+"owner"\s*{/);
      expect(mainTfContent).toMatch(/variable\s+"kms_key_deletion_days"\s*{/);
    });

    test("variables have correct default values", () => {
      expect(mainTfContent).toMatch(/variable\s+"project_name"[\s\S]*?default\s*=\s*"iac-aws-nova-model-breaking"/);
      expect(mainTfContent).toMatch(/variable\s+"environment"[\s\S]*?default\s*=\s*"dev"/);
      expect(mainTfContent).toMatch(/variable\s+"owner"[\s\S]*?default\s*=\s*"platform-team"/);
      expect(mainTfContent).toMatch(/variable\s+"kms_key_deletion_days"[\s\S]*?default\s*=\s*7/);
    });
  });

  // Locals Tests
  describe("Locals Configuration", () => {
    test("contains required locals", () => {
      expect(mainTfContent).toMatch(/locals\s*{/);
      expect(mainTfContent).toMatch(/region_suffix/);
      expect(mainTfContent).toMatch(/tags/);
    });

    test("tags include required fields", () => {
      expect(mainTfContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(mainTfContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(mainTfContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(mainTfContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  // Multi-Region Resources Tests
  describe("Multi-Region Infrastructure", () => {
    test("contains KMS keys for both regions", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"lambda_env_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"lambda_env_usw2"/);
    });

    test("KMS keys use correct providers", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"lambda_env_use1"[\s\S]*?provider\s*=\s*aws\.use1/);
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"lambda_env_usw2"[\s\S]*?provider\s*=\s*aws\.usw2/);
    });

    test("contains KMS aliases for both regions", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_alias"\s+"lambda_env_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_alias"\s+"lambda_env_usw2"/);
    });
  });

  // Lambda Function Tests
  describe("Lambda Functions", () => {
    test("contains Lambda functions for both regions", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"main_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"main_usw2"/);
    });

    test("Lambda functions have correct configuration", () => {
      expect(mainTfContent).toMatch(/runtime\s*=\s*"python3\.12"/);
      expect(mainTfContent).toMatch(/publish\s*=\s*true/);
      expect(mainTfContent).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
    });

    test("Lambda functions use KMS encryption", () => {
      expect(mainTfContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.lambda_env_use1\.arn/);
      expect(mainTfContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.lambda_env_usw2\.arn/);
    });

    test("contains Lambda aliases for zero-downtime deployment", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_alias"\s+"main_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_alias"\s+"main_usw2"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"live"/);
    });
  });

  // IAM Tests
  describe("IAM Configuration", () => {
    test("contains Lambda execution roles", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution_usw2"/);
    });

    test("IAM roles follow least privilege principle", () => {
      expect(mainTfContent).toMatch(/"logs:CreateLogStream"/);
      expect(mainTfContent).toMatch(/"logs:PutLogEvents"/);
      expect(mainTfContent).toMatch(/"kms:Decrypt"/);
      expect(mainTfContent).not.toMatch(/"Action":\s*"\*"/);
      expect(mainTfContent).not.toMatch(/"Resource":\s*"\*"/);
    });

    test("IAM policies reference specific resources", () => {
      expect(mainTfContent).toMatch(/Resource.*aws_cloudwatch_log_group\.lambda_use1\.arn/);
      expect(mainTfContent).toMatch(/Resource.*aws_kms_key\.lambda_env_use1\.arn/);
    });
  });

  // API Gateway Tests
  describe("API Gateway Configuration", () => {
    test("contains API Gateway resources for both regions", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_apigatewayv2_api"\s+"main_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_apigatewayv2_api"\s+"main_usw2"/);
    });

    test("API Gateway uses IAM authentication", () => {
      expect(mainTfContent).toMatch(/authorization_type\s*=\s*"AWS_IAM"/);
    });

    test("contains API Gateway stages with logging", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_apigatewayv2_stage"/);
      expect(mainTfContent).toMatch(/access_log_settings/);
    });

    test("contains Lambda permissions for API Gateway", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_usw2"/);
      expect(mainTfContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });
  });

  // CloudWatch Tests
  describe("CloudWatch Configuration", () => {
    test("contains log groups for Lambda and API Gateway", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_use1"/);
    });

    test("log groups have retention settings", () => {
      expect(mainTfContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("contains metric alarms for Lambda errors", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors_use1"/);
      expect(mainTfContent).toMatch(/metric_name\s*=\s*"Errors"/);
      expect(mainTfContent).toMatch(/namespace\s*=\s*"AWS\/Lambda"/);
    });
  });

  // SNS Tests
  describe("SNS Configuration", () => {
    test("contains SNS topics for alerts", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts_use1"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts_usw2"/);
    });

    test("CloudWatch alarms reference SNS topics", () => {
      expect(mainTfContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts_use1\.arn\]/);
      expect(mainTfContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts_usw2\.arn\]/);
    });
  });

  // Data Sources Tests
  describe("Data Sources", () => {
    test("contains archive_file data source for Lambda code", () => {
      expect(mainTfContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
      expect(mainTfContent).toMatch(/type\s*=\s*"zip"/);
      expect(mainTfContent).toMatch(/filename\s*=\s*"lambda_function\.py"/);
    });

    test("Lambda code contains Hello World handler", () => {
      expect(mainTfContent).toMatch(/def lambda_handler\(event, context\):/);
      expect(mainTfContent).toMatch(/Hello, World!/);
      expect(mainTfContent).toMatch(/statusCode.*200/);
    });
  });

  // Tagging Tests
  describe("Resource Tagging", () => {
    test("resources use consistent tagging", () => {
      expect(mainTfContent).toMatch(/tags\s*=\s*merge\(local\.tags/);
    });

    test("regional tags are applied correctly", () => {
      expect(mainTfContent).toMatch(/Region\s*=\s*"us-east-1"/);
      expect(mainTfContent).toMatch(/Region\s*=\s*"us-west-2"/);
    });
  });

  // Output Tests
  describe("Outputs", () => {
    test("contains required outputs for both regions", () => {
      expect(mainTfContent).toMatch(/output\s+"api_endpoint_url_use1"/);
      expect(mainTfContent).toMatch(/output\s+"api_endpoint_url_usw2"/);
      expect(mainTfContent).toMatch(/output\s+"lambda_alias_arn_use1"/);
      expect(mainTfContent).toMatch(/output\s+"lambda_alias_arn_usw2"/);
      expect(mainTfContent).toMatch(/output\s+"cloudwatch_log_group_name_use1"/);
      expect(mainTfContent).toMatch(/output\s+"sns_topic_arn_use1"/);
    });

    test("outputs reference correct resources", () => {
      expect(mainTfContent).toMatch(/value\s*=\s*aws_lambda_alias\.main_use1\.arn/);
      expect(mainTfContent).toMatch(/value\s*=\s*aws_sns_topic\.alerts_use1\.arn/);
    });
  });

  // Security Tests
  describe("Security Configuration", () => {
    test("KMS keys have rotation enabled", () => {
      expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS keys have appropriate deletion window", () => {
      expect(mainTfContent).toMatch(/deletion_window_in_days\s*=\s*var\.kms_key_deletion_days/);
    });

    test("no hardcoded secrets or credentials", () => {
      expect(mainTfContent).not.toMatch(/password\s*=\s*["'][^"']*["']/);
      expect(mainTfContent).not.toMatch(/aws_access_key_id|aws_secret_access_key/);
      expect(mainTfContent).not.toMatch(/secret\s*=\s*["'][^"']*["']/);
    });
  });

  // Dependencies Tests
  describe("Resource Dependencies", () => {
    test("Lambda functions depend on log groups", () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda_use1\]/);
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda_usw2\]/);
    });

    test("resources reference correct provider aliases", () => {
      expect(mainTfContent).toMatch(/provider\s*=\s*aws\.use1/);
      expect(mainTfContent).toMatch(/provider\s*=\s*aws\.usw2/);
    });
  });
});
