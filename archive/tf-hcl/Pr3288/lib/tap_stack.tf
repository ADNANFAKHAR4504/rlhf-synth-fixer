# =============================================================================
# AWS Financial Batch Processing Infrastructure
# Complete Terraform Configuration for 1M Daily Transaction Processing
# =============================================================================

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Finance Department"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Transaction Batch Processing"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

variable "transactions_per_job" {
  description = "Number of transactions to process per batch job"
  type        = number
  default     = 10000
}

variable "notification_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "finance-alerts@example.com"
}

variable "max_vcpus" {
  description = "Maximum vCPUs for AWS Batch compute environment"
  type        = number
  default     = 256
}

variable "min_vcpus" {
  description = "Minimum vCPUs for AWS Batch compute environment"
  type        = number
  default     = 0
}

variable "desired_vcpus" {
  description = "Desired vCPUs for AWS Batch compute environment"
  type        = number
  default     = 0
}

variable "compute_type" {
  description = "Type of compute environment (EC2 or FARGATE)"
  type        = string
  default     = "EC2"
  validation {
    condition     = contains(["EC2", "FARGATE"], var.compute_type)
    error_message = "Compute type must be either EC2 or FARGATE."
  }
}

variable "instance_types" {
  description = "List of instance types for AWS Batch compute environment"
  type        = list(string)
  default     = ["c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge"]
}

variable "job_timeout_seconds" {
  description = "Timeout for batch jobs in seconds"
  type        = number
  default     = 14400
}

variable "retry_attempts" {
  description = "Number of retry attempts for failed jobs"
  type        = number
  default     = 3
}

variable "schedule_expression" {
  description = "Schedule expression for triggering the batch processing"
  type        = string
  default     = "cron(0 0 * * ? *)"
}

variable "log_retention_days" {
  description = "CloudWatch logs retention period in days"
  type        = number
  default     = 90
}

# -----------------------------------------------------------------------------
# VPC and Networking Resources
# -----------------------------------------------------------------------------

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-igw"
  }
}

# Public Subnets (for NAT Gateways)
resource "aws_subnet" "public" {
  count                   = var.availability_zones
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-public-subnet-${count.index + 1}"
  }
}

# Private Subnets (for Lambda and Batch)
resource "aws_subnet" "private" {
  count             = var.availability_zones
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-private-subnet-${count.index + 1}"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.availability_zones
  domain = "vpc"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-nat-eip-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.availability_zones
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-public-rt"
  }
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = var.availability_zones
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-private-rt-${count.index + 1}"
  }
}

# Associate Public Subnets with Public Route Table
resource "aws_route_table_association" "public" {
  count          = var.availability_zones
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate Private Subnets with Private Route Tables
resource "aws_route_table_association" "private" {
  count          = var.availability_zones
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# -----------------------------------------------------------------------------
# KMS Keys for Encryption at Rest
# -----------------------------------------------------------------------------

resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "s3-encryption-key"
  }
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/financial-batch/s3"
  target_key_id = aws_kms_key.s3_key.key_id
}

resource "aws_kms_key" "sns_key" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "sns-encryption-key"
  }
}

resource "aws_kms_alias" "sns_key_alias" {
  name          = "alias/financial-batch/sns"
  target_key_id = aws_kms_key.sns_key.key_id
}

resource "aws_kms_key" "dynamodb_key" {
  description             = "KMS key for DynamoDB table encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "dynamodb-encryption-key"
  }
}

resource "aws_kms_alias" "dynamodb_key_alias" {
  name          = "alias/financial-batch/dynamodb"
  target_key_id = aws_kms_key.dynamodb_key.key_id
}

resource "aws_kms_key" "cloudwatch_key" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:${data.aws_partition.current.partition}:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "cloudwatch-encryption-key"
  }
}

resource "aws_kms_alias" "cloudwatch_key_alias" {
  name          = "alias/financial-batch/cloudwatch"
  target_key_id = aws_kms_key.cloudwatch_key.key_id
}

# -----------------------------------------------------------------------------
# S3 Buckets with Full Security Configuration
# -----------------------------------------------------------------------------

