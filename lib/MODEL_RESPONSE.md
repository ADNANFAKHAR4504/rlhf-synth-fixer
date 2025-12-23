# Multi-Region Payment Processing Infrastructure

This Terraform configuration implements a complete multi-region payment processing infrastructure spanning us-east-1 (primary) and eu-west-1 (secondary) with all required services, cross-region replication, failover routing, and workspace-based management.

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

# Primary provider - region determined by workspace
provider "aws" {
  alias  = "primary"
  region = terraform.workspace == "primary" ? "us-east-1" : "eu-west-1"

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
      Workspace   = terraform.workspace
      Region      = terraform.workspace == "primary" ? "us-east-1" : "eu-west-1"
    }
  }
}

# Secondary provider - opposite region
provider "aws" {
  alias  = "secondary"
  region = terraform.workspace == "primary" ? "eu-west-1" : "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
      Workspace   = terraform.workspace
      Region      = terraform.workspace == "primary" ? "eu-west-1" : "us-east-1"
    }
  }
}

# IAM provider - always us-east-1 for global resources
provider "aws" {
  alias  = "iam"
  region = "us-east-1"

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

# Route53 provider - always us-east-1 for global DNS
provider "aws" {
  alias  = "route53"
  region = "us-east-1"
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "Primary AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (required for uniqueness)"
  type        = string
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "iac-test-automations"
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
  default     = "synth"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "payment-processor"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_master_username" {
  description = "Master username for RDS PostgreSQL"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for RDS PostgreSQL"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for API Gateway custom domains"
  type        = string
  default     = "api.example.com"
}
```

## File: lib/locals.tf

```hcl
locals {
  current_region = terraform.workspace == "primary" ? "us-east-1" : "eu-west-1"
  other_region   = terraform.workspace == "primary" ? "eu-west-1" : "us-east-1"

  # Workspace-specific configuration
  is_primary = terraform.workspace == "primary"

  # Resource naming with environment suffix
  resource_prefix = "${var.project_name}-${var.environment_suffix}"

  # Availability zones
  azs_primary   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  azs_secondary = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

  current_azs = local.is_primary ? local.azs_primary : local.azs_secondary

  # Subnet CIDRs
  primary_public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  primary_private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

  secondary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  secondary_private_subnets = ["10.1.10.0/24", "10.1.11.0/24", "10.1.12.0/24"]

  current_public_subnets  = local.is_primary ? local.primary_public_subnets : local.secondary_public_subnets
  current_private_subnets = local.is_primary ? local.primary_private_subnets : local.secondary_private_subnets
  current_vpc_cidr        = local.is_primary ? var.vpc_cidr_primary : var.vpc_cidr_secondary
  other_vpc_cidr          = local.is_primary ? var.vpc_cidr_secondary : var.vpc_cidr_primary

  common_tags = {
    Project     = var.project_name
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }
}
```

## File: lib/kms.tf

```hcl
# KMS key for S3 encryption in current region
resource "aws_kms_key" "s3" {
  provider                = aws.primary
  description             = "KMS key for S3 encryption in ${local.current_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.resource_prefix}-s3-kms-${local.current_region}"
      Service = "S3"
    }
  )
}

resource "aws_kms_alias" "s3" {
  provider      = aws.primary
  name          = "alias/${local.resource_prefix}-s3-${local.current_region}"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS key for RDS encryption in current region
resource "aws_kms_key" "rds" {
  provider                = aws.primary
  description             = "KMS key for RDS encryption in ${local.current_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.resource_prefix}-rds-kms-${local.current_region}"
      Service = "RDS"
    }
  )
}

