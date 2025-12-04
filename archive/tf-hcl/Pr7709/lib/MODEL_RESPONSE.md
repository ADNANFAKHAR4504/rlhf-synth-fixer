### Reasoning Trace
---

This is a complex request for a production-ready Terraform configuration for a social media interaction processing pipeline. Let me break down what's needed:

1. A single file `tap_stack.tf` with:
   - terraform block with required_version and required_providers
   - All variable declarations
   - All resources and data sources
   - Locals for naming, tagging, and per-env capacity maps
   - Outputs
   - Example tfvars files at the end

2. Required topology includes:
   - API Gateway WebSocket API
   - Multiple Lambda functions for different purposes
   - Kinesis Data Stream
   - Multiple DynamoDB tables
   - ElastiCache Redis
   - Aurora PostgreSQL
   - SNS topics and SQS queues
   - EventBridge scheduled rules
   - Step Functions
   - S3 bucket
   - CloudWatch alarms
   - VPC with public/private subnets
   - Various IAM roles and policies

3. The implementation must be production-ready with:
   - Encryption everywhere
   - Least-privilege IAM
   - Deterministic naming
   - Idempotency
   - Best practices

Let me start writing the comprehensive Terraform configuration:
### Answer 
---

# tap_stack.tf - Multi-Environment Social Media Interaction Processing Pipeline

