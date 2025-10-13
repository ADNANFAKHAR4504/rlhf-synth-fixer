```hcl
# variables.tf
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "healthcare-ml"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "data_retention_days" {
  description = "Days to retain processed data"
  type        = number
  default     = 90
}

variable "model_retention_days" {
  description = "Days to retain model artifacts"
  type        = number
  default     = 365
}

variable "enable_vpc_mode" {
  description = "Enable VPC mode for SageMaker"
  type        = bool
  default     = true
}

variable "vpc_id" {
  description = "VPC ID for SageMaker (required if enable_vpc_mode is true)"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "Subnet IDs for SageMaker (required if enable_vpc_mode is true)"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs for SageMaker"
  type        = list(string)
  default     = []
}

variable "lambda_memory_size" {
  description = "Memory size for preprocessing Lambda"
  type        = number
  default     = 3008
}

variable "lambda_timeout" {
  description = "Timeout for preprocessing Lambda in seconds"
  type        = number
  default     = 900
}

variable "sagemaker_instance_type" {
  description = "SageMaker training instance type"
  type        = string
  default     = "ml.m5.4xlarge"
}

variable "sagemaker_instance_count" {
  description = "Number of SageMaker training instances"
  type        = number
  default     = 1
}

variable "endpoint_instance_type" {
  description = "SageMaker endpoint instance type"
  type        = string
  default     = "ml.m5.xlarge"
}

variable "endpoint_instance_count" {
  description = "Number of SageMaker endpoint instances"
  type        = number
  default     = 2
}

variable "pipeline_schedule_expression" {
  description = "EventBridge schedule expression for pipeline"
  type        = string
  default     = "rate(1 day)"
}

variable "alarm_email" {
  description = "Email for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

locals {
  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  )
  
  resource_prefix = "${var.project_name}-${var.environment}"
}
```

```hcl
# kms.tf
# S3 encryption key
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-s3-kms"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${local.resource_prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# DynamoDB encryption key
resource "aws_kms_key" "dynamodb" {
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-dynamodb-kms"
  })
}

resource "aws_kms_alias" "dynamodb" {
  name          = "alias/${local.resource_prefix}-dynamodb"
  target_key_id = aws_kms_key.dynamodb.key_id
}

# SageMaker encryption key
resource "aws_kms_key" "sagemaker" {
  description             = "KMS key for SageMaker encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-sagemaker-kms"
  })
}

resource "aws_kms_alias" "sagemaker" {
  name          = "alias/${local.resource_prefix}-sagemaker"
  target_key_id = aws_kms_key.sagemaker.key_id
}

# CloudWatch Logs encryption key
resource "aws_kms_key" "cloudwatch" {
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
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Enable CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.region}.amazonaws.com"
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
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-cloudwatch-kms"
  })
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/${local.resource_prefix}-cloudwatch"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

data "aws_caller_identity" "current" {}
```

```hcl
# s3.tf
# S3 bucket for access logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "${local.resource_prefix}-access-logs"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-access-logs"
  })
}

resource "aws_s3_bucket_acl" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  acl    = "log-delivery-write"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  
  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    
    expiration {
      days = 30
    }
  }
}

# Raw data bucket
resource "aws_s3_bucket" "raw_data" {
  bucket = "${local.resource_prefix}-raw-data"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-raw-data"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id
  
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "raw-data/"
}

resource "aws_s3_bucket_lifecycle_configuration" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id
  
  rule {
    id     = "archive-old-data"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# Processed data bucket
resource "aws_s3_bucket" "processed_data" {
  bucket = "${local.resource_prefix}-processed-data"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-processed-data"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id
  
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "processed-data/"
}

resource "aws_s3_bucket_lifecycle_configuration" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id
  
  rule {
    id     = "delete-old-processed-data"
    status = "Enabled"
    
    expiration {
      days = var.data_retention_days
    }
  }
}

# Model artifacts bucket
resource "aws_s3_bucket" "model_artifacts" {
  bucket = "${local.resource_prefix}-model-artifacts"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-model-artifacts"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id
  
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "model-artifacts/"
}

resource "aws_s3_bucket_lifecycle_configuration" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id
  
  rule {
    id     = "archive-old-models"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    
    expiration {
      days = var.model_retention_days
    }
  }
}

# Bucket policies to enforce TLS
resource "aws_s3_bucket_policy" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.raw_data.arn,
          "${aws_s3_bucket.raw_data.arn}/*"
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

resource "aws_s3_bucket_policy" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.processed_data.arn,
          "${aws_s3_bucket.processed_data.arn}/*"
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

resource "aws_s3_bucket_policy" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.model_artifacts.arn,
          "${aws_s3_bucket.model_artifacts.arn}/*"
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
```

