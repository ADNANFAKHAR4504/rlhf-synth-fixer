// tests/unit/unit-tests.ts
// Comprehensive validation checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure Validation", () => {
    test("should have main stack file", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("should have provider configuration", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });



    test("should have all required module directories", () => {
      const moduleDirs = [
        "../lib/modules/networking",
        "../lib/modules/iam",
        "../lib/modules/compute",
        "../lib/modules/database"
      ];

      moduleDirs.forEach(dir => {
        const modulePath = path.resolve(__dirname, dir);
        expect(fs.existsSync(modulePath)).toBe(true);
      });
    });

    test("should have all required module files", () => {
      const moduleFiles = [
        "../lib/modules/networking/main.tf",
        "../lib/modules/networking/variables.tf",
        "../lib/modules/networking/outputs.tf",
        "../lib/modules/iam/main.tf",
        "../lib/modules/iam/variables.tf",
        "../lib/modules/iam/outputs.tf",
        "../lib/modules/compute/main.tf",
        "../lib/modules/compute/variables.tf",
        "../lib/modules/compute/outputs.tf",
        "../lib/modules/compute/user_data.sh",
        "../lib/modules/database/main.tf",
        "../lib/modules/database/variables.tf",
        "../lib/modules/database/outputs.tf"
      ];

      moduleFiles.forEach(file => {
        const filePath = path.resolve(__dirname, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Configuration File Content Validation", () => {
    let stackContent: string;
    let providerContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf-8");
      providerContent = fs.readFileSync(providerPath, "utf-8");
    });

    describe("Main Stack Configuration", () => {
      test("should have required variables with defaults", () => {
        expect(stackContent).toMatch(/variable "aws_region"/);
        expect(stackContent).toMatch(/variable "environment"/);
        expect(stackContent).toMatch(/variable "project_name"/);
        expect(stackContent).toMatch(/variable "cost_center"/);
        expect(stackContent).toMatch(/variable "owner"/);
        
        // Check for default values
        expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
        expect(stackContent).toMatch(/default\s*=\s*"staging"/);
        expect(stackContent).toMatch(/default\s*=\s*"myapp"/);
        expect(stackContent).toMatch(/default\s*=\s*"default-cost-center"/);
        expect(stackContent).toMatch(/default\s*=\s*"terraform-admin"/);
      });

      test("should have environment validation", () => {
        expect(stackContent).toMatch(/validation\s*{/);
        expect(stackContent).toMatch(/contains\(\["staging", "production"\], var\.environment\)/);
      });

      test("should have data source for AMI", () => {
        expect(stackContent).toMatch(/data "aws_ami" "amazon_linux_2"/);
        expect(stackContent).toMatch(/most_recent\s*=\s*true/);
        expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
      });

      test("should have locals block with common tags", () => {
        expect(stackContent).toMatch(/locals\s*{/);
        expect(stackContent).toMatch(/common_tags\s*=/);
        expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
        expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
        expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      });

      test("should have all required modules", () => {
        expect(stackContent).toMatch(/module "networking"/);
        expect(stackContent).toMatch(/module "iam"/);
        expect(stackContent).toMatch(/module "compute"/);
        expect(stackContent).toMatch(/module "database"/);
      });

      test("should have comprehensive outputs", () => {
        const expectedOutputs = [
          "vpc_id",
          "public_subnet_ids",
          "private_subnet_ids",
          "database_subnet_ids",
          "load_balancer_dns_name",
          "load_balancer_zone_id",
          "autoscaling_group_name",
          "ec2_instance_profile_name",
          "ec2_role_arn",
          "autoscaling_role_arn",
          "database_endpoint",
          "database_id",
          "application_url"
        ];

        expectedOutputs.forEach(output => {
          expect(stackContent).toMatch(new RegExp(`output "${output}"`));
        });
      });
    });

    describe("Provider Configuration", () => {
      test("should have required Terraform version", () => {
        expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
      });

      test("should have AWS provider configuration", () => {
        expect(providerContent).toMatch(/required_providers\s*{/);
        expect(providerContent).toMatch(/aws\s*=/);
        expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
        expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
      });

      test("should have S3 backend configuration", () => {
        expect(providerContent).toMatch(/backend "s3"/);
      });

      test("should have AWS provider with region", () => {
        expect(providerContent).toMatch(/provider "aws"/);
        expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
      });
    });


  });

  describe("Module Configuration Validation", () => {
    describe("Networking Module", () => {
      let networkingMain: string;
      let networkingVars: string;
      let networkingOutputs: string;

      beforeAll(() => {
        networkingMain = fs.readFileSync(path.resolve(__dirname, "../lib/modules/networking/main.tf"), "utf-8");
        networkingVars = fs.readFileSync(path.resolve(__dirname, "../lib/modules/networking/variables.tf"), "utf-8");
        networkingOutputs = fs.readFileSync(path.resolve(__dirname, "../lib/modules/networking/outputs.tf"), "utf-8");
      });

      test("should have VPC configuration", () => {
        expect(networkingMain).toMatch(/resource "aws_vpc" "main"/);
        expect(networkingMain).toMatch(/enable_dns_hostnames\s*=\s*true/);
        expect(networkingMain).toMatch(/enable_dns_support\s*=\s*true/);
      });

      test("should have subnets for all tiers", () => {
        expect(networkingMain).toMatch(/resource "aws_subnet" "public"/);
        expect(networkingMain).toMatch(/resource "aws_subnet" "private"/);
        expect(networkingMain).toMatch(/resource "aws_subnet" "database"/);
      });

      test("should have NAT gateways", () => {
        expect(networkingMain).toMatch(/resource "aws_nat_gateway" "main"/);
        expect(networkingMain).toMatch(/resource "aws_eip" "nat"/);
      });

      test("should have route tables", () => {
        expect(networkingMain).toMatch(/resource "aws_route_table" "public"/);
        expect(networkingMain).toMatch(/resource "aws_route_table" "private"/);
      });

      test("should have required variables", () => {
        expect(networkingVars).toMatch(/variable "name_prefix"/);
        expect(networkingVars).toMatch(/variable "vpc_cidr"/);
        expect(networkingVars).toMatch(/variable "az_count"/);
        expect(networkingVars).toMatch(/variable "common_tags"/);
      });

      test("should have required outputs", () => {
        expect(networkingOutputs).toMatch(/output "vpc_id"/);
        expect(networkingOutputs).toMatch(/output "public_subnet_ids"/);
        expect(networkingOutputs).toMatch(/output "private_subnet_ids"/);
        expect(networkingOutputs).toMatch(/output "database_subnet_ids"/);
        expect(networkingOutputs).toMatch(/output "db_subnet_group_name"/);
        expect(networkingOutputs).toMatch(/output "vpc_cidr"/);
      });
    });

    describe("IAM Module", () => {
      let iamMain: string;
      let iamVars: string;
      let iamOutputs: string;

      beforeAll(() => {
        iamMain = fs.readFileSync(path.resolve(__dirname, "../lib/modules/iam/main.tf"), "utf-8");
        iamVars = fs.readFileSync(path.resolve(__dirname, "../lib/modules/iam/variables.tf"), "utf-8");
        iamOutputs = fs.readFileSync(path.resolve(__dirname, "../lib/modules/iam/outputs.tf"), "utf-8");
      });

      test("should have EC2 role and instance profile", () => {
        expect(iamMain).toMatch(/resource "aws_iam_role" "ec2_role"/);
        expect(iamMain).toMatch(/resource "aws_iam_instance_profile" "ec2_profile"/);
      });

      test("should have Auto Scaling role", () => {
        expect(iamMain).toMatch(/resource "aws_iam_role" "autoscaling_role"/);
      });

      test("should have proper assume role policies", () => {
        expect(iamMain).toMatch(/Service = "ec2\.amazonaws\.com"/);
        expect(iamMain).toMatch(/Service = "autoscaling\.amazonaws\.com"/);
      });

      test("should have required variables", () => {
        expect(iamVars).toMatch(/variable "name_prefix"/);
        expect(iamVars).toMatch(/variable "common_tags"/);
      });

      test("should have required outputs", () => {
        expect(iamOutputs).toMatch(/output "ec2_instance_profile_name"/);
        expect(iamOutputs).toMatch(/output "ec2_role_arn"/);
        expect(iamOutputs).toMatch(/output "autoscaling_role_arn"/);
      });
    });

    describe("Compute Module", () => {
      let computeMain: string;
      let computeVars: string;
      let computeOutputs: string;
      let userData: string;

      beforeAll(() => {
        computeMain = fs.readFileSync(path.resolve(__dirname, "../lib/modules/compute/main.tf"), "utf-8");
        computeVars = fs.readFileSync(path.resolve(__dirname, "../lib/modules/compute/variables.tf"), "utf-8");
        computeOutputs = fs.readFileSync(path.resolve(__dirname, "../lib/modules/compute/outputs.tf"), "utf-8");
        userData = fs.readFileSync(path.resolve(__dirname, "../lib/modules/compute/user_data.sh"), "utf-8");
      });

      test("should have security groups", () => {
        expect(computeMain).toMatch(/resource "aws_security_group" "alb"/);
        expect(computeMain).toMatch(/resource "aws_security_group" "ec2"/);
      });

      test("should have load balancer", () => {
        expect(computeMain).toMatch(/resource "aws_lb" "main"/);
        expect(computeMain).toMatch(/load_balancer_type\s*=\s*"application"/);
      });

      test("should have auto scaling group", () => {
        expect(computeMain).toMatch(/resource "aws_autoscaling_group" "main"/);
        expect(computeMain).toMatch(/health_check_type\s*=\s*"ELB"/);
      });

      test("should have launch template", () => {
        expect(computeMain).toMatch(/resource "aws_launch_template" "main"/);
      });

      test("should have CloudWatch alarms", () => {
        expect(computeMain).toMatch(/resource "aws_cloudwatch_metric_alarm" "high_cpu"/);
        expect(computeMain).toMatch(/resource "aws_cloudwatch_metric_alarm" "low_cpu"/);
      });

      test("should have required variables", () => {
        expect(computeVars).toMatch(/variable "name_prefix"/);
        expect(computeVars).toMatch(/variable "environment"/);
        expect(computeVars).toMatch(/variable "vpc_id"/);
        expect(computeVars).toMatch(/variable "instance_profile_name"/);
        expect(computeVars).toMatch(/variable "ami_id"/);
      });

      test("should have required outputs", () => {
        expect(computeOutputs).toMatch(/output "load_balancer_dns_name"/);
        expect(computeOutputs).toMatch(/output "load_balancer_zone_id"/);
        expect(computeOutputs).toMatch(/output "autoscaling_group_name"/);
      });

      test("should have user data script", () => {
        expect(userData).toMatch(/^#!\/bin\/bash/);
        expect(userData).toMatch(/yum update -y/);
        expect(userData).toMatch(/yum install -y amazon-cloudwatch-agent nginx/);
        expect(userData).toMatch(/amazon-cloudwatch-agent/);
      });
    });

    describe("Database Module", () => {
      let databaseMain: string;
      let databaseVars: string;
      let databaseOutputs: string;

      beforeAll(() => {
        databaseMain = fs.readFileSync(path.resolve(__dirname, "../lib/modules/database/main.tf"), "utf-8");
        databaseVars = fs.readFileSync(path.resolve(__dirname, "../lib/modules/database/variables.tf"), "utf-8");
        databaseOutputs = fs.readFileSync(path.resolve(__dirname, "../lib/modules/database/outputs.tf"), "utf-8");
      });

      test("should have RDS security group", () => {
        expect(databaseMain).toMatch(/resource "aws_security_group" "rds"/);
      });

      test("should have RDS instance", () => {
        expect(databaseMain).toMatch(/resource "aws_db_instance" "main"/);
        expect(databaseMain).toMatch(/engine\s*=\s*"mysql"/);
        expect(databaseMain).toMatch(/engine_version\s*=\s*var\.db_engine_version/);
      });

      test("should have parameter group", () => {
        expect(databaseMain).toMatch(/resource "aws_db_parameter_group" "main"/);
        expect(databaseMain).toMatch(/family\s*=\s*var\.db_engine_version == "8\.0" \? "mysql8\.0"/);
      });

      test("should have enhanced monitoring for production", () => {
        expect(databaseMain).toMatch(/monitoring_role_arn/);
        expect(databaseMain).toMatch(/var\.environment == "production" \? 60 : 0/);
      });

      test("should have required variables", () => {
        expect(databaseVars).toMatch(/variable "database_name"/);
        expect(databaseVars).toMatch(/variable "database_username"/);
        expect(databaseVars).toMatch(/variable "monitoring_role_arn"/);
        expect(databaseVars).toMatch(/variable "app_security_group_id"/);
      });

      test("should have required outputs", () => {
        expect(databaseOutputs).toMatch(/output "database_endpoint"/);
        expect(databaseOutputs).toMatch(/output "database_id"/);
        expect(databaseOutputs).toMatch(/output "database_arn"/);
        expect(databaseOutputs).toMatch(/output "database_password"/);
        expect(databaseOutputs).toMatch(/output "ssm_parameter_name"/);
      });
    });
  });

  describe("Security and Best Practices", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf-8");
    });

    test("should have proper tagging strategy", () => {
      expect(stackContent).toMatch(/common_tags\s*=/);
      expect(stackContent).toMatch(/Environment\s*=/);
      expect(stackContent).toMatch(/Project\s*=/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test("should have environment-specific configurations", () => {
      // Check that environment variable is used in modules
      expect(stackContent).toMatch(/environment\s*=\s*var\.environment/);
      
      // Check for environment-specific configurations in database module
      const databaseMain = fs.readFileSync(path.resolve(__dirname, "../lib/modules/database/main.tf"), "utf-8");
      expect(databaseMain).toMatch(/var\.environment == "production"/);
    });

    test("should have proper resource naming", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*local\.name_prefix/);
    });

    test("should have data source for AMI instead of hardcoded value", () => {
      expect(stackContent).toMatch(/data\.aws_ami\.amazon_linux_2\.id/);
    });
  });

  describe("Security Configuration Validation", () => {
    let databaseMain: string;

    beforeAll(() => {
      databaseMain = fs.readFileSync(path.resolve(__dirname, "../lib/modules/database/main.tf"), "utf-8");
    });

    test("should have SSL/TLS configuration for database", () => {
      expect(databaseMain).toMatch(/resource "aws_db_instance" "main"/);
      expect(databaseMain).toMatch(/storage_encrypted\s*=\s*true/);
      expect(databaseMain).toMatch(/ca_cert_identifier\s*=\s*"rds-ca-rsa2048-g1"/);
    });

    test("should have KMS encryption enabled for database", () => {
      expect(databaseMain).toMatch(/kms_key_id\s*=\s*aws_kms_key\.database\.arn/);
    });

    test("should have secure password generation", () => {
      expect(databaseMain).toMatch(/password\s*=\s*random_password\.database\.result/);
      expect(databaseMain).toMatch(/resource "random_password" "database"/);
    });

    test("should have SSM parameter store for password storage", () => {
      expect(databaseMain).toMatch(/resource "aws_ssm_parameter" "database_password"/);
      expect(databaseMain).toMatch(/type\s*=\s*"SecureString"/);
    });

    test("should have scoped IAM permissions", () => {
      expect(databaseMain).toMatch(/monitoring_role_arn\s*=\s*var\.environment == "production" \? var\.monitoring_role_arn : null/);
    });

    test("should have deletion protection for production", () => {
      expect(databaseMain).toMatch(/deletion_protection\s*=\s*var\.environment == "production"/);
    });

    test("should have enhanced monitoring for production", () => {
      expect(databaseMain).toMatch(/monitoring_interval\s*=\s*var\.environment == "production" \? 60 : 0/);
    });

    test("should have proper security group rules", () => {
      expect(databaseMain).toMatch(/resource "aws_security_group" "rds"/);
      expect(databaseMain).toMatch(/ingress\s*{/);
      expect(databaseMain).toMatch(/egress\s*{/);
    });
  });

  describe("Environment-Specific Logic", () => {
    let databaseMain: string;

    beforeAll(() => {
      databaseMain = fs.readFileSync(path.resolve(__dirname, "../lib/modules/database/main.tf"), "utf-8");
    });

    test("should have different backup retention for staging vs production", () => {
      expect(databaseMain).toMatch(/backup_retention_period\s*=\s*var\.environment == "production" \? 30 : 7/);
    });

    test("should have different monitoring intervals for staging vs production", () => {
      expect(databaseMain).toMatch(/monitoring_interval\s*=\s*var\.environment == "production" \? 60 : 0/);
    });

    test("should have read replicas only for production", () => {
      expect(databaseMain).toMatch(/count\s*=\s*var\.environment == "production" \? 1 : 0/);
    });

    test("should have multi-AZ only for production", () => {
      expect(databaseMain).toMatch(/multi_az\s*=\s*var\.environment == "production"/);
    });

    test("should have different deletion protection for staging vs production", () => {
      expect(databaseMain).toMatch(/deletion_protection\s*=\s*var\.environment == "production"/);
    });

    test("should have different final snapshot settings for staging vs production", () => {
      expect(databaseMain).toMatch(/skip_final_snapshot\s*=\s*var\.environment != "production"/);
    });
  });

});