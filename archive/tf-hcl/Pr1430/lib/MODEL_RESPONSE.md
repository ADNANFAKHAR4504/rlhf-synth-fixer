# Variables

variable "aws_region" {
description = "AWS region for resource deployment"
type = string
default = "us-west-2"
nullable = false
validation {
condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
error_message = "AWS region must be in format like us-west-2."
}
}

variable "kms_key_arn" {
description = "KMS key ARN for S3 SSE-KMS encryption"
type = string
nullable = false
validation {
condition = can(regex("^arn:aws:kms:[a-z0-9-]+:[0-9]{12}:key/[a-f0-9-]+$", var.kms_key_arn))
error_message = "KMS key ARN must be valid AWS KMS key ARN format."
}
}

variable "allowed_cidr" {
description = "CIDR block allowed for SSH and HTTPS ingress"
type = string
nullable = false
validation {
condition = can(cidrhost(var.allowed_cidr, 0))
error_message = "Allowed CIDR must be a valid CIDR block."
}
}

variable "app_bucket_name" {
description = "S3 bucket name for application data with tag-restricted access"
type = string
nullable = false
validation {
condition = can(regex("^[a-z0-9][a-z0-9-]\*[a-z0-9]$", var.app_bucket_name)) && length(var.app_bucket_name) >= 3 && length(var.app_bucket_name) <= 63
error_message = "S3 bucket name must be 3-63 characters, lowercase, start/end with alphanumeric, and contain only lowercase letters, numbers, and hyphens."
}
}

variable "trail_bucket_name" {
description = "S3 bucket name dedicated for CloudTrail logs"
type = string
nullable = false
validation {
condition = can(regex("^[a-z0-9][a-z0-9-]\*[a-z0-9]$", var.trail_bucket_name)) && length(var.trail_bucket_name) >= 3 && length(var.trail_bucket_name) <= 63
error_message = "S3 bucket name must be 3-63 characters, lowercase, start/end with alphanumeric, and contain only lowercase letters, numbers, and hyphens."
}
}

variable "ec2_ami_id" {
description = "AMI ID to use for EC2 instance"
type = string
nullable = false
validation {
condition = can(regex("^ami-[a-f0-9]{8,17}$", var.ec2_ami_id))
error_message = "AMI ID must be in format ami-xxxxxxxx."
}
}

variable "ec2_instance_type" {
description = "EC2 instance type"
type = string
default = "t3.micro"
nullable = false
validation {
condition = can(regex("^[a-z][0-9][a-z]?\\.[a-z0-9]+$", var.ec2_instance_type))
error_message = "Instance type must be valid EC2 instance type format."
}
}

variable "iam*user_name" {
description = "IAM user name for minimal-privilege deployment tasks"
type = string
nullable = false
validation {
condition = can(regex("^[a-zA-Z0-9+=,.@*-]+$", var.iam*user_name)) && length(var.iam_user_name) >= 1 && length(var.iam_user_name) <= 64
error_message = "IAM user name must be 1-64 characters and contain only alphanumeric characters and +=,.@*- symbols."
}
}

variable "vpc_id" {
description = "VPC ID for EC2 instance deployment"
type = string
nullable = false
validation {
condition = can(regex("^vpc-[a-f0-9]{8,17}$", var.vpc_id))
error_message = "VPC ID must be in format vpc-xxxxxxxx."
}
}

variable "subnet_id" {
description = "Subnet ID for EC2 instance deployment"
type = string
nullable = false
validation {
condition = can(regex("^subnet-[a-f0-9]{8,17}$", var.subnet_id))
error_message = "Subnet ID must be in format subnet-xxxxxxxx."
}
}

# Locals

locals {
common_tags = {
Environment = "Production"
}

account_id = data.aws_caller_identity.current.account_id

app_bucket_arn = "arn:aws:s3:::${var.app_bucket_name}"
  trail_bucket_arn = "arn:aws:s3:::${var.trail_bucket_name}"
}

# Data sources

data "aws_caller_identity" "current" {}

# S3 Application Bucket

resource "aws_s3_bucket" "app" {
bucket = var.app_bucket_name
tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "app" {
bucket = aws_s3_bucket.app.id
versioning_configuration {
status = "Enabled"
}
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
bucket = aws_s3_bucket.app.id

rule {
apply_server_side_encryption_by_default {
kms_master_key_id = var.kms_key_arn
sse_algorithm = "aws:kms"
}
bucket_key_enabled = true
}
}

resource "aws_s3_bucket_public_access_block" "app" {
bucket = aws_s3_bucket.app.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "app" {
bucket = aws_s3_bucket.app.id

rule {
object_ownership = "BucketOwnerEnforced"
}
}

resource "aws_s3_bucket_policy" "app" {
bucket = aws_s3_bucket.app.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "DenyInsecureTransport"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
local.app_bucket_arn,
"${local.app_bucket_arn}/*"
]
Condition = {
Bool = {
"aws:SecureTransport" = "false"
}
}
},
{
Sid = "AllowTagBasedAccess"
Effect = "Allow"
Principal = "_"
Action = [
"s3:GetObject",
"s3:PutObject",
"s3:ListBucket"
]
Resource = [
local.app_bucket_arn,
"${local.app_bucket_arn}/_"
]
Condition = {
StringEquals = {
"aws:PrincipalTag/Environment" = "Production"
"s3:ResourceTag/Environment" = "Production"
}
}
},
{
Sid = "DenyUntaggedAccess"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
local.app_bucket_arn,
"${local.app_bucket_arn}/*"
]
Condition = {
StringNotEquals = {
"aws:PrincipalTag/Environment" = "Production"
}
}
}
]
})
}

# IAM Role for App Access

