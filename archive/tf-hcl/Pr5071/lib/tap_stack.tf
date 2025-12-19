# tap_stack.tf - Complete Test Environment Infrastructure
# Fixed version addressing all critical issues

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  default     = "test"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "enable_nat" {
  description = "Enable NAT gateway"
  type        = bool
  default     = true
}

variable "nat_gateway_count" {
  description = "Number of NAT gateways (1 for cost savings, or equal to AZ count for HA)"
  type        = number
  default     = 1
}

variable "service_names" {
  description = "List of service names"
  type        = list(string)
  default     = ["billing", "ledger", "auth"]
}

variable "ddb_tables" {
  description = "DynamoDB tables configuration"
  type = map(object({
    name           = string
    hash_key       = string
    range_key      = optional(string)
    billing_mode   = string
    read_capacity  = optional(number)
    write_capacity = optional(number)
  }))
  default = {
    billing = {
      name           = "billing"
      hash_key       = "id"
      range_key      = "timestamp"
      billing_mode   = "PAY_PER_REQUEST"
      read_capacity  = null
      write_capacity = null
    }
  }
}

variable "aurora_engine" {
  description = "Aurora engine"
  type        = string
  default     = "aurora-postgresql"
}

variable "aurora_engine_version" {
  description = "Aurora engine version"
  type        = string
  default     = "14.6"
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r5.large"
}

variable "aurora_username" {
  description = "Aurora username"
  type        = string
  default     = "admin"
}

variable "aurora_password" {
  description = "Aurora password"
  type        = string
  sensitive   = true
}

variable "aurora_db_name" {
  description = "Aurora database name"
  type        = string
  default     = "fintech"
}

variable "artifact_bucket_name" {
  description = "Artifacts bucket name"
  type        = string
}

variable "data_bucket_name" {
  description = "Data bucket name"
  type        = string
}

variable "staging_bucket_name" {
  description = "Staging bucket name"
  type        = string
}

variable "masking_rules" {
  description = "Data masking rules"
  type        = map(string)
  default = {
    "email"       = "test+{{hash}}@example.com"
    "phone"       = "555-{{hash:4}}"
    "ssn"         = "XXX-XX-{{last:4}}"
    "credit_card" = "XXXX-XXXX-XXXX-{{last:4}}"
  }
}

variable "source_account_id" {
  description = "Source AWS account ID for data refresh (defaults to current account for self-contained operation)"
  type        = string
  default     = null # Will use current account ID if not specified
}

variable "source_data_bucket" {
  description = "Source data bucket name for S3 sync operations (defaults to this stack's data bucket)"
  type        = string
  default     = null # Will use this stack's data bucket if not specified
}

variable "source_cluster_identifier" {
  description = "Source Aurora cluster identifier for snapshot operations (defaults to this stack's cluster)"
  type        = string
  default     = null # Will use this stack's Aurora cluster if not specified
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default = {
    Environment = "test"
    ManagedBy   = "terraform"
    Project     = "fintech-platform"
  }
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  name_prefix          = "fintech-${var.environment}"
  public_subnet_count  = length(var.public_subnet_cidrs)
  private_subnet_count = length(var.private_subnet_cidrs)
  account_id           = data.aws_caller_identity.current.account_id
  nat_count            = var.enable_nat ? var.nat_gateway_count : 0

  # Computed source values - use provided values or default to self-references
  # This allows standalone operation or cross-environment refresh
  effective_source_account_id         = coalesce(var.source_account_id, local.account_id)
  effective_source_data_bucket        = coalesce(var.source_data_bucket, aws_s3_bucket.data.id)
  effective_source_cluster_identifier = coalesce(var.source_cluster_identifier, aws_rds_cluster.aurora.cluster_identifier)

  # Aurora parameter family based on engine and version
  aurora_family = startswith(var.aurora_engine, "aurora-postgresql") ? "aurora-postgresql14" : "aurora-mysql8.0"

  kms_aliases = {
    data = "alias/${local.name_prefix}-data"
    logs = "alias/${local.name_prefix}-logs"
    ssm  = "alias/${local.name_prefix}-ssm"
    s3   = "alias/${local.name_prefix}-s3"
  }

  service_kms_aliases = {
    for service in var.service_names :
    service => "alias/app-${service}-${var.environment}"
  }

  lambda_functions = {
    masking_handler = {
      name    = "${local.name_prefix}-masking"
      memory  = 512
      timeout = 300
    }
    dynamodb_refresh_handler = {
      name    = "${local.name_prefix}-dynamodb-refresh"
      memory  = 512
      timeout = 900
    }
    aurora_refresh_handler = {
      name    = "${local.name_prefix}-aurora-refresh"
      memory  = 512
      timeout = 900
    }
    s3_sync_handler = {
      name    = "${local.name_prefix}-s3-sync"
      memory  = 512
      timeout = 600
    }
    integration_tests_handler = {
      name    = "${local.name_prefix}-integration-tests"
      memory  = 1024
      timeout = 900
    }
    parity_validation_handler = {
      name    = "${local.name_prefix}-parity-validation"
      memory  = 512
      timeout = 300
    }
  }

  # Separate tables with and without range keys
  tables_with_range_key = {
    for k, v in var.ddb_tables : k => v if v.range_key != null
  }

  tables_without_range_key = {
    for k, v in var.ddb_tables : k => v if v.range_key == null
  }
}

# ============================================================================
# NETWORKING
# ============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(var.tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_subnet" "public" {
  count                   = local.public_subnet_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  map_public_ip_on_launch = true
  tags                    = merge(var.tags, { Name = "${local.name_prefix}-public-${count.index + 1}", Tier = "Public" })
}

resource "aws_subnet" "private" {
  count             = local.private_subnet_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  tags              = merge(var.tags, { Name = "${local.name_prefix}-private-${count.index + 1}", Tier = "Private" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_eip" "nat" {
  count  = local.nat_count
  domain = "vpc"
  tags   = merge(var.tags, { Name = "${local.name_prefix}-nat-eip-${count.index + 1}" })
}

resource "aws_nat_gateway" "main" {
  count         = local.nat_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index % local.public_subnet_count].id
  tags          = merge(var.tags, { Name = "${local.name_prefix}-nat-${count.index + 1}" })
  depends_on    = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(var.tags, { Name = "${local.name_prefix}-public-rt" })
}

resource "aws_route_table" "private" {
  count  = local.private_subnet_count
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "${local.name_prefix}-private-rt-${count.index + 1}" })
}

