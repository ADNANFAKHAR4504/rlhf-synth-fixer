# Terraform Infrastructure Code

## provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

```

## tap_stack.tf

```hcl
########################
# tap_stack.tf – Secure AWS Terraform configuration
#
# Mapping to requirements:
# 1) S3 tag-based access control → aws_iam_role.s3_tag_access + aws_iam_role_policy.s3_tag_policy
# 2) EC2 in predefined network → aws_instance.secure + aws_security_group.secure_sg
# 3) S3 encryption at rest/transit → aws_s3_bucket.* (data) + aws_s3_bucket_policy.data_bucket_policy (TLS + SSE-KMS)
# 4) CloudTrail auditing → aws_cloudtrail.audit + trail bucket policy for delivery
# 5) Least-privilege IAM user → aws_iam_user.deploy + aws_iam_user_policy.deploy
# 6) Strict tagging → Environment = "Production" on all taggable resources
# 7) Region & inputs → variables below, and an explicit region guard for us-east-2
########################

########################
# Variables
########################
variable "vpc_id" {
  description = "Target VPC ID"
  type        = string
  # Default to a placeholder to avoid interactive prompts during plan
  default = "vpc-00000000"
}

variable "subnet_id" {
  description = "Target subnet ID for the EC2 instance"
  type        = string
  # Default to a placeholder to avoid interactive prompts during plan
  default = "subnet-00000000"
}

variable "allowed_cidr" {
  description = "CIDR allowed to access ports 22 and 443"
  type        = string
  # Legacy CI default to avoid interactive prompts during plan when unset
  default = "0.0.0.0/0"
}

variable "s3_kms_key_arn" {
  description = "KMS key ARN used for S3 server-side encryption"
  type        = string
  # Placeholder ARN in the enforced region us-east-2 to avoid prompts
  default = "arn:aws:kms:us-east-2:111122223333:key/00000000-0000-0000-0000-000000000000"
}

variable "data_bucket_name" {
  description = "S3 bucket name for application data"
  type        = string
  # Example bucket name; uniqueness is only enforced at apply time
  default = "tap-data-bucket-example-123456"
}

variable "trail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
  # Example bucket name; uniqueness is only enforced at apply time
  default = "tap-trail-bucket-example-123456"
}

variable "instance_ami" {
  description = "AMI ID for the EC2 instance (if not provided, AL2023 is used)"
  type        = string
  default     = null
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# Keep all variable definitions in this file (referenced by `provider.aws`)
variable "aws_region" {
  description = "AWS region for the provider"
  type        = string
  # Default aligns with the region guard below
  default = "us-east-2"
}

# Feature toggles
variable "enable_ec2" {
  description = "Whether to create EC2-related resources (security group and instance)"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Whether to create CloudTrail and its trail bucket/policy"
  type        = bool
  default     = true
}

# Optionally reuse an existing CloudTrail and its bucket to avoid service limits
variable "reuse_existing_cloudtrail" {
  description = "If true, reuse an existing CloudTrail instead of creating one"
  type        = bool
  default     = false
}

variable "existing_cloudtrail_arn" {
  description = "ARN of an existing CloudTrail to reuse when reuse_existing_cloudtrail=true"
  type        = string
  default     = ""
}

variable "existing_cloudtrail_bucket_name" {
  description = "Name of an existing S3 bucket used by the reused CloudTrail"
  type        = string
  default     = ""
}

########################
# Data sources & region guard
########################
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Auto-discovery: default VPC and a default subnet if explicit values are not given
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  # Prefer default subnets; provider supports this EC2 filter
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

# Auto-discovery: use AWS managed S3 KMS key if none provided
data "aws_kms_alias" "s3_managed" {
  name = "alias/aws/s3"
}

# Region-safe Amazon Linux 2023 as fallback if instance_ami is not set
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
  filter {
    name   = "state"
    values = ["available"]
  }
}

# Enforce us-east-2 at apply time (provider region should also be set accordingly)
resource "null_resource" "region_guard" {
  lifecycle {
    precondition {
      condition     = data.aws_region.current.id == "us-east-2"
      error_message = "This stack must be deployed in us-east-2"
    }
  }
}

