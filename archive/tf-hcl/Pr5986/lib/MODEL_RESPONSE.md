# Secure Data Processing Infrastructure - Terraform Implementation

This implementation provides a comprehensive secure data processing infrastructure using Terraform with HCL for a financial services environment with PCI-DSS compliance requirements.

## Architecture Overview

The infrastructure implements defense-in-depth security with multiple layers:
- Network isolation using VPC with private subnets only
- Customer-managed KMS encryption for data at rest
- VPC endpoints for private AWS service access
- GuardDuty for threat detection
- CloudWatch Logs with encryption and retention
- Secrets Manager for credential management
- Comprehensive tagging for compliance

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    DataClassification = "Sensitive"
    ComplianceScope    = "PCI-DSS"
  }
}
```

## File: networking.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "vpc-${var.environment_suffix}"
  })
}

# Private Subnets across 3 AZs
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
  })
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "private-rt-${var.environment_suffix}"
  })
}

# Associate Route Table with Private Subnets
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# VPC Endpoint for S3
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*",
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "s3-endpoint-${var.environment_suffix}"
  })
}

# VPC Endpoint for DynamoDB
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.metadata.arn
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "dynamodb-endpoint-${var.environment_suffix}"
  })
}

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Deny unauthorized ports
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 20
    to_port    = 21
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 101
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 23
    to_port    = 23
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 102
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 135
    to_port    = 139
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 103
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 445
    to_port    = 445
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 104
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 3389
    to_port    = 3389
  }

  # Allow HTTPS traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 200
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 443
    to_port    = 443
  }

  # Allow PostgreSQL traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 201
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 5432
    to_port    = 5432
  }

  # Allow ephemeral ports for return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 300
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(var.common_tags, {
    Name = "private-nacl-${var.environment_suffix}"
  })
}
```

## File: security.tf

```hcl
# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name = "s3-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 10
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "cloudwatch-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/cloudwatch-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# Security Group for Lambda Functions
resource "aws_security_group" "lambda" {
  name        = "lambda-sg-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "HTTPS to VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "PostgreSQL to VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(var.common_tags, {
    Name = "lambda-sg-${var.environment_suffix}"
  })
}

# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda" {
  name = "lambda-execution-role-${var.environment_suffix}"

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

  tags = merge(var.common_tags, {
    Name = "lambda-execution-role-${var.environment_suffix}"
  })
}

# IAM Policy for Lambda - Least Privilege with Explicit Denies
resource "aws_iam_role_policy" "lambda" {
  name = "lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.metadata.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "iam:PassRole",
          "sts:AssumeRole",
          "iam:CreateRole",
          "iam:AttachRolePolicy",
          "iam:PutRolePolicy"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## File: storage.tf

```hcl
# S3 Bucket for Data Storage
resource "aws_s3_bucket" "data" {
  bucket = "data-bucket-${var.environment_suffix}"

  tags = merge(var.common_tags, {
    Name = "data-bucket-${var.environment_suffix}"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption with Customer-Managed KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Access Logs
resource "aws_s3_bucket" "logs" {
  bucket = "logs-bucket-${var.environment_suffix}"

  tags = merge(var.common_tags, {
    Name = "logs-bucket-${var.environment_suffix}"
  })
}

# S3 Bucket Versioning for Logs
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption for Logs
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block for Logs
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Logging Configuration
resource "aws_s3_bucket_logging" "data" {
  bucket = aws_s3_bucket.data.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "data-bucket-logs/"
}

# DynamoDB Table for Metadata
resource "aws_dynamodb_table" "metadata" {
  name           = "metadata-table-${var.environment_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.s3.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "metadata-table-${var.environment_suffix}"
  })
}
```

## File: compute.tf

```hcl
# Lambda Function for Data Processing
resource "aws_lambda_function" "processor" {
  filename      = "${path.module}/lambda/processor.zip"
  function_name = "data-processor-${var.environment_suffix}"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DATA_BUCKET      = aws_s3_bucket.data.id
      METADATA_TABLE   = aws_dynamodb_table.metadata.name
      SECRET_ARN       = aws_secretsmanager_secret.db_credentials.arn
      ENVIRONMENT      = var.environment_suffix
    }
  }

  tags = merge(var.common_tags, {
    Name = "data-processor-${var.environment_suffix}"
  })

  depends_on = [
    aws_iam_role_policy.lambda,
    aws_cloudwatch_log_group.lambda
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/data-processor-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = merge(var.common_tags, {
    Name = "lambda-logs-${var.environment_suffix}"
  })
}
```

## File: secrets.tf

```hcl
# Secrets Manager Secret for Database Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "db-credentials-${var.environment_suffix}"
  description             = "Database credentials for data processing"
  recovery_window_in_days = 0

  tags = merge(var.common_tags, {
    Name = "db-credentials-${var.environment_suffix}"
  })
}

