// Integration tests for Terraform infrastructure
// These tests validate the terraform configuration without actually deploying resources

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TF_STACK_PATH = path.join(LIB_DIR, "tap_stack.tf");
const TF_PROVIDER_PATH = path.join(LIB_DIR, "provider.tf");

describe("Terraform Infrastructure Integration Tests", () => {
  beforeAll(() => {
    // Ensure we're in the lib directory for terraform commands
    process.chdir(LIB_DIR);
  });

  describe("Terraform Configuration Validation", () => {
    test("terraform files exist", () => {
      expect(fs.existsSync(TF_STACK_PATH)).toBe(true);
      expect(fs.existsSync(TF_PROVIDER_PATH)).toBe(true);
    });

    test("terraform validate passes", () => {
      try {
        // Initialize terraform without backend and upgrade providers
        execSync("terraform init -backend=false -upgrade", { stdio: "pipe" });
        
        // Validate the configuration
        const result = execSync("terraform validate -json", { 
          stdio: "pipe",
          encoding: "utf8"
        });
        
        const validation = JSON.parse(result);
        expect(validation.valid).toBe(true);
        expect(validation.error_count).toBe(0);
      } catch (error) {
        console.error("Terraform validation failed:", error);
        throw error;
      }
    });

    test("terraform fmt check passes", () => {
      try {
        // Check if files are properly formatted
        execSync("terraform fmt -check -recursive", { stdio: "pipe" });
      } catch (error) {
        console.error("Terraform formatting check failed:", error);
        throw error;
      }
    });
  });

  describe("Resource Configuration Tests", () => {
    let stackContent: string;
    let providerContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(TF_STACK_PATH, "utf8");
      providerContent = fs.readFileSync(TF_PROVIDER_PATH, "utf8");
    });

    test("provider configuration is properly separated", () => {
      // Provider should be in provider.tf, not in tap_stack.tf
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(stackContent).not.toMatch(/provider\s+"aws"/);
    });

    test("required data sources are defined", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("security resources are properly configured", () => {
      // KMS key for encryption
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      
      // CloudTrail for auditing
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
      
      // Security groups with proper ingress rules
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"/);
    });

    test("networking resources are properly configured", () => {
      // VPC with DNS support
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      
      // Subnets in multiple AZs
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
      
      // Internet Gateway and routing
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test("storage resources are properly configured", () => {
      // S3 buckets with encryption
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app_content"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudfront_logs"/);
      
      // S3 encryption configuration
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      
      // S3 public access block
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    });

    test("compute and database resources are configured", () => {
      // RDS with encryption and backup
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
      
      // RDS subnet group for multi-AZ
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      
      // IAM roles and policies
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_app_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"app_s3_access"/);
    });

    test("content delivery and monitoring are configured", () => {
      // CloudFront distribution
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
      
      // ACM certificate
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
      expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
      
      // CloudWatch monitoring
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      
      // SNS for alerts
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
    });

    test("outputs are properly defined", () => {
      expect(stackContent).toMatch(/output\s+"cloudfront_domain_name"/);
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
      expect(stackContent).toMatch(/output\s+"app_content_bucket"/);
      expect(stackContent).toMatch(/output\s+"logs_bucket"/);
      expect(stackContent).toMatch(/output\s+"cloudfront_logs_bucket"/);
      expect(stackContent).toMatch(/output\s+"kms_key_id"/);
    });

    test("sensitive outputs are marked correctly", () => {
      // RDS endpoint should be sensitive
      const rdsOutputMatch = stackContent.match(/output\s+"rds_endpoint"\s*\{[^}]+\}/s);
      expect(rdsOutputMatch).toBeTruthy();
      expect(rdsOutputMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Security and Compliance Tests", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(TF_STACK_PATH, "utf8");
    });

    test("encryption is enabled for all storage resources", () => {
      // S3 encryption
      expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      
      // RDS encryption
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      
      // CloudWatch logs encryption
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("public access is properly restricted", () => {
      // S3 public access block
      expect(stackContent).toMatch(/block_public_acls\s*=\s*var\.s3_block_public_access/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*var\.s3_block_public_access/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*var\.s3_block_public_access/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*var\.s3_block_public_access/);
    });

    test("database is properly isolated", () => {
      // Database should be in private subnets
      expect(stackContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
      
      // Database security group should only allow access from web tier
      const dbSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"database"\s*\{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.web\.id\][\s\S]*?\}/);
      expect(dbSgMatch).toBeTruthy();
    });

    test("CloudFront uses HTTPS and proper security headers", () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
      expect(stackContent).toMatch(/minimum_protocol_version\s*=\s*"TLSv1\.2_2021"/);
    });

    test("logging and monitoring are configured", () => {
      // CloudTrail logging
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      
      // CloudFront logging
      expect(stackContent).toMatch(/logging_config/);
      
      // CloudWatch monitoring
      expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm/);
    });
  });
});
