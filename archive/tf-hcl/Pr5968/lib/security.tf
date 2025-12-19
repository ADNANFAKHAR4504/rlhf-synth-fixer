# security.tf

# KMS Key for RDS
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "rds-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment_suffix}-xy"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS Key for S3
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "s3-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-${var.environment_suffix}-xy"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "logs" {
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

  tags = merge(var.tags, {
    Name = "logs-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "logs" {
  name          = "alias/logs-${var.environment_suffix}-xy"
  target_key_id = aws_kms_key.logs.key_id
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Security Group for Application Tier
resource "aws_security_group" "app_tier" {
  name        = "app-tier-sg-${var.environment_suffix}"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  # Allow HTTPS inbound from within VPC
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow HTTPS outbound for VPC endpoints
  egress {
    description = "HTTPS to VPC endpoints"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(var.tags, {
    Name = "app-tier-sg-${var.environment_suffix}"
  })
}

# Security Group for Database Tier
resource "aws_security_group" "database_tier" {
  name        = "database-tier-sg-${var.environment_suffix}"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.main.id

  # No inline rules to avoid circular dependency

  tags = merge(var.tags, {
    Name = "database-tier-sg-${var.environment_suffix}"
  })
}

# Security Group Rules (separate to avoid circular dependency)
resource "aws_security_group_rule" "app_to_db" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.database_tier.id
  security_group_id        = aws_security_group.app_tier.id
  description              = "PostgreSQL to database tier"
}

resource "aws_security_group_rule" "db_from_app" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app_tier.id
  security_group_id        = aws_security_group.database_tier.id
  description              = "PostgreSQL from app tier"
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "vpc-endpoints-sg-${var.environment_suffix}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  # Allow HTTPS from VPC
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = merge(var.tags, {
    Name = "vpc-endpoints-sg-${var.environment_suffix}"
  })
}

# S3 Bucket for Application Logs
resource "aws_s3_bucket" "app_logs" {
  bucket = "app-logs-${var.environment_suffix}"

  tags = merge(var.tags, {
    Name = "app-logs-${var.environment_suffix}"
  })
}

resource "aws_s3_bucket_versioning" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.app_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  rule {
    id     = "app-logs-retention"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# S3 Bucket for Audit Trails
resource "aws_s3_bucket" "audit_trails" {
  bucket = "audit-trails-${var.environment_suffix}-xy"

  tags = merge(var.tags, {
    Name = "audit-trails-${var.environment_suffix}-xy"
  })
}

resource "aws_s3_bucket_versioning" "audit_trails" {
  bucket = aws_s3_bucket.audit_trails.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_trails" {
  bucket = aws_s3_bucket.audit_trails.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_trails" {
  bucket = aws_s3_bucket.audit_trails.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "audit_trails" {
  bucket = aws_s3_bucket.audit_trails.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.audit_trails.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_trails" {
  bucket = aws_s3_bucket.audit_trails.id

  rule {
    id     = "audit-trails-retention"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years for compliance
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_payment_processing" {
  name = "ec2-payment-processing-role-${var.environment_suffix}-xy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "ec2-payment-processing-role-${var.environment_suffix}-xy"
  })
}

# IAM Policy for EC2 with session constraints
resource "aws_iam_role_policy" "ec2_session_policy" {
  name = "ec2-session-policy-${var.environment_suffix}"
  role = aws_iam_role.ec2_payment_processing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          "${aws_s3_bucket.app_logs.arn}/*",
          "${aws_s3_bucket.audit_trails.arn}/*"
        ]
        Condition = {
          DateLessThan = {
            "aws:CurrentTime" = "2099-12-31T23:59:59Z"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/*"
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_payment_processing" {
  name = "ec2-payment-processing-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2_payment_processing.name

  tags = merge(var.tags, {
    Name = "ec2-payment-processing-profile-${var.environment_suffix}"
  })
}
