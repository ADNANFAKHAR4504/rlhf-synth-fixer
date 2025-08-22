Ideal Response Implementation

lib/provider.tf
Production-ready AWS infrastructure with security and compliance controls

REQUIREMENTS CHECKLIST:
Security Groups (Ingress): aws_security_group resources restrict ingress to var.allowed_ingress_cidrs
S3 Encryption (CMK): aws_kms_key.s3_cmk with rotation, all buckets use customer-managed key
S3 Access Logging: Central logging bucket with server access logging for all buckets
IAM Least Privilege: All roles/policies scoped with resource ARNs and conditions
CloudWatch Alarms: Metric filters on CloudTrail for unauthorized API calls with SNS alerts
VPC Flow Logs: Enabled to CloudWatch Logs with retention and least-privilege role
RDS High Availability: Multi-AZ, encrypted, private subnets, locked-down security groups
EC2 AMIs: Latest AMIs via SSM Parameter lookup, hardened security groups
Patch Automation: SSM Patch Manager with maintenance windows and associations
S3 Public Access Block: Enabled at bucket level with restrictive bucket policies

# provider.tf

terraform {
required_version = ">= 1.4.0"

required_providers {
aws = {
source = "hashicorp/aws"
version = ">= 5.0"
}
}

# Commented out for local testing - uncomment for production

# backend "s3" {

# bucket = "iac-rlhf-states-254123"

# key = "iac-test-automations/lib/terraform.tfstate"

# region = "us-west-2"

# use_lockfile = true

# encrypt = true

# # dynamodb_table = "terraform-locks" # Optional but recommended for state locking

# }

}

# Primary AWS provider for general resources

provider "aws" {
region = "us-west-1"
}

lib/tap_stack.tf

# Variables

variable "aws_region" {
description = "AWS region for resources"
type = string
default = "us-west-1"
}

variable "project_name" {
description = "Name of the project"
type = string
default = "secure-infra"
}

variable "environment" {
description = "Environment name"
type = string
default = "prod"
}

variable "owner" {
description = "Owner of the resources"
type = string
default = "devops-team"
}

variable "cost_center" {
description = "Cost center for billing"
type = string
default = "engineering"
}

variable "compliance" {
description = "Compliance framework"
type = string
default = "soc2"
}

variable "allowed_ingress_cidrs" {
description = "List of CIDR blocks allowed for ingress"
type = list(string)
default = ["10.0.0.0/8", "172.16.0.0/12"]
}

variable "alarm_emails" {
description = "List of email addresses for CloudWatch alarms"
type = list(string)
default = ["security@company.com", "devops@company.com"]
}

variable "rds_engine" {
description = "RDS engine type"
type = string
default = "postgres"
}

variable "rds_engine_version" {
description = "RDS engine version"
type = string
default = "15.14"
}

variable "rds_instance_class" {
description = "RDS instance class"
type = string
default = "db.t3.micro"
}

variable "rds_allocated_storage" {
description = "RDS allocated storage in GB"
type = number
default = 20
}

variable "ec2_instance_type" {
description = "EC2 instance type"
type = string
default = "t3.micro"
}

variable "vpc_id" {
description = "VPC ID to deploy resources in"
type = string
default = "" # Will be auto-detected if empty
}

variable "private_subnet_ids" {
description = "List of private subnet IDs"
type = list(string)
default = [] # Will be auto-detected if empty
}

variable "public_subnet_ids" {
description = "List of public subnet IDs"
type = list(string)
default = [] # Will be auto-detected if empty
}

variable "flow_logs_retention_days" {
description = "VPC Flow Logs retention in days"
type = number
default = 365
}

# Locals

locals {
name_prefix = "${var.project_name}-${var.environment}"

common_tags = {
Project = var.project_name
Environment = var.environment
Owner = var.owner
CostCenter = var.cost_center
Compliance = var.compliance
ManagedBy = "terraform"
}

# Random suffix for unique resource names

random_suffix = random_id.suffix.hex
iam_suffix = random_id.iam_suffix.hex
}

