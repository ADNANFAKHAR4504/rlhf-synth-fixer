## `tap_stack.tf`

```hcl
# ============================================================================
# Vehicle Tracking and Logistics Pipeline - Multi-Environment Stack
# ============================================================================
# Production-ready Terraform configuration for GPS tracking, geofencing,
# route optimization, and delivery management across dev/staging/prod
# environments with complete topology parity.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {}
}

# ============================================================================
# VARIABLES
# ============================================================================

# Core Configuration
variable "env" {
  type        = string
  description = "Environment name (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  type        = string
  description = "Project name for resource naming"
  default     = "tap-logistics"
}

variable "owner" {
  type        = string
  description = "Owner team or individual"
  default     = "platform-team"
}

variable "cost_center" {
  type        = string
  description = "Cost center for billing"
  default     = "engineering"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags applied to all resources"
  default     = {}
}

# VPC Configuration
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for public subnets"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for private subnets"
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "enable_nat" {
  type        = bool
  description = "Enable NAT Gateway for private subnets"
  default     = true
}

# Kinesis Configuration
variable "gps_stream_name" {
  type        = string
  description = "Name for GPS data stream"
  default     = "vehicle-gps-stream"
}

variable "stream_mode" {
  type        = string
  description = "Kinesis stream mode (PROVISIONED or ON_DEMAND)"
  default     = "ON_DEMAND"
}

variable "shard_count" {
  type        = number
  description = "Number of shards for provisioned streams"
  default     = 2
}

variable "data_retention_hours" {
  type        = number
  description = "Data retention period in hours"
  default     = 24
}

# DynamoDB Configuration
variable "positions_table_name" {
  type        = string
  description = "Name for vehicle positions table"
  default     = "vehicle-positions"
}

variable "delivery_table_name" {
  type        = string
  description = "Name for delivery status table"
  default     = "delivery-status"
}

variable "billing_mode" {
  type        = string
  description = "DynamoDB billing mode"
  default     = "PAY_PER_REQUEST"
}

variable "rcu" {
  type        = number
  description = "Read capacity units for PROVISIONED mode"
  default     = 5
}

variable "wcu" {
  type        = number
  description = "Write capacity units for PROVISIONED mode"
  default     = 5
}

variable "ttl_attribute" {
  type        = string
  description = "TTL attribute name for automatic cleanup"
  default     = "expiration_time"
}

variable "gsi_geohash_key" {
  type        = string
  description = "GSI key for geohash queries"
  default     = "geohash"
}

# Lambda Configuration
variable "location_processor_memory" {
  type        = number
  description = "Memory for location processor Lambda (MB)"
  default     = 512
}

variable "geofence_checker_memory" {
  type        = number
  description = "Memory for geofence checker Lambda (MB)"
  default     = 512
}

variable "warehouse_updater_memory" {
  type        = number
  description = "Memory for warehouse updater Lambda (MB)"
  default     = 512
}

variable "timeout_seconds" {
  type        = number
  description = "Lambda function timeout in seconds"
  default     = 60
}

variable "runtime" {
  type        = string
  description = "Lambda runtime version"
  default     = "python3.12"
}

# Redis Configuration
variable "cache_node_type" {
  type        = string
  description = "ElastiCache node instance type"
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  type        = number
  description = "Number of cache nodes"
  default     = 1
}

variable "engine_version" {
  type        = string
  description = "Redis engine version"
  default     = "7.0"
}

variable "parameter_group_family" {
  type        = string
  description = "Redis parameter group family"
  default     = "redis7"
}

# Aurora Configuration
variable "db_name" {
  type        = string
  description = "Database name"
  default     = "logistics"
}

variable "master_username" {
  type        = string
  description = "Master username for Aurora"
  default     = "dbadmin"
}

variable "instance_class" {
  type        = string
  description = "Aurora instance class"
  default     = "db.t3.medium"
}

variable "serverless_min_capacity" {
  type        = number
  description = "Minimum ACU for serverless v2"
  default     = 0.5
}

variable "serverless_max_capacity" {
  type        = number
  description = "Maximum ACU for serverless v2"
  default     = 1
}

variable "backup_retention" {
  type        = number
  description = "Backup retention period in days"
  default     = 7
}

# SQS Configuration
variable "warehouse_queue_name" {
  type        = string
  description = "Name for warehouse notifications queue"
  default     = "warehouse-notifications"
}

variable "customer_queue_name" {
  type        = string
  description = "Name for customer alerts queue"
  default     = "customer-alerts"
}

variable "visibility_timeout" {
  type        = number
  description = "Message visibility timeout in seconds"
  default     = 300
}

variable "retention_period" {
  type        = number
  description = "Message retention period in seconds"
  default     = 345600
}

# EventBridge Configuration
variable "optimization_schedule_expression" {
  type        = string
  description = "Schedule expression for route optimization"
  default     = "rate(5 minutes)"
}

# S3 Configuration
variable "telemetry_bucket_name" {
  type        = string
  description = "Name for telemetry data bucket"
  default     = ""
}

variable "analytics_bucket_name" {
  type        = string
  description = "Name for analytics results bucket"
  default     = ""
}

variable "lifecycle_days" {
  type        = number
  description = "Days before transitioning to IA storage"
  default     = 30
}

# Athena Configuration
variable "workgroup_name" {
  type        = string
  description = "Athena workgroup name"
  default     = "vehicle-analytics"
}

variable "query_results_bucket" {
  type        = string
  description = "S3 bucket for Athena query results"
  default     = ""
}

# CloudWatch Configuration
variable "log_retention_days" {
  type        = number
  description = "CloudWatch log retention in days"
  default     = 7
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Resource naming convention
  name_prefix = "${var.project_name}-${var.env}-${var.pr_number}"

  # Common tags for all resources
  tags = merge(
    {
      Environment = var.env
      Project     = var.project_name
      Owner       = var.owner
      CostCenter  = var.cost_center
      ManagedBy   = "terraform"
    },
    var.common_tags
  )

  # Per-environment capacity configurations
  capacity_map = {
    dev = {
      kinesis_shards      = 1
      lambda_memory       = 256
      dynamodb_rcu        = 5
      dynamodb_wcu        = 5
      redis_nodes         = 1
      aurora_min_capacity = 0.5
      aurora_max_capacity = 1
      log_retention_days  = 3
    }
    staging = {
      kinesis_shards      = 2
      lambda_memory       = 512
      dynamodb_rcu        = 10
      dynamodb_wcu        = 10
      redis_nodes         = 2
      aurora_min_capacity = 1
      aurora_max_capacity = 2
      log_retention_days  = 7
    }
    prod = {
      kinesis_shards      = 4
      lambda_memory       = 1024
      dynamodb_rcu        = 50
      dynamodb_wcu        = 50
      redis_nodes         = 3
      aurora_min_capacity = 2
      aurora_max_capacity = 8
      log_retention_days  = 30
    }
  }

  current_capacity = local.capacity_map[var.env]

  # S3 bucket names with account ID for uniqueness
  telemetry_bucket      = var.telemetry_bucket_name != "" ? var.telemetry_bucket_name : "${local.name_prefix}-telemetry-${data.aws_caller_identity.current.account_id}"
  analytics_bucket      = var.analytics_bucket_name != "" ? var.analytics_bucket_name : "${local.name_prefix}-analytics-${data.aws_caller_identity.current.account_id}"
  athena_results_bucket = var.query_results_bucket != "" ? var.query_results_bucket : "${local.name_prefix}-athena-results-${data.aws_caller_identity.current.account_id}"
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# KMS KEYS
# ============================================================================

# KMS key for encryption at rest
data "aws_iam_policy_document" "kms_key_policy" {
  statement {
    sid    = "Enable IAM User Permissions"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "Allow CloudWatch Logs"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["logs.${var.aws_region}.amazonaws.com"]
    }
    actions = [
      "kms:Encrypt*",
      "kms:Decrypt*",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:Describe*"
    ]
    resources = ["*"]
    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"]
    }
  }

  statement {
    sid    = "Allow SNS"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
    actions = [
      "kms:GenerateDataKey*",
      "kms:Decrypt"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "Allow SQS"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["sqs.amazonaws.com"]
    }
    actions = [
      "kms:GenerateDataKey*",
      "kms:Decrypt"
    ]
    resources = ["*"]
  }
}

resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy                  = data.aws_iam_policy_document.kms_key_policy.json

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-kms"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}

# ============================================================================
# VPC AND NETWORKING
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = var.enable_nat ? 1 : 0
  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-nat-eip"
  })
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-nat"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[0].id
    }
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Groups
resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Lambda functions"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.name_prefix}-redis-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for ElastiCache Redis"

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis-sg"
  })
}

resource "aws_security_group" "aurora" {
  name_prefix = "${local.name_prefix}-aurora-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Aurora PostgreSQL"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-sg"
  })
}

# VPC Endpoints
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "kinesis" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-kinesis-endpoint"
  })
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-sns-endpoint"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-sqs-endpoint"
  })
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# Telemetry bucket for vehicle logs
resource "aws_s3_bucket" "telemetry" {
  bucket = local.telemetry_bucket

  tags = merge(local.tags, {
    Name = local.telemetry_bucket
  })
}

resource "aws_s3_bucket_versioning" "telemetry" {
  bucket = aws_s3_bucket.telemetry.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "telemetry" {
  bucket = aws_s3_bucket.telemetry.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "telemetry" {
  bucket = aws_s3_bucket.telemetry.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {}

    transition {
      days          = var.lifecycle_days
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

# Analytics bucket for processed results
resource "aws_s3_bucket" "analytics" {
  bucket = local.analytics_bucket

  tags = merge(local.tags, {
    Name = local.analytics_bucket
  })
}

resource "aws_s3_bucket_versioning" "analytics" {
  bucket = aws_s3_bucket.analytics.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "analytics" {
  bucket = aws_s3_bucket.analytics.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Athena query results bucket
resource "aws_s3_bucket" "athena_results" {
  bucket = local.athena_results_bucket

  tags = merge(local.tags, {
    Name = local.athena_results_bucket
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# ============================================================================
# DYNAMODB TABLES
# ============================================================================

# Vehicle positions table with GSI for geohash queries
resource "aws_dynamodb_table" "vehicle_positions" {
  name           = "${local.name_prefix}-${var.positions_table_name}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.current_capacity.dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.current_capacity.dynamodb_wcu : null
  hash_key       = "vehicle_id"
  range_key      = "timestamp"

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "vehicle_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = var.gsi_geohash_key
    type = "S"
  }

  global_secondary_index {
    name            = "geohash-index"
    hash_key        = var.gsi_geohash_key
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? local.current_capacity.dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? local.current_capacity.dynamodb_wcu : null
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = var.env == "prod" ? true : false
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${var.positions_table_name}"
  })
}

# Delivery status table with TTL
resource "aws_dynamodb_table" "delivery_status" {
  name           = "${local.name_prefix}-${var.delivery_table_name}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.current_capacity.dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.current_capacity.dynamodb_wcu : null
  hash_key       = "delivery_id"

  attribute {
    name = "delivery_id"
    type = "S"
  }

  ttl {
    enabled        = true
    attribute_name = var.ttl_attribute
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = var.env == "prod" ? true : false
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${var.delivery_table_name}"
  })
}

# ============================================================================
# KINESIS DATA STREAM
# ============================================================================

resource "aws_kinesis_stream" "gps" {
  name             = "${local.name_prefix}-${var.gps_stream_name}"
  shard_count      = var.stream_mode == "PROVISIONED" ? local.current_capacity.kinesis_shards : null
  retention_period = var.data_retention_hours
  encryption_type  = "KMS"
  kms_key_id       = aws_kms_key.main.id

  stream_mode_details {
    stream_mode = var.stream_mode
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${var.gps_stream_name}"
  })
}

# ============================================================================
# ELASTICACHE REDIS
# ============================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis-subnet-group"
  })
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${local.name_prefix}-redis-params"
  family = var.parameter_group_family

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis-params"
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name_prefix}-redis"
  description                = "Redis cluster for geofence boundaries"
  node_type                  = var.cache_node_type
  num_cache_clusters         = local.current_capacity.redis_nodes
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = local.current_capacity.redis_nodes > 1
  engine_version             = var.engine_version
  kms_key_id                 = aws_kms_key.main.arn

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis"
  })
}

# ============================================================================
# AURORA POSTGRESQL
# ============================================================================

resource "random_password" "aurora" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "aurora" {
  name                    = "${local.name_prefix}-aurora-credentials"
  recovery_window_in_days = var.env == "prod" ? 30 : 7

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "aurora" {
  secret_id = aws_secretsmanager_secret.aurora.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.aurora.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "${local.name_prefix}-aurora-params"
  family      = "aurora-postgresql15"
  description = "Aurora PostgreSQL parameter group"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "effective_cache_size"
    value = "393216"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-params"
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.name_prefix}-aurora-cluster"
  engine                          = "aurora-postgresql"
  engine_mode                     = "provisioned"
  engine_version                  = "15.14"
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  database_name                   = var.db_name
  master_username                 = var.master_username
  master_password                 = random_password.aurora.result
  backup_retention_period         = var.backup_retention
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.main.arn
  enabled_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection             = var.env == "prod" ? true : false

  serverlessv2_scaling_configuration {
    max_capacity = local.current_capacity.aurora_max_capacity
    min_capacity = local.current_capacity.aurora_min_capacity
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-cluster"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = var.env == "prod" ? 2 : 1
  identifier         = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled = var.env == "prod" ? true : false
  monitoring_interval          = var.env == "prod" ? 60 : 0
  monitoring_role_arn          = var.env == "prod" ? aws_iam_role.rds_monitoring[0].arn : null

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  })
}

# RDS Enhanced Monitoring Role (prod only)
resource "aws_iam_role" "rds_monitoring" {
  count = var.env == "prod" ? 1 : 0
  name  = "${local.name_prefix}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.env == "prod" ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ============================================================================
# SNS TOPICS
# ============================================================================

resource "aws_sns_topic" "geofence_violations" {
  name              = "${local.name_prefix}-geofence-violations"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-geofence-violations"
  })
}

resource "aws_sns_topic" "customer_notifications" {
  name              = "${local.name_prefix}-customer-notifications"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-customer-notifications"
  })
}

# ============================================================================
# SQS QUEUES
# ============================================================================

# Warehouse notifications queue
resource "aws_sqs_queue" "warehouse" {
  name                       = "${local.name_prefix}-${var.warehouse_queue_name}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = var.retention_period
  kms_master_key_id          = aws_kms_key.main.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.warehouse_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${var.warehouse_queue_name}"
  })
}

resource "aws_sqs_queue" "warehouse_dlq" {
  name                      = "${local.name_prefix}-${var.warehouse_queue_name}-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${var.warehouse_queue_name}-dlq"
  })
}

# Customer alerts queue
resource "aws_sqs_queue" "customer" {
  name                       = "${local.name_prefix}-${var.customer_queue_name}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = var.retention_period
  kms_master_key_id          = aws_kms_key.main.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.customer_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${var.customer_queue_name}"
  })
}

resource "aws_sqs_queue" "customer_dlq" {
  name                      = "${local.name_prefix}-${var.customer_queue_name}-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${var.customer_queue_name}-dlq"
  })
}

# SNS to SQS subscriptions
resource "aws_sns_topic_subscription" "warehouse_queue" {
  topic_arn = aws_sns_topic.geofence_violations.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.warehouse.arn
}

resource "aws_sns_topic_subscription" "customer_queue" {
  topic_arn = aws_sns_topic.geofence_violations.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.customer.arn
}

# SQS queue policies for SNS
resource "aws_sqs_queue_policy" "warehouse" {
  queue_url = aws_sqs_queue.warehouse.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.warehouse.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.geofence_violations.arn
        }
      }
    }]
  })
}

resource "aws_sqs_queue_policy" "customer" {
  queue_url = aws_sqs_queue.customer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.customer.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.geofence_violations.arn
        }
      }
    }]
  })
}

# ============================================================================
# LAMBDA FUNCTIONS
# ============================================================================

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "location_processor" {
  name              = "/aws/lambda/${local.name_prefix}-location-processor"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "geofence_checker" {
  name              = "/aws/lambda/${local.name_prefix}-geofence-checker"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "warehouse_updater" {
  name              = "/aws/lambda/${local.name_prefix}-warehouse-updater"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "customer_notifier" {
  name              = "/aws/lambda/${local.name_prefix}-customer-notifier"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "telemetry_analyzer" {
  name              = "/aws/lambda/${local.name_prefix}-telemetry-analyzer"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "route_optimizer" {
  name              = "/aws/lambda/${local.name_prefix}-route-optimizer"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/${local.name_prefix}-redis-slow"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

# Lambda code packages
data "archive_file" "location_processor" {
  type        = "zip"
  output_path = "/tmp/location_processor.zip"

  source {
    content  = <<-EOT
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['POSITIONS_TABLE'])

def handler(event, context):
    for record in event['Records']:
        payload = json.loads(record['kinesis']['data'])
        
        # Calculate geohash for spatial indexing
        lat = Decimal(str(payload['latitude']))
        lng = Decimal(str(payload['longitude']))
        geohash = f"{int(lat*100)},{int(lng*100)}"
        
        table.put_item(Item={
            'vehicle_id': payload['vehicle_id'],
            'timestamp': Decimal(str(payload['timestamp'])),
            'latitude': lat,
            'longitude': lng,
            'geohash': geohash,
            'speed': Decimal(str(payload.get('speed', 0))),
            'heading': Decimal(str(payload.get('heading', 0)))
        })
    
    return {'statusCode': 200}
EOT
    filename = "lambda_function.py"
  }
}

data "archive_file" "geofence_checker" {
  type        = "zip"
  output_path = "/tmp/geofence_checker.zip"

  source {
    content  = <<-EOT
import json
import boto3
import redis
import os

sns = boto3.client('sns')

def handler(event, context):
    # Connect to Redis
    r = redis.Redis(
        host=os.environ['REDIS_ENDPOINT'],
        port=6379,
        decode_responses=True
    )
    
    for record in event['Records']:
        if record['eventName'] in ['INSERT', 'MODIFY']:
            new_image = record['dynamodb'].get('NewImage', {})
            
            vehicle_id = new_image.get('vehicle_id', {}).get('S')
            geohash = new_image.get('geohash', {}).get('S')
            
            if vehicle_id and geohash:
                # Check geofences in Redis
                geofences = r.zrangebyscore('geofences', geohash, geohash)
                
                if geofences:
                    # Publish violation
                    sns.publish(
                        TopicArn=os.environ['SNS_TOPIC_ARN'],
                        Message=json.dumps({
                            'vehicle_id': vehicle_id,
                            'geohash': geohash,
                            'violations': geofences
                        })
                    )
    
    return {'statusCode': 200}
EOT
    filename = "lambda_function.py"
  }
}

data "archive_file" "warehouse_updater" {
  type        = "zip"
  output_path = "/tmp/warehouse_updater.zip"

  source {
    content  = <<-EOT
import json
import boto3
import psycopg2
import os

def handler(event, context):
    # Get Aurora credentials from Secrets Manager
    sm = boto3.client('secretsmanager')
    secret = sm.get_secret_value(SecretId=os.environ['SECRET_ARN'])
    creds = json.loads(secret['SecretString'])
    
    conn = psycopg2.connect(
        host=creds['host'],
        port=creds['port'],
        database=creds['dbname'],
        user=creds['username'],
        password=creds['password']
    )
    
    cursor = conn.cursor()
    
    for record in event['Records']:
        body = json.loads(record['body'])
        
        # Update inventory tables
        cursor.execute("""
            INSERT INTO warehouse_notifications (vehicle_id, event_type, timestamp)
            VALUES (%s, %s, NOW())
        """, (body['vehicle_id'], 'geofence_violation'))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {'statusCode': 200}
EOT
    filename = "lambda_function.py"
  }
}

data "archive_file" "customer_notifier" {
  type        = "zip"
  output_path = "/tmp/customer_notifier.zip"

  source {
    content  = <<-EOT
import json
import boto3
import os

sns = boto3.client('sns')

def handler(event, context):
    for record in event['Records']:
        body = json.loads(record['body'])
        
        # Send customer notification
        sns.publish(
            TopicArn=os.environ['CUSTOMER_TOPIC_ARN'],
            Message=json.dumps({
                'delivery_update': body,
                'notification_type': 'geofence_alert'
            })
        )
    
    return {'statusCode': 200}
EOT
    filename = "lambda_function.py"
  }
}

data "archive_file" "telemetry_analyzer" {
  type        = "zip"
  output_path = "/tmp/telemetry_analyzer.zip"

  source {
    content  = <<-EOT
import json
import boto3
import os
import time

athena = boto3.client('athena')
s3 = boto3.client('s3')

def handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Run Athena query
        query = f"""
            SELECT vehicle_id, AVG(speed) as avg_speed, COUNT(*) as data_points
            FROM telemetry
            WHERE date = CURRENT_DATE
            GROUP BY vehicle_id
        """
        
        response = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': 'vehicle_analytics'},
            ResultConfiguration={'OutputLocation': f"s3://{os.environ['RESULTS_BUCKET']}/"}
        )
        
        # Store aggregated results
        s3.put_object(
            Bucket=os.environ['ANALYTICS_BUCKET'],
            Key=f"summaries/{time.strftime('%Y%m%d')}/query_{response['QueryExecutionId']}.json",
            Body=json.dumps({'query_id': response['QueryExecutionId']})
        )
    
    return {'statusCode': 200}
EOT
    filename = "lambda_function.py"
  }
}

data "archive_file" "route_optimizer" {
  type        = "zip"
  output_path = "/tmp/route_optimizer.zip"

  source {
    content  = <<-EOT
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
kinesis = boto3.client('kinesis')

def handler(event, context):
    # Query vehicle positions
    table = dynamodb.Table(os.environ['POSITIONS_TABLE'])
    
    # Simple optimization logic (placeholder)
    optimized_routes = {
        'routes': [],
        'timestamp': int(time.time())
    }
    
    # Publish optimization results
    kinesis.put_record(
        StreamName=os.environ['STREAM_NAME'],
        Data=json.dumps(optimized_routes),
        PartitionKey='optimization'
    )
    
    return {'statusCode': 200}
EOT
    filename = "lambda_function.py"
  }
}

# IAM Roles for Lambda Functions
resource "aws_iam_role" "location_processor" {
  name = "${local.name_prefix}-location-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role" "geofence_checker" {
  name = "${local.name_prefix}-geofence-checker-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role" "warehouse_updater" {
  name = "${local.name_prefix}-warehouse-updater-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role" "customer_notifier" {
  name = "${local.name_prefix}-customer-notifier-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role" "telemetry_analyzer" {
  name = "${local.name_prefix}-telemetry-analyzer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role" "route_optimizer" {
  name = "${local.name_prefix}-route-optimizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

# IAM Policies
resource "aws_iam_role_policy" "location_processor" {
  name = "location-processor-policy"
  role = aws_iam_role.location_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:ListShards"
        ]
        Resource = aws_kinesis_stream.gps.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.vehicle_positions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.location_processor.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "geofence_checker" {
  name = "geofence-checker-policy"
  role = aws_iam_role.geofence_checker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${aws_dynamodb_table.vehicle_positions.arn}/stream/*"
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.geofence_violations.arn
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
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.geofence_checker.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "warehouse_updater" {
  name = "warehouse-updater-policy"
  role = aws_iam_role.warehouse_updater.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.warehouse.arn
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = aws_secretsmanager_secret.aurora.arn
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
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.warehouse_updater.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "customer_notifier" {
  name = "customer-notifier-policy"
  role = aws_iam_role.customer_notifier.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.customer.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.customer_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.customer_notifier.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "telemetry_analyzer" {
  name = "telemetry-analyzer-policy"
  role = aws_iam_role.telemetry_analyzer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.telemetry.arn}/*"
      },
      {
        Effect = "Allow"
        Action = ["s3:PutObject"]
        Resource = [
          "${aws_s3_bucket.analytics.arn}/*",
          "${aws_s3_bucket.athena_results.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetDatabase",
          "glue:GetTable"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.telemetry_analyzer.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "route_optimizer" {
  name = "route-optimizer-policy"
  role = aws_iam_role.route_optimizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.vehicle_positions.arn
      },
      {
        Effect   = "Allow"
        Action   = ["kinesis:PutRecord"]
        Resource = aws_kinesis_stream.gps.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.route_optimizer.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# Attach managed policies
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  for_each = {
    geofence_checker  = aws_iam_role.geofence_checker.name
    warehouse_updater = aws_iam_role.warehouse_updater.name
  }

  role       = each.value
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda Functions
resource "aws_lambda_function" "location_processor" {
  filename         = data.archive_file.location_processor.output_path
  function_name    = "${local.name_prefix}-location-processor"
  role             = aws_iam_role.location_processor.arn
  handler          = "lambda_function.handler"
  source_code_hash = data.archive_file.location_processor.output_base64sha256
  runtime          = var.runtime
  memory_size      = local.current_capacity.lambda_memory
  timeout          = var.timeout_seconds

  environment {
    variables = {
      POSITIONS_TABLE = aws_dynamodb_table.vehicle_positions.name
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-location-processor"
  })
}

resource "aws_lambda_function" "geofence_checker" {
  filename         = data.archive_file.geofence_checker.output_path
  function_name    = "${local.name_prefix}-geofence-checker"
  role             = aws_iam_role.geofence_checker.arn
  handler          = "lambda_function.handler"
  source_code_hash = data.archive_file.geofence_checker.output_base64sha256
  runtime          = var.runtime
  memory_size      = local.current_capacity.lambda_memory
  timeout          = var.timeout_seconds

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      REDIS_ENDPOINT = aws_elasticache_replication_group.redis.primary_endpoint_address
      SNS_TOPIC_ARN  = aws_sns_topic.geofence_violations.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-geofence-checker"
  })
}

resource "aws_lambda_function" "warehouse_updater" {
  filename         = data.archive_file.warehouse_updater.output_path
  function_name    = "${local.name_prefix}-warehouse-updater"
  role             = aws_iam_role.warehouse_updater.arn
  handler          = "lambda_function.handler"
  source_code_hash = data.archive_file.warehouse_updater.output_base64sha256
  runtime          = var.runtime
  memory_size      = local.current_capacity.lambda_memory
  timeout          = var.timeout_seconds

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SECRET_ARN = aws_secretsmanager_secret.aurora.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-warehouse-updater"
  })
}

resource "aws_lambda_function" "customer_notifier" {
  filename         = data.archive_file.customer_notifier.output_path
  function_name    = "${local.name_prefix}-customer-notifier"
  role             = aws_iam_role.customer_notifier.arn
  handler          = "lambda_function.handler"
  source_code_hash = data.archive_file.customer_notifier.output_base64sha256
  runtime          = var.runtime
  memory_size      = local.current_capacity.lambda_memory
  timeout          = var.timeout_seconds

  environment {
    variables = {
      CUSTOMER_TOPIC_ARN = aws_sns_topic.customer_notifications.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-customer-notifier"
  })
}

resource "aws_lambda_function" "telemetry_analyzer" {
  filename         = data.archive_file.telemetry_analyzer.output_path
  function_name    = "${local.name_prefix}-telemetry-analyzer"
  role             = aws_iam_role.telemetry_analyzer.arn
  handler          = "lambda_function.handler"
  source_code_hash = data.archive_file.telemetry_analyzer.output_base64sha256
  runtime          = var.runtime
  memory_size      = local.current_capacity.lambda_memory
  timeout          = var.timeout_seconds

  environment {
    variables = {
      ANALYTICS_BUCKET = aws_s3_bucket.analytics.id
      RESULTS_BUCKET   = aws_s3_bucket.athena_results.id
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-telemetry-analyzer"
  })
}

resource "aws_lambda_function" "route_optimizer" {
  filename         = data.archive_file.route_optimizer.output_path
  function_name    = "${local.name_prefix}-route-optimizer"
  role             = aws_iam_role.route_optimizer.arn
  handler          = "lambda_function.handler"
  source_code_hash = data.archive_file.route_optimizer.output_base64sha256
  runtime          = var.runtime
  memory_size      = local.current_capacity.lambda_memory
  timeout          = var.timeout_seconds

  environment {
    variables = {
      POSITIONS_TABLE = aws_dynamodb_table.vehicle_positions.name
      STREAM_NAME     = aws_kinesis_stream.gps.name
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-route-optimizer"
  })
}

# Event Source Mappings
resource "aws_lambda_event_source_mapping" "kinesis_to_location_processor" {
  event_source_arn                   = aws_kinesis_stream.gps.arn
  function_name                      = aws_lambda_function.location_processor.arn
  starting_position                  = "LATEST"
  parallelization_factor             = 10
  maximum_batching_window_in_seconds = 5
}

resource "aws_lambda_event_source_mapping" "dynamodb_to_geofence_checker" {
  event_source_arn       = aws_dynamodb_table.vehicle_positions.stream_arn
  function_name          = aws_lambda_function.geofence_checker.arn
  starting_position      = "LATEST"
  parallelization_factor = 10
}

resource "aws_lambda_event_source_mapping" "sqs_to_warehouse_updater" {
  event_source_arn = aws_sqs_queue.warehouse.arn
  function_name    = aws_lambda_function.warehouse_updater.arn
  batch_size       = 10
}

resource "aws_lambda_event_source_mapping" "sqs_to_customer_notifier" {
  event_source_arn = aws_sqs_queue.customer.arn
  function_name    = aws_lambda_function.customer_notifier.arn
  batch_size       = 10
}

# S3 Event Notification
resource "aws_lambda_permission" "allow_s3_telemetry" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.telemetry_analyzer.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.telemetry.arn
}

resource "aws_s3_bucket_notification" "telemetry_events" {
  bucket = aws_s3_bucket.telemetry.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.telemetry_analyzer.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "raw-telemetry/"
    filter_suffix       = ".json"
  }

  depends_on = [aws_lambda_permission.allow_s3_telemetry]
}

# ============================================================================
# STEP FUNCTIONS
# ============================================================================

resource "aws_iam_role" "step_functions" {
  name = "${local.name_prefix}-stepfunctions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "step_functions" {
  name = "stepfunctions-policy"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = aws_lambda_function.route_optimizer.arn
      },
      {
        Effect = "Allow"
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
        Resource = "*"
      }
    ]
  })
}

resource "aws_sfn_state_machine" "route_optimization" {
  name     = "${local.name_prefix}-route-optimization"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Route optimization workflow"
    StartAt = "OptimizeRoutes"
    States = {
      OptimizeRoutes = {
        Type     = "Task"
        Resource = aws_lambda_function.route_optimizer.arn
        End      = true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-route-optimization"
  })
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${local.name_prefix}-route-optimization"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

# ============================================================================
# EVENTBRIDGE
# ============================================================================

resource "aws_iam_role" "eventbridge" {
  name = "${local.name_prefix}-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "eventbridge" {
  name = "eventbridge-policy"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["states:StartExecution"]
        Resource = aws_sfn_state_machine.route_optimization.arn
      }
    ]
  })
}

resource "aws_cloudwatch_event_rule" "route_optimization_schedule" {
  name                = "${local.name_prefix}-route-optimization-schedule"
  description         = "Trigger route optimization every 5 minutes"
  schedule_expression = var.optimization_schedule_expression

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-route-optimization-schedule"
  })
}

resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.route_optimization_schedule.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.route_optimization.arn
  role_arn  = aws_iam_role.eventbridge.arn
}

# ============================================================================
# ATHENA
# ============================================================================

resource "aws_athena_workgroup" "analytics" {
  name = "${local.name_prefix}-${var.workgroup_name}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.main.arn
      }
    }
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${var.workgroup_name}"
  })
}

# ============================================================================
# WAF (Web Application Firewall)
# ============================================================================

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "/aws/waf/${local.name_prefix}-webacl"
  retention_in_days = local.current_capacity.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

# WAF WebACL
resource "aws_wafv2_web_acl" "main" {
  name        = "${local.name_prefix}-webacl"
  description = "WAF WebACL for vehicle tracking application"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rule - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

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
      metric_name                = "${local.name_prefix}-CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

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
      metric_name                = "${local.name_prefix}-KnownBadInputsMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

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
      metric_name                = "${local.name_prefix}-SQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - Linux Operating System
  rule {
    name     = "AWSManagedRulesLinuxRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesLinuxRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-LinuxRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - Unix Operating System
  rule {
    name     = "AWSManagedRulesUnixRuleSet"
    priority = 5

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesUnixRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-UnixRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate-based rule for DDoS protection
  rule {
    name     = "RateBasedRule"
    priority = 6

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-RateBasedRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-WebACLMetric"
    sampled_requests_enabled   = true
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-webacl"
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "kinesis_latency" {
  alarm_name          = "${local.name_prefix}-kinesis-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "GetRecords.IteratorAgeMilliseconds"
  namespace           = "AWS/Kinesis"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "60000"
  alarm_description   = "Kinesis iterator age is too high"

  dimensions = {
    StreamName = aws_kinesis_stream.gps.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_concurrent_executions" {
  for_each = {
    location_processor = aws_lambda_function.location_processor.function_name
    geofence_checker   = aws_lambda_function.geofence_checker.function_name
    warehouse_updater  = aws_lambda_function.warehouse_updater.function_name
  }

  alarm_name          = "${local.name_prefix}-${each.key}-concurrent-executions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "900"
  alarm_description   = "Lambda concurrent executions approaching limit"

  dimensions = {
    FunctionName = each.value
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  for_each = {
    vehicle_positions = aws_dynamodb_table.vehicle_positions.name
    delivery_status   = aws_dynamodb_table.delivery_status.name
  }

  alarm_name          = "${local.name_prefix}-${each.key}-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "80"
  alarm_description   = "DynamoDB table throttling detected"

  dimensions = {
    TableName = each.value
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "aurora_replication_lag" {
  count               = var.env == "prod" ? 1 : 0
  alarm_name          = "${local.name_prefix}-aurora-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "1000"
  alarm_description   = "Aurora replication lag is high"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${local.name_prefix}-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Redis evictions detected"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "sqs_queue_depth" {
  for_each = {
    warehouse = aws_sqs_queue.warehouse.name
    customer  = aws_sqs_queue.customer.name
  }

  alarm_name          = "${local.name_prefix}-${each.key}-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "1000"
  alarm_description   = "SQS queue depth is high"

  dimensions = {
    QueueName = each.value
  }

  tags = local.tags
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "kinesis_stream_arn" {
  value       = aws_kinesis_stream.gps.arn
  description = "ARN of the GPS Kinesis data stream"
}

output "dynamodb_positions_table" {
  value = {
    name = aws_dynamodb_table.vehicle_positions.name
    arn  = aws_dynamodb_table.vehicle_positions.arn
  }
  description = "Vehicle positions DynamoDB table details"
}

output "dynamodb_delivery_table" {
  value = {
    name = aws_dynamodb_table.delivery_status.name
    arn  = aws_dynamodb_table.delivery_status.arn
  }
  description = "Delivery status DynamoDB table details"
}

output "sns_topics" {
  value = {
    geofence_violations    = aws_sns_topic.geofence_violations.arn
    customer_notifications = aws_sns_topic.customer_notifications.arn
  }
  description = "SNS topic ARNs"
}

output "sqs_queues" {
  value = {
    warehouse_url = aws_sqs_queue.warehouse.url
    customer_url  = aws_sqs_queue.customer.url
  }
  description = "SQS queue URLs"
}

output "aurora_endpoints" {
  value = {
    writer_endpoint = aws_rds_cluster.aurora.endpoint
    reader_endpoint = aws_rds_cluster.aurora.reader_endpoint
  }
  description = "Aurora PostgreSQL endpoints"
  sensitive   = true
}

output "redis_endpoint" {
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  description = "ElastiCache Redis primary endpoint"
}

output "lambda_function_arns" {
  value = {
    location_processor = aws_lambda_function.location_processor.arn
    geofence_checker   = aws_lambda_function.geofence_checker.arn
    warehouse_updater  = aws_lambda_function.warehouse_updater.arn
    customer_notifier  = aws_lambda_function.customer_notifier.arn
    telemetry_analyzer = aws_lambda_function.telemetry_analyzer.arn
    route_optimizer    = aws_lambda_function.route_optimizer.arn
  }
  description = "Lambda function ARNs"
}

output "step_functions_arn" {
  value       = aws_sfn_state_machine.route_optimization.arn
  description = "Step Functions state machine ARN"
}

output "s3_buckets" {
  value = {
    telemetry      = aws_s3_bucket.telemetry.id
    analytics      = aws_s3_bucket.analytics.id
    athena_results = aws_s3_bucket.athena_results.id
  }
  description = "S3 bucket names"
}

output "vpc_details" {
  value = {
    vpc_id             = aws_vpc.main.id
    public_subnet_ids  = aws_subnet.public[*].id
    private_subnet_ids = aws_subnet.private[*].id
    lambda_sg_id       = aws_security_group.lambda.id
    redis_sg_id        = aws_security_group.redis.id
    aurora_sg_id       = aws_security_group.aurora.id
  }
  description = "VPC and networking details"
}

output "athena_workgroup" {
  value       = aws_athena_workgroup.analytics.name
  description = "Athena workgroup name"
}

output "waf_web_acl_id" {
  value       = aws_wafv2_web_acl.main.id
  description = "WAF WebACL ID"
}

output "waf_web_acl_arn" {
  value       = aws_wafv2_web_acl.main.arn
  description = "WAF WebACL ARN"
}

output "kms_key_id" {
  value       = aws_kms_key.main.id
  description = "KMS key ID for encryption"
}

output "kms_key_arn" {
  value       = aws_kms_key.main.arn
  description = "KMS key ARN for encryption"
}

output "aurora_secret_arn" {
  value       = aws_secretsmanager_secret.aurora.arn
  description = "Secrets Manager secret ARN for Aurora credentials"
  sensitive   = true
}

output "lambda_function_names" {
  value = {
    location_processor = aws_lambda_function.location_processor.function_name
    geofence_checker   = aws_lambda_function.geofence_checker.function_name
    warehouse_updater  = aws_lambda_function.warehouse_updater.function_name
    customer_notifier  = aws_lambda_function.customer_notifier.function_name
    telemetry_analyzer = aws_lambda_function.telemetry_analyzer.function_name
    route_optimizer    = aws_lambda_function.route_optimizer.function_name
  }
  description = "Lambda function names"
}

output "kinesis_stream_name" {
  value       = aws_kinesis_stream.gps.name
  description = "Kinesis stream name"
}

output "dynamodb_stream_arn" {
  value       = aws_dynamodb_table.vehicle_positions.stream_arn
  description = "DynamoDB stream ARN for vehicle positions table"
}

output "eventbridge_rule_arn" {
  value       = aws_cloudwatch_event_rule.route_optimization_schedule.arn
  description = "EventBridge rule ARN for route optimization schedule"
}
```


