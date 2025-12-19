// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure in tap_stack.tf
// Validates structure, syntax, and required components without deployment

import fs from "fs";
import path from "path";

const STACK_FILE = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;

  beforeAll(() => {
    expect(fs.existsSync(STACK_FILE)).toBe(true);
    stackContent = fs.readFileSync(STACK_FILE, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(STACK_FILE)).toBe(true);
    });

    test("file is not empty", () => {
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("file contains valid HCL syntax markers", () => {
      expect(stackContent).toMatch(/resource\s+"/);
      expect(stackContent).toMatch(/variable\s+"/);
      expect(stackContent).toMatch(/output\s+"/);
    });
  });

  describe("Provider Configuration", () => {
    test("declares terraform block with required version", () => {
      expect(stackContent).toMatch(/terraform\s*{/);
      expect(stackContent).toMatch(/required_version\s*=/);
    });

    test("declares AWS provider", () => {
      expect(stackContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("hardcodes region to us-west-2", () => {
      expect(stackContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("specifies required_providers with AWS", () => {
      expect(stackContent).toMatch(/required_providers\s*{/);
      expect(stackContent).toMatch(/aws\s*=\s*{/);
      expect(stackContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });
  });

  describe("Variables", () => {
    const requiredVars = [
      "project",
      "environment",
      "owner",
      "allowed_ssh_cidr",
      "instance_type",
      "instance_count",
      "db_username",
      "db_password",
      "alert_email"
    ];

    requiredVars.forEach(varName => {
      test(`declares variable: ${varName}`, () => {
        const varPattern = new RegExp(`variable\\s+"${varName}"\\s*{`);
        expect(stackContent).toMatch(varPattern);
      });
    });

    test("db_password is marked as sensitive", () => {
      const dbPasswordBlock = stackContent.match(/variable\s+"db_password"\s*{[^}]*}/s);
      expect(dbPasswordBlock).toBeTruthy();
      expect(dbPasswordBlock![0]).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("VPC and Network Resources", () => {
    test("creates VPC with CIDR 10.0.0.0/16", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("creates 2 public subnets in us-west-2a and us-west-2b", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-west-2a"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-west-2b"/);
    });

    test("creates 2 private subnets with correct CIDRs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.101\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.102\.0\/24"/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates 2 NAT Gateways with EIPs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_2"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_2"/);
    });

    test("creates route tables for public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_2"/);
    });
  });

  describe("S3 and KMS Resources", () => {
    test("creates KMS key for S3 encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
    });

    test("creates S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
    });

    test("enables S3 versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures S3 encryption with KMS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("blocks all public S3 access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe("IAM Resources", () => {
    test("creates IAM role for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test("creates IAM policy with S3 and CloudWatch permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"ec2"/);
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("creates IAM instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test("attaches policy to role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2"/);
    });
  });

  describe("Security Groups", () => {
    test("creates EC2 security group with SSH ingress", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/to_port\s*=\s*22/);
    });

    test("creates RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(stackContent).toMatch(/from_port\s*=\s*5432/);
      expect(stackContent).toMatch(/to_port\s*=\s*5432/);
    });
  });

  describe("EC2 Resources", () => {
    test("creates EC2 instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.instance_count/);
    });

    test("EC2 instances use private subnets", () => {
      const ec2Block = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[^}]*subnet_id[^}]*}/s);
      expect(ec2Block).toBeTruthy();
      expect(ec2Block![0]).toMatch(/private_/);
    });

    test("EC2 instances have user_data for CloudWatch agent", () => {
      expect(stackContent).toMatch(/user_data\s*=/);
      expect(stackContent).toMatch(/amazon-cloudwatch-agent/i);
    });
  });

  describe("RDS Resources", () => {
    test("creates RDS subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("creates RDS PostgreSQL instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/engine\s*=\s*"postgres"/);
    });

    test("RDS is not publicly accessible", () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS has multi-AZ enabled", () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("RDS has backup retention configured", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
    });
  });

  describe("CloudWatch and SNS Resources", () => {
    test("creates SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test("creates SNS email subscription", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
    });

    test("creates CloudWatch CPU alarms for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(stackContent).toMatch(/threshold\s*=\s*70/);
      expect(stackContent).toMatch(/evaluation_periods\s*=\s*2/);
    });
  });

  describe("Outputs", () => {
    const requiredOutputs = [
      "vpc_id",
      "public_subnet_ids",
      "private_subnet_ids",
      "s3_bucket_name",
      "rds_endpoint",
      "ec2_instance_ids"
    ];

    requiredOutputs.forEach(outputName => {
      test(`declares output: ${outputName}`, () => {
        const outputPattern = new RegExp(`output\\s+"${outputName}"\\s*{`);
        expect(stackContent).toMatch(outputPattern);
      });
    });
  });

  describe("Tagging", () => {
    test("defines common_tags local", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/common_tags\s*=/);
    });

    test("common_tags includes Project, Environment, and Owner", () => {
      const localsBlock = stackContent.match(/locals\s*{[\s\S]*?common_tags\s*=\s*{[\s\S]*?}/);
      expect(localsBlock).toBeTruthy();
      expect(localsBlock![0]).toMatch(/Project/);
      expect(localsBlock![0]).toMatch(/Environment/);
      expect(localsBlock![0]).toMatch(/Owner/);
    });
  });

  describe("Data Sources", () => {
    test("uses data source for AWS account ID", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses data source for Amazon Linux 2 AMI", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
    });
  });
});