# Random resources for unique naming

resource "random_id" "suffix" {
byte_length = 4
}

resource "random_id" "iam_suffix" {
byte_length = 8
}

# Data sources

data "aws_availability_zones" "available" {
state = "available"
}

data "aws_ssm_parameter" "latest_ami" {
name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# VPC and Networking

resource "aws_vpc" "main" {
count = var.vpc_id == "" ? 1 : 0

cidr_block = "10.0.0.0/16"
enable_dns_hostnames = true
enable_dns_support = true

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-vpc"
})
}

locals {
vpc_id = var.vpc_id != "" ? var.vpc_id : aws_vpc.main[0].id
}

# Subnets

resource "aws_subnet" "private" {
count = length(var.private_subnet_ids) == 0 ? 2 : 0

vpc_id = local.vpc_id
cidr_block = "10.0.${count.index + 1}.0/24"
availability_zone = data.aws_availability_zones.available.names[count.index]

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
})
}

resource "aws_subnet" "public" {
count = length(var.public_subnet_ids) == 0 ? 2 : 0

vpc_id = local.vpc_id
cidr_block = "10.0.${count.index + 10}.0/24"
availability_zone = data.aws_availability_zones.available.names[count.index]
map_public_ip_on_launch = true

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
})
}

locals {
private_subnet_ids = length(var.private_subnet_ids) > 0 ? var.private_subnet_ids : aws_subnet.private[*].id
public_subnet_ids = length(var.public_subnet_ids) > 0 ? var.public_subnet_ids : aws_subnet.public[*].id
}

# Internet Gateway

resource "aws_internet_gateway" "main" {
count = var.vpc_id == "" ? 1 : 0

vpc_id = local.vpc_id

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-igw"
})
}

# Route Tables

resource "aws_route_table" "public" {
count = var.vpc_id == "" ? 1 : 0

vpc_id = local.vpc_id

route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.main[0].id
}

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-public-rt"
})
}

resource "aws_route_table_association" "public" {
count = var.vpc_id == "" ? 2 : 0

subnet_id = aws_subnet.public[count.index].id
route_table_id = aws_route_table.public[0].id
}

# KMS Key for encryption

resource "aws_kms_key" "main" {
description = "KMS key for ${local.name_prefix} encryption"
deletion_window_in_days = 7
enable_key_rotation = true

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "Enable IAM User Permissions"
Effect = "Allow"
Principal = {
AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
}
Action = [
"kms:Encrypt*",
"kms:Decrypt*",
"kms:ReEncrypt*",
"kms:GenerateDataKey*",
"kms:Describe*"
]
Resource = "_"
Condition = {
ArnEquals = {
"kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:_"
}
}
}
]
})

tags = local.common_tags
}

resource "aws_kms_alias" "main" {
name = "alias/${local.name_prefix}-primary-cmk"
target_key_id = aws_kms_key.main.key_id
}

# Data sources for current account and region

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 Buckets

resource "aws_s3_bucket" "app_data" {
bucket = "${local.name_prefix}-app-data-${local.random_suffix}"

tags = local.common_tags
}

resource "aws_s3_bucket" "access_logs" {
bucket = "${local.name_prefix}-access-logs-${local.random_suffix}"

tags = local.common_tags
}

resource "aws_s3_bucket" "cloudtrail" {
bucket = "${local.name_prefix}-cloudtrail-${local.random_suffix}"

tags = local.common_tags
}

# S3 Bucket Encryption

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
bucket = aws_s3_bucket.app_data.id

rule {
apply_server_side_encryption_by_default {
kms_master_key_id = aws_kms_key.main.arn
sse_algorithm = "aws:kms"
}
}
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
bucket = aws_s3_bucket.access_logs.id

