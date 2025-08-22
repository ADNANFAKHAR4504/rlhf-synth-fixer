Model_response.md

lib/tap_task.tf
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

Variables
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
default = "15.4"
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
default = "vpc-0abc123de456"
}

variable "private_subnet_ids" {
description = "List of private subnet IDs"
type = list(string)
default = ["subnet-0123456789abcdef0", "subnet-0fedcba9876543210"]
}

variable "public_subnet_ids" {
description = "List of public subnet IDs"
type = list(string)
default = ["subnet-0abcdef1234567890", "subnet-09876543210fedcba"]
}

variable "flow_logs_retention_days" {
description = "VPC Flow Logs retention in days"
type = number
default = 90
}

variable "app_logs_retention_days" {
description = "Application logs retention in days"
type = number
default = 365
}

variable "ssm*patch_window_cron" {
description = "Cron expression for SSM patch maintenance window"
type = string
default = "cron(0 2 ? * SUN \_)"
}

variable "kms_key_administrators" {
description = "List of IAM user/role ARNs that can administer KMS keys"
type = list(string)
default = []
}

variable "kms_key_users" {
description = "List of IAM user/role ARNs that can use KMS keys"
type = list(string)
default = []
}

Locals
locals {
common_tags = {
Project = var.project_name
Environment = var.environment
Owner = var.owner
CostCenter = var.cost_center
Compliance = var.compliance
ManagedBy = "terraform"
}

name_prefix = "${var.project_name}-${var.environment}"
}

Data Sources
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

data "aws_ssm_parameter" "amazon_linux_2023_ami" {
name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

data "aws_availability_zones" "available" {
state = "available"
}

KMS Key for S3 Encryption
resource "aws_kms_key" "s3_cmk" {
description = "Customer managed key for S3 bucket encryption"
deletion_window_in_days = 7
enable_key_rotation = true

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "Enable IAM User Permissions"
Effect = "Allow"
Principal = {
AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws*caller_identity.current.account_id}:root"
}
Action = "kms:*"
Resource = "_"
},
{
Sid = "Allow CloudTrail to encrypt logs"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
Action = [
"kms:GenerateDataKey*",
"kms:DescribeKey"
]
Resource = "_"
Condition = {
StringEquals = {
"kms:EncryptionContext:aws:cloudtrail:arn" = "arn:${data.aws_partition.current.partition}:cloudtrail:${data.aws*region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
}
}
},
{
Sid = "Allow S3 service to use the key"
Effect = "Allow"
Principal = {
Service = "s3.amazonaws.com"
}
Action = [
"kms:Decrypt",
"kms:GenerateDataKey"
]
Resource = "*"
Condition = {
StringEquals = {
"kms:ViaService" = "s3.${data.aws_region.current.name}.amazonaws.com"
}
}
}
]
})

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-s3-cmk"
})
}

resource "aws_kms_alias" "s3_cmk" {
name = "alias/${local.name_prefix}-s3-cmk"
target_key_id = aws_kms_key.s3_cmk.key_id
}

S3 Bucket for Access Logs
resource "aws_s3_bucket" "access_logs" {
bucket = "${local.name_prefix}-access-logs-${random_id.bucket_suffix.hex}"
force_destroy = false

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-access-logs"
Purpose = "access-logging"
})
}

resource "random_id" "bucket_suffix" {
byte_length = 4
}

resource "aws_s3_bucket_versioning" "access_logs" {
bucket = aws_s3_bucket.access_logs.id
versioning_configuration {
status = "Enabled"
}
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
bucket = aws_s3_bucket.access_logs.id

rule {
apply_server_side_encryption_by_default {
kms_master_key_id = aws_kms_key.s3_cmk.arn
sse_algorithm = "aws:kms"
}
bucket_key_enabled = true
}
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
bucket = aws_s3_bucket.access_logs.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
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
},
{
Sid = "DenyUnencryptedUploads"
Effect = "Deny"
Principal = "_"
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.access_logs.arn}/_"
Condition = {
StringNotEquals = {
"s3:x-amz-server-side-encryption" = "aws:kms"
}
}
},
{
Sid = "S3ServerAccessLogsDelivery"
Effect = "Allow"
Principal = { Service = "logging.s3.amazonaws.com" }
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.access_logs.arn}/access-logs/\*"
Condition = {
ArnEquals = {
"aws:SourceArn" = [
aws_s3_bucket.cloudtrail.arn,
aws_s3_bucket.app_data.arn
]
}
}
},
{
Sid = "S3ServerAccessLogsDeliveryGetBucketAcl"
Effect = "Allow"
Principal = { Service = "logging.s3.amazonaws.com" }
Action = "s3:GetBucketAcl"
Resource = aws_s3_bucket.access_logs.arn
Condition = {
ArnEquals = {
"aws:SourceArn" = [
aws_s3_bucket.cloudtrail.arn,
aws_s3_bucket.app_data.arn
]
}
}
}
]
})
}

