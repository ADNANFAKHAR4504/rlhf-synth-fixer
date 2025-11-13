# MODEL_RESPONSE - Security Configuration as Code

This document contains the initial Terraform implementation for a secure payment processing environment with defense-in-depth security controls.

## Architecture Overview

The infrastructure implements defense-in-depth security with multiple layers:

1. **Network Layer**: VPC with private subnets only, NACLs, VPC endpoints
2. **Encryption Layer**: KMS keys with rotation for RDS, S3, and logs
3. **Access Control**: IAM roles with session policies, security groups
4. **Data Layer**: RDS PostgreSQL with SSL enforcement, encrypted S3 buckets
5. **Monitoring Layer**: GuardDuty, Config, CloudWatch alarms

## Known Issues

This initial implementation has the following issues that need correction:

1. **networking.tf**: Missing S3 bucket policy to deny unencrypted uploads for flow logs
2. **security.tf**: Database security group egress rule incorrectly attempts to "deny" - security groups are allow-only
3. **security.tf**: IAM session duration constraint not properly implemented (needs max_session_duration or inline session policy)
4. **monitoring.tf**: EventBridge severity filter listing individual values instead of using numeric range
5. **provider.tf**: Missing random provider declaration for password generation

## Deployment Files

The implementation is organized into modular Terraform files for better maintainability.

### provider.tf

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

  # Using local backend for now - will be updated to S3 backend in CI/CD
  backend "local" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

### variables.tf

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "paymentdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "ec2_instance_type" {
  description = "EC2 instance type for payment processing"
  type        = string
  default     = "t3.medium"
}

variable "flow_logs_retention_days" {
  description = "Retention period for VPC flow logs in days"
  type        = number
  default     = 90
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Purpose     = "payment-processing"
    Compliance  = "PCI-DSS"
    ManagedBy   = "terraform"
  }
}
```

### networking.tf

```hcl
# networking.tf

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "vpc-${var.environment_suffix}"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "private"
  })
}

# S3 Bucket for VPC Flow Logs
resource "aws_s3_bucket" "flow_logs" {
  bucket = "vpc-flow-logs-${var.environment_suffix}"

  tags = merge(var.tags, {
    Name = "vpc-flow-logs-${var.environment_suffix}"
  })
}

resource "aws_s3_bucket_versioning" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    id     = "flow-logs-retention"
    status = "Enabled"

    expiration {
      days = var.flow_logs_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_s3_bucket.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "vpc-flow-log-${var.environment_suffix}"
  })
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "vpc-flow-logs-role-${var.environment_suffix}"

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

  tags = merge(var.tags, {
    Name = "vpc-flow-logs-role-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "vpc-flow-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = merge(var.tags, {
    Name = "s3-endpoint-${var.environment_suffix}"
  })
}

resource "aws_vpc_endpoint" "ec2" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ec2"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "ec2-endpoint-${var.environment_suffix}"
  })
}

