import fs from "fs";
import path from "path";

describe("tap_stack Terraform Unit Tests (Canonical Names)", () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
    tfContent = fs.readFileSync(tfPath, "utf8");
  });

  function countMatches(regex: RegExp) {
    const matches = tfContent.match(regex);
    return matches ? matches.length : 0;
  }

  // Variables & Locals
  describe("Variables & Locals", () => {
    test("contains key variables", () => {
      [
        "primaryregion", "secondaryregion", "thirdregion",
        "environment", "instancetype", "rdsinstanceclass",
        "minsize", "maxsize", "desiredcapacity"
      ].forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });

    test("has required locals", () => {
      [
        "randomsuffix", "commontags", "vpcnameprimary", "vpcnamesecondary",
        "vpcnamethird", "vpccidrprimary", "vpccidrsecondary", "vpccidrthird",
        "azsprimary", "azssecondary", "azsthird"
      ].forEach(local => expect(tfContent).toContain(local));
    });
  });

  // Random and Password Resources
  describe("Random & Secrets", () => {
    test("includes random and password resources for RDS", () => {
      [
        'resource "random_string" "rdsusernameprimary"',
        'resource "random_string" "rdsusernamesecondary"',
        'resource "random_string" "rdsusernamethird"',
        'resource "random_password" "rdspasswordprimary"',
        'resource "random_password" "rdspasswordsecondary"',
        'resource "random_password" "rdspasswordthird"',
        'resource "random_string" "suffix"'
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Data Sources
  describe("Data Sources", () => {
    test("contains AMI data sources for all regions", () => {
      [
        'data "aws_ami" "amazonlinux2primary"',
        'data "aws_ami" "amazonlinux2secondary"',
        'data "aws_ami" "amazonlinux2third"',
      ].forEach(d => expect(tfContent).toContain(d));
    });
  });

  // Primary Region Networking
  describe("Primary Region Networking", () => {
    test("core VPC, IGW, subnet, NAT, route table resources", () => {
      [
        'resource "aws_vpc" "primary"',
        'resource "aws_internet_gateway" "primary"',
        'resource "aws_subnet" "primarypublic"',
        'resource "aws_subnet" "primaryprivate"',
        'resource "aws_eip" "primarynat"',
        'resource "aws_nat_gateway" "primary"',
        'resource "aws_route_table" "primarypublic"',
        'resource "aws_route_table" "primaryprivate"',
        'resource "aws_route_table_association" "primarypublic"',
        'resource "aws_route_table_association" "primaryprivate"'
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Security Groups
  describe("Primary Security Groups", () => {
    test("ALB, EC2, RDS security groups", () => {
      [
        'resource "aws_security_group" "primaryalb"',
        'resource "aws_security_group" "primaryec2"',
        'resource "aws_security_group" "primaryrds"'
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // IAM
  describe("IAM", () => {
    test("EC2 role, IAM attachments, instance profile", () => {
      [
        'resource "aws_iam_role" "ec2roleprimary"',
        'resource "aws_iam_role_policy_attachment" "ec2ssmprimary"',
        'resource "aws_iam_role_policy_attachment" "ec2cloudwatchprimary"',
        'resource "aws_iam_instance_profile" "ec2profileprimary"'
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Launch Templates & Auto Scaling
  describe("Compute and Scaling Primary", () => {
    test("launch template and ASG", () => {
      [
        'resource "aws_launch_template" "primary"',
        'resource "aws_autoscaling_group" "primary"',
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Load Balancer and Listener
  describe("ALB and Listeners Primary", () => {
    test("ALB, target group, listener", () => {
      [
        'resource "aws_lb" "primary"',
        'resource "aws_lb_target_group" "primary"',
        'resource "aws_lb_listener" "primary"',
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // RDS & DB Subnet Group
  describe("Primary RDS Resources", () => {
    test("DB subnet group, instance, secrets", () => {
      [
        'resource "aws_db_subnet_group" "primary"',
        'resource "aws_db_instance" "primary"',
        'resource "aws_secretsmanager_secret" "rdsprimary"',
        'resource "aws_secretsmanager_secret_version" "rdsprimary"'
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // S3 (logging bucket)
  describe("S3 Primary", () => {
    test("logging bucket, versioning, encryption, pab", () => {
      [
        'resource "aws_s3_bucket" "logsprimary"',
        'resource "aws_s3_bucket_versioning" "logsprimary"',
        'resource "aws_s3_bucket_server_side_encryption_configuration" "logsprimary"',
        'resource "aws_s3_bucket_public_access_block" "logsprimary"'
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // CloudWatch Log Group
  describe("CloudWatch Primary", () => {
    test("primary log group exists", () => {
      expect(tfContent).toContain('resource "aws_cloudwatch_log_group" "primary"');
    });
  });

  // Secondary & Third Region Resource Types
  describe("Secondary & Third Region Resource Types", () => {
    test("VPC, IGW, and DB resources for secondary/third", () => {
      [
        'resource "aws_vpc" "secondary"',
        'resource "aws_internet_gateway" "secondary"',
        'resource "aws_security_group" "secondaryalb"',
        'resource "aws_db_instance" "secondary"',
        'resource "aws_vpc" "third"',
        'resource "aws_internet_gateway" "third"',
        'resource "aws_db_instance" "third"',
      ].forEach(r => expect(tfContent).toContain(r));
    });
  });

  // Outputs for spot check
  describe("Outputs", () => {
    test("has sample global and third region outputs", () => {
      [
        'output "randomsuffix"',
        'output "environmenttag"',
        'output "thirdvpcid"',
        'output "thirdpublicsubnetids"',
        'output "thirdalbdnsname"',
      ].forEach(o =>
        expect(tfContent).toMatch(new RegExp(o))
      );
    });
  });
});

