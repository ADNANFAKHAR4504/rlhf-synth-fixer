terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# KMS Key for encryption
resource "aws_kms_key" "fraud_detection" {
  description             = "KMS key for fraud detection system encryption-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "fraud-detection-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "fraud_detection" {
  name          = "alias/fraud-detection-${var.environment_suffix}"
  target_key_id = aws_kms_key.fraud_detection.key_id
}

# S3 Bucket for Audit Trail
resource "aws_s3_bucket" "audit_trail" {
  bucket = "fraud-detection-audit-trail-${var.environment_suffix}"

  tags = {
    Name = "fraud-detection-audit-trail-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.fraud_detection.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB Table for Fraud Patterns
resource "aws_dynamodb_table" "fraud_patterns" {
  name         = "fraud-patterns-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pattern_id"
  range_key    = "timestamp"

  attribute {
    name = "pattern_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.fraud_detection.arn
  }

  tags = {
    Name = "fraud-patterns-${var.environment_suffix}"
  }
}

# ECR Repository for Lambda Container Images
resource "aws_ecr_repository" "lambda_fraud_detector" {
  name                 = "fraud-detector-lambda-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.fraud_detection.arn
  }

  tags = {
    Name = "fraud-detector-lambda-${var.environment_suffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "lambda_fraud_detector" {
  repository = aws_ecr_repository.lambda_fraud_detector.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# SQS Dead Letter Queue
resource "aws_sqs_queue" "fraud_detection_dlq" {
  name                       = "fraud-detection-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 300

  kms_master_key_id = aws_kms_key.fraud_detection.id

  tags = {
    Name = "fraud-detection-dlq-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_fraud_detector" {
  name              = "/aws/lambda/fraud-detector-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.fraud_detection.arn

  tags = {
    Name = "fraud-detector-logs-${var.environment_suffix}"
  }
}