```hcl
# dynamodb.tf
resource "aws_dynamodb_table" "pipeline_metadata" {
  name         = "${local.resource_prefix}-pipeline-metadata"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pipeline_id"
  range_key    = "timestamp"
  
  attribute {
    name = "pipeline_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-pipeline-metadata"
  })
}
```

```hcl
# iam.tf
# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.resource_prefix}-lambda-execution-role"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_s3_access" {
  name = "${local.resource_prefix}-lambda-s3-policy"
  role = aws_iam_role.lambda_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.raw_data.arn,
          "${aws_s3_bucket.raw_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.processed_data.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_kms_access" {
  name = "${local.resource_prefix}-lambda-kms-policy"
  role = aws_iam_role.lambda_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_cloudwatch_logs" {
  name = "${local.resource_prefix}-lambda-logs-policy"
  role = aws_iam_role.lambda_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_dynamodb_access" {
  name = "${local.resource_prefix}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.pipeline_metadata.arn
      }
    ]
  })
}

# SageMaker execution role
resource "aws_iam_role" "sagemaker_execution" {
  name = "${local.resource_prefix}-sagemaker-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "sagemaker.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "sagemaker_s3_access" {
  name = "${local.resource_prefix}-sagemaker-s3-policy"
  role = aws_iam_role.sagemaker_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.processed_data.arn,
          "${aws_s3_bucket.processed_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          "${aws_s3_bucket.model_artifacts.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "sagemaker_kms_access" {
  name = "${local.resource_prefix}-sagemaker-kms-policy"
  role = aws_iam_role.sagemaker_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = [
          aws_kms_key.s3.arn,
          aws_kms_key.sagemaker.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "sagemaker_cloudwatch" {
  name = "${local.resource_prefix}-sagemaker-cloudwatch-policy"
  role = aws_iam_role.sagemaker_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sagemaker_full_access" {
  role       = aws_iam_role.sagemaker_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
}

# VPC policy for SageMaker (if VPC mode enabled)
resource "aws_iam_role_policy" "sagemaker_vpc" {
  count = var.enable_vpc_mode ? 1 : 0
  name  = "${local.resource_prefix}-sagemaker-vpc-policy"
  role  = aws_iam_role.sagemaker_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:CreateNetworkInterfacePermission",
          "ec2:DeleteNetworkInterface",
          "ec2:DeleteNetworkInterfacePermission",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeVpcs",
          "ec2:DescribeDhcpOptions",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# Step Functions execution role
resource "aws_iam_role" "step_functions_execution" {
  name = "${local.resource_prefix}-stepfunctions-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "step_functions_lambda" {
  name = "${local.resource_prefix}-stepfunctions-lambda-policy"
  role = aws_iam_role.step_functions_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.preprocessing.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "step_functions_sagemaker" {
  name = "${local.resource_prefix}-stepfunctions-sagemaker-policy"
  role = aws_iam_role.step_functions_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sagemaker:CreateTrainingJob",
          "sagemaker:DescribeTrainingJob",
          "sagemaker:StopTrainingJob",
          "sagemaker:CreateModel",
          "sagemaker:CreateEndpointConfig",
          "sagemaker:CreateEndpoint",
          "sagemaker:UpdateEndpoint",
          "sagemaker:DescribeEndpoint",
          "sagemaker:CreateModelPackage",
          "sagemaker:DescribeModelPackage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = "iam:PassRole"
        Resource = aws_iam_role.sagemaker_execution.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "step_functions_cloudwatch" {
  name = "${local.resource_prefix}-stepfunctions-cloudwatch-policy"
  role = aws_iam_role.step_functions_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "step_functions_dynamodb" {
  name = "${local.resource_prefix}-stepfunctions-dynamodb-policy"
  role = aws_iam_role.step_functions_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.pipeline_metadata.arn
      }
    ]
  })
}

# EventBridge role
resource "aws_iam_role" "eventbridge" {
  name = "${local.resource_prefix}-eventbridge-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "eventbridge_stepfunctions" {
  name = "${local.resource_prefix}-eventbridge-stepfunctions-policy"
  role = aws_iam_role.eventbridge.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.ml_pipeline.arn
      }
    ]
  })
}
```