resource "aws_iam_role" "app_access" {
name = "app-access-role"
tags = local.common_tags

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

inline_policy {
name = "AppBucketAccess"
policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"s3:GetObject",
"s3:PutObject",
"s3:ListBucket"
]
Resource = [
local.app_bucket_arn,
"${local.app_bucket_arn}/*"
]
Condition = {
StringEquals = {
"s3:ResourceTag/Environment" = "Production"
}
}
}
]
})
}
}

# S3 CloudTrail Bucket

resource "aws_s3_bucket" "trail" {
bucket = var.trail_bucket_name
tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "trail" {
bucket = aws_s3_bucket.trail.id
versioning_configuration {
status = "Enabled"
}
}

resource "aws_s3_bucket_server_side_encryption_configuration" "trail" {
bucket = aws_s3_bucket.trail.id

rule {
apply_server_side_encryption_by_default {
kms_master_key_id = var.kms_key_arn
sse_algorithm = "aws:kms"
}
bucket_key_enabled = true
}
}

resource "aws_s3_bucket_public_access_block" "trail" {
bucket = aws_s3_bucket.trail.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "trail" {
bucket = aws_s3_bucket.trail.id

rule {
object_ownership = "BucketOwnerEnforced"
}
}

resource "aws_s3_bucket_policy" "trail" {
bucket = aws_s3_bucket.trail.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "DenyInsecureTransport"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
local.trail_bucket_arn,
"${local.trail_bucket_arn}/*"
]
Condition = {
Bool = {
"aws:SecureTransport" = "false"
}
}
},
{
Sid = "AWSCloudTrailAclCheck"
Effect = "Allow"
Principal = {
Service = "cloudtrail.amazonaws.com"
}
Action = "s3:GetBucketAcl"
Resource = local.trail_bucket_arn
Condition = {
StringEquals = {
"AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${local.account_id}:trail/production-trail"
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
Resource = "${local.trail_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${local.account_id}:trail/production-trail"
}
}
}
]
})
}

# Security Group

resource "aws_security_group" "main" {
name_prefix = "production-sg-"
vpc_id = var.vpc_id
tags = merge(local.common_tags, { Name = "production-security-group" })

ingress {
description = "SSH access from allowed CIDR"
from_port = 22
to_port = 22
protocol = "tcp"
cidr_blocks = [var.allowed_cidr]
}

ingress {
description = "HTTPS access from allowed CIDR"
from_port = 443
to_port = 443
protocol = "tcp"
cidr_blocks = [var.allowed_cidr]
}

egress {
description = "All outbound traffic for system updates and package management"
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}
}

# EC2 Instance

resource "aws_instance" "main" {
ami = var.ec2_ami_id
instance_type = var.ec2_instance_type
subnet_id = var.subnet_id
vpc_security_group_ids = [aws_security_group.main.id]

# No public IP for security

associate_public_ip_address = false

tags = merge(local.common_tags, { Name = "production-instance" })

root_block_device {
encrypted = true
tags = local.common_tags
}
}

# CloudTrail

resource "aws_cloudtrail" "main" {
name = "production-trail"
s3_bucket_name = aws_s3_bucket.trail.id

is_multi_region_trail = true
include_global_service_events = true
enable_log_file_validation = true

kms_key_id = var.kms_key_arn

tags = local.common_tags

depends_on = [aws_s3_bucket_policy.trail]
}

# IAM User for Deployment

resource "aws_iam_user" "deployer" {
name = var.iam_user_name
tags = local.common_tags
}

resource "aws_iam_user_policy" "deployer" {
name = "DeployerMinimalPolicy"
user = aws_iam_user.deployer.name

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "ReadOnlyAccess"
Effect = "Allow"
Action = [
"ec2:Describe*",
"s3:ListBucket",
"s3:GetBucketLocation",
"s3:GetBucketVersioning",
"s3:GetBucketPolicy",
"s3:GetBucketEncryption",
"kms:ListAliases",
"kms:DescribeKey",
"iam:Get*",
"iam:List*",
"cloudtrail:DescribeTrails",
"cloudtrail:GetTrailStatus"
]
Resource = "_"
},
{
Sid = "SpecificResourceAccess"
Effect = "Allow"
Action = [
"s3:GetObject",
"s3:ListBucket"
]
Resource = [
local.app_bucket_arn,
"${local.app_bucket_arn}/_",
local.trail_bucket_arn,
"${local.trail_bucket_arn}/\*"
]
},
{
Sid = "EC2InstanceAccess"
Effect = "Allow"
Action = [
"ec2:DescribeInstances",
"ec2:DescribeInstanceStatus"
]
Resource = aws_instance.main.arn
}
]
})
}

# Outputs

output "app_bucket_name" {
description = "Name of the application S3 bucket"
value = aws_s3_bucket.app.id
}

output "app_bucket_arn" {
description = "ARN of the application S3 bucket"
value = aws_s3_bucket.app.arn
}

output "app_bucket_policy_id" {
description = "ID of the application bucket policy"
value = aws_s3_bucket_policy.app.id
}

output "trail_bucket_name" {
description = "Name of the CloudTrail S3 bucket"
value = aws_s3_bucket.trail.id
}

output "cloudtrail_trail_arn" {
description = "ARN of the CloudTrail trail"
value = aws_cloudtrail.main.arn
}

output "security_group_id" {
description = "ID of the security group"
value = aws_security_group.main.id
}

output "ec2_instance_id" {
description = "ID of the EC2 instance"
value = aws_instance.main.id
}

output "iam_deployer_user_arn" {
description = "ARN of the deployer IAM user"
value = aws_iam_user.deployer.arn
}

output "kms_key_arn_passthrough" {
description = "KMS key ARN passed through from input"
value = var.kms_key_arn
}
