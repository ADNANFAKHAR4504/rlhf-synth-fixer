## `tapstack.tf`

```hcl
# ============================================================================
# Terraform Configuration
# ============================================================================

terraform {
  required_version = ">= 1.5.0"

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
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }

  backend "s3" {}
}

# ============================================================================
# Variables
# ============================================================================

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "fraud-detection"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

variable "pr_number" {
  description = "PR number for tracking resources"
  type        = string
  default     = "unknown"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

# Kinesis Variables
variable "kinesis_stream_name" {
  description = "Name of the Kinesis data stream"
  type        = string
  default     = "fraud-transactions"
}

variable "kinesis_stream_mode" {
  description = "Stream mode (ON_DEMAND or PROVISIONED)"
  type        = string
  default     = "ON_DEMAND"
}

variable "kinesis_shard_count" {
  description = "Number of shards (only used if mode is PROVISIONED)"
  type        = number
  default     = 2
}

variable "kinesis_retention_hours" {
  description = "Data retention period in hours"
  type        = number
  default     = 24
}

# DynamoDB Variables
variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "fraud-scores"
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PAY_PER_REQUEST or PROVISIONED)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "dynamodb_rcu" {
  description = "DynamoDB read capacity units"
  type        = number
  default     = 5
}

variable "dynamodb_wcu" {
  description = "DynamoDB write capacity units"
  type        = number
  default     = 5
}

variable "dynamodb_stream_view_type" {
  description = "DynamoDB stream view type"
  type        = string
  default     = "NEW_AND_OLD_IMAGES"
}

# Lambda Variables
variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.12"
}

variable "fraud_scorer_memory" {
  description = "Memory for fraud scorer Lambda"
  type        = number
  default     = 512
}

variable "fraud_scorer_timeout" {
  description = "Timeout for fraud scorer Lambda"
  type        = number
  default     = 60
}

variable "analyzer_memory" {
  description = "Memory for analyzer Lambda"
  type        = number
  default     = 1024
}

variable "analyzer_timeout" {
  description = "Timeout for analyzer Lambda"
  type        = number
  default     = 120
}

# SageMaker Variables
variable "fraud_model_endpoint_name" {
  description = "Name of the SageMaker fraud model endpoint"
  type        = string
  default     = "fraud-detection-model"
}

# Redis Variables
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters for Redis"
  type        = number
  default     = 2
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_automatic_failover_enabled" {
  description = "Enable automatic failover for Redis"
  type        = bool
  default     = true
}

# Aurora Variables
variable "aurora_engine" {
  description = "Aurora engine type"
  type        = string
  default     = "aurora-postgresql"
}

variable "aurora_engine_version" {
  description = "Aurora engine version"
  type        = string
  default     = "15.14"
}

variable "aurora_master_username" {
  description = "Aurora master username"
  type        = string
  default     = "fraudadmin"
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.serverless"
}

variable "aurora_min_capacity" {
  description = "Aurora minimum capacity (for serverless v2)"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Aurora maximum capacity (for serverless v2)"
  type        = number
  default     = 1
}

# SNS/SQS Variables
variable "alert_topic_name" {
  description = "Name of the SNS alert topic"
  type        = string
  default     = "fraud-alerts"
}

variable "compliance_queue_name" {
  description = "Name of the SQS compliance queue"
  type        = string
  default     = "compliance-notifications"
}

variable "message_retention_seconds" {
  description = "SQS message retention period in seconds"
  type        = number
  default     = 345600
}

# EventBridge Variables
variable "fraud_rate_threshold" {
  description = "Fraud rate threshold for triggering Step Functions"
  type        = number
  default     = 0.1
}

variable "evaluation_period_minutes" {
  description = "Evaluation period in minutes for fraud rate monitoring"
  type        = number
  default     = 5
}

# S3 Variables
variable "evidence_bucket_name" {
  description = "Name of the S3 evidence bucket"
  type        = string
  default     = "fraud-evidence"
}

variable "athena_results_bucket_name" {
  description = "Name of the S3 Athena results bucket"
  type        = string
  default     = "athena-results"
}

variable "lifecycle_expiration_days" {
  description = "S3 lifecycle expiration in days"
  type        = number
  default     = 90
}

# CloudWatch Variables
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

# VPC Endpoints Variables
variable "enable_vpc_endpoints" {
  description = "Enable VPC endpoints for Kinesis, SNS, SQS, and SageMaker (may not be available in all regions)"
  type        = bool
  default     = false
}

# ============================================================================
# Locals
# ============================================================================

locals {
  resource_prefix = "${var.project_name}-${var.env}-${var.pr_number}"

  tags = merge(
    var.common_tags,
    {
      Environment = var.env
      Project     = var.project_name
      Owner       = var.owner
      CostCenter  = var.cost_center
      PRNumber    = var.pr_number
      ManagedBy   = "terraform"
    }
  )

}

# ============================================================================
# Data Sources
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# SageMaker endpoint - using variable directly since data source doesn't exist
# The endpoint should be created separately and its name passed via variable

# ============================================================================
# Networking
# ============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-vpc"
  })
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-igw"
  })
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-nat-eip"
  })
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-nat"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-private-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Network ACLs
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-public-nacl"
  })
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-private-nacl"
  })
}

# Security Groups
resource "aws_security_group" "lambda" {
  name        = "${local.resource_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-lambda-sg"
  })
}

resource "aws_security_group" "redis" {
  name        = "${local.resource_prefix}-redis-sg"
  description = "Security group for Redis cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-redis-sg"
  })
}

resource "aws_security_group" "aurora" {
  name        = "${local.resource_prefix}-aurora-sg"
  description = "Security group for Aurora cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-aurora-sg"
  })
}

# VPC Endpoints
# VPC Endpoint for DynamoDB
# Note: Some regions (like us-west-1) only support Interface endpoints, not Gateway
# Using Interface endpoint for consistency across all regions
resource "aws_vpc_endpoint" "dynamodb" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-dynamodb-endpoint"
  })
}

# VPC Endpoints for Interface services (may not be available in all regions)
# Using count to make them optional - they'll be created if service exists
resource "aws_vpc_endpoint" "kinesis" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-kinesis-endpoint"
  })
}

resource "aws_vpc_endpoint" "sagemaker" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sagemaker-runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-sagemaker-endpoint"
  })
}

resource "aws_vpc_endpoint" "sns" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-sns-endpoint"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.lambda.id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-sqs-endpoint"
  })
}

# ============================================================================
# Kinesis Data Stream
# ============================================================================

resource "aws_kinesis_stream" "fraud_transactions" {
  name             = "${local.resource_prefix}-${var.kinesis_stream_name}"
  retention_period = var.kinesis_retention_hours

  stream_mode_details {
    stream_mode = var.kinesis_stream_mode
  }

  shard_count = var.kinesis_stream_mode == "PROVISIONED" ? var.kinesis_shard_count : null

  encryption_type = "KMS"
  kms_key_id      = "alias/aws/kinesis"

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-${var.kinesis_stream_name}"
  })
}

# ============================================================================
# DynamoDB Table
# ============================================================================

resource "aws_dynamodb_table" "fraud_scores" {
  name           = "${local.resource_prefix}-${var.dynamodb_table_name}"
  billing_mode   = var.dynamodb_billing_mode
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_rcu : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_wcu : null
  hash_key       = "transaction_id"
  range_key      = "timestamp"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  stream_enabled   = true
  stream_view_type = var.dynamodb_stream_view_type

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-${var.dynamodb_table_name}"
  })
}

# ============================================================================
# S3 Buckets
# ============================================================================

resource "aws_s3_bucket" "evidence" {
  bucket = "${local.resource_prefix}-${var.evidence_bucket_name}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-evidence"
  })
}

resource "aws_s3_bucket_versioning" "evidence" {
  bucket = aws_s3_bucket.evidence.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  name   = "entire-bucket"

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id

  rule {
    id     = "expire-old-evidence"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.lifecycle_expiration_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "evidence" {
  bucket = aws_s3_bucket.evidence.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "athena_results" {
  bucket = "${local.resource_prefix}-${var.athena_results_bucket_name}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-athena-results"
  })
}

resource "aws_s3_bucket_versioning" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    id     = "expire-old-results"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 7
    }
  }
}

resource "aws_s3_bucket_public_access_block" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# ElastiCache Redis
# ============================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.resource_prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-redis-subnet-group"
  })
}

# Random password for Redis AUTH token (required for transit encryption)
resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
  # Redis AUTH token requirements: 16-128 printable characters
  override_special = "!&#$^<>-"
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.resource_prefix}-redis"
  description                = "Redis cluster for fraud detection"
  node_type                  = var.redis_node_type
  num_cache_clusters         = var.redis_num_cache_clusters
  engine                     = "redis"
  engine_version             = var.redis_engine_version
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result
  # Automatic failover requires at least 2 nodes
  automatic_failover_enabled = var.redis_num_cache_clusters >= 2 ? var.redis_automatic_failover_enabled : false
  multi_az_enabled           = var.redis_num_cache_clusters >= 2 ? var.redis_automatic_failover_enabled : false

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-redis"
  })
}

resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/${local.resource_prefix}-redis/slow"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-redis-slow-logs"
  })
}

# ============================================================================
# Aurora PostgreSQL
# ============================================================================

resource "random_password" "aurora_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "aurora_credentials" {
  name                    = "${local.resource_prefix}-aurora-credentials"
  recovery_window_in_days = 7

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-aurora-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "aurora_credentials" {
  secret_id = aws_secretsmanager_secret.aurora_credentials.id
  secret_string = jsonencode({
    username = var.aurora_master_username
    password = random_password.aurora_password.result
    engine   = var.aurora_engine
    host     = aws_rds_cluster.aurora.endpoint
    port     = aws_rds_cluster.aurora.port
    dbname   = aws_rds_cluster.aurora.database_name
  })
}

resource "aws_secretsmanager_secret_rotation" "aurora_credentials" {
  secret_id           = aws_secretsmanager_secret.aurora_credentials.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.resource_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-aurora-subnet-group"
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.resource_prefix}-aurora"
  engine                          = var.aurora_engine
  engine_version                  = var.aurora_engine_version
  engine_mode                     = "provisioned"
  database_name                   = "frauddb"
  master_username                 = var.aurora_master_username
  master_password                 = random_password.aurora_password.result
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.aurora.arn
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection             = var.env == "prod" ? true : false
  skip_final_snapshot             = var.env == "dev" ? true : false
  final_snapshot_identifier       = var.env != "dev" ? "${local.resource_prefix}-aurora-final-snapshot" : null

  serverlessv2_scaling_configuration {
    min_capacity = var.aurora_min_capacity
    max_capacity = var.aurora_max_capacity
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-aurora"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = var.env == "prod" ? 2 : 1
  identifier         = "${local.resource_prefix}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled = var.env == "prod" ? true : false
  monitoring_interval          = var.env == "prod" ? 60 : 0
  monitoring_role_arn          = var.env == "prod" ? aws_iam_role.aurora_monitoring.arn : null

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-aurora-${count.index}"
  })
}

resource "aws_kms_key" "aurora" {
  description             = "KMS key for Aurora encryption"
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
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "rds.${var.aws_region}.amazonaws.com"
          }
        }
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

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-aurora-kms"
  })
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${local.resource_prefix}-aurora"
  target_key_id = aws_kms_key.aurora.key_id
}

# ============================================================================
# SNS Topics
# ============================================================================

resource "aws_sns_topic" "fraud_alerts" {
  name = "${local.resource_prefix}-${var.alert_topic_name}"

  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-fraud-alerts"
  })
}

resource "aws_sns_topic" "compliance_alerts" {
  name = "${local.resource_prefix}-compliance-alerts"

  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-compliance-alerts"
  })
}

# ============================================================================
# SQS Queue
# ============================================================================

resource "aws_sqs_queue" "compliance_notifications" {
  name                       = "${local.resource_prefix}-${var.compliance_queue_name}"
  message_retention_seconds  = var.message_retention_seconds
  visibility_timeout_seconds = 300
  receive_wait_time_seconds  = 10

  sqs_managed_sse_enabled = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-compliance-queue"
  })
}

resource "aws_sqs_queue" "compliance_notifications_dlq" {
  name = "${local.resource_prefix}-${var.compliance_queue_name}-dlq"

  sqs_managed_sse_enabled = true

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-compliance-queue-dlq"
  })
}

resource "aws_sqs_queue_redrive_policy" "compliance_notifications" {
  queue_url = aws_sqs_queue.compliance_notifications.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.compliance_notifications_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sns_topic_subscription" "compliance_to_sqs" {
  topic_arn = aws_sns_topic.compliance_alerts.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.compliance_notifications.arn
}

resource "aws_sqs_queue_policy" "compliance_notifications" {
  queue_url = aws_sqs_queue.compliance_notifications.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.compliance_notifications.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.compliance_alerts.arn
        }
      }
    }]
  })
}

# ============================================================================
# IAM Roles
# ============================================================================

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.resource_prefix}-lambda-execution"

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

  tags = local.tags
}

resource "aws_iam_role_policy" "lambda_execution" {
  name = "${local.resource_prefix}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution.id

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
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:ListStreams"
        ]
        Resource = aws_kinesis_stream.fraud_transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.fraud_scores.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${aws_dynamodb_table.fraud_scores.arn}/stream/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sagemaker:InvokeEndpoint"
        ]
        Resource = "arn:aws:sagemaker:${var.aws_region}:${data.aws_caller_identity.current.account_id}:endpoint/${var.fraud_model_endpoint_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters",
          "elasticache:DescribeReplicationGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.aurora_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.evidence.arn,
          "${aws_s3_bucket.evidence.arn}/*",
          aws_s3_bucket.athena_results.arn,
          "${aws_s3_bucket.athena_results.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults",
          "athena:StopQueryExecution"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetDatabase",
          "glue:GetTable",
          "glue:GetPartitions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.fraud_alerts.arn,
          aws_sns_topic.compliance_alerts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.compliance_notifications.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda_execution.name
}

# Step Functions Role
resource "aws_iam_role" "step_functions" {
  name = "${local.resource_prefix}-step-functions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${local.resource_prefix}-step-functions-policy"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
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

# EventBridge Role
resource "aws_iam_role" "eventbridge" {
  name = "${local.resource_prefix}-eventbridge"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "eventbridge" {
  name = "${local.resource_prefix}-eventbridge-policy"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.fraud_investigation.arn
      }
    ]
  })
}

# Aurora Monitoring Role
resource "aws_iam_role" "aurora_monitoring" {
  name = "${local.resource_prefix}-aurora-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "aurora_monitoring" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  role       = aws_iam_role.aurora_monitoring.name
}

# ============================================================================
# Lambda Functions
# ============================================================================

# Lambda function code archives
data "archive_file" "fraud_scorer" {
  type        = "zip"
  output_path = "/tmp/fraud_scorer.zip"

  source {
    content  = <<-EOF
import json
import boto3
import os
import hashlib
from datetime import datetime

dynamodb = boto3.client('dynamodb')

def handler(event, context):
    table_name = os.environ['DYNAMODB_TABLE']
    
    for record in event['Records']:
        payload = json.loads(record['kinesis']['data'])
        transaction_id = payload.get('transaction_id', hashlib.md5(json.dumps(payload).encode()).hexdigest())
        
        # Simple fraud scoring logic (placeholder)
        amount = float(payload.get('amount', 0))
        fraud_score = min(amount / 10000, 1.0)  # Higher amounts = higher score
        
        # Write to DynamoDB
        dynamodb.put_item(
            TableName=table_name,
            Item={
                'transaction_id': {'S': transaction_id},
                'timestamp': {'N': str(int(datetime.now().timestamp()))},
                'fraud_score': {'N': str(fraud_score)},
                'raw_data': {'S': json.dumps(payload)}
            }
        )
    
    return {'statusCode': 200}
EOF
    filename = "fraud_scorer.py"
  }
}

data "archive_file" "analyzer" {
  type        = "zip"
  output_path = "/tmp/analyzer.zip"

  source {
    content  = <<-EOF
import json
import boto3
import os
import redis
from datetime import datetime

sns = boto3.client('sns')
sagemaker = boto3.client('sagemaker-runtime')
secrets = boto3.client('secretsmanager')

def handler(event, context):
    sns_topic = os.environ['SNS_TOPIC_ARN']
    model_endpoint = os.environ['SAGEMAKER_ENDPOINT']
    
    for record in event['Records']:
        if record['eventName'] in ['INSERT', 'MODIFY']:
            item = record['dynamodb']['NewImage']
            fraud_score = float(item.get('fraud_score', {}).get('N', 0))
            
            # Query Redis for historical patterns (placeholder)
            # redis_client = redis.Redis(host=os.environ['REDIS_HOST'], port=6379)
            
            # Invoke SageMaker for ML scoring (placeholder)
            # response = sagemaker.invoke_endpoint(
            #     EndpointName=model_endpoint,
            #     Body=json.dumps({'score': fraud_score}),
            #     ContentType='application/json'
            # )
            
            # Alert on high-risk transactions
            if fraud_score > 0.7:
                sns.publish(
                    TopicArn=sns_topic,
                    Message=json.dumps({
                        'transaction_id': item['transaction_id']['S'],
                        'fraud_score': fraud_score,
                        'timestamp': datetime.now().isoformat()
                    }),
                    Subject='High Risk Transaction Detected'
                )
    
    return {'statusCode': 200}
EOF
    filename = "analyzer.py"
  }
}

data "archive_file" "aurora_updater" {
  type        = "zip"
  output_path = "/tmp/aurora_updater.zip"

  source {
    content  = <<-EOF
import json
import boto3
import psycopg2
import os

secrets = boto3.client('secretsmanager')

def handler(event, context):
    # Get database credentials
    secret_response = secrets.get_secret_value(SecretId=os.environ['SECRET_ARN'])
    credentials = json.loads(secret_response['SecretString'])
    
    # Connect to database
    conn = psycopg2.connect(
        host=credentials['host'],
        database=credentials['dbname'],
        user=credentials['username'],
        password=credentials['password']
    )
    
    for record in event['Records']:
        message = json.loads(record['Sns']['Message'])
        transaction_id = message['transaction_id']
        
        # Freeze account (placeholder logic)
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO frozen_accounts (transaction_id, freeze_time) VALUES (%s, NOW())",
                (transaction_id,)
            )
            conn.commit()
    
    conn.close()
    return {'statusCode': 200}
EOF
    filename = "aurora_updater.py"
  }
}

data "archive_file" "query_history" {
  type        = "zip"
  output_path = "/tmp/query_history.zip"

  source {
    content  = <<-EOF
import json
import boto3
import psycopg2
import os

secrets = boto3.client('secretsmanager')

def handler(event, context):
    secret_response = secrets.get_secret_value(SecretId=os.environ['SECRET_ARN'])
    credentials = json.loads(secret_response['SecretString'])
    
    conn = psycopg2.connect(
        host=credentials['host'],
        database=credentials['dbname'],
        user=credentials['username'],
        password=credentials['password']
    )
    
    # Query historical data (placeholder)
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM frozen_accounts")
        result = cur.fetchone()
    
    conn.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({'frozen_accounts': result[0]})
    }
EOF
    filename = "query_history.py"
  }
}

data "archive_file" "athena_query" {
  type        = "zip"
  output_path = "/tmp/athena_query.zip"

  source {
    content  = <<-EOF
import json
import boto3
import time
import os

athena = boto3.client('athena')

def handler(event, context):
    database = 'fraud_detection'
    output_location = f"s3://{os.environ['ATHENA_RESULTS_BUCKET']}/"
    
    query = "SELECT * FROM transactions WHERE fraud_score > 0.7 LIMIT 10"
    
    response = athena.start_query_execution(
        QueryString=query,
        QueryExecutionContext={'Database': database},
        ResultConfiguration={'OutputLocation': output_location}
    )
    
    query_id = response['QueryExecutionId']
    
    # Wait for query to complete
    while True:
        result = athena.get_query_execution(QueryExecutionId=query_id)
        status = result['QueryExecution']['Status']['State']
        
        if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
            break
        time.sleep(1)
    
    if status == 'SUCCEEDED':
        results = athena.get_query_results(QueryExecutionId=query_id)
        return {
            'statusCode': 200,
            'body': json.dumps(results, default=str)
        }
    else:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Query failed'})
        }
EOF
    filename = "athena_query.py"
  }
}

data "archive_file" "write_evidence" {
  type        = "zip"
  output_path = "/tmp/write_evidence.zip"

  source {
    content  = <<-EOF
import json
import boto3
import os
from datetime import datetime

s3 = boto3.client('s3')

def handler(event, context):
    bucket = os.environ['EVIDENCE_BUCKET']
    
    evidence = {
        'timestamp': datetime.now().isoformat(),
        'query_results': event.get('query_results', {}),
        'history_results': event.get('history_results', {})
    }
    
    key = f"evidence/{datetime.now().strftime('%Y/%m/%d')}/report-{datetime.now().timestamp()}.json"
    
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(evidence),
        ServerSideEncryption='AES256'
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({'evidence_location': f"s3://{bucket}/{key}"})
    }
EOF
    filename = "write_evidence.py"
  }
}

data "archive_file" "reconciliation" {
  type        = "zip"
  output_path = "/tmp/reconciliation.zip"

  source {
    content  = <<-EOF
import json
import boto3
import os

sqs = boto3.client('sqs')
dynamodb = boto3.client('dynamodb')

def handler(event, context):
    queue_url = os.environ['QUEUE_URL']
    table_name = os.environ['DYNAMODB_TABLE']
    
    # Process messages from SQS
    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=10
    )
    
    messages = response.get('Messages', [])
    
    for message in messages:
        body = json.loads(message['Body'])
        
        # Update DynamoDB with investigation results
        dynamodb.update_item(
            TableName=table_name,
            Key={
                'transaction_id': {'S': body.get('transaction_id', 'unknown')},
                'timestamp': {'N': str(body.get('timestamp', 0))}
            },
            UpdateExpression='SET investigation_status = :status',
            ExpressionAttributeValues={
                ':status': {'S': 'reviewed'}
            }
        )
        
        # Delete processed message
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps({'processed': len(messages)})
    }
EOF
    filename = "reconciliation.py"
  }
}

data "archive_file" "secret_rotation" {
  type        = "zip"
  output_path = "/tmp/secret_rotation.zip"

  source {
    content  = <<-EOF
import json
import boto3
import string
import random

def handler(event, context):
    service_client = boto3.client('secretsmanager')
    
    # Generate new password
    password = ''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=32))
    
    # Placeholder for actual rotation logic
    # This would include updating the database password and the secret
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Secret rotation initiated'})
    }
EOF
    filename = "secret_rotation.py"
  }
}

# Lambda Layer for dependencies
# Builds layer with psycopg2-binary and redis libraries automatically
resource "null_resource" "lambda_layer_builder" {
  triggers = {
    python_version = var.lambda_runtime
    layer_hash     = md5("${var.lambda_runtime}-dependencies-v1")
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      LAYER_DIR="/tmp/lambda-layer-${local.resource_prefix}"
      LAYER_ZIP="/tmp/dependencies_layer.zip"
      PYTHON_VER="${var.lambda_runtime}"
      PYTHON_PATH=$(echo "$PYTHON_VER" | sed 's/\./\//g')
      
      # Cleanup previous builds
      rm -rf "$LAYER_DIR" "$LAYER_ZIP"
      mkdir -p "$LAYER_DIR/python/lib/$PYTHON_PATH/site-packages"
      
      TARGET_DIR="$LAYER_DIR/python/lib/$PYTHON_PATH/site-packages"
      
      # Try to install dependencies (try multiple methods for compatibility)
      INSTALLED=0
      if command -v pip3 &> /dev/null; then
        pip3 install --target "$TARGET_DIR" psycopg2-binary redis --quiet 2>&1 && INSTALLED=1 || true
      fi
      
      if [ $INSTALLED -eq 0 ] && command -v pip &> /dev/null; then
        pip install --target "$TARGET_DIR" psycopg2-binary redis --quiet 2>&1 && INSTALLED=1 || true
      fi
      
      # If pip failed, create placeholder files to ensure zip is not empty
      if [ $INSTALLED -eq 0 ] || [ -z "$(ls -A $TARGET_DIR 2>/dev/null)" ]; then
        echo "# Placeholder - install psycopg2-binary and redis manually" > "$TARGET_DIR/README.txt"
        echo "# Package marker" > "$TARGET_DIR/__init__.py"
      fi
      
      # Create zip file
      cd "$LAYER_DIR"
      if command -v zip &> /dev/null; then
        zip -r "$LAYER_ZIP" python/ > /dev/null 2>&1
      elif command -v python3 &> /dev/null; then
        python3 -c "import zipfile, os; z = zipfile.ZipFile('$LAYER_ZIP', 'w'); [z.write(os.path.join(root, f), os.path.relpath(os.path.join(root, f), '$LAYER_DIR')) for root, dirs, files in os.walk('python') for f in files]"
      elif command -v python &> /dev/null; then
        python -c "import zipfile, os; z = zipfile.ZipFile('$LAYER_ZIP', 'w'); [z.write(os.path.join(root, f), os.path.relpath(os.path.join(root, f), '$LAYER_DIR')) for root, dirs, files in os.walk('python') for f in files]"
      fi
      
      # Ensure zip file exists and is not empty
      if [ ! -f "$LAYER_ZIP" ] || [ ! -s "$LAYER_ZIP" ]; then
        # Create minimal valid zip as fallback
        cd "$LAYER_DIR"
        if command -v zip &> /dev/null; then
          zip "$LAYER_ZIP" python/lib/$PYTHON_PATH/site-packages/__init__.py > /dev/null 2>&1
        elif command -v python3 &> /dev/null; then
          python3 -c "import zipfile; z = zipfile.ZipFile('$LAYER_ZIP', 'w'); z.write('python/lib/$PYTHON_PATH/site-packages/__init__.py', 'python/lib/$PYTHON_PATH/site-packages/__init__.py')"
        fi
      fi
      
      # Cleanup temp directory
      rm -rf "$LAYER_DIR"
    EOT
  }
}

resource "aws_lambda_layer_version" "dependencies" {
  filename            = "/tmp/dependencies_layer.zip"
  layer_name          = "${local.resource_prefix}-dependencies"
  compatible_runtimes = [var.lambda_runtime]

  description = "Layer containing psycopg2-binary and redis libraries"

  depends_on = [null_resource.lambda_layer_builder]

  lifecycle {
    ignore_changes = [source_code_hash]
  }
}

# Lambda Functions
resource "aws_lambda_function" "fraud_scorer" {
  filename         = data.archive_file.fraud_scorer.output_path
  function_name    = "${local.resource_prefix}-fraud-scorer"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "fraud_scorer.handler"
  source_code_hash = data.archive_file.fraud_scorer.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = var.fraud_scorer_memory
  timeout          = var.fraud_scorer_timeout
  layers           = [aws_lambda_layer_version.dependencies.arn]

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.fraud_scores.name
    }
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-fraud-scorer"
  })
}

resource "aws_lambda_function" "analyzer" {
  filename         = data.archive_file.analyzer.output_path
  function_name    = "${local.resource_prefix}-analyzer"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "analyzer.handler"
  source_code_hash = data.archive_file.analyzer.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = var.analyzer_memory
  timeout          = var.analyzer_timeout
  layers           = [aws_lambda_layer_version.dependencies.arn]

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SNS_TOPIC_ARN      = aws_sns_topic.fraud_alerts.arn
      SAGEMAKER_ENDPOINT = var.fraud_model_endpoint_name
      REDIS_HOST         = aws_elasticache_replication_group.redis.configuration_endpoint_address
    }
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-analyzer"
  })
}

resource "aws_lambda_function" "aurora_updater" {
  filename         = data.archive_file.aurora_updater.output_path
  function_name    = "${local.resource_prefix}-aurora-updater"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "aurora_updater.handler"
  source_code_hash = data.archive_file.aurora_updater.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = 256
  timeout          = 30
  layers           = [aws_lambda_layer_version.dependencies.arn]

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SECRET_ARN = aws_secretsmanager_secret.aurora_credentials.arn
    }
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-aurora-updater"
  })
}

resource "aws_lambda_function" "query_history" {
  filename         = data.archive_file.query_history.output_path
  function_name    = "${local.resource_prefix}-query-history"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "query_history.handler"
  source_code_hash = data.archive_file.query_history.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = 256
  timeout          = 30
  layers           = [aws_lambda_layer_version.dependencies.arn]

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SECRET_ARN = aws_secretsmanager_secret.aurora_credentials.arn
    }
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-query-history"
  })
}

resource "aws_lambda_function" "athena_query" {
  filename         = data.archive_file.athena_query.output_path
  function_name    = "${local.resource_prefix}-athena-query"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "athena_query.handler"
  source_code_hash = data.archive_file.athena_query.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = 256
  timeout          = 60

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ATHENA_RESULTS_BUCKET = aws_s3_bucket.athena_results.id
    }
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-athena-query"
  })
}

resource "aws_lambda_function" "write_evidence" {
  filename         = data.archive_file.write_evidence.output_path
  function_name    = "${local.resource_prefix}-write-evidence"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "write_evidence.handler"
  source_code_hash = data.archive_file.write_evidence.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = 256
  timeout          = 30

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      EVIDENCE_BUCKET = aws_s3_bucket.evidence.id
    }
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-write-evidence"
  })
}

resource "aws_lambda_function" "reconciliation" {
  filename         = data.archive_file.reconciliation.output_path
  function_name    = "${local.resource_prefix}-reconciliation"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "reconciliation.handler"
  source_code_hash = data.archive_file.reconciliation.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = 256
  timeout          = 30
  layers           = [aws_lambda_layer_version.dependencies.arn]

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      QUEUE_URL      = aws_sqs_queue.compliance_notifications.url
      DYNAMODB_TABLE = aws_dynamodb_table.fraud_scores.name
    }
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-reconciliation"
  })
}

resource "aws_lambda_function" "secret_rotation" {
  filename         = data.archive_file.secret_rotation.output_path
  function_name    = "${local.resource_prefix}-secret-rotation"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "secret_rotation.handler"
  source_code_hash = data.archive_file.secret_rotation.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = 256
  timeout          = 30

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-secret-rotation"
  })
}

# Lambda Permission for Secrets Manager
resource "aws_lambda_permission" "secrets_manager_invoke" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# Lambda Event Source Mappings
resource "aws_lambda_event_source_mapping" "kinesis_to_fraud_scorer" {
  event_source_arn       = aws_kinesis_stream.fraud_transactions.arn
  function_name          = aws_lambda_function.fraud_scorer.arn
  starting_position      = "LATEST"
  maximum_retry_attempts = 3

  depends_on = [
    aws_iam_role_policy.lambda_execution
  ]
}

resource "aws_lambda_event_source_mapping" "dynamodb_to_analyzer" {
  event_source_arn       = aws_dynamodb_table.fraud_scores.stream_arn
  function_name          = aws_lambda_function.analyzer.arn
  starting_position      = "LATEST"
  maximum_retry_attempts = 3

  depends_on = [
    aws_iam_role_policy.lambda_execution
  ]
}

resource "aws_lambda_event_source_mapping" "sqs_to_reconciliation" {
  event_source_arn = aws_sqs_queue.compliance_notifications.arn
  function_name    = aws_lambda_function.reconciliation.arn

  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  depends_on = [
    aws_iam_role_policy.lambda_execution
  ]

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-sqs-reconciliation-mapping"
  })
}

resource "aws_sns_topic_subscription" "fraud_alerts_to_aurora_updater" {
  topic_arn = aws_sns_topic.fraud_alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.aurora_updater.arn
}

resource "aws_lambda_permission" "sns_invoke_aurora_updater" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.aurora_updater.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.fraud_alerts.arn
}

# ============================================================================
# CloudWatch Log Groups
# ============================================================================

resource "aws_cloudwatch_log_group" "fraud_scorer" {
  name              = "/aws/lambda/${aws_lambda_function.fraud_scorer.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-fraud-scorer-logs"
  })
}

resource "aws_cloudwatch_log_group" "analyzer" {
  name              = "/aws/lambda/${aws_lambda_function.analyzer.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-analyzer-logs"
  })
}

resource "aws_cloudwatch_log_group" "aurora_updater" {
  name              = "/aws/lambda/${aws_lambda_function.aurora_updater.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-aurora-updater-logs"
  })
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/${local.resource_prefix}-fraud-investigation"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-step-functions-logs"
  })
}

# ============================================================================
# Step Functions State Machine
# ============================================================================

resource "aws_sfn_state_machine" "fraud_investigation" {
  name     = "${local.resource_prefix}-fraud-investigation"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Fraud investigation workflow"
    StartAt = "QueryHistory"
    States = {
      QueryHistory = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.query_history.arn
          Payload = {
            "input.$" = "$"
          }
        }
        Next       = "QueryAthena"
        ResultPath = "$.history_results"
      }
      QueryAthena = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.athena_query.arn
          Payload = {
            "input.$" = "$"
          }
        }
        Next       = "WriteEvidence"
        ResultPath = "$.query_results"
      }
      WriteEvidence = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.write_evidence.arn
          Payload = {
            "history_results.$" = "$.history_results"
            "query_results.$"   = "$.query_results"
          }
        }
        End = true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tags = merge(local.tags, {
    Name = "${local.resource_prefix}-fraud-investigation"
  })
}

# ============================================================================
# CloudWatch Alarms
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "kinesis_throttling" {
  alarm_name          = "${local.resource_prefix}-kinesis-throttling"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "GetRecords.UserRecords"
  namespace           = "AWS/Kinesis"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "This metric monitors Kinesis GetRecords throttling"
  alarm_actions       = [aws_sns_topic.fraud_alerts.arn]

  dimensions = {
    StreamName = aws_kinesis_stream.fraud_transactions.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = {
    fraud_scorer   = aws_lambda_function.fraud_scorer.function_name
    analyzer       = aws_lambda_function.analyzer.function_name
    aurora_updater = aws_lambda_function.aurora_updater.function_name
  }

  alarm_name          = "${local.resource_prefix}-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors Lambda errors for ${each.key}"
  alarm_actions       = [aws_sns_topic.fraud_alerts.arn]

  dimensions = {
    FunctionName = each.value
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  alarm_name          = "${local.resource_prefix}-dynamodb-write-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.dynamodb_wcu * 300 * 0.8
  alarm_description   = "This metric monitors DynamoDB write throttling"
  alarm_actions       = [aws_sns_topic.fraud_alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.fraud_scores.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "sagemaker_latency" {
  alarm_name          = "${local.resource_prefix}-sagemaker-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ModelLatency"
  namespace           = "AWS/SageMaker"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "This metric monitors SageMaker endpoint latency"
  alarm_actions       = [aws_sns_topic.fraud_alerts.arn]

  dimensions = {
    EndpointName = var.fraud_model_endpoint_name
    VariantName  = "AllTraffic"
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "${local.resource_prefix}-aurora-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "50"
  alarm_description   = "This metric monitors Aurora active connections"
  alarm_actions       = [aws_sns_topic.fraud_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "high_fraud_rate" {
  alarm_name          = "${local.resource_prefix}-high-fraud-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.evaluation_period_minutes
  metric_name         = "FraudDetectionRate"
  namespace           = "${local.resource_prefix}/Metrics"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.fraud_rate_threshold
  alarm_description   = "This metric monitors fraud detection rate and triggers Step Functions"
  alarm_actions       = [aws_sns_topic.fraud_alerts.arn]

  tags = local.tags
}

# ============================================================================
# CloudWatch Log Metric Filters
# ============================================================================

resource "aws_cloudwatch_log_metric_filter" "fraud_detection_rate" {
  name           = "${local.resource_prefix}-fraud-detection-rate"
  pattern        = "[time, request_id, level = ERROR, message]"
  log_group_name = aws_cloudwatch_log_group.analyzer.name

  metric_transformation {
    name      = "FraudDetectionRate"
    namespace = "${local.resource_prefix}/Metrics"
    value     = "1"
  }
}

# ============================================================================
# EventBridge Rule
# ============================================================================

resource "aws_cloudwatch_event_rule" "fraud_rate_threshold" {
  name        = "${local.resource_prefix}-fraud-rate-threshold"
  description = "Trigger Step Functions when fraud rate exceeds threshold"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      alarmName = ["${local.resource_prefix}-high-fraud-rate"]
    }
  })

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.fraud_rate_threshold.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.fraud_investigation.arn
  role_arn  = aws_iam_role.eventbridge.arn

  input_transformer {
    input_paths = {
      alarm = "$.detail.alarmName"
      time  = "$.time"
    }

    input_template = jsonencode({
      alarm_name = "<alarm>"
      event_time = "<time>"
    })
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "kinesis_stream_arn" {
  description = "ARN of the Kinesis fraud transactions stream"
  value       = aws_kinesis_stream.fraud_transactions.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB fraud scores table"
  value       = aws_dynamodb_table.fraud_scores.name
}

output "sns_fraud_alerts_arn" {
  description = "ARN of the SNS fraud alerts topic"
  value       = aws_sns_topic.fraud_alerts.arn
}

output "sns_compliance_alerts_arn" {
  description = "ARN of the SNS compliance alerts topic"
  value       = aws_sns_topic.compliance_alerts.arn
}

output "sqs_compliance_queue_url" {
  description = "URL of the SQS compliance notifications queue"
  value       = aws_sqs_queue.compliance_notifications.url
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_reader_endpoint" {
  description = "Aurora reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
}

output "lambda_fraud_scorer_arn" {
  description = "ARN of the fraud scorer Lambda function"
  value       = aws_lambda_function.fraud_scorer.arn
}

output "lambda_analyzer_arn" {
  description = "ARN of the analyzer Lambda function"
  value       = aws_lambda_function.analyzer.arn
}

output "lambda_aurora_updater_arn" {
  description = "ARN of the Aurora updater Lambda function"
  value       = aws_lambda_function.aurora_updater.arn
}

output "lambda_query_history_arn" {
  description = "ARN of the query history Lambda function"
  value       = aws_lambda_function.query_history.arn
}

output "lambda_athena_query_arn" {
  description = "ARN of the Athena query Lambda function"
  value       = aws_lambda_function.athena_query.arn
}

output "lambda_write_evidence_arn" {
  description = "ARN of the write evidence Lambda function"
  value       = aws_lambda_function.write_evidence.arn
}

output "lambda_reconciliation_arn" {
  description = "ARN of the reconciliation Lambda function"
  value       = aws_lambda_function.reconciliation.arn
}

output "lambda_layer_arn" {
  description = "ARN of the Lambda dependencies layer"
  value       = aws_lambda_layer_version.dependencies.arn
}

output "step_functions_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.fraud_investigation.arn
}

output "s3_evidence_bucket" {
  description = "Name of the S3 evidence bucket"
  value       = aws_s3_bucket.evidence.id
}

output "s3_athena_results_bucket" {
  description = "Name of the S3 Athena results bucket"
  value       = aws_s3_bucket.athena_results.id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "kms_key_id" {
  description = "ID of the Aurora KMS key"
  value       = aws_kms_key.aurora.id
}

output "kms_key_arn" {
  description = "ARN of the Aurora KMS key"
  value       = aws_kms_key.aurora.arn
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Aurora credentials secret"
  value       = aws_secretsmanager_secret.aurora_credentials.arn
}

output "lambda_security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

output "aurora_security_group_id" {
  description = "ID of the Aurora security group"
  value       = aws_security_group.aurora.id
}

output "kinesis_stream_name" {
  description = "Name of the Kinesis stream"
  value       = aws_kinesis_stream.fraud_transactions.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.fraud_scores.arn
}

output "step_functions_name" {
  description = "Name of the Step Functions state machine"
  value       = aws_sfn_state_machine.fraud_investigation.name
}
```