resource "aws_vpc_endpoint" "rds" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.rds"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "rds-endpoint-${var.environment_suffix}"
  })
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "private-rt-${var.environment_suffix}"
  })
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Allow HTTPS inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 443
    to_port    = 443
  }

  # Allow PostgreSQL inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 5432
    to_port    = 5432
  }

  # Allow ephemeral ports inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }

  # Deny all other inbound traffic
  ingress {
    protocol   = -1
    rule_no    = 200
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  # Allow all outbound within VPC
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Deny all other outbound traffic
  egress {
    protocol   = -1
    rule_no    = 200
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(var.tags, {
    Name = "private-nacl-${var.environment_suffix}"
  })
}
```

### security.tf

```hcl
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
  name          = "alias/rds-${var.environment_suffix}"
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
  name          = "alias/s3-${var.environment_suffix}"
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
  name          = "alias/logs-${var.environment_suffix}"
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

  # Allow outbound HTTPS to database tier
  egress {
    description     = "PostgreSQL to database tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.database_tier.id]
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

  # Allow PostgreSQL from application tier only
  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_tier.id]
  }

  # No egress rules - database doesn't need outbound access
  egress {
    description = "Deny all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = merge(var.tags, {
    Name = "database-tier-sg-${var.environment_suffix}"
  })
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
        Sid    = "DenyUnencryptedUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.app_logs.arn}/*"
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
  bucket = "audit-trails-${var.environment_suffix}"

  tags = merge(var.tags, {
    Name = "audit-trails-${var.environment_suffix}"
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
        Sid    = "DenyUnencryptedUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_trails.arn}/*"
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
      days = 2555  # 7 years for compliance
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_payment_processing" {
  name = "ec2-payment-processing-role-${var.environment_suffix}"

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
    Name = "ec2-payment-processing-role-${var.environment_suffix}"
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
```

### database.tf

```hcl
# database.tf

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(var.tags, {
    Name = "db-subnet-group-${var.environment_suffix}"
  })
}

# DB Parameter Group for SSL enforcement
resource "aws_db_parameter_group" "postgres_ssl" {
  name   = "postgres-ssl-${var.environment_suffix}"
  family = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_duration"
    value = "1"
  }

  tags = merge(var.tags, {
    Name = "postgres-ssl-${var.environment_suffix}"
  })
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# AWS Secrets Manager for DB password
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "rds-password-${var.environment_suffix}"
  recovery_window_in_days = 0  # Force delete for testing

  tags = merge(var.tags, {
    Name = "rds-password-${var.environment_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "payment_db" {
  identifier     = "payment-db-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database_tier.id]
  parameter_group_name   = aws_db_parameter_group.postgres_ssl.name

  multi_az               = true
  publicly_accessible    = false

  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  deletion_protection = false  # Allow deletion for testing
  skip_final_snapshot = true   # Skip final snapshot for testing

  tags = merge(var.tags, {
    Name = "payment-db-${var.environment_suffix}"
  })
}
```

### monitoring.tf

```hcl
# monitoring.tf

# GuardDuty Detector
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
          enable = true
        }
      }
    }
  }

  tags = merge(var.tags, {
    Name = "guardduty-detector-${var.environment_suffix}"
  })
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "security-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.logs.id

  tags = merge(var.tags, {
    Name = "security-alerts-${var.environment_suffix}"
  })
}