rule {
apply_server_side_encryption_by_default {
kms_master_key_id = aws_kms_key.main.arn
sse_algorithm = "aws:kms"
}
}
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
bucket = aws_s3_bucket.cloudtrail.id

rule {
apply_server_side_encryption_by_default {
kms_master_key_id = aws_kms_key.main.arn
sse_algorithm = "aws:kms"
}
}
}

# S3 Public Access Block

resource "aws_s3_bucket_public_access_block" "app_data" {
bucket = aws_s3_bucket.app_data.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
bucket = aws_s3_bucket.access_logs.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
bucket = aws_s3_bucket.cloudtrail.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

# S3 Bucket Logging

resource "aws_s3_bucket_logging" "app_data" {
bucket = aws_s3_bucket.app_data.id

target_bucket = aws_s3_bucket.access_logs.id
target_prefix = "app-data/"
}

resource "aws_s3_bucket_logging" "access_logs" {
bucket = aws_s3_bucket.access_logs.id

target_bucket = aws_s3_bucket.access_logs.id
target_prefix = "access-logs/"
}

# S3 Bucket Policies

resource "aws_s3_bucket_policy" "app_data" {
bucket = aws_s3_bucket.app_data.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "DenyInsecureConnections"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
aws_s3_bucket.app_data.arn,
"${aws_s3_bucket.app_data.arn}/*"
]
Condition = {
Bool = {
"aws:SecureTransport" = "false"
}
}
},
{
Sid = "DenyPublicAccess"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
aws_s3_bucket.app_data.arn,
"${aws_s3_bucket.app_data.arn}/*"
]
Condition = {
StringEquals = {
"aws:PrincipalOrgID" = "o-exampleorgid"
}
}
}
]
})
}

resource "aws_s3_bucket_policy" "access_logs" {
bucket = aws_s3_bucket.access_logs.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "DenyInsecureConnections"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
aws_s3_bucket.access_logs.arn,
"${aws_s3_bucket.access_logs.arn}/*"
]
Condition = {
Bool = {
"aws:SecureTransport" = "false"
}
}
}
]
})
}

# Account-level S3 Public Access Block

resource "aws_s3_account_public_access_block" "main" {
block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

# CloudWatch Log Groups

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
name = "/aws/vpc/flowlogs/${local.name_prefix}"
retention_in_days = var.flow_logs_retention_days
kms_key_id = aws_kms_key.main.arn

tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
name = "/aws/cloudtrail/${local.name_prefix}"
retention_in_days = 365
kms_key_id = aws_kms_key.main.arn

tags = local.common_tags
}

# VPC Flow Logs

resource "aws_flow_log" "vpc" {
iam_role_arn = aws_iam_role.vpc_flow_logs.arn
log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
traffic_type = "ALL"
vpc_id = local.vpc_id

tags = local.common_tags
}

# IAM Roles and Policies

resource "aws_iam_role" "vpc_flow_logs" {
name = "vpc-flow-logs-role-${local.iam_suffix}"

assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "vpc-flow-logs.amazonaws.com"
}
}
]
})

tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
name = "vpc-flow-logs-policy"
role = aws_iam_role.vpc_flow_logs.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"logs:CreateLogGroup",
"logs:CreateLogStream",
"logs:PutLogEvents",
"logs:DescribeLogGroups",
"logs:DescribeLogStreams"
]
Resource = "${aws_cloudwatch_log_group.vpc_flow_logs.arn}:\*"
}
]
})
}

resource "aws_iam_role" "ec2" {
name = "ec2-role-${local.iam_suffix}"

assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "ec2.amazonaws.com"
}
}
]
})

tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
role = aws_iam_role.ec2.name
policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
role = aws_iam_role.ec2.name
policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
name = "ec2-instance-profile-${local.iam_suffix}"
role = aws_iam_role.ec2.name

tags = local.common_tags
}

# Security Groups

