# Variables definition
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.aws_region))
    error_message = "AWS region must be a valid region identifier."
  }
}

variable "aws_account_id" {
  description = "AWS Account ID for staging environment"
  type        = string
  default     = "123456789012"

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "AWS Account ID must be exactly 12 digits."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "myproject"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "myproject-app"
}

variable "circleci_org_id" {
  description = "CircleCI organization ID for OIDC (will be made unique with environment suffix)"
  type        = string
  default     = "circleci-org"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts (supports randomness)"
  type        = string
  default     = ""

  validation {
    condition     = can(regex("^[a-z0-9]*$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters and numbers."
  }
}

# S3 Bucket for Application Artifacts
resource "aws_s3_bucket" "artifacts" {
  bucket        = local.s3_artifacts_name
  force_destroy = true # Enable force destroy for rollback

  tags = merge(local.common_tags, {
    Name      = local.s3_artifacts_name
    Purpose   = "application-artifacts"
    Retention = "30-days"
  })
}

resource "aws_s3_bucket_versioning" "artifacts_versioning" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts_encryption" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts_pab" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts_lifecycle" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    filter {} # Required empty filter to apply to all objects

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket        = local.s3_terraform_state
  force_destroy = true # Enable force destroy for rollback

  tags = merge(local.common_tags, {
    Name    = local.s3_terraform_state
    Purpose = "terraform-state"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_encryption" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state_pab" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for Terraform state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name                        = local.dynamodb_tf_locks
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "LockID"
  deletion_protection_enabled = false # Allow deletion for rollback

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name    = local.dynamodb_tf_locks
    Purpose = "terraform-state-locking"
  })
}

# OIDC Provider for CircleCI
resource "aws_iam_openid_connect_provider" "circleci" {
  url = "https://oidc.circleci.com/org/${var.circleci_org_id}-${local.environment_suffix}"

  client_id_list = [
    "${var.circleci_org_id}-${local.environment_suffix}"
  ]

  # CircleCI OIDC thumbprint (as of 2024)
  thumbprint_list = [
    "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"
  ]

  tags = merge(local.common_tags, {
    Name    = "circleci-oidc-provider"
    Purpose = "circleci-authentication"
  })
}

# IAM Role for CircleCI
resource "aws_iam_role" "circleci_role" {
  name = local.iam_circleci_role

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.circleci.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "oidc.circleci.com/org/${var.circleci_org_id}-${local.environment_suffix}:sub" = "org/${var.circleci_org_id}-${local.environment_suffix}/project/*"
          }
        }
      }
    ]
  })

  max_session_duration = 3600 # 1 hour

  tags = merge(local.common_tags, {
    Name    = local.iam_circleci_role
    Purpose = "circleci-deployment"
  })
}

# IAM Policy for CircleCI Role - S3 Access
resource "aws_iam_role_policy" "circleci_s3_policy" {
  name = "${local.iam_circleci_policy}-s3"
  role = aws_iam_role.circleci_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "${aws_s3_bucket.artifacts.arn}/*",
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketVersioning",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          aws_s3_bucket.terraform_state.arn
        ]
      }
    ]
  })
}

# IAM Policy for CircleCI Role - DynamoDB Access
resource "aws_iam_role_policy" "circleci_dynamodb_policy" {
  name = "${local.iam_circleci_policy}-dynamodb"
  role = aws_iam_role.circleci_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable"
        ]
        Resource = aws_dynamodb_table.terraform_locks.arn
      }
    ]
  })
}

# IAM Policy for CircleCI Role - CloudWatch Logs
resource "aws_iam_role_policy" "circleci_logs_policy" {
  name = "${local.iam_circleci_policy}-logs"
  role = aws_iam_role.circleci_role.id

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
          "logs:DescribeLogStreams",
          "logs:PutRetentionPolicy"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:${local.logs_app_group}*"
      }
    ]
  })
}

# IAM Policy for CircleCI Role - Basic AWS Services
resource "aws_iam_role_policy" "circleci_basic_policy" {
  name = "${local.iam_circleci_policy}-basic"
  role = aws_iam_role.circleci_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sts:GetCallerIdentity",
          "sts:AssumeRole"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:PassRole"
        ]
        Resource = aws_iam_role.circleci_role.arn
      }
    ]
  })
}

# CloudWatch Log Group for Application Logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/application/${local.name_prefix}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name    = local.logs_app_group
    Purpose = "application-logging"
  })
}

# CloudWatch Log Group for Pipeline Logs
resource "aws_cloudwatch_log_group" "pipeline_logs" {
  name              = "/aws/circleci/${local.name_prefix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name    = "logs-${var.project_name}-pipeline"
    Purpose = "pipeline-logging"
  })
}

# Outputs
output "artifacts_bucket_name" {
  description = "Name of the S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "artifacts_bucket_arn" {
  description = "ARN of the S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.arn
}

output "terraform_state_bucket_name" {
  description = "Name of the Terraform state bucket"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "terraform_locks_table_name" {
  description = "Name of the DynamoDB table for Terraform locks"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "circleci_role_arn" {
  description = "ARN of the IAM role for CircleCI"
  value       = aws_iam_role.circleci_role.arn
}

output "circleci_role_name" {
  description = "Name of the IAM role for CircleCI"
  value       = aws_iam_role.circleci_role.name
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for applications"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "cloudwatch_pipeline_log_group_name" {
  description = "Name of the CloudWatch log group for pipeline"
  value       = aws_cloudwatch_log_group.pipeline_logs.name
}

output "aws_account_id" {
  description = "Current AWS Account ID"
  value       = local.account_id
}

output "aws_region" {
  description = "Current AWS Region"
  value       = local.region
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.environment_suffix
}

output "project_name" {
  description = "Project name used for resource naming"
  value       = var.project_name
}
