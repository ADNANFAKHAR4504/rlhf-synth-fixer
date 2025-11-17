# MODEL_RESPONSE - Terraform Infrastructure for Payment Processing Platform

This response provides a complete Terraform configuration for a multi-environment AWS infrastructure supporting a payment processing application.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "environment" {
  description = "Environment name (dev or prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "payment-processing"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "fintech-team"
}

variable "alert_email" {
  description = "Email address for SNS alerts"
  type        = string
}

variable "enable_cross_region_replication" {
  description = "Enable S3 cross-region replication for production"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "Region for S3 cross-region replication"
  type        = string
  default     = "us-west-2"
}
```

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary provider for replication region
provider "aws" {
  alias  = "replication"
  region = var.replication_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
    }
  }
}

locals {
  vpc_cidr = var.environment == "dev" ? "10.0.0.0/16" : "172.16.0.0/16"
  azs      = ["${var.region}a", "${var.region}b", "${var.region}c"]

  api_throttle_rate_limit  = var.environment == "dev" ? 100 : 1000
  api_throttle_burst_limit = var.environment == "dev" ? 200 : 2000

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
  }
}
```

## File: lib/networking.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "igw-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "public-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
      Type = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 8, count.index + 10)
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "private-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
      Type = "private"
    }
  )
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 8, count.index + 20)
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "database-subnet-${count.index + 1}-${var.environment}-${var.environment_suffix}"
      Type = "database"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "nat-eip-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-gateway-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "public-rt-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "private-rt-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "database-rt-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Database Route Table Associations
resource "aws_route_table_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment}-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "db-subnet-group-${var.environment}-${var.environment_suffix}"
    }
  )
}
```

## File: lib/vpc_endpoints.tf

```hcl
# S3 VPC Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    [aws_route_table.database.id]
  )

  tags = merge(
    local.common_tags,
    {
      Name = "s3-vpc-endpoint-${var.environment}-${var.environment_suffix}"
    }
  )
}

# DynamoDB VPC Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(
    local.common_tags,
    {
      Name = "dynamodb-vpc-endpoint-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Security Group for Interface Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "vpc-endpoints-${var.environment}-${var.environment_suffix}-"
  description = "Security group for VPC interface endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "vpc-endpoints-sg-${var.environment}-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda VPC Endpoint
resource "aws_vpc_endpoint" "lambda" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.lambda"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-vpc-endpoint-${var.environment}-${var.environment_suffix}"
    }
  )
}
```

## File: lib/security.tf

```hcl
# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption - ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-kms-key-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment}-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption - ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "s3-kms-key-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-${var.environment}-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3.key_id
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "rds-${var.environment}-${var.environment_suffix}-"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "PostgreSQL from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-sg-${var.environment}-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "lambda-${var.environment}-${var.environment_suffix}-"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-sg-${var.environment}-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}
```

## File: lib/rds.tf

```hcl
# RDS Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier              = "aurora-cluster-${var.environment}-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_mode                     = "provisioned"
  engine_version                  = "15.4"
  database_name                   = "payments"
  master_username                 = "dbadmin"
  master_password                 = random_password.db_password.result
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  backup_retention_period         = var.environment == "prod" ? 30 : 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.rds.arn
  skip_final_snapshot             = true
  final_snapshot_identifier       = null
  apply_immediately               = true

  serverlessv2_scaling_configuration {
    max_capacity = var.environment == "prod" ? 16.0 : 4.0
    min_capacity = 0.5
  }

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-cluster-${var.environment}-${var.environment_suffix}"
    }
  )
}

# RDS Aurora Instance
resource "aws_rds_cluster_instance" "main" {
  count                = var.environment == "prod" ? 2 : 1
  identifier           = "aurora-instance-${count.index + 1}-${var.environment}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-instance-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store DB password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "rds-password-${var.environment}-${var.environment_suffix}"
  description             = "RDS master password for ${var.environment} environment"
  recovery_window_in_days = 0

  tags = merge(
    local.common_tags,
    {
      Name = "rds-password-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_rds_cluster.main.master_username
    password = random_password.db_password.result
    endpoint = aws_rds_cluster.main.endpoint
    database = aws_rds_cluster.main.database_name
  })
}
```

## File: lib/storage.tf

```hcl
# S3 Bucket for Transaction Logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = "transaction-logs-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_versioning" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    id     = "transition-to-glacier"
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

