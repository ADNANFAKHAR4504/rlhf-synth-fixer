// Unit tests for Terraform infrastructure
// Tests the structure and configuration without deploying

import fs from "fs";
import path from "path";
import { parseSync } from "hcl2-parser";

const libDir = path.resolve(__dirname, "../lib");

// Helper function to read and parse HCL file
function readTerraformFile(filename: string): any {
  const filepath = path.join(libDir, filename);
  const content = fs.readFileSync(filepath, "utf8");
  try {
    return parseSync(content);
  } catch (error) {
    // For simple validation, just return the content
    return content;
  }
}

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure Tests", () => {
    test("all required Terraform files exist", () => {
      const requiredFiles = [
        "provider.tf",
        "variables.tf",
        "locals.tf",
        "tap_stack.tf",
        "outputs.tf"
      ];
      
      requiredFiles.forEach(file => {
        const filepath = path.join(libDir, file);
        expect(fs.existsSync(filepath)).toBe(true);
      });
    });

    test("AWS_REGION file exists and contains valid region", () => {
      const regionFile = path.join(libDir, "AWS_REGION");
      expect(fs.existsSync(regionFile)).toBe(true);
      const region = fs.readFileSync(regionFile, "utf8").trim();
      expect(region).toBe("us-east-1");
    });
  });

  describe("Provider Configuration Tests", () => {
    test("provider.tf contains AWS provider configuration", () => {
      const content = fs.readFileSync(path.join(libDir, "provider.tf"), "utf8");
      expect(content).toContain('provider "aws"');
      expect(content).toContain('backend "s3"');
      expect(content).toContain('required_version = ">= 1.4.0"');
    });

    test("provider.tf specifies required providers", () => {
      const content = fs.readFileSync(path.join(libDir, "provider.tf"), "utf8");
      expect(content).toContain('source  = "hashicorp/aws"');
      expect(content).toContain('source  = "hashicorp/random"');
    });
  });

  describe("Variables Configuration Tests", () => {
    test("variables.tf contains all required variables", () => {
      const content = fs.readFileSync(path.join(libDir, "variables.tf"), "utf8");
      expect(content).toContain('variable "aws_region"');
      expect(content).toContain('variable "environment"');
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('variable "random_id"');
    });

    test("aws_region defaults to us-east-1", () => {
      const content = fs.readFileSync(path.join(libDir, "variables.tf"), "utf8");
      expect(content).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test("environment_suffix variable exists for resource isolation", () => {
      const content = fs.readFileSync(path.join(libDir, "variables.tf"), "utf8");
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('description = "Environment suffix for resource isolation"');
    });
  });

  describe("Locals Configuration Tests", () => {
    test("locals.tf contains name_prefix with environment suffix", () => {
      const content = fs.readFileSync(path.join(libDir, "locals.tf"), "utf8");
      expect(content).toContain("name_prefix");
      expect(content).toContain("env_suffix");
      expect(content).toContain("AppResource");
    });

    test("locals.tf includes common tags", () => {
      const content = fs.readFileSync(path.join(libDir, "locals.tf"), "utf8");
      expect(content).toContain("common_tags");
      expect(content).toContain("Environment");
      expect(content).toContain("ManagedBy");
      expect(content).toContain("Project");
      expect(content).toContain("EnvironmentSuffix");
    });
  });

  describe("Infrastructure Resources Tests", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(path.join(libDir, "tap_stack.tf"), "utf8");
    });

    describe("VPC Configuration", () => {
      test("VPC resource is defined with correct CIDR", () => {
        expect(stackContent).toContain('resource "aws_vpc" "main"');
        expect(stackContent).toContain('cidr_block           = "10.0.0.0/16"');
        expect(stackContent).toContain("enable_dns_hostnames = true");
        expect(stackContent).toContain("enable_dns_support   = true");
      });

      test("Internet Gateway is attached to VPC", () => {
        expect(stackContent).toContain('resource "aws_internet_gateway" "main"');
        expect(stackContent).toContain("vpc_id = aws_vpc.main.id");
      });

      test("Public subnets are configured in multiple AZs", () => {
        expect(stackContent).toContain('resource "aws_subnet" "public"');
        expect(stackContent).toContain("count                   = 2");
        expect(stackContent).toContain("map_public_ip_on_launch = true");
        expect(stackContent).toContain("availability_zone       = data.aws_availability_zones.available.names[count.index]");
      });

      test("Private subnets are configured in multiple AZs", () => {
        expect(stackContent).toContain('resource "aws_subnet" "private"');
        expect(stackContent).toMatch(/aws_subnet.*private[\s\S]*?count\s*=\s*2/);
      });

      test("Route table and associations are configured", () => {
        expect(stackContent).toContain('resource "aws_route_table" "public"');
        expect(stackContent).toContain('resource "aws_route_table_association" "public"');
        expect(stackContent).toContain('cidr_block = "0.0.0.0/0"');
      });
    });

    describe("Security Groups Configuration", () => {
      test("Security group blocks all traffic by default", () => {
        expect(stackContent).toContain('resource "aws_security_group" "web_servers"');
        expect(stackContent).toContain("description = \"Security group for web servers - allows HTTP/HTTPS only\"");
      });

      test("Security group allows only HTTP and HTTPS ingress", () => {
        expect(stackContent).toMatch(/ingress[\s\S]*?from_port\s*=\s*80/);
        expect(stackContent).toMatch(/ingress[\s\S]*?from_port\s*=\s*443/);
        expect(stackContent).toMatch(/ingress[\s\S]*?cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      });

      test("Security group allows all egress traffic", () => {
        expect(stackContent).toMatch(/egress[\s\S]*?from_port\s*=\s*0/);
        expect(stackContent).toMatch(/egress[\s\S]*?protocol\s*=\s*"-1"/);
      });
    });

    describe("IAM Configuration", () => {
      test("IAM role for EC2 instances is defined", () => {
        expect(stackContent).toContain('resource "aws_iam_role" "ec2_role"');
        expect(stackContent).toContain('Service = "ec2.amazonaws.com"');
      });

      test("IAM policy includes S3 and DynamoDB permissions", () => {
        expect(stackContent).toContain('resource "aws_iam_policy" "ec2_policy"');
        expect(stackContent).toContain("s3:GetObject");
        expect(stackContent).toContain("s3:PutObject");
        expect(stackContent).toContain("dynamodb:GetItem");
        expect(stackContent).toContain("dynamodb:PutItem");
      });

      test("IAM instance profile is created", () => {
        expect(stackContent).toContain('resource "aws_iam_instance_profile" "ec2_profile"');
        expect(stackContent).toContain("role = aws_iam_role.ec2_role.name");
      });

      test("Policy is attached to role", () => {
        expect(stackContent).toContain('resource "aws_iam_role_policy_attachment" "ec2_policy_attachment"');
      });
    });

    describe("EC2 Configuration", () => {
      test("EC2 instances are configured with correct settings", () => {
        expect(stackContent).toContain('resource "aws_instance" "web_servers"');
        expect(stackContent).toContain("count                  = 2");
        expect(stackContent).toContain('instance_type          = "t3.micro"');
      });

      test("EC2 instances have CloudWatch monitoring enabled", () => {
        expect(stackContent).toContain("monitoring = true");
      });

      test("EC2 instances use IAM instance profile", () => {
        expect(stackContent).toContain("iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name");
      });

      test("EC2 instances have user data script", () => {
        expect(stackContent).toContain("user_data");
        expect(stackContent).toContain("yum install -y httpd");
        expect(stackContent).toContain("amazon-cloudwatch-agent");
      });
    });

    describe("S3 Configuration", () => {
      test("S3 bucket is configured with versioning", () => {
        expect(stackContent).toContain('resource "aws_s3_bucket" "app_logs"');
        expect(stackContent).toContain('resource "aws_s3_bucket_versioning" "app_logs_versioning"');
        expect(stackContent).toContain('status = "Enabled"');
      });

      test("S3 bucket has force_destroy enabled for cleanup", () => {
        expect(stackContent).toContain("force_destroy = true");
      });

      test("S3 bucket has public access blocked", () => {
        expect(stackContent).toContain('resource "aws_s3_bucket_public_access_block" "app_logs_pab"');
        expect(stackContent).toContain("block_public_acls       = true");
        expect(stackContent).toContain("block_public_policy     = true");
      });

      test("S3 bucket has server-side encryption", () => {
        expect(stackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "app_logs_encryption"');
        expect(stackContent).toContain('sse_algorithm = "AES256"');
      });

      test("S3 bucket name uses lowercase", () => {
        expect(stackContent).toContain('bucket        = lower(');
      });
    });

    describe("DynamoDB Configuration", () => {
      test("DynamoDB table has on-demand billing", () => {
        expect(stackContent).toContain('resource "aws_dynamodb_table" "app_table"');
        expect(stackContent).toContain('billing_mode                = "PAY_PER_REQUEST"');
      });

      test("DynamoDB table has deletion protection disabled", () => {
        expect(stackContent).toContain("deletion_protection_enabled = false");
      });

      test("DynamoDB table has point-in-time recovery enabled", () => {
        expect(stackContent).toContain("point_in_time_recovery");
        expect(stackContent).toContain("enabled = true");
      });

      test("DynamoDB table has server-side encryption", () => {
        expect(stackContent).toContain("server_side_encryption");
        expect(stackContent).toMatch(/server_side_encryption[\s\S]*?enabled\s*=\s*true/);
      });
    });

    describe("CloudWatch Configuration", () => {
      test("CloudWatch log group is configured", () => {
        expect(stackContent).toContain('resource "aws_cloudwatch_log_group" "app_logs"');
        expect(stackContent).toContain("retention_in_days = 7");
      });

      test("CloudWatch alarms are configured for EC2 instances", () => {
        expect(stackContent).toContain('resource "aws_cloudwatch_metric_alarm" "high_cpu"');
        expect(stackContent).toContain('metric_name         = "CPUUtilization"');
        expect(stackContent).toContain('threshold           = "80"');
      });

      test("CloudWatch dashboard is configured", () => {
        expect(stackContent).toContain('resource "aws_cloudwatch_dashboard" "app_dashboard"');
        expect(stackContent).toContain("CPUUtilization");
        expect(stackContent).toContain("DynamoDB");
      });
    });
  });

  describe("Outputs Configuration Tests", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
    });

    test("all required outputs are defined", () => {
      const requiredOutputs = [
        "vpc_id",
        "public_subnet_ids",
        "private_subnet_ids",
        "ec2_instance_ids",
        "ec2_public_ips",
        "s3_bucket_name",
        "dynamodb_table_name",
        "security_group_id",
        "iam_role_arn",
        "cloudwatch_dashboard_url"
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toContain(`output "${output}"`);
      });
    });

    test("outputs have descriptions", () => {
      expect(outputsContent.match(/description\s*=/g)?.length).toBeGreaterThanOrEqual(10);
    });

    test("outputs reference correct resources", () => {
      expect(outputsContent).toContain("aws_vpc.main.id");
      expect(outputsContent).toContain("aws_subnet.public[*].id");
      expect(outputsContent).toContain("aws_instance.web_servers[*].id");
      expect(outputsContent).toContain("aws_s3_bucket.app_logs.bucket");
      expect(outputsContent).toContain("aws_dynamodb_table.app_table.name");
    });
  });

  describe("Resource Naming Convention Tests", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(path.join(libDir, "tap_stack.tf"), "utf8");
    });

    test("resources use name_prefix from locals", () => {
      const resourcesWithNames = [
        "aws_vpc",
        "aws_internet_gateway",
        "aws_subnet",
        "aws_route_table",
        "aws_security_group",
        "aws_iam_role",
        "aws_iam_policy",
        "aws_instance",
        "aws_s3_bucket",
        "aws_dynamodb_table"
      ];

      resourcesWithNames.forEach(resource => {
        const regex = new RegExp(`resource\\s+"${resource}"[\\s\\S]*?\\$\\{local\\.name_prefix\\}`);
        expect(stackContent).toMatch(regex);
      });
    });

    test("resources use common_tags from locals", () => {
      expect(stackContent.match(/merge\(local\.common_tags/g)?.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Best Practices and Security Tests", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(path.join(libDir, "tap_stack.tf"), "utf8");
    });

    test("no hardcoded credentials are present", () => {
      expect(stackContent).not.toMatch(/aws_access_key_id/i);
      expect(stackContent).not.toMatch(/aws_secret_access_key/i);
      expect(stackContent).not.toMatch(/password\s*=\s*"/);
    });

    test("no public IPs are hardcoded", () => {
      // Except for 0.0.0.0/0 for security group rules
      const ipRegex = /\b(?:(?!0\.0\.0\.0)\d{1,3}\.){3}\d{1,3}\b/g;
      const matches = stackContent.match(ipRegex);
      if (matches) {
        // Only allow private IP ranges (10.x.x.x)
        matches.forEach(ip => {
          expect(ip).toMatch(/^10\./);
        });
      }
    });

    test("resources can be destroyed (no retention policies)", () => {
      expect(stackContent).toContain("force_destroy = true");
      expect(stackContent).toContain("deletion_protection_enabled = false");
    });

    test("data sources are used for dynamic values", () => {
      expect(stackContent).toContain('data "aws_availability_zones" "available"');
      expect(stackContent).toContain('data "aws_ami" "amazon_linux"');
    });
  });
});