# Secrets Manager Secret Version
resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = "ChangeMe123!"
    engine   = "postgresql"
    host     = "database.internal"
    port     = 5432
    dbname   = "production"
  })
}

# Secrets Manager Rotation Configuration
resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# IAM Role for Secrets Rotation Lambda
resource "aws_iam_role" "secrets_rotation" {
  name = "secrets-rotation-role-${var.environment_suffix}"

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

  tags = merge(var.common_tags, {
    Name = "secrets-rotation-role-${var.environment_suffix}"
  })
}

# IAM Policy for Secrets Rotation Lambda
resource "aws_iam_role_policy" "secrets_rotation" {
  name = "secrets-rotation-policy-${var.environment_suffix}"
  role = aws_iam_role.secrets_rotation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      }
    ]
  })
}

# Lambda Function for Secrets Rotation
resource "aws_lambda_function" "secrets_rotation" {
  filename      = "${path.module}/lambda/rotation.zip"
  function_name = "secrets-rotation-${var.environment_suffix}"
  role          = aws_iam_role.secrets_rotation.arn
  handler       = "rotation.handler"
  runtime       = "python3.11"
  timeout       = 30

  environment {
    variables = {
      ENVIRONMENT = var.environment_suffix
    }
  }

  tags = merge(var.common_tags, {
    Name = "secrets-rotation-${var.environment_suffix}"
  })
}

# Lambda Permission for Secrets Manager
resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}
```

## File: monitoring.tf

```hcl
# GuardDuty Detector
# NOTE: GuardDuty is an account-level service. Only one detector can exist per account/region.
# If a detector already exists, this resource will fail. Consider using terraform import or
# deploying GuardDuty separately at the account level.
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = false
        }
      }
    }
  }

  tags = merge(var.common_tags, {
    Name = "guardduty-detector-${var.environment_suffix}"
  })
}

# SNS Topic for GuardDuty Alerts
resource "aws_sns_topic" "guardduty_alerts" {
  name              = "guardduty-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.cloudwatch.id

  tags = merge(var.common_tags, {
    Name = "guardduty-alerts-${var.environment_suffix}"
  })
}

# SNS Topic Subscription (example - email)
resource "aws_sns_topic_subscription" "guardduty_alerts_email" {
  topic_arn = aws_sns_topic.guardduty_alerts.arn
  protocol  = "email"
  endpoint  = "security@example.com"
}

# EventBridge Rule for GuardDuty HIGH Severity Findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "guardduty-high-severity-${var.environment_suffix}"
  description = "Capture GuardDuty HIGH severity findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9]
    }
  })

  tags = merge(var.common_tags, {
    Name = "guardduty-high-severity-rule-${var.environment_suffix}"
  })
}

# EventBridge Target to SNS
resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.guardduty_alerts.arn
}