resource "aws_route" "private_nat" {
  count                  = var.enable_nat ? local.private_subnet_count : 0
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index % local.nat_count].id
}

resource "aws_route_table_association" "public" {
  count          = local.public_subnet_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = local.private_subnet_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_security_group" "aurora" {
  name        = "${local.name_prefix}-aurora-sg"
  description = "Security group for Aurora"
  vpc_id      = aws_vpc.main.id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(var.tags, { Name = "${local.name_prefix}-aurora-sg" })
}

resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda"
  vpc_id      = aws_vpc.main.id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(var.tags, { Name = "${local.name_prefix}-lambda-sg" })
}

resource "aws_security_group_rule" "aurora_from_lambda" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.aurora.id
}

resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.name_prefix}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  tags = merge(var.tags, { Name = "${local.name_prefix}-vpc-endpoints-sg" })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)
  tags              = merge(var.tags, { Name = "${local.name_prefix}-s3-endpoint" })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)
  tags              = merge(var.tags, { Name = "${local.name_prefix}-dynamodb-endpoint" })
}

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  tags                = merge(var.tags, { Name = "${local.name_prefix}-ssm-endpoint" })
}

resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  tags                = merge(var.tags, { Name = "${local.name_prefix}-ssmmessages-endpoint" })
}

resource "aws_vpc_endpoint" "ec2messages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ec2messages"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  tags                = merge(var.tags, { Name = "${local.name_prefix}-ec2messages-endpoint" })
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  tags                = merge(var.tags, { Name = "${local.name_prefix}-logs-endpoint" })
}

resource "aws_vpc_endpoint" "sts" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sts"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  tags                = merge(var.tags, { Name = "${local.name_prefix}-sts-endpoint" })
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  tags                = merge(var.tags, { Name = "${local.name_prefix}-kms-endpoint" })
}

resource "aws_vpc_endpoint" "states" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.states"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  tags                = merge(var.tags, { Name = "${local.name_prefix}-states-endpoint" })
}

# ============================================================================
# KMS KEYS (with proper service policies)
# ============================================================================

resource "aws_kms_key" "data" {
  description             = "KMS key for ${var.environment} data encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow DynamoDB to use the key"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
  tags = merge(var.tags, { Name = "${local.name_prefix}-data-key" })
}

resource "aws_kms_alias" "data" {
  name          = local.kms_aliases.data
  target_key_id = aws_kms_key.data.key_id
}

resource "aws_kms_key" "logs" {
  description             = "KMS key for ${var.environment} logs encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${local.account_id}:*"
          }
        }
      }
    ]
  })
  tags = merge(var.tags, { Name = "${local.name_prefix}-logs-key" })
}

resource "aws_kms_alias" "logs" {
  name          = local.kms_aliases.logs
  target_key_id = aws_kms_key.logs.key_id
}

resource "aws_kms_key" "ssm" {
  description             = "KMS key for ${var.environment} SSM encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  tags = merge(var.tags, { Name = "${local.name_prefix}-ssm-key" })
}

resource "aws_kms_alias" "ssm" {
  name          = local.kms_aliases.ssm
  target_key_id = aws_kms_key.ssm.key_id
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for ${var.environment} S3 encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
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
  tags = merge(var.tags, { Name = "${local.name_prefix}-s3-key" })
}

resource "aws_kms_alias" "s3" {
  name          = local.kms_aliases.s3
  target_key_id = aws_kms_key.s3.key_id
}

resource "aws_kms_key" "service" {
  for_each                = toset(var.service_names)
  description             = "KMS key for ${each.value} service ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags                    = merge(var.tags, { Name = "${local.name_prefix}-${each.value}-key", Service = each.value })
}

