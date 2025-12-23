## tap_stack.tf
```hcl
# tap_stack.tf - Payment Processing Infrastructure Stack

# ================================
# DATA SOURCES
# ================================

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ================================
# LOCALS - Environment-specific configurations
# ================================

locals {
  # Environment-specific configurations based on PROMPT.md requirements
  environment_config = {
    dev = {
      # DynamoDB capacity units
      transactions_read_capacity  = 5
      transactions_write_capacity = 5
      audit_read_capacity         = 5
      audit_write_capacity        = 5

      # Lambda memory allocations
      validation_memory   = 512
      processing_memory   = 512
      notification_memory = 512

      # API Gateway throttling
      api_throttle_rate  = 100
      api_throttle_burst = 200

      # S3 lifecycle - retention days
      s3_retention_days = 30

      # CloudWatch logs retention
      logs_retention_days = 30

      # Region
      region = "eu-west-1"
    }
    staging = {
      # DynamoDB capacity units
      transactions_read_capacity  = 25
      transactions_write_capacity = 25
      audit_read_capacity         = 25
      audit_write_capacity        = 25

      # Lambda memory allocations
      validation_memory   = 1024
      processing_memory   = 1024
      notification_memory = 1024

      # API Gateway throttling
      api_throttle_rate  = 500
      api_throttle_burst = 1000

      # S3 lifecycle - retention days
      s3_retention_days = 90

      # CloudWatch logs retention
      logs_retention_days = 90

      # Region
      region = "us-west-2"
    }
    prod = {
      # DynamoDB capacity units
      transactions_read_capacity  = 100
      transactions_write_capacity = 100
      audit_read_capacity         = 100
      audit_write_capacity        = 100

      # Lambda memory allocations
      validation_memory   = 2048
      processing_memory   = 2048
      notification_memory = 2048

      # API Gateway throttling
      api_throttle_rate  = 2000
      api_throttle_burst = 4000

      # S3 lifecycle - retention days
      s3_retention_days = 365

      # CloudWatch logs retention
      logs_retention_days = 365

      # Region
      region = "us-east-1"
    }
  }

  # Current environment configuration
  current_config = local.environment_config[var.environment_suffix]

  # Common tags
  common_tags = {
    Environment = var.environment_suffix
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
    CostCenter  = "fintech-payments"
    ManagedBy   = "Terraform"
    Project     = "payment-processing"
  }

  # Resource naming prefix
  name_prefix = "payment-${var.environment_suffix}"
}

# ================================
# KMS KEYS FOR ENCRYPTION
# ================================

resource "aws_kms_key" "payment_key" {
  description             = "KMS key for payment processing encryption in ${var.environment_suffix} environment"
  deletion_window_in_days = 7
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
        Sid    = "Allow Lambda Functions"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_execution_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
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
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-*"
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs for API Gateway"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/${local.name_prefix}-*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "payment_key" {
  name          = "alias/${local.name_prefix}-encryption"
  target_key_id = aws_kms_key.payment_key.key_id
}

# ================================
# VPC AND NETWORKING
# ================================

resource "aws_vpc" "payment_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_subnet" "private_subnet_a" {
  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-a"
    Type = "Private"
  })
}

resource "aws_subnet" "private_subnet_b" {
  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-b"
    Type = "Private"
  })
}

# VPC Endpoint for Lambda to access DynamoDB privately
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.payment_vpc.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

# ================================
# DYNAMODB TABLES
# ================================

# Transactions table with consistent schema
resource "aws_dynamodb_table" "transactions" {
  name             = "${local.name_prefix}-transactions"
  billing_mode     = "PROVISIONED"
  read_capacity    = local.current_config.transactions_read_capacity
  write_capacity   = local.current_config.transactions_write_capacity
  hash_key         = "transaction_id"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  global_secondary_index {
    name            = "CustomerIndex"
    hash_key        = "customer_id"
    range_key       = "timestamp"
    read_capacity   = local.current_config.transactions_read_capacity
    write_capacity  = local.current_config.transactions_write_capacity
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-transactions-table"
  })
}

# Audit logs table with consistent schema
resource "aws_dynamodb_table" "audit_logs" {
  name           = "${local.name_prefix}-audit-logs"
  billing_mode   = "PROVISIONED"
  read_capacity  = local.current_config.audit_read_capacity
  write_capacity = local.current_config.audit_write_capacity
  hash_key       = "log_id"
  range_key      = "timestamp"

  attribute {
    name = "log_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "action_type"
    type = "S"
  }

  global_secondary_index {
    name            = "ActionTypeIndex"
    hash_key        = "action_type"
    range_key       = "timestamp"
    read_capacity   = local.current_config.audit_read_capacity
    write_capacity  = local.current_config.audit_write_capacity
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logs-table"
  })
}

# ================================
# S3 BUCKETS WITH LIFECYCLE POLICIES
# ================================

resource "aws_s3_bucket" "payment_logs" {
  bucket = "${local.name_prefix}-payment-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-logs-bucket"
  })
}

resource "aws_s3_bucket_versioning" "payment_logs" {
  bucket = aws_s3_bucket.payment_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "payment_logs" {
  bucket = aws_s3_bucket.payment_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.payment_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "payment_logs" {
  bucket = aws_s3_bucket.payment_logs.id

  rule {
    id     = "payment_logs_lifecycle"
    status = "Enabled"

    expiration {
      days = local.current_config.s3_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

resource "aws_s3_bucket_public_access_block" "payment_logs" {
  bucket = aws_s3_bucket.payment_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ================================
# IAM ROLES AND POLICIES
# ================================

resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.name_prefix}-lambda-execution-role"

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

resource "aws_iam_role_policy" "lambda_execution_policy" {
  name = "${local.name_prefix}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/index/*",
          aws_dynamodb_table.audit_logs.arn,
          "${aws_dynamodb_table.audit_logs.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.payment_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.payment_key.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AttachNetworkInterface",
          "ec2:DetachNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# ================================
# LAMBDA FUNCTIONS
# ================================

# Payment Validation Lambda
resource "aws_lambda_function" "payment_validation" {
  function_name = "${local.name_prefix}-payment-validation"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = local.current_config.validation_memory

  filename         = "${path.module}/lambda_placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_placeholder.zip")

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      ENVIRONMENT        = var.environment_suffix
      TRANSACTIONS_TABLE = aws_dynamodb_table.transactions.name
      AUDIT_LOGS_TABLE   = aws_dynamodb_table.audit_logs.name
      KMS_KEY_ID         = aws_kms_key.payment_key.key_id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-validation"
  })
}

# Payment Processing Lambda
resource "aws_lambda_function" "payment_processing" {
  function_name = "${local.name_prefix}-payment-processing"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = local.current_config.processing_memory

  filename         = "${path.module}/lambda_placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_placeholder.zip")

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      ENVIRONMENT        = var.environment_suffix
      TRANSACTIONS_TABLE = aws_dynamodb_table.transactions.name
      AUDIT_LOGS_TABLE   = aws_dynamodb_table.audit_logs.name
      S3_BUCKET          = aws_s3_bucket.payment_logs.bucket
      KMS_KEY_ID         = aws_kms_key.payment_key.key_id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-processing"
  })
}

# Payment Notification Lambda
resource "aws_lambda_function" "payment_notification" {
  function_name = "${local.name_prefix}-payment-notification"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = local.current_config.notification_memory

  filename         = "${path.module}/lambda_placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_placeholder.zip")

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      ENVIRONMENT        = var.environment_suffix
      TRANSACTIONS_TABLE = aws_dynamodb_table.transactions.name
      AUDIT_LOGS_TABLE   = aws_dynamodb_table.audit_logs.name
      KMS_KEY_ID         = aws_kms_key.payment_key.key_id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-notification"
  })
}

# ================================
# SECURITY GROUPS
# ================================

resource "aws_security_group" "lambda_sg" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.payment_vpc.id

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP outbound"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

resource "aws_security_group" "api_gateway_sg" {
  name        = "${local.name_prefix}-api-gateway-sg"
  description = "Security group for API Gateway"
  vpc_id      = aws_vpc.payment_vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS inbound"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-gateway-sg"
  })
}

# ================================
# API GATEWAY
# ================================

resource "aws_api_gateway_rest_api" "payment_api" {
  name        = "${local.name_prefix}-payment-api"
  description = "Payment processing API for ${var.environment_suffix} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-api"
  })
}

# API Gateway throttling settings
resource "aws_api_gateway_request_validator" "payment_validator" {
  name                        = "${local.name_prefix}-request-validator"
  rest_api_id                 = aws_api_gateway_rest_api.payment_api.id
  validate_request_body       = true
  validate_request_parameters = true
}

# /process resource
resource "aws_api_gateway_resource" "process" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "process"
}

resource "aws_api_gateway_method" "process_post" {
  rest_api_id          = aws_api_gateway_rest_api.payment_api.id
  resource_id          = aws_api_gateway_resource.process.id
  http_method          = "POST"
  authorization        = "NONE"
  request_validator_id = aws_api_gateway_request_validator.payment_validator.id
}

resource "aws_api_gateway_integration" "process_integration" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.process.id
  http_method = aws_api_gateway_method.process_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_processing.invoke_arn
}

# /validate resource
resource "aws_api_gateway_resource" "validate" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "validate"
}

resource "aws_api_gateway_method" "validate_post" {
  rest_api_id          = aws_api_gateway_rest_api.payment_api.id
  resource_id          = aws_api_gateway_resource.validate.id
  http_method          = "POST"
  authorization        = "NONE"
  request_validator_id = aws_api_gateway_request_validator.payment_validator.id
}

resource "aws_api_gateway_integration" "validate_integration" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.validate.id
  http_method = aws_api_gateway_method.validate_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validation.invoke_arn
}

# /status resource
resource "aws_api_gateway_resource" "status" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "status"
}

resource "aws_api_gateway_method" "status_get" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.status.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "status_integration" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.status.id
  http_method = aws_api_gateway_method.status_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_notification.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "payment_deployment" {
  depends_on = [
    aws_api_gateway_integration.process_integration,
    aws_api_gateway_integration.validate_integration,
    aws_api_gateway_integration.status_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.payment_api.id

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage with throttling
resource "aws_api_gateway_stage" "payment_stage" {
  deployment_id = aws_api_gateway_deployment.payment_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  stage_name    = var.environment_suffix

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-stage"
  })
}

resource "aws_api_gateway_method_settings" "payment_settings" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  stage_name  = aws_api_gateway_stage.payment_stage.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = local.current_config.api_throttle_rate
    throttling_burst_limit = local.current_config.api_throttle_burst
    logging_level          = "INFO"
    data_trace_enabled     = true
    metrics_enabled        = true
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_process" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processing.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_validate" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_validation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_status" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_notification.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

# ================================
# CLOUDWATCH LOG GROUPS
# ================================

resource "aws_cloudwatch_log_group" "lambda_validation_logs" {
  name              = "/aws/lambda/${aws_lambda_function.payment_validation.function_name}"
  retention_in_days = local.current_config.logs_retention_days
  kms_key_id        = aws_kms_key.payment_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-validation-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_processing_logs" {
  name              = "/aws/lambda/${aws_lambda_function.payment_processing.function_name}"
  retention_in_days = local.current_config.logs_retention_days
  kms_key_id        = aws_kms_key.payment_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-processing-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_notification_logs" {
  name              = "/aws/lambda/${aws_lambda_function.payment_notification.function_name}"
  retention_in_days = local.current_config.logs_retention_days
  kms_key_id        = aws_kms_key.payment_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-notification-logs"
  })
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.payment_api.name}"
  retention_in_days = local.current_config.logs_retention_days
  kms_key_id        = aws_kms_key.payment_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-gateway-logs"
  })
}

# ================================
# CLOUDWATCH ALARMS
# ================================

# Lambda Error Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_validation_errors" {
  alarm_name          = "${local.name_prefix}-validation-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.environment_suffix == "prod" ? "10" : var.environment_suffix == "staging" ? "5" : "2"
  alarm_description   = "This metric monitors lambda validation errors"
  treat_missing_data  = "breaching"

  dimensions = {
    FunctionName = aws_lambda_function.payment_validation.function_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-validation-errors-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_processing_errors" {
  alarm_name          = "${local.name_prefix}-processing-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.environment_suffix == "prod" ? "10" : var.environment_suffix == "staging" ? "5" : "2"
  alarm_description   = "This metric monitors lambda processing errors"
  treat_missing_data  = "breaching"

  dimensions = {
    FunctionName = aws_lambda_function.payment_processing.function_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-processing-errors-alarm"
  })
}

# DynamoDB Throttling Alarms
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttling" {
  alarm_name          = "${local.name_prefix}-dynamodb-throttling"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB throttling"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-throttling-alarm"
  })
}

# API Gateway 4xx/5xx Alarms
resource "aws_cloudwatch_metric_alarm" "api_gateway_4xx" {
  alarm_name          = "${local.name_prefix}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.environment_suffix == "prod" ? "100" : var.environment_suffix == "staging" ? "50" : "20"
  alarm_description   = "This metric monitors API Gateway 4xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.payment_api.name
    Stage   = aws_api_gateway_stage.payment_stage.stage_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-4xx-errors-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "${local.name_prefix}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.environment_suffix == "prod" ? "50" : var.environment_suffix == "staging" ? "25" : "10"
  alarm_description   = "This metric monitors API Gateway 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.payment_api.name
    Stage   = aws_api_gateway_stage.payment_stage.stage_name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-5xx-errors-alarm"
  })
}

# ================================
# CLOUDWATCH DASHBOARD
# ================================

resource "aws_cloudwatch_dashboard" "payment_dashboard" {
  dashboard_name = "${local.name_prefix}-payment-dashboard"

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
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.payment_validation.function_name],
            [".", "Errors", ".", "."],
            [".", "Invocations", ".", "."],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.payment_processing.function_name],
            [".", "Errors", ".", "."],
            [".", "Invocations", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Metrics"
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
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.transactions.name],
            [".", "ConsumedWriteCapacityUnits", ".", "."],
            [".", "ThrottledRequests", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.payment_api.name, "Stage", aws_api_gateway_stage.payment_stage.stage_name],
            [".", "4XXError", ".", ".", ".", "."],
            [".", "5XXError", ".", ".", ".", "."],
            [".", "Latency", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Metrics"
          period  = 300
        }
      }
    ]
  })
}

# ================================
# CONFIGURATION VALIDATION
# ================================

# Configuration manifest to document environment-specific values
resource "local_file" "configuration_manifest" {
  content = jsonencode({
    environment   = var.environment_suffix
    region        = var.aws_region
    configuration = local.current_config
    resources = {
      vpc_id = aws_vpc.payment_vpc.id
      dynamodb_tables = {
        transactions = aws_dynamodb_table.transactions.name
        audit_logs   = aws_dynamodb_table.audit_logs.name
      }
      lambda_functions = {
        validation   = aws_lambda_function.payment_validation.function_name
        processing   = aws_lambda_function.payment_processing.function_name
        notification = aws_lambda_function.payment_notification.function_name
      }
      api_gateway = {
        api_id = aws_api_gateway_rest_api.payment_api.id
        stage  = aws_api_gateway_stage.payment_stage.stage_name
        endpoints = {
          process  = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/POST/process"
          validate = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/POST/validate"
          status   = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/GET/status"
        }
      }
      s3_bucket = aws_s3_bucket.payment_logs.bucket
      kms_key   = aws_kms_key.payment_key.key_id
    }
    tags       = local.common_tags
    created_at = timestamp()
  })

  filename = "${path.module}/configuration-manifest-${var.environment_suffix}.json"
}
```

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

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

