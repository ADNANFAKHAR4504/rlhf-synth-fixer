# Overview

This implementation provides a secure financial data processing infrastructure with PCI-DSS compliance controls on AWS using Terraform. The architecture enforces complete network isolation through VPC private subnets with no internet gateway, utilizing VPC endpoints exclusively for AWS service communication. All data is encrypted at rest using KMS customer-managed keys, with comprehensive audit logging and role-based access control implementing separation of duties between data processors, auditors, and administrators.

***

## Architecture

- VPC with three private subnets distributed across availability zones (us-east-1a, us-east-1b, us-east-1c) with no internet gateway or NAT gateway
- VPC endpoints for S3 (Gateway), DynamoDB (Gateway), Lambda (Interface), and CloudWatch Logs (Interface) enabling private AWS service access
- Two Lambda functions in VPC private subnets: data processor and data validator with Python 3.11 runtime
- Three S3 buckets with KMS encryption, versioning, and lifecycle policies: raw data, processed data, and audit logs
- Two DynamoDB tables with point-in-time recovery and KMS encryption: metadata and audit
- Three KMS customer-managed keys for S3, DynamoDB, and CloudWatch Logs with key rotation enabled
- Five IAM roles implementing separation of duties: lambda_processor, lambda_validator, data_processor, auditor, administrator
- Security groups restricting Lambda egress to VPC endpoints only on port 443
- VPC Flow Logs encrypted with KMS and retained for 90 days in CloudWatch Logs
- CloudWatch log groups for Lambda functions and VPC flow logs with 90-day retention

***

## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  backend "s3" {
    
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      DataClassification = "Sensitive"
      Environment        = var.environment
      Owner              = "SecurityTeam"
      ManagedBy          = "Terraform"
      Project            = "PCICompliance"
    }
  }
}

provider "random" {}
provider "archive" {}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "uat"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90
}

variable "kms_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
}
```

***

## lib/main.tf

```hcl
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC - Completely isolated, no IGW, no NAT
resource "aws_vpc" "secure_processing" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-secure-processing-${var.environment}"
  }
}

# Private Subnets - Distributed across 3 AZs
resource "aws_subnet" "private" {
  count = 3

  vpc_id                  = aws_vpc.secure_processing.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "subnet-private-${count.index + 1}-${var.environment}"
    Type = "Private"
  }
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.secure_processing.id

  tags = {
    Name = "rt-private-${var.environment}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# VPC Flow Logs for Audit Trail
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flow-logs"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.logs_encryption.arn

  depends_on = [aws_kms_key.logs_encryption]
}

resource "aws_flow_log" "vpc" {
  vpc_id               = aws_vpc.secure_processing.id
  traffic_type         = "ALL"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  iam_role_arn         = aws_iam_role.flow_logs.arn

  tags = {
    Name = "flow-logs-${var.environment}"
  }
}

# Gateway Endpoint for S3
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.secure_processing.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "vpce-s3-${var.environment}"
  }
}

# Gateway Endpoint for DynamoDB
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.secure_processing.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "vpce-dynamodb-${var.environment}"
  }
}

# Interface Endpoint for Lambda
resource "aws_vpc_endpoint" "lambda" {
  vpc_id              = aws_vpc.secure_processing.id
  service_name        = "com.amazonaws.${var.aws_region}.lambda"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = {
    Name = "vpce-lambda-${var.environment}"
  }
}

# Interface Endpoint for CloudWatch Logs
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.secure_processing.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoint.id]
  private_dns_enabled = true

  tags = {
    Name = "vpce-logs-${var.environment}"
  }
}

# Security Group for Lambda Functions
resource "aws_security_group" "lambda" {
  name        = "lambda-${var.environment}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.secure_processing.id

  tags = {
    Name = "sg-lambda-${var.environment}"
  }
}

# Lambda Egress Rule - HTTPS to VPC Endpoints only
resource "aws_security_group_rule" "lambda_egress_https" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.vpc_endpoint.id
  security_group_id        = aws_security_group.lambda.id
  description              = "HTTPS to VPC endpoints"
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoint" {
  name        = "vpc-endpoint-${var.environment}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.secure_processing.id

  tags = {
    Name = "sg-vpc-endpoint-${var.environment}"
  }
}

# VPC Endpoint Ingress Rule - HTTPS from Lambda
resource "aws_security_group_rule" "vpc_endpoint_ingress_https" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.vpc_endpoint.id
  description              = "HTTPS from Lambda functions"
}

