import fs from "fs";
import path from "path";

describe("tap_stack Terraform Unit Tests (Exact Names from tap_stack.tf)", () => {
  let tfContent: string;
  let normalizedTfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
    tfContent = fs.readFileSync(tfPath, "utf8");
    normalizedTfContent = tfContent.replace(/\s+/g, "");
  });

  function normalize(str: string): string {
    return str.replace(/\s+/g, "");
  }

  function expectContainsNormalized(testStr: string) {
    const normStr = normalize(testStr);
    if (!normalizedTfContent.includes(normStr)) {
      console.error(`Missing expected block: ${testStr}`);
    }
    expect(normalizedTfContent).toContain(normStr);
  }

  // Variables & Locals with exact names
  describe("Variables & Locals", () => {
    test("contains exact variables", () => {
      [
        'variable "primary_region"',
        'variable "secondary_region"',
        'variable "third_region"',
        'variable "environment"',
        'variable "instance_type"',
        'variable "rds_instance_class"',
        'variable "min_size"',
        'variable "max_size"',
        'variable "desired_capacity"',
      ].forEach(expectContainsNormalized);
    });

    test("defines exact locals keys", () => {
      [
        "random_suffix",
        "common_tags",
        "vpc_name_primary",
        "vpc_name_secondary",
        "vpc_name_third",
        "vpc_cidr_primary",
        "vpc_cidr_secondary",
        "vpc_cidr_third",
        "azs_primary",
        "azs_secondary",
        "azs_third",
      ].forEach(local => {
        if (!tfContent.includes(local)) {
          console.error(`Missing local: ${local}`);
        }
        expect(tfContent).toContain(local);
      });
    });
  });

  // Random & Secrets with exact names
  describe("Random & Secrets", () => {
    test("random strings and passwords for RDS users and suffix", () => {
      [
        'resource "random_string" "rds_username_primary"',
        'resource "random_string" "rds_username_secondary"',
        'resource "random_string" "rds_username_third"',
        'resource "random_password" "rds_password_primary"',
        'resource "random_password" "rds_password_secondary"',
        'resource "random_password" "rds_password_third"',
        'resource "random_string" "suffix"',
      ].forEach(expectContainsNormalized);
    });
  });

  // Data Sources with exact names
  describe("Data Sources", () => {
    test("AMI data sources for all regions", () => {
      [
        'data "aws_ami" "amazonlinux2_primary"',
        'data "aws_ami" "amazonlinux2_secondary"',
        'data "aws_ami" "amazonlinux2_third"',
      ].forEach(expectContainsNormalized);
    });
  });

  // Primary Region Networking
  describe("Primary Region Networking", () => {
    test("VPC and related resources", () => {
      [
        'resource "aws_vpc" "primary"',
        'resource "aws_internet_gateway" "primary"',
        'resource "aws_subnet" "primary_public"',
        'resource "aws_subnet" "primary_private"',
        'resource "aws_eip" "primary_nat"',
        'resource "aws_nat_gateway" "primary"',
        'resource "aws_route_table" "primary_public"',
        'resource "aws_route_table" "primary_private"',
        'resource "aws_route_table_association" "primary_public"',
        'resource "aws_route_table_association" "primary_private"',
      ].forEach(expectContainsNormalized);
    });
  });

  // Security Groups
  describe("Primary Security Groups", () => {
    test("defines primary ALB, EC2 and RDS security groups", () => {
      [
        'resource "aws_security_group" "primary_alb"',
        'resource "aws_security_group" "primary_ec2"',
        'resource "aws_security_group" "primary_rds"',
      ].forEach(expectContainsNormalized);
    });
  });

  // IAM Roles & Policies
  describe("IAM Roles & Policies", () => {
    test("defines EC2 IAM roles, instance profile and policies", () => {
      [
        'resource "aws_iam_role" "ec2_role_primary"',
        'resource "aws_iam_role_policy_attachment" "ec2_ssm_attachment_primary"',
        'resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_attachment_primary"',
        'resource "aws_iam_instance_profile" "ec2_profile_primary"',
      ].forEach(expectContainsNormalized);
    });
  });

  // Launch Templates & Auto Scaling Groups
  describe("Compute and Autoscaling", () => {
    test("launch template and autoscaling group for primary", () => {
      [
        'resource "aws_launch_template" "primary"',
        'resource "aws_autoscaling_group" "primary"',
      ].forEach(expectContainsNormalized);
    });
  });

  // ALB and Listeners
  describe("Load Balancer and Listeners", () => {
    test("primary ALB, target group, and listener", () => {
      [
        'resource "aws_lb" "primary"',
        'resource "aws_lb_target_group" "primary"',
        'resource "aws_lb_listener" "primary"',
      ].forEach(expectContainsNormalized);
    });
  });

  // RDS & DB Subnet Group
  describe("Primary RDS and Secrets", () => {
    test("DB subnet group, RDS instance and secrets", () => {
      [
        'resource "aws_db_subnet_group" "primary"',
        'resource "aws_db_instance" "primary"',
        'resource "aws_secretsmanager_secret" "rds_primary"',
        'resource "aws_secretsmanager_secret_version" "rds_primary"',
      ].forEach(expectContainsNormalized);
    });
  });

  // S3 buckets
  describe("S3 buckets for logging and config", () => {
    test("S3 bucket with versioning, encryption and access block", () => {
      [
        'resource "aws_s3_bucket" "logs_primary"',
        'resource "aws_s3_bucket_versioning" "logs_primary"',
        'resource "aws_s3_bucket_server_side_encryption_configuration" "logs_primary"',
        'resource "aws_s3_bucket_public_access_block" "logs_primary"',
      ].forEach(expectContainsNormalized);
    });
  });

  // CloudWatch Logs
  describe("CloudWatch log group", () => {
    test("primary cloudwatch log group", () => {
      expectContainsNormalized('resource "aws_cloudwatch_log_group" "primary"');
    });
  });

  // Secondary & Third Region Resources
  describe("Secondary and Third region core resources", () => {
    test("VPC, IGW, security groups and RDS instances", () => {
      [
        'resource "aws_vpc" "secondary"',
        'resource "aws_internet_gateway" "secondary"',
        'resource "aws_security_group" "secondary_alb"',
        'resource "aws_db_instance" "secondary"',
        'resource "aws_vpc" "third"',
        'resource "aws_internet_gateway" "third"',
        'resource "aws_db_instance" "third"',
      ].forEach(expectContainsNormalized);
    });
  });

  // Outputs
  describe("Important Terraform outputs", () => {
    test("check presence of key outputs", () => {
      [
        'output "random_suffix"',
        'output "environment"',
        'output "third_vpc_id"',
        'output "third_public_subnet_ids"',
        'output "third_alb_dns_name"',
      ].forEach(expectContainsNormalized);
    });
  });
});
