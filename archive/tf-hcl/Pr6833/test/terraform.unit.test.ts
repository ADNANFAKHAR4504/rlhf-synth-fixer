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
      contains(mainTf, "source  = \"hashicorp/random\"");
      contains(mainTf, "version = \"~> 3.0\"");
    });

    test("should have S3 backend configuration uncommented", () => {
      contains(mainTf, "backend \"s3\" {}");
    });

    test("should configure AWS provider with us-east-1 region", () => {
      contains(mainTf, "provider \"aws\" {");
      contains(mainTf, "region = \"us-east-1\"");
    });

    test("should configure AWS provider with default tags", () => {
      contains(mainTf, "default_tags {");
      contains(mainTf, "iac-rlhf-amazon = \"true\"");
    });

    test("should define local variable for secret_suffix with timestamp", () => {
      contains(mainTf, "locals {");
      contains(mainTf, "secret_suffix = formatdate(\"YYYYMMDDhhmmss\", timestamp())");
    });
  });

  describe("variables.tf validation", () => {
    test("should declare all required variables", () => {
      contains(variablesTf, "variable \"resource_suffix\" {");
      contains(variablesTf, "variable \"ssh_cidr_blocks\" {");
      contains(variablesTf, "variable \"ssh_public_key\" {");
      contains(variablesTf, "variable \"db_username\" {");
      contains(variablesTf, "variable \"db_name\" {");
      contains(variablesTf, "variable \"db_instance_class\" {");
      contains(variablesTf, "variable \"ec2_instance_type\" {");
    });

    test("should have proper variable types", () => {
      contains(variablesTf, "type        = string");
      contains(variablesTf, "type        = list(string)");
      expect(variablesTf.match(/type\s+=\s+string/g)?.length).toBeGreaterThanOrEqual(5);
      expect(variablesTf.match(/type\s+=\s+list\(string\)/g)?.length).toBeGreaterThanOrEqual(1);
    });

    test("should mark sensitive variables as sensitive", () => {
      expect(variablesTf).toMatch(/variable "db_username"[\s\S]*?sensitive\s+=\s+true/);
    });

    test("should have descriptions for all variables", () => {
      expect(variablesTf.match(/description\s+=\s+"/g)?.length).toBeGreaterThanOrEqual(7);
    });

    test("should have validation for ssh_cidr_blocks to prevent empty values", () => {
      contains(variablesTf, "validation {");
      expect(variablesTf).toMatch(/length\(var\.ssh_cidr_blocks\)\s+>\s+0/);
    });
  });

  describe("vpc.tf networking validation", () => {
    test("should query availability zones with proper filter", () => {
      contains(vpcTf, "data \"aws_availability_zones\" \"available\" {");
      contains(vpcTf, "state = \"available\"");
      expect(vpcTf).toMatch(/filter\s*\{[\s\S]*?name\s*=\s*"region-name"[\s\S]*?values\s*=\s*\["us-east-1"\]/);
    });

    test("should create VPC with proper CIDR and DNS settings", () => {
      contains(vpcTf, "resource \"aws_vpc\" \"main\" {");
      contains(vpcTf, "cidr_block           = \"10.0.0.0/16\"");
      contains(vpcTf, "enable_dns_support   = true");
      contains(vpcTf, "enable_dns_hostnames = true");
    });

    test("should have VPC with proper naming", () => {
      expect(vpcTf).toMatch(/resource "aws_vpc" "main"[\s\S]*?Name\s*=\s*"main-vpc-\$\{var\.resource_suffix\}"/);
    });

    test("should create subnets in different availability zones", () => {
      contains(vpcTf, "resource \"aws_subnet\" \"public\" {");
      contains(vpcTf, "resource \"aws_subnet\" \"private\" {");
      contains(vpcTf, "resource \"aws_subnet\" \"private_2\" {");
    });

    test("should use dynamic availability zone selection", () => {
      contains(vpcTf, "data.aws_availability_zones.available.names[0]");
      contains(vpcTf, "data.aws_availability_zones.available.names[1]");
      contains(vpcTf, "data.aws_availability_zones.available.names[2]");
    });

    test("should have public subnet with map_public_ip_on_launch enabled", () => {
      expect(vpcTf).toMatch(/resource "aws_subnet" "public"[\s\S]*?map_public_ip_on_launch\s*=\s*true/);
    });

    test("should have proper subnet naming", () => {
      expect(vpcTf).toMatch(/resource "aws_subnet" "public"[\s\S]*?Name\s*=\s*"public-subnet-\$\{var\.resource_suffix\}"/);
      expect(vpcTf).toMatch(/resource "aws_subnet" "private"[\s\S]*?Name\s*=\s*"private-subnet-\$\{var\.resource_suffix\}"/);
      expect(vpcTf).toMatch(/resource "aws_subnet" "private_2"[\s\S]*?Name\s*=\s*"private-subnet-2-\$\{var\.resource_suffix\}"/);
    });

    test("should create internet gateway and routing", () => {
      contains(vpcTf, "resource \"aws_internet_gateway\" \"igw\" {");
      contains(vpcTf, "resource \"aws_route_table\" \"public\" {");
      contains(vpcTf, "resource \"aws_route_table_association\" \"public\" {");
    });

    test("should have internet gateway with proper naming", () => {
      expect(vpcTf).toMatch(/resource "aws_internet_gateway" "igw"[\s\S]*?Name\s*=\s*"main-igw-\$\{var\.resource_suffix\}"/);
    });

    test("should have route table with default route to internet gateway", () => {
      expect(vpcTf).toMatch(/route\s*\{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.igw\.id/);
    });

    test("should have route table with proper naming", () => {
      expect(vpcTf).toMatch(/resource "aws_route_table" "public"[\s\S]*?Name\s*=\s*"public-rt-\$\{var\.resource_suffix\}"/);
    });

    test("should associate route table with public subnet", () => {
      contains(vpcTf, "subnet_id      = aws_subnet.public.id");
      contains(vpcTf, "route_table_id = aws_route_table.public.id");
    });

    test("should have proper subnet CIDRs", () => {
      contains(vpcTf, "cidr_block              = \"10.0.1.0/24\""); // public
      contains(vpcTf, "cidr_block        = \"10.0.2.0/24\""); // private
      contains(vpcTf, "cidr_block        = \"10.0.3.0/24\""); // private_2
    });
  });

  describe("ec2.tf compute validation", () => {
    test("should use latest Amazon Linux 2 AMI", () => {
      contains(ec2Tf, "data \"aws_ami\" \"amazon_linux_2\" {");
      contains(ec2Tf, "most_recent = true");
      contains(ec2Tf, "owners      = [\"amazon\"]");
      contains(ec2Tf, "amzn2-ami-hvm-*-x86_64-gp2");
    });

    test("should have AMI data source with virtualization-type filter", () => {
      expect(ec2Tf).toMatch(/filter\s*\{[\s\S]*?name\s*=\s*"virtualization-type"[\s\S]*?values\s*=\s*\["hvm"\]/);
    });

    test("should have AMI data source with name filter", () => {
      expect(ec2Tf).toMatch(/filter\s*\{[\s\S]*?name\s*=\s*"name"[\s\S]*?values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/);
    });

    test("should create security group with SSH access", () => {
      contains(ec2Tf, "resource \"aws_security_group\" \"ec2_sg\" {");
      expect(ec2Tf).toContain("from_port   = 22");
      expect(ec2Tf).toContain("to_port     = 22");
      expect(ec2Tf).toContain("protocol    = \"tcp\"");
      expect(ec2Tf).toContain("cidr_blocks = var.ssh_cidr_blocks");
      expect(ec2Tf).toContain("SSH access from configurable IP addresses");
    });

    test("should have security group with proper naming", () => {
      contains(ec2Tf, "name        = \"ec2-sg-${var.resource_suffix}\"");
      contains(ec2Tf, "description = \"Security group for EC2 instance\"");
    });

    test("should have EC2 security group egress rule allowing all outbound", () => {
      expect(ec2Tf).toMatch(/egress\s*\{[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"[\s\S]*?cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      contains(ec2Tf, "Allow all outbound traffic");
    });

    test("should create conditional SSH key pair", () => {
      contains(ec2Tf, "resource \"aws_key_pair\" \"deployer\" {");
      expect(ec2Tf).toContain("count      = var.ssh_public_key != \"\" ? 1 : 0");
      expect(ec2Tf).toContain("public_key = var.ssh_public_key");
      expect(ec2Tf).toContain("key_name   = \"deployer-key-${var.resource_suffix}\"");
    });

    test("should create IAM role for SSM access", () => {
      contains(ec2Tf, "resource \"aws_iam_role\" \"ec2_ssm_role\" {");
      contains(ec2Tf, "Service = \"ec2.amazonaws.com\"");
      contains(ec2Tf, "sts:AssumeRole");
    });

    test("should have proper IAM role name", () => {
      contains(ec2Tf, "name = \"ec2-ssm-role-${var.resource_suffix}\"");
    });

    test("should attach SSM managed policy", () => {
      contains(ec2Tf, "resource \"aws_iam_role_policy_attachment\" \"ec2_ssm_policy\" {");
      contains(ec2Tf, "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
    });

    test("should create inline IAM policy for S3 access", () => {
      contains(ec2Tf, "resource \"aws_iam_role_policy\" \"ec2_s3_access\" {");
      contains(ec2Tf, "name = \"ec2-ssm-s3-access-${var.resource_suffix}\"");
      contains(ec2Tf, "role = aws_iam_role.ec2_ssm_role.id");
    });

    test("should have S3 policy with correct permissions", () => {
      expect(ec2Tf).toMatch(/"s3:PutObject"/);
      expect(ec2Tf).toMatch(/"s3:GetObject"/);
      expect(ec2Tf).toMatch(/"s3:DeleteObject"/);
      expect(ec2Tf).toMatch(/"s3:ListBucket"/);
      // Check for explicit ARN construction with account ID (reuses data source from s3.tf)
      contains(ec2Tf, "arn:aws:s3:::terraform-state-${data.aws_caller_identity.current.account_id}-${var.resource_suffix}");
      contains(ec2Tf, "arn:aws:s3:::terraform-state-${data.aws_caller_identity.current.account_id}-${var.resource_suffix}/*");
    });

    test("should create inline IAM policy for Secrets Manager access", () => {
      contains(ec2Tf, "resource \"aws_iam_role_policy\" \"ec2_secrets_access\" {");
      contains(ec2Tf, "name = \"ec2-ssm-secrets-access-${var.resource_suffix}\"");
      contains(ec2Tf, "role = aws_iam_role.ec2_ssm_role.id");
    });

    test("should have Secrets Manager policy with correct permissions", () => {
      expect(ec2Tf).toMatch(/"secretsmanager:GetSecretValue"/);
      expect(ec2Tf).toMatch(/"secretsmanager:DescribeSecret"/);
      expect(ec2Tf).toMatch(/aws_secretsmanager_secret\.db_credentials\.arn/);
    });

    test("should create IAM instance profile", () => {
      contains(ec2Tf, "resource \"aws_iam_instance_profile\" \"ec2_profile\" {");
      contains(ec2Tf, "name = \"ec2-profile-${var.resource_suffix}\"");
      contains(ec2Tf, "role = aws_iam_role.ec2_ssm_role.name");
    });

    test("should create EC2 instance with SSM profile", () => {
      contains(ec2Tf, "resource \"aws_instance\" \"web\" {");
      contains(ec2Tf, "iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name");
      expect(ec2Tf).toContain("key_name               = var.ssh_public_key != \"\" ? aws_key_pair.deployer[0].key_name : null");
    });

    test("should have proper EC2 instance configuration", () => {
      contains(ec2Tf, "instance_type          = var.ec2_instance_type");
      contains(ec2Tf, "vpc_security_group_ids = [aws_security_group.ec2_sg.id]");
      contains(ec2Tf, "subnet_id              = aws_subnet.public.id");
      contains(ec2Tf, "ami                    = data.aws_ami.amazon_linux_2.id");
    });

    test("should have proper EC2 instance naming", () => {
      expect(ec2Tf).toMatch(/resource "aws_instance" "web"[\s\S]*?Name\s*=\s*"web-instance-\$\{var\.resource_suffix\}"/);
    });
  });

  describe("rds.tf database validation", () => {
    test("should create random password resource for RDS", () => {
      contains(rdsTf, "resource \"random_password\" \"db_password\" {");
      contains(rdsTf, "length  = 16");
      contains(rdsTf, "special = true");
      expect(rdsTf).toMatch(/override_special\s*=/);
    });

    test("should create Secrets Manager secret for RDS credentials", () => {
      contains(rdsTf, "resource \"aws_secretsmanager_secret\" \"db_credentials\" {");
      contains(rdsTf, "name                    = \"rds-credentials-${local.secret_suffix}-${var.resource_suffix}\"");
      contains(rdsTf, "description             = \"RDS database credentials\"");
      contains(rdsTf, "recovery_window_in_days = 7");
    });

    test("should create Secrets Manager secret version with credentials", () => {
      contains(rdsTf, "resource \"aws_secretsmanager_secret_version\" \"db_credentials\" {");
      contains(rdsTf, "secret_id = aws_secretsmanager_secret.db_credentials.id");
      expect(rdsTf).toMatch(/secret_string\s*=\s*jsonencode/);
      expect(rdsTf).toMatch(/username\s*=\s*var\.db_username/);
      expect(rdsTf).toMatch(/password\s*=\s*random_password\.db_password\.result/);
    });

    test("should create MySQL database with proper configuration", () => {
      contains(rdsTf, "resource \"aws_db_instance\" \"default\" {");
      contains(rdsTf, "engine                  = \"mysql\"");
      contains(rdsTf, "engine_version          = \"8.0\"");
      contains(rdsTf, "allocated_storage       = 20");
      contains(rdsTf, "storage_type            = \"gp2\"");
    });

    test("should have proper RDS identifier and naming", () => {
      contains(rdsTf, "identifier              = \"mysql-db-${var.resource_suffix}\"");
      expect(rdsTf).toMatch(/resource "aws_db_instance" "default"[\s\S]*?Name\s*=\s*"mysql-db-\$\{var\.resource_suffix\}"/);
    });

    test("should have deletion protection disabled", () => {
      contains(rdsTf, "deletion_protection     = false");
    });

    test("should have skip_final_snapshot enabled", () => {
      contains(rdsTf, "skip_final_snapshot     = true");
    });

    test("should have backup configuration", () => {
      contains(rdsTf, "backup_retention_period = 7");
      contains(rdsTf, "backup_window           = \"03:00-04:00\"");
    });

    test("should have maintenance window configured", () => {
      contains(rdsTf, "maintenance_window      = \"Mon:04:00-Mon:05:00\"");
    });

    test("should have parameter group specified", () => {
      contains(rdsTf, "parameter_group_name    = \"default.mysql8.0\"");
    });

    test("should create DB subnet group for multi-AZ", () => {
      contains(rdsTf, "resource \"aws_db_subnet_group\" \"default\" {");
      contains(rdsTf, "subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]");
      contains(rdsTf, "name       = \"main-${var.resource_suffix}\"");
    });

    test("should create security group for database access", () => {
      contains(rdsTf, "resource \"aws_security_group\" \"rds_sg\" {");
      contains(rdsTf, "from_port       = 3306");
      contains(rdsTf, "to_port         = 3306");
      contains(rdsTf, "name        = \"rds-sg-${var.resource_suffix}\"");
      contains(rdsTf, "description = \"Security group for RDS\"");
    });

    test("should have RDS security group referencing EC2 security group", () => {
      expect(rdsTf).toMatch(/ingress\s*\{[\s\S]*?security_groups\s*=\s*\[aws_security_group\.ec2_sg\.id\]/);
      contains(rdsTf, "MySQL access from EC2 instances");
    });

    test("should have RDS security group egress rule allowing all outbound", () => {
      expect(rdsTf).toMatch(/egress\s*\{[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"[\s\S]*?cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      contains(rdsTf, "Allow all outbound traffic");
    });

    test("should have proper RDS configuration", () => {
      contains(rdsTf, "instance_class          = var.db_instance_class");
      contains(rdsTf, "username                = var.db_username");
      contains(rdsTf, "password                = random_password.db_password.result");
      contains(rdsTf, "db_name                 = var.db_name");
      contains(rdsTf, "db_subnet_group_name    = aws_db_subnet_group.default.name");
      contains(rdsTf, "vpc_security_group_ids  = [aws_security_group.rds_sg.id]");
      contains(rdsTf, "storage_encrypted       = true");
    });
  });

  describe("s3.tf storage validation", () => {
    test("should create S3 bucket with unique naming", () => {
      contains(s3Tf, "resource \"aws_s3_bucket\" \"terraform_state\" {");
      contains(s3Tf, "data \"aws_caller_identity\" \"current\"");
      contains(s3Tf, "data.aws_caller_identity.current.account_id");
    });

    test("should have proper bucket naming", () => {
      contains(s3Tf, "bucket = \"terraform-state-${data.aws_caller_identity.current.account_id}-${var.resource_suffix}\"");
    });

    test("should enable versioning", () => {
      contains(s3Tf, "resource \"aws_s3_bucket_versioning\" \"terraform_state_versioning\" {");
      contains(s3Tf, "status = \"Enabled\"");
      contains(s3Tf, "bucket = aws_s3_bucket.terraform_state.id");
    });

    test("should have versioning configuration block", () => {
      expect(s3Tf).toMatch(/versioning_configuration\s*\{[\s\S]*?status\s*=\s*"Enabled"/);
    });

    test("should configure encryption", () => {
      contains(s3Tf, "resource \"aws_s3_bucket_server_side_encryption_configuration\"");
      contains(s3Tf, "sse_algorithm = \"AES256\"");
      contains(s3Tf, "bucket = aws_s3_bucket.terraform_state.id");
    });

    test("should have encryption rule with apply_server_side_encryption_by_default", () => {
      expect(s3Tf).toMatch(/rule\s*\{[\s\S]*?apply_server_side_encryption_by_default\s*\{[\s\S]*?sse_algorithm\s*=\s*"AES256"/);
    });

    test("should block public access", () => {
      contains(s3Tf, "resource \"aws_s3_bucket_public_access_block\"");
      contains(s3Tf, "block_public_acls       = true");
      contains(s3Tf, "block_public_policy     = true");
      contains(s3Tf, "bucket                  = aws_s3_bucket.terraform_state.id");
    });

    test("should have all public access block settings enabled", () => {
      contains(s3Tf, "ignore_public_acls      = true");
      contains(s3Tf, "restrict_public_buckets = true");
    });
  });

  describe("outputs.tf validation", () => {
    test("should expose all required outputs", () => {
      contains(outputsTf, "output \"vpc_id\" {");
      contains(outputsTf, "output \"public_subnet_id\" {");
      contains(outputsTf, "output \"ec2_instance_id\" {");
      contains(outputsTf, "output \"ec2_instance_public_ip\" {");
      contains(outputsTf, "output \"rds_endpoint\" {");
      contains(outputsTf, "output \"rds_password_secret_arn\" {");
      contains(outputsTf, "output \"s3_bucket_name\" {");
    });

    test("should have proper descriptions for outputs", () => {
      expect(outputsTf.match(/description\s+=\s+"/g)?.length).toBeGreaterThanOrEqual(6);
    });

    test("should have correct output values", () => {
      contains(outputsTf, "value       = aws_vpc.main.id");
      contains(outputsTf, "value       = aws_subnet.public.id");
      contains(outputsTf, "value       = aws_instance.web.id");
      contains(outputsTf, "value       = aws_instance.web.public_ip");
      contains(outputsTf, "value       = aws_db_instance.default.endpoint");
      contains(outputsTf, "value       = aws_secretsmanager_secret.db_credentials.arn");
      contains(outputsTf, "value       = aws_s3_bucket.terraform_state.bucket");
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

    test("should use secure password generation and variable references for sensitive data", () => {
      expect(tfAll).toMatch(/password\s*=\s*random_password\.db_password\.result/);
      expect(tfAll).toMatch(/username\s*=\s*var\.db_username/);
    });

    test("should have proper resource naming with suffix", () => {
      const suffixUsage = (tfAll.match(/\$\{var\.resource_suffix\}/g) || []).length;
      expect(suffixUsage).toBeGreaterThan(10);
    });

    test("should follow naming conventions", () => {
      // Check that resource names include suffix where appropriate
      expect(tfAll).toMatch(/name\s*=\s*"[^"]*-\$\{var\.resource_suffix\}/);
      expect(tfAll).toMatch(/bucket\s*=\s*"[^"]*-\$\{var\.resource_suffix\}/);
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

  describe("data sources validation", () => {
    test("should use aws_caller_identity data source for S3 bucket naming", () => {
      contains(s3Tf, "data \"aws_caller_identity\" \"current\" {}");
      contains(s3Tf, "data.aws_caller_identity.current.account_id");
    });

    test("should use aws_availability_zones data source for subnet placement", () => {
      contains(vpcTf, "data \"aws_availability_zones\" \"available\" {");
      contains(vpcTf, "state = \"available\"");
    });

    test("should use aws_ami data source for EC2 instance", () => {
      contains(ec2Tf, "data \"aws_ami\" \"amazon_linux_2\" {");
      contains(ec2Tf, "most_recent = true");
      contains(ec2Tf, "owners      = [\"amazon\"]");
    });
  });
});