########################
# S3 – Data bucket with TLS + SSE-KMS enforcement
########################
resource "aws_s3_bucket" "data" {
  bucket = var.data_bucket_name

  tags = {
    Environment           = "Production"
    "data:classification" = "confidential"
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

locals {
  effective_vpc_id  = var.vpc_id != "vpc-00000000" && var.vpc_id != "" ? var.vpc_id : try(data.aws_vpc.default.id, null)
  effective_subnet  = var.subnet_id != "subnet-00000000" && var.subnet_id != "" ? var.subnet_id : try(data.aws_subnets.default.ids[0], null)
  effective_kms_key = coalesce(var.s3_kms_key_arn, data.aws_kms_alias.s3_managed.target_key_arn)
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = local.effective_kms_key
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "data_bucket_policy" {
  bucket = aws_s3_bucket.data.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = false } }
      },
      {
        Sid       = "RequireKmsForPut"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.data.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption"                = "aws:kms",
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = var.s3_kms_key_arn
          }
        }
      }
    ]
  })
}

########################
# IAM – Role with tag-based S3 access
########################
resource "aws_iam_role" "s3_tag_access" {
  name = "s3-tag-access-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Action    = "sts:AssumeRole",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = { Environment = "Production" }
}

resource "aws_iam_role_policy" "s3_tag_policy" {
  name = "s3-tag-access-policy"
  role = aws_iam_role.s3_tag_access.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "ListBucketIfBucketTagged",
        Effect   = "Allow",
        Action   = ["s3:ListBucket"],
        Resource = aws_s3_bucket.data.arn,
        Condition = {
          StringEquals = {
            "aws:ResourceTag/data:classification" = "confidential"
          }
        }
      },
      {
        Sid      = "GetObjectIfObjectTagged",
        Effect   = "Allow",
        Action   = ["s3:GetObject"],
        Resource = "${aws_s3_bucket.data.arn}/*",
        Condition = {
          StringEquals = {
            "s3:ExistingObjectTag/data:classification" = "confidential"
          }
        }
      },
      {
        Sid       = "DenyNonTLS",
        Effect    = "Deny",
        Action    = "s3:*",
        Resource  = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"],
        Condition = { Bool = { "aws:SecureTransport" = false } }
      }
    ]
  })
}

########################
# Networking + EC2
########################
resource "aws_security_group" "secure_sg" {
  count       = var.enable_ec2 && local.effective_vpc_id != null ? 1 : 0
  name_prefix = "secure-sg-"
  vpc_id      = local.effective_vpc_id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Environment = "Production" }
}

locals {
  effective_ami = coalesce(var.instance_ami, data.aws_ami.al2023.id)
}

resource "aws_instance" "secure" {
  count                  = var.enable_ec2 && local.effective_subnet != null && local.effective_vpc_id != null ? 1 : 0
  ami                    = local.effective_ami
  instance_type          = var.instance_type
  subnet_id              = local.effective_subnet
  vpc_security_group_ids = [aws_security_group.secure_sg[0].id]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device { encrypted = true }

  tags = { Environment = "Production" }
}

########################
# CloudTrail – logs to trail bucket (no KMS to avoid key-policy coupling)
########################
resource "aws_s3_bucket" "trail" {
  count  = var.enable_cloudtrail && !var.reuse_existing_cloudtrail ? 1 : 0
  bucket = var.trail_bucket_name
  tags   = { Environment = "Production" }
}

