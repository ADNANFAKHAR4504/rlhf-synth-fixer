// tests/unit/terraform-unit-tests.ts
// Comprehensive unit tests for all lib/ Terraform files
// Tests for structure, resources, variables, outputs, and configuration

import * as fs from "fs";
import * as path from "path";

describe("Terraform lib/ .tf unit tests", () => {
  let tfAll: string;
  let mainTf: string;
  let variablesTf: string;
  let outputsTf: string;
  let vpcTf: string;
  let ec2Tf: string;
  let rdsTf: string;
  let s3Tf: string;

  beforeAll(() => {
    const libDir = path.join(__dirname, "../lib");

    // Read all Terraform files
    const files = fs.readdirSync(libDir).filter(f => f.endsWith(".tf"));
    if (files.length === 0) {
      throw new Error("No .tf files found in lib/ directory");
    }

    // Read individual files
    mainTf = fs.readFileSync(path.join(libDir, "main.tf"), "utf8");
    variablesTf = fs.readFileSync(path.join(libDir, "variables.tf"), "utf8");
    outputsTf = fs.readFileSync(path.join(libDir, "outputs.tf"), "utf8");
    vpcTf = fs.readFileSync(path.join(libDir, "vpc.tf"), "utf8");
    ec2Tf = fs.readFileSync(path.join(libDir, "ec2.tf"), "utf8");
    rdsTf = fs.readFileSync(path.join(libDir, "rds.tf"), "utf8");
    s3Tf = fs.readFileSync(path.join(libDir, "s3.tf"), "utf8");

    // Combine all for comprehensive checks
    tfAll = [mainTf, variablesTf, outputsTf, vpcTf, ec2Tf, rdsTf, s3Tf].join("\n\n");
  });

  const contains = (content: string, substr: string) => {
    expect(content).toContain(substr);
  };

  describe("main.tf validation", () => {
    test("should contain proper Terraform version and providers", () => {
      contains(mainTf, "terraform {");
      contains(mainTf, "required_version = \">= 1.0\"");
      contains(mainTf, "required_providers {");
      contains(mainTf, "source  = \"hashicorp/aws\"");
      contains(mainTf, "version = \"~> 4.0\"");
    });

    test("should have S3 backend configuration", () => {
      contains(mainTf, "backend \"s3\" {}");
    });

    test("should configure AWS provider with default tags", () => {
      contains(mainTf, "provider \"aws\" {");
      contains(mainTf, "default_tags {");
      contains(mainTf, "iac-rlhf-amazon = \"true\"");
    });
  });

  describe("variables.tf validation", () => {
    test("should declare all required variables", () => {
      contains(variablesTf, "variable \"resource_suffix\" {");
      contains(variablesTf, "variable \"db_username\" {");
      contains(variablesTf, "variable \"db_password\" {");
      contains(variablesTf, "variable \"db_name\" {");
      contains(variablesTf, "variable \"db_instance_class\" {");
      contains(variablesTf, "variable \"ec2_instance_type\" {");
    });

    test("should have proper variable types", () => {
      contains(variablesTf, "type        = string");
      expect(variablesTf.match(/type\s+=\s+string/g)?.length).toBeGreaterThanOrEqual(5);
    });

    test("should mark sensitive variables as sensitive", () => {
      expect(variablesTf).toMatch(/variable "db_username"[\s\S]*?sensitive\s+=\s+true/);
      expect(variablesTf).toMatch(/variable "db_password"[\s\S]*?sensitive\s+=\s+true/);
    });

    test("should have default values for non-sensitive variables", () => {
      contains(variablesTf, "default     = \"dev\"");
      contains(variablesTf, "default     = \"mydb\"");
      contains(variablesTf, "default     = \"db.t3.micro\"");
      contains(variablesTf, "default     = \"t3.micro\"");
    });
  });

  describe("vpc.tf networking validation", () => {
    test("should create VPC with proper CIDR and DNS settings", () => {
      contains(vpcTf, "resource \"aws_vpc\" \"main\" {");
      contains(vpcTf, "cidr_block           = \"10.0.0.0/16\"");
      contains(vpcTf, "enable_dns_support   = true");
      contains(vpcTf, "enable_dns_hostnames = true");
    });

    test("should create subnets in different availability zones", () => {
      contains(vpcTf, "resource \"aws_subnet\" \"public\" {");
      contains(vpcTf, "resource \"aws_subnet\" \"private\" {");
      contains(vpcTf, "resource \"aws_subnet\" \"private_2\" {");
      contains(vpcTf, "data \"aws_availability_zones\" \"available\"");
    });

    test("should use dynamic availability zone selection", () => {
      contains(vpcTf, "data.aws_availability_zones.available.names[0]");
      contains(vpcTf, "data.aws_availability_zones.available.names[1]");
      contains(vpcTf, "data.aws_availability_zones.available.names[2]");
    });

    test("should create internet gateway and routing", () => {
      contains(vpcTf, "resource \"aws_internet_gateway\" \"igw\" {");
      contains(vpcTf, "resource \"aws_route_table\" \"public\" {");
      contains(vpcTf, "resource \"aws_route_table_association\" \"public\" {");
    });
  });

  describe("ec2.tf compute validation", () => {
    test("should use latest Amazon Linux 2 AMI", () => {
      contains(ec2Tf, "data \"aws_ami\" \"amazon_linux_2\" {");
      contains(ec2Tf, "most_recent = true");
      contains(ec2Tf, "owners      = [\"amazon\"]");
      contains(ec2Tf, "amzn2-ami-hvm-*-x86_64-gp2");
    });

    test("should create security group without SSH access", () => {
      contains(ec2Tf, "resource \"aws_security_group\" \"ec2_sg\" {");
      expect(ec2Tf).not.toContain("from_port   = 22");
      expect(ec2Tf).not.toContain("to_port     = 22");
    });

    test("should create IAM role for SSM access", () => {
      contains(ec2Tf, "resource \"aws_iam_role\" \"ec2_ssm_role\" {");
      contains(ec2Tf, "Service = \"ec2.amazonaws.com\"");
      contains(ec2Tf, "sts:AssumeRole");
    });

    test("should attach SSM managed policy", () => {
      contains(ec2Tf, "resource \"aws_iam_role_policy_attachment\" \"ec2_ssm_policy\" {");
      contains(ec2Tf, "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
    });

    test("should create EC2 instance with SSM profile", () => {
      contains(ec2Tf, "resource \"aws_instance\" \"web\" {");
      contains(ec2Tf, "iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name");
    });
  });

  describe("rds.tf database validation", () => {
    test("should create MySQL database with proper configuration", () => {
      contains(rdsTf, "resource \"aws_db_instance\" \"default\" {");
      contains(rdsTf, "engine                  = \"mysql\"");
      contains(rdsTf, "engine_version          = \"8.0\"");
      contains(rdsTf, "allocated_storage       = 20");
    });

    test("should have deletion protection disabled", () => {
      contains(rdsTf, "deletion_protection     = false");
    });

    test("should have backup configuration", () => {
      contains(rdsTf, "backup_retention_period = 7");
      contains(rdsTf, "backup_window           = \"03:00-04:00\"");
    });

    test("should create DB subnet group for multi-AZ", () => {
      contains(rdsTf, "resource \"aws_db_subnet_group\" \"default\" {");
      contains(rdsTf, "subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]");
    });

    test("should create security group for database access", () => {
      contains(rdsTf, "resource \"aws_security_group\" \"rds_sg\" {");
      contains(rdsTf, "from_port       = 3306");
      contains(rdsTf, "to_port         = 3306");
    });
  });

  describe("s3.tf storage validation", () => {
    test("should create S3 bucket with unique naming", () => {
      contains(s3Tf, "resource \"aws_s3_bucket\" \"terraform_state\" {");
      contains(s3Tf, "data \"aws_caller_identity\" \"current\"");
      contains(s3Tf, "data.aws_caller_identity.current.account_id");
    });

    test("should enable versioning", () => {
      contains(s3Tf, "resource \"aws_s3_bucket_versioning\" \"terraform_state_versioning\" {");
      contains(s3Tf, "status = \"Enabled\"");
    });

    test("should configure encryption", () => {
      contains(s3Tf, "resource \"aws_s3_bucket_server_side_encryption_configuration\"");
      contains(s3Tf, "sse_algorithm = \"AES256\"");
    });

    test("should block public access", () => {
      contains(s3Tf, "resource \"aws_s3_bucket_public_access_block\"");
      contains(s3Tf, "block_public_acls       = true");
      contains(s3Tf, "block_public_policy     = true");
    });
  });

  describe("outputs.tf validation", () => {
    test("should expose all required outputs", () => {
      contains(outputsTf, "output \"vpc_id\" {");
      contains(outputsTf, "output \"public_subnet_id\" {");
      contains(outputsTf, "output \"ec2_instance_id\" {");
      contains(outputsTf, "output \"ec2_instance_public_ip\" {");
      contains(outputsTf, "output \"rds_endpoint\" {");
      contains(outputsTf, "output \"s3_bucket_name\" {");
    });

    test("should have proper descriptions for outputs", () => {
      expect(outputsTf.match(/description\s+=\s+"/g)?.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("security and best practices", () => {
    test("should have iac-rlhf-amazon tags on main resources", () => {
      // Count only resources that can have tags (not associations, policy attachments, etc.)
      const taggableResources = [
        'resource "aws_vpc"',
        'resource "aws_subnet"',
        'resource "aws_internet_gateway"',
        'resource "aws_route_table"',
        'resource "aws_security_group"',
        'resource "aws_instance"',
        'resource "aws_iam_role"',
        'resource "aws_iam_instance_profile"',
        'resource "aws_db_subnet_group"',
        'resource "aws_db_instance"',
        'resource "aws_s3_bucket"'
      ];

      const tagCount = (tfAll.match(/iac-rlhf-amazon\s*=\s*"true"/g) || []).length;
      expect(tagCount).toBeGreaterThan(10); // Should have tags on most major resources
    });

    test("should not contain hardcoded secrets", () => {
      expect(tfAll).not.toMatch(/password\s*=\s*"[^$]/);
      expect(tfAll).not.toMatch(/secret\s*=\s*"[^$]/);
    });

    test("should use variable references for sensitive data", () => {
      expect(tfAll).toMatch(/password\s*=\s*var\.db_password/);
      expect(tfAll).toMatch(/username\s*=\s*var\.db_username/);
    });

    test("should have proper resource naming with suffix", () => {
      const suffixUsage = (tfAll.match(/\$\{var\.resource_suffix\}/g) || []).length;
      expect(suffixUsage).toBeGreaterThan(10);
    });
  });

  describe("infrastructure completeness", () => {
    test("should have complete networking stack", () => {
      contains(tfAll, 'resource "aws_vpc" "main"');
      contains(tfAll, 'resource "aws_subnet" "public"');
      contains(tfAll, 'resource "aws_subnet" "private"');
      contains(tfAll, 'resource "aws_internet_gateway" "igw"');
      contains(tfAll, 'resource "aws_route_table" "public"');
    });

    test("should have complete compute stack", () => {
      contains(tfAll, 'resource "aws_instance" "web"');
      contains(tfAll, 'resource "aws_security_group" "ec2_sg"');
      contains(tfAll, 'resource "aws_iam_role" "ec2_ssm_role"');
      contains(tfAll, 'resource "aws_iam_instance_profile" "ec2_profile"');
    });

    test("should have complete database stack", () => {
      contains(tfAll, 'resource "aws_db_instance" "default"');
      contains(tfAll, 'resource "aws_db_subnet_group" "default"');
      contains(tfAll, 'resource "aws_security_group" "rds_sg"');
    });

    test("should have complete storage stack", () => {
      contains(tfAll, 'resource "aws_s3_bucket" "terraform_state"');
      contains(tfAll, 'resource "aws_s3_bucket_versioning"');
      contains(tfAll, 'resource "aws_s3_bucket_server_side_encryption_configuration"');
    });
  });
});