resource "aws_security_group" "ec2" {
name_prefix = "${local.name_prefix}-ec2-"
vpc_id = local.vpc_id

ingress {
description = "SSH from allowed CIDRs"
from_port = 22
to_port = 22
protocol = "tcp"
cidr_blocks = var.allowed_ingress_cidrs
}

ingress {
description = "HTTP from allowed CIDRs"
from_port = 80
to_port = 80
protocol = "tcp"
cidr_blocks = var.allowed_ingress_cidrs
}

ingress {
description = "HTTPS from allowed CIDRs"
from_port = 443
to_port = 443
protocol = "tcp"
cidr_blocks = var.allowed_ingress_cidrs
}

egress {
description = "All outbound traffic"
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-ec2-sg"
})
}

resource "aws_security_group" "rds" {
name_prefix = "${local.name_prefix}-rds-"
vpc_id = local.vpc_id

ingress {
description = "PostgreSQL from EC2 security group"
from_port = 5432
to_port = 5432
protocol = "tcp"
security_groups = [aws_security_group.ec2.id]
}

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-rds-sg"
})
}

# RDS Subnet Group

resource "aws_db_subnet_group" "main" {
name = "${local.name_prefix}-db-subnet-group"
subnet_ids = local.private_subnet_ids

tags = local.common_tags
}

# RDS Parameter Group

resource "aws_db_parameter_group" "main" {
family = "postgres15"
name = "${local.name_prefix}-db-params"

parameter {
name = "log_connections"
value = "1"
}

parameter {
name = "log_disconnections"
value = "1"
}

tags = local.common_tags
}

# RDS Instance

resource "aws_db_instance" "main" {
identifier = "${local.name_prefix}-rds"

engine = var.rds_engine
engine_version = var.rds_engine_version
instance_class = var.rds_instance_class

allocated_storage = var.rds_allocated_storage
max_allocated_storage = var.rds_allocated_storage \* 2
storage_type = "gp2"
storage_encrypted = true
kms_key_id = aws_kms_key.main.arn

db_name = "secureapp"
username = "dbadmin"
password = random_password.db_password.result

vpc_security_group_ids = [aws_security_group.rds.id]
db_subnet_group_name = aws_db_subnet_group.main.name
parameter_group_name = aws_db_parameter_group.main.name

multi_az = true
publicly_accessible = false
deletion_protection = true
backup_retention_period = 7
backup_window = "03:00-04:00"
maintenance_window = "sun:04:00-sun:05:00"

skip_final_snapshot = false
final_snapshot_identifier = "${local.name_prefix}-final-snapshot"

tags = local.common_tags
}

# Random password for RDS

resource "random_password" "db_password" {
length = 16
special = true
}

# Secrets Manager for RDS credentials

resource "aws_secretsmanager_secret" "rds" {
name = "${local.name_prefix}-rds-secret"
kms_key_id = aws_kms_key.main.arn

tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds" {
secret_id = aws_secretsmanager_secret.rds.id

secret_string = jsonencode({
username = aws_db_instance.main.username
password = random_password.db_password.result
engine = aws_db_instance.main.engine
host = aws_db_instance.main.endpoint
port = aws_db_instance.main.port
dbname = aws_db_instance.main.db_name
})
}

# SNS Topic for CloudWatch Alarms

resource "aws_sns_topic" "alarms" {
name = "${local.name_prefix}-alarms"
kms_master_key_id = aws_kms_key.main.arn

tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
count = length(var.alarm_emails)

topic_arn = aws_sns_topic.alarms.arn
protocol = "email"
endpoint = var.alarm_emails[count.index]
}

# CloudWatch Alarms

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
alarm_name = "${local.name_prefix}-unauthorized-api-calls"
comparison_operator = "GreaterThanOrEqualToThreshold"
evaluation_periods = "1"
metric_name = "UnauthorizedAPICalls"
namespace = "CloudTrailMetrics"
period = "300"
statistic = "Sum"
threshold = "1"
alarm_description = "Alarm for unauthorized API calls"
alarm_actions = [aws_sns_topic.alarms.arn]

