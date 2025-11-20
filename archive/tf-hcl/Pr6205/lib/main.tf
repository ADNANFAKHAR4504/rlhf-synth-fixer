# Data Sources
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ===== NETWORKING INFRASTRUCTURE =====

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


# ===== VPC ENDPOINTS =====

# Gateway Endpoint for S3 (Free)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.secure_processing.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "vpce-s3-${var.environment}"
  }
}

# Gateway Endpoint for DynamoDB (Free)
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

# ===== SECURITY GROUPS =====

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

# ===== KMS ENCRYPTION KEYS =====

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

# ===== S3 BUCKETS =====

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


# ===== DYNAMODB TABLES =====

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

# ===== IAM ROLES =====

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

# Data Processor Role (Human/Service)
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

# ===== LAMBDA FUNCTIONS =====

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

# ===== OUTPUTS =====

output "vpc_id" {
  value       = aws_vpc.secure_processing.id
  description = "ID of the secure processing VPC"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "IDs of the private subnets"
}

output "route_table_id" {
  value       = aws_route_table.private.id
  description = "ID of the private route table"
}

output "s3_endpoint_id" {
  value       = aws_vpc_endpoint.s3.id
  description = "ID of the S3 VPC endpoint"
}

output "dynamodb_endpoint_id" {
  value       = aws_vpc_endpoint.dynamodb.id
  description = "ID of the DynamoDB VPC endpoint"
}

output "lambda_endpoint_id" {
  value       = aws_vpc_endpoint.lambda.id
  description = "ID of the Lambda VPC endpoint"
}

output "logs_endpoint_id" {
  value       = aws_vpc_endpoint.logs.id
  description = "ID of the CloudWatch Logs VPC endpoint"
}

output "lambda_security_group_id" {
  value       = aws_security_group.lambda.id
  description = "ID of the Lambda security group"
}

output "vpc_endpoint_security_group_id" {
  value       = aws_security_group.vpc_endpoint.id
  description = "ID of the VPC endpoint security group"
}

output "kms_s3_key_arn" {
  value       = aws_kms_key.s3_encryption.arn
  description = "ARN of the S3 encryption KMS key"
}

output "kms_dynamodb_key_arn" {
  value       = aws_kms_key.dynamodb_encryption.arn
  description = "ARN of the DynamoDB encryption KMS key"
}

output "kms_logs_key_arn" {
  value       = aws_kms_key.logs_encryption.arn
  description = "ARN of the CloudWatch Logs encryption KMS key"
}

output "lambda_processor_role_arn" {
  value       = aws_iam_role.lambda_processor.arn
  description = "ARN of the Lambda processor execution role"
}

output "lambda_validator_role_arn" {
  value       = aws_iam_role.lambda_validator.arn
  description = "ARN of the Lambda validator execution role"
}

output "data_processor_role_arn" {
  value       = aws_iam_role.data_processor.arn
  description = "ARN of the data processor role"
}

output "auditor_role_arn" {
  value       = aws_iam_role.auditor.arn
  description = "ARN of the auditor role"
}

output "administrator_role_arn" {
  value       = aws_iam_role.administrator.arn
  description = "ARN of the administrator role"
}

output "lambda_processor_role_name" {
  value       = aws_iam_role.lambda_processor.name
  description = "Name of the Lambda processor execution role"
}

output "lambda_validator_role_name" {
  value       = aws_iam_role.lambda_validator.name
  description = "Name of the Lambda validator execution role"
}

output "data_processor_role_name" {
  value       = aws_iam_role.data_processor.name
  description = "Name of the data processor role"
}

output "auditor_role_name" {
  value       = aws_iam_role.auditor.name
  description = "Name of the auditor role"
}

output "administrator_role_name" {
  value       = aws_iam_role.administrator.name
  description = "Name of the administrator role"
}

output "raw_data_bucket_name" {
  value       = aws_s3_bucket.raw_data.id
  description = "Name of the raw data S3 bucket"
}

output "processed_data_bucket_name" {
  value       = aws_s3_bucket.processed_data.id
  description = "Name of the processed data S3 bucket"
}

output "audit_logs_bucket_name" {
  value       = aws_s3_bucket.audit_logs.id
  description = "Name of the audit logs S3 bucket"
}

output "raw_data_bucket_arn" {
  value       = aws_s3_bucket.raw_data.arn
  description = "ARN of the raw data S3 bucket"
}

output "processed_data_bucket_arn" {
  value       = aws_s3_bucket.processed_data.arn
  description = "ARN of the processed data S3 bucket"
}

output "audit_logs_bucket_arn" {
  value       = aws_s3_bucket.audit_logs.arn
  description = "ARN of the audit logs S3 bucket"
}

output "lambda_processor_function_name" {
  value       = aws_lambda_function.data_processor.function_name
  description = "Name of the data processor Lambda function"
}

output "lambda_validator_function_name" {
  value       = aws_lambda_function.data_validator.function_name
  description = "Name of the data validator Lambda function"
}

output "lambda_processor_function_arn" {
  value       = aws_lambda_function.data_processor.arn
  description = "ARN of the data processor Lambda function"
}

output "lambda_validator_function_arn" {
  value       = aws_lambda_function.data_validator.arn
  description = "ARN of the data validator Lambda function"
}

output "metadata_table_name" {
  value       = aws_dynamodb_table.metadata.name
  description = "Name of the metadata DynamoDB table"
}

output "audit_table_name" {
  value       = aws_dynamodb_table.audit.name
  description = "Name of the audit DynamoDB table"
}

output "metadata_table_arn" {
  value       = aws_dynamodb_table.metadata.arn
  description = "ARN of the metadata DynamoDB table"
}

output "audit_table_arn" {
  value       = aws_dynamodb_table.audit.arn
  description = "ARN of the audit DynamoDB table"
}

output "processor_log_group_name" {
  value       = aws_cloudwatch_log_group.data_processor.name
  description = "Name of the processor Lambda log group"
}

output "validator_log_group_name" {
  value       = aws_cloudwatch_log_group.data_validator.name
  description = "Name of the validator Lambda log group"
}

output "vpc_flow_logs_log_group_name" {
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
  description = "Name of the VPC Flow Logs log group"
}

output "environment" {
  value       = var.environment
  description = "Environment name"
}

output "aws_region" {
  value       = var.aws_region
  description = "AWS region"
}

output "aws_account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS account ID"
}

output "deployment_timestamp" {
  value       = timestamp()
  description = "Timestamp of the deployment"
}