```hcl
# lambda.tf
resource "aws_lambda_function" "preprocessing" {
  filename         = "preprocessing_lambda.zip"
  function_name    = "${local.resource_prefix}-preprocessing"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("preprocessing_lambda.zip")
  runtime         = "python3.9"
  memory_size     = var.lambda_memory_size
  timeout         = var.lambda_timeout
  
  environment {
    variables = {
      RAW_DATA_BUCKET       = aws_s3_bucket.raw_data.id
      PROCESSED_DATA_BUCKET = aws_s3_bucket.processed_data.id
      METADATA_TABLE        = aws_dynamodb_table.pipeline_metadata.name
      KMS_KEY_ID           = aws_kms_key.s3.id
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-preprocessing"
  })
}

resource "aws_cloudwatch_log_group" "preprocessing_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.preprocessing.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn
  
  tags = local.common_tags
}

# Create placeholder lambda deployment package
resource "local_file" "preprocessing_lambda_code" {
  filename = "preprocessing_lambda.py"
  content  = <<-EOT
import json
import boto3
import os
from datetime import datetime
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Preprocessing Lambda function for medical data
    """
    try:
        # Log start
        logger.info(f"Starting preprocessing: {json.dumps(event)}")
        
        # Get environment variables
        raw_bucket = os.environ['RAW_DATA_BUCKET']
        processed_bucket = os.environ['PROCESSED_DATA_BUCKET']
        metadata_table = os.environ['METADATA_TABLE']
        
        # Extract input parameters
        input_key = event.get('input_key')
        pipeline_id = event.get('pipeline_id')
        
        # Record start in DynamoDB
        table = dynamodb.Table(metadata_table)
        table.put_item(
            Item={
                'pipeline_id': pipeline_id,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'PREPROCESSING',
                'input_key': input_key
            }
        )
        
        # TODO: Implement actual preprocessing logic
        # This is a placeholder - replace with actual medical data processing
        
        # Simulate processing
        output_key = f"processed/{pipeline_id}/{input_key}"
        
        # Put metrics
        cloudwatch.put_metric_data(
            Namespace='HealthcareMLPipeline',
            MetricData=[
                {
                    'MetricName': 'PreprocessingCompleted',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'pipeline_id': pipeline_id,
                'output_key': output_key,
                'status': 'SUCCESS'
            })
        }
        
    except Exception as e:
        logger.error(f"Preprocessing failed: {str(e)}")
        
        # Put error metric
        cloudwatch.put_metric_data(
            Namespace='HealthcareMLPipeline',
            MetricData=[
                {
                    'MetricName': 'PreprocessingFailed',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
        
        raise e
EOT
}

data "archive_file" "preprocessing_lambda" {
  type        = "zip"
  source_file = local_file.preprocessing_lambda_code.filename
  output_path = "preprocessing_lambda.zip"
}
```

