import fs from "fs";
import path from "path";

let tfContent: string;

beforeAll(() => {
  const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
  tfContent = fs.readFileSync(tfPath, "utf8");
});

describe("tap_stack.tf comprehensive verification", () => {

  // ===================== VARIABLES =====================
  test("should declare all required variables", () => {
    const variables = ["region", "environment", "project_name"];
    variables.forEach(variable => {
      expect(tfContent).toMatch(new RegExp(`variable "${variable}"`));
    });
  });

  // ===================== LOCALS =====================
  test("should define locals for naming and tagging", () => {
    expect(tfContent).toMatch(/locals \{/);
    expect(tfContent).toMatch(/project_name_tag/);
    expect(tfContent).toMatch(/environment_tag/);
  });

  // ===================== VPC =====================
  test("should define VPC resource", () => {
    expect(tfContent).toMatch(/resource "aws_vpc"/);
    expect(tfContent).toMatch(/cidr_block/);
    expect(tfContent).toMatch(/enable_dns_support/);
    expect(tfContent).toMatch(/enable_dns_hostnames/);
  });

  // ===================== SUBNETS =====================
  test("should define public and private subnets", () => {
    expect(tfContent).toMatch(/resource "aws_subnet"/g);
    expect(tfContent).toMatch(/map_public_ip_on_launch/);
    expect(tfContent).toMatch(/availability_zone/);
  });

  // ===================== INTERNET GATEWAY =====================
  test("should define an Internet Gateway", () => {
    expect(tfContent).toMatch(/resource "aws_internet_gateway"/);
  });

  // ===================== NAT GATEWAY =====================
  test("should define a NAT Gateway for private subnets", () => {
    expect(tfContent).toMatch(/resource "aws_nat_gateway"/);
    expect(tfContent).toMatch(/allocation_id/);
    expect(tfContent).toMatch(/subnet_id/);
  });

  // ===================== ROUTE TABLES =====================
  test("should define public and private route tables", () => {
    expect(tfContent).toMatch(/resource "aws_route_table"/g);
    expect(tfContent).toMatch(/route \{/);
    expect(tfContent).toMatch(/vpc_id/);
  });

  // ===================== SECURITY GROUPS =====================
  test("should define security groups", () => {
    expect(tfContent).toMatch(/resource "aws_security_group"/g);
    expect(tfContent).toMatch(/ingress \{/);
    expect(tfContent).toMatch(/egress \{/);
  });

  // ===================== EC2 INSTANCE =====================
  test("should define EC2 instance", () => {
    expect(tfContent).toMatch(/resource "aws_instance"/);
    expect(tfContent).toMatch(/ami\s*=/);
    expect(tfContent).toMatch(/instance_type\s*=/);
    expect(tfContent).toMatch(/subnet_id/);
    expect(tfContent).toMatch(/vpc_security_group_ids/);
  });

  // ===================== RDS INSTANCE =====================
  test("should define RDS instance", () => {
    expect(tfContent).toMatch(/resource "aws_db_instance"/);
    expect(tfContent).toMatch(/engine\s*=/);
    expect(tfContent).toMatch(/instance_class\s*=/);
    expect(tfContent).toMatch(/allocated_storage\s*=/);
    expect(tfContent).toMatch(/username\s*=/);
    expect(tfContent).toMatch(/password\s*=/);
    expect(tfContent).toMatch(/skip_final_snapshot/);
  });

  // ===================== S3 BUCKET =====================
  test("should define S3 bucket with logging and public access blocked", () => {
    expect(tfContent).toMatch(/resource "aws_s3_bucket"/);
    expect(tfContent).toMatch(/acl\s*=/);
    expect(tfContent).toMatch(/logging/);
    expect(tfContent).toMatch(/block_public_acls/);
    expect(tfContent).toMatch(/block_public_policy/);
  });

  // ===================== IAM ROLE =====================
  test("should define IAM role for EC2 with S3 access", () => {
    expect(tfContent).toMatch(/resource "aws_iam_role"/);
    expect(tfContent).toMatch(/assume_role_policy/);
    expect(tfContent).toMatch(/aws_iam_policy_attachment/);
  });

  // ===================== OUTPUTS =====================
  test("should define outputs for EC2 and RDS", () => {
    expect(tfContent).toMatch(/output "ec2_dns"/);
    expect(tfContent).toMatch(/output "rds_endpoint"/);
  });

});