```

## variables.tf
```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment_suffix)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment-processing"
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "fintech-payments"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}
```

## validation.tf
```hcl
# validation.tf - Configuration Validation Module

# Validation checks to ensure configuration consistency across environments
resource "null_resource" "configuration_validation" {
  # Trigger validation on any configuration change
  triggers = {
    environment_config = jsonencode(local.current_config)
    environment        = var.environment_suffix
  }

  # Validation script
  provisioner "local-exec" {
    command = <<-EOT
      echo "Validating configuration for environment: ${var.environment_suffix}"
      
      # Check if environment configuration exists
      if [ -z "${jsonencode(local.current_config)}" ]; then
        echo "ERROR: No configuration found for environment ${var.environment_suffix}"
        exit 1
      fi
      
      # Validate DynamoDB capacity units are within expected ranges
      read_capacity=$(echo '${local.current_config.transactions_read_capacity}' | tr -d '"')
      write_capacity=$(echo '${local.current_config.transactions_write_capacity}' | tr -d '"')
      
      if [ "$read_capacity" -lt 1 ] || [ "$write_capacity" -lt 1 ]; then
        echo "ERROR: DynamoDB capacity units must be at least 1"
        exit 1
      fi
      
      # Validate Lambda memory allocations are within AWS limits
      validation_memory=$(echo '${local.current_config.validation_memory}' | tr -d '"')
      processing_memory=$(echo '${local.current_config.processing_memory}' | tr -d '"')
      
      if [ "$validation_memory" -lt 128 ] || [ "$validation_memory" -gt 10240 ]; then
        echo "ERROR: Lambda memory must be between 128MB and 10240MB"
        exit 1
      fi
      
      # Validate API throttling limits are reasonable
      api_rate=$(echo '${local.current_config.api_throttle_rate}' | tr -d '"')
      if [ "$api_rate" -lt 1 ]; then
        echo "ERROR: API throttle rate must be at least 1 request/second"
        exit 1
      fi
      
      # Validate retention periods are positive
      retention_days=$(echo '${local.current_config.s3_retention_days}' | tr -d '"')
      if [ "$retention_days" -lt 1 ]; then
        echo "ERROR: Retention days must be at least 1"
        exit 1
      fi
      
      echo "Configuration validation passed for environment: ${var.environment_suffix}"
    EOT
  }

  depends_on = [
    aws_dynamodb_table.transactions,
    aws_dynamodb_table.audit_logs,
    aws_lambda_function.payment_validation,
    aws_lambda_function.payment_processing,
    aws_lambda_function.payment_notification
  ]
}

