# Terraform version requirement

terraform {
required_version = ">= 0.14"
required_providers {
aws = {
source = "hashicorp/aws"
version = "~> 5.0"
}
}
}

# Variable declarations

variable "aws_region" {
description = "The AWS region to deploy resources"
type = string
}

variable "allowed_ip_ranges" {
description = "List of allowed IP ranges for S3 bucket access"
type = list(string)
default = ["203.0.113.0/24", "198.51.100.0/24"] # Example IP ranges - replace with actual ranges
}

variable "security_team_email" {
description = "Email address for security team notifications"
type = string
default = "security-team@example.com"
}

# Local values

locals {
common_tags = {
Environment = "production"
Project = "secure-data-storage"
ManagedBy = "terraform"
}

bucket_name = "secure-storage-${random_id.bucket_suffix.hex}"
}

# Random ID for unique bucket naming

resource "random_id" "bucket_suffix" {
byte_length = 8
}

# S3 Bucket for secure storage

resource "aws_s3_bucket" "secure_storage" {
bucket = local.bucket_name
tags = merge(local.common_tags, {
Name = "SecureStorageBucket"
})
}

# S3 Bucket versioning

resource "aws_s3_bucket_versioning" "secure_storage_versioning" {
bucket = aws_s3_bucket.secure_storage.id
versioning_configuration {
status = "Enabled"
}
}

# S3 Bucket server-side encryption

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_storage_encryption" {
bucket = aws_s3_bucket.secure_storage.id

rule {
apply_server_side_encryption_by_default {
sse_algorithm = "AES256"
}
bucket_key_enabled = true
}
}

# S3 Bucket public access block

resource "aws_s3_bucket_public_access_block" "secure_storage_pab" {
bucket = aws_s3_bucket.secure_storage.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

# S3 Bucket policy for IP restriction

resource "aws_s3_bucket_policy" "secure_storage_policy" {
bucket = aws_s3_bucket.secure_storage.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "IPRestriction"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
aws_s3_bucket.secure_storage.arn,
"${aws_s3_bucket.secure_storage.arn}/*"
]
Condition = {
IpAddressIfExists = {
"aws:SourceIp" = var.allowed_ip_ranges
}
}
}
]
})
}

# CloudTrail S3 bucket for logs

resource "aws_s3_bucket" "cloudtrail_logs" {
bucket = "cloudtrail-logs-${random_id.bucket_suffix.hex}"
tags = merge(local.common_tags, {
Name = "CloudTrailLogsBucket"
})
}

# CloudTrail logs bucket versioning

resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
bucket = aws_s3_bucket.cloudtrail_logs.id
versioning_configuration {
status = "Enabled"
}
}

# CloudTrail logs bucket encryption

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption" {
bucket = aws_s3_bucket.cloudtrail_logs.id

rule {
apply_server_side_encryption_by_default {
sse_algorithm = "AES256"
}
bucket_key_enabled = true
}
}

# CloudTrail logs bucket public access block

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
bucket = aws_s3_bucket.cloudtrail_logs.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

# CloudTrail bucket policy

resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
bucket = aws_s3_bucket.cloudtrail_logs.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "AWSCloudTrailAclCheck"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
Action = "s3:GetBucketAcl"
Resource = aws_s3_bucket.cloudtrail_logs.arn
Condition = {
StringEquals = {
"AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/secure-data-cloudtrail"
}
}
},
{
Sid = "AWSCloudTrailWrite"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
Action = "s3:PutObject"
Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
Condition = {
StringEquals = {
"s3:x-amz-acl" = "bucket-owner-full-control"
"AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/secure-data-cloudtrail"
}
}
}
]
})
}

# Data source for current AWS account ID

data "aws_caller_identity" "current" {}

# CloudTrail for API logging