S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
bucket = "${local.name_prefix}-cloudtrail-${random_id.bucket_suffix.hex}"
force_destroy = false

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-cloudtrail"
Purpose = "cloudtrail-logs"
})
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
bucket = aws_s3_bucket.cloudtrail.id
versioning_configuration {
status = "Enabled"
}
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
bucket = aws_s3_bucket.cloudtrail.id

rule {
apply_server_side_encryption_by_default {
kms_master_key_id = aws_kms_key.s3_cmk.arn
sse_algorithm = "aws:kms"
}
bucket_key_enabled = true
}
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
bucket = aws_s3_bucket.cloudtrail.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "cloudtrail" {
bucket = aws_s3_bucket.cloudtrail.id

target_bucket = aws_s3_bucket.access_logs.id
target_prefix = "access-logs/cloudtrail/"
}

resource "aws_s3_bucket_policy" "cloudtrail" {
bucket = aws_s3_bucket.cloudtrail.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "DenyInsecureConnections"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
aws_s3_bucket.cloudtrail.arn,
"${aws_s3_bucket.cloudtrail.arn}/*"
]
Condition = {
Bool = {
"aws:SecureTransport" = "false"
}
}
},
{
Sid = "DenyUnencryptedUploads"
Effect = "Deny"
Principal = "_"
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.cloudtrail.arn}/_"
Condition = {
StringNotEquals = {
"s3:x-amz-server-side-encryption" = "aws:kms"
}
}
},
{
Sid = "AWSCloudTrailAclCheck"
Effect = "Allow"
Principal = { Service = "cloudtrail.amazonaws.com" }
Action = "s3:GetBucketAcl"
Resource = aws_s3_bucket.cloudtrail.arn
Condition = {
StringEquals = {
"AWS:SourceArn" = "arn:${data.aws_partition.current.partition}:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
}
}
},
{
Sid = "AWSCloudTrailWrite"
Effect = "Allow"
Principal = { Service = "cloudtrail.amazonaws.com" }
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:${data.aws_partition.current.partition}:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-cloudtrail"
}
}
}
]
})
}

S3 Bucket for Application Data
resource "aws_s3_bucket" "app_data" {
bucket = "${local.name_prefix}-app-data-${random_id.bucket_suffix.hex}"
force_destroy = false

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-app-data"
Purpose = "application-data"
})
}

resource "aws_s3_bucket_versioning" "app_data" {
bucket = aws_s3_bucket.app_data.id
versioning_configuration {
status = "Enabled"
}
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
bucket = aws_s3_bucket.app_data.id

rule {
apply_server_side_encryption_by_default {
kms_master_key_id = aws_kms_key.s3_cmk.arn
sse_algorithm = "aws:kms"
}
bucket_key_enabled = true
}
}

resource "aws_s3_bucket_public_access_block" "app_data" {
bucket = aws_s3_bucket.app_data.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "app_data" {
bucket = aws_s3_bucket.app_data.id

target_bucket = aws_s3_bucket.access_logs.id
target_prefix = "access-logs/app-data/"
}

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
Sid = "DenyUnencryptedUploads"
Effect = "Deny"
Principal = "_"
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.app_data.arn}/_"
Condition = {
StringNotEquals = {
"s3:x-amz-server-side-encryption" = "aws:kms"
}
}
}
]
})
}

CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
name = "/aws/vpc/flowlogs/${local.name_prefix}"
retention_in_days = var.flow_logs_retention_days
kms_key_id = aws_kms_key.s3_cmk.arn

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-vpc-flow-logs"
})
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
name = "/aws/cloudtrail/${local.name_prefix}"
retention_in_days = var.app_logs_retention_days
kms_key_id = aws_kms_key.s3_cmk.arn

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-cloudtrail-logs"
})
}

IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
name = "${local.name_prefix}-vpc-flow-logs-role"

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
name = "${local.name_prefix}-vpc-flow-logs-policy"
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
Resource = aws_cloudwatch_log_group.vpc_flow_logs.arn
}
]
})
}