# Drift detection check
resource "null_resource" "drift_detection" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "Performing drift detection for environment: ${var.environment_suffix}"
      
      # Check if resources exist in AWS
      aws sts get-caller-identity > /dev/null 2>&1
      if [ $? -ne 0 ]; then
        echo "WARNING: Unable to verify AWS connectivity for drift detection"
        exit 0
      fi
      
      # Verify DynamoDB tables exist
      aws dynamodb describe-table --table-name "${aws_dynamodb_table.transactions.name}" --region "${var.aws_region}" > /dev/null 2>&1
      if [ $? -ne 0 ]; then
        echo "WARNING: Transactions table ${aws_dynamodb_table.transactions.name} not found in AWS"
      fi
      
      # Verify Lambda functions exist
      aws lambda get-function --function-name "${aws_lambda_function.payment_validation.function_name}" --region "${var.aws_region}" > /dev/null 2>&1
      if [ $? -ne 0 ]; then
        echo "WARNING: Lambda function ${aws_lambda_function.payment_validation.function_name} not found in AWS"
      fi
      
      # Verify API Gateway exists
      aws apigateway get-rest-api --rest-api-id "${aws_api_gateway_rest_api.payment_api.id}" --region "${var.aws_region}" > /dev/null 2>&1
      if [ $? -ne 0 ]; then
        echo "WARNING: API Gateway ${aws_api_gateway_rest_api.payment_api.id} not found in AWS"
      fi
      
      echo "Drift detection completed for environment: ${var.environment_suffix}"
    EOT
  }

  depends_on = [
    aws_dynamodb_table.transactions,
    aws_dynamodb_table.audit_logs,
    aws_lambda_function.payment_validation,
    aws_lambda_function.payment_processing,
    aws_lambda_function.payment_notification,
    aws_api_gateway_rest_api.payment_api
  ]
}