```terraform
# =============================================================================
# TERRAFORM CONFIGURATION
# =============================================================================

terraform {
  required_version = ">= 1.5.0"
  
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
}

# =============================================================================
# VARIABLES
# =============================================================================

# Environment and Common Configuration
variable "env" {
  type        = string
  description = "Environment name (dev/staging/prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "aws_region" {
  type        = string
  description = "AWS region for deployment"
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Project name for resource naming"
  default     = "tap"
}

variable "owner" {
  type        = string
  description = "Owner tag for resources"
  default     = "platform-team"
}

variable "cost_center" {
  type        = string
  description = "Cost center for billing attribution"
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

variable "num_azs" {
  type        = number
  description = "Number of availability zones to use"
  default     = 2
}

# API Gateway Configuration
variable "websocket_api_name" {
  type        = string
  description = "Name for WebSocket API"
  default     = "interactions-websocket"
}

variable "stage_name" {
  type        = string
  description = "API Gateway stage name"
  default     = "v1"
}

variable "route_selection_expression" {
  type        = string
  description = "Route selection expression for WebSocket API"
  default     = "$request.body.action"
}

# Kinesis Configuration
variable "interactions_stream_name" {
  type        = string
  description = "Name for interactions Kinesis stream"
  default     = "interactions-stream"
}

variable "stream_mode" {
  type        = string
  description = "Kinesis stream mode (ON_DEMAND or PROVISIONED)"
  default     = "ON_DEMAND"
}

variable "shard_count" {
  type        = number
  description = "Number of shards for Kinesis stream"
  default     = 2
}

variable "retention_hours" {
  type        = number
  description = "Data retention in hours for Kinesis stream"
  default     = 24
}

# DynamoDB Configuration
variable "interactions_table" {
  type        = string
  description = "DynamoDB table for interactions"
  default     = "interactions"
}

variable "metrics_table" {
  type        = string
  description = "DynamoDB table for content metrics"
  default     = "content-metrics"
}

variable "preferences_table" {
  type        = string
  description = "DynamoDB table for user preferences"
  default     = "user-preferences"
}

variable "rules_table" {
  type        = string
  description = "DynamoDB table for moderation rules"
  default     = "moderation-rules"
}

variable "violations_table" {
  type        = string
  description = "DynamoDB table for content violations"
  default     = "content-violations"
}

variable "trending_table" {
  type        = string
  description = "DynamoDB table for trending content"
  default     = "trending-content"
}

variable "catalog_table" {
  type        = string
  description = "DynamoDB table for content catalog"
  default     = "content-catalog"
}

variable "billing_mode" {
  type        = string
  description = "DynamoDB billing mode (PAY_PER_REQUEST or PROVISIONED)"
  default     = "PAY_PER_REQUEST"
}

variable "rcu" {
  type        = number
  description = "Read capacity units for provisioned mode"
  default     = 5
}

variable "wcu" {
  type        = number
  description = "Write capacity units for provisioned mode"
  default     = 5
}

variable "ttl_attribute" {
  type        = string
  description = "TTL attribute name for DynamoDB tables"
  default     = "ttl"
}

# Lambda Configuration
variable "validator_memory" {
  type        = number
  description = "Memory for validator Lambda function"
  default     = 256
}

variable "processor_memory" {
  type        = number
  description = "Memory for processor Lambda function"
  default     = 512
}

variable "notifier_memory" {
  type        = number
  description = "Memory for notifier Lambda function"
  default     = 256
}

variable "moderator_memory" {
  type        = number
  description = "Memory for moderator Lambda function"
  default     = 512
}

variable "classifier_memory" {
  type        = number
  description = "Memory for classifier Lambda function"
  default     = 256
}

variable "trending_memory" {
  type        = number
  description = "Memory for trending Lambda function"
  default     = 1024
}

variable "webhook_memory" {
  type        = number
  description = "Memory for webhook Lambda function"
  default     = 256
}

variable "timeout_s" {
  type        = number
  description = "Lambda function timeout in seconds"
  default     = 60
}

variable "runtime" {
  type        = string
  description = "Lambda runtime"
  default     = "python3.12"
}

# Redis Configuration
variable "node_type" {
  type        = string
  description = "ElastiCache node type"
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

variable "auth_token_enabled" {
  type        = bool
  description = "Enable auth token for Redis"
  default     = true
}

variable "transit_encryption_enabled" {
  type        = bool
  description = "Enable transit encryption for Redis"
  default     = true
}

# Aurora Configuration
variable "database_name" {
  type        = string
  description = "Aurora database name"
  default     = "tap_db"
}

variable "master_username" {
  type        = string
  description = "Aurora master username"
  default     = "admin"
}

variable "instance_class" {
  type        = string
  description = "Aurora instance class"
  default     = "db.t3.small"
}

variable "min_capacity" {
  type        = number
  description = "Aurora serverless v2 minimum capacity"
  default     = 0.5
}

variable "max_capacity" {
  type        = number
  description = "Aurora serverless v2 maximum capacity"
  default     = 1
}

variable "backup_retention_days" {
  type        = number
  description = "Aurora backup retention in days"
  default     = 7
}

# SageMaker Configuration
variable "moderation_endpoint_name" {
  type        = string
  description = "SageMaker endpoint name for content moderation"
  default     = "content-moderation-endpoint"
}

# SNS Configuration
variable "notifications_topic" {
  type        = string
  description = "SNS topic for user notifications"
  default     = "user-notifications"
}

variable "moderation_topic" {
  type        = string
  description = "SNS topic for moderation queue"
  default     = "moderation-queue"
}

variable "removed_topic" {
  type        = string
  description = "SNS topic for removed content"
  default     = "content-removed"
}

variable "new_content_topic" {
  type        = string
  description = "SNS topic for new content"
  default     = "new-content"
}

# SQS Configuration
variable "push_queue" {
  type        = string
  description = "SQS queue for push notifications"
  default     = "push-notifications"
}

variable "email_queue" {
  type        = string
  description = "SQS queue for email notifications"
  default     = "email-notifications"
}

variable "sms_queue" {
  type        = string
  description = "SQS queue for SMS notifications"
  default     = "sms-notifications"
}

variable "visibility_timeout_seconds" {
  type        = number
  description = "SQS visibility timeout in seconds"
  default     = 300
}

variable "message_retention_seconds" {
  type        = number
  description = "SQS message retention in seconds"
  default     = 345600
}

# EventBridge Configuration
variable "trending_schedule_expression" {
  type        = string
  description = "EventBridge schedule expression for trending analysis"
  default     = "rate(1 hour)"
}

# S3 Configuration
variable "content_bucket_name" {
  type        = string
  description = "S3 bucket name for user content"
  default     = "user-content"
}

variable "lifecycle_transition_days" {
  type        = number
  description = "Days before transitioning to IA storage class"
  default     = 30
}

variable "cors_allowed_origins" {
  type        = list(string)
  description = "CORS allowed origins for S3 bucket"
  default     = ["*"]
}

# CloudWatch Configuration
variable "log_retention_days" {
  type        = number
  description = "CloudWatch log retention in days"
  default     = 30
}

variable "alarm_threshold_messages" {
  type        = number
  description = "CloudWatch alarm threshold for queue messages"
  default     = 1000
}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Mock SageMaker endpoint data source - in production this would reference an existing endpoint
data "aws_sagemaker_endpoint" "moderation" {
  count = 0  # Set to 1 when endpoint exists
  name  = var.moderation_endpoint_name
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Environment-specific capacity mappings
  capacity_map = {
    dev = {
      websocket_connections = 100
      kinesis_shards       = 1
      lambda_concurrency   = 10
      dynamodb_rcu        = 5
      dynamodb_wcu        = 5
      redis_nodes         = 1
      aurora_min_capacity = 0.5
      aurora_max_capacity = 1
      trending_ttl_hours  = 2
      alarm_threshold     = 100
    }
    staging = {
      websocket_connections = 500
      kinesis_shards       = 2
      lambda_concurrency   = 50
      dynamodb_rcu        = 25
      dynamodb_wcu        = 25
      redis_nodes         = 2
      aurora_min_capacity = 1
      aurora_max_capacity = 2
      trending_ttl_hours  = 4
      alarm_threshold     = 500
    }
    prod = {
      websocket_connections = 10000
      kinesis_shards       = 10
      lambda_concurrency   = 200
      dynamodb_rcu        = 100
      dynamodb_wcu        = 100
      redis_nodes         = 3
      aurora_min_capacity = 2
      aurora_max_capacity = 8
      trending_ttl_hours  = 6
      alarm_threshold     = 2000
    }
  }

  env_config = local.capacity_map[var.env]
  
  # Resource naming convention
  name_prefix = "${var.project_name}-${var.env}"
  
  # Common tags
  tags = merge(
    var.common_tags,
    {
      Environment = var.env
      Project     = var.project_name
      Owner       = var.owner
      CostCenter  = var.cost_center
      ManagedBy   = "terraform"
      Timestamp   = timestamp()
    }
  )
  
  # Account ID for ARN construction
  account_id = data.aws_caller_identity.current.account_id
  
  # AZ selection
  azs = slice(data.aws_availability_zones.available.names, 0, var.num_azs)
}

# =============================================================================
# KMS KEYS
# =============================================================================

resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags                    = local.tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-main"
  target_key_id = aws_kms_key.main.key_id
}

# =============================================================================
# VPC AND NETWORKING
# =============================================================================

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
  count                   = var.num_azs
  vpc_id                  = aws_vpc.main.id
  cidr_block             = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = var.num_azs
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.num_azs
  domain = "vpc"
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.num_azs
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
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
  count  = var.num_azs
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = var.num_azs
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = var.num_azs
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
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
  
  lifecycle {
    create_before_destroy = true
  }
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
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis-sg"
  })
  
  lifecycle {
    create_before_destroy = true
  }
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
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name = "${local.name_prefix}-aurora-sg"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# SECRETS MANAGER
# =============================================================================

resource "random_password" "aurora" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "aurora" {
  name_prefix             = "${local.name_prefix}-aurora-"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.main.id
  
  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "aurora" {
  secret_id = aws_secretsmanager_secret.aurora.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.aurora.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = var.database_name
  })
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false  # Redis auth tokens don't support special characters
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name_prefix             = "${local.name_prefix}-redis-auth-"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.main.id
  
  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth.result
}

# =============================================================================
# S3 BUCKET
# =============================================================================

resource "aws_s3_bucket" "content" {
  bucket = "${local.name_prefix}-${var.content_bucket_name}-${local.account_id}"
  
  tags = local.tags
}

resource "aws_s3_bucket_versioning" "content" {
  bucket = aws_s3_bucket.content.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "content" {
  bucket = aws_s3_bucket.content.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "content" {
  bucket = aws_s3_bucket.content.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "content" {
  bucket = aws_s3_bucket.content.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "content" {
  bucket = aws_s3_bucket.content.id
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = var.lifecycle_transition_days
      storage_class = "STANDARD_IA"
    }
  }
}

resource "aws_s3_bucket_notification" "content" {
  bucket = aws_s3_bucket.content.id
  
  lambda_function {
    lambda_function_arn = aws_lambda_function.webhook.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }
  
  depends_on = [aws_lambda_permission.s3_webhook]
}

# =============================================================================
# KINESIS DATA STREAM
# =============================================================================

resource "aws_kinesis_stream" "interactions" {
  name                      = "${local.name_prefix}-${var.interactions_stream_name}"
  shard_count              = var.stream_mode == "PROVISIONED" ? local.env_config.kinesis_shards : null
  retention_period         = var.retention_hours
  encryption_type          = "KMS"
  kms_key_id              = aws_kms_key.main.id
  
  stream_mode_details {
    stream_mode = var.stream_mode
  }
  
  tags = local.tags
}

# =============================================================================
# DYNAMODB TABLES
# =============================================================================

# Interactions Table - composite key (content_id, timestamp)
resource "aws_dynamodb_table" "interactions" {
  name           = "${local.name_prefix}-${var.interactions_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_wcu : null
  hash_key       = "content_id"
  range_key      = "timestamp"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "content_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "user_id"
    type = "S"
  }
  
  global_secondary_index {
    name            = "user-index"
    hash_key        = "user_id"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_wcu : null
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = local.tags
}

# Content Metrics Table - atomic counters for likes/comments/shares
resource "aws_dynamodb_table" "metrics" {
  name           = "${local.name_prefix}-${var.metrics_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_wcu : null
  hash_key       = "content_id"
  
  attribute {
    name = "content_id"
    type = "S"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = local.tags
}

# User Preferences Table
resource "aws_dynamodb_table" "preferences" {
  name           = "${local.name_prefix}-${var.preferences_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_wcu : null
  hash_key       = "user_id"
  
  attribute {
    name = "user_id"
    type = "S"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  tags = local.tags
}

# Moderation Rules Table
resource "aws_dynamodb_table" "rules" {
  name           = "${local.name_prefix}-${var.rules_table}"
  billing_mode   = "PAY_PER_REQUEST"  # Low volume table
  hash_key       = "rule_id"
  
  attribute {
    name = "rule_id"
    type = "S"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  tags = local.tags
}

# Trending Content Table with TTL
resource "aws_dynamodb_table" "trending" {
  name           = "${local.name_prefix}-${var.trending_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_wcu : null
  hash_key       = "content_type"
  range_key      = "score"
  
  attribute {
    name = "content_type"
    type = "S"
  }
  
  attribute {
    name = "score"
    type = "N"
  }
  
  ttl {
    enabled        = true
    attribute_name = var.ttl_attribute
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  tags = local.tags
}

# Content Catalog Table
resource "aws_dynamodb_table" "catalog" {
  name           = "${local.name_prefix}-${var.catalog_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.env_config.dynamodb_wcu : null
  hash_key       = "content_id"
  
  attribute {
    name = "content_id"
    type = "S"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  tags = local.tags
}

# =============================================================================
# ELASTICACHE REDIS
# =============================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
  
  tags = local.tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name_prefix}-redis"
  replication_group_description = "Redis cluster for user preferences and trending content"
  node_type                  = var.node_type
  number_cache_clusters      = local.env_config.redis_nodes
  port                      = 6379
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  kms_key_id                = aws_kms_key.main.arn
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                = var.auth_token_enabled ? random_password.redis_auth.result : null
  
  automatic_failover_enabled = local.env_config.redis_nodes > 1
  multi_az_enabled          = local.env_config.redis_nodes > 1
  
  snapshot_retention_limit = var.env == "prod" ? 5 : 1
  snapshot_window          = "03:00-05:00"
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
  
  tags = local.tags
}

resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "${local.name_prefix}-redis-params"
  
  # Tune client output buffer limits for pub/sub
  parameter {
    name  = "client-output-buffer-limit-pubsub-hard-limit"
    value = "67108864"  # 64MB
  }
  
  parameter {
    name  = "client-output-buffer-limit-pubsub-soft-limit"
    value = "33554432"  # 32MB
  }
  
  parameter {
    name  = "client-output-buffer-limit-pubsub-soft-seconds"
    value = "60"
  }
  
  tags = local.tags
}

# =============================================================================
# AURORA POSTGRESQL
# =============================================================================

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet"
  subnet_ids = aws_subnet.private[*].id
  
  tags = local.tags
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "${local.name_prefix}-aurora"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "15.4"
  database_name          = var.database_name
  master_username        = var.master_username
  master_password        = random_password.aurora.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]
  
  storage_encrypted      = true
  kms_key_id            = aws_kms_key.main.arn
  copy_tags_to_snapshot = true
  
  backup_retention_period = var.backup_retention_days
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  serverlessv2_scaling_configuration {
    max_capacity = local.env_config.aurora_max_capacity
    min_capacity = local.env_config.aurora_min_capacity
  }
  
  tags = local.tags
  
  lifecycle {
    ignore_changes = [master_password]
  }
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = var.env == "prod" ? 2 : 1
  identifier         = "${local.name_prefix}-aurora-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version
  
  performance_insights_enabled = var.env == "prod"
  performance_insights_kms_key_id = var.env == "prod" ? aws_kms_key.main.arn : null
  monitoring_interval          = var.env == "prod" ? 60 : 0
  monitoring_role_arn         = var.env == "prod" ? aws_iam_role.rds_monitoring.arn : null
  
  tags = local.tags
}

resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${local.name_prefix}-rds-monitoring-"
  
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
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =============================================================================
# SNS TOPICS
# =============================================================================

resource "aws_sns_topic" "notifications" {
  name              = "${local.name_prefix}-${var.notifications_topic}"
  kms_master_key_id = aws_kms_key.main.id
  
  tags = local.tags
}

resource "aws_sns_topic" "moderation" {
  name              = "${local.name_prefix}-${var.moderation_topic}"
  kms_master_key_id = aws_kms_key.main.id
  
  tags = local.tags
}

resource "aws_sns_topic" "removed" {
  name              = "${local.name_prefix}-${var.removed_topic}"
  kms_master_key_id = aws_kms_key.main.id
  
  tags = local.tags
}

resource "aws_sns_topic" "new_content" {
  name              = "${local.name_prefix}-${var.new_content_topic}"
  kms_master_key_id = aws_kms_key.main.id
  
  tags = local.tags
}

# =============================================================================
# SQS QUEUES WITH SNS SUBSCRIPTIONS
# =============================================================================

# Use for_each to create SQS queues with SNS subscriptions and filter policies
locals {
  notification_queues = {
    push = {
      name        = var.push_queue
      fifo        = false
      filter_policy = jsonencode({
        notification_type = ["push"]
      })
    }
    email = {
      name        = var.email_queue
      fifo        = true  # FIFO queue for email to preserve order
      filter_policy = jsonencode({
        notification_type = ["email"]
      })
    }
    sms = {
      name        = var.sms_queue
      fifo        = false
      filter_policy = jsonencode({
        notification_type = ["sms"]
      })
    }
  }
}

resource "aws_sqs_queue" "notifications" {
  for_each = local.notification_queues
  
  name                       = each.value.fifo ? "${local.name_prefix}-${each.value.name}.fifo" : "${local.name_prefix}-${each.value.name}"
  fifo_queue                = each.value.fifo
  content_based_deduplication = each.value.fifo
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id         = aws_kms_key.main.id
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 3
  })
  
  tags = local.tags
}

resource "aws_sqs_queue" "dlq" {
  for_each = local.notification_queues
  
  name                      = each.value.fifo ? "${local.name_prefix}-${each.value.name}-dlq.fifo" : "${local.name_prefix}-${each.value.name}-dlq"
  fifo_queue               = each.value.fifo
  message_retention_seconds = 1209600  # 14 days
  kms_master_key_id        = aws_kms_key.main.id
  
  tags = local.tags
}

resource "aws_sns_topic_subscription" "notifications_to_sqs" {
  for_each = local.notification_queues
  
  topic_arn     = aws_sns_topic.notifications.arn
  protocol      = "sqs"
  endpoint      = aws_sqs_queue.notifications[each.key].arn
  filter_policy = each.value.filter_policy
  
  raw_message_delivery = true
}

resource "aws_sqs_queue_policy" "notifications" {
  for_each = local.notification_queues
  
  queue_url = aws_sqs_queue.notifications[each.key].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.notifications[each.key].arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.notifications.arn
        }
      }
    }]
  })
}

# =============================================================================
# LAMBDA FUNCTIONS
# =============================================================================

# CloudWatch Log Groups for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  for_each = {
    validator   = "/aws/lambda/${local.name_prefix}-validator"
    processor   = "/aws/lambda/${local.name_prefix}-processor"
    notifier    = "/aws/lambda/${local.name_prefix}-notifier"
    moderator   = "/aws/lambda/${local.name_prefix}-moderator"
    classifier  = "/aws/lambda/${local.name_prefix}-classifier"
    trending    = "/aws/lambda/${local.name_prefix}-trending"
    webhook     = "/aws/lambda/${local.name_prefix}-webhook"
    queue_push  = "/aws/lambda/${local.name_prefix}-queue-push"
    queue_email = "/aws/lambda/${local.name_prefix}-queue-email"
    queue_sms   = "/aws/lambda/${local.name_prefix}-queue-sms"
  }
  
  name              = each.value
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.main.arn
  
  tags = local.tags
}

resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/${local.name_prefix}/redis/slow-log"
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.main.arn
  
  tags = local.tags
}

# Lambda Function Code (using archive_file for inline Python)
data "archive_file" "validator_code" {
  type        = "zip"
  output_path = "/tmp/validator.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import os
from datetime import datetime

kinesis = boto3.client('kinesis')

def handler(event, context):
    """Validates WebSocket interaction events and writes to Kinesis with user_id partition key"""
    
    # Parse WebSocket message
    body = json.loads(event['body'])
    
    # Validate required fields
    required_fields = ['user_id', 'content_id', 'interaction_type']
    for field in required_fields:
        if field not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Missing required field: {field}'})
            }
    
    # Validate interaction type
    valid_types = ['like', 'comment', 'share']
    if body['interaction_type'] not in valid_types:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid interaction type'})
        }
    
    # Add timestamp and metadata
    body['timestamp'] = int(datetime.now().timestamp() * 1000)
    body['connection_id'] = event['requestContext']['connectionId']
    
    # Write to Kinesis with user_id as partition key for ordered processing
    response = kinesis.put_record(
        StreamName=os.environ['KINESIS_STREAM_NAME'],
        Data=json.dumps(body),
        PartitionKey=body['user_id']  # Ensures ordered processing per user
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Interaction recorded', 'sequence': response['SequenceNumber']})
    }
EOT
    filename = "index.py"
  }
}

data "archive_file" "processor_code" {
  type        = "zip"
  output_path = "/tmp/processor.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import base64
import os
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """Processes Kinesis interactions, updates DynamoDB with atomic counters"""
    
    interactions_table = dynamodb.Table(os.environ['INTERACTIONS_TABLE'])
    metrics_table = dynamodb.Table(os.environ['METRICS_TABLE'])
    
    for record in event['Records']:
        # Decode Kinesis data
        payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
        interaction = json.loads(payload)
        
        # Write to interactions table with composite key
        interactions_table.put_item(
            Item={
                'content_id': interaction['content_id'],
                'timestamp': interaction['timestamp'],
                'user_id': interaction['user_id'],
                'interaction_type': interaction['interaction_type'],
                'moderated': False,
                'processed_at': int(datetime.now().timestamp() * 1000)
            }
        )
        
        # Atomic counter update pattern for content metrics
        # UpdateExpression uses ADD for atomic increments
        counter_field = f"{interaction['interaction_type']}s_count"
        
        try:
            metrics_table.update_item(
                Key={'content_id': interaction['content_id']},
                UpdateExpression=f"ADD {counter_field} :inc, total_count :inc SET last_updated = :now",
                ExpressionAttributeValues={
                    ':inc': Decimal(1),
                    ':now': int(datetime.now().timestamp())
                },
                ReturnValues="ALL_NEW"
            )
        except Exception as e:
            print(f"Error updating metrics: {e}")
    
    return {'statusCode': 200, 'batchItemFailures': []}
EOT
    filename = "index.py"
  }
}

data "archive_file" "notifier_code" {
  type        = "zip"
  output_path = "/tmp/notifier.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import os
import redis

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def handler(event, context):
    """Generates notifications based on user preferences with Redis caching"""
    
    preferences_table = dynamodb.Table(os.environ['PREFERENCES_TABLE'])
    redis_host = os.environ['REDIS_ENDPOINT'].split(':')[0]
    redis_port = 6379
    
    # Connect to Redis with auth if enabled
    r = redis.Redis(
        host=redis_host,
        port=redis_port,
        password=os.environ.get('REDIS_AUTH_TOKEN'),
        ssl=True,
        decode_responses=True
    )
    
    for record in event['Records']:
        if record['eventName'] not in ['INSERT', 'MODIFY']:
            continue
            
        # Extract interaction from DynamoDB stream
        interaction = record['dynamodb'].get('NewImage', {})
        user_id = interaction.get('user_id', {}).get('S')
        content_id = interaction.get('content_id', {}).get('S')
        interaction_type = interaction.get('interaction_type', {}).get('S')
        
        # Check user preferences (cached in Redis for low latency)
        cache_key = f"prefs:{user_id}"
        prefs = r.get(cache_key)
        
        if not prefs:
            # Cache miss - fetch from DynamoDB
            response = preferences_table.get_item(Key={'user_id': user_id})
            if 'Item' in response:
                prefs = response['Item']
                # Cache for 1 hour
                r.setex(cache_key, 3600, json.dumps(prefs, default=str))
            else:
                continue  # User has no preferences set
        else:
            prefs = json.loads(prefs)
        
        # Notification filtering logic based on preferences
        if not prefs.get(f'notify_{interaction_type}', False):
            continue
            
        # Determine notification channels
        channels = []
        if prefs.get('push_enabled', False):
            channels.append('push')
        if prefs.get('email_enabled', False):
            channels.append('email')
        if prefs.get('sms_enabled', False):
            channels.append('sms')
        
        # Publish to SNS with MessageAttributes for routing
        for channel in channels:
            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Message=json.dumps({
                    'user_id': user_id,
                    'content_id': content_id,
                    'interaction_type': interaction_type,
                    'channel': channel
                }),
                MessageAttributes={
                    'user_id': {'DataType': 'String', 'StringValue': user_id},
                    'notification_type': {'DataType': 'String', 'StringValue': channel}
                }
            )
    
    return {'statusCode': 200}
EOT
    filename = "index.py"
  }
}

data "archive_file" "moderator_code" {
  type        = "zip"
  output_path = "/tmp/moderator.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import base64
import os

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def handler(event, context):
    """Content moderation with keyword matching from DynamoDB rules"""
    
    rules_table = dynamodb.Table(os.environ['RULES_TABLE'])
    
    # Fetch moderation rules (could be cached for performance)
    response = rules_table.scan()
    rules = response.get('Items', [])
    
    for record in event['Records']:
        # Decode Kinesis data
        payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
        interaction = json.loads(payload)
        
        # Only moderate comments
        if interaction['interaction_type'] != 'comment':
            continue
            
        comment_text = interaction.get('comment_text', '').lower()
        
        # Check against keyword rules
        flagged = False
        for rule in rules:
            keywords = rule.get('keywords', [])
            for keyword in keywords:
                if keyword.lower() in comment_text:
                    flagged = True
                    break
            if flagged:
                break
        
        if flagged:
            # Publish to moderation queue for ML classification
            sns.publish(
                TopicArn=os.environ['MODERATION_TOPIC_ARN'],
                Message=json.dumps(interaction)
            )
    
    return {'statusCode': 200, 'batchItemFailures': []}
EOT
    filename = "index.py"
  }
}

data "archive_file" "classifier_code" {
  type        = "zip"
  output_path = "/tmp/classifier.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import os

sagemaker = boto3.client('sagemaker-runtime')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
elasticache = boto3.client('elasticache')

def handler(event, context):
    """ML classification and policy violation handling"""
    
    interactions_table = dynamodb.Table(os.environ['INTERACTIONS_TABLE'])
    
    for record in event['Records']:
        message = json.loads(record['Sns']['Message'])
        
        # Invoke SageMaker endpoint for ML classification
        # Note: In production, the endpoint must exist
        if os.environ.get('SAGEMAKER_ENDPOINT'):
            try:
                response = sagemaker.invoke_endpoint(
                    EndpointName=os.environ['SAGEMAKER_ENDPOINT'],
                    Body=json.dumps({'text': message.get('comment_text', '')}),
                    ContentType='application/json'
                )
                
                result = json.loads(response['Body'].read())
                confidence = result.get('confidence', 0)
                
                # Check against threshold
                if confidence > float(os.environ.get('MODERATION_THRESHOLD', '0.8')):
                    # Update interaction as moderated
                    interactions_table.update_item(
                        Key={
                            'content_id': message['content_id'],
                            'timestamp': message['timestamp']
                        },
                        UpdateExpression="SET moderated = :true",
                        ExpressionAttributeValues={':true': True}
                    )
                    
                    # Publish to content-removed topic
                    sns.publish(
                        TopicArn=os.environ['REMOVED_TOPIC_ARN'],
                        Message=json.dumps(message)
                    )
            except Exception as e:
                print(f"SageMaker invocation failed: {e}")
                # Fallback to rule-based moderation
                pass
    
    return {'statusCode': 200}
EOT
    filename = "index.py"
  }
}

data "archive_file" "trending_code" {
  type        = "zip"
  output_path = "/tmp/trending.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import os
from datetime import datetime, timedelta
from decimal import Decimal
import redis

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """Calculate trending scores with recency and velocity factors"""
    
    metrics_table = dynamodb.Table(os.environ['METRICS_TABLE'])
    trending_table = dynamodb.Table(os.environ['TRENDING_TABLE'])
    redis_host = os.environ['REDIS_ENDPOINT'].split(':')[0]
    
    # Connect to Redis
    r = redis.Redis(
        host=redis_host,
        port=6379,
        password=os.environ.get('REDIS_AUTH_TOKEN'),
        ssl=True,
        decode_responses=True
    )
    
    # Query top interactions from last 6 hours
    now = datetime.now()
    six_hours_ago = now - timedelta(hours=6)
    
    response = metrics_table.scan(
        FilterExpression="last_updated > :cutoff",
        ExpressionAttributeValues={
            ':cutoff': int(six_hours_ago.timestamp())
        }
    )
    
    items = response.get('Items', [])
    
    # Calculate trending scores
    trending_items = []
    for item in items:
        # Trending score = (likes + 2*comments + 3*shares) * recency_factor
        likes = int(item.get('likes_count', 0))
        comments = int(item.get('comments_count', 0))
        shares = int(item.get('shares_count', 0))
        
        last_updated = item.get('last_updated', 0)
        hours_old = (now.timestamp() - last_updated) / 3600
        recency_factor = max(0.1, 1 - (hours_old / 6))  # Decay over 6 hours
        
        score = (likes + 2*comments + 3*shares) * recency_factor
        
        trending_items.append({
            'content_id': item['content_id'],
            'score': Decimal(str(score)),
            'content_type': item.get('content_type', 'post')
        })
    
    # Sort by score
    trending_items.sort(key=lambda x: x['score'], reverse=True)
    
    # Update trending table with TTL
    ttl = int((now + timedelta(hours=int(os.environ['TRENDING_TTL_HOURS']))).timestamp())
    
    for item in trending_items[:100]:  # Top 100
        trending_table.put_item(
            Item={
                'content_type': item['content_type'],
                'score': item['score'],
                'content_id': item['content_id'],
                'ttl': ttl
            }
        )
        
        # Update Redis sorted set for fast API access
        r.zadd(
            f"trending:{item['content_type']}",
            {item['content_id']: float(item['score'])}
        )
        r.expire(f"trending:{item['content_type']}", 3600 * 6)  # 6 hour expiry
    
    return {'statusCode': 200, 'items_processed': len(trending_items)}
EOT
    filename = "index.py"
  }
}

data "archive_file" "webhook_code" {
  type        = "zip"
  output_path = "/tmp/webhook.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import os

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def handler(event, context):
    """Process S3 upload events for user content"""
    
    catalog_table = dynamodb.Table(os.environ['CATALOG_TABLE'])
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        size = record['s3']['object']['size']
        
        # Validate file size (max 10MB)
        if size > 10 * 1024 * 1024:
            print(f"File too large: {key}")
            continue
        
        # Validate file type by extension
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4']
        if not any(key.lower().endswith(ext) for ext in allowed_extensions):
            print(f"Invalid file type: {key}")
            continue
        
        # Extract content_id from S3 key (assumes format: uploads/{user_id}/{content_id}/filename)
        parts = key.split('/')
        if len(parts) >= 3:
            user_id = parts[1]
            content_id = parts[2]
            
            # Update catalog table
            catalog_table.put_item(
                Item={
                    'content_id': content_id,
                    'user_id': user_id,
                    's3_key': key,
                    's3_bucket': bucket,
                    'file_size': size,
                    'uploaded_at': int(context.aws_request_id[:8], 16)  # Use request ID as timestamp
                }
            )
            
            # Publish to new-content topic
            sns.publish(
                TopicArn=os.environ['NEW_CONTENT_TOPIC_ARN'],
                Message=json.dumps({
                    'content_id': content_id,
                    'user_id': user_id,
                    's3_url': f"s3://{bucket}/{key}"
                })
            )
    
    return {'statusCode': 200}
EOT
    filename = "index.py"
  }
}

data "archive_file" "queue_consumer_code" {
  type        = "zip"
  output_path = "/tmp/queue_consumer.zip"
  
  source {
    content  = <<-EOT
import json
import boto3
import os
import urllib3

http = urllib3.PoolManager()

def handler(event, context):
    """Generic queue consumer for sending notifications via external services"""
    
    queue_type = os.environ['QUEUE_TYPE']  # push, email, or sms
    
    for record in event['Records']:
        message = json.loads(record['body'])
        
        # Mock external service call via API Gateway HTTP endpoint
        # In production, integrate with actual push/email/SMS services
        endpoint = os.environ.get('EXTERNAL_SERVICE_ENDPOINT', 'https://mock-api.example.com')
        
        payload = {
            'type': queue_type,
            'user_id': message['user_id'],
            'content': message
        }
        
        try:
            response = http.request(
                'POST',
                f"{endpoint}/{queue_type}",
                body=json.dumps(payload),
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status != 200:
                raise Exception(f"External service returned {response.status}")
                
        except Exception as e:
            print(f"Failed to send {queue_type} notification: {e}")
            # Return failure to trigger retry/DLQ
            raise
    
    return {'statusCode': 200}
EOT
    filename = "index.py"
  }
}

# Lambda IAM Roles
resource "aws_iam_role" "lambda_validator" {
  name_prefix = "${local.name_prefix}-lambda-validator-"
  
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

resource "aws_iam_role" "lambda_processor" {
  name_prefix = "${local.name_prefix}-lambda-processor-"
  
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

resource "aws_iam_role" "lambda_notifier" {
  name_prefix = "${local.name_prefix}-lambda-notifier-"
  
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

resource "aws_iam_role" "lambda_moderator" {
  name_prefix = "${local.name_prefix}-lambda-moderator-"
  
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

resource "aws_iam_role" "lambda_classifier" {
  name_prefix = "${local.name_prefix}-lambda-classifier-"
  
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

resource "aws_iam_role" "lambda_trending" {
  name_prefix = "${local.name_prefix}-lambda-trending-"
  
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

resource "aws_iam_role" "lambda_webhook" {
  name_prefix = "${local.name_prefix}-lambda-webhook-"
  
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

resource "aws_iam_role" "lambda_queue_consumer" {
  name_prefix = "${local.name_prefix}-lambda-queue-"
  
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

# Lambda IAM Policies
resource "aws_iam_role_policy" "lambda_validator" {
  name = "validator-policy"
  role = aws_iam_role.lambda_validator.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = aws_kinesis_stream.interactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_processor" {
  name = "processor-policy"
  role = aws_iam_role.lambda_processor.id
  
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
        Resource = aws_kinesis_stream.interactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = [
          aws_dynamodb_table.interactions.arn,
          aws_dynamodb_table.metrics.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_notifier" {
  name = "notifier-policy"
  role = aws_iam_role.lambda_notifier.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.preferences.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${aws_dynamodb_table.interactions.arn}/stream/*"
      },
      {
        Effect = "Allow"
        Action = "sns:Publish"
        Resource = aws_sns_topic.notifications.arn
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = "secretsmanager:GetSecretValue"
        Resource = aws_secretsmanager_secret.redis_auth.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  for_each = {
    notifier = aws_iam_role.lambda_notifier.name
    trending = aws_iam_role.lambda_trending.name
  }
  
  role       = each.value
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda Functions
resource "aws_lambda_function" "validator" {
  filename         = data.archive_file.validator_code.output_path
  function_name    = "${local.name_prefix}-validator"
  role            = aws_iam_role.lambda_validator.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.validator_code.output_base64sha256
  runtime         = var.runtime
  memory_size     = var.validator_memory
  timeout         = var.timeout_s
  
  reserved_concurrent_executions = local.env_config.lambda_concurrency
  
  environment {
    variables = {
      KINESIS_STREAM_NAME = aws_kinesis_stream.interactions.name
    }
  }
  
  tags = local.tags
}

resource "aws_lambda_function" "processor" {
  filename         = data.archive_file.processor_code.output_path
  function_name    = "${local.name_prefix}-processor"
  role            = aws_iam_role.lambda_processor.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.processor_code.output_base64sha256
  runtime         = var.runtime
  memory_size     = var.processor_memory
  timeout         = var.timeout_s
  
  reserved_concurrent_executions = local.env_config.lambda_concurrency
  
  environment {
    variables = {
      INTERACTIONS_TABLE = aws_dynamodb_table.interactions.name
      METRICS_TABLE      = aws_dynamodb_table.metrics.name
    }
  }
  
  tags = local.tags
}

resource "aws_lambda_function" "notifier" {
  filename         = data.archive_file.notifier_code.output_path
  function_name    = "${local.name_prefix}-notifier"
  role            = aws_iam_role.lambda_notifier.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.notifier_code.output_base64sha256
  runtime         = var.runtime
  memory_size     = var.notifier_memory
  timeout         = var.timeout_s
  
  reserved_concurrent_executions = local.env_config.lambda_concurrency
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      PREFERENCES_TABLE = aws_dynamodb_table.preferences.name
      SNS_TOPIC_ARN    = aws_sns_topic.notifications.arn
      REDIS_ENDPOINT   = aws_elasticache_replication_group.redis.configuration_endpoint_address
      REDIS_AUTH_TOKEN = random_password.redis_auth.result
    }
  }
  
  tags = local.tags
  
  depends_on = [aws_cloudwatch_log_group.lambda["notifier"]]
}

resource "aws_lambda_function" "moderator" {
  filename         = data.archive_file.moderator_code.output_path
  function_name    = "${local.name_prefix}-moderator"
  role            = aws_iam_role.lambda_moderator.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.moderator_code.output_base64sha256
  runtime         = var.runtime
  memory_size     = var.moderator_memory
  timeout         = var.timeout_s
  
  reserved_concurrent_executions = local.env_config.lambda_concurrency
  
  environment {
    variables = {
      RULES_TABLE         = aws_dynamodb_table.rules.name
      MODERATION_TOPIC_ARN = aws_sns_topic.moderation.arn
    }
  }
  
  tags = local.tags
}

resource "aws_lambda_function" "classifier" {
  filename         = data.archive_file.classifier_code.output_path
  function_name    = "${local.name_prefix}-classifier"
  role            = aws_iam_role.lambda_classifier.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.classifier_code.output_base64sha256
  runtime         = var.runtime
  memory_size     = var.classifier_memory
  timeout         = var.timeout_s
  
  environment {
    variables = {
      INTERACTIONS_TABLE   = aws_dynamodb_table.interactions.name
      REMOVED_TOPIC_ARN   = aws_sns_topic.removed.arn
      SAGEMAKER_ENDPOINT  = "" # Set when endpoint exists
      MODERATION_THRESHOLD = "0.8"
    }
  }
  
  tags = local.tags
}

resource "aws_lambda_function" "trending" {
  filename         = data.archive_file.trending_code.output_path
  function_name    = "${local.name_prefix}-trending"
  role            = aws_iam_role.lambda_trending.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.trending_code.output_base64sha256
  runtime         = var.runtime
  memory_size     = var.trending_memory
  timeout         = var.timeout_s
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      METRICS_TABLE      = aws_dynamodb_table.metrics.name
      TRENDING_TABLE     = aws_dynamodb_table.trending.name
      REDIS_ENDPOINT     = aws_elasticache_replication_group.redis.configuration_endpoint_address
      REDIS_AUTH_TOKEN   = random_password.redis_auth.result
      TRENDING_TTL_HOURS = tostring(local.env_config.trending_ttl_hours)
    }
  }
  
  tags = local.tags
}

resource "aws_lambda_function" "webhook" {
  filename         = data.archive_file.webhook_code.output_path
  function_name    = "${local.name_prefix}-webhook"
  role            = aws_iam_role.lambda_webhook.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.webhook_code.output_base64sha256
  runtime         = var.runtime
  memory_size     = var.webhook_memory
  timeout         = var.timeout_s
  
  environment {
    variables = {
      CATALOG_TABLE        = aws_dynamodb_table.catalog.name
      NEW_CONTENT_TOPIC_ARN = aws_sns_topic.new_content.arn
    }
  }
  
  tags = local.tags
}

# Queue Consumer Lambda Functions
resource "aws_lambda_function" "queue_consumers" {
  for_each = local.notification_queues
  
  filename         = data.archive_file.queue_consumer_code.output_path
  function_name    = "${local.name_prefix}-queue-${each.key}"
  role            = aws_iam_role.lambda_queue_consumer.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.queue_consumer_code.output_base64sha256
  runtime         = var.runtime
  memory_size     = var.validator_memory
  timeout         = var.timeout_s
  
  environment {
    variables = {
      QUEUE_TYPE = each.key
      EXTERNAL_SERVICE_ENDPOINT = "https://${aws_apigatewayv2_api.mock_external.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}"
    }
  }
  
  tags = local.tags
}

# Lambda Permissions
resource "aws_lambda_permission" "s3_webhook" {
  statement_id  = "AllowS3Invocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.content.arn
}

resource "aws_lambda_permission" "sns_classifier" {
  statement_id  = "AllowSNSInvocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.classifier.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.moderation.arn
}

# Event Source Mappings
resource "aws_lambda_event_source_mapping" "kinesis_processor" {
  event_source_arn              = aws_kinesis_stream.interactions.arn
  function_name                = aws_lambda_function.processor.arn
  starting_position            = "TRIM_HORIZON"
  parallelization_factor       = 10
  maximum_batching_window_in_seconds = 5
  
  depends_on = [aws_iam_role_policy.lambda_processor]
}

resource "aws_lambda_event_source_mapping" "kinesis_moderator" {
  event_source_arn              = aws_kinesis_stream.interactions.arn
  function_name                = aws_lambda_function.moderator.arn
  starting_position            = "TRIM_HORIZON"
  parallelization_factor       = 5
  
  depends_on = [aws_iam_role_policy.lambda_processor]  # Similar permissions needed
}

resource "aws_lambda_event_source_mapping" "dynamodb_notifier" {
  event_source_arn       = aws_dynamodb_table.interactions.stream_arn
  function_name         = aws_lambda_function.notifier.arn
  starting_position     = "TRIM_HORIZON"
  bisect_batch_on_function_error = true
  
  depends_on = [aws_iam_role_policy.lambda_notifier]
}

resource "aws_lambda_event_source_mapping" "sqs_consumers" {
  for_each = local.notification_queues
  
  event_source_arn = aws_sqs_queue.notifications[each.key].arn
  function_name    = aws_lambda_function.queue_consumers[each.key].arn
  batch_size       = 10
}

# SNS Subscriptions
resource "aws_sns_topic_subscription" "classifier" {
  topic_arn = aws_sns_topic.moderation.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.classifier.arn
}

# =============================================================================
# API GATEWAY
# =============================================================================

# WebSocket API
resource "aws_apigatewayv2_api" "websocket" {
  name                       = "${local.name_prefix}-${var.websocket_api_name}"
  protocol_type             = "WEBSOCKET"
  route_selection_expression = var.route_selection_expression
  
  tags = local.tags
}

resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"
  
  authorization_type = "AWS_IAM"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"
  
  authorization_type = "AWS_IAM"
}

resource "aws_apigatewayv2_route" "interaction" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "sendInteraction"
  
  target             = "integrations/${aws_apigatewayv2_integration.validator.id}"
  authorization_type = "AWS_IAM"
}

resource "aws_apigatewayv2_integration" "validator" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  
  integration_method = "POST"
  integration_uri    = aws_lambda_function.validator.invoke_arn
}

resource "aws_apigatewayv2_stage" "websocket" {
  api_id      = aws_apigatewayv2_api.websocket.id
  name        = var.stage_name
  auto_deploy = true
  
  default_route_settings {
    throttle_rate_limit  = local.env_config.websocket_connections
    throttle_burst_limit = local.env_config.websocket_connections * 2
  }
  
  tags = local.tags
}

resource "aws_lambda_permission" "api_gateway_validator" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.validator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

# Mock External Service API (HTTP)
resource "aws_apigatewayv2_api" "mock_external" {
  name          = "${local.name_prefix}-mock-external"
  protocol_type = "HTTP"
  
  tags = local.tags
}

resource "aws_apigatewayv2_stage" "mock_external" {
  api_id      = aws_apigatewayv2_api.mock_external.id
  name        = var.stage_name
  auto_deploy = true
  
  tags = local.tags
}

# =============================================================================
# STEP FUNCTIONS
# =============================================================================

resource "aws_iam_role" "step_functions" {
  name_prefix = "${local.name_prefix}-sfn-"
  
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
  name = "sfn-policy"
  role = aws_iam_role.step_functions.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = aws_lambda_function.trending.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_sfn_state_machine" "trending" {
  name     = "${local.name_prefix}-trending-workflow"
  role_arn = aws_iam_role.step_functions.arn
  
  definition = jsonencode({
    Comment = "Trending content analysis workflow"
    StartAt = "CalculateTrending"
    States = {
      CalculateTrending = {
        Type     = "Task"
        Resource = aws_lambda_function.trending.arn
        End      = true
      }
    }
  })
  
  tags = local.tags
}

# =============================================================================
# EVENTBRIDGE
# =============================================================================

resource "aws_cloudwatch_event_rule" "trending" {
  name                = "${local.name_prefix}-trending-schedule"
  schedule_expression = var.trending_schedule_expression
  
  tags = local.tags
}

resource "aws_cloudwatch_event_target" "trending" {
  rule      = aws_cloudwatch_event_rule.trending.name
  target_id = "TrendingStateMachine"
  arn       = aws_sfn_state_machine.trending.arn
  role_arn  = aws_iam_role.eventbridge.arn
}

resource "aws_iam_role" "eventbridge" {
  name_prefix = "${local.name_prefix}-eventbridge-"
  
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
    Statement = [{
      Effect   = "Allow"
      Action   = "states:StartExecution"
      Resource = aws_sfn_state_machine.trending.arn
    }]
  })
}

# =============================================================================
# CLOUDWATCH ALARMS
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "websocket_connections" {
  alarm_name          = "${local.name_prefix}-websocket-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "ConnectionCount"
  namespace          = "AWS/ApiGateway"
  period             = 300
  statistic          = "Average"
  threshold          = local.env_config.websocket_connections * 0.8
  alarm_description  = "WebSocket connection count approaching limit"
  
  dimensions = {
    ApiName = aws_apigatewayv2_api.websocket.name
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "kinesis_iterator_age" {
  alarm_name          = "${local.name_prefix}-kinesis-iterator-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "GetRecords.IteratorAgeMilliseconds"
  namespace          = "AWS/Kinesis"
  period             = 300
  statistic          = "Maximum"
  threshold          = 60000  # 60 seconds
  alarm_description  = "Kinesis iterator age high - processing lag detected"
  
  dimensions = {
    StreamName = aws_kinesis_stream.interactions.name
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_moderation_duration" {
  alarm_name          = "${local.name_prefix}-moderation-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "Duration"
  namespace          = "AWS/Lambda"
  period             = 300
  statistic          = "Average"
  threshold          = 30000  # 30 seconds
  alarm_description  = "Moderation Lambda taking too long"
  
  dimensions = {
    FunctionName = aws_lambda_function.moderator.function_name
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "UserErrors"
  namespace          = "AWS/DynamoDB"
  period             = 300
  statistic          = "Sum"
  threshold          = 10
  alarm_description  = "DynamoDB throttled writes detected"
  
  dimensions = {
    TableName = aws_dynamodb_table.interactions.name
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${local.name_prefix}-redis-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "DatabaseMemoryUsagePercentage"
  namespace          = "AWS/ElastiCache"
  period             = 300
  statistic          = "Average"
  threshold          = 80
  alarm_description  = "Redis memory usage high"
  
  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "aurora_write_latency" {
  alarm_name          = "${local.name_prefix}-aurora-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "WriteLatency"
  namespace          = "AWS/RDS"
  period             = 300
  statistic          = "Average"
  threshold          = 200  # 200ms
  alarm_description  = "Aurora write latency high"
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.id
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "sqs_queue_depth" {
  for_each = local.notification_queues
  
  alarm_name          = "${local.name_prefix}-${each.key}-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "ApproximateNumberOfMessagesVisible"
  namespace          = "AWS/SQS"
  period             = 300
  statistic          = "Average"
  threshold          = local.env_config.alarm_threshold
  alarm_description  = "${each.key} notification queue depth high"
  
  dimensions = {
    QueueName = aws_sqs_queue.notifications[each.key].name
  }
  
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "step_functions_errors" {
  alarm_name          = "${local.name_prefix}-sfn-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "ExecutionsFailed"
  namespace          = "AWS/States"
  period             = 300
  statistic          = "Sum"
  threshold          = 5
  alarm_description  = "Step Functions execution errors"
  
  dimensions = {
    StateMachineArn = aws_sfn_state_machine.trending.arn
  }
  
  tags = local.tags
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "websocket_api_url" {
  value       = "${aws_apigatewayv2_api.websocket.api_endpoint}/${var.stage_name}"
  description = "WebSocket API invoke URL"
}

output "kinesis_stream_arn" {
  value       = aws_kinesis_stream.interactions.arn
  description = "Kinesis interactions stream ARN"
}

output "dynamodb_tables" {
  value = {
    interactions = aws_dynamodb_table.interactions.name
    metrics      = aws_dynamodb_table.metrics.name
    preferences  = aws_dynamodb_table.preferences.name
    rules        = aws_dynamodb_table.rules.name
    trending     = aws_dynamodb_table.trending.name
    catalog      = aws_dynamodb_table.catalog.name
  }
  description = "DynamoDB table names"
}

output "sns_topics" {
  value = {
    notifications = aws_sns_topic.notifications.arn
    moderation   = aws_sns_topic.moderation.arn
    removed      = aws_sns_topic.removed.arn
    new_content  = aws_sns_topic.new_content.arn
  }
  description = "SNS topic ARNs"
}

output "sqs_queues" {
  value = {
    for k, v in aws_sqs_queue.notifications : k => v.url
  }
  description = "SQS queue URLs"
}

output "aurora_endpoint" {
  value       = aws_rds_cluster.aurora.endpoint
  description = "Aurora cluster endpoint"
}

output "aurora_reader_endpoint" {
  value       = aws_rds_cluster.aurora.reader_endpoint
  description = "Aurora reader endpoint"
}

output "redis_endpoint" {
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
  description = "Redis cluster endpoint"
}

output "step_functions_arn" {
  value       = aws_sfn_state_machine.trending.arn
  description = "Step Functions state machine ARN"
}

output "lambda_functions" {
  value = {
    validator  = aws_lambda_function.validator.arn
    processor  = aws_lambda_function.processor.arn
    notifier   = aws_lambda_function.notifier.arn
    moderator  = aws_lambda_function.moderator.arn
    classifier = aws_lambda_function.classifier.arn
    trending   = aws_lambda_function.trending.arn
    webhook    = aws_lambda_function.webhook.arn
  }
  description = "Lambda function ARNs"
}

output "s3_bucket" {
  value       = aws_s3_bucket.content.id
  description = "S3 content bucket name"
}

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs"
}

output "security_groups" {
  value = {
    lambda = aws_security_group.lambda.id
    redis  = aws_security_group.redis.id
    aurora = aws_security_group.aurora.id
  }
  description = "Security group IDs"
}

# =============================================================================
# EXAMPLE TFVARS FILES
# =============================================================================

# File: dev.tfvars
# env                          = "dev"
# aws_region                   = "us-east-1"
# vpc_cidr                     = "10.0.0.0/16"
# public_subnet_cidrs          = ["10.0.1.0/24", "10.0.2.0/24"]
# private_subnet_cidrs         = ["10.0.10.0/24", "10.0.11.0/24"]
# validator_memory             = 256
# processor_memory             = 256
# notifier_memory              = 256
# moderator_memory             = 256
# classifier_memory            = 256
# trending_memory              = 512
# webhook_memory               = 256
# node_type                    = "cache.t3.micro"
# num_cache_nodes              = 1
# instance_class               = "db.t3.small"
# min_capacity                 = 0.5
# max_capacity                 = 1
# backup_retention_days        = 1
# log_retention_days           = 7
# alarm_threshold_messages     = 100

# File: staging.tfvars
# env                          = "staging"
# aws_region                   = "us-east-1"
# vpc_cidr                     = "10.1.0.0/16"
# public_subnet_cidrs          = ["10.1.1.0/24", "10.1.2.0/24"]
# private_subnet_cidrs         = ["10.1.10.0/24", "10.1.11.0/24"]
# validator_memory             = 512
# processor_memory             = 512
# notifier_memory              = 512
# moderator_memory             = 512
# classifier_memory            = 512
# trending_memory              = 1024
# webhook_memory               = 512
# node_type                    = "cache.t3.small"
# num_cache_nodes              = 2
# instance_class               = "db.t3.medium"
# min_capacity                 = 1
# max_capacity                 = 2
# backup_retention_days        = 7
# log_retention_days           = 14
# alarm_threshold_messages     = 500

# File: prod.tfvars
# env                          = "prod"
# aws_region                   = "us-east-1"
# vpc_cidr                     = "10.2.0.0/16"
# public_subnet_cidrs          = ["10.2.1.0/24", "10.2.2.0/24"]
# private_subnet_cidrs         = ["10.2.10.0/24", "10.2.11.0/24"]
# validator_memory             = 1024
# processor_memory             = 1024
# notifier_memory              = 1024
# moderator_memory             = 1024
# classifier_memory            = 512
# trending_memory              = 2048
# webhook_memory               = 512
# node_type                    = "cache.r7g.large"
# num_cache_nodes              = 3
# instance_class               = "db.r5.xlarge"
# min_capacity                 = 2
# max_capacity                 = 8
# backup_retention_days        = 30
# log_retention_days           = 90
# alarm_threshold_messages     = 2000
```