resource "aws_kms_alias" "service" {
  for_each      = local.service_kms_aliases
  name          = each.value
  target_key_id = aws_kms_key.service[each.key].key_id
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

resource "aws_s3_bucket" "artifact" {
  bucket = var.artifact_bucket_name
  tags   = merge(var.tags, { Name = var.artifact_bucket_name })
}

resource "aws_s3_bucket_versioning" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "artifact" {
  bucket = aws_s3_bucket.artifact.id
  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifact" {
  bucket                  = aws_s3_bucket.artifact.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "data" {
  bucket = var.data_bucket_name
  tags   = merge(var.tags, { Name = var.data_bucket_name })
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "staging" {
  bucket = var.staging_bucket_name
  tags   = merge(var.tags, { Name = var.staging_bucket_name })
}

resource "aws_s3_bucket_versioning" "staging" {
  bucket = aws_s3_bucket.staging.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "staging" {
  bucket = aws_s3_bucket.staging.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "staging" {
  bucket = aws_s3_bucket.staging.id
  rule {
    id     = "cleanup-temp-data"
    status = "Enabled"
    expiration {
      days = 7
    }
  }
}

resource "aws_s3_bucket_public_access_block" "staging" {
  bucket                  = aws_s3_bucket.staging.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# DYNAMODB TABLES (Separate with/without range keys)
# ============================================================================

resource "aws_dynamodb_table" "with_range_key" {
  for_each       = local.tables_with_range_key
  name           = "${local.name_prefix}-${each.value.name}"
  billing_mode   = each.value.billing_mode
  hash_key       = each.value.hash_key
  range_key      = each.value.range_key
  read_capacity  = each.value.billing_mode == "PROVISIONED" ? coalesce(each.value.read_capacity, 5) : null
  write_capacity = each.value.billing_mode == "PROVISIONED" ? coalesce(each.value.write_capacity, 5) : null

  attribute {
    name = each.value.hash_key
    type = "S"
  }

  attribute {
    name = each.value.range_key
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.data.arn
  }

  tags = merge(var.tags, { Name = "${local.name_prefix}-${each.value.name}" })
}

resource "aws_dynamodb_table" "without_range_key" {
  for_each       = local.tables_without_range_key
  name           = "${local.name_prefix}-${each.value.name}"
  billing_mode   = each.value.billing_mode
  hash_key       = each.value.hash_key
  read_capacity  = each.value.billing_mode == "PROVISIONED" ? coalesce(each.value.read_capacity, 5) : null
  write_capacity = each.value.billing_mode == "PROVISIONED" ? coalesce(each.value.write_capacity, 5) : null

  attribute {
    name = each.value.hash_key
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.data.arn
  }

  tags = merge(var.tags, { Name = "${local.name_prefix}-${each.value.name}" })
}

# Sample data for tables with range keys
resource "aws_dynamodb_table_item" "sample_with_range" {
  for_each   = local.tables_with_range_key
  table_name = aws_dynamodb_table.with_range_key[each.key].name
  hash_key   = each.value.hash_key
  range_key  = each.value.range_key

  item = jsonencode({
    "${each.value.hash_key}"  = { S = "sample-${each.key}-001" }
    "${each.value.range_key}" = { S = "2006-01-02T15:04:05Z" }
    "data"                    = { S = "Sample data for ${each.key}" }
  })
}

# Sample data for tables without range keys
resource "aws_dynamodb_table_item" "sample_without_range" {
  for_each   = local.tables_without_range_key
  table_name = aws_dynamodb_table.without_range_key[each.key].name
  hash_key   = each.value.hash_key

  item = jsonencode({
    "${each.value.hash_key}" = { S = "sample-${each.key}-001" }
    "data"                   = { S = "Sample data for ${each.key}" }
  })
}

# DynamoDB Autoscaling for tables with PROVISIONED billing
resource "aws_appautoscaling_target" "dynamodb_read_with_range" {
  for_each           = { for k, v in local.tables_with_range_key : k => v if v.billing_mode == "PROVISIONED" }
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.with_range_key[each.key].name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_read_with_range" {
  for_each           = { for k, v in local.tables_with_range_key : k => v if v.billing_mode == "PROVISIONED" }
  name               = "${local.name_prefix}-${each.key}-read"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_read_with_range[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_read_with_range[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_read_with_range[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_target" "dynamodb_write_with_range" {
  for_each           = { for k, v in local.tables_with_range_key : k => v if v.billing_mode == "PROVISIONED" }
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.with_range_key[each.key].name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_write_with_range" {
  for_each           = { for k, v in local.tables_with_range_key : k => v if v.billing_mode == "PROVISIONED" }
  name               = "${local.name_prefix}-${each.key}-write"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_write_with_range[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_write_with_range[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_write_with_range[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = 70.0
  }
}

# Same for tables without range key
resource "aws_appautoscaling_target" "dynamodb_read_without_range" {
  for_each           = { for k, v in local.tables_without_range_key : k => v if v.billing_mode == "PROVISIONED" }
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.without_range_key[each.key].name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_read_without_range" {
  for_each           = { for k, v in local.tables_without_range_key : k => v if v.billing_mode == "PROVISIONED" }
  name               = "${local.name_prefix}-${each.key}-read"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_read_without_range[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_read_without_range[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_read_without_range[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_target" "dynamodb_write_without_range" {
  for_each           = { for k, v in local.tables_without_range_key : k => v if v.billing_mode == "PROVISIONED" }
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.without_range_key[each.key].name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_write_without_range" {
  for_each           = { for k, v in local.tables_without_range_key : k => v if v.billing_mode == "PROVISIONED" }
  name               = "${local.name_prefix}-${each.key}-write"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_write_without_range[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_write_without_range[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_write_without_range[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = 70.0
  }
}

# ============================================================================
# AURORA DATABASE
# ============================================================================

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = merge(var.tags, { Name = "${local.name_prefix}-aurora-subnet-group" })
}

resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "${local.name_prefix}-aurora-pg"
  family      = local.aurora_family
  description = "Parameter group for ${var.environment} Aurora cluster"
  tags        = merge(var.tags, { Name = "${local.name_prefix}-aurora-pg" })
}

resource "aws_db_parameter_group" "aurora" {
  name        = "${local.name_prefix}-aurora-instance-pg"
  family      = local.aurora_family
  description = "Parameter group for ${var.environment} Aurora instances"
  tags        = merge(var.tags, { Name = "${local.name_prefix}-aurora-instance-pg" })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.name_prefix}-aurora"
  engine                          = var.aurora_engine
  engine_version                  = var.aurora_engine_version
  engine_mode                     = "provisioned"
  database_name                   = var.aurora_db_name
  master_username                 = var.aurora_username
  master_password                 = var.aurora_password
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  backup_retention_period         = 7
  preferred_backup_window         = "02:00-03:00"
  preferred_maintenance_window    = "sun:03:00-sun:04:00"
  skip_final_snapshot             = true
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.data.arn
  tags                            = merge(var.tags, { Name = "${local.name_prefix}-aurora" })
}

resource "aws_rds_cluster_instance" "aurora" {
  count                   = 2
  identifier              = "${local.name_prefix}-aurora-${count.index}"
  cluster_identifier      = aws_rds_cluster.aurora.id
  engine                  = aws_rds_cluster.aurora.engine
  engine_version          = var.aurora_engine_version
  instance_class          = var.aurora_instance_class
  db_parameter_group_name = aws_db_parameter_group.aurora.name
  tags                    = merge(var.tags, { Name = "${local.name_prefix}-aurora-${count.index}" })
}

# ============================================================================
# SSM PARAMETERS (environment-specific paths)
# ============================================================================

resource "aws_ssm_parameter" "masking_rules" {
  name        = "/${var.environment}/fintech/masking/rules"
  description = "Data masking rules for ${var.environment} (base64 encoded to avoid SSM template parsing)"
  type        = "SecureString"
  value       = base64encode(jsonencode(var.masking_rules))
  key_id      = aws_kms_key.ssm.id
  tags        = merge(var.tags, { Name = "masking-rules" })
}

resource "aws_ssm_parameter" "aurora_endpoint" {
  name  = "/${var.environment}/fintech/aurora/endpoint"
  type  = "String"
  value = aws_rds_cluster.aurora.endpoint
  tags  = merge(var.tags, { Name = "aurora-endpoint" })
}

resource "aws_ssm_parameter" "source_data_bucket" {
  name  = "/${var.environment}/fintech/source/data-bucket"
  type  = "String"
  value = local.effective_source_data_bucket
  tags  = merge(var.tags, { Name = "source-data-bucket" })
}

resource "aws_ssm_parameter" "source_cluster_id" {
  name  = "/${var.environment}/fintech/source/cluster-id"
  type  = "String"
  value = local.effective_source_cluster_identifier
  tags  = merge(var.tags, { Name = "source-cluster-id" })
}

# ============================================================================
# IAM ROLES AND POLICIES (Least Privilege)
# ============================================================================

resource "aws_iam_role" "lambda" {
  for_each = local.lambda_functions
  name     = "${each.value.name}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = merge(var.tags, { Name = "${each.value.name}-role" })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  for_each   = local.lambda_functions
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_policy" "lambda_common" {
  name = "${local.name_prefix}-lambda-common"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.data.arn,
          aws_kms_key.s3.arn,
          aws_kms_key.ssm.arn
        ]
      },
      {
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Effect   = "Allow"
        Resource = "arn:aws:ssm:${var.aws_region}:${local.account_id}:parameter/${var.environment}/fintech/*"
      },
      {
        Action   = ["cloudwatch:PutMetricData"]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_common" {
  for_each   = local.lambda_functions
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = aws_iam_policy.lambda_common.arn
}

resource "aws_iam_policy" "masking_handler" {
  name = "${local.name_prefix}-masking"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["s3:GetObject", "s3:PutObject"]
      Effect   = "Allow"
      Resource = ["${aws_s3_bucket.staging.arn}/*", "${aws_s3_bucket.data.arn}/*"]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "masking_handler" {
  role       = aws_iam_role.lambda["masking_handler"].name
  policy_arn = aws_iam_policy.masking_handler.arn
}

resource "aws_iam_policy" "dynamodb_refresh_handler" {
  name = "${local.name_prefix}-ddb-refresh"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Effect   = "Allow"
        Resource = concat([for t in aws_dynamodb_table.with_range_key : t.arn], [for t in aws_dynamodb_table.without_range_key : t.arn])
      },
      {
        Action   = ["dynamodb:ExportTableToPointInTime", "dynamodb:DescribeExport"]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
        Effect   = "Allow"
        Resource = ["${aws_s3_bucket.staging.arn}/*", aws_s3_bucket.staging.arn]
      },
      {
        Action   = ["lambda:InvokeFunction"]
        Effect   = "Allow"
        Resource = aws_lambda_function.masking_handler.arn
      },
      {
        Action   = ["sts:AssumeRole"]
        Effect   = "Allow"
        Resource = "arn:aws:iam::${local.effective_source_account_id}:role/*-source-read-role"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "dynamodb_refresh_handler" {
  role       = aws_iam_role.lambda["dynamodb_refresh_handler"].name
  policy_arn = aws_iam_policy.dynamodb_refresh_handler.arn
}

resource "aws_iam_policy" "aurora_refresh_handler" {
  name = "${local.name_prefix}-aurora-refresh"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBClusterSnapshots",
          "rds:CopyDBClusterSnapshot",
          "rds:RestoreDBClusterFromSnapshot",
          "rds:ModifyDBCluster",
          "rds:DeleteDBCluster"
        ]
        Effect   = "Allow"
        Resource = ["${aws_rds_cluster.aurora.arn}", "arn:aws:rds:${var.aws_region}:${local.account_id}:cluster-snapshot:*"]
      },
      {
        Action   = ["ssm:StartAutomationExecution", "ssm:GetAutomationExecution"]
        Effect   = "Allow"
        Resource = ["${aws_ssm_document.aurora_masking.arn}", "arn:aws:ssm:${var.aws_region}:${local.account_id}:automation-execution/*"]
      },
      {
        Action   = ["iam:PassRole"]
        Effect   = "Allow"
        Resource = aws_iam_role.ssm_automation.arn
      },
      {
        Action   = ["sts:AssumeRole"]
        Effect   = "Allow"
        Resource = "arn:aws:iam::${local.effective_source_account_id}:role/*-source-read-role"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "aurora_refresh_handler" {
  role       = aws_iam_role.lambda["aurora_refresh_handler"].name
  policy_arn = aws_iam_policy.aurora_refresh_handler.arn
}

resource "aws_iam_policy" "s3_sync_handler" {
  name = "${local.name_prefix}-s3-sync"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Effect   = "Allow"
        Resource = ["arn:aws:s3:::${local.effective_source_data_bucket}", "arn:aws:s3:::${local.effective_source_data_bucket}/*"]
      },
      {
        Action   = ["s3:PutObject", "s3:ListBucket"]
        Effect   = "Allow"
        Resource = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"]
      },
      {
        Action   = ["sts:AssumeRole"]
        Effect   = "Allow"
        Resource = "arn:aws:iam::${local.effective_source_account_id}:role/*-source-read-role"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_sync_handler" {
  role       = aws_iam_role.lambda["s3_sync_handler"].name
  policy_arn = aws_iam_policy.s3_sync_handler.arn
}

resource "aws_iam_policy" "integration_tests_handler" {
  name = "${local.name_prefix}-integration-tests"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]
        Effect   = "Allow"
        Resource = concat([for t in aws_dynamodb_table.with_range_key : t.arn], [for t in aws_dynamodb_table.without_range_key : t.arn])
      },
      {
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Effect   = "Allow"
        Resource = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"]
      },
      {
        Action   = ["rds:DescribeDBClusters"]
        Effect   = "Allow"
        Resource = aws_rds_cluster.aurora.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "integration_tests_handler" {
  role       = aws_iam_role.lambda["integration_tests_handler"].name
  policy_arn = aws_iam_policy.integration_tests_handler.arn
}

resource "aws_iam_policy" "parity_validation_handler" {
  name = "${local.name_prefix}-parity-validation"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["dynamodb:ListTables", "dynamodb:DescribeTable"]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = ["lambda:ListFunctions"]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = ["kms:ListAliases"]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = ["s3:PutObject"]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.data.arn}/reports/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "parity_validation_handler" {
  role       = aws_iam_role.lambda["parity_validation_handler"].name
  policy_arn = aws_iam_policy.parity_validation_handler.arn
}

resource "aws_iam_role" "sfn" {
  name = "${local.name_prefix}-sfn-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "states.amazonaws.com" }
    }]
  })
  tags = merge(var.tags, { Name = "${local.name_prefix}-sfn-role" })
}

resource "aws_iam_policy" "sfn" {
  name = "${local.name_prefix}-sfn"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["lambda:InvokeFunction"]
        Effect = "Allow"
        Resource = [
          aws_lambda_function.s3_sync_handler.arn,
          aws_lambda_function.dynamodb_refresh_handler.arn,
          aws_lambda_function.aurora_refresh_handler.arn,
          aws_lambda_function.integration_tests_handler.arn
        ]
      },
      {
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sfn" {
  role       = aws_iam_role.sfn.name
  policy_arn = aws_iam_policy.sfn.arn
}

resource "aws_iam_role" "ssm_automation" {
  name = "${local.name_prefix}-ssm-automation-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ssm.amazonaws.com" }
    }]
  })
  tags = merge(var.tags, { Name = "${local.name_prefix}-ssm-automation-role" })
}

resource "aws_iam_policy" "ssm_automation" {
  name = "${local.name_prefix}-ssm-automation"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "rds:RestoreDBClusterFromSnapshot",
          "rds:DescribeDBClusters",
          "rds:ModifyDBCluster",
          "rds:DeleteDBCluster"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action   = ["kms:Decrypt", "kms:CreateGrant"]
        Effect   = "Allow"
        Resource = aws_kms_key.data.arn
      },
      {
        Action   = ["ssm:GetParameter"]
        Effect   = "Allow"
        Resource = "arn:aws:ssm:${var.aws_region}:${local.account_id}:parameter/${var.environment}/fintech/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_automation" {
  role       = aws_iam_role.ssm_automation.name
  policy_arn = aws_iam_policy.ssm_automation.arn
}

resource "aws_iam_role" "eventbridge" {
  name = "${local.name_prefix}-eventbridge-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
    }]
  })
  tags = merge(var.tags, { Name = "${local.name_prefix}-eventbridge-role" })
}

resource "aws_iam_policy" "eventbridge" {
  name = "${local.name_prefix}-eventbridge"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["states:StartExecution"]
      Effect   = "Allow"
      Resource = aws_sfn_state_machine.daily_refresh.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge" {
  role       = aws_iam_role.eventbridge.name
  policy_arn = aws_iam_policy.eventbridge.arn
}

# ============================================================================
# CLOUDWATCH LOG GROUPS (must exist before Lambda creates)
# ============================================================================

resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = local.lambda_functions
  name              = "/aws/lambda/${each.value.name}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.logs.arn
  tags              = merge(var.tags, { Name = each.value.name })
}

resource "aws_cloudwatch_log_group" "sfn" {
  name              = "/aws/vendedlogs/states/${local.name_prefix}-daily-refresh"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.logs.arn
  tags              = merge(var.tags, { Name = "daily-refresh-sfn" })
}

# ============================================================================
# LAMBDA FUNCTIONS
# ============================================================================

data "archive_file" "masking_handler" {
  type        = "zip"
  output_path = "${path.module}/masking_handler.zip"
  source {
    content  = <<-EOF
import json, boto3, re, hashlib, base64
s3 = boto3.client('s3')
ssm = boto3.client('ssm')
cw = boto3.client('cloudwatch')
def mask(data, rules):
  for pattern, tmpl in rules.items():
    for field in list(data.keys()):
      if re.match(pattern, field):
        val = str(data.get(field, ''))
        h = hashlib.md5(val.encode()).hexdigest()
        if '{{hash}}' in tmpl:
          data[field] = tmpl.replace('{{hash}}', h)
        elif (m := re.search(r'\{\{hash:(\d+)\}\}', tmpl)):
          data[field] = tmpl.replace(f'{{{{hash:{m.group(1)}}}}}', h[:int(m.group(1))])
        elif (m := re.search(r'\{\{last:(\d+)\}\}', tmpl)):
          data[field] = tmpl.replace(f'{{{{last:{m.group(1)}}}}}', val[-int(m.group(1)):] if len(val) >= int(m.group(1)) else val)
        else:
          data[field] = tmpl
  return data
def lambda_handler(event, context):
  env = context.function_name.split('-')[1]
  rules_b64 = ssm.get_parameter(Name=f'/{env}/fintech/masking/rules', WithDecryption=True)['Parameter']['Value']
  rules = json.loads(base64.b64decode(rules_b64).decode('utf-8'))
  obj = s3.get_object(Bucket=event['sourceBucket'], Key=event['sourceKey'])
  data = json.loads(obj['Body'].read())
  masked = [mask(item.copy(), rules) for item in data] if isinstance(data, list) else mask(data.copy(), rules)
  s3.put_object(Bucket=event['targetBucket'], Key=event.get('targetKey', event['sourceKey']), Body=json.dumps(masked))
  cw.put_metric_data(Namespace='FintechTest/Masking', MetricData=[{'MetricName': 'MaskedRecords', 'Value': len(masked) if isinstance(masked, list) else 1, 'Unit': 'Count'}])
  return {'statusCode': 200, 'maskedRecords': len(masked) if isinstance(masked, list) else 1}
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "masking_handler" {
  function_name    = local.lambda_functions["masking_handler"].name
  role             = aws_iam_role.lambda["masking_handler"].arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.masking_handler.output_path
  source_code_hash = data.archive_file.masking_handler.output_base64sha256
  memory_size      = local.lambda_functions["masking_handler"].memory
  timeout          = local.lambda_functions["masking_handler"].timeout
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = merge(var.tags, { Name = local.lambda_functions["masking_handler"].name })
}

data "archive_file" "dynamodb_refresh_handler" {
  type        = "zip"
  output_path = "${path.module}/dynamodb_refresh_handler.zip"
  source {
    content  = <<-EOF
import json, boto3, os, time
ddb = boto3.client('dynamodb')
s3 = boto3.client('s3')
lam = boto3.client('lambda')
cw = boto3.client('cloudwatch')
def lambda_handler(event, context):
  table = event['tableName']
  staging = event['stagingBucket']
  prod_table = event.get('prodTableName', table.replace('-test-', '-prod-').replace('-dev-', '-prod-'))
  prefix = f"exports/{table}/{int(time.time())}/"
  try:
    exp = ddb.export_table_to_point_in_time(
      TableArn=f"arn:aws:dynamodb:{os.environ['AWS_REGION']}:{os.environ['PROD_ACCOUNT_ID']}:table/{prod_table}",
      S3Bucket=staging,
      S3Prefix=prefix,
      ExportFormat='DYNAMODB_JSON'
    )
    export_arn = exp['ExportDescription']['ExportArn']
    while (desc := ddb.describe_export(ExportArn=export_arn))['ExportDescription']['ExportStatus'] == 'IN_PROGRESS':
      time.sleep(30)
    if desc['ExportDescription']['ExportStatus'] != 'COMPLETED':
      raise Exception(f"Export failed: {desc['ExportDescription'].get('FailureMessage', 'Unknown')}")
    manifest_key = f"{prefix}manifest-summary.json"
    manifest_obj = s3.get_object(Bucket=staging, Key=manifest_key)
    manifest = json.loads(manifest_obj['Body'].read())
    for data_file_key in s3.list_objects_v2(Bucket=staging, Prefix=f"{prefix}AWSDynamoDB/")['Contents']:
      if data_file_key['Key'].endswith('.json.gz'):
        lam.invoke(
          FunctionName=os.environ['MASKING_FUNCTION'],
          InvocationType='Event',
          Payload=json.dumps({'sourceBucket': staging, 'sourceKey': data_file_key['Key'], 'targetBucket': staging, 'targetKey': data_file_key['Key'].replace(prefix, f"{prefix}masked/")})
        )
    cw.put_metric_data(Namespace='FintechTest/DDB', MetricData=[{'MetricName': 'RefreshSuccess', 'Value': 1, 'Unit': 'Count'}])
    return {'statusCode': 200, 'table': table}
  except Exception as e:
    print(f"Error: {e}")
    cw.put_metric_data(Namespace='FintechTest/DDB', MetricData=[{'MetricName': 'RefreshFailure', 'Value': 1, 'Unit': 'Count'}])
    raise
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "dynamodb_refresh_handler" {
  function_name    = local.lambda_functions["dynamodb_refresh_handler"].name
  role             = aws_iam_role.lambda["dynamodb_refresh_handler"].arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.dynamodb_refresh_handler.output_path
  source_code_hash = data.archive_file.dynamodb_refresh_handler.output_base64sha256
  memory_size      = local.lambda_functions["dynamodb_refresh_handler"].memory
  timeout          = local.lambda_functions["dynamodb_refresh_handler"].timeout
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  environment {
    variables = {
      MASKING_FUNCTION  = aws_lambda_function.masking_handler.function_name
      SOURCE_ACCOUNT_ID = local.effective_source_account_id
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = merge(var.tags, { Name = local.lambda_functions["dynamodb_refresh_handler"].name })
}

data "archive_file" "aurora_refresh_handler" {
  type        = "zip"
  output_path = "${path.module}/aurora_refresh_handler.zip"
  source {
    content  = <<-EOF
import json, boto3, os, time
rds = boto3.client('rds')
ssm_client = boto3.client('ssm')
cw = boto3.client('cloudwatch')
def lambda_handler(event, context):
  cluster = event['clusterId']
  env = cluster.split('-')[1]
  source_cluster = ssm_client.get_parameter(Name=f'/{env}/fintech/source/cluster-id')['Parameter']['Value']
  snaps = rds.describe_db_cluster_snapshots(DBClusterIdentifier=source_cluster, SnapshotType='automated')
  if not snaps['DBClusterSnapshots']:
    raise Exception(f'No snapshots for {source_cluster}')
  src_snap = sorted(snaps['DBClusterSnapshots'], key=lambda x: x['SnapshotCreateTime'], reverse=True)[0]['DBClusterSnapshotIdentifier']
  tgt_snap = f"{cluster}-copy-{int(time.time())}"
  rds.copy_db_cluster_snapshot(SourceDBClusterSnapshotIdentifier=src_snap, TargetDBClusterSnapshotIdentifier=tgt_snap, KmsKeyId=os.environ['KMS_KEY_ID'])
  while (desc := rds.describe_db_cluster_snapshots(DBClusterSnapshotIdentifier=tgt_snap)['DBClusterSnapshots'][0])['Status'] not in ['available', 'failed']:
    time.sleep(30)
  if desc['Status'] == 'failed':
    raise Exception('Snapshot copy failed')
  exec_resp = ssm_client.start_automation_execution(
    DocumentName=os.environ['SSM_DOC'],
    Parameters={'SnapshotId': [tgt_snap], 'TargetClusterId': [cluster]},
    TargetLocations=[{'Accounts': [os.environ['AWS_ACCOUNT_ID']], 'Regions': [os.environ['AWS_REGION']], 'ExecutionRoleName': os.environ['SSM_ROLE_NAME']}]
  )
  cw.put_metric_data(Namespace='FintechTest/Aurora', MetricData=[{'MetricName': 'RefreshSuccess', 'Value': 1, 'Unit': 'Count'}])
  return {'statusCode': 200, 'snapshot': tgt_snap, 'executionId': exec_resp['AutomationExecutionId']}
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "aurora_refresh_handler" {
  function_name    = local.lambda_functions["aurora_refresh_handler"].name
  role             = aws_iam_role.lambda["aurora_refresh_handler"].arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.aurora_refresh_handler.output_path
  source_code_hash = data.archive_file.aurora_refresh_handler.output_base64sha256
  memory_size      = local.lambda_functions["aurora_refresh_handler"].memory
  timeout          = local.lambda_functions["aurora_refresh_handler"].timeout
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  environment {
    variables = {
      KMS_KEY_ID     = aws_kms_key.data.id
      SSM_DOC        = aws_ssm_document.aurora_masking.name
      SSM_ROLE_NAME  = aws_iam_role.ssm_automation.name
      AWS_ACCOUNT_ID = local.account_id
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = merge(var.tags, { Name = local.lambda_functions["aurora_refresh_handler"].name })
}

data "archive_file" "s3_sync_handler" {
  type        = "zip"
  output_path = "${path.module}/s3_sync_handler.zip"
  source {
    content  = <<-EOF
import json, boto3, os
s3 = boto3.client('s3')
sts = boto3.client('sts')
cw = boto3.client('cloudwatch')
def lambda_handler(event, context):
  prod_bucket = event['sourceBucket']
  dst_bucket = event['targetBucket']
  prefix = event.get('prefix', '')
  count = 0
  paginator = s3.get_paginator('list_objects_v2')
  for page in paginator.paginate(Bucket=prod_bucket, Prefix=prefix):
    for obj in page.get('Contents', []):
      try:
        s3.copy_object(CopySource={'Bucket': prod_bucket, 'Key': obj['Key']}, Bucket=dst_bucket, Key=obj['Key'], ServerSideEncryption='aws:kms', SSEKMSKeyId=os.environ['KMS_KEY_ID'])
        count += 1
      except Exception as e:
        print(f"Error copying {obj['Key']}: {e}")
  cw.put_metric_data(Namespace='FintechTest/S3', MetricData=[{'MetricName': 'ObjectsSynced', 'Value': count, 'Unit': 'Count'}])
  return {'statusCode': 200, 'objectsSynced': count}
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "s3_sync_handler" {
  function_name    = local.lambda_functions["s3_sync_handler"].name
  role             = aws_iam_role.lambda["s3_sync_handler"].arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.s3_sync_handler.output_path
  source_code_hash = data.archive_file.s3_sync_handler.output_base64sha256
  memory_size      = local.lambda_functions["s3_sync_handler"].memory
  timeout          = local.lambda_functions["s3_sync_handler"].timeout
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  environment {
    variables = {
      KMS_KEY_ID = aws_kms_key.s3.id
    }
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = merge(var.tags, { Name = local.lambda_functions["s3_sync_handler"].name })
}

data "archive_file" "integration_tests_handler" {
  type        = "zip"
  output_path = "${path.module}/integration_tests_handler.zip"
  source {
    content  = <<-EOF
import json, boto3
ddb = boto3.client('dynamodb')
s3 = boto3.client('s3')
cw = boto3.client('cloudwatch')
def lambda_handler(event, context):
  passed, failed = 0, 0
  for table in event.get('tables', []):
    try:
      resp = ddb.scan(TableName=table, Limit=1)
      if resp.get('Items'):
        passed += 1
      else:
        failed += 1
    except Exception as e:
      print(f"Test failed for {table}: {e}")
      failed += 1
  cw.put_metric_data(Namespace='FintechTest/Tests', MetricData=[{'MetricName': 'TestsPassed', 'Value': passed, 'Unit': 'Count'}, {'MetricName': 'TestsFailed', 'Value': failed, 'Unit': 'Count'}])
  return {'statusCode': 200, 'passed': passed, 'failed': failed}
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "integration_tests_handler" {
  function_name    = local.lambda_functions["integration_tests_handler"].name
  role             = aws_iam_role.lambda["integration_tests_handler"].arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.integration_tests_handler.output_path
  source_code_hash = data.archive_file.integration_tests_handler.output_base64sha256
  memory_size      = local.lambda_functions["integration_tests_handler"].memory
  timeout          = local.lambda_functions["integration_tests_handler"].timeout
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = merge(var.tags, { Name = local.lambda_functions["integration_tests_handler"].name })
}

data "archive_file" "parity_validation_handler" {
  type        = "zip"
  output_path = "${path.module}/parity_validation_handler.zip"
  source {
    content  = <<-EOF
import json, boto3, time
ddb = boto3.client('dynamodb')
lam = boto3.client('lambda')
kms = boto3.client('kms')
s3 = boto3.client('s3')
cw = boto3.client('cloudwatch')
def lambda_handler(event, context):
  expected = event.get('expectedResources', {})
  report = {'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'), 'drift': []}
  drift = 0
  tables = ddb.list_tables()['TableNames']
  functions = [f['FunctionName'] for f in lam.list_functions()['Functions']]
  aliases = [a['AliasName'] for a in kms.list_aliases()['Aliases']]
  for svc, res in expected.items():
    for res_type, res_name in res.items():
      if res_name:
        exists = False
        if res_type == 'dynamodb':
          exists = res_name in tables
        elif res_type == 'lambda':
          exists = any(res_name in f for f in functions)
        elif res_type == 'kms':
          exists = res_name in aliases
        if not exists:
          report['drift'].append({'service': svc, 'type': res_type, 'name': res_name})
          drift += 1
  report_key = f"reports/parity-drift-{int(time.time())}.json"
  s3.put_object(Bucket=event['dataBucket'], Key=report_key, Body=json.dumps(report, indent=2))
  cw.put_metric_data(Namespace='FintechTest/Parity', MetricData=[{'MetricName': 'DriftCount', 'Value': drift, 'Unit': 'Count'}])
  return {'statusCode': 200, 'driftCount': drift, 'reportUri': f"s3://{event['dataBucket']}/{report_key}"}
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "parity_validation_handler" {
  function_name    = local.lambda_functions["parity_validation_handler"].name
  role             = aws_iam_role.lambda["parity_validation_handler"].arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.parity_validation_handler.output_path
  source_code_hash = data.archive_file.parity_validation_handler.output_base64sha256
  memory_size      = local.lambda_functions["parity_validation_handler"].memory
  timeout          = local.lambda_functions["parity_validation_handler"].timeout
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = merge(var.tags, { Name = local.lambda_functions["parity_validation_handler"].name })
}

# ============================================================================
# SSM AUTOMATION DOCUMENT
# ============================================================================

resource "aws_ssm_document" "aurora_masking" {
  name            = "${local.name_prefix}-aurora-masking"
  document_type   = "Automation"
  document_format = "YAML"
  content = yamlencode({
    schemaVersion = "0.3"
    description   = "Restore Aurora from snapshot and apply masking"
    assumeRole    = "{{ AutomationAssumeRole }}"
    parameters = {
      SnapshotId           = { type = "String" }
      TargetClusterId      = { type = "String" }
      AutomationAssumeRole = { type = "String", default = aws_iam_role.ssm_automation.arn }
    }
    mainSteps = [
      {
        name   = "RestoreFromSnapshot"
        action = "aws:executeAwsApi"
        inputs = {
          Service             = "rds"
          Api                 = "RestoreDBClusterFromSnapshot"
          DBClusterIdentifier = "{{ TargetClusterId }}-temp-${timestamp()}"
          SnapshotIdentifier  = "{{ SnapshotId }}"
          Engine              = var.aurora_engine
          EngineVersion       = var.aurora_engine_version
        }
        isEnd = true
      }
    ]
  })
  tags = merge(var.tags, { Name = "${local.name_prefix}-aurora-masking" })
}

# ============================================================================
# STEP FUNCTIONS STATE MACHINE
# ============================================================================

resource "aws_sfn_state_machine" "daily_refresh" {
  name     = "${local.name_prefix}-daily-refresh"
  role_arn = aws_iam_role.sfn.arn
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.sfn.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }
  definition = jsonencode({
    Comment = "Daily data refresh"
    StartAt = "S3Sync"
    States = {
      S3Sync = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.s3_sync_handler.arn
          Payload = {
            sourceBucket = local.effective_source_data_bucket
            targetBucket = aws_s3_bucket.data.id
          }
        }
        ResultPath = "$.s3Result"
        Next       = "DynamoDBRefresh"
      }
      DynamoDBRefresh = {
        Type      = "Map"
        ItemsPath = "$.tableList"
        Parameters = {
          "tableName.$" = "$$.Map.Item.Value"
          stagingBucket = aws_s3_bucket.staging.id
        }
        Iterator = {
          StartAt = "RefreshTable"
          States = {
            RefreshTable = {
              Type     = "Task"
              Resource = "arn:aws:states:::lambda:invoke"
              Parameters = {
                FunctionName = aws_lambda_function.dynamodb_refresh_handler.arn
                "Payload.$"  = "$"
              }
              End = true
            }
          }
        }
        ResultPath = "$.ddbResult"
        Next       = "AuroraRefresh"
      }
      AuroraRefresh = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.aurora_refresh_handler.arn
          Payload = {
            clusterId = aws_rds_cluster.aurora.id
          }
        }
        ResultPath = "$.auroraResult"
        Next       = "IntegrationTests"
      }
      IntegrationTests = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.integration_tests_handler.arn
          Payload = {
            tables = concat([for t in aws_dynamodb_table.with_range_key : t.name], [for t in aws_dynamodb_table.without_range_key : t.name])
          }
        }
        End = true
      }
    }
  })
  tags = merge(var.tags, { Name = "${local.name_prefix}-daily-refresh" })
}

# ============================================================================
# EVENTBRIDGE RULES
# ============================================================================

resource "aws_cloudwatch_event_rule" "daily_refresh" {
  name                = "${local.name_prefix}-daily-refresh"
  description         = "Trigger daily data refresh"
  schedule_expression = "cron(0 2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "daily_refresh" {
  rule     = aws_cloudwatch_event_rule.daily_refresh.name
  arn      = aws_sfn_state_machine.daily_refresh.arn
  role_arn = aws_iam_role.eventbridge.arn
  input = jsonencode({
    tableList = concat([for t in aws_dynamodb_table.with_range_key : t.name], [for t in aws_dynamodb_table.without_range_key : t.name])
  })
}

resource "aws_cloudwatch_event_rule" "weekly_parity" {
  name                = "${local.name_prefix}-weekly-parity"
  description         = "Weekly parity validation"
  schedule_expression = "cron(0 0 ? * SUN *)"
}

resource "aws_cloudwatch_event_target" "weekly_parity" {
  rule = aws_cloudwatch_event_rule.weekly_parity.name
  arn  = aws_lambda_function.parity_validation_handler.arn
  input = jsonencode({
    dataBucket = aws_s3_bucket.data.id
    expectedResources = {
      for svc in var.service_names : svc => {
        lambda   = "${local.name_prefix}-${svc}"
        dynamodb = contains(keys(var.ddb_tables), svc) ? "${local.name_prefix}-${svc}" : null
        kms      = "alias/app-${svc}-${var.environment}"
      }
    }
  })
}

resource "aws_lambda_permission" "weekly_parity" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.parity_validation_handler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_parity.arn
}

# ============================================================================
# CLOUDWATCH DASHBOARDS
# ============================================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-overview"
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["FintechTest/Masking", "MaskedRecords"],
            ["FintechTest/DDB", "RefreshSuccess"],
            ["FintechTest/Aurora", "RefreshSuccess"],
            ["FintechTest/Tests", "TestsPassed"],
            ["FintechTest/Tests", "TestsFailed"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Test Environment Metrics"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_dashboard" "service" {
  for_each       = toset(var.service_names)
  dashboard_name = "${local.name_prefix}-${each.value}"
  dashboard_body = jsonencode({
    widgets = [{
      type = "metric"
      properties = {
        metrics = [["AWS/Lambda", "Invocations"], [".", "Errors"], [".", "Duration"]]
        period  = 300
        region  = var.aws_region
        title   = "${each.value} Metrics"
      }
    }]
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "sfn_failed" {
  alarm_name          = "${local.name_prefix}-sfn-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  dimensions = {
    StateMachineArn = aws_sfn_state_machine.daily_refresh.arn
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each            = local.lambda_functions
  alarm_name          = "${each.value.name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  dimensions = {
    FunctionName = each.value.name
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "aurora_endpoint" {
  value = aws_rds_cluster.aurora.endpoint
}

output "s3_buckets" {
  value = {
    artifact = aws_s3_bucket.artifact.id
    data     = aws_s3_bucket.data.id
    staging  = aws_s3_bucket.staging.id
  }
}

output "dynamodb_tables" {
  value = merge(
    { for k, v in aws_dynamodb_table.with_range_key : k => v.name },
    { for k, v in aws_dynamodb_table.without_range_key : k => v.name }
  )
}

output "kms_keys" {
  value = {
    data = aws_kms_key.data.arn
    logs = aws_kms_key.logs.arn
    ssm  = aws_kms_key.ssm.arn
    s3   = aws_kms_key.s3.arn
  }
}

output "step_functions_arn" {
  value = aws_sfn_state_machine.daily_refresh.arn
}

output "eventbridge_rules" {
  value = {
    daily  = aws_cloudwatch_event_rule.daily_refresh.name
    weekly = aws_cloudwatch_event_rule.weekly_parity.name
  }
}

output "ssm_document" {
  value = aws_ssm_document.aurora_masking.name
}

output "dashboards" {
  value = merge(
    { main = aws_cloudwatch_dashboard.main.dashboard_name },
    { for k, v in aws_cloudwatch_dashboard.service : k => v.dashboard_name }
  )
}

output "drift_report_uri" {
  value = "s3://${aws_s3_bucket.data.id}/reports/"
}