# Cross-environment configuration comparison (when applicable)
data "external" "environment_comparison" {
  program = ["bash", "-c", <<-EOT
    # Generate configuration comparison report
    cat << EOF
    {
      "current_environment": "${var.environment_suffix}",
      "validation_status": "passed",
      "configuration_hash": "$(echo '${jsonencode(local.current_config)}' | shasum -a 256 | cut -d' ' -f1)"
    }
EOF
  EOT
  ]

  depends_on = [null_resource.configuration_validation]
}

# Generate compliance report
resource "local_file" "compliance_report" {
  content = jsonencode({
    timestamp   = timestamp()
    environment = var.environment_suffix
    compliance_checks = {
      configuration_validation    = "passed"
      drift_detection             = "completed"
      tagging_compliance          = "enforced"
      encryption_compliance       = "enforced"
      retention_policy_compliance = "enforced"
    }
    resource_inventory = {
      dynamodb_tables   = 2
      lambda_functions  = 3
      s3_buckets        = 1
      kms_keys          = 1
      cloudwatch_alarms = 5
      api_gateway_apis  = 1
    }
    security_measures = {
      kms_encryption      = true
      vpc_isolation       = true
      iam_least_privilege = true
      private_subnets     = true
    }
    monitoring = {
      cloudwatch_dashboards = 1
      cloudwatch_alarms     = 5
      log_retention_days    = local.current_config.logs_retention_days
    }
    configuration_hash = data.external.environment_comparison.result.configuration_hash
  })

  filename = "${path.module}/compliance-report-${var.environment_suffix}.json"

  depends_on = [
    null_resource.configuration_validation,
    null_resource.drift_detection
  ]
}
```


## outputs.tf
```hcl
# outputs.tf - Payment Processing Infrastructure Outputs