# EventBridge Rule for GuardDuty Findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "guardduty-high-severity-${var.environment_suffix}"
  description = "Capture GuardDuty findings with HIGH severity"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9]
    }
  })

  tags = merge(var.tags, {
    Name = "guardduty-high-severity-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# AWS Config Configuration
resource "aws_config_configuration_recorder" "main" {
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "config-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config" {
  bucket = "aws-config-${var.environment_suffix}"

  tags = merge(var.tags, {
    Name = "aws-config-${var.environment_suffix}"
  })
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "aws-config-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/ConfigRole"]

  tags = merge(var.tags, {
    Name = "aws-config-role-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy" "config_s3" {
  name = "aws-config-s3-policy-${var.environment_suffix}"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}

# AWS Config Rules
resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "ec2_imdsv2" {
  name = "ec2-imdsv2-check-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "EC2_IMDSV2_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_public_read" {
  name = "s3-bucket-public-read-prohibited-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_public_write" {
  name = "s3-bucket-public-write-prohibited-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# CloudWatch Log Group for Security Events
resource "aws_cloudwatch_log_group" "security_events" {
  name              = "/aws/security/events-${var.environment_suffix}"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.logs.arn

  tags = merge(var.tags, {
    Name = "security-events-${var.environment_suffix}"
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_log_metric_filter" "root_login" {
  name           = "root-account-login-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.security_events.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountLoginCount"
    namespace = "SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_login" {
  alarm_name          = "root-account-login-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountLoginCount"
  namespace           = "SecurityMetrics"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alert on root account login attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.tags, {
    Name = "root-account-login-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_metric_filter" "failed_auth" {
  name           = "failed-authentication-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.security_events.name
  pattern        = "{ $.errorCode = \"*UnauthorizedOperation\" || $.errorCode = \"AccessDenied*\" }"

  metric_transformation {
    name      = "FailedAuthCount"
    namespace = "SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "failed_auth" {
  alarm_name          = "failed-authentication-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedAuthCount"
  namespace           = "SecurityMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert on multiple failed authentication attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.tags, {
    Name = "failed-authentication-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_api" {
  name           = "unauthorized-api-calls-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.security_events.name
  pattern        = "{ $.errorCode = \"*Unauthorized*\" || $.errorCode = \"AccessDenied*\" || $.errorCode = \"Forbidden\" }"

  metric_transformation {
    name      = "UnauthorizedAPICallCount"
    namespace = "SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api" {
  alarm_name          = "unauthorized-api-calls-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICallCount"
  namespace           = "SecurityMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert on unauthorized API call attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.tags, {
    Name = "unauthorized-api-calls-${var.environment_suffix}"
  })
}
```

### compute.tf

```hcl
# compute.tf

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Launch Template for EC2 Instances with IMDSv2
resource "aws_launch_template" "payment_processing" {
  name_prefix   = "payment-processing-${var.environment_suffix}"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.ec2_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_payment_processing.name
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 only
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app_tier.id]
    delete_on_termination       = true
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.s3.arn
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent

              # Configure CloudWatch Agent
              cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'EOC'
              {
                "logs": {
                  "logs_collected": {
                    "files": {
                      "collect_list": [
                        {
                          "file_path": "/var/log/messages",
                          "log_group_name": "${aws_cloudwatch_log_group.security_events.name}",
                          "log_stream_name": "{instance_id}/messages"
                        }
                      ]
                    }
                  }
                }
              }
              EOC

              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config \
                -m ec2 \
                -s \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
              EOF
  )

  tag_specifications {
    resource_type = "instance"

    tags = merge(var.tags, {
      Name = "payment-processing-${var.environment_suffix}"
    })
  }

  tag_specifications {
    resource_type = "volume"

    tags = merge(var.tags, {
      Name = "payment-processing-volume-${var.environment_suffix}"
    })
  }

  tags = merge(var.tags, {
    Name = "payment-processing-lt-${var.environment_suffix}"
  })
}

# EC2 Instances (one per AZ for demonstration)
resource "aws_instance" "payment_processing" {
  count = length(var.availability_zones)

  launch_template {
    id      = aws_launch_template.payment_processing.id
    version = "$Latest"
  }

  subnet_id = aws_subnet.private[count.index].id

  tags = merge(var.tags, {
    Name = "payment-processing-${count.index + 1}-${var.environment_suffix}"
    AZ   = var.availability_zones[count.index]
  })
}
```

### outputs.tf

```hcl
# outputs.tf

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "rds_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = aws_db_instance.payment_db.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = aws_db_instance.payment_db.db_name
}

output "kms_key_rds_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_key_s3_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.arn
}

output "kms_key_logs_arn" {
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.logs.arn
}

output "app_logs_bucket" {
  description = "Name of the S3 bucket for application logs"
  value       = aws_s3_bucket.app_logs.id
}

output "audit_trails_bucket" {
  description = "Name of the S3 bucket for audit trails"
  value       = aws_s3_bucket.audit_trails.id
}

output "flow_logs_bucket" {
  description = "Name of the S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 payment processing instances"
  value       = aws_instance.payment_processing[*].id
}

output "security_group_app_tier_id" {
  description = "ID of the application tier security group"
  value       = aws_security_group.app_tier.id
}

output "security_group_database_tier_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.database_tier.id
}

output "vpc_endpoint_s3_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_ec2_id" {
  description = "ID of the EC2 VPC endpoint"
  value       = aws_vpc_endpoint.ec2.id
}

output "vpc_endpoint_rds_id" {
  description = "ID of the RDS VPC endpoint"
  value       = aws_vpc_endpoint.rds.id
}

output "db_password_secret_arn" {
  description = "ARN of the Secrets Manager secret for DB password"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "config_recorder_id" {
  description = "ID of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}
```

## Deployment Instructions

1. **Initialize Terraform**:
```bash
terraform init
```

2. **Create terraform.tfvars**:
```hcl
environment_suffix = "prod-001"
aws_region = "us-east-1"
```

3. **Plan deployment**:
```bash
terraform plan -out=tfplan
```

4. **Apply configuration**:
```bash
terraform apply tfplan
```

## Verification Steps

After deployment, verify:
- VPC and subnets created
- KMS keys have rotation enabled
- RDS instance is encrypted
- S3 buckets have versioning and encryption
- GuardDuty is active
- Config rules are evaluating
- CloudWatch alarms are configured