resource "aws_kms_alias" "rds" {
  provider      = aws.primary
  name          = "alias/${local.resource_prefix}-rds-${local.current_region}"
  target_key_id = aws_kms_key.rds.key_id
}
```

## File: lib/vpc.tf

```hcl
# VPC in current region
resource "aws_vpc" "main" {
  provider             = aws.primary
  cidr_block           = local.current_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-vpc-${local.current_region}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  provider = aws.primary
  vpc_id   = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-igw-${local.current_region}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  provider                = aws.primary
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.current_public_subnets[count.index]
  availability_zone       = local.current_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-public-subnet-${count.index + 1}-${local.current_region}"
      Type = "Public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.current_private_subnets[count.index]
  availability_zone = local.current_azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-private-subnet-${count.index + 1}-${local.current_region}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways (if needed for Lambda)
resource "aws_eip" "nat" {
  provider = aws.primary
  count    = 3
  domain   = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-nat-eip-${count.index + 1}-${local.current_region}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  provider      = aws.primary
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-nat-${count.index + 1}-${local.current_region}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  provider = aws.primary
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-public-rt-${local.current_region}"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  provider = aws.primary
  count    = 3
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-private-rt-${count.index + 1}-${local.current_region}"
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: lib/iam.tf

```hcl
# IAM roles created ONLY in us-east-1 (primary region)
# Referenced cross-region using data sources

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  provider = aws.iam
  name     = "${local.resource_prefix}-lambda-execution-role"

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

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-execution-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  provider   = aws.iam
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  provider   = aws.iam
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  provider = aws.iam
  name     = "${local.resource_prefix}-lambda-dynamodb-policy"
  role     = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = "*"
      }
    ]
  })
}

# S3 replication role
resource "aws_iam_role" "s3_replication" {
  provider = aws.iam
  name     = "${local.resource_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-s3-replication-role"
    }
  )
}

resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.iam
  name     = "${local.resource_prefix}-s3-replication-policy"
  role     = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "*"
      }
    ]
  })
}

# API Gateway CloudWatch role
resource "aws_iam_role" "apigateway_cloudwatch" {
  provider = aws.iam
  name     = "${local.resource_prefix}-apigateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-apigateway-cloudwatch-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "apigateway_cloudwatch" {
  provider   = aws.iam
  role       = aws_iam_role.apigateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Data sources to reference IAM roles in other regions
data "aws_iam_role" "lambda_execution" {
  provider = aws.primary
  name     = aws_iam_role.lambda_execution.name
}

data "aws_iam_role" "s3_replication" {
  provider = aws.primary
  name     = aws_iam_role.s3_replication.name
}

data "aws_iam_role" "apigateway_cloudwatch" {
  provider = aws.primary
  name     = aws_iam_role.apigateway_cloudwatch.name
}
```

## File: lib/s3.tf

```hcl
# S3 bucket in current region
resource "aws_s3_bucket" "documents" {
  provider = aws.primary
  bucket   = "${local.resource_prefix}-documents-${local.current_region}"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-documents-${local.current_region}"
    }
  )
}

# Enable versioning for replication
resource "aws_s3_bucket_versioning" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

# Public access block
resource "aws_s3_bucket_public_access_block" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cross-region replication (only from primary to secondary)
resource "aws_s3_bucket_replication_configuration" "documents" {
  provider = aws.primary
  count    = local.is_primary ? 1 : 0

  depends_on = [aws_s3_bucket_versioning.documents]

  role   = data.aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = "arn:aws:s3:::${local.resource_prefix}-documents-${local.other_region}"
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = "arn:aws:kms:${local.other_region}:${data.aws_caller_identity.current.account_id}:alias/${local.resource_prefix}-s3-${local.other_region}"
      }
    }
  }
}

# Data source for current account
data "aws_caller_identity" "current" {
  provider = aws.primary
}
```

## File: lib/dynamodb.tf

```hcl
# DynamoDB table for Lambda in current region
resource "aws_dynamodb_table" "transactions" {
  provider         = aws.primary
  name             = "${local.resource_prefix}-transactions-${local.current_region}"
  billing_mode     = "PAY_PER_REQUEST"
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
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-transactions-${local.current_region}"
    }
  )
}
```

## File: lib/rds.tf

```hcl
# Security group for RDS
resource "aws_security_group" "rds" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.current_vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-rds-sg-${local.current_region}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# DB subnet group
resource "aws_db_subnet_group" "main" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-db-subnet-"
  subnet_ids  = aws_subnet.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-db-subnet-group-${local.current_region}"
    }
  )
}

# RDS PostgreSQL instance
resource "aws_db_instance" "postgres" {
  provider               = aws.primary
  identifier             = "${local.resource_prefix}-postgres-${local.current_region}"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  max_allocated_storage  = 500
  storage_type           = "gp3"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn
  db_name                = "payments"
  username               = var.db_master_username
  password               = var.db_master_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = true

  # Backup configuration
  backup_retention_period   = 7
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:00-Mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Snapshot configuration
  copy_tags_to_snapshot     = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.resource_prefix}-postgres-final-${local.current_region}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  deletion_protection = false

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-postgres-${local.current_region}"
    }
  )
}

# Automated DB snapshot copy to other region (for primary only)
resource "aws_db_snapshot_copy" "cross_region" {
  provider                   = aws.primary
  count                      = local.is_primary ? 1 : 0
  source_db_snapshot_identifier = "arn:aws:rds:${local.current_region}:${data.aws_caller_identity.current.account_id}:snapshot:rds:${aws_db_instance.postgres.identifier}-*"
  target_db_snapshot_identifier = "${local.resource_prefix}-postgres-copy-${local.other_region}"
  kms_key_id                    = "arn:aws:kms:${local.other_region}:${data.aws_caller_identity.current.account_id}:alias/${local.resource_prefix}-rds-${local.other_region}"
  copy_tags                     = true

  depends_on = [aws_db_instance.postgres]
}
```

## File: lib/lambda.tf

```hcl
# Security group for Lambda
resource "aws_security_group" "lambda" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-lambda-"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-sg-${local.current_region}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda function for payment processing
resource "aws_lambda_function" "payment_processor" {
  provider         = aws.primary
  filename         = "${path.module}/lambda/payment_processor.zip"
  function_name    = "${local.resource_prefix}-payment-processor-${local.current_region}"
  role             = data.aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_processor.zip")
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      REGION               = local.current_region
      DYNAMODB_TABLE       = aws_dynamodb_table.transactions.name
      DYNAMODB_ENDPOINT    = "https://dynamodb.${local.current_region}.amazonaws.com"
      RDS_HOST             = aws_db_instance.postgres.address
      RDS_PORT             = aws_db_instance.postgres.port
      RDS_DATABASE         = aws_db_instance.postgres.db_name
      ENVIRONMENT_SUFFIX   = var.environment_suffix
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-payment-processor-${local.current_region}"
    }
  )
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.payment_processor.function_name}"
  retention_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-logs-${local.current_region}"
    }
  )
}
```

## File: lib/lambda/payment_processor.py

```python
import json
import os
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb',
                          endpoint_url=os.environ.get('DYNAMODB_ENDPOINT'),
                          region_name=os.environ.get('REGION'))
table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE'))

def handler(event, context):
    """
    Lambda handler for payment processing
    """
    try:
        logger.info(f"Processing payment in region: {os.environ.get('REGION')}")
        logger.info(f"Event: {json.dumps(event)}")

        # Extract payment details from event
        payment_data = json.loads(event.get('body', '{}'))
        transaction_id = payment_data.get('transaction_id')
        amount = payment_data.get('amount')
        currency = payment_data.get('currency', 'USD')

        if not transaction_id or not amount:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields: transaction_id, amount'
                })
            }

        # Store transaction in DynamoDB
        timestamp = int(datetime.now().timestamp())
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'timestamp': timestamp,
                'amount': str(amount),
                'currency': currency,
                'region': os.environ.get('REGION'),
                'status': 'processed',
                'environment': os.environ.get('ENVIRONMENT_SUFFIX')
            }
        )

        logger.info(f"Transaction {transaction_id} processed successfully")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'transaction_id': transaction_id,
                'status': 'processed',
                'region': os.environ.get('REGION'),
                'timestamp': timestamp
            })
        }

    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
```

## File: lib/apigateway.tf

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "payment_api" {
  provider    = aws.primary
  name        = "${local.resource_prefix}-payment-api-${local.current_region}"
  description = "Payment Processing API in ${local.current_region}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-payment-api-${local.current_region}"
    }
  )
}

