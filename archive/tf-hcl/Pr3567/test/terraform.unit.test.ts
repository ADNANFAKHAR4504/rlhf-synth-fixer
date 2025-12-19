import { readFileSync } from "fs";
import path from "path";

const tfFile = path.join(__dirname, "../lib/tap_stack.tf");
const tfConfig = readFileSync(tfFile, "utf8");

describe("tap_stack.tf static verification", () => {
  // ---------------- VARIABLES & LOCALS ----------------
  it("declares required variables", () => {
    expect(tfConfig).toMatch(/variable "primary_region"/);
    expect(tfConfig).toMatch(/variable "secondary_region"/);
    expect(tfConfig).toMatch(/variable "environment"/);
    expect(tfConfig).toMatch(/variable "project_name"/);
    expect(tfConfig).toMatch(/variable "db_instance_class"/);
    expect(tfConfig).toMatch(/variable "ec2_instance_type"/);
  });

  it("defines common locals for naming and tagging", () => {
    expect(tfConfig).toMatch(/locals {/);
    expect(tfConfig).toMatch(/common_tags/);
    expect(tfConfig).toMatch(/primary_prefix/);
    expect(tfConfig).toMatch(/secondary_prefix/);
    expect(tfConfig).toMatch(/primary_vpc_cidr/);
    expect(tfConfig).toMatch(/secondary_vpc_cidr/);
  });

  // ---------------- DATA SOURCES ----------------
  it("uses AWS AMI data sources for both regions", () => {
    expect(tfConfig).toMatch(/data "aws_ami" "amazon_linux_2_primary"/);
    expect(tfConfig).toMatch(/data "aws_ami" "amazon_linux_2_secondary"/);
  });

  it("fetches availability zones in both regions", () => {
    expect(tfConfig).toMatch(/data "aws_availability_zones" "primary"/);
    expect(tfConfig).toMatch(/data "aws_availability_zones" "secondary"/);
  });

  // ---------------- VPC & NETWORKING ----------------
  it("defines VPCs in both regions", () => {
    expect(tfConfig).toMatch(/resource "aws_vpc" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_vpc" "secondary"/);
  });

  it("creates subnets, IGWs, NAT gateways and route tables", () => {
    expect(tfConfig).toMatch(/aws_subnet.primary_public/);
    expect(tfConfig).toMatch(/aws_subnet.primary_private/);
    expect(tfConfig).toMatch(/aws_internet_gateway.primary/);
    expect(tfConfig).toMatch(/aws_nat_gateway.primary/);
    expect(tfConfig).toMatch(/aws_route_table.primary_public/);
    expect(tfConfig).toMatch(/aws_route_table.primary_private/);

    expect(tfConfig).toMatch(/aws_subnet.secondary_public/);
    expect(tfConfig).toMatch(/aws_subnet.secondary_private/);
    expect(tfConfig).toMatch(/aws_internet_gateway.secondary/);
    expect(tfConfig).toMatch(/aws_nat_gateway.secondary/);
    expect(tfConfig).toMatch(/aws_route_table.secondary_public/);
    expect(tfConfig).toMatch(/aws_route_table.secondary_private/);
  });

  // ---------------- SECURITY GROUPS ----------------
  it("creates ALB, EC2 and RDS security groups with rules in both regions", () => {
    expect(tfConfig).toMatch(/aws_security_group.primary_alb/);
    expect(tfConfig).toMatch(/aws_security_group.primary_ec2/);
    expect(tfConfig).toMatch(/aws_security_group.primary_rds/);

    expect(tfConfig).toMatch(/aws_security_group.secondary_alb/);
    expect(tfConfig).toMatch(/aws_security_group.secondary_ec2/);
    expect(tfConfig).toMatch(/aws_security_group.secondary_rds/);
  });

  it("enforces security group ingress hierarchy", () => {
    // ALB opens 80/443 to world
    expect(tfConfig).toMatch(/ingress {[^}]*from_port *= 80[^}]*cidr_blocks/);
    expect(tfConfig).toMatch(/ingress {[^}]*from_port *= 443[^}]*cidr_blocks/);

    // EC2 allows 80/443 only from ALB SG
    expect(tfConfig).toMatch(/security_groups = \[aws_security_group\.primary_alb\.id\]/);

    // RDS allows 3306 only from EC2 SG
    expect(tfConfig).toMatch(/security_groups = \[aws_security_group\.primary_ec2\.id\]/);
  });

  // ---------------- RDS & SECRETS ----------------
  it("defines RDS instances in both regions", () => {
    expect(tfConfig).toMatch(/resource "aws_db_instance" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_db_instance" "secondary"/);
    expect(tfConfig).toMatch(/engine *= "mysql"/);
    expect(tfConfig).toMatch(/multi_az *= true/);
    expect(tfConfig).toMatch(/storage_encrypted *= true/);
  });

  it("grants EC2 instances S3 and SecretsManager access", () => {
    expect(tfConfig).toMatch(/"s3:GetObject"/);
    expect(tfConfig).toMatch(/"s3:PutObject"/);
    expect(tfConfig).toMatch(/"s3:ListBucket"/);
    expect(tfConfig).toMatch(/"secretsmanager:GetSecretValue"/);
  });

  // ---------------- ALB ----------------
  it("defines ALBs, listeners, and target groups", () => {
    expect(tfConfig).toMatch(/resource "aws_lb" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_lb_target_group" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_lb_listener" "primary"/);

    expect(tfConfig).toMatch(/resource "aws_lb" "secondary"/);
    expect(tfConfig).toMatch(/resource "aws_lb_target_group" "secondary"/);
    expect(tfConfig).toMatch(/resource "aws_lb_listener" "secondary"/);
  });

  // ---------------- LAUNCH TEMPLATES + ASG ----------------
  it("defines launch templates and auto scaling groups", () => {
    expect(tfConfig).toMatch(/aws_launch_template.primary/);
    expect(tfConfig).toMatch(/aws_autoscaling_group.primary/);
    expect(tfConfig).toMatch(/aws_launch_template.secondary/);
    expect(tfConfig).toMatch(/aws_autoscaling_group.secondary/);
  });

  it("ensures ASGs use at least 2 instances and attach to ALB target groups", () => {
    expect(tfConfig).toMatch(/min_size *= 2/);
    expect(tfConfig).toMatch(/desired_capacity *= 2/);
    expect(tfConfig).toMatch(/target_group_arns/);
  });

  // ---------------- OUTPUTS ----------------
  it("defines outputs for key primary region resources", () => {
    expect(tfConfig).toMatch(/output "primary_vpc_id"/);
    expect(tfConfig).toMatch(/output "primary_rds_endpoint"/);
    expect(tfConfig).toMatch(/output "primary_public_subnet_ids"/);
    expect(tfConfig).toMatch(/output "primary_private_subnet_ids"/);
  });
});