## `variables.tf`

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
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


## `dev.tfvars`

```hcl
env                  = "dev"
aws_region           = "us-east-1"
project_name         = "tap-logistics"
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
enable_nat           = true
stream_mode          = "ON_DEMAND"
billing_mode         = "PAY_PER_REQUEST"
cache_node_type      = "cache.t3.micro"
instance_class       = "db.t3.medium"
log_retention_days   = 3
lifecycle_days       = 7
backup_retention     = 3
pr_number            = "pr7512"
```


## `prod.tfvars`

```hcl
env                              = "prod"
aws_region                       = "us-east-1"
project_name                     = "tap-logistics"
vpc_cidr                         = "10.2.0.0/16"
public_subnet_cidrs              = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs             = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
enable_nat                       = true
stream_mode                      = "PROVISIONED"
shard_count                      = 4
data_retention_hours             = 168
billing_mode                     = "PROVISIONED"
rcu                              = 50
wcu                              = 50
cache_node_type                  = "cache.r6g.large"
num_cache_nodes                  = 3
engine_version                   = "7.0"
instance_class                   = "db.r6g.large"
serverless_min_capacity          = 2
serverless_max_capacity          = 8
log_retention_days               = 30
lifecycle_days                   = 30
backup_retention                 = 30
location_processor_memory        = 1024
geofence_checker_memory          = 1024
warehouse_updater_memory         = 1024
timeout_seconds                  = 120
visibility_timeout               = 600
retention_period                 = 1209600
optimization_schedule_expression = "rate(1 minute)"
pr_number                        = "pr7512"
```


## `staging.tfvars`

```hcl
env                       = "staging"
aws_region                = "us-east-1"
project_name              = "tap-logistics"
vpc_cidr                  = "10.1.0.0/16"
public_subnet_cidrs       = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs      = ["10.1.10.0/24", "10.1.11.0/24"]
enable_nat                = true
stream_mode               = "PROVISIONED"
shard_count               = 2
billing_mode              = "PROVISIONED"
rcu                       = 10
wcu                       = 10
cache_node_type           = "cache.t3.small"
num_cache_nodes           = 2
instance_class            = "db.t3.medium"
serverless_min_capacity   = 1
serverless_max_capacity   = 2
log_retention_days        = 7
lifecycle_days            = 14
backup_retention          = 7
location_processor_memory = 512
geofence_checker_memory   = 512
warehouse_updater_memory  = 512
pr_number                 = "pr7512"
```