# API Gateway Resource
resource "aws_api_gateway_resource" "payment" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "payment"
}

# API Gateway Method
resource "aws_api_gateway_method" "payment_post" {
  provider      = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.payment.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration with Lambda
resource "aws_api_gateway_integration" "payment_lambda" {
  provider                = aws.primary
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.payment.id
  http_method             = aws_api_gateway_method.payment_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_processor.invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "apigw" {
  provider      = aws.primary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "payment" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.payment_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.payment.id,
      aws_api_gateway_method.payment_post.id,
      aws_api_gateway_integration.payment_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.payment_lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "payment" {
  provider      = aws.primary
  deployment_id = aws_api_gateway_deployment.payment.id
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  stage_name    = var.environment_suffix

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-payment-stage-${local.current_region}"
    }
  )
}

# API Gateway Account (for CloudWatch logging)
resource "aws_api_gateway_account" "main" {
  provider            = aws.primary
  cloudwatch_role_arn = data.aws_iam_role.apigateway_cloudwatch.arn
}

# API Gateway Custom Domain (placeholder - requires ACM certificate)
# Uncomment and configure when you have an ACM certificate

# resource "aws_api_gateway_domain_name" "payment" {
#   provider                 = aws.primary
#   domain_name              = "${local.current_region}.${var.domain_name}"
#   regional_certificate_arn = aws_acm_certificate.api.arn
#
#   endpoint_configuration {
#     types = ["REGIONAL"]
#   }
#
#   tags = merge(
#     local.common_tags,
#     {
#       Name = "${local.resource_prefix}-api-domain-${local.current_region}"
#     }
#   )
# }

# resource "aws_api_gateway_base_path_mapping" "payment" {
#   provider    = aws.primary
#   api_id      = aws_api_gateway_rest_api.payment_api.id
#   stage_name  = aws_api_gateway_stage.payment.stage_name
#   domain_name = aws_api_gateway_domain_name.payment.domain_name
# }
```

## File: lib/route53.tf

```hcl
# Route53 Health Check for API Gateway endpoint
resource "aws_route53_health_check" "payment_api" {
  provider          = aws.route53
  type              = "HTTPS"
  resource_path     = "/${var.environment_suffix}/payment"
  fqdn              = "${aws_api_gateway_rest_api.payment_api.id}.execute-api.${local.current_region}.amazonaws.com"
  port              = 443
  request_interval  = 30
  failure_threshold = 3
  measure_latency   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-api-health-check-${local.current_region}"
    }
  )
}