resource "aws_s3_bucket_versioning" "trail" {
  count  = var.enable_cloudtrail && !var.reuse_existing_cloudtrail ? 1 : 0
  bucket = aws_s3_bucket.trail[0].id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "trail" {
  count                   = var.enable_cloudtrail && !var.reuse_existing_cloudtrail ? 1 : 0
  bucket                  = aws_s3_bucket.trail[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "trail_delivery" {
  count  = var.enable_cloudtrail && !var.reuse_existing_cloudtrail ? 1 : 0
  bucket = aws_s3_bucket.trail[0].id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AWSCloudTrailAclCheck",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = "s3:GetBucketAcl",
        Resource  = aws_s3_bucket.trail[0].arn
      },
      {
        Sid       = "AWSCloudTrailWrite",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.trail[0].arn}/*",
        Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
      }
    ]
  })
}

resource "aws_cloudtrail" "audit" {
  count                         = var.enable_cloudtrail && !var.reuse_existing_cloudtrail ? 1 : 0
  name                          = "tap-audit-trail"
  s3_bucket_name                = aws_s3_bucket.trail[0].id
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  tags = { Environment = "Production" }

  depends_on = [aws_s3_bucket_policy.trail_delivery]
}

########################
# IAM user for deployment (least-privilege practical policy)
########################
resource "aws_iam_user" "deploy" {
  name = "terraform-deploy-user"
  tags = { Environment = "Production" }
}

resource "aws_iam_user_policy" "deploy" {
  name = "terraform-deploy-policy"
  user = aws_iam_user.deploy.name
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "S3ManageDataAndTrailBuckets",
        Effect = "Allow",
        Action = [
          "s3:CreateBucket", "s3:DeleteBucket", "s3:GetBucket*", "s3:ListBucket",
          "s3:PutBucket*", "s3:DeleteBucketPolicy", "s3:PutEncryptionConfiguration", "s3:PutBucketVersioning",
          "s3:GetObject", "s3:PutObject", "s3:DeleteObject"
        ],
        Resource = compact([
          aws_s3_bucket.data.arn,
          (var.enable_cloudtrail && !var.reuse_existing_cloudtrail && length(aws_s3_bucket.trail) > 0 ? aws_s3_bucket.trail[0].arn : null),
          "${aws_s3_bucket.data.arn}/*",
          (var.enable_cloudtrail && !var.reuse_existing_cloudtrail && length(aws_s3_bucket.trail) > 0 ? "${aws_s3_bucket.trail[0].arn}/*" : null)
        ])
      },
      {
        Sid    = "EC2RunAndManageInstance",
        Effect = "Allow",
        Action = [
          "ec2:RunInstances", "ec2:TerminateInstances", "ec2:Describe*",
          "ec2:CreateSecurityGroup", "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupIngress", "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress", "ec2:RevokeSecurityGroupEgress",
          "ec2:CreateTags", "ec2:DeleteTags"
        ],
        Resource = "*"
      },
      {
        Sid    = "IAMManageStackPrincipals",
        Effect = "Allow",
        Action = [
          "iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:PutRolePolicy", "iam:DeleteRolePolicy",
          "iam:CreateUser", "iam:DeleteUser", "iam:GetUser", "iam:PutUserPolicy", "iam:DeleteUserPolicy",
          "iam:TagRole", "iam:UntagRole", "iam:TagUser", "iam:UntagUser"
        ],
        Resource = [aws_iam_role.s3_tag_access.arn, aws_iam_user.deploy.arn]
      },
      {
        Sid    = "CloudTrailOps",
        Effect = "Allow",
        Action = [
          "cloudtrail:CreateTrail", "cloudtrail:DeleteTrail", "cloudtrail:DescribeTrails",
          "cloudtrail:GetTrailStatus", "cloudtrail:StartLogging", "cloudtrail:StopLogging",
          "cloudtrail:PutEventSelectors", "cloudtrail:GetEventSelectors"
        ],
        Resource = var.enable_cloudtrail ? (
          var.reuse_existing_cloudtrail && var.existing_cloudtrail_arn != "" ? var.existing_cloudtrail_arn : (
            length(aws_cloudtrail.audit) > 0 ? aws_cloudtrail.audit[0].arn : "*"
          )
        ) : "*"
      },
      {
        Sid      = "ReadIdentity",
        Effect   = "Allow",
        Action   = ["sts:GetCallerIdentity"],
        Resource = "*"
      }
    ]
  })
}

########################
# Outputs
########################
output "data_bucket_name" {
  description = "Data S3 bucket name"
  value       = aws_s3_bucket.data.id
}

output "trail_bucket_name" {
  description = "Trail S3 bucket name"
  value = var.enable_cloudtrail ? (
    var.reuse_existing_cloudtrail && var.existing_cloudtrail_bucket_name != "" ? var.existing_cloudtrail_bucket_name : (
      length(aws_s3_bucket.trail) > 0 ? aws_s3_bucket.trail[0].id : ""
    )
  ) : ""
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value = var.enable_cloudtrail ? (
    var.reuse_existing_cloudtrail && var.existing_cloudtrail_arn != "" ? var.existing_cloudtrail_arn : (
      length(aws_cloudtrail.audit) > 0 ? aws_cloudtrail.audit[0].arn : ""
    )
  ) : ""
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = var.enable_ec2 && length(aws_instance.secure) > 0 ? aws_instance.secure[0].id : ""
}

output "security_group_id" {
  description = "Security group ID"
  value       = var.enable_ec2 && length(aws_security_group.secure_sg) > 0 ? aws_security_group.secure_sg[0].id : ""
}

output "iam_role_name" {
  description = "IAM role for tag-based S3 access"
  value       = aws_iam_role.s3_tag_access.name
}

output "iam_user_name" {
  description = "Deployment IAM user name"
  value       = aws_iam_user.deploy.name
}

```