# S3 Bucket for Customer Documents
resource "aws_s3_bucket" "customer_documents" {
  bucket = "customer-documents-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "customer-documents-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_versioning" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    id     = "transition-to-ia"
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

# Cross-Region Replication for Production
resource "aws_s3_bucket" "customer_documents_replica" {
  count    = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  provider = aws.replication
  bucket   = "customer-documents-replica-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "customer-documents-replica-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_versioning" "customer_documents_replica" {
  count    = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  provider = aws.replication
  bucket   = aws_s3_bucket.customer_documents_replica[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_iam_role" "replication" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  name  = "s3-replication-role-${var.environment}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "replication" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  name  = "s3-replication-policy-${var.environment}-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.customer_documents.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.customer_documents.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.customer_documents_replica[0].arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  count      = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  role       = aws_iam_role.replication[0].name
  policy_arn = aws_iam_policy.replication[0].arn
}

resource "aws_s3_bucket_replication_configuration" "customer_documents" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0

  depends_on = [aws_s3_bucket_versioning.customer_documents]

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.customer_documents_replica[0].arn
      storage_class = "STANDARD"
    }
  }
}
```

## File: lib/iam.tf

```hcl
# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_execution" {
  name = "lambda-execution-role-${var.environment}-${var.environment_suffix}"

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

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-execution-role-${var.environment}-${var.environment_suffix}"
    }
  )
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda-logging-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda CloudWatch logging"

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
        Resource = "arn:aws:logs:${var.region}:*:*"
      },
      {
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - VPC Access
resource "aws_iam_policy" "lambda_vpc" {
  name        = "lambda-vpc-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda VPC access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - S3 Access
resource "aws_iam_policy" "lambda_s3" {
  name        = "lambda-s3-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda S3 access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.transaction_logs.arn}/*",
          "${aws_s3_bucket.customer_documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.transaction_logs.arn,
          aws_s3_bucket.customer_documents.arn
        ]
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "s3:DeleteBucketPolicy"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - Secrets Manager Access
resource "aws_iam_policy" "lambda_secrets" {
  name        = "lambda-secrets-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda Secrets Manager access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      },
      {
        Effect = "Deny"
        Action = [
          "secretsmanager:DeleteSecret",
          "secretsmanager:PutSecretValue"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - KMS Access
resource "aws_iam_policy" "lambda_kms" {
  name        = "lambda-kms-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda KMS access"

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
          aws_kms_key.s3.arn,
          aws_kms_key.rds.arn
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Attach policies to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_vpc.arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_s3.arn
}

resource "aws_iam_role_policy_attachment" "lambda_secrets" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_secrets.arn
}

resource "aws_iam_role_policy_attachment" "lambda_kms" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_kms.arn
}
```

## File: lib/lambda.tf

```hcl
# CloudWatch Log Group for Payment Validation Lambda
resource "aws_cloudwatch_log_group" "payment_validation" {
  name              = "/aws/lambda/payment-validation-${var.environment}-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "payment-validation-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Lambda Function - Payment Validation
resource "aws_lambda_function" "payment_validation" {
  filename         = "${path.module}/lambda/payment_validation.zip"
  function_name    = "payment-validation-${var.environment}-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_validation.zip")
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT           = var.environment
      DB_SECRET_ARN         = aws_secretsmanager_secret.db_password.arn
      TRANSACTION_LOGS_BUCKET = aws_s3_bucket.transaction_logs.id
      REGION                = var.region
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.payment_validation,
    aws_iam_role_policy_attachment.lambda_logging,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "payment-validation-${var.environment}-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for Transaction Processing Lambda
resource "aws_cloudwatch_log_group" "transaction_processing" {
  name              = "/aws/lambda/transaction-processing-${var.environment}-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-processing-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Lambda Function - Transaction Processing
resource "aws_lambda_function" "transaction_processing" {
  filename         = "${path.module}/lambda/transaction_processing.zip"
  function_name    = "transaction-processing-${var.environment}-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/transaction_processing.zip")
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 1024

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT             = var.environment
      DB_SECRET_ARN           = aws_secretsmanager_secret.db_password.arn
      TRANSACTION_LOGS_BUCKET = aws_s3_bucket.transaction_logs.id
      CUSTOMER_DOCS_BUCKET    = aws_s3_bucket.customer_documents.id
      SNS_TOPIC_ARN           = aws_sns_topic.transaction_alerts.arn
      REGION                  = var.region
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.transaction_processing,
    aws_iam_role_policy_attachment.lambda_logging,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-processing-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Lambda Permission for API Gateway - Payment Validation
resource "aws_lambda_permission" "payment_validation_api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_validation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Lambda Permission for API Gateway - Transaction Processing
resource "aws_lambda_permission" "transaction_processing_api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_processing.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
```

## File: lib/lambda/payment_validation.py

```python
import json
import os
import boto3
from datetime import datetime

def handler(event, context):
    """
    Payment validation Lambda function
    Validates payment requests before processing
    """

    print(f"Received event: {json.dumps(event)}")

    environment = os.environ.get('ENVIRONMENT', 'dev')

    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract payment details
        amount = body.get('amount')
        currency = body.get('currency', 'USD')
        payment_method = body.get('payment_method')
        customer_id = body.get('customer_id')

        # Validation rules
        errors = []

        if not amount:
            errors.append("Amount is required")
        elif not isinstance(amount, (int, float)) or amount <= 0:
            errors.append("Amount must be a positive number")

        if not currency or len(currency) != 3:
            errors.append("Valid 3-letter currency code is required")

        if not payment_method:
            errors.append("Payment method is required")

        if not customer_id:
            errors.append("Customer ID is required")

        # Check for errors
        if errors:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'message': 'Validation failed',
                    'errors': errors
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }

        # Validation successful
        validation_result = {
            'valid': True,
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment,
            'payment_details': {
                'amount': amount,
                'currency': currency,
                'payment_method': payment_method,
                'customer_id': customer_id
            }
        }

        return {
            'statusCode': 200,
            'body': json.dumps(validation_result),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e)
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
```

## File: lib/lambda/transaction_processing.py

```python
import json
import os
import boto3
from datetime import datetime
import uuid

s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

def handler(event, context):
    """
    Transaction processing Lambda function
    Processes validated payment transactions
    """

    print(f"Received event: {json.dumps(event)}")

    environment = os.environ.get('ENVIRONMENT', 'dev')
    transaction_logs_bucket = os.environ.get('TRANSACTION_LOGS_BUCKET')
    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Generate transaction ID
        transaction_id = str(uuid.uuid4())

        # Extract transaction details
        amount = body.get('amount')
        currency = body.get('currency', 'USD')
        payment_method = body.get('payment_method')
        customer_id = body.get('customer_id')

        # Simulate transaction processing
        transaction_status = 'completed'

        # Create transaction log
        transaction_log = {
            'transaction_id': transaction_id,
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment,
            'status': transaction_status,
            'amount': amount,
            'currency': currency,
            'payment_method': payment_method,
            'customer_id': customer_id
        }

        # Store transaction log in S3
        log_key = f"transactions/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}.json"
        s3_client.put_object(
            Bucket=transaction_logs_bucket,
            Key=log_key,
            Body=json.dumps(transaction_log),
            ContentType='application/json'
        )

        print(f"Transaction log stored: s3://{transaction_logs_bucket}/{log_key}")

        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id,
                'status': transaction_status
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    except Exception as e:
        error_message = str(e)
        print(f"Error processing transaction: {error_message}")

        # Send SNS alert for failed transaction
        try:
            sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject='Transaction Processing Failed',
                Message=f"Transaction failed in {environment} environment.\n\nError: {error_message}\n\nEvent: {json.dumps(event)}"
            )
        except Exception as sns_error:
            print(f"Failed to send SNS alert: {str(sns_error)}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Transaction processing failed',
                'error': error_message
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
```

## File: lib/api_gateway.tf

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "payment-api-${var.environment}-${var.environment_suffix}"
  description = "Payment Processing API for ${var.environment} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-api-${var.environment}-${var.environment_suffix}"
    }
  )
}

# API Gateway Request Validator
resource "aws_api_gateway_request_validator" "main" {
  name                        = "request-validator-${var.environment}"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# API Gateway Resource - /validate
resource "aws_api_gateway_resource" "validate" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "validate"
}

# API Gateway Method - POST /validate
resource "aws_api_gateway_method" "validate_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.validate.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.main.id
}

# API Gateway Integration - Payment Validation Lambda
resource "aws_api_gateway_integration" "validate_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.validate.id
  http_method             = aws_api_gateway_method.validate_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validation.invoke_arn
}

# API Gateway Resource - /process
resource "aws_api_gateway_resource" "process" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "process"
}

# API Gateway Method - POST /process
resource "aws_api_gateway_method" "process_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.process.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.main.id
}

# API Gateway Integration - Transaction Processing Lambda
resource "aws_api_gateway_integration" "process_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.process.id
  http_method             = aws_api_gateway_method.process_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_processing.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.validate.id,
      aws_api_gateway_method.validate_post.id,
      aws_api_gateway_integration.validate_lambda.id,
      aws_api_gateway_resource.process.id,
      aws_api_gateway_method.process_post.id,
      aws_api_gateway_integration.process_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.validate_lambda,
    aws_api_gateway_integration.process_lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  xray_tracing_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "payment-api-stage-${var.environment}-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/payment-api-${var.environment}-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "api-gateway-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# API Gateway Method Settings for Throttling
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_rate_limit  = local.api_throttle_rate_limit
    throttling_burst_limit = local.api_throttle_burst_limit
  }
}
```

## File: lib/waf.tf

```hcl
# WAF Web ACL for API Gateway
resource "aws_wafv2_web_acl" "api_gateway" {
  name  = "api-gateway-waf-${var.environment}-${var.environment_suffix}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: Rate limiting
  rule {
    name     = "rate-limiting"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.environment == "prod" ? 2000 : 500
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Rules - Common Rule Set
  rule {
    name     = "aws-managed-common-rule-set"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "aws-managed-known-bad-inputs"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedKnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: SQL Injection Protection
  rule {
    name     = "sql-injection-protection"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionProtection"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "APIGatewayWAF"
    sampled_requests_enabled   = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "api-gateway-waf-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Associate WAF Web ACL with API Gateway Stage
resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = aws_api_gateway_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway.arn
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${var.environment}-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "waf-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "api_gateway" {
  resource_arn            = aws_wafv2_web_acl.api_gateway.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
}
```

## File: lib/monitoring.tf

```hcl
# SNS Topic for Transaction Alerts
resource "aws_sns_topic" "transaction_alerts" {
  name = "transaction-alerts-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-alerts-${var.environment}-${var.environment_suffix}"
    }
  )
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "transaction_alerts_email" {
  topic_arn = aws_sns_topic.transaction_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# SNS Topic for System Errors
resource "aws_sns_topic" "system_errors" {
  name = "system-errors-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "system-errors-${var.environment}-${var.environment_suffix}"
    }
  )
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "system_errors_email" {
  topic_arn = aws_sns_topic.system_errors.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# IAM Policy for Lambda to publish to SNS
resource "aws_iam_policy" "lambda_sns" {
  name        = "lambda-sns-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda SNS publishing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.transaction_alerts.arn,
          aws_sns_topic.system_errors.arn
        ]
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_sns" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_sns.arn
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "payment-processing-${var.environment}-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", { stat = "Average", period = 300 }],
            ["...", { stat = "p99", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "API Gateway Latency"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", period = 300 }],
            [".", "Throttles", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Lambda Errors and Throttles"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", period = 300 }],
            [".", "CPUUtilization", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "RDS Connection and CPU Metrics"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", period = 300 }],
            [".", "4XXError", { stat = "Sum", period = 300 }],
            [".", "5XXError", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "API Gateway Request Count and Errors"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarm - API Gateway 5XX Errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "api-gateway-5xx-errors-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when API Gateway 5XX errors exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = local.common_tags
}

# CloudWatch Alarm - Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "lambda-errors-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda errors exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]

  tags = local.common_tags
}

# CloudWatch Alarm - RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "rds-cpu-utilization-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when RDS CPU utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.system_errors.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}

# CloudWatch Alarm - RDS Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "rds-database-connections-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Alert when RDS database connections exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the RDS cluster"
  value       = aws_rds_cluster.main.id
}

output "rds_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "transaction_logs_bucket_name" {
  description = "Name of the S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.id
}

output "transaction_logs_bucket_arn" {
  description = "ARN of the S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.arn
}

output "customer_documents_bucket_name" {
  description = "Name of the S3 bucket for customer documents"
  value       = aws_s3_bucket.customer_documents.id
}

output "customer_documents_bucket_arn" {
  description = "ARN of the S3 bucket for customer documents"
  value       = aws_s3_bucket.customer_documents.arn
}

output "payment_validation_lambda_arn" {
  description = "ARN of the payment validation Lambda function"
  value       = aws_lambda_function.payment_validation.arn
}

output "transaction_processing_lambda_arn" {
  description = "ARN of the transaction processing Lambda function"
  value       = aws_lambda_function.transaction_processing.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_endpoint" {
  description = "Invoke URL of the API Gateway"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.main.stage_name
}

output "transaction_alerts_topic_arn" {
  description = "ARN of the SNS topic for transaction alerts"
  value       = aws_sns_topic.transaction_alerts.arn
}

output "system_errors_topic_arn" {
  description = "ARN of the SNS topic for system errors"
  value       = aws_sns_topic.system_errors.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.api_gateway.arn
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy this to terraform.tfvars and update with your values

environment_suffix = "unique123"
environment        = "dev"
region             = "us-east-1"
project_name       = "payment-processing"
owner              = "fintech-team"
alert_email        = "alerts@example.com"

# For production environment with cross-region replication
# enable_cross_region_replication = true
# replication_region = "us-west-2"
```

## File: lib/README.md

```markdown
# Payment Processing Platform Infrastructure

This Terraform configuration provisions a complete multi-environment AWS infrastructure for a payment processing platform.

## Architecture Overview

The infrastructure includes:

- **Networking**: Separate VPCs for dev/prod with 3 availability zones
- **Compute**: Lambda functions for payment validation and transaction processing
- **Storage**: RDS Aurora PostgreSQL with encryption, S3 buckets with versioning
- **API**: API Gateway with throttling and WAF protection
- **Monitoring**: CloudWatch dashboards, alarms, and SNS alerts
- **Security**: KMS encryption, IAM least privilege, VPC endpoints

## Prerequisites

- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials
- An email address for SNS alert subscriptions

## Directory Structure

```
lib/
├── main.tf                  # Provider and locals configuration
├── variables.tf             # Input variables
├── networking.tf            # VPC, subnets, route tables
├── vpc_endpoints.tf         # VPC endpoints for AWS services
├── security.tf              # Security groups and KMS keys
├── rds.tf                   # RDS Aurora cluster
├── storage.tf               # S3 buckets and replication
├── iam.tf                   # IAM roles and policies
├── lambda.tf                # Lambda functions
├── api_gateway.tf           # API Gateway configuration
├── waf.tf                   # AWS WAF rules
├── monitoring.tf            # CloudWatch and SNS
├── outputs.tf               # Output values
├── lambda/                  # Lambda function code
│   ├── payment_validation.py
│   └── transaction_processing.py
└── README.md               # This file
```

## Deployment Instructions

### 1. Prepare Lambda Code

Package the Lambda functions:

```bash
cd lib/lambda
zip payment_validation.zip payment_validation.py
zip transaction_processing.zip transaction_processing.py
cd ..
```

### 2. Configure Variables

Copy the example variables file and update with your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
environment_suffix = "abc123"          # Unique suffix for resource names
environment        = "dev"              # "dev" or "prod"
region             = "us-east-1"        # AWS region
alert_email        = "your@email.com"   # Email for alerts
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 5. Apply Configuration

```bash
terraform apply tfplan
```

### 6. Confirm SNS Subscriptions

Check your email and confirm the SNS topic subscriptions for alerts.

## Environment-Specific Configurations

### Development Environment

- VPC CIDR: 10.0.0.0/16
- API throttling: 100 req/sec
- RDS: Single instance, 7-day backups
- No cross-region replication

### Production Environment

- VPC CIDR: 172.16.0.0/16
- API throttling: 1000 req/sec
- RDS: Multi-instance, 30-day backups
- Optional cross-region replication

To enable production features:

```hcl
environment                     = "prod"
enable_cross_region_replication = true
replication_region              = "us-west-2"
```

## API Endpoints

After deployment, the API Gateway provides these endpoints:

- **POST /validate**: Payment validation endpoint
  - Lambda: payment-validation
  - Purpose: Validate payment requests

- **POST /process**: Transaction processing endpoint
  - Lambda: transaction-processing
  - Purpose: Process validated transactions

Base URL: See `api_gateway_endpoint` output

## Testing the API

### Validate Payment

```bash
curl -X POST https://<api-gateway-url>/validate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "payment_method": "credit_card",
    "customer_id": "cust_123"
  }'
```

### Process Transaction

```bash
curl -X POST https://<api-gateway-url>/process \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "payment_method": "credit_card",
    "customer_id": "cust_123"
  }'
```

## Monitoring

### CloudWatch Dashboard

Access the dashboard in AWS Console:
- Dashboard name: `payment-processing-<environment>-<suffix>`
- Metrics: API latency, Lambda errors, RDS connections

### Alarms

Configured alarms:
- API Gateway 5XX errors > 10 in 5 minutes
- Lambda errors > 5 in 5 minutes
- RDS CPU utilization > 80%
- RDS database connections > 100

### Logs

CloudWatch Log Groups:
- `/aws/lambda/payment-validation-<env>-<suffix>`
- `/aws/lambda/transaction-processing-<env>-<suffix>`
- `/aws/apigateway/payment-api-<env>-<suffix>`
- `aws-waf-logs-<env>-<suffix>`

## Security Features

### Encryption

- **At Rest**: All data encrypted using customer-managed KMS keys
- **In Transit**: TLS/SSL for all communications

### Network Security

- Lambda functions run in private subnets
- RDS in database subnets (no internet access)
- VPC endpoints for AWS services (no internet gateway costs)

### Access Control

- IAM roles follow least privilege principle
- Explicit deny statements for destructive operations
- Security groups restrict traffic to minimum required

### WAF Protection

- Rate limiting per IP address
- AWS Managed Rules: Common Rule Set
- AWS Managed Rules: Known Bad Inputs
- SQL injection protection

## Cost Optimization

- Aurora Serverless v2 for automatic scaling
- S3 lifecycle policies for data archiving
- VPC endpoints to avoid data transfer costs
- CloudWatch log retention: 30 days

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: Ensure all data is backed up before destroying production infrastructure.

## Troubleshooting

### Lambda Functions Not Connecting to RDS

- Check security group rules
- Verify Lambda is in private subnets
- Confirm RDS secret is accessible

### API Gateway Throttling

- Check CloudWatch metrics for throttle counts
- Adjust throttling limits in variables
- Consider using API keys for clients

### High RDS Costs

- Review Aurora Serverless scaling settings
- Check for unnecessary database connections
- Optimize query performance

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review CloudWatch alarms for system health
3. Check SNS topic for alert notifications

## License

This infrastructure code is provided as-is for the payment processing platform.
```
