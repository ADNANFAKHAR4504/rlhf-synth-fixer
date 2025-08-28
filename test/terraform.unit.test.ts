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
      expect(content).toMatch(/staging_config/);
      expect(content).toMatch(/production_config/);
      expect(content).toMatch(/env_config/);
    });

    test("Environment-specific resource sizing", () => {
      expect(content).toMatch(/instance_type.*=.*"t3\.micro"/); // staging
      expect(content).toMatch(/instance_type.*=.*"t3\.small"/); // production
      expect(content).toMatch(/min_size.*=.*1/); // staging
      expect(content).toMatch(/min_size.*=.*2/); // production
    });

    test("Environment-specific database configurations", () => {
      expect(content).toMatch(/db_instance_class.*=.*"db\.t3\.micro"/); // staging
      expect(content).toMatch(/db_instance_class.*=.*"db\.t3\.small"/); // production
      expect(content).toMatch(/db_storage.*=.*20/); // staging
      expect(content).toMatch(/db_storage.*=.*50/); // production
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
      expect(content).toMatch(/variable "inst_type"/);
      expect(content).toMatch(/variable "asg_min"/);
      expect(content).toMatch(/variable "asg_max"/);
      expect(content).toMatch(/variable "db_class"/);
      expect(content).toMatch(/variable "db_storage"/);
      expect(content).toMatch(/variable "db_user"/);
      expect(content).toMatch(/variable "db_pass"/);
    });
  });

  describe("Random Variables and Secure Values", () => {
    test("Random string resources for unique naming", () => {
      expect(content).toMatch(/resource "random_string" "suffix"/);
      expect(content).toMatch(/length.*=.*8/);
    });

    test("Random password for database", () => {
      expect(content).toMatch(/resource "random_password" "db_password"/);
      expect(content).toMatch(/length.*=.*16/);
      expect(content).toMatch(/special.*=.*true/);
    });

    test("Random values used in resource names", () => {
      expect(content).toMatch(/\${random_string\.suffix\.result}/);
      // Check if random password is used in RDS configuration
      expect(content).toMatch(/random_password\.db_password\.result/);
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

    test("Database subnets for RDS isolation", () => {
      expect(content).toMatch(/resource "aws_subnet" "database"/);
      expect(content).toMatch(/Type.*=.*"Database"/);
    });

    test("Internet Gateway for public resources", () => {
      expect(content).toMatch(/resource "aws_internet_gateway" "main"/);
    });

    test("NAT Gateway for private resources", () => {
      expect(content).toMatch(/resource "aws_nat_gateway" "main"/);
      expect(content).toMatch(/resource "aws_eip" "nat"/);
    });

    test("Proper routing tables configured", () => {
      expect(content).toMatch(/resource "aws_route_table" "public"/);
      expect(content).toMatch(/resource "aws_route_table" "private"/);
      expect(content).toMatch(/resource "aws_route_table_association"/);
    });
  });

  describe("Load Balancing & Traffic Distribution", () => {
    test("Application Load Balancer in public subnets", () => {
      expect(content).toMatch(/resource "aws_lb" "main"/);
      expect(content).toMatch(/load_balancer_type.*=.*"application"/);
      expect(content).toMatch(/internal.*=.*false/);
    });

    test("Health checks for backend instances", () => {
      expect(content).toMatch(/resource "aws_lb_target_group" "main"/);
      expect(content).toMatch(/health_check_type.*=.*"ELB"/);
    });

    test("HTTPS listener configured (port 443)", () => {
      expect(content).toMatch(/resource "aws_lb_listener" "https"/);
      expect(content).toMatch(/port.*=.*"443"/);
      expect(content).toMatch(/protocol.*=.*"HTTPS"/);
    });

    test("SSL certificate for HTTPS", () => {
      expect(content).toMatch(/resource "aws_acm_certificate" "main"/);
      expect(content).toMatch(/validation_method.*=.*"DNS"/);
    });
  });

  describe("Compute Resources", () => {
    test("Auto Scaling Group with EC2 instances in private subnets", () => {
      expect(content).toMatch(/resource "aws_autoscaling_group" "main"/);
      expect(content).toMatch(/vpc_zone_identifier.*=.*aws_subnet\.private/);
    });

    test("Environment-appropriate scaling policies", () => {
      expect(content).toMatch(/resource "aws_autoscaling_policy" "scale_up"/);
      expect(content).toMatch(/resource "aws_autoscaling_policy" "scale_down"/);
      expect(content).toMatch(/scaling_adjustment.*=.*1/);
      expect(content).toMatch(/scaling_adjustment.*=.*-1/);
    });

    test("Launch template with proper configuration", () => {
      expect(content).toMatch(/resource "aws_launch_template" "main"/);
      expect(content).toMatch(/instance_type.*=.*local\.env_config\.instance_type/);
      expect(content).toMatch(/associate_public_ip_address.*=.*false/);
    });

    test("IAM roles and policies for secure AWS service access", () => {
      expect(content).toMatch(/resource "aws_iam_role" "ec2"/);
      expect(content).toMatch(/resource "aws_iam_role_policy" "ec2"/);
      expect(content).toMatch(/resource "aws_iam_instance_profile" "ec2"/);
    });
  });

  describe("Database Layer", () => {
    test("RDS instance in private subnets", () => {
      expect(content).toMatch(/resource "aws_db_instance" "main"/);
      expect(content).toMatch(/resource "aws_db_subnet_group" "main"/);
    });

    test("Multi-AZ deployment for high availability", () => {
      expect(content).toMatch(/multi_az.*=.*var\.env.*==.*"production"/);
    });

    test("Database isolated from direct internet access", () => {
      expect(content).toMatch(/resource "aws_security_group" "rds"/);
      expect(content).toMatch(/vpc_security_group_ids.*=.*\[aws_security_group\.rds\.id\]/);
    });

    test("RDS parameter group configured", () => {
      expect(content).toMatch(/resource "aws_db_parameter_group" "main"/);
      expect(content).toMatch(/character_set_server/);
      expect(content).toMatch(/character_set_client/);
    });

    test("Environment-specific database settings", () => {
      expect(content).toMatch(/backup_retention_period.*=.*var\.env.*==.*"production".*\?.*30.*:.*7/);
      expect(content).toMatch(/deletion_protection.*=.*var\.env.*==.*"production"/);
      expect(content).toMatch(/skip_final_snapshot.*=.*var\.env.*==.*"staging"/);
    });
  });

  describe("Security Implementation", () => {
    test("AWS KMS customer-managed keys for encryption", () => {
      expect(content).toMatch(/resource "aws_kms_key" "main"/);
      expect(content).toMatch(/enable_key_rotation.*=.*true/);
      expect(content).toMatch(/resource "aws_kms_alias" "main"/);
    });

    test("Security groups with least privilege access", () => {
      expect(content).toMatch(/resource "aws_security_group" "alb"/);
      expect(content).toMatch(/resource "aws_security_group" "ec2"/);
      expect(content).toMatch(/resource "aws_security_group" "rds"/);
    });

    test("HTTPS-only access (port 443)", () => {
      expect(content).toMatch(/port.*=.*443/);
      expect(content).toMatch(/protocol.*=.*"HTTPS"/);
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
    test("CloudWatch alarms for monitoring", () => {
      expect(content).toMatch(/resource "aws_cloudwatch_metric_alarm" "cpu_high"/);
      expect(content).toMatch(/resource "aws_cloudwatch_metric_alarm" "cpu_low"/);
      expect(content).toMatch(/CPUUtilization/);
      expect(content).toMatch(/GreaterThanThreshold/);
      expect(content).toMatch(/LessThanThreshold/);
    });

    test("CloudTrail for audit logging", () => {
      expect(content).toMatch(/resource "aws_cloudtrail" "main"/);
      expect(content).toMatch(/include_global_service_events.*=.*true/);
      expect(content).toMatch(/is_multi_region_trail.*=.*true/);
    });
  });

  describe("Resource Naming and Documentation", () => {
    test("Random suffixes to prevent naming conflicts", () => {
      expect(content).toMatch(/\${random_string\.suffix\.result}/);
    });

    test("Clear comments explaining resource purposes", () => {
      expect(content).toMatch(/#.*Multi-Environment AWS Infrastructure/);
      expect(content).toMatch(/#.*VPC and Networking/);
      expect(content).toMatch(/#.*Application Load Balancer/);
      expect(content).toMatch(/#.*Auto Scaling Group/);
      expect(content).toMatch(/#.*RDS Database/);
    });

    test("Comprehensive tagging for all resources", () => {
      expect(content).toMatch(/local\.common_tags/);
      expect(content).toMatch(/Environment.*=.*var\.env/);
      expect(content).toMatch(/Project.*=.*var\.proj_name/);
      expect(content).toMatch(/ManagedBy.*=.*"Terraform"/);
    });
  });

  describe("Variables and Configuration", () => {
    test("All required variables defined", () => {
      expect(content).toMatch(/variable "env"/);
      expect(content).toMatch(/variable "region"/);
      expect(content).toMatch(/variable "proj_name"/);
      expect(content).toMatch(/variable "vpc_cidr"/);
      expect(content).toMatch(/variable "inst_type"/);
      expect(content).toMatch(/variable "asg_min"/);
      expect(content).toMatch(/variable "asg_max"/);
      expect(content).toMatch(/variable "db_class"/);
      expect(content).toMatch(/variable "db_storage"/);
      expect(content).toMatch(/variable "db_name"/);
      expect(content).toMatch(/variable "db_user"/);
      expect(content).toMatch(/variable "db_pass"/);
    });

    test("Sensible default values provided", () => {
      expect(content).toMatch(/default.*=.*"us-west-2"/);
      expect(content).toMatch(/default.*=.*"myapp"/);
      expect(content).toMatch(/default.*=.*"10\.0\.0\.0\/16"/);
      expect(content).toMatch(/default.*=.*"t3\.micro"/);
      expect(content).toMatch(/default.*=.*2/);
      expect(content).toMatch(/default.*=.*10/);
    });
  });

  describe("Outputs and Monitoring", () => {
    test("Essential outputs defined", () => {
      expect(content).toMatch(/output "vpc_id"/);
      expect(content).toMatch(/output "public_subnet_ids"/);
      expect(content).toMatch(/output "private_subnet_ids"/);
      expect(content).toMatch(/output "load_balancer_dns_name"/);
      expect(content).toMatch(/output "rds_endpoint"/);
      expect(content).toMatch(/output "s3_bucket_name"/);
      expect(content).toMatch(/output "kms_key_arn"/);
      expect(content).toMatch(/output "autoscaling_group_name"/);
    });

    test("Environment and project outputs", () => {
      expect(content).toMatch(/output "environment"/);
      expect(content).toMatch(/output "project_name"/);
      expect(content).toMatch(/output "region"/);
    });
  });

  describe("Additional Features", () => {
    test("User data script for web server setup", () => {
      expect(content).toMatch(/templatefile\(".*user_data\.sh"/);
      expect(content).toMatch(/db_endpoint.*=.*aws_db_instance\.main\.endpoint/);
      expect(content).toMatch(/db_name.*=.*aws_db_instance\.main\.db_name/);
    });

    test("Random password generation for database", () => {
      expect(content).toMatch(/random_password\.db_password\.result/);
    });

    test("Environment-specific configurations", () => {
      expect(content).toMatch(/env_config.*=.*var\.env.*==.*"production".*\?.*local\.production_config.*:.*local\.staging_config/);
    });
  });
});