```hcl
# sagemaker.tf
# Model package group for model registry
resource "aws_sagemaker_model_package_group" "ml_models" {
  model_package_group_name = "${local.resource_prefix}-models"
  
  model_package_group_description = "Healthcare ML models"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-model-package-group"
  })
}

# Endpoint configuration 
resource "aws_sagemaker_endpoint_configuration" "ml_endpoint_config" {
  name = "${local.resource_prefix}-endpoint-config-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  production_variants {
    variant_name           = "primary"
    model_name            = "${local.resource_prefix}-model"  # This will be created by Step Functions
    initial_instance_count = var.endpoint_instance_count
    instance_type         = var.endpoint_instance_type
    initial_variant_weight = 1
  }
  
  data_capture_config {
    enable_capture = true
    
    initial_sampling_percentage = 100
    
    destination_s3_uri = "s3://${aws_s3_bucket.model_artifacts.id}/data-capture"
    
    capture_options {
      capture_mode = "Input"
    }
    
    capture_options {
      capture_mode = "Output"
    }
    
    capture_content_type_header {
      json_content_types = ["application/json"]
    }
  }
  
  kms_key_id = aws_kms_key.sagemaker.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-endpoint-config"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# Endpoint
resource "aws_sagemaker_endpoint" "ml_endpoint" {
  name                 = "${local.resource_prefix}-endpoint"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.ml_endpoint_config.name
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-endpoint"
  })
  
  depends_on = [aws_sagemaker_endpoint_configuration.ml_endpoint_config]
}

# Notebook instance for development (optional)
resource "aws_sagemaker_notebook_instance" "ml_notebook" {
  count = var.environment == "dev" ? 1 : 0
  
  name          = "${local.resource_prefix}-notebook"
  role_arn      = aws_iam_role.sagemaker_execution.arn
  instance_type = "ml.t3.medium"
  
  subnet_id              = var.enable_vpc_mode && length(var.subnet_ids) > 0 ? var.subnet_ids[0] : null
  security_groups        = var.enable_vpc_mode ? var.security_group_ids : null
  kms_key_id            = aws_kms_key.sagemaker.id
  volume_size_in_gb     = 30
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-notebook"
  })
}
```