resource "aws_cloudtrail" "secure_data_trail" {
name = "secure-data-cloudtrail"
s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket
include_global_service_events = true
is_multi_region_trail = true
enable_logging = true
cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:\*"
cloud_watch_logs_role_arn = aws_iam_role.cloudtrail_cloudwatch_role.arn

event_selector {
read_write_type = "All"
include_management_events = true
exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.secure_storage.arn}/*"]
    }

}

tags = merge(local.common_tags, {
Name = "SecureDataCloudTrail"
})
}

# CloudWatch Log Group for CloudTrail

resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
name = "/aws/cloudtrail/secure-data"
retention_in_days = 14

tags = merge(local.common_tags, {
Name = "CloudTrailLogGroup"
})
}

# IAM role for CloudTrail CloudWatch integration

resource "aws_iam_role" "cloudtrail_cloudwatch_role" {
name = "cloudtrail-cloudwatch-logs-role"

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

tags = merge(local.common_tags, {
Name = "CloudTrailCloudWatchRole"
})
}

# IAM policy for CloudTrail CloudWatch logs

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_logs_policy" {
name = "cloudtrail-cloudwatch-logs-policy"
role = aws_iam_role.cloudtrail_cloudwatch_role.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "AWSCloudTrailLogsPolicy"
Effect = "Allow"
Action = [
"logs:CreateLogGroup",
"logs:CreateLogStream",
"logs:PutLogEvents"
]
Resource = [
"${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
]
}
]
})
}

# IAM role for application access

resource "aws_iam_role" "app_role" {
name = "secure-storage-app-role"

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

tags = merge(local.common_tags, {
Name = "SecureStorageAppRole"
})
}

# IAM policy for least privilege S3 access

resource "aws_iam_role_policy" "app_s3_policy" {
name = "secure-storage-s3-policy"
role = aws_iam_role.app_role.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"s3:GetObject",
"s3:PutObject",
"s3:DeleteObject",
"s3:ListBucket"
]
Resource = [
aws_s3_bucket.secure_storage.arn,
"${aws_s3_bucket.secure_storage.arn}/*"
]
}
]
})
}

# IAM instance profile for EC2

resource "aws_iam_instance_profile" "app_profile" {
name = "secure-storage-app-profile"
role = aws_iam_role.app_role.name
}

# SNS topic for IAM change notifications

resource "aws_sns_topic" "iam_changes" {
name = "iam-role-changes"

tags = merge(local.common_tags, {
Name = "IAMRoleChangesNotifications"
})
}

# SNS topic subscription for security team

resource "aws_sns_topic_subscription" "security_team_email" {
topic_arn = aws_sns_topic.iam_changes.arn
protocol = "email"
endpoint = var.security_team_email
}

# CloudWatch log group for CloudTrail

resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
name = "/aws/cloudtrail/secure-data-trail"
retention_in_days = 90

tags = merge(local.common_tags, {
Name = "CloudTrailLogGroup"
})
}

# CloudWatch metric filter for IAM changes

resource "aws_cloudwatch_log_metric_filter" "iam_changes_filter" {
name = "IAMChangesFilter"
log_group_name = aws_cloudwatch_log_group.cloudtrail_log_group.name
pattern = "{ ($.eventName = CreateRole) || ($.eventName = DeleteRole) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = PutRolePolicy) || ($.eventName = DeleteRolePolicy) }"

metric_transformation {
name = "IAMChangesCount"
namespace = "Security/IAM"
value = "1"
}
}

# CloudWatch alarm for IAM changes

resource "aws_cloudwatch_metric_alarm" "iam_changes_alarm" {
alarm_name = "IAM-Role-Changes-Alarm"
comparison_operator = "GreaterThanOrEqualToThreshold"
evaluation_periods = "1"
metric_name = "IAMChangesCount"
namespace = "Security/IAM"
period = "300"
statistic = "Sum"
threshold = "1"
alarm_description = "Alarm when IAM role changes are detected"
alarm_actions = [aws_sns_topic.iam_changes.arn]
treat_missing_data = "notBreaching"

tags = merge(local.common_tags, {
Name = "IAMChangesAlarm"
})
}

# CloudWatch alarm for unauthorized S3 access attempts

resource "aws_cloudwatch_metric_alarm" "s3_access_denied_alarm" {
alarm_name = "S3-Access-Denied-Alarm"
comparison_operator = "GreaterThanThreshold"
evaluation_periods = "2"
metric_name = "4xxError"
namespace = "AWS/S3"
period = "300"
statistic = "Sum"
threshold = "5"
alarm_description = "Alarm when S3 access is denied multiple times"
alarm_actions = [aws_sns_topic.iam_changes.arn]

dimensions = {
BucketName = aws_s3_bucket.secure_storage.bucket
}

tags = merge(local.common_tags, {
Name = "S3AccessDeniedAlarm"
})
}

# Outputs for CI/CD integration (no secrets)

output "s3_bucket_name" {
description = "Name of the secure storage S3 bucket"
value = aws_s3_bucket.secure_storage.bucket
}

output "s3_bucket_arn" {
description = "ARN of the secure storage S3 bucket"
value = aws_s3_bucket.secure_storage.arn
}

output "cloudtrail_name" {
description = "Name of the CloudTrail"
value = aws_cloudtrail.secure_data_trail.name
}

output "cloudtrail_arn" {
description = "ARN of the CloudTrail"
value = aws_cloudtrail.secure_data_trail.arn
}

output "iam_role_name" {
description = "Name of the IAM role for application access"
value = aws_iam_role.app_role.name
}

output "iam_role_arn" {
description = "ARN of the IAM role for application access"
value = aws_iam_role.app_role.arn
}

output "sns_topic_arn" {
description = "ARN of the SNS topic for notifications"
value = aws_sns_topic.iam_changes.arn
}

output "cloudwatch_log_group_name" {
description = "Name of the CloudWatch log group"
value = aws_cloudwatch_log_group.cloudtrail_log_group.name
}

output "aws_region" {
description = "AWS region where resources are deployed"
value = var.aws_region
}

output "deployment_timestamp" {
description = "Timestamp of the deployment"
value = timestamp()
}