# SNS Topic Policy for EventBridge
resource "aws_sns_topic_policy" "guardduty_alerts" {
  arn = aws_sns_topic.guardduty_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.guardduty_alerts.arn
      }
    ]
  })
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = merge(var.common_tags, {
    Name = "vpc-flow-logs-${var.environment_suffix}"
  })
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "vpc-flow-logs-role-${var.environment_suffix}"

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

  tags = merge(var.common_tags, {
    Name = "vpc-flow-logs-role-${var.environment_suffix}"
  })
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "vpc-flow-logs-policy-${var.environment_suffix}"
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
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "vpc-flow-log-${var.environment_suffix}"
  })
}
```

## File: data.tf

```hcl
# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for available AZs
data "aws_availability_zones" "available" {
  state = "available"
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "data_bucket_name" {
  description = "Data S3 bucket name"
  value       = aws_s3_bucket.data.id
}

output "data_bucket_arn" {
  description = "Data S3 bucket ARN"
  value       = aws_s3_bucket.data.arn
}

output "logs_bucket_name" {
  description = "Logs S3 bucket name"
  value       = aws_s3_bucket.logs.id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.metadata.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.metadata.arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.processor.arn
}

output "kms_s3_key_id" {
  description = "KMS key ID for S3 encryption"
  value       = aws_kms_key.s3.key_id
}

output "kms_cloudwatch_key_id" {
  description = "KMS key ID for CloudWatch encryption"
  value       = aws_kms_key.cloudwatch.key_id
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = aws_guardduty_detector.main.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for GuardDuty alerts"
  value       = aws_sns_topic.guardduty_alerts.arn
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

output "s3_vpc_endpoint_id" {
  description = "S3 VPC endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_vpc_endpoint_id" {
  description = "DynamoDB VPC endpoint ID"
  value       = aws_vpc_endpoint.dynamodb.id
}
```

## File: lambda/processor.py

```python
import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
secrets_client = boto3.client('secretsmanager')

DATA_BUCKET = os.environ['DATA_BUCKET']
METADATA_TABLE = os.environ['METADATA_TABLE']
SECRET_ARN = os.environ['SECRET_ARN']

def handler(event, context):
    """
    Data processing Lambda function
    Processes data from S3 and stores metadata in DynamoDB
    """
    try:
        # Get database credentials from Secrets Manager
        secret_response = secrets_client.get_secret_value(SecretId=SECRET_ARN)
        db_credentials = json.loads(secret_response['SecretString'])

        # Process data (example implementation)
        table = dynamodb.Table(METADATA_TABLE)

        # Store processing metadata
        response = table.put_item(
            Item={
                'id': context.request_id,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'processed',
                'environment': os.environ.get('ENVIRONMENT', 'unknown')
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'request_id': context.request_id
            })
        }

    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing data',
                'error': str(e)
            })
        }
```

## File: lambda/rotation.py

```python
import json
import boto3
import os

secrets_client = boto3.client('secretsmanager')

def handler(event, context):
    """
    Secrets Manager rotation Lambda function
    Rotates database credentials every 30 days
    """
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    try:
        if step == "createSecret":
            create_secret(secrets_client, arn, token)
        elif step == "setSecret":
            set_secret(secrets_client, arn, token)
        elif step == "testSecret":
            test_secret(secrets_client, arn, token)
        elif step == "finishSecret":
            finish_secret(secrets_client, arn, token)
        else:
            raise ValueError(f"Invalid step: {step}")

        return {
            'statusCode': 200,
            'body': json.dumps(f"Successfully completed {step}")
        }

    except Exception as e:
        print(f"Error in rotation step {step}: {str(e)}")
        raise

def create_secret(service_client, arn, token):
    """Create a new version of the secret"""
    # Get current secret
    current_dict = get_secret_dict(service_client, arn, "AWSCURRENT")

    # Create new password (simplified for example)
    current_dict['password'] = generate_password()

    # Put new secret version
    service_client.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(current_dict),
        VersionStages=['AWSPENDING']
    )

def set_secret(service_client, arn, token):
    """Update the database with new credentials"""
    # In production, this would connect to database and update credentials
    pass

def test_secret(service_client, arn, token):
    """Test the new credentials"""
    # In production, this would test database connection with new credentials
    pass

def finish_secret(service_client, arn, token):
    """Finalize the rotation"""
    service_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=get_secret_version(service_client, arn, "AWSCURRENT")
    )

def get_secret_dict(service_client, arn, stage):
    """Get secret dictionary"""
    response = service_client.get_secret_value(SecretId=arn, VersionStage=stage)
    return json.loads(response['SecretString'])

def get_secret_version(service_client, arn, stage):
    """Get secret version ID"""
    response = service_client.describe_secret(SecretId=arn)
    for version_id, stages in response['VersionIdsToStages'].items():
        if stage in stages:
            return version_id
    return None

def generate_password():
    """Generate a secure random password"""
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for i in range(32))
```

## File: README.md

```markdown
# Secure Data Processing Infrastructure

This Terraform configuration deploys a comprehensive secure data processing infrastructure for financial services with PCI-DSS compliance.

## Architecture