```hcl
# stepfunctions.tf
resource "aws_sfn_state_machine" "ml_pipeline" {
  name     = "${local.resource_prefix}-ml-pipeline"
  role_arn = aws_iam_role.step_functions_execution.arn
  
  definition = jsonencode({
    Comment = "Healthcare ML Pipeline"
    StartAt = "InitializePipeline"
    States = {
      InitializePipeline = {
        Type = "Pass"
        Parameters = {
          "pipeline_id.$" = "$$.Execution.Name"
          "timestamp.$"   = "$$.State.EnteredTime"
          "input_key.$"   = "$.input_key"
        }
        ResultPath = "$.pipeline"
        Next       = "RecordPipelineStart"
      }
      
      RecordPipelineStart = {
        Type = "Task"
        Resource = "arn:aws:states:::dynamodb:putItem"
        Parameters = {
          TableName = aws_dynamodb_table.pipeline_metadata.name
          Item = {
            "pipeline_id" = {"S.$" = "$.pipeline.pipeline_id"}
            "timestamp"   = {"S.$" = "$.pipeline.timestamp"}
            "status"      = {"S" = "STARTED"}
          }
        }
        ResultPath = null
        Next       = "PreprocessData"
      }
      
      PreprocessData = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.preprocessing.function_name
          "Payload.$"  = "$"
        }
        ResultPath     = "$.preprocessing_result"
        OutputPath     = "$.preprocessing_result.Payload.body"
        TimeoutSeconds = 900
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed", "Lambda.ServiceException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "RecordFailure"
          }
        ]
        Next = "StartTrainingJob"
      }
      
      StartTrainingJob = {
        Type = "Task"
        Resource = "arn:aws:states:::sagemaker:createTrainingJob.sync"
        Parameters = {
          TrainingJobName = "${local.resource_prefix}-training-job.$"
          RoleArn        = aws_iam_role.sagemaker_execution.arn
          
          AlgorithmSpecification = {
            TrainingImage     = "382416733822.dkr.ecr.${var.region}.amazonaws.com/xgboost:latest"
            TrainingInputMode = "File"
          }
          
          InputDataConfig = [
            {
              ChannelName = "train"
              DataSource = {
                S3DataSource = {
                  S3DataType         = "S3Prefix"
                  S3Uri              = "s3://${aws_s3_bucket.processed_data.id}/processed"
                  S3DataDistributionType = "FullyReplicated"
                }
              }
            }
          ]
          
          OutputDataConfig = {
            S3OutputPath = "s3://${aws_s3_bucket.model_artifacts.id}/models"
            KmsKeyId     = aws_kms_key.sagemaker.id
          }
          
          ResourceConfig = {
            InstanceType   = var.sagemaker_instance_type
            InstanceCount  = var.sagemaker_instance_count
            VolumeSizeInGB = 100
            VolumeKmsKeyId = aws_kms_key.sagemaker.id
          }
          
          StoppingCondition = {
            MaxRuntimeInSeconds = 3600
          }
          
          HyperParameters = {
            objective     = "binary:logistic"
            num_round     = "100"
            eval_metric   = "auc"
          }
          
          EnableNetworkIsolation = false
          EnableInterContainerTrafficEncryption = true
        }
        
        Dynamic "Parameters" {
          for_each = var.enable_vpc_mode ? [1] : []
          content {
            VpcConfig = {
              SecurityGroupIds = var.security_group_ids
              Subnets         = var.subnet_ids
            }
          }
        }
        
        ResultPath = "$.training_result"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "RecordFailure"
          }
        ]
        Next = "RegisterModel"
      }
      
      RegisterModel = {
        Type = "Task"
        Resource = "arn:aws:states:::sagemaker:createModel"
        Parameters = {
          ModelName = "${local.resource_prefix}-model-.$"
          ExecutionRoleArn = aws_iam_role.sagemaker_execution.arn
          
          PrimaryContainer = {
            Image            = "382416733822.dkr.ecr.${var.region}.amazonaws.com/xgboost:latest"
            ModelDataUrl.$   = "$.training_result.ModelArtifacts.S3ModelArtifacts"
            Environment = {
              SAGEMAKER_PROGRAM = "inference.py"
              SAGEMAKER_SUBMIT_DIRECTORY = "s3://${aws_s3_bucket.model_artifacts.id}/code"
            }
          }
          
          EnableNetworkIsolation = var.enable_vpc_mode
        }
        
        Dynamic "Parameters" {
          for_each = var.enable_vpc_mode ? [1] : []
          content {
            VpcConfig = {
              SecurityGroupIds = var.security_group_ids
              Subnets         = var.subnet_ids
            }
          }
        }
        
        ResultPath = "$.model_result"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "RecordFailure"
          }
        ]
        Next = "CreateModelPackage"
      }
      
      CreateModelPackage = {
        Type = "Task"
        Resource = "arn:aws:states:::sagemaker:createModelPackage"
        Parameters = {
          ModelPackageGroupName = aws_sagemaker_model_package_group.ml_models.model_package_group_name
          ModelPackageDescription = "Healthcare ML model package"
          
          InferenceSpecification = {
            Containers = [
              {
                Image            = "382416733822.dkr.ecr.${var.region}.amazonaws.com/xgboost:latest"
                ModelDataUrl.$   = "$.training_result.ModelArtifacts.S3ModelArtifacts"
                Framework        = "XGBOOST"
              }
            ]
            
            SupportedTransformInstanceTypes = [
              var.endpoint_instance_type
            ]
            
            SupportedRealtimeInferenceInstanceTypes = [
              var.endpoint_instance_type
            ]
            
            SupportedContentTypes = ["application/json"]
            SupportedResponseMIMETypes = ["application/json"]
          }
          
          ModelApprovalStatus = "Approved"
        }
        
        ResultPath = "$.model_package_result"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "RecordFailure"
          }
        ]
        Next = "UpdateEndpoint"
      }
      
      UpdateEndpoint = {
        Type = "Task"
        Resource = "arn:aws:states:::sagemaker:updateEndpoint"
        Parameters = {
          EndpointName       = aws_sagemaker_endpoint.ml_endpoint.name
          EndpointConfigName = aws_sagemaker_endpoint_configuration.ml_endpoint_config.name
        }
        ResultPath = "$.endpoint_result"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            ResultPath  = "$.error"
            Next        = "RecordFailure"
          }
        ]
        Next = "RecordSuccess"
      }
      
      RecordSuccess = {
        Type = "Task"
        Resource = "arn:aws:states:::dynamodb:updateItem"
        Parameters = {
          TableName = aws_dynamodb_table.pipeline_metadata.name
          Key = {
            "pipeline_id" = {"S.$" = "$.pipeline_id"}
            "timestamp"   = {"S.$" = "$.timestamp"}
          }
          UpdateExpression = "SET #status = :status, #completed = :completed"
          ExpressionAttributeNames = {
            "#status"    = "status"
            "#completed" = "completed_at"
          }
          ExpressionAttributeValues = {
            ":status"    = {"S" = "SUCCESS"}
            ":completed" = {"S.$" = "$$.State.EnteredTime"}
          }
        }
        End = true
      }
      
      RecordFailure = {
        Type = "Task"
        Resource = "arn:aws:states:::dynamodb:updateItem"
        Parameters = {
          TableName = aws_dynamodb_table.pipeline_metadata.name
          Key = {
            "pipeline_id" = {"S.$" = "$.pipeline.pipeline_id"}
            "timestamp"   = {"S.$" = "$.pipeline.timestamp"}
          }
          UpdateExpression = "SET #status = :status, #error = :error"
          ExpressionAttributeNames = {
            "#status" = "status"
            "#error"  = "error"
          }
          ExpressionAttributeValues = {
            ":status" = {"S" = "FAILED"}
            ":error"  = {"S.$" = "States.JsonToString($.error)"}
          }
        }
        Next = "NotifyFailure"
      }
      
      NotifyFailure = {
        Type = "Fail"
        Cause = "Pipeline execution failed"
      }
    }
  })
  
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }
  
  tracing_configuration {
    enabled = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ml-pipeline"
  })
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${local.resource_prefix}-ml-pipeline"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn
  
  tags = local.common_tags
}
```