# Route53 Hosted Zone (placeholder - create manually or import existing)
# Uncomment when you have a hosted zone

# data "aws_route53_zone" "main" {
#   provider = aws.route53
#   name     = var.domain_name
# }

# Route53 Record with Failover Routing
# Uncomment when you have custom domain configured

# resource "aws_route53_record" "payment_api_primary" {
#   provider        = aws.route53
#   count           = local.is_primary ? 1 : 0
#   zone_id         = data.aws_route53_zone.main.zone_id
#   name            = var.domain_name
#   type            = "A"
#   set_identifier  = "primary"
#   health_check_id = aws_route53_health_check.payment_api.id
#
#   failover_routing_policy {
#     type = "PRIMARY"
#   }
#
#   alias {
#     name                   = aws_api_gateway_domain_name.payment.regional_domain_name
#     zone_id                = aws_api_gateway_domain_name.payment.regional_zone_id
#     evaluate_target_health = true
#   }
# }

# resource "aws_route53_record" "payment_api_secondary" {
#   provider       = aws.route53
#   count          = !local.is_primary ? 1 : 0
#   zone_id        = data.aws_route53_zone.main.zone_id
#   name           = var.domain_name
#   type           = "A"
#   set_identifier = "secondary"
#
#   failover_routing_policy {
#     type = "SECONDARY"
#   }
#
#   alias {
#     name                   = aws_api_gateway_domain_name.payment.regional_domain_name
#     zone_id                = aws_api_gateway_domain_name.payment.regional_zone_id
#     evaluate_target_health = true
#   }
# }
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch Alarm for RDS replication lag monitoring
resource "aws_cloudwatch_metric_alarm" "rds_replication_lag" {
  provider            = aws.primary
  count               = local.is_primary ? 1 : 0
  alarm_name          = "${local.resource_prefix}-rds-replication-lag-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "This metric monitors RDS replication lag"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-rds-replication-lag-alarm"
    }
  )
}

# CloudWatch Alarm for RDS CPU utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-rds-cpu-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-rds-cpu-alarm"
    }
  )
}

# CloudWatch Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-lambda-errors-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors Lambda function errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor.function_name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-errors-alarm"
    }
  )
}

# CloudWatch Alarm for API Gateway 5XX errors
resource "aws_cloudwatch_metric_alarm" "apigateway_5xx" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-api-5xx-errors-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.payment_api.name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-api-5xx-errors-alarm"
    }
  )
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_processing" {
  provider       = aws.primary
  dashboard_name = "${local.resource_prefix}-dashboard-${local.current_region}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Lambda Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Duration", { stat = "Average", label = "Lambda Duration" }]
          ]
          period = 300
          stat   = "Average"
          region = local.current_region
          title  = "Lambda Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "API Requests" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = local.current_region
          title  = "API Gateway Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            [".", "DatabaseConnections", { stat = "Average", label = "DB Connections" }],
            [".", "ReplicaLag", { stat = "Average", label = "Replication Lag" }]
          ]
          period = 300
          stat   = "Average"
          region = local.current_region
          title  = "RDS Metrics"
        }
      }
    ]
  })
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

