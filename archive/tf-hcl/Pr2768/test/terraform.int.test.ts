// tests/integration/terraform.int.test.ts
// Integration tests for Terraform infrastructure validation
// These tests validate Terraform configuration without requiring AWS deployment

import fs from "fs";
import path from "path";

// Test configuration
const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Integration Tests", () => {
  describe("Terraform Configuration Validation", () => {
    test("terraform files should exist", () => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      const providerFile = path.join(LIB_DIR, "provider.tf");
      
      expect(fs.existsSync(stackFile)).toBe(true);
      expect(fs.existsSync(providerFile)).toBe(true);
    });

    test("terraform files should be valid HCL", () => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      const providerFile = path.join(LIB_DIR, "provider.tf");
      
      const stackContent = fs.readFileSync(stackFile, "utf8");
      const providerContent = fs.readFileSync(providerFile, "utf8");
      
      // Basic HCL validation - check for common syntax patterns
      expect(stackContent).toMatch(/resource\s+"aws_/);
      expect(stackContent).toMatch(/variable\s+"/);
      expect(stackContent).toMatch(/output\s+"/);
      
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/terraform\s*{/);
    });
  });

  describe("Resource Configuration Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("all required resources should be defined", () => {
      // Check for key resources
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"web"/);
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"frontend"/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"shutdown"/);
    });

    test("networking resources should be properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"/);
    });

    test("security groups should be properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"/);
    });

    test("IAM resources should be properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
    });

    test("monitoring resources should be properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"/);
    });
  });

  describe("Variable Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("required variables should be defined", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_ssh_cidr"/);
      expect(stackContent).toMatch(/variable\s+"sns_https_endpoint"/);
      expect(stackContent).toMatch(/variable\s+"instance_type"/);
      expect(stackContent).toMatch(/variable\s+"db_username"/);
      expect(stackContent).toMatch(/variable\s+"db_password"/);
    });

    test("variables should have proper validation", () => {
      expect(stackContent).toMatch(/validation\s*{/);
      expect(stackContent).toMatch(/condition\s*=/);
      expect(stackContent).toMatch(/error_message\s*=/);
    });

    test("sensitive variables should be marked", () => {
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Output Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("required outputs should be defined", () => {
      expect(stackContent).toMatch(/output\s+"website_url"/);
      expect(stackContent).toMatch(/output\s+"web_server_public_ip"/);
      expect(stackContent).toMatch(/output\s+"database_endpoint"/);
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
      expect(stackContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test("outputs should have descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*"URL of the static website"/);
      expect(stackContent).toMatch(/description\s*=\s*"Public IP of the web server"/);
      expect(stackContent).toMatch(/description\s*=\s*"RDS database endpoint"/);
    });
  });

  describe("Security Configuration Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("encryption should be enabled", () => {
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("security groups should have proper rules", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
    });

    test("MFA enforcement should be configured", () => {
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
    });
  });

  describe("Data Sources Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("required data sources should be defined", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"/);
      expect(stackContent).toMatch(/data\s+"aws_ami"/);
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"/);
    });
  });

  describe("Provider Configuration Validation", () => {
    let providerContent: string;

    beforeAll(() => {
      const providerFile = path.join(LIB_DIR, "provider.tf");
      providerContent = fs.readFileSync(providerFile, "utf8");
    });

    test("AWS provider should be configured", () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.29\.0"/);
    });

    test("S3 backend should be configured", () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test("default tags should be set", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Project\s*=\s*"X"/);
      expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Resource Tagging Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("resources should use terraform.workspace in names", () => {
      expect(stackContent).toMatch(/\$\{terraform\.workspace\}/);
    });

    test("resources should have proper tag structures", () => {
      expect(stackContent).toMatch(/tags\s*=\s*{/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{terraform\.workspace\}/);
    });
  });

  describe("Lambda Configuration Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("Lambda function should be properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"shutdown"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
      expect(stackContent).toMatch(/handler\s*=\s*"index\.lambda_handler"/);
    });

    test("EventBridge rule should be configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"shutdown_schedule"/);
      expect(stackContent).toMatch(/schedule_expression\s*=\s*"cron/);
    });

    test("Lambda source code should be included", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"shutdown_lambda"/);
      expect(stackContent).toMatch(/boto3\.client\('ec2'/);
    });
  });

  describe("S3 Configuration Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("S3 bucket should be properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"frontend"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"frontend"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_website_configuration"\s+"frontend"/);
    });

    test("S3 bucket should have encryption enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("S3 bucket should have website configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_website_configuration"\s+"frontend"/);
      expect(stackContent).toMatch(/index_document/);
    });
  });

  describe("RDS Configuration Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      const stackFile = path.join(LIB_DIR, "tap_stack.tf");
      stackContent = fs.readFileSync(stackFile, "utf8");
    });

    test("RDS instance should be properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("RDS should have proper security configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(stackContent).toMatch(/vpc_security_group_ids/);
    });

    test("RDS should have backup configuration", () => {
      expect(stackContent).toMatch(/backup_retention_period/);
      expect(stackContent).toMatch(/backup_window/);
    });
  });
});