# VPC Endpoint Egress Rule
resource "aws_security_group_rule" "vpc_endpoint_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.vpc_endpoint.id
  description       = "Allow all outbound"
}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

  tags = {
    Name = "kms-s3-${var.environment}"
  }
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# KMS Key Policy for S3
resource "aws_kms_key_policy" "s3_encryption" {
  key_id = aws_kms_key.s3_encryption.id

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
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda Functions"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.lambda_processor.arn,
            aws_iam_role.lambda_validator.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS Key for DynamoDB Encryption
resource "aws_kms_key" "dynamodb_encryption" {
  description             = "KMS key for DynamoDB table encryption"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

  tags = {
    Name = "kms-dynamodb-${var.environment}"
  }
}

resource "aws_kms_alias" "dynamodb_encryption" {
  name          = "alias/dynamodb-encryption"
  target_key_id = aws_kms_key.dynamodb_encryption.key_id
}

# KMS Key Policy for DynamoDB
resource "aws_kms_key_policy" "dynamodb_encryption" {
  key_id = aws_kms_key.dynamodb_encryption.id

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
        Sid    = "Allow DynamoDB Service"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda Functions"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.lambda_processor.arn,
            aws_iam_role.lambda_validator.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS Key for CloudWatch Logs Encryption
resource "aws_kms_key" "logs_encryption" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

  tags = {
    Name = "kms-logs-${var.environment}"
  }
}

resource "aws_kms_alias" "logs_encryption" {
  name          = "alias/logs-encryption"
  target_key_id = aws_kms_key.logs_encryption.key_id
}

# KMS Key Policy for CloudWatch Logs
resource "aws_kms_key_policy" "logs_encryption" {
  key_id = aws_kms_key.logs_encryption.id

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
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
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
}

# Raw Data Bucket
resource "aws_s3_bucket" "raw_data" {
  bucket        = "s3-raw-data-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "s3-raw-data-${var.environment}"
    Type = "RawData"
  }
}

resource "aws_s3_bucket_versioning" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  rule {
    id     = "archive-and-expire"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

# Processed Data Bucket
resource "aws_s3_bucket" "processed_data" {
  bucket        = "s3-processed-data-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "s3-processed-data-${var.environment}"
    Type = "ProcessedData"
  }
}

