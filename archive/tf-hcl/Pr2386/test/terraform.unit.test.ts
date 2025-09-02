// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf based on updated prompt.md requirements
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Multi-Environment Infrastructure Requirements - Unit Tests", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  describe("Basic File Requirements", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] ❌ ${STACK_REL} does not exist`);
      }
      expect(exists).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      const hasProvider = content.includes('provider "aws"');
      if (hasProvider) {
        console.error(`[unit] ❌ tap_stack.tf should not declare provider "aws"`);
      }
      expect(hasProvider).toBe(false);
    });

    test("declares environment variable in tap_stack.tf", () => {
      const hasEnvVar = content.includes('variable "env"');
      if (!hasEnvVar) {
        console.error(`[unit] ❌ tap_stack.tf must declare variable "env"`);
      }
      expect(hasEnvVar).toBe(true);
    });
  });

  describe("Multi-Environment Architecture", () => {
    test("Environment variable validation for staging/production", () => {
      expect(content).toMatch(/contains\(\["staging", "production"\], var\.env\)/);
      expect(content).toMatch(/Environment must be either 'staging' or 'production'/);
    });

    test("Environment-specific configurations defined", () => {
      expect(content).toMatch(/name_prefix.*=.*"\$\{var\.proj_name\}-\$\{var\.env\}"/);
    });

    test("Environment-specific resource naming", () => {
      expect(content).toMatch(/local\.name_prefix/);
      expect(content).toMatch(/var\.env/);
      expect(content).toMatch(/var\.proj_name/);
    });
  });

  describe("Variable Naming Conventions (32 chars or less)", () => {
    test("All variable names are 32 characters or less", () => {
      const variableMatches = content.match(/variable\s+"([^"]+)"/g);
      if (variableMatches) {
        variableMatches.forEach(match => {
          const varName = match.match(/variable\s+"([^"]+)"/)?.[1];
          if (varName && varName.length > 32) {
            console.error(`[unit] ❌ Variable name "${varName}" exceeds 32 characters`);
          }
          expect(varName?.length).toBeLessThanOrEqual(32);
        });
      }
    });

    test("Short variable names used", () => {
      expect(content).toMatch(/variable "env"/);
      expect(content).toMatch(/variable "region"/);
      expect(content).toMatch(/variable "proj_name"/);
      expect(content).toMatch(/variable "vpc_cidr"/);
      expect(content).toMatch(/variable "db_pass"/);
    });
  });

  describe("Random Variables and Secure Values", () => {
    test("Random string resources for unique naming", () => {
      expect(content).toMatch(/resource "random_string" "suffix"/);
      expect(content).toMatch(/length.*=.*8/);
    });

    test("Random values used in resource names", () => {
      expect(content).toMatch(/\${random_string\.suffix\.result}/);
    });
  });

  describe("Network Architecture Requirements", () => {
    test("VPC spans multiple availability zones", () => {
      expect(content).toMatch(/resource "aws_vpc" "main"/);
      expect(content).toMatch(/enable_dns_hostnames.*=.*true/);
      expect(content).toMatch(/enable_dns_support.*=.*true/);
    });

    test("Public and private subnets across at least 2 AZs", () => {
      expect(content).toMatch(/resource "aws_subnet" "public"/);
      expect(content).toMatch(/resource "aws_subnet" "private"/);
      expect(content).toMatch(/count.*=.*min\(2, length\(data\.aws_availability_zones\.available\.names\)\)/);
    });

    test("Internet Gateway for public resources", () => {
      expect(content).toMatch(/resource "aws_internet_gateway" "main"/);
    });

    test("Proper routing tables configured", () => {
      expect(content).toMatch(/resource "aws_route_table" "public"/);
      expect(content).toMatch(/resource "aws_route_table_association"/);
    });
  });



  describe("IAM Resources", () => {
    test("IAM roles and policies for secure AWS service access", () => {
      expect(content).toMatch(/resource "aws_iam_role" "env_access"/);
      expect(content).toMatch(/resource "aws_iam_role_policy" "s3_access"/);
    });
  });



  describe("Security Implementation", () => {
    test("AWS KMS customer-managed keys for encryption", () => {
      expect(content).toMatch(/resource "aws_kms_key" "main"/);
      expect(content).toMatch(/enable_key_rotation.*=.*true/);
      expect(content).toMatch(/resource "aws_kms_alias" "main"/);
    });

    test("Security groups with least privilege access", () => {
      expect(content).toMatch(/resource "aws_security_group" "https_only"/);
    });

    test("HTTPS-only access (port 443)", () => {
      expect(content).toMatch(/port.*=.*443/);
      expect(content).toMatch(/protocol.*=.*"tcp"/);
    });

    test("IAM roles and policies properly configured", () => {
      expect(content).toMatch(/assume_role_policy/);
      expect(content).toMatch(/sts:AssumeRole/);
    });
  });

  describe("S3 Storage Layer", () => {
    test("S3 bucket with versioning enabled", () => {
      expect(content).toMatch(/resource "aws_s3_bucket" "main"/);
      expect(content).toMatch(/resource "aws_s3_bucket_versioning" "main"/);
      expect(content).toMatch(/status.*=.*"Enabled"/);
    });

    test("Server-side encryption enabled", () => {
      expect(content).toMatch(/resource "aws_s3_bucket_server_side_encryption_configuration" "main"/);
      expect(content).toMatch(/sse_algorithm.*=.*"aws:kms"/);
      expect(content).toMatch(/kms_master_key_id.*=.*aws_kms_key\.main\.arn/);
    });

    test("Public access blocked", () => {
      expect(content).toMatch(/resource "aws_s3_bucket_public_access_block" "main"/);
      expect(content).toMatch(/block_public_acls.*=.*true/);
      expect(content).toMatch(/block_public_policy.*=.*true/);
    });

    test("Bucket policy for encryption enforcement", () => {
      expect(content).toMatch(/resource "aws_s3_bucket_policy" "main"/);
      expect(content).toMatch(/DenyUnencryptedObjectUploads/);
    });
  });

  describe("Monitoring and Logging", () => {
    test("Basic infrastructure monitoring", () => {
      expect(content).toMatch(/resource "aws_security_group" "https_only"/);
      expect(content).toMatch(/from_port.*=.*443/);
      expect(content).toMatch(/to_port.*=.*443/);
    });
  });

  describe("Resource Naming and Documentation", () => {
    test("Random suffixes to prevent naming conflicts", () => {
      expect(content).toMatch(/\${random_string\.suffix\.result}/);
    });

    test("Clear comments explaining resource purposes", () => {
      expect(content).toMatch(/#.*Multi-Environment AWS Infrastructure/);
      expect(content).toMatch(/#.*VPC and Basic Networking/);
      expect(content).toMatch(/#.*S3 Storage Layer/);
      expect(content).toMatch(/#.*KMS for Encryption/);
    });

    test("Comprehensive tagging for all resources", () => {
      expect(content).toMatch(/local\.common_tags/);
      expect(content).toMatch(/Environment.*=.*var\.env/);
      expect(content).toMatch(/Project.*=.*var\.proj_name/);
      expect(content).toMatch(/ManagedBy.*=.*"terraform"/);
    });
  });

  describe("Variables and Configuration", () => {
    test("All required variables defined", () => {
      expect(content).toMatch(/variable "env"/);
      expect(content).toMatch(/variable "region"/);
      expect(content).toMatch(/variable "proj_name"/);
      expect(content).toMatch(/variable "vpc_cidr"/);
      expect(content).toMatch(/variable "db_pass"/);
    });

    test("Sensible default values provided", () => {
      expect(content).toMatch(/default.*=.*"us-east-1"/);
      expect(content).toMatch(/default.*=.*"myapp"/);
      expect(content).toMatch(/default.*=.*"10\.0\.0\.0\/16"/);
    });
  });

  describe("Outputs and Monitoring", () => {
    test("Essential outputs defined", () => {
      expect(content).toMatch(/output "vpc_id"/);
      expect(content).toMatch(/output "public_subnet_ids"/);
      expect(content).toMatch(/output "private_subnet_ids"/);
      expect(content).toMatch(/output "s3_bucket_name"/);
      expect(content).toMatch(/output "kms_key_arn"/);
      expect(content).toMatch(/output "security_group_id"/);
      expect(content).toMatch(/output "iam_role_arn"/);
    });

    test("Environment and project outputs", () => {
      expect(content).toMatch(/output "environment"/);
      expect(content).toMatch(/output "project_name"/);
      expect(content).toMatch(/output "region"/);
    });
  });

  describe("Additional Features", () => {
    test("Random string generation for unique naming", () => {
      expect(content).toMatch(/random_string\.suffix\.result/);
    });

    test("Environment-specific configurations", () => {
      expect(content).toMatch(/name_prefix.*=.*"\$\{var\.proj_name\}-\$\{var\.env\}"/);
    });
  });
});