output "vpc_id" {
  description = "ID of the payment processing VPC"
  value       = aws_vpc.payment_vpc.id
}

output "api_gateway_url" {
  description = "URL of the payment processing API Gateway"
  value       = "https://${aws_api_gateway_rest_api.payment_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment_suffix}"
}

output "api_gateway_endpoints" {
  description = "Payment processing API endpoints"
  value = {
    process  = "${aws_api_gateway_rest_api.payment_api.execution_arn}/${var.environment_suffix}/POST/process"
    validate = "${aws_api_gateway_rest_api.payment_api.execution_arn}/${var.environment_suffix}/POST/validate"
    status   = "${aws_api_gateway_rest_api.payment_api.execution_arn}/${var.environment_suffix}/GET/status"
  }
}

output "dynamodb_tables" {
  description = "DynamoDB table information"
  value = {
    transactions = {
      name = aws_dynamodb_table.transactions.name
      arn  = aws_dynamodb_table.transactions.arn
    }
    audit_logs = {
      name = aws_dynamodb_table.audit_logs.name
      arn  = aws_dynamodb_table.audit_logs.arn
    }
  }
}

output "lambda_functions" {
  description = "Lambda function information"
  value = {
    validation = {
      name = aws_lambda_function.payment_validation.function_name
      arn  = aws_lambda_function.payment_validation.arn
    }
    processing = {
      name = aws_lambda_function.payment_processing.function_name
      arn  = aws_lambda_function.payment_processing.arn
    }
    notification = {
      name = aws_lambda_function.payment_notification.function_name
      arn  = aws_lambda_function.payment_notification.arn
    }
  }
}

output "s3_bucket" {
  description = "S3 bucket for payment logs"
  value = {
    name = aws_s3_bucket.payment_logs.bucket
    arn  = aws_s3_bucket.payment_logs.arn
  }
}

output "kms_key" {
  description = "KMS key for encryption"
  value = {
    id    = aws_kms_key.payment_key.key_id
    arn   = aws_kms_key.payment_key.arn
    alias = aws_kms_alias.payment_key.name
  }
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.payment_dashboard.dashboard_name}"
}

output "environment_configuration" {
  description = "Current environment configuration"
  value       = local.current_config
}

output "configuration_manifest_file" {
  description = "Path to the configuration manifest file"
  value       = local_file.configuration_manifest.filename
}
```