```hcl
# eventbridge.tf
# EventBridge rule for scheduled pipeline execution
resource "aws_cloudwatch_event_rule" "pipeline_schedule" {
  name                = "${local.resource_prefix}-pipeline-schedule"
  description         = "Trigger ML pipeline on schedule"
  schedule_expression = var.pipeline_schedule_expression
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-pipeline-schedule"
  })
}

# EventBridge target for Step Functions
resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.pipeline_schedule.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.ml_pipeline.arn
  role_arn  = aws_iam_role.eventbridge.arn
  
  input = jsonencode({
    input_key = "daily-batch/medical-data"
  })
}

# EventBridge rule for S3 events (new data arrival)
resource "aws_cloudwatch_event_rule" "s3_data_arrival" {
  name        = "${local.resource_prefix}-data-arrival"
  description = "Trigger pipeline when new data arrives in S3"
  
  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.raw_data.id]
      }
      object = {
        key = [{
          prefix = "incoming/"
        }]
      }
    }
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-data-arrival"
  })
}

resource "aws_cloudwatch_event_target" "s3_trigger" {
  rule      = aws_cloudwatch_event_rule.s3_data_arrival.name
  target_id = "S3TriggerTarget"
  arn       = aws_sfn_state_machine.ml_pipeline.arn
  role_arn  = aws_iam_role.eventbridge.arn
  
  input_transformer {
    input_paths = {
      bucket = "$.detail.bucket.name"
      key    = "$.detail.object.key"
    }
    
    input_template = jsonencode({
      input_key = "<key>"
    })
  }
}

# S3 bucket notification configuration
resource "aws_s3_bucket_notification" "raw_data_events" {
  bucket = aws_s3_bucket.raw_data.id
  
  eventbridge = true
}
```