# Input Bucket
resource "aws_s3_bucket" "input_bucket" {
  bucket = "financial-batch-input-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "Input Bucket"
  }
}

resource "aws_s3_bucket_versioning" "input_bucket_versioning" {
  bucket = aws_s3_bucket.input_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "input_bucket_encryption" {
  bucket = aws_s3_bucket.input_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "input_bucket_access" {
  bucket = aws_s3_bucket.input_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "input_bucket_policy" {
  bucket = aws_s3_bucket.input_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.input_bucket.arn,
          "${aws_s3_bucket.input_bucket.arn}/*"
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
        Resource  = "${aws_s3_bucket.input_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_logging" "input_bucket_logging" {
  bucket = aws_s3_bucket.input_bucket.id

  target_bucket = aws_s3_bucket.logs_bucket.id
  target_prefix = "input-bucket-logs/"
}

resource "aws_s3_bucket_lifecycle_configuration" "input_bucket_lifecycle" {
  bucket = aws_s3_bucket.input_bucket.id

  rule {
    id     = "archive-old-data"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Output Bucket
resource "aws_s3_bucket" "output_bucket" {
  bucket = "financial-batch-output-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "Output Bucket"
  }
}

resource "aws_s3_bucket_versioning" "output_bucket_versioning" {
  bucket = aws_s3_bucket.output_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "output_bucket_encryption" {
  bucket = aws_s3_bucket.output_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "output_bucket_access" {
  bucket = aws_s3_bucket.output_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "output_bucket_policy" {
  bucket = aws_s3_bucket.output_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.output_bucket.arn,
          "${aws_s3_bucket.output_bucket.arn}/*"
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
        Resource  = "${aws_s3_bucket.output_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_logging" "output_bucket_logging" {
  bucket = aws_s3_bucket.output_bucket.id

  target_bucket = aws_s3_bucket.logs_bucket.id
  target_prefix = "output-bucket-logs/"
}

resource "aws_s3_bucket_lifecycle_configuration" "output_bucket_lifecycle" {
  bucket = aws_s3_bucket.output_bucket.id

  rule {
    id     = "archive-reports"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Logs Bucket (for S3 access logs)
resource "aws_s3_bucket" "logs_bucket" {
  bucket = "financial-batch-logs-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "Access Logs Bucket"
  }
}

resource "aws_s3_bucket_versioning" "logs_bucket_versioning" {
  bucket = aws_s3_bucket.logs_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_bucket_encryption" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logs_bucket_access" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_bucket_lifecycle" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# -----------------------------------------------------------------------------
# DynamoDB Table for Job Status Tracking
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "job_status" {
  name         = "BatchJobStatus"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "JobId"
  range_key    = "Timestamp"

  attribute {
    name = "JobId"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "N"
  }

  attribute {
    name = "Status"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "Status"
    range_key       = "Timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_key.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  ttl {
    attribute_name = "ExpirationTime"
    enabled        = true
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "Batch Job Status Table"
  }
}

# -----------------------------------------------------------------------------
# SNS Topic for Notifications
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "job_notifications" {
  name              = "BatchJobNotifications"
  kms_master_key_id = aws_kms_key.sns_key.id

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sns_topic_policy" "job_notifications_policy" {
  arn = aws_sns_topic.job_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.job_notifications.arn
      },
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_role.arn
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.job_notifications.arn
      },
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.job_notifications.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.job_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups (Created Before Lambda/Batch)
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/BatchJobOrchestrator"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_key.arn

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_log_group" "batch_log_group" {
  name              = "/aws/batch/financial-transaction-processor"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_key.arn

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------------------------------
# IAM Roles and Policies
# -----------------------------------------------------------------------------

# Lambda Execution Role
resource "aws_iam_role" "lambda_role" {
  name = "BatchOrchestratorLambdaRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "BatchOrchestratorPolicy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BatchJobManagement"
        Effect = "Allow"
        Action = [
          "batch:SubmitJob",
          "batch:DescribeJobs",
          "batch:ListJobs",
          "batch:TerminateJob"
        ]
        Resource = [
          aws_batch_job_queue.job_queue.arn,
          aws_batch_job_definition.job_definition.arn,
          "arn:${data.aws_partition.current.partition}:batch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:job/*"
        ]
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.job_status.arn,
          "${aws_dynamodb_table.job_status.arn}/index/*"
        ]
      },
      {
        Sid    = "S3InputAccess"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.input_bucket.arn,
          "${aws_s3_bucket.input_bucket.arn}/*"
        ]
      },
      {
        Sid    = "S3OutputAccess"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.output_bucket.arn,
          "${aws_s3_bucket.output_bucket.arn}/*"
        ]
      },
      {
        Sid      = "SNSPublish"
        Effect   = "Allow"
        Action   = "sns:Publish"
        Resource = aws_sns_topic.job_notifications.arn
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_log_group.arn}:*"
      },
      {
        Sid    = "KMSDecrypt"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.s3_key.arn,
          aws_kms_key.dynamodb_key.arn,
          aws_kms_key.sns_key.arn,
          aws_kms_key.cloudwatch_key.arn
        ]
      },
      {
        Sid    = "XRayTracing"
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Sid    = "VPCNetworkInterfaces"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Sid      = "SQSSendMessage"
        Effect   = "Allow"
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.lambda_dlq.arn
      }
    ]
  })
}

# Batch Service Role
resource "aws_iam_role" "batch_service_role" {
  name = "BatchServiceRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "batch.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "batch_service_role_policy" {
  role       = aws_iam_role.batch_service_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSBatchServiceRole"
}

# Batch Job Execution Role (for EC2 and Fargate)
resource "aws_iam_role" "batch_execution_role" {
  name = "BatchExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "ecs-tasks.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "batch_execution_role_policy" {
  role       = aws_iam_role.batch_execution_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Batch Job Role (permissions for the job container)
resource "aws_iam_role" "batch_job_role" {
  name = "BatchJobRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy" "batch_job_policy" {
  name = "BatchJobPolicy"
  role = aws_iam_role.batch_job_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3InputRead"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.input_bucket.arn}/*"
      },
      {
        Sid      = "S3OutputWrite"
        Effect   = "Allow"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.output_bucket.arn}/*"
      },
      {
        Sid    = "DynamoDBUpdate"
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.job_status.arn
      },
      {
        Sid    = "KMSAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_key.arn,
          aws_kms_key.dynamodb_key.arn
        ]
      },
      {
        Sid      = "CloudWatchMetrics"
        Effect   = "Allow"
        Action   = "cloudwatch:PutMetricData"
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "FinancialBatch"
          }
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "batch_instance_profile" {
  name = "BatchInstanceProfile"
  role = aws_iam_role.batch_execution_role.name
}

# -----------------------------------------------------------------------------
# Security Groups
# -----------------------------------------------------------------------------

resource "aws_security_group" "batch_sg" {
  name        = "batch-compute-sg"
  description = "Security group for Batch compute environment - deny-all default"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "HTTPS within VPC for ECR and other services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_security_group" "lambda_sg" {
  name        = "lambda-orchestrator-sg"
  description = "Security group for Lambda orchestrator"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "HTTPS within VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------------------------------
# VPC Endpoints
# -----------------------------------------------------------------------------

resource "aws_vpc_endpoint" "s3_endpoint" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAccessToSpecificBuckets"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.input_bucket.arn,
          "${aws_s3_bucket.input_bucket.arn}/*",
          aws_s3_bucket.output_bucket.arn,
          "${aws_s3_bucket.output_bucket.arn}/*",
          aws_s3_bucket.logs_bucket.arn,
          "${aws_s3_bucket.logs_bucket.arn}/*"
        ]
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "S3 Gateway Endpoint"
  }
}

resource "aws_vpc_endpoint" "dynamodb_endpoint" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAccessToJobStatusTable"
        Effect    = "Allow"
        Principal = "*"
        Action    = "dynamodb:*"
        Resource = [
          aws_dynamodb_table.job_status.arn,
          "${aws_dynamodb_table.job_status.arn}/*"
        ]
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "DynamoDB Gateway Endpoint"
  }
}

resource "aws_vpc_endpoint" "ecr_api_endpoint" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.batch_sg.id]
  private_dns_enabled = true

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_vpc_endpoint" "ecr_dkr_endpoint" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.batch_sg.id]
  private_dns_enabled = true

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_vpc_endpoint" "logs_endpoint" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.batch_sg.id, aws_security_group.lambda_sg.id]
  private_dns_enabled = true

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------------------------------
# AWS Batch Configuration
# -----------------------------------------------------------------------------

resource "aws_batch_compute_environment" "compute_env" {
  type         = "MANAGED"
  state        = "ENABLED"
  service_role = aws_iam_role.batch_service_role.arn

  compute_resources {
    type               = var.compute_type
    max_vcpus          = var.max_vcpus
    min_vcpus          = var.min_vcpus
    desired_vcpus      = var.desired_vcpus
    instance_type      = var.compute_type == "EC2" ? var.instance_types : []
    subnets            = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.batch_sg.id]
    instance_role      = var.compute_type == "EC2" ? aws_iam_instance_profile.batch_instance_profile.arn : null
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    Name        = "financial-batch-compute-env"
  }

  depends_on = [aws_iam_role_policy_attachment.batch_service_role_policy]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_batch_job_queue" "job_queue" {
  name     = "financial-batch-job-queue"
  state    = "ENABLED"
  priority = 1

  compute_environment_order {
    order               = 1
    compute_environment = aws_batch_compute_environment.compute_env.arn
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_batch_job_definition" "job_definition" {
  name = "financial-transaction-processor"
  type = "container"

  platform_capabilities = [var.compute_type == "FARGATE" ? "FARGATE" : "EC2"]

  container_properties = jsonencode({
    image = "public.ecr.aws/docker/library/busybox:latest"

    resourceRequirements = var.compute_type == "FARGATE" ? [
      { type = "VCPU", value = "0.25" },
      { type = "MEMORY", value = "512" }
      ] : [
      { type = "VCPU", value = "2" },
      { type = "MEMORY", value = "4096" }
    ]

    environment = [
      { name = "INPUT_BUCKET", value = aws_s3_bucket.input_bucket.bucket },
      { name = "OUTPUT_BUCKET", value = aws_s3_bucket.output_bucket.bucket },
      { name = "DYNAMODB_TABLE", value = aws_dynamodb_table.job_status.name },
      { name = "AWS_REGION", value = var.aws_region },
      { name = "TRANSACTIONS_PER_JOB", value = tostring(var.transactions_per_job) }
    ]

    jobRoleArn       = aws_iam_role.batch_job_role.arn
    executionRoleArn = aws_iam_role.batch_execution_role.arn

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.batch_log_group.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "batch-job"
      }
    }

    networkConfiguration = var.compute_type == "FARGATE" ? {
      assignPublicIp = "DISABLED"
    } : null
  })

  retry_strategy {
    attempts = var.retry_attempts
    evaluate_on_exit {
      action           = "RETRY"
      on_status_reason = "Task failed to start"
    }
    evaluate_on_exit {
      action       = "EXIT"
      on_exit_code = "0"
    }
  }

  timeout {
    attempt_duration_seconds = var.job_timeout_seconds
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------------------------------
# Lambda Function
# -----------------------------------------------------------------------------

resource "aws_lambda_function" "orchestrator" {
  function_name = "BatchJobOrchestrator"
  role          = aws_iam_role.lambda_role.arn

  filename         = "${path.module}/lambda_function.zip"
  source_code_hash = fileexists("${path.module}/lambda_function.zip") ? filebase64sha256("${path.module}/lambda_function.zip") : null

  handler = "lambda_function.handler"
  runtime = "nodejs20.x"
  timeout = 300
  memory_size = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      JOB_QUEUE            = aws_batch_job_queue.job_queue.arn
      JOB_DEFINITION       = aws_batch_job_definition.job_definition.arn
      DYNAMODB_TABLE       = aws_dynamodb_table.job_status.name
      SNS_TOPIC            = aws_sns_topic.job_notifications.arn
      INPUT_BUCKET         = aws_s3_bucket.input_bucket.bucket
      TRANSACTIONS_PER_JOB = tostring(var.transactions_per_job)
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_log_group
  ]
}

# Dead Letter Queue for Lambda
resource "aws_sqs_queue" "lambda_dlq" {
  name                      = "lambda-orchestrator-dlq"
  message_retention_seconds = 1209600

  kms_master_key_id = aws_kms_key.sns_key.id

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_sqs_queue_policy" "lambda_dlq_policy" {
  queue_url = aws_sqs_queue.lambda_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaToSendMessages"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.lambda_dlq.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_lambda_function.orchestrator.arn
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# EventBridge Scheduling
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "batch_trigger" {
  name                = "trigger-batch-processing"
  description         = "Trigger nightly batch processing"
  schedule_expression = var.schedule_expression

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.batch_trigger.name
  target_id = "InvokeLambda"
  arn       = aws_lambda_function.orchestrator.arn

  dead_letter_config {
    arn = aws_sqs_queue.lambda_dlq.arn
  }

  retry_policy {
    maximum_retry_attempts       = 2
    maximum_event_age_in_seconds = 3600  # 1 hour
  }
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orchestrator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.batch_trigger.arn
}

# -----------------------------------------------------------------------------
# CloudWatch Monitoring and Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "job_failures" {
  alarm_name          = "BatchJobFailures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Failed"
  namespace           = "AWS/Batch"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when batch jobs fail"
  alarm_actions       = [aws_sns_topic.job_notifications.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    JobQueue = aws_batch_job_queue.job_queue.name
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "LambdaOrchestratorErrors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Alert when Lambda orchestrator has errors"
  alarm_actions       = [aws_sns_topic.job_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.orchestrator.function_name
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_time_breach" {
  alarm_name          = "BatchProcessingTimeBreach"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ProcessingDuration"
  namespace           = "FinancialBatch"
  period              = 300
  statistic           = "Maximum"
  threshold           = 14400
  alarm_description   = "Alert when batch processing exceeds 4-hour window"
  alarm_actions       = [aws_sns_topic.job_notifications.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_dashboard" "batch_dashboard" {
  dashboard_name = "FinancialBatchProcessing"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Batch", "Succeeded", { stat = "Sum", label = "Succeeded Jobs" }],
            [".", "Failed", { stat = "Sum", label = "Failed Jobs" }],
            [".", "Submitted", { stat = "Sum", label = "Submitted Jobs" }],
            [".", "Running", { stat = "Sum", label = "Running Jobs" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Batch Job Status"
          period  = 300
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum" }],
            [".", "Duration", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Orchestrator Metrics"
          period  = 300
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CloudTrail for Audit Logging
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket = "financial-batch-cloudtrail-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_bucket_versioning" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_bucket_encryption" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudwatch_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_bucket_access" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail_bucket.arn,
          "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
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

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_bucket_lifecycle" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  rule {
    id     = "archive-old-trails"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555
    }
  }
}

resource "aws_cloudtrail" "main" {
  name                          = "financial-batch-audit-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_bucket.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudwatch_key.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.input_bucket.arn}/*",
        "${aws_s3_bucket.output_bucket.arn}/*"
      ]
    }

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = [aws_dynamodb_table.job_status.arn]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = [aws_lambda_function.orchestrator.arn]
    }
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]
}

# -----------------------------------------------------------------------------
# VPC Flow Logs
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flow-logs"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_key.arn

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role" "flow_log_role" {
  name = "VPCFlowLogRole-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "VPCFlowLogPolicy"
  role = aws_iam_role.flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.vpc_flow_log.arn}:*"
      }
    ]
  })
}

resource "aws_flow_log" "vpc_flow_log" {
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------------------------------
# GuardDuty with EventBridge Notification
# -----------------------------------------------------------------------------

# Import existing GuardDuty detector instead of creating new one
data "aws_guardduty_detector" "main" {}

resource "aws_guardduty_detector_feature" "s3_protection" {
  detector_id = data.aws_guardduty_detector.main.id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "guardduty-findings-alert"
  description = "Alert on GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [4, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6, 6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9]
    }
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.job_notifications.arn
}

# -----------------------------------------------------------------------------
# AWS Config for Compliance
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "config_bucket" {
  bucket = "financial-batch-config-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "config_bucket_versioning" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_encryption" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudwatch_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config_bucket_access" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config_bucket_policy" {
  bucket = aws_s3_bucket.config_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.config_bucket.arn,
          "${aws_s3_bucket.config_bucket.arn}/*"
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

resource "aws_iam_role" "config_role" {
  name = "AWSConfigRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "ConfigS3Policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.config_bucket.arn,
          "${aws_s3_bucket.config_bucket.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = "sns:Publish"
        Resource = aws_sns_topic.job_notifications.arn
      }
    ]
  })
}

resource "aws_config_configuration_recorder" "main" {
  name     = "financial-batch-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Note: AWS Config only allows one delivery channel per region
# Commenting out to avoid conflict with existing channel
# resource "aws_config_delivery_channel" "main" {
#   name           = "financial-batch-config-delivery"
#   s3_bucket_name = aws_s3_bucket.config_bucket.bucket
#   sns_topic_arn  = aws_sns_topic.job_notifications.arn
#   depends_on = [aws_config_configuration_recorder.main]
# }

# Disabled because delivery channel is commented out due to AWS limit
# resource "aws_config_configuration_recorder_status" "main" {
#   name       = aws_config_configuration_recorder.main.name
#   is_enabled = true
#   depends_on = [aws_config_delivery_channel.main]
# }

resource "aws_config_config_rule" "s3_encryption" {
  name = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_config_config_rule" "dynamodb_encryption" {
  name = "dynamodb-table-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "DYNAMODB_TABLE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "batch_compute_environment_arn" {
  description = "ARN of the AWS Batch compute environment"
  value       = aws_batch_compute_environment.compute_env.arn
}

output "batch_job_queue_arn" {
  description = "ARN of the AWS Batch job queue"
  value       = aws_batch_job_queue.job_queue.arn
}

output "batch_job_definition_arn" {
  description = "ARN of the AWS Batch job definition"
  value       = aws_batch_job_definition.job_definition.arn
}

output "lambda_function_arn" {
  description = "ARN of the orchestrator Lambda function"
  value       = aws_lambda_function.orchestrator.arn
}

output "lambda_function_name" {
  description = "Name of the orchestrator Lambda function"
  value       = aws_lambda_function.orchestrator.function_name
}

output "input_bucket_name" {
  description = "Name of the S3 input bucket"
  value       = aws_s3_bucket.input_bucket.bucket
}

output "output_bucket_name" {
  description = "Name of the S3 output bucket"
  value       = aws_s3_bucket.output_bucket.bucket
}

output "logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = aws_s3_bucket.logs_bucket.bucket
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB job status table"
  value       = aws_dynamodb_table.job_status.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB job status table"
  value       = aws_dynamodb_table.job_status.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS notification topic"
  value       = aws_sns_topic.job_notifications.arn
}

output "kms_s3_key_id" {
  description = "ID of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_key.key_id
}

output "kms_s3_key_arn" {
  description = "ARN of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_key.arn
}

output "kms_sns_key_arn" {
  description = "ARN of the KMS key used for SNS encryption"
  value       = aws_kms_key.sns_key.arn
}

output "kms_dynamodb_key_arn" {
  description = "ARN of the KMS key used for DynamoDB encryption"
  value       = aws_kms_key.dynamodb_key.arn
}

output "kms_cloudwatch_key_arn" {
  description = "ARN of the KMS key used for CloudWatch Logs encryption"
  value       = aws_kms_key.cloudwatch_key.arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = data.aws_guardduty_detector.main.id
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.main.arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.batch_dashboard.dashboard_name
}

output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3_endpoint.id
}

output "dynamodb_vpc_endpoint_id" {
  description = "ID of the DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb_endpoint.id
}

output "vpc_flow_log_id" {
  description = "ID of the VPC flow log"
  value       = aws_flow_log.vpc_flow_log.id
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