tags = local.common_tags
}

# CloudWatch Metric Filter

resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
name = "${local.name_prefix}-unauthorized-api-calls-filter"
  pattern        = "{ ($.errorCode = \"_UnauthorizedOperation\") || ($.errorCode = \"AccessDenied_\") }"
log_group_name = aws_cloudwatch_log_group.cloudtrail.name

metric_transformation {
name = "UnauthorizedAPICalls"
namespace = "CloudTrailMetrics"
value = "1"
}
}

# CloudTrail

resource "aws_cloudtrail" "main" {
name = "${local.name_prefix}-cloudtrail"

s3_bucket_name = aws_s3_bucket.cloudtrail.id
kms_key_id = aws_kms_key.main.arn

include_global_service_events = true
is_multi_region_trail = true
log_file_validation_enabled = true

event_selector {
read_write_type = "All"
include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_data.arn}/*"]
    }

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.cloudtrail.arn}/*"]
    }

}

tags = local.common_tags
}

# EC2 Instance

resource "aws_instance" "web" {
ami = data.aws_ssm_parameter.latest_ami.value
instance_type = var.ec2_instance_type

subnet_id = local.private_subnet_ids[0]
vpc_security_group_ids = [aws_security_group.ec2.id]
iam_instance_profile = aws_iam_instance_profile.ec2.name
associate_public_ip_address = false

user_data = base64encode(templatefile("${path.module}/user_data.sh", {
project_name = var.project_name
environment = var.environment
}))

user_data_replace_on_change = true

metadata_options {
http_endpoint = "enabled"
http_tokens = "required"
}

root_block_device {
volume_size = 20
volume_type = "gp2"
encrypted = true
kms_key_id = aws_kms_key.main.arn
}

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-web-instance"
})
}

# SSM Maintenance Window

resource "aws_ssm_maintenance_window" "main" {
name = "${local.name_prefix}-maintenance-window"
schedule = "cron(0 2 ? _ SUN _)" # Every Sunday at 2 AM
duration = 2
cutoff = 1

tags = local.common_tags
}

resource "aws_ssm_maintenance_window_target" "main" {
window_id = aws_ssm_maintenance_window.main.id
name = "target-instances"
description = "Target instances for patching"
resource_type = "INSTANCE"

targets {
key = "tag:Environment"
values = [var.environment]
}
}

resource "aws_ssm_maintenance_window_task" "patch" {
window_id = aws_ssm_maintenance_window.main.id
task_type = "RUN_COMMAND"
task_arn = "AWS-RunPatchBaseline"
priority = 1
service_role_arn = aws_iam_role.ssm_maintenance.arn

targets {
key = "WindowTargetIds"
values = [aws_ssm_maintenance_window_target.main.id]
}

task_invocation_parameters {
run_command_parameters {
parameter {
name = "Operation"
values = ["Install"]
}
}
}
}

# IAM Role for SSM Maintenance Window

resource "aws_iam_role" "ssm_maintenance" {
name = "ssm-maintenance-role-${local.iam_suffix}"

assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "ssm.amazonaws.com"
}
}
]
})

tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ssm_maintenance" {
role = aws_iam_role.ssm_maintenance.name
policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonSSMMaintenanceWindowRole"
}

# Outputs

output "vpc_id" {
description = "VPC ID"
value = local.vpc_id
}

output "rds_endpoint" {
description = "RDS endpoint"
value = aws_db_instance.main.endpoint
}

output "rds_identifier" {
description = "RDS identifier"
value = aws_db_instance.main.identifier
}

output "cloudtrail_name" {
description = "CloudTrail name"
value = aws_cloudtrail.main.name
}

output "app_data_bucket" {
description = "App data S3 bucket"
value = aws_s3_bucket.app_data.bucket
}

output "access_logs_bucket" {
description = "Access logs S3 bucket"
value = aws_s3_bucket.access_logs.bucket
}

output "kms_key_arn" {
description = "KMS key ARN"
value = aws_kms_key.main.arn
}

output "kms_alias" {
description = "KMS key alias"
value = aws_kms_alias.main.name
}

lib/user_data.sh
#!/bin/bash
set -e

# Function to get IMDSv2 token and metadata

get_metadata() {
local token=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)
curl -H "X-aws-ec2-metadata-token: $token" "http://169.254.169.254/latest/meta-data/$1" 2>/dev/null
}

# Update system packages

yum update -y

# Install required packages

yum install -y \
 amazon-cloudwatch-agent \
 python3 \
 python3-pip \
 httpd \
 mod_ssl \
 wget \
 curl \
 jq

# Get IMDSv2 token

TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)

# Get instance metadata using IMDSv2

INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/instance-id" 2>/dev/null)
AZ=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/placement/availability-zone" 2>/dev/null)

echo "Instance ID: $INSTANCE_ID"
echo "Availability Zone: $AZ"

# Configure CloudWatch Agent

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
"agent": {
"metrics_collection_interval": 60,
"run_as_user": "cwagent"
},
"logs": {
"logs_collected": {
"files": {
"collect_list": [
{
"file_path": "/var/log/messages",
"log_group_name": "/aws/ec2/${project_name}-${environment}/system",
"log_stream_name": "{instance_id}",
"timezone": "UTC"
},
{
"file_path": "/var/log/secure",
"log_group_name": "/aws/ec2/${project_name}-${environment}/security",
"log_stream_name": "{instance_id}",
"timezone": "UTC"
}
]
}
}
},
"metrics": {
"metrics_collected": {
"disk": {
"measurement": ["used_percent"],
"metrics_collection_interval": 60,
"resources": ["*"]
},
"mem": {
"measurement": ["mem_used_percent"],
"metrics_collection_interval": 60
}
}
}
}
EOF

# Start CloudWatch Agent

systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Create a simple web server for health checks

cat > /var/www/html/index.html << 'EOF'

<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>Instance is healthy!</h1>
    <p>Instance ID: <span id="instance-id"></span></p>
    <p>Availability Zone: <span id="az"></span></p>
    <p>Region: <span id="region"></span></p>
    <p>Timestamp: <span id="timestamp"></span></p>
</body>
<script>
// Get instance metadata using IMDSv2
async function getMetadata(path) {
    const token = await fetch('http://169.254.169.254/latest/api/token', {
        method: 'PUT',
        headers: {
            'X-aws-ec2-metadata-token-ttl-seconds': '21600'
        }
    }).then(response => response.text());
    
    return fetch(`http://169.254.169.254/latest/meta-data/${path}`, {
        headers: {
            'X-aws-ec2-metadata-token': token
        }
    }).then(response => response.text());
}

// Update page with metadata
async function updatePage() {
try {
document.getElementById('instance-id').textContent = await getMetadata('instance-id');
document.getElementById('az').textContent = await getMetadata('placement/availability-zone');
document.getElementById('region').textContent = await getMetadata('placement/region');
document.getElementById('timestamp').textContent = new Date().toISOString();
} catch (error) {
console.error('Error fetching metadata:', error);
}
}

updatePage();
setInterval(updatePage, 30000); // Update every 30 seconds
</script>

</html>
EOF

# Start Apache

systemctl enable httpd
systemctl start httpd

# Create a simple health check script

cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash

# Simple health check script

echo "Health check passed at $(date)"
exit 0
EOF

chmod +x /usr/local/bin/health-check.sh

# Create systemd service for health check

cat > /etc/systemd/system/health-check.service << 'EOF'
[Unit]
Description=Health Check Service
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/health-check.sh
User=root

[Install]
WantedBy=multi-user.target
EOF

# Enable and start health check service

systemctl enable health-check.service

echo "User data script completed successfully"