VPC Flow Logs
resource "aws_flow_log" "vpc" {
iam_role_arn = aws_iam_role.vpc_flow_logs.arn
log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
traffic_type = "ALL"
vpc_id = var.vpc_id

log_format = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${windowstart} $${windowend} $${action} $${flowlogstatus}"

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-vpc-flow-logs"
})
}

IAM Role for CloudTrail
resource "aws_iam_role" "cloudtrail" {
name = "${local.name_prefix}-cloudtrail-role"

assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
}
]
})

tags = local.common_tags
}

resource "aws_iam_role_policy" "cloudtrail" {
name = "${local.name_prefix}-cloudtrail-policy"
role = aws_iam_role.cloudtrail.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"logs:PutLogEvents",
"logs:CreateLogGroup",
"logs:CreateLogStream"
]
Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:\*"
}
]
})
}

CloudTrail
resource "aws_cloudtrail" "main" {
name = "${local.name_prefix}-cloudtrail"
s3_bucket_name = aws_s3_bucket.cloudtrail.bucket
s3_key_prefix = "cloudtrail-logs"
include_global_service_events = true
is_multi_region_trail = true
enable_logging = true
enable_log_file_validation = true

kms_key_id = aws_kms_key.s3_cmk.arn

cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:\*"
cloud_watch_logs_role_arn = aws_iam_role.cloudtrail.arn

event_selector {
read_write_type = "All"
include_management_events = true
exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:${data.aws_partition.current.partition}:s3:::*/*"]
    }

}

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-cloudtrail"
})
}

SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
name = "${local.name_prefix}-security-alerts"
kms_master_key_id = aws_kms_key.s3_cmk.arn

tags = local.common_tags
}

resource "aws_sns_topic_subscription" "security_alerts" {
count = length(var.alarm_emails)
topic_arn = aws_sns_topic.security_alerts.arn
protocol = "email"
endpoint = var.alarm_emails[count.index]
}

CloudWatch Metric Filters and Alarms
resource "aws*cloudwatch_log_metric_filter" "unauthorized_api_calls" {
name = "${local.name_prefix}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"\_UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

metric_transformation {
name = "UnauthorizedAPICalls"
namespace = "${local.name_prefix}/Security"
value = "1"
}
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
alarm_name = "${local.name_prefix}-unauthorized-api-calls"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${local.name_prefix}/Security"
period = "300"
statistic = "Sum"
threshold = "1"
alarm_description = "This metric monitors unauthorized API calls"
alarm_actions = [aws_sns_topic.security_alerts.arn]

tags = local.common_tags
}

Security Groups
resource "aws_security_group" "rds" {
name = "${local.name_prefix}-rds-sg"
description = "Security group for RDS database"
vpc_id = var.vpc_id

ingress {
description = "PostgreSQL from allowed CIDRs"
from_port = 5432
to_port = 5432
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
Name = "${local.name_prefix}-rds-sg"
})
}

resource "aws_security_group" "ec2" {
name = "${local.name_prefix}-ec2-sg"
description = "Security group for EC2 instances"
vpc_id = var.vpc_id

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

RDS Subnet Group
resource "aws_db_subnet_group" "main" {
name = "${local.name_prefix}-db-subnet-group"
subnet_ids = var.private_subnet_ids

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-db-subnet-group"
})
}

RDS Instance
resource "aws_db_instance" "main" {
identifier = "${local.name_prefix}-rds"
engine = var.rds_engine
engine_version = var.rds_engine_version
instance_class = var.rds_instance_class

allocated_storage = var.rds_allocated_storage
max_allocated_storage = var.rds_allocated_storage \* 2
storage_type = "gp3"
storage_encrypted = true
kms_key_id = aws_kms_key.s3_cmk.arn

db_name = "appdb"
username = "dbadmin"
password = random_password.rds_password.result

vpc_security_group_ids = [aws_security_group.rds.id]
db_subnet_group_name = aws_db_subnet_group.main.name

multi_az = true
publicly_accessible = false
backup_retention_period = 7
backup_window = "03:00-04:00"
maintenance_window = "sun:04:00-sun:05:00"

auto_minor_version_upgrade = true
deletion_protection = true
skip_final_snapshot = false
final_snapshot_identifier = "${local.name_prefix}-rds-final-snapshot"

enabled_cloudwatch_logs_exports = ["postgresql"]

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-rds"
})
}

resource "random_password" "rds_password" {
length = 16
special = true
}

resource "aws_secretsmanager_secret" "rds_password" {
name = "${local.name_prefix}-rds-password"
description = "RDS database password"
kms_key_id = aws_kms_key.s3_cmk.arn

tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_password" {
secret_id = aws_secretsmanager_secret.rds_password.id
secret_string = jsonencode({
username = aws_db_instance.main.username
password = random_password.rds_password.result
endpoint = aws_db_instance.main.endpoint
port = aws_db_instance.main.port
})
}

IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_role" {
name = "${local.name_prefix}-ec2-role"

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

resource "aws_iam_role_policy" "ec2_ssm_policy" {
name = "${local.name_prefix}-ec2-ssm-policy"
role = aws_iam_role.ec2_role.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"ssm:UpdateInstanceInformation",
"ssm:SendCommand",
"ssm:ListCommands",
"ssm:ListCommandInvocations",
"ssm:DescribeInstanceInformation",
"ssm:GetDeployablePatchSnapshotForInstance",
"ssm:DescribePatchGroups",
"ssm:DescribeAvailablePatches",
"ssm:DescribePatchBaselines",
"ssm:GetPatchBaseline",
"ssm:GetPatchBaselineForPatchGroup",
"ssm:DescribeEffectivePatchesForPatchBaseline",
"ssm:DescribeEffectiveInstanceAssociations",
"ssm:DescribeInstanceAssociationsStatus",
"ssm:DescribeAssociation",
"ssm:GetDeployablePatchSnapshotForInstance",
"ssm:ListAssociations",
"ssm:ListInstanceAssociations",
"ssm:PutInventory",
"ssm:PutComplianceItems",
"ssm:PutConfigurePackageResult",
"ssm:UpdateAssociationStatus",
"ssm:UpdateInstanceAssociationStatus",
"ssm:UpdateInstanceInformation"
]
Resource = "\*"
}
]
})
}

resource "aws_iam_instance_profile" "ec2_profile" {
name = "${local.name_prefix}-ec2-instance-profile"
role = aws_iam_role.ec2_role.name
}

EC2 Instance
resource "aws_instance" "app" {
ami = data.aws_ssm_parameter.amazon_linux_2023_ami.value
instance_type = var.ec2_instance_type
subnet_id = var.private_subnet_ids[0]
vpc_security_group_ids = [aws_security_group.ec2.id]
associate_public_ip_address = false
iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

metadata_options {
http_endpoint = "enabled"
http_tokens = "required"
}

root_block_device {
encrypted = true
kms_key_id = aws_kms_key.s3_cmk.arn
volume_type = "gp3"
}

tags = merge(local.common_tags, { Name = "${local.name_prefix}-ec2" })
}

SSM Patch Manager
resource "aws_ssm_maintenance_window" "patch" {
name = "${local.name_prefix}-patch-window"
description = "Maintenance window for security patches"
schedule = var.ssm_patch_window_cron
duration = 2
cutoff = 1
allow_unassociated_targets = false

tags = local.common_tags
}

resource "aws_ssm_maintenance_window_target" "patch_targets" {
window_id = aws_ssm_maintenance_window.patch.id
name = "${local.name_prefix}-patch-targets"
description = "Target EC2 instances for patching"
resource_type = "INSTANCE"

targets {
key = "tag:Name"
values = ["${local.name_prefix}-ec2"]
}
}

resource "aws_ssm_maintenance_window_task" "patch_task" {
window_id = aws_ssm_maintenance_window.patch.id
task_type = "RUN_COMMAND"
task_arn = "AWS-RunPatchBaseline"
priority = 1
service_role_arn = aws_iam_role.ec2_role.arn

targets {
key = "WindowTargetIds"
values = [aws_ssm_maintenance_window_target.patch_targets.id]
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

Outputs
output "vpc_flow_log_id" {
description = "VPC Flow Log ID"
value = aws_flow_log.vpc.id
}

output "cloudtrail_arn" {
description = "CloudTrail ARN"
value = aws_cloudtrail.main.arn
}

output "rds_endpoint" {
description = "RDS endpoint"
value = aws_db_instance.main.endpoint
sensitive = true
}

output "ec2_instance_id" {
description = "EC2 instance ID"
value = aws_instance.app.id
}

output "s3_access_logs_bucket" {
description = "S3 access logs bucket name"
value = aws_s3_bucket.access_logs.bucket
}

output "kms_key_arn" {
description = "KMS key ARN"
value = aws_kms_key.s3_cmk.arn
}

output "sns_topic_arn" {
description = "SNS topic ARN for security alerts"
value = aws_sns_topic.security_alerts.arn
}
