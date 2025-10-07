import { readFileSync } from "fs";
import path from "path";

const tfFile = path.join(__dirname, "../lib/tap_stack.tf");
const tfConfig = readFileSync(tfFile, "utf8");

describe("tap_stack.tf static verification", () => {

  // ---------------------------------------------------
  // VARIABLES & LOCALS
  // ---------------------------------------------------
  it("declares all required variables", () => {
    expect(tfConfig).toMatch(/variable "primary_region"/);
    expect(tfConfig).toMatch(/variable "secondary_region"/);
    expect(tfConfig).toMatch(/variable "domain_name"/);
    expect(tfConfig).toMatch(/variable "environment"/);
  });

  it("defines locals for naming and tagging", () => {
    expect(tfConfig).toMatch(/locals {/);
    expect(tfConfig).toMatch(/resource_suffix/);
    expect(tfConfig).toMatch(/primary_vpc_name/);
    expect(tfConfig).toMatch(/secondary_vpc_name/);
    expect(tfConfig).toMatch(/common_tags/);
  });

  // ---------------------------------------------------
  // DATA SOURCES
  // ---------------------------------------------------
  it("uses AMI and AZ data sources for both regions", () => {
    expect(tfConfig).toMatch(/data "aws_availability_zones" "primary_azs"/);
    expect(tfConfig).toMatch(/data "aws_availability_zones" "secondary_azs"/);
    expect(tfConfig).toMatch(/data "aws_ami" "primary_amazon_linux"/);
    expect(tfConfig).toMatch(/data "aws_ami" "secondary_amazon_linux"/);
  });

  // ---------------------------------------------------
  // RANDOM & SECRETS
  // ---------------------------------------------------
  it("defines random string and password resources for uniqueness and credentials", () => {
    expect(tfConfig).toMatch(/resource "random_string" "suffix"/);
    expect(tfConfig).toMatch(/resource "random_string" "rds_username_primary"/);
    expect(tfConfig).toMatch(/resource "random_password" "rds_password_primary"/);
    expect(tfConfig).toMatch(/resource "random_string" "rds_username_secondary"/);
  });

  // ---------------------------------------------------
  // NETWORKING (VPC, SUBNETS, IGW, NAT, ROUTE)
  // ---------------------------------------------------
  it("creates primary and secondary VPCs", () => {
    expect(tfConfig).toMatch(/resource "aws_vpc" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_vpc" "secondary"/);
  });

  it("defines subnets, internet gateways, and route tables", () => {
    expect(tfConfig).toMatch(/resource "aws_subnet" "primary_public"/);
    expect(tfConfig).toMatch(/resource "aws_subnet" "primary_private"/);
    expect(tfConfig).toMatch(/resource "aws_internet_gateway" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_route_table" "primary_public"/);
    expect(tfConfig).toMatch(/resource "aws_nat_gateway" "primary"/);

    expect(tfConfig).toMatch(/resource "aws_subnet" "secondary_public"/);
    expect(tfConfig).toMatch(/resource "aws_subnet" "secondary_private"/);
    expect(tfConfig).toMatch(/resource "aws_internet_gateway" "secondary"/);
    expect(tfConfig).toMatch(/resource "aws_route_table" "secondary_public"/);
    expect(tfConfig).toMatch(/resource "aws_nat_gateway" "secondary"/);
  });

  // ---------------------------------------------------
  // SECURITY GROUPS
  // ---------------------------------------------------
  it("defines ALB, EC2, and RDS security groups", () => {
    expect(tfConfig).toMatch(/resource "aws_security_group" "primary_alb"/);
    expect(tfConfig).toMatch(/resource "aws_security_group" "primary_ec2"/);
    expect(tfConfig).toMatch(/resource "aws_security_group" "primary_rds"/);

    expect(tfConfig).toMatch(/resource "aws_security_group" "secondary_alb"/);
    expect(tfConfig).toMatch(/resource "aws_security_group" "secondary_ec2"/);
    expect(tfConfig).toMatch(/resource "aws_security_group" "secondary_rds"/);
  });

  it("ensures security rules follow least privilege", () => {
    // ALB ingress 80/443 open
    expect(tfConfig).toMatch(/from_port *= 80/);
    expect(tfConfig).toMatch(/from_port *= 443/);
    // EC2 only from ALB SG
    expect(tfConfig).toMatch(/security_groups.*primary_alb/);
    // RDS only from EC2 SG
    expect(tfConfig).toMatch(/security_groups.*primary_ec2/);
  });

  // ---------------------------------------------------
  // RDS CONFIGURATION
  // ---------------------------------------------------
  it("defines encrypted, multi-AZ MySQL RDS instances", () => {
    expect(tfConfig).toMatch(/resource "aws_db_instance" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_db_instance" "secondary"/);
    expect(tfConfig).toMatch(/engine *= "mysql"/);
    expect(tfConfig).toMatch(/storage_encrypted *= true/);
    expect(tfConfig).toMatch(/multi_az *= true/);
  });

  // ---------------------------------------------------
  // IAM ROLES & POLICIES
  // ---------------------------------------------------
  it("defines IAM roles and policies for EC2 and RDS access", () => {
    expect(tfConfig).toMatch(/resource "aws_iam_role" "ec2_role"/);
    expect(tfConfig).toMatch(/resource "aws_iam_instance_profile" "ec2_profile"/);
    expect(tfConfig).toMatch(/resource "aws_iam_policy" "ec2_policy"/);
    expect(tfConfig).toMatch(/"s3:GetObject"/);
    expect(tfConfig).toMatch(/"s3:PutObject"/);
    expect(tfConfig).toMatch(/"secretsmanager:GetSecretValue"/);
  });

  // ---------------------------------------------------
  // COMPUTE (EC2 / AUTOSCALING)
  // ---------------------------------------------------
  it("defines EC2 instances or launch templates", () => {
    expect(tfConfig).toMatch(/resource "aws_launch_template" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_launch_template" "secondary"/);
    expect(tfConfig).toMatch(/resource "aws_autoscaling_group" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_autoscaling_group" "secondary"/);
  });

  it("ensures ASG minimum and desired capacity is set", () => {
    expect(tfConfig).toMatch(/min_size *= 2/);
    expect(tfConfig).toMatch(/desired_capacity *= 2/);
  });

  // ---------------------------------------------------
  // LOAD BALANCER
  // ---------------------------------------------------
  it("defines ALBs, target groups, and listeners", () => {
    expect(tfConfig).toMatch(/resource "aws_lb" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_lb_target_group" "primary"/);
    expect(tfConfig).toMatch(/resource "aws_lb_listener" "primary"/);

    expect(tfConfig).toMatch(/resource "aws_lb" "secondary"/);
    expect(tfConfig).toMatch(/resource "aws_lb_target_group" "secondary"/);
    expect(tfConfig).toMatch(/resource "aws_lb_listener" "secondary"/);
  });

  // ---------------------------------------------------
  // S3 BUCKETS & LOGGING
  // ---------------------------------------------------
  it("creates S3 buckets with logging and block public access", () => {
    expect(tfConfig).toMatch(/resource "aws_s3_bucket" "logs"/);
    expect(tfConfig).toMatch(/block_public_acls *= true/);
    expect(tfConfig).toMatch(/block_public_policy *= true/);
  });

  // ---------------------------------------------------
  // ROUTE 53 / DNS
  // ---------------------------------------------------
  it("includes Route 53 records or hosted zone for the domain", () => {
    expect(tfConfig).toMatch(/resource "aws_route53_zone"/);
    expect(tfConfig).toMatch(/resource "aws_route53_record"/);
    expect(tfConfig).toMatch(/var.domain_name/);
  });

  // ---------------------------------------------------
  // OUTPUTS
  // ---------------------------------------------------
  it("exposes important outputs for primary region", () => {
    expect(tfConfig).toMatch(/output "primary_vpc_id"/);
    expect(tfConfig).toMatch(/output "primary_rds_endpoint"/);
    expect(tfConfig).toMatch(/output "primary_alb_dns"/);
  });

  it("exposes important outputs for secondary region", () => {
    expect(tfConfig).toMatch(/output "secondary_vpc_id"/);
    expect(tfConfig).toMatch(/output "secondary_rds_endpoint"/);
    expect(tfConfig).toMatch(/output "secondary_alb_dns"/);
  });

});