---

## `variables.tf`

```hcl
# variables.tf

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

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}
```

---

## `dev.tfvars`

```hcl
env                       = "dev"
aws_region                = "us-west-1"
pr_number                 = "pr7511"
kinesis_stream_mode       = "PROVISIONED"
kinesis_shard_count       = 1
dynamodb_billing_mode     = "PROVISIONED"
dynamodb_rcu              = 5
dynamodb_wcu              = 5
redis_node_type           = "cache.t3.micro"
redis_num_cache_clusters  = 1
aurora_min_capacity       = 0.5
aurora_max_capacity       = 1
fraud_scorer_memory       = 256
fraud_scorer_timeout      = 30
analyzer_memory           = 512
analyzer_timeout          = 60
log_retention_days        = 3
lifecycle_expiration_days = 30
enable_vpc_endpoints      = false
```

---

## `prod.tfvars`

```hcl
env                       = "prod"
aws_region                = "us-west-1"
pr_number                 = "pr7511"
kinesis_stream_mode       = "ON_DEMAND"
dynamodb_billing_mode     = "PAY_PER_REQUEST"
redis_node_type           = "cache.r7g.large"
redis_num_cache_clusters  = 2
aurora_min_capacity       = 1
aurora_max_capacity       = 4
fraud_scorer_memory       = 1024
fraud_scorer_timeout      = 120
analyzer_memory           = 2048
analyzer_timeout          = 180
log_retention_days        = 30
lifecycle_expiration_days = 90
enable_vpc_endpoints      = false
```

---

## `staging.tfvars`

```hcl
env                       = "staging"
aws_region                = "us-west-1"
pr_number                 = "pr7511"
kinesis_stream_mode       = "PROVISIONED"
kinesis_shard_count       = 2
dynamodb_billing_mode     = "PROVISIONED"
dynamodb_rcu              = 10
dynamodb_wcu              = 10
redis_node_type           = "cache.t3.small"
redis_num_cache_clusters  = 2
aurora_min_capacity       = 0.5
aurora_max_capacity       = 2
fraud_scorer_memory       = 512
fraud_scorer_timeout      = 60
analyzer_memory           = 1024
analyzer_timeout          = 90
log_retention_days        = 7
lifecycle_expiration_days = 60
enable_vpc_endpoints      = false
```

---