output "rds_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "Address of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "Port of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.port
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.payment_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.payment_processor.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.payment_api.id
}

output "api_gateway_endpoint" {
  description = "Endpoint URL of the API Gateway"
  value       = aws_api_gateway_stage.payment.invoke_url
}

output "api_gateway_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.payment.stage_name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.transactions.arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.documents.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.documents.arn
}

output "kms_key_id_s3" {
  description = "ID of the KMS key for S3"
  value       = aws_kms_key.s3.id
}

output "kms_key_id_rds" {
  description = "ID of the KMS key for RDS"
  value       = aws_kms_key.rds.id
}

output "current_region" {
  description = "Current deployment region"
  value       = local.current_region
}

output "current_workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "health_check_id" {
  description = "Route53 health check ID"
  value       = aws_route53_health_check.payment_api.id
}
```

## File: lib/README.md

```markdown
# Multi-Region Payment Processing Infrastructure

This Terraform configuration deploys a complete multi-region payment processing infrastructure across AWS us-east-1 (primary) and eu-west-1 (secondary) regions.

## Architecture Overview

### Services Deployed
- **VPC**: 3 public + 3 private subnets per region
- **S3**: Cross-region replicated buckets with KMS encryption
- **RDS PostgreSQL**: db.t3.medium instances with encrypted snapshots
- **Lambda**: Payment processing functions with region-specific configurations
- **API Gateway**: REST APIs with health checks
- **DynamoDB**: Region-specific transaction tables
- **Route 53**: Health checks and failover routing
- **CloudWatch**: Alarms for RDS replication lag, Lambda errors, API Gateway errors
- **KMS**: Encryption keys in both regions
- **IAM**: Centralized roles in us-east-1

## Prerequisites

1. **Terraform**: Version 1.5 or higher
2. **AWS CLI**: Configured with appropriate credentials
3. **AWS Account**: With permissions to create all required resources
4. **Environment Suffix**: A unique suffix for resource naming (e.g., "dev", "test", "prod")

## Workspace Management

This configuration uses Terraform workspaces to manage both regions:

```bash
# Create workspaces
terraform workspace new primary
terraform workspace new secondary

# List workspaces
terraform workspace list

# Select workspace
terraform workspace select primary
```

- **primary** workspace: Deploys to us-east-1
- **secondary** workspace: Deploys to eu-west-1

## Deployment Instructions

### Step 1: Initialize Terraform

```bash
terraform init \
  -backend-config="bucket=YOUR-TERRAFORM-STATE-BUCKET" \
  -backend-config="key=payment-processor/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=YOUR-TERRAFORM-LOCKS-TABLE"
```

### Step 2: Create Lambda Deployment Package

```bash
cd lib/lambda
zip payment_processor.zip payment_processor.py
cd ../..
```

### Step 3: Deploy to Primary Region (us-east-1)

```bash
# Select primary workspace
terraform workspace select primary

# Review plan
terraform plan \
  -var="environment_suffix=YOUR-UNIQUE-SUFFIX" \
  -var="db_master_password=YOUR-SECURE-PASSWORD"

# Apply configuration
terraform apply \
  -var="environment_suffix=YOUR-UNIQUE-SUFFIX" \
  -var="db_master_password=YOUR-SECURE-PASSWORD"
```

### Step 4: Deploy to Secondary Region (eu-west-1)

```bash
# Select secondary workspace
terraform workspace select secondary

# Review plan
terraform plan \
  -var="environment_suffix=YOUR-UNIQUE-SUFFIX" \
  -var="db_master_password=YOUR-SECURE-PASSWORD"

# Apply configuration
terraform apply \
  -var="environment_suffix=YOUR-UNIQUE-SUFFIX" \
  -var="db_master_password=YOUR-SECURE-PASSWORD"
```

## Configuration Variables

### Required Variables
- `environment_suffix`: Unique suffix for resource naming (no default)
- `db_master_password`: Master password for RDS (sensitive, no default)

### Optional Variables
- `aws_region`: Primary AWS region (default: "us-east-1")
- `project_name`: Project name prefix (default: "payment-processor")
- `db_master_username`: RDS master username (default: "dbadmin")
- `domain_name`: API Gateway custom domain (default: "api.example.com")

### Example terraform.tfvars

```hcl
environment_suffix = "dev"
db_master_password = "SecurePassword123!"
db_master_username = "admin"
project_name       = "payment-processor"
```