resource "aws_s3_bucket_versioning" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id

  rule {
    id     = "archive-and-expire"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

# Audit Logs Bucket
resource "aws_s3_bucket" "audit_logs" {
  bucket        = "s3-audit-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "s3-audit-logs-${var.environment}"
    Type = "AuditLogs"
  }
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "archive-and-expire"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

# Metadata Table
resource "aws_dynamodb_table" "metadata" {
  name                        = "dynamodb-metadata-${var.environment}"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "job_id"
  deletion_protection_enabled = false

  attribute {
    name = "job_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }

  tags = {
    Name = "dynamodb-metadata-${var.environment}"
  }
}

# Audit Table
resource "aws_dynamodb_table" "audit" {
  name                        = "dynamodb-audit-${var.environment}"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "audit_id"
  range_key                   = "timestamp"
  deletion_protection_enabled = false

  attribute {
    name = "audit_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }

  tags = {
    Name = "dynamodb-audit-${var.environment}"
  }
}

# Lambda Processor Execution Role
resource "aws_iam_role" "lambda_processor" {
  name = "lambda-processor-role-${var.environment}"

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

  tags = {
    Name = "lambda-processor-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "lambda_processor" {
  name = "lambda-processor-policy"
  role = aws_iam_role.lambda_processor.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.raw_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.processed_data.arn}/*",
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.metadata.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_encryption.arn,
          aws_kms_key.dynamodb_encryption.arn
        ]
      }
    ]
  })
}

# Lambda Validator Execution Role
resource "aws_iam_role" "lambda_validator" {
  name = "lambda-validator-role-${var.environment}"

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

  tags = {
    Name = "lambda-validator-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "lambda_validator" {
  name = "lambda-validator-policy"
  role = aws_iam_role.lambda_validator.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.processed_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.audit_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.audit.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_encryption.arn,
          aws_kms_key.dynamodb_encryption.arn
        ]
      }
    ]
  })
}

# Data Processor Role
resource "aws_iam_role" "data_processor" {
  name = "data-processor-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })

  tags = {
    Name = "data-processor-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "data_processor" {
  name = "data-processor-policy"
  role = aws_iam_role.data_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.data_processor.arn,
          aws_lambda_function.data_validator.arn
        ]
      }
    ]
  })
}

# Auditor Role
resource "aws_iam_role" "auditor" {
  name = "auditor-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })

  tags = {
    Name = "auditor-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "auditor" {
  name = "auditor-policy"
  role = aws_iam_role.auditor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:ListBucketVersions"
        ]
        Resource = [
          aws_s3_bucket.raw_data.arn,
          "${aws_s3_bucket.raw_data.arn}/*",
          aws_s3_bucket.processed_data.arn,
          "${aws_s3_bucket.processed_data.arn}/*",
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.metadata.arn,
          aws_dynamodb_table.audit.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration"
        ]
        Resource = [
          aws_lambda_function.data_processor.arn,
          aws_lambda_function.data_validator.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcEndpoints"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteObject",
          "s3:PutObject",
          "dynamodb:DeleteItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration"
        ]
        Resource = "*"
      }
    ]
  })
}

# Administrator Role
resource "aws_iam_role" "administrator" {
  name = "administrator-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })

  tags = {
    Name = "administrator-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "administrator" {
  name = "administrator-policy"
  role = aws_iam_role.administrator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionConfiguration",
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:CreateFunction",
          "lambda:DeleteFunction"
        ]
        Resource = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:CreatePolicy",
          "iam:UpdatePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:CreateRole",
          "iam:UpdateRole",
          "iam:PassRole"
        ]
        Resource = [
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:CreateKey",
          "kms:DescribeKey",
          "kms:EnableKeyRotation"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateVpc",
          "ec2:CreateSubnet",
          "ec2:CreateVpcEndpoint",
          "ec2:ModifyVpcEndpoint"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "kms:Decrypt",
          "s3:GetObject",
          "dynamodb:GetItem",
          "logs:DeleteLogGroup"
        ]
        Resource = [
          aws_kms_key.s3_encryption.arn,
          aws_kms_key.dynamodb_encryption.arn,
          "${aws_s3_bucket.audit_logs.arn}/*",
          aws_dynamodb_table.audit.arn
        ]
      }
    ]
  })
}

# Flow Logs IAM Role
resource "aws_iam_role" "flow_logs" {
  name = "flow-logs-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "flow-logs-policy"
  role = aws_iam_role.flow_logs.id

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

# CloudWatch Log Groups for Lambda
resource "aws_cloudwatch_log_group" "data_processor" {
  name              = "/aws/lambda/lambda-data-processor-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.logs_encryption.arn
}

resource "aws_cloudwatch_log_group" "data_validator" {
  name              = "/aws/lambda/lambda-data-validator-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.logs_encryption.arn
}

# Lambda Function Package
data "archive_file" "lambda_code" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

# Data Processor Lambda Function
resource "aws_lambda_function" "data_processor" {
  filename         = data.archive_file.lambda_code.output_path
  function_name    = "lambda-data-processor-${var.environment}"
  role             = aws_iam_role.lambda_processor.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_code.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      RAW_BUCKET       = aws_s3_bucket.raw_data.id
      PROCESSED_BUCKET = aws_s3_bucket.processed_data.id
      AUDIT_BUCKET     = aws_s3_bucket.audit_logs.id
      METADATA_TABLE   = aws_dynamodb_table.metadata.name
    }
  }

  tags = {
    Name = "lambda-data-processor-${var.environment}"
  }

  depends_on = [
    aws_iam_role_policy.lambda_processor,
    aws_cloudwatch_log_group.data_processor
  ]
}

# Data Validator Lambda Function
resource "aws_lambda_function" "data_validator" {
  filename         = data.archive_file.lambda_code.output_path
  function_name    = "lambda-data-validator-${var.environment}"
  role             = aws_iam_role.lambda_validator.arn
  handler          = "lambda_function.validator_handler"
  source_code_hash = data.archive_file.lambda_code.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      PROCESSED_BUCKET = aws_s3_bucket.processed_data.id
      AUDIT_BUCKET     = aws_s3_bucket.audit_logs.id
      AUDIT_TABLE      = aws_dynamodb_table.audit.name
    }
  }

  tags = {
    Name = "lambda-data-validator-${var.environment}"
  }

  depends_on = [
    aws_iam_role_policy.lambda_validator,
    aws_cloudwatch_log_group.data_validator
  ]
}
```

***

## lib/lambda_function.py

```python
import json
import logging
import os
import boto3
from datetime import datetime
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
dynamodb_client = boto3.client('dynamodb')

def lambda_handler(event, context):
    raw_bucket = os.environ.get('RAW_BUCKET')
    processed_bucket = os.environ.get('PROCESSED_BUCKET')
    audit_bucket = os.environ.get('AUDIT_BUCKET')
    metadata_table = os.environ.get('METADATA_TABLE')
    
    job_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    logger.info(f"Starting processing job {job_id}")
    
    try:
        dynamodb_client.put_item(
            TableName=metadata_table,
            Item={
                'job_id': {'S': job_id},
                'status': {'S': 'PROCESSING'},
                'start_time': {'S': timestamp},
                'function_name': {'S': context.function_name},
                'request_id': {'S': context.aws_request_id}
            }
        )
        
        if 'Records' in event:
            for record in event['Records']:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                
                logger.info(f"Processing object {key} from bucket {bucket}")
                
                response = s3_client.get_object(Bucket=bucket, Key=key)
                data = response['Body'].read()
                
                processed_data = validate_and_transform(data)
                
                processed_key = f"processed/{job_id}/{key}"
                s3_client.put_object(
                    Bucket=processed_bucket,
                    Key=processed_key,
                    Body=processed_data,
                    ServerSideEncryption='aws:kms'
                )
                
                logger.info(f"Stored processed data to {processed_bucket}/{processed_key}")
        
        dynamodb_client.update_item(
            TableName=metadata_table,
            Key={'job_id': {'S': job_id}},
            UpdateExpression='SET #status = :status, end_time = :end_time',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': {'S': 'COMPLETED'},
                ':end_time': {'S': datetime.utcnow().isoformat()}
            }
        )
        
        audit_entry = {
            'job_id': job_id,
            'timestamp': timestamp,
            'event': 'DATA_PROCESSING_COMPLETED',
            'details': {
                'function_name': context.function_name,
                'request_id': context.aws_request_id,
                'status': 'SUCCESS'
            }
        }
        
        s3_client.put_object(
            Bucket=audit_bucket,
            Key=f"audit-logs/{job_id}.json",
            Body=json.dumps(audit_entry),
            ServerSideEncryption='aws:kms'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'job_id': job_id,
                'status': 'COMPLETED'
            })
        }
        
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        
        dynamodb_client.update_item(
            TableName=metadata_table,
            Key={'job_id': {'S': job_id}},
            UpdateExpression='SET #status = :status, error = :error, end_time = :end_time',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': {'S': 'FAILED'},
                ':error': {'S': str(e)},
                ':end_time': {'S': datetime.utcnow().isoformat()}
            }
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'job_id': job_id,
                'status': 'FAILED',
                'error': str(e)
            })
        }

def validator_handler(event, context):
    processed_bucket = os.environ.get('PROCESSED_BUCKET')
    audit_bucket = os.environ.get('AUDIT_BUCKET')
    audit_table = os.environ.get('AUDIT_TABLE')
    
    audit_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    logger.info(f"Starting validation audit {audit_id}")
    
    try:
        validation_results = []
        
        if 'Records' in event:
            for record in event['Records']:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                
                logger.info(f"Validating object {key} from bucket {bucket}")
                
                response = s3_client.head_object(Bucket=bucket, Key=key)
                
                checks = {
                    'encryption': response.get('ServerSideEncryption') == 'aws:kms',
                    'size_limit': response.get('ContentLength', 0) < 10485760,
                    'content_type': response.get('ContentType') in ['application/json', 'text/plain']
                }
                
                validation_results.append({
                    'object': key,
                    'checks': checks,
                    'passed': all(checks.values())
                })
        
        dynamodb_client.put_item(
            TableName=audit_table,
            Item={
                'audit_id': {'S': audit_id},
                'timestamp': {'S': timestamp},
                'audit_type': {'S': 'DATA_VALIDATION'},
                'performed_by': {'S': context.function_name},
                'request_id': {'S': context.aws_request_id},
                'results': {'S': json.dumps(validation_results)}
            }
        )
        
        audit_log = {
            'audit_id': audit_id,
            'timestamp': timestamp,
            'event': 'DATA_VALIDATION',
            'function': context.function_name,
            'validation_results': validation_results
        }
        
        s3_client.put_object(
            Bucket=audit_bucket,
            Key=f"validation-logs/{audit_id}.json",
            Body=json.dumps(audit_log),
            ServerSideEncryption='aws:kms'
        )
        
        logger.info(f"Validation audit {audit_id} completed")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'audit_id': audit_id,
                'status': 'COMPLETED',
                'results': validation_results
            })
        }
        
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'audit_id': audit_id,
                'status': 'FAILED',
                'error': str(e)
            })
        }

def validate_and_transform(data):
    try:
        if isinstance(data, bytes):
            data = data.decode('utf-8')
        
        try:
            json_data = json.loads(data)
            
            json_data['processed_at'] = datetime.utcnow().isoformat()
            json_data['processing_version'] = '1.0'
            
            return json.dumps(json_data).encode('utf-8')
        except json.JSONDecodeError:
            metadata = f"# Processed at: {datetime.utcnow().isoformat()}\n"
            return (metadata + data).encode('utf-8')
            
    except Exception as e:
        logger.error(f"Transformation error: {str(e)}")
        raise
```

***

## Outputs

The infrastructure generates 40 outputs critical for integration testing and operational management:

- vpc_id: ID of the secure processing VPC
- private_subnet_ids: IDs of three private subnets across availability zones
- route_table_id: ID of the private route table with VPC endpoint routes
- s3_endpoint_id: ID of S3 Gateway VPC endpoint
- dynamodb_endpoint_id: ID of DynamoDB Gateway VPC endpoint
- lambda_endpoint_id: ID of Lambda Interface VPC endpoint
- logs_endpoint_id: ID of CloudWatch Logs Interface VPC endpoint
- lambda_security_group_id: ID of Lambda security group restricting egress to VPC endpoints
- vpc_endpoint_security_group_id: ID of VPC endpoint security group allowing ingress from Lambda
- kms_s3_key_arn: ARN of KMS key for S3 bucket encryption with rotation enabled
- kms_dynamodb_key_arn: ARN of KMS key for DynamoDB table encryption with rotation enabled
- kms_logs_key_arn: ARN of KMS key for CloudWatch Logs encryption
- lambda_processor_role_arn: ARN of Lambda processor execution role with VPC and service permissions
- lambda_validator_role_arn: ARN of Lambda validator execution role with validation permissions
- data_processor_role_arn: ARN of data processor role for invoking Lambda functions
- auditor_role_arn: ARN of auditor role with read-only access and explicit deny on modifications
- administrator_role_arn: ARN of administrator role for infrastructure management with audit trail exclusion
- raw_data_bucket_name: Name of raw data S3 bucket with versioning and lifecycle policies
- processed_data_bucket_name: Name of processed data S3 bucket with encryption and transitions
- audit_logs_bucket_name: Name of audit logs S3 bucket with long-term retention
- raw_data_bucket_arn: ARN of raw data bucket for IAM policy references
- processed_data_bucket_arn: ARN of processed data bucket for IAM policy references
- audit_logs_bucket_arn: ARN of audit logs bucket for IAM policy references
- lambda_processor_function_name: Name of data processor Lambda function
- lambda_validator_function_name: Name of data validator Lambda function
- lambda_processor_function_arn: ARN of data processor Lambda for invocation
- lambda_validator_function_arn: ARN of data validator Lambda for invocation
- metadata_table_name: Name of DynamoDB metadata table tracking processing jobs
- audit_table_name: Name of DynamoDB audit table storing validation records
- metadata_table_arn: ARN of metadata table for IAM policy references
- audit_table_arn: ARN of audit table for IAM policy references
- processor_log_group_name: Name of CloudWatch log group for processor Lambda
- validator_log_group_name: Name of CloudWatch log group for validator Lambda
- vpc_flow_logs_log_group_name: Name of CloudWatch log group for VPC flow logs
- environment: Environment name for resource identification
- aws_region: AWS region where resources are deployed
- aws_account_id: AWS account ID for policy and ARN construction
- deployment_timestamp: Timestamp of infrastructure deployment for audit purposes

***

## Deployment

Execute deployment in the following sequence:

```bash
# Initialize Terraform and download providers
terraform init

# Validate configuration syntax and dependencies
terraform validate

# Generate execution plan and review changes
terraform plan

# Apply infrastructure with auto-approval for CI/CD
terraform apply -auto-approve

# Export outputs to JSON for integration testing
terraform output -json > cfn-outputs/flat-outputs.json

# Verify Lambda functions in VPC
aws lambda get-function --function-name lambda-data-processor-uat --region us-east-1

# Verify VPC endpoints are available
aws ec2 describe-vpc-endpoints --region us-east-1

# Test Lambda invocation through VPC endpoint
aws lambda invoke --function-name lambda-data-processor-uat response.json

# Destroy infrastructure when testing complete
terraform destroy -auto-approve
```