# Variables
variable "aws_region" {
  description = "AWS region for primary resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "v2"
}

variable "vpc_id" {
  description = "VPC ID for Lambda deployment (optional for production)"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda deployment (required if vpc_id is provided)"
  type        = list(string)
  default     = []
}

variable "lambda_config" {
  description = "Lambda function configuration"
  type = object({
    runtime      = optional(string, "nodejs18.x")
    timeout      = optional(number, 300)
    memory_size  = optional(number, 512)
    architecture = optional(string, "x86_64")
  })
  default = {}
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}

# Get default VPC if no VPC ID is provided
data "aws_vpc" "default" {
  count   = var.vpc_id == null ? 1 : 0
  default = true
}

# Get subnets for the VPC
data "aws_subnets" "vpc_subnets" {
  filter {
    name   = "vpc-id"
    values = [local.vpc_id]
  }
  filter {
    name   = "state"
    values = ["available"]
  }
}

# Locals
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  partition  = data.aws_partition.current.partition

  # Project prefix for consistent naming
  project_prefix = "projectXYZ-${var.environment_suffix}"

  # VPC configuration
  vpc_id     = var.vpc_id != null ? var.vpc_id : data.aws_vpc.default[0].id
  subnet_ids = length(var.subnet_ids) > 0 ? var.subnet_ids : data.aws_subnets.vpc_subnets.ids

  # Common tags
  common_tags = {
    Environment = var.environment_suffix
    Project     = local.project_prefix
    ManagedBy   = "terraform"
  }

  # Lambda configuration
  lambda_config = {
    runtime      = var.lambda_config.runtime
    timeout      = var.lambda_config.timeout
    memory_size  = var.lambda_config.memory_size
    architecture = var.lambda_config.architecture
  }
}

# Security Group for Lambda
resource "aws_security_group" "lambda_sg" {
  name        = "${local.project_prefix}-lambda-sg"
  description = "Security group for Lambda data processing function"
  vpc_id      = local.vpc_id

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound for S3/KMS API calls"
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-lambda-sg"
  })
}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3_kms_key" {
  description             = "${local.project_prefix} S3 encryption key"
  enable_key_rotation     = true
  deletion_window_in_days = 7

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Key Management"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${local.partition}:iam::${local.account_id}:root"
        }
        Action = [
          "kms:Create*",
          "kms:Describe*",
          "kms:Enable*",
          "kms:List*",
          "kms:Put*",
          "kms:Update*",
          "kms:Revoke*",
          "kms:Disable*",
          "kms:Get*",
          "kms:Delete*",
          "kms:TagResource",
          "kms:UntagResource",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service Access"
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
            "kms:ViaService" = "s3.${local.region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow Lambda Service Access"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${local.region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs Service Access"
        Effect = "Allow"
        Principal = {
          Service = "logs.${local.region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.project_prefix}-data-processor"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-s3-kms-key"
  })
}

# KMS Key Alias
resource "aws_kms_alias" "s3_kms_key_alias" {
  name          = "alias/${local.project_prefix}-s3-encryption"
  target_key_id = aws_kms_key.s3_kms_key.key_id
}

# S3 Bucket for data processing
resource "aws_s3_bucket" "data_bucket" {
  bucket = "${lower(local.project_prefix)}-data-processing-${local.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-data-processing-bucket"
  })
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {
  bucket = aws_s3_bucket.data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_kms_key.arn
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "data_bucket_pab" {
  bucket = aws_s3_bucket.data_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "data_bucket_policy" {
  bucket = aws_s3_bucket.data_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.data_bucket.arn,
          "${aws_s3_bucket.data_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.data_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# Lambda ZIP file
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.temp-lambda/lambda-function.zip"
}

# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.project_prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-lambda-execution-role"
  })
}

# Attach Lambda VPC execution policy
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Custom IAM Policy for S3 and KMS access
resource "aws_iam_policy" "lambda_s3_kms_policy" {
  name        = "${local.project_prefix}-lambda-s3-kms-policy"
  description = "Policy for Lambda to access S3 bucket and KMS key"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.data_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3_kms_key.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.project_prefix}-*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-lambda-s3-kms-policy"
  })
}

# Attach custom policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_s3_kms_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_s3_kms_policy.arn
}

# Lambda function for data processing
resource "aws_lambda_function" "data_processor" {
  function_name    = "${local.project_prefix}-data-processor"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = local.lambda_config.runtime
  role             = aws_iam_role.lambda_execution_role.arn
  timeout          = local.lambda_config.timeout
  memory_size      = local.lambda_config.memory_size
  architectures    = [local.lambda_config.architecture]
  publish          = var.environment_suffix == "prod"

  vpc_config {
    subnet_ids         = local.subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      BUCKET_NAME    = aws_s3_bucket.data_bucket.bucket
      KMS_KEY_ID     = aws_kms_key.s3_kms_key.key_id
      PROJECT_PREFIX = local.project_prefix
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-data-processor"
  })

  depends_on = [
    aws_iam_role_policy_attachment.lambda_vpc_execution,
    aws_iam_role_policy_attachment.lambda_s3_kms_attachment,
    aws_cloudwatch_log_group.lambda_log_group
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${local.project_prefix}-data-processor"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.s3_kms_key.arn

  tags = local.common_tags
}

# Lambda permission for S3 to invoke the function
resource "aws_lambda_permission" "s3_lambda_permission" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.data_bucket.arn
}

# S3 Bucket Notification to trigger Lambda
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.data_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.data_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "input/"
    filter_suffix       = ".json"
  }

  depends_on = [aws_lambda_permission.s3_lambda_permission]
}

# Outputs
output "bucket_name" {
  description = "Name of the S3 bucket for data processing"
  value       = aws_s3_bucket.data_bucket.bucket
}

output "lambda_function_name" {
  description = "Name of the Lambda function for data processing"
  value       = aws_lambda_function.data_processor.function_name
}

output "kms_key_id" {
  description = "KMS Key ID used for S3 encryption"
  value       = aws_kms_key.s3_kms_key.key_id
}

output "kms_key_arn" {
  description = "KMS Key ARN used for S3 encryption"
  value       = aws_kms_key.s3_kms_key.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

output "security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda_sg.id
}

output "vpc_id" {
  description = "VPC ID used for Lambda deployment"
  value       = local.vpc_id
}

output "subnet_ids" {
  description = "Subnet IDs used for Lambda deployment"
  value       = local.subnet_ids
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = local.region
}