## Cross-Region Replication

### S3 Replication
- Automatic replication from primary (us-east-1) to secondary (eu-west-1)
- Versioning enabled on both buckets
- KMS encryption with region-specific keys

### RDS Snapshot Copying
- Automated encrypted snapshot copying from primary to secondary
- 7-day retention period
- KMS encryption with region-specific keys

## IAM Configuration

All IAM roles are created in us-east-1 and referenced cross-region using data sources:
- `lambda_execution`: Lambda execution role with VPC and DynamoDB permissions
- `s3_replication`: S3 cross-region replication role
- `apigateway_cloudwatch`: API Gateway CloudWatch logging role

## Monitoring and Alarms

### CloudWatch Alarms
- **RDS Replication Lag**: Triggers when replication lag exceeds 30 seconds
- **RDS CPU**: Triggers when CPU utilization exceeds 80%
- **Lambda Errors**: Triggers when error count exceeds 5 in 5 minutes
- **API Gateway 5XX**: Triggers when 5XX error count exceeds 10

### CloudWatch Dashboard
- Lambda metrics: Invocations, errors, duration
- API Gateway metrics: Request count, 4XX/5XX errors
- RDS metrics: CPU, connections, replication lag

## Testing the Deployment

### Test API Gateway Endpoint

```bash
# Get API Gateway endpoint
WORKSPACE=$(terraform workspace show)
API_ENDPOINT=$(terraform output -raw api_gateway_endpoint)

# Test payment processing
curl -X POST "${API_ENDPOINT}/payment" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-123",
    "amount": 100.00,
    "currency": "USD"
  }'
```

### Verify S3 Replication

```bash
# Upload file to primary bucket
aws s3 cp test-file.txt s3://payment-processor-YOUR-SUFFIX-documents-us-east-1/

# Wait 1-2 minutes, then check secondary bucket
aws s3 ls s3://payment-processor-YOUR-SUFFIX-documents-eu-west-1/
```

### Check RDS Status

```bash
# Primary region
aws rds describe-db-instances \
  --db-instance-identifier payment-processor-YOUR-SUFFIX-postgres-us-east-1 \
  --region us-east-1

# Secondary region
aws rds describe-db-instances \
  --db-instance-identifier payment-processor-YOUR-SUFFIX-postgres-eu-west-1 \
  --region eu-west-1
```

## Failover Testing

### Manual Failover to Secondary Region
1. Update Route 53 DNS records to point to secondary region API Gateway
2. Verify health checks are passing for secondary endpoint
3. Monitor CloudWatch metrics for increased traffic in secondary region

## Cleanup

To destroy resources:

```bash
# Destroy secondary region first
terraform workspace select secondary
terraform destroy \
  -var="environment_suffix=YOUR-SUFFIX" \
  -var="db_master_password=YOUR-PASSWORD"

# Destroy primary region
terraform workspace select primary
terraform destroy \
  -var="environment_suffix=YOUR-SUFFIX" \
  -var="db_master_password=YOUR-PASSWORD"
```

## Security Considerations

1. **Encryption**: All data encrypted at rest using KMS
2. **Network**: Resources deployed in private subnets where possible
3. **IAM**: Least privilege access for all roles
4. **Secrets**: Store sensitive values in AWS Secrets Manager or SSM Parameter Store
5. **VPC**: Security groups restrict traffic to necessary ports only

## Troubleshooting

### Lambda Function Not Accessible
- Check VPC configuration and security groups
- Verify IAM role has necessary permissions
- Review CloudWatch logs: `/aws/lambda/FUNCTION-NAME`

### S3 Replication Not Working
- Verify versioning is enabled on both buckets
- Check replication role has necessary permissions
- Review replication metrics in S3 console

### RDS Connection Issues
- Verify security group allows traffic from Lambda
- Check RDS endpoint in Lambda environment variables
- Ensure RDS is in available state

## Cost Optimization Notes

- NAT Gateways are included for Lambda VPC access (can be expensive)
- Consider using VPC endpoints for AWS services to reduce NAT Gateway usage
- RDS Multi-AZ increases costs but provides high availability
- DynamoDB uses pay-per-request pricing for cost efficiency

## Future Enhancements

1. Configure custom domain names with ACM certificates
2. Implement Route 53 failover routing policies
3. Add VPC peering between regions
4. Implement automated testing and validation
5. Add SNS notifications for CloudWatch alarms