```hcl
# cloudwatch.tf
# CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "ml_pipeline" {
  dashboard_name = "${local.resource_prefix}-ml-pipeline"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["HealthcareMLPipeline", "PreprocessingCompleted", { stat = "Sum" }],
            [".", "PreprocessingFailed", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Preprocessing Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/States", "ExecutionsSucceeded", "StateMachineArn", aws_sfn_state_machine.ml_pipeline.arn],
            [".", "ExecutionsFailed", ".", "."],
            [".", "ExecutionsTimedOut", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Pipeline Execution Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/SageMaker", "ModelLatency", "EndpointName", aws_sagemaker_endpoint.ml_endpoint.name, { stat = "Average" }],
            [".", "ModelInvocations", ".", ".", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Model Endpoint Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.preprocessing.function_name, { stat = "Sum" }],
            [".", "Errors", ".", ".", { stat = "Sum" }],
            [".", "Duration", ".", ".", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Lambda Function Metrics"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "pipeline_failure" {
  alarm_name          = "${local.resource_prefix}-pipeline-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "ExecutionsFailed"
  namespace          = "AWS/States"
  period             = "300"
  statistic          = "Sum"
  threshold          = "0"
  alarm_description  = "ML pipeline execution failed"
  
  dimensions = {
    StateMachineArn = aws_sfn_state_machine.ml_pipeline.arn
  }
  
  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alerts[0].arn] : []
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "preprocessing_failure" {
  alarm_name          = "${local.resource_prefix}-preprocessing-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "PreprocessingFailed"
  namespace          = "HealthcareMLPipeline"
  period             = "300"
  statistic          = "Sum"
  threshold          = "5"
  alarm_description  = "High preprocessing failure rate"
  
  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alerts[0].arn] : []
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "endpoint_latency" {
  alarm_name          = "${local.resource_prefix}-endpoint-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "ModelLatency"
  namespace          = "AWS/SageMaker"
  period             = "300"
  statistic          = "Average"
  threshold          = "1000"
  alarm_description  = "Model endpoint latency is high"
  
  dimensions = {
    EndpointName = aws_sagemaker_endpoint.ml_endpoint.name
  }
  
  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alerts[0].arn] : []
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.resource_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Sum"
  threshold          = "10"
  alarm_description  = "High Lambda error rate"
  
  dimensions = {
    FunctionName = aws_lambda_function.preprocessing.function_name
  }
  
  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alerts[0].arn] : []
  
  tags = local.common_tags
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  count = var.alarm_email != "" ? 1 : 0
  
  name              = "${local.resource_prefix}-alerts"
  kms_master_key_id = aws_kms_key.cloudwatch.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alerts"
  })
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count = var.alarm_email != "" ? 1 : 0
  
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Custom metric filters for logs
resource "aws_cloudwatch_log_metric_filter" "preprocessing_errors" {
  name           = "${local.resource_prefix}-preprocessing-errors"
  log_group_name = aws_cloudwatch_log_group.preprocessing_lambda.name
  pattern        = "[ERROR]"
  
  metric_transformation {
    name      = "PreprocessingErrors"
    namespace = "HealthcareMLPipeline"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "pipeline_duration" {
  name           = "${local.resource_prefix}-pipeline-duration"
  log_group_name = aws_cloudwatch_log_group.step_functions.name
  pattern        = "{ $.executionSucceeded = true }"
  
  metric_transformation {
    name      = "PipelineDuration"
    namespace = "HealthcareMLPipeline"
    value     = "$.duration"
  }
}
```

```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
    
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# Outputs
output "s3_buckets" {
  description = "S3 bucket names"
  value = {
    raw_data        = aws_s3_bucket.raw_data.id
    processed_data  = aws_s3_bucket.processed_data.id
    model_artifacts = aws_s3_bucket.model_artifacts.id
  }
}

output "lambda_function" {
  description = "Lambda function details"
  value = {
    name = aws_lambda_function.preprocessing.function_name
    arn  = aws_lambda_function.preprocessing.arn
  }
}

output "step_functions_state_machine" {
  description = "Step Functions state machine"
  value = {
    name = aws_sfn_state_machine.ml_pipeline.name
    arn  = aws_sfn_state_machine.ml_pipeline.arn
  }
}

output "sagemaker_endpoint" {
  description = "SageMaker endpoint"
  value = {
    name = aws_sagemaker_endpoint.ml_endpoint.name
    arn  = aws_sagemaker_endpoint.ml_endpoint.arn
  }
}

output "dynamodb_table" {
  description = "DynamoDB metadata table"
  value = {
    name = aws_dynamodb_table.pipeline_metadata.name
    arn  = aws_dynamodb_table.pipeline_metadata.arn
  }
}

output "kms_keys" {
  description = "KMS key IDs"
  value = {
    s3         = aws_kms_key.s3.id
    dynamodb   = aws_kms_key.dynamodb.id
    sagemaker  = aws_kms_key.sagemaker.id
    cloudwatch = aws_kms_key.cloudwatch.id
  }
}

output "cloudwatch_dashboard" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.ml_pipeline.dashboard_name}"
}

output "iam_roles" {
  description = "IAM role ARNs"
  value = {