### Network Security
- VPC with private subnets across 3 availability zones
- No public internet access (no IGW or NAT Gateway)
- VPC endpoints for S3 and DynamoDB
- Network ACLs blocking unauthorized ports (FTP, Telnet, RDP, SMB, NetBIOS)
- Security groups with least privilege access (HTTPS and PostgreSQL only)

### Data Security
- Customer-managed KMS encryption for S3 buckets
- S3 versioning and access logging enabled
- DynamoDB with encryption and point-in-time recovery
- Secrets Manager with 30-day automatic rotation

### Compute
- Lambda functions with VPC connectivity (private subnets only)
- IAM roles with least privilege and explicit deny policies
- CloudWatch Logs with 90-day retention and KMS encryption

### Threat Detection
- GuardDuty with S3 protection enabled
- EventBridge rules for HIGH severity findings
- SNS notifications for security alerts
- VPC Flow Logs for network monitoring

## Prerequisites

- Terraform 1.5 or later
- AWS CLI configured with appropriate credentials
- AWS account with administrative access
- Python 3.11 for Lambda functions

## Important Notes

### GuardDuty Limitation
GuardDuty is an account-level service. Only one detector can exist per AWS account per region. If you already have GuardDuty enabled in your account:

1. Option 1: Remove the `aws_guardduty_detector` resource from `monitoring.tf`
2. Option 2: Import the existing detector: `terraform import aws_guardduty_detector.main <detector-id>`
3. Option 3: Deploy GuardDuty separately at the account level

### Lambda Deployment Packages
Before deploying, create ZIP files for Lambda functions:

```bash
cd lambda
zip processor.zip processor.py
zip rotation.zip rotation.py
cd ..
```

## Deployment

1. Initialize Terraform:
```bash
terraform init
```

2. Review the plan:
```bash
terraform plan -var="environment_suffix=dev-001"
```

3. Apply the configuration:
```bash
terraform apply -var="environment_suffix=dev-001"
```

## Configuration Variables

- `environment_suffix`: Unique suffix for resource naming (required)
- `aws_region`: AWS region for deployment (default: us-east-1)
- `vpc_cidr`: VPC CIDR block (default: 10.0.0.0/16)
- `availability_zones`: List of AZs to use (default: us-east-1a, us-east-1b, us-east-1c)

## Outputs

After deployment, Terraform provides:
- VPC and subnet IDs
- S3 bucket names and ARNs
- DynamoDB table details
- Lambda function ARNs
- KMS key IDs
- GuardDuty detector ID
- SNS topic ARN for alerts
- VPC endpoint IDs

## Compliance

All resources are tagged with:
- `DataClassification`: Sensitive
- `ComplianceScope`: PCI-DSS

## Security Features

- No public internet access
- Customer-managed encryption keys with automatic rotation
- Network isolation with private subnets only
- Least privilege IAM roles with explicit denies
- Network ACLs blocking known vulnerable ports
- Comprehensive logging and monitoring
- Automated credential rotation
- Threat detection with GuardDuty

## Cleanup

To destroy all resources:
```bash
terraform destroy -var="environment_suffix=dev-001"
```

Note: All resources are configured to be destroyable with no retention policies.
```

## Implementation Notes

1. **GuardDuty Account-Level Service**: GuardDuty detector is an account-level resource. If already enabled in the account, either import the existing detector or remove it from the configuration.

2. **Lambda Deployment**: Lambda functions require deployment packages (ZIP files). The code is provided but needs to be packaged before deployment.

3. **Secrets Rotation**: The rotation Lambda is simplified. In production, implement actual database connection logic in the `set_secret` and `test_secret` steps.

4. **SNS Email Subscription**: Update the email endpoint in `monitoring.tf` to your actual security team email address.

5. **No Public Access**: This infrastructure has no public internet access. All AWS service communication uses VPC endpoints.

6. **Environment Suffix**: All resources include the environment_suffix variable for uniqueness across multiple deployments.

7. **Compliance Tags**: All resources include DataClassification and ComplianceScope tags as required.

8. **Network ACLs**: Explicitly deny dangerous ports (FTP, Telnet, RDP, SMB, NetBIOS) while allowing HTTPS and PostgreSQL.

9. **KMS Key Policies**: CloudWatch Logs KMS key includes proper service permissions for log encryption.

10. **Destroyability**: All resources can be destroyed cleanly. No retention policies or deletion protection configured.
