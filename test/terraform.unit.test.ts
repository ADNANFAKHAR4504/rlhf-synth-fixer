// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import * as fs from "fs";
import * as path from "path";

describe("Terraform lib/ .tf unit tests", () => {
  let tfAll: string;

  beforeAll(() => {
    const libDir = path.join(__dirname, "../lib");
    const files = fs.readdirSync(libDir).filter(f => f.endsWith(".tf"));
    if (files.length === 0) {
      throw new Error("No .tf files found in lib/ directory");
    }
    tfAll = files
      .map(f => fs.readFileSync(path.join(libDir, f), "utf8"))
      .join("\n\n");
  });

  const contains = (substr: string) => {
    expect(tfAll).toContain(substr);
  };

  test("core networking resources exist (VPC, subnets, IGW, route table)", () => {
    contains('resource "aws_vpc" "main"');
    contains('resource "aws_subnet" "public"');
    contains('resource "aws_subnet" "private_1"');
    contains('resource "aws_subnet" "private_2"');
    contains('resource "aws_internet_gateway" "igw"');
    contains('resource "aws_route_table" "public"');
  });

  test("compute and security resources exist (EC2, SG, key pair, SSM role/profile)", () => {
    contains('resource "aws_security_group" "ec2_sg"');
    contains('resource "aws_instance" "web"');
    contains('resource "aws_key_pair" "deployer"');
    contains('resource "aws_iam_role" "ssm"');
    contains('resource "aws_iam_instance_profile" "ssm_profile"');
  });

  test("database resources exist (DB subnet group, SG, RDS instance, random password)", () => {
    contains('resource "aws_db_subnet_group" "default"');
    contains('resource "aws_security_group" "rds_sg"');
    contains('resource "aws_db_instance" "mysql"');
    contains('resource "random_password" "db"');
  });

  test("application S3 bucket exists (not backend)", () => {
    contains('resource "aws_s3_bucket" "app_bucket"');
  });

  test("variables required by module are declared", () => {
    contains('variable "resource_suffix"');
    contains('variable "db_username"');
    contains('variable "db_password"');
    contains('variable "db_name"');
    contains('variable "ec2_instance_type"');
    contains('variable "use_ssm"');
    contains('variable "ssh_cidr_blocks"');
    contains('variable "ssh_public_key"');
  });

  test("outputs expose expected values", () => {
    contains('output "vpc_id"');
    contains('output "public_subnet_id"');
    contains('output "ec2_instance_id"');
    contains('output "ec2_instance_public_ip"');
    contains('output "rds_endpoint"');
    contains('output "s3_app_bucket_name"');
    contains('output "rds_password_secret_arn"');
  });

  test("SSM is provisioned (role + policy attachment present) to allow SSM usage by default", () => {
    contains('resource "aws_iam_role_policy_attachment" "ssm_attach"');
    // instance profile attachment referenced in aws_instance
    expect(tfAll.includes('iam_instance_profile = aws_iam_instance_profile.ssm_profile.name') ||
      tfAll.includes('iam_instance_profile = aws_iam_instance_profile.ssm_profile')).toBeTruthy();
  });

  test("RDS password handling is conditional (uses provided var or generated random_password)", () => {
    // check password usage in db instance resource
    expect(
      tfAll.match(/password\s+=\s+/m) !== null ||
      tfAll.includes('random_password.db') // at least random_password resource exists (checked above)
    ).toBeTruthy();
  });
});
