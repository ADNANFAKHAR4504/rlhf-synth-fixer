# ===================================================================
# Terraform Configuration Block
# ===================================================================
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "s3" {}
}

# ===================================================================
# Variables
# ===================================================================

# Environment and Project Variables
variable "env" {
  description = "Environment name (dev/staging/prod)"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-delivery"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "platform-team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
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
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zones" {
  description = "Availability zones for deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

# API Gateway Variables
variable "websocket_api_name" {
  description = "Name for WebSocket API"
  type        = string
  default     = "order-tracking-ws"
}

variable "rest_api_name" {
  description = "Name for REST API"
  type        = string
  default     = "order-placement"
}

variable "stage_name" {
  description = "Stage name for APIs"
  type        = string
  default     = "v1"
}

variable "throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 5000
}

variable "throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 10000
}

# Kinesis Variables
variable "orders_stream_name" {
  description = "Name for orders Kinesis stream"
  type        = string
  default     = "orders-stream"
}

variable "locations_stream_name" {
  description = "Name for driver locations Kinesis stream"
  type        = string
  default     = "locations-stream"
}

variable "stream_mode" {
  description = "Kinesis stream mode"
  type        = string
  default     = "PROVISIONED"
}

variable "orders_shard_count" {
  description = "Shard count for orders stream"
  type        = number
  default     = 10
}

variable "locations_shard_count" {
  description = "Shard count for locations stream"
  type        = number
  default     = 5
}

variable "retention_hours" {
  description = "Kinesis retention period in hours"
  type        = number
  default     = 24
}

# DynamoDB Variables
variable "connections_table" {
  description = "Name for WebSocket connections table"
  type        = string
  default     = "websocket-connections"
}

variable "orders_table" {
  description = "Name for orders table"
  type        = string
  default     = "orders"
}

variable "driver_locations_table" {
  description = "Name for driver locations table"
  type        = string
  default     = "driver-locations"
}

variable "driver_orders_table" {
  description = "Name for driver orders table"
  type        = string
  default     = "driver-orders"
}

variable "driver_profiles_table" {
  description = "Name for driver profiles table"
  type        = string
  default     = "driver-profiles"
}

variable "billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PROVISIONED"
}

variable "rcu" {
  description = "DynamoDB read capacity units"
  type        = number
  default     = 100
}

variable "wcu" {
  description = "DynamoDB write capacity units"
  type        = number
  default     = 100
}

variable "ttl_enabled" {
  description = "Enable TTL for DynamoDB tables"
  type        = bool
  default     = true
}

variable "ttl_attribute_name" {
  description = "TTL attribute name"
  type        = string
  default     = "ttl"
}

# Lambda Variables
variable "connection_handler_memory" {
  description = "Memory for connection handler Lambda"
  type        = number
  default     = 512
}

variable "validator_memory" {
  description = "Memory for order validator Lambda"
  type        = number
  default     = 1024
}

variable "consumer_memory" {
  description = "Memory for consumer Lambda"
  type        = number
  default     = 2048
}

variable "matcher_memory" {
  description = "Memory for matching algorithm Lambda"
  type        = number
  default     = 3008
}

variable "restaurant_memory" {
  description = "Memory for restaurant consumer Lambda"
  type        = number
  default     = 1024
}

variable "driver_memory" {
  description = "Memory for driver consumer Lambda"
  type        = number
  default     = 1024
}

variable "customer_memory" {
  description = "Memory for customer consumer Lambda"
  type        = number
  default     = 512
}

variable "location_memory" {
  description = "Memory for location tracking Lambda"
  type        = number
  default     = 1024
}

variable "earnings_memory" {
  description = "Memory for earnings calculation Lambda"
  type        = number
  default     = 2048
}

variable "analytics_memory" {
  description = "Memory for analytics Lambda"
  type        = number
  default     = 1536
}

variable "image_memory" {
  description = "Memory for image processing Lambda"
  type        = number
  default     = 2048
}

variable "timeout_s" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 60
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.12"
}

variable "reserved_concurrent_executions" {
  description = "Lambda reserved concurrent executions"
  type        = number
  default     = 100
}

# Redis Variables
variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters"
  type        = number
  default     = 2
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover for Redis"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable multi-AZ for Redis"
  type        = bool
  default     = true
}

# Aurora Variables
variable "cluster_identifier" {
  description = "Aurora cluster identifier"
  type        = string
  default     = "tap-aurora-cluster"
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "tap_delivery"
}

variable "master_username" {
  description = "Master username for Aurora"
  type        = string
  default     = "dbadmin"
}

variable "instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "min_capacity" {
  description = "Aurora Serverless min capacity"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Aurora Serverless max capacity"
  type        = number
  default     = 4
}

variable "backup_retention_days" {
  description = "Backup retention days"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

# SNS Variables
variable "order_events_topic" {
  description = "SNS topic for order events"
  type        = string
  default     = "order-events"
}

variable "external_notifications_topic" {
  description = "SNS topic for external notifications"
  type        = string
  default     = "external-notifications"
}

# SQS Variables
variable "restaurant_queue_name" {
  description = "SQS queue for restaurant orders"
  type        = string
  default     = "restaurant-orders"
}

variable "driver_queue_name" {
  description = "SQS queue for driver assignments"
  type        = string
  default     = "driver-assignments"
}

variable "customer_queue_name" {
  description = "SQS queue for customer notifications"
  type        = string
  default     = "customer-notifications"
}

variable "visibility_timeout_seconds" {
  description = "SQS visibility timeout"
  type        = number
  default     = 300
}

variable "message_retention_seconds" {
  description = "SQS message retention"
  type        = number
  default     = 86400
}

# EventBridge Variables
variable "earnings_schedule_expression" {
  description = "Schedule expression for earnings calculation"
  type        = string
  default     = "cron(0 2 * * ? *)"
}

# S3 Variables
variable "receipts_bucket_name" {
  description = "S3 bucket for receipts"
  type        = string
  default     = "order-receipts"
}

variable "delivery_photos_bucket_name" {
  description = "S3 bucket for delivery photos"
  type        = string
  default     = "delivery-photos"
}

variable "lifecycle_expiration_days" {
  description = "S3 lifecycle expiration days"
  type        = number
  default     = 90
}

# Step Functions Variables
variable "earnings_workflow_name" {
  description = "Name for earnings calculation workflow"
  type        = string
  default     = "driver-earnings-workflow"
}

variable "max_concurrency" {
  description = "Step Functions max concurrency"
  type        = number
  default     = 100
}

# CloudWatch Variables
variable "log_retention_days" {
  description = "CloudWatch log retention days"
  type        = number
  default     = 30
}

variable "alarm_p99_threshold_ms" {
  description = "P99 latency threshold for alarms in milliseconds"
  type        = number
  default     = 1000
}

# ===================================================================
# Locals
# ===================================================================

locals {
  # Naming convention
  prefix = "${var.project_name}-${var.env}-${var.pr_number}"

  # Common tags
  tags = merge(
    var.common_tags,
    {
      Environment = var.env
      Project     = var.project_name
      Owner       = var.owner
      CostCenter  = var.cost_center
      ManagedBy   = "terraform"
    }
  )

  # Per-environment capacity maps
  capacity_map = {
    dev = {
      dynamodb_rcu      = 20
      dynamodb_wcu      = 20
      lambda_concurrent = -1
      redis_nodes       = 1
      aurora_min        = 0.5
      aurora_max        = 1
    }
    staging = {
      dynamodb_rcu      = 50
      dynamodb_wcu      = 50
      lambda_concurrent = 50
      redis_nodes       = 2
      aurora_min        = 0.5
      aurora_max        = 2
    }
    prod = {
      dynamodb_rcu      = 100
      dynamodb_wcu      = 100
      lambda_concurrent = 100
      redis_nodes       = 3
      aurora_min        = 1
      aurora_max        = 4
    }
  }

  # Lambda environment variables
  lambda_env_vars = {
    ENVIRONMENT = var.env
    REGION      = var.aws_region
    LOG_LEVEL   = var.env == "prod" ? "INFO" : "DEBUG"
  }

  # SNS-SQS subscription configuration
  sns_sqs_subscriptions = {
    restaurant = {
      topic_arn = aws_sns_topic.order_events.arn
      queue_arn = aws_sqs_queue.restaurant_orders.arn
      filter_policy = jsonencode({
        order_stage = ["placed", "assigned"]
      })
    }
    driver = {
      topic_arn = aws_sns_topic.order_events.arn
      queue_arn = aws_sqs_queue.driver_assignments.arn
      filter_policy = jsonencode({
        order_stage = ["assigned", "picked_up"]
      })
    }
    customer = {
      topic_arn = aws_sns_topic.order_events.arn
      queue_arn = aws_sqs_queue.customer_notifications.arn
      filter_policy = jsonencode({
        order_stage = ["placed", "assigned", "picked_up", "delivered"]
      })
    }
  }
}

# ===================================================================
# Data Sources
# ===================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ===================================================================
# VPC and Networking Resources
# ===================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.tags, {
    Name = "${local.prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${local.prefix}-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.tags, {
    Name = "${local.prefix}-nat-${count.index + 1}"
  })
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-public-rt"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "lambda" {
  name_prefix = "${local.prefix}-lambda-sg"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-lambda-sg"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.prefix}-redis-sg"
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
    Name = "${local.prefix}-redis-sg"
  })
}

resource "aws_security_group" "aurora" {
  name_prefix = "${local.prefix}-aurora-sg"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
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
    Name = "${local.prefix}-aurora-sg"
  })
}

# VPC Endpoints
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.aws_region}.dynamodb"
  route_table_ids = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.tags, {
    Name = "${local.prefix}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.tags, {
    Name = "${local.prefix}-s3-endpoint"
  })
}

# ===================================================================
# KMS Keys
# ===================================================================

resource "aws_kms_key" "main" {
  description             = "${local.prefix} encryption key"
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
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow SNS"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Alarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.prefix}"
  target_key_id = aws_kms_key.main.key_id
}

# ===================================================================
# S3 Buckets
# ===================================================================

resource "aws_s3_bucket" "receipts" {
  bucket = "${local.prefix}-${var.receipts_bucket_name}"

  tags = local.tags
}

resource "aws_s3_bucket" "delivery_photos" {
  bucket = "${local.prefix}-${var.delivery_photos_bucket_name}"

  tags = local.tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "delivery_photos" {
  bucket = aws_s3_bucket.delivery_photos.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  rule {
    id     = "expire-old-receipts"
    status = "Enabled"

    filter {}


    expiration {
      days = var.lifecycle_expiration_days
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "delivery_photos" {
  bucket = aws_s3_bucket.delivery_photos.id

  rule {
    id     = "expire-old-photos"
    status = "Enabled"

    filter {}


    expiration {
      days = var.lifecycle_expiration_days
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "delivery_photos" {
  bucket = aws_s3_bucket.delivery_photos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_notification" "image_upload" {
  bucket = aws_s3_bucket.delivery_photos.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".jpg"
  }

  depends_on = [aws_lambda_permission.s3_image_processor]
}

# ===================================================================
# DynamoDB Tables
# ===================================================================

# WebSocket Connections Table
resource "aws_dynamodb_table" "connections" {
  name           = "${local.prefix}-${var.connections_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  hash_key       = "connection_id"

  attribute {
    name = "connection_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "user_id_index"
    hash_key        = "user_id"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  }

  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_attribute_name
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = var.env == "prod"
  }

  tags = local.tags
}

# Orders Table with Streams
resource "aws_dynamodb_table" "orders" {
  name           = "${local.prefix}-${var.orders_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  hash_key       = "order_id"
  range_key      = "created_at"

  attribute {
    name = "order_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "N"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  attribute {
    name = "driver_id"
    type = "S"
  }

  attribute {
    name = "restaurant_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "customer_id_index"
    hash_key        = "customer_id"
    range_key       = "created_at"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  }

  global_secondary_index {
    name            = "driver_id_index"
    hash_key        = "driver_id"
    range_key       = "created_at"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  }

  global_secondary_index {
    name            = "restaurant_id_index"
    hash_key        = "restaurant_id"
    range_key       = "created_at"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  }

  global_secondary_index {
    name            = "status_index"
    hash_key        = "status"
    range_key       = "created_at"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  point_in_time_recovery {
    enabled = var.env == "prod"
  }

  tags = local.tags
}

# Driver Locations Table with Geohash GSI
resource "aws_dynamodb_table" "driver_locations" {
  name           = "${local.prefix}-${var.driver_locations_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  hash_key       = "driver_id"

  attribute {
    name = "driver_id"
    type = "S"
  }

  attribute {
    name = "geohash"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "geohash_index"
    hash_key        = "geohash"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  }

  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_attribute_name
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  tags = local.tags
}

# Driver Orders Table
resource "aws_dynamodb_table" "driver_orders" {
  name           = "${local.prefix}-${var.driver_orders_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  hash_key       = "driver_id"
  range_key      = "order_id"

  attribute {
    name = "driver_id"
    type = "S"
  }

  attribute {
    name = "order_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  tags = local.tags
}

# Driver Profiles Table
resource "aws_dynamodb_table" "driver_profiles" {
  name           = "${local.prefix}-${var.driver_profiles_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? lookup(local.capacity_map, var.env, {}).dynamodb_wcu : null
  hash_key       = "driver_id"

  attribute {
    name = "driver_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }

  tags = local.tags
}

# ===================================================================
# Kinesis Data Streams
# ===================================================================

resource "aws_kinesis_stream" "orders" {
  name             = "${local.prefix}-${var.orders_stream_name}"
  shard_count      = var.orders_shard_count
  retention_period = var.retention_hours

  shard_level_metrics = [
    "IncomingBytes",
    "OutgoingBytes"
  ]

  stream_mode_details {
    stream_mode = var.stream_mode
  }

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_kinesis_stream" "locations" {
  name             = "${local.prefix}-${var.locations_stream_name}"
  shard_count      = var.locations_shard_count
  retention_period = var.retention_hours

  shard_level_metrics = [
    "IncomingBytes",
    "OutgoingBytes"
  ]

  stream_mode_details {
    stream_mode = var.stream_mode
  }

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.main.arn

  tags = local.tags
}

# ===================================================================
# Aurora MySQL Cluster
# ===================================================================

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = local.tags
}

resource "random_password" "aurora_master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "aurora_master" {
  name_prefix             = "${local.prefix}-aurora-master"
  recovery_window_in_days = var.env == "prod" ? 30 : 0

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "aurora_master" {
  secret_id = aws_secretsmanager_secret.aurora_master.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.aurora_master.result
    engine   = "mysql"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 3306
    dbname   = var.database_name
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.prefix}-${var.cluster_identifier}"
  engine                          = "aurora-mysql"
  engine_mode                     = "provisioned"
  engine_version                  = "8.0.mysql_aurora.3.04.0"
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = random_password.aurora_master.result
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  backup_retention_period         = var.backup_retention_days
  preferred_backup_window         = var.preferred_backup_window
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.main.arn
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  serverlessv2_scaling_configuration {
    min_capacity = lookup(local.capacity_map, var.env, {}).aurora_min
    max_capacity = lookup(local.capacity_map, var.env, {}).aurora_max
  }

  tags = local.tags
}

resource "aws_rds_cluster_instance" "aurora" {
  count = lookup(local.capacity_map, var.env, {}).redis_nodes

  identifier         = "${local.prefix}-aurora-instance-${count.index}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled    = var.env == "prod"
  performance_insights_kms_key_id = var.env == "prod" ? aws_kms_key.main.arn : null

  monitoring_interval = var.env == "prod" ? 60 : 0
  monitoring_role_arn = var.env == "prod" ? aws_iam_role.rds_monitoring.arn : null

  tags = local.tags
}

# ===================================================================
# ElastiCache Redis
# ===================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = local.tags
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name_prefix             = "${local.prefix}-redis-auth"
  recovery_window_in_days = var.env == "prod" ? 30 : 0

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth.result
    endpoint   = aws_elasticache_replication_group.redis.configuration_endpoint_address
    port       = 6379
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.prefix}-redis"
  description                = "${local.prefix} Redis cluster"
  engine                     = "redis"
  node_type                  = var.node_type
  num_cache_clusters         = lookup(local.capacity_map, var.env, {}).redis_nodes
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result
  automatic_failover_enabled = var.automatic_failover_enabled && lookup(local.capacity_map, var.env, {}).redis_nodes > 1
  multi_az_enabled           = var.multi_az_enabled && lookup(local.capacity_map, var.env, {}).redis_nodes > 1
  engine_version             = var.engine_version
  apply_immediately          = var.env != "prod"
  snapshot_retention_limit   = var.env == "prod" ? 7 : 1

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = local.tags
}

# ===================================================================
# SNS Topics
# ===================================================================

resource "aws_sns_topic" "order_events" {
  name              = "${local.prefix}-${var.order_events_topic}"
  kms_master_key_id = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_sns_topic" "external_notifications" {
  name              = "${local.prefix}-${var.external_notifications_topic}"
  kms_master_key_id = aws_kms_key.main.arn

  tags = local.tags
}

# ===================================================================
# SQS Queues
# ===================================================================

resource "aws_sqs_queue" "restaurant_orders" {
  name                       = "${local.prefix}-${var.restaurant_queue_name}"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id          = aws_kms_key.main.arn
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.restaurant_orders_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.tags
}

resource "aws_sqs_queue" "restaurant_orders_dlq" {
  name                      = "${local.prefix}-${var.restaurant_queue_name}-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_sqs_queue" "driver_assignments" {
  name                       = "${local.prefix}-${var.driver_queue_name}"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id          = aws_kms_key.main.arn
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.driver_assignments_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.tags
}

resource "aws_sqs_queue" "driver_assignments_dlq" {
  name                      = "${local.prefix}-${var.driver_queue_name}-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_sqs_queue" "customer_notifications" {
  name                       = "${local.prefix}-${var.customer_queue_name}"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id          = aws_kms_key.main.arn
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.customer_notifications_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.tags
}

resource "aws_sqs_queue" "customer_notifications_dlq" {
  name                      = "${local.prefix}-${var.customer_queue_name}-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.main.arn

  tags = local.tags
}

# SNS to SQS Subscriptions
resource "aws_sns_topic_subscription" "restaurant_orders" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.restaurant_orders.arn

  filter_policy = jsonencode({
    order_stage = ["placed", "assigned"]
  })
}

resource "aws_sns_topic_subscription" "driver_assignments" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.driver_assignments.arn

  filter_policy = jsonencode({
    order_stage = ["assigned", "picked_up"]
  })
}

resource "aws_sns_topic_subscription" "customer_notifications" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.customer_notifications.arn

  filter_policy = jsonencode({
    order_stage = ["placed", "assigned", "picked_up", "delivered"]
  })
}

# ===================================================================
# Lambda Functions
# ===================================================================

# Lambda function code archives
data "archive_file" "lambda_code" {
  type        = "zip"
  output_path = "/tmp/lambda_code.zip"

  source {
    content  = <<EOF
import json
import os
import boto3
import time

def handler(event, context):
    # Generic handler for all Lambda functions
    # Each function would have specific logic based on its purpose
    print(f"Processing event: {json.dumps(event)}")
    
    # Example response structure
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Function executed successfully'})
    }
EOF
    filename = "index.py"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/${local.prefix}-redis"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each = {
    connection_handler  = "connection-handler"
    disconnect_handler  = "disconnect-handler"
    order_validator     = "order-validator"
    order_consumer      = "order-consumer"
    matcher             = "matcher"
    restaurant_consumer = "restaurant-consumer"
    driver_consumer     = "driver-consumer"
    customer_consumer   = "customer-consumer"
    location_tracker    = "location-tracker"
    earnings_calculator = "earnings-calculator"
    analytics_processor = "analytics-processor"
    image_processor     = "image-processor"
    step_function       = "step-function"
  }

  name              = "/aws/lambda/${local.prefix}-${each.value}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn

  tags = local.tags
}

# IAM Roles
resource "aws_iam_role" "lambda_execution" {
  name_prefix = "${local.prefix}-lambda"

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

resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${local.prefix}-rds-mon"

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

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Lambda Execution Policy
resource "aws_iam_role_policy" "lambda_execution" {
  name_prefix = "${local.prefix}-lambda-policy"
  role        = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Basic Lambda execution
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        # VPC access for Lambda
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
        # DynamoDB access
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.connections.arn,
          aws_dynamodb_table.orders.arn,
          aws_dynamodb_table.driver_locations.arn,
          aws_dynamodb_table.driver_orders.arn,
          aws_dynamodb_table.driver_profiles.arn,
          "${aws_dynamodb_table.connections.arn}/*",
          "${aws_dynamodb_table.orders.arn}/*",
          "${aws_dynamodb_table.driver_locations.arn}/*",
          "${aws_dynamodb_table.driver_orders.arn}/*",
          "${aws_dynamodb_table.driver_profiles.arn}/*"
        ]
      },
      {
        # Kinesis access
        Effect = "Allow"
        Action = [
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:ListStreams",
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = [
          aws_kinesis_stream.orders.arn,
          aws_kinesis_stream.locations.arn
        ]
      },
      {
        # SNS access
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.order_events.arn,
          aws_sns_topic.external_notifications.arn
        ]
      },
      {
        # SQS access
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.restaurant_orders.arn,
          aws_sqs_queue.driver_assignments.arn,
          aws_sqs_queue.customer_notifications.arn
        ]
      },
      {
        # S3 access
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.receipts.arn}/*",
          "${aws_s3_bucket.delivery_photos.arn}/*"
        ]
      },
      {
        # Secrets Manager access
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.aurora_master.arn,
          aws_secretsmanager_secret.redis_auth.arn
        ]
      },
      {
        # Rekognition access
        Effect = "Allow"
        Action = [
          "rekognition:DetectLabels"
        ]
        Resource = "*"
      },
      {
        # API Gateway WebSocket management
        Effect = "Allow"
        Action = [
          "execute-api:ManageConnections"
        ]
        Resource = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*/*/*/*"
      },
      {
        # KMS access
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# Connection Handler Lambda
resource "aws_lambda_function" "connection_handler" {
  function_name = "${local.prefix}-connection-handler"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.connection_handler_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  environment {
    variables = merge(local.lambda_env_vars, {
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
    })
  }

  tags = local.tags
}

# Disconnect Handler Lambda
resource "aws_lambda_function" "disconnect_handler" {
  function_name = "${local.prefix}-disconnect-handler"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.connection_handler_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  environment {
    variables = merge(local.lambda_env_vars, {
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
    })
  }

  tags = local.tags
}

# Order Validator Lambda
resource "aws_lambda_function" "order_validator" {
  function_name = "${local.prefix}-order-validator"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.validator_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  environment {
    variables = merge(local.lambda_env_vars, {
      ORDERS_STREAM = aws_kinesis_stream.orders.name
    })
  }

  tags = local.tags
}

# Order Consumer Lambda
resource "aws_lambda_function" "order_consumer" {
  function_name = "${local.prefix}-order-consumer"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.consumer_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      REDIS_SECRET    = aws_secretsmanager_secret.redis_auth.arn
      AURORA_SECRET   = aws_secretsmanager_secret.aurora_master.arn
      LOCATIONS_TABLE = aws_dynamodb_table.driver_locations.name
    })
  }

  tags = local.tags
}

# Matching Algorithm Lambda
resource "aws_lambda_function" "matcher" {
  function_name = "${local.prefix}-matcher"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.matcher_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      REDIS_SECRET        = aws_secretsmanager_secret.redis_auth.arn
      DRIVER_ORDERS_TABLE = aws_dynamodb_table.driver_orders.name
      ORDERS_TABLE        = aws_dynamodb_table.orders.name
    })
  }

  tags = local.tags
}

# Restaurant Consumer Lambda
resource "aws_lambda_function" "restaurant_consumer" {
  function_name = "${local.prefix}-restaurant-consumer"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.restaurant_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  environment {
    variables = merge(local.lambda_env_vars, {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
    })
  }

  tags = local.tags
}

# Driver Consumer Lambda
resource "aws_lambda_function" "driver_consumer" {
  function_name = "${local.prefix}-driver-consumer"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.driver_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  environment {
    variables = merge(local.lambda_env_vars, {
      WEBSOCKET_API_URL   = aws_apigatewayv2_api.websocket.api_endpoint
      CONNECTIONS_TABLE   = aws_dynamodb_table.connections.name
      DRIVER_ORDERS_TABLE = aws_dynamodb_table.driver_orders.name
    })
  }

  tags = local.tags
}

# Customer Consumer Lambda
resource "aws_lambda_function" "customer_consumer" {
  function_name = "${local.prefix}-customer-consumer"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.customer_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  environment {
    variables = merge(local.lambda_env_vars, {
      NOTIFICATIONS_TOPIC = aws_sns_topic.external_notifications.arn
    })
  }

  tags = local.tags
}

# Location Tracker Lambda
resource "aws_lambda_function" "location_tracker" {
  function_name = "${local.prefix}-location-tracker"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.location_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      REDIS_SECRET           = aws_secretsmanager_secret.redis_auth.arn
      DRIVER_LOCATIONS_TABLE = aws_dynamodb_table.driver_locations.name
      WEBSOCKET_API_URL      = aws_apigatewayv2_api.websocket.api_endpoint
      CONNECTIONS_TABLE      = aws_dynamodb_table.connections.name
    })
  }

  tags = local.tags
}

# Earnings Calculator Lambda
resource "aws_lambda_function" "earnings_calculator" {
  function_name = "${local.prefix}-earnings-calculator"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.earnings_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      AURORA_SECRET         = aws_secretsmanager_secret.aurora_master.arn
      ORDERS_TABLE          = aws_dynamodb_table.orders.name
      DRIVER_PROFILES_TABLE = aws_dynamodb_table.driver_profiles.name
    })
  }

  tags = local.tags
}

# Analytics Processor Lambda
resource "aws_lambda_function" "analytics_processor" {
  function_name = "${local.prefix}-analytics-processor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.analytics_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = merge(local.lambda_env_vars, {
      AURORA_SECRET = aws_secretsmanager_secret.aurora_master.arn
      REDIS_SECRET  = aws_secretsmanager_secret.redis_auth.arn
    })
  }

  tags = local.tags
}

# Image Processor Lambda
resource "aws_lambda_function" "image_processor" {
  function_name = "${local.prefix}-image-processor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.image_memory

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = lookup(local.capacity_map, var.env, {}).lambda_concurrent

  environment {
    variables = merge(local.lambda_env_vars, {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
    })
  }

  tags = local.tags
}

# Lambda Permissions
resource "aws_lambda_permission" "api_gateway_rest" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order_validator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.orders.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_websocket_connect" {
  statement_id  = "AllowWebSocketConnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.connection_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_websocket_disconnect" {
  statement_id  = "AllowWebSocketDisconnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.disconnect_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}

resource "aws_lambda_permission" "s3_image_processor" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.delivery_photos.arn
}

# Event Source Mappings
resource "aws_lambda_event_source_mapping" "kinesis_orders" {
  event_source_arn  = aws_kinesis_stream.orders.arn
  function_name     = aws_lambda_function.order_consumer.arn
  starting_position = "TRIM_HORIZON"

  batch_size                         = 100
  maximum_batching_window_in_seconds = 5
  parallelization_factor             = 10
  maximum_record_age_in_seconds      = 3600
  maximum_retry_attempts             = 3
}

resource "aws_lambda_event_source_mapping" "kinesis_locations" {
  event_source_arn  = aws_kinesis_stream.locations.arn
  function_name     = aws_lambda_function.location_tracker.arn
  starting_position = "TRIM_HORIZON"

  batch_size                         = 100
  maximum_batching_window_in_seconds = 2
  parallelization_factor             = 10
  maximum_record_age_in_seconds      = 300
  maximum_retry_attempts             = 3
}

resource "aws_lambda_event_source_mapping" "dynamodb_orders_stream" {
  event_source_arn  = aws_dynamodb_table.orders.stream_arn
  function_name     = aws_lambda_function.analytics_processor.arn
  starting_position = "TRIM_HORIZON"

  filter_criteria {
    filter {
      pattern = jsonencode({
        dynamodb = {
          NewImage = {
            status = {
              S = ["delivered"]
            }
          }
        }
      })
    }
  }

  batch_size                         = 25
  maximum_batching_window_in_seconds = 10
  parallelization_factor             = 5
  maximum_record_age_in_seconds      = 3600
  maximum_retry_attempts             = 3
}

resource "aws_lambda_event_source_mapping" "sqs_restaurant" {
  event_source_arn = aws_sqs_queue.restaurant_orders.arn
  function_name    = aws_lambda_function.restaurant_consumer.arn

  batch_size = 10
}

resource "aws_lambda_event_source_mapping" "sqs_driver" {
  event_source_arn = aws_sqs_queue.driver_assignments.arn
  function_name    = aws_lambda_function.driver_consumer.arn

  batch_size = 10
}

resource "aws_lambda_event_source_mapping" "sqs_customer" {
  event_source_arn = aws_sqs_queue.customer_notifications.arn
  function_name    = aws_lambda_function.customer_consumer.arn

  batch_size                         = 25
  maximum_batching_window_in_seconds = 2
}

# ===================================================================
# API Gateway REST API
# ===================================================================

resource "aws_api_gateway_rest_api" "orders" {
  name        = "${local.prefix}-${var.rest_api_name}"
  description = "REST API for order placement"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.tags
}

resource "aws_api_gateway_resource" "orders" {
  rest_api_id = aws_api_gateway_rest_api.orders.id
  parent_id   = aws_api_gateway_rest_api.orders.root_resource_id
  path_part   = "orders"
}

resource "aws_api_gateway_method" "orders_post" {
  rest_api_id   = aws_api_gateway_rest_api.orders.id
  resource_id   = aws_api_gateway_resource.orders.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "orders_post" {
  rest_api_id = aws_api_gateway_rest_api.orders.id
  resource_id = aws_api_gateway_resource.orders.id
  http_method = aws_api_gateway_method.orders_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.order_validator.invoke_arn
}

resource "aws_api_gateway_deployment" "orders" {
  rest_api_id = aws_api_gateway_rest_api.orders.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.orders,
      aws_api_gateway_method.orders_post,
      aws_api_gateway_integration.orders_post,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "orders" {
  deployment_id = aws_api_gateway_deployment.orders.id
  rest_api_id   = aws_api_gateway_rest_api.orders.id
  stage_name    = var.stage_name



  tags = local.tags
}

resource "aws_api_gateway_method_settings" "orders" {
  rest_api_id = aws_api_gateway_rest_api.orders.id
  stage_name  = aws_api_gateway_stage.orders.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = var.env == "prod" ? "ERROR" : "INFO"
    data_trace_enabled     = var.env != "prod"
    throttling_rate_limit  = var.throttle_rate_limit
    throttling_burst_limit = var.throttle_burst_limit
  }
}

# ===================================================================
# WAF Configuration
# ===================================================================

resource "aws_wafv2_web_acl" "api_gateway" {
  name        = "${local.prefix}-api-gateway-waf"
  description = "WAF for API Gateway protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: Rate Limiting
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.env == "prod" ? 2000 : 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.prefix}-waf-metric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Rules - SQL Injection Protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 2

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
      metric_name                = "${local.prefix}-sqli-metric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed Rules - Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 3

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
      metric_name                = "${local.prefix}-common-rule-metric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 4

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
      metric_name                = "${local.prefix}-bad-inputs-metric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.prefix}-waf-metric"
    sampled_requests_enabled   = true
  }

  tags = local.tags
}

resource "aws_wafv2_web_acl_association" "rest_api" {
  resource_arn = aws_api_gateway_stage.orders.arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway.arn

  depends_on = [
    aws_api_gateway_deployment.orders,
    aws_api_gateway_stage.orders
  ]
}

# ===================================================================
# API Gateway WebSocket API
# ===================================================================

resource "aws_apigatewayv2_api" "websocket" {
  name                       = "${local.prefix}-${var.websocket_api_name}"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"

  tags = local.tags
}

# WebSocket Routes
resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"

  target = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"

  target = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$default"

  target = "integrations/${aws_apigatewayv2_integration.default.id}"
}

# WebSocket Integrations
resource "aws_apigatewayv2_integration" "connect" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.connection_handler.invoke_arn
}

resource "aws_apigatewayv2_integration" "disconnect" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.disconnect_handler.invoke_arn
}

resource "aws_apigatewayv2_integration" "default" {
  api_id           = aws_apigatewayv2_api.websocket.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.connection_handler.invoke_arn
}

# WebSocket Deployment
resource "aws_apigatewayv2_deployment" "websocket" {
  api_id      = aws_apigatewayv2_api.websocket.id
  description = "WebSocket API deployment"

  triggers = {
    redeployment = sha1(jsonencode([
      aws_apigatewayv2_route.connect,
      aws_apigatewayv2_route.disconnect,
      aws_apigatewayv2_route.default,
      aws_apigatewayv2_integration.connect,
      aws_apigatewayv2_integration.disconnect,
      aws_apigatewayv2_integration.default,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_apigatewayv2_stage" "websocket" {
  api_id        = aws_apigatewayv2_api.websocket.id
  deployment_id = aws_apigatewayv2_deployment.websocket.id
  name          = var.stage_name

  default_route_settings {
    throttling_rate_limit  = var.throttle_rate_limit
    throttling_burst_limit = var.throttle_burst_limit
  }

  tags = local.tags
}

# ===================================================================
# Step Functions
# ===================================================================

resource "aws_iam_role" "step_functions" {
  name_prefix = "${local.prefix}-sfn"

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
  name_prefix = "${local.prefix}-step-functions-policy"
  role        = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.earnings_calculator.arn
        ]
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

resource "aws_sfn_state_machine" "earnings_workflow" {
  name     = "${local.prefix}-${var.earnings_workflow_name}"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Driver earnings calculation workflow"
    StartAt = "GetDriversList"
    States = {
      GetDriversList = {
        Type     = "Task"
        Resource = aws_lambda_function.earnings_calculator.arn
        Next     = "ProcessDrivers"
      }
      ProcessDrivers = {
        Type           = "Map"
        MaxConcurrency = var.max_concurrency
        ItemsPath      = "$.drivers"
        Parameters = {
          "driver_id.$" = "$$.Map.Item.Value.driver_id"
        }
        Iterator = {
          StartAt = "CalculateEarnings"
          States = {
            CalculateEarnings = {
              Type     = "Task"
              Resource = aws_lambda_function.earnings_calculator.arn
              End      = true
            }
          }
        }
        Next = "AggregateResults"
      }
      AggregateResults = {
        Type     = "Task"
        Resource = aws_lambda_function.earnings_calculator.arn
        End      = true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.lambda["step_function"].arn}:*"
    include_execution_data = true
    level                  = var.env == "prod" ? "ERROR" : "ALL"
  }

  tags = local.tags
}

# ===================================================================
# EventBridge Rules
# ===================================================================

resource "aws_iam_role" "eventbridge" {
  name_prefix = "${local.prefix}-evb"

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
  name_prefix = "${local.prefix}-evb-policy"
  role        = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.earnings_workflow.arn
      }
    ]
  })
}

resource "aws_cloudwatch_event_rule" "earnings_schedule" {
  name                = "${local.prefix}-earnings-schedule"
  description         = "Trigger nightly earnings calculation"
  schedule_expression = var.earnings_schedule_expression

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "earnings_workflow" {
  rule      = aws_cloudwatch_event_rule.earnings_schedule.name
  target_id = "EarningsWorkflow"
  arn       = aws_sfn_state_machine.earnings_workflow.arn
  role_arn  = aws_iam_role.eventbridge.arn

  input = jsonencode({
    execution_date = "$$.ScheduledTime"
  })
}

# ===================================================================
# CloudWatch Alarms
# ===================================================================

resource "aws_sns_topic" "alarms" {
  name              = "${local.prefix}-alarms"
  kms_master_key_id = aws_kms_key.main.arn

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "websocket_connections" {
  alarm_name          = "${local.prefix}-websocket-connection-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ConnectionError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "WebSocket connection failures"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ApiName = aws_apigatewayv2_api.websocket.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "kinesis_latency" {
  alarm_name          = "${local.prefix}-kinesis-getrecords-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "GetRecords.Latency"
  namespace           = "AWS/Kinesis"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Kinesis GetRecords latency"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    StreamName = aws_kinesis_stream.orders.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${local.prefix}-lambda-matcher-duration-p99"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2

  metric_query {
    id          = "p99"
    return_data = true

    metric {
      metric_name = "Duration"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "p99"

      dimensions = {
        FunctionName = aws_lambda_function.matcher.function_name
      }
    }
  }

  threshold         = var.alarm_p99_threshold_ms
  alarm_description = "Lambda matching function P99 duration"
  alarm_actions     = [aws_sns_topic.alarms.arn]

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.prefix}-dynamodb-orders-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB orders table throttled requests"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TableName = aws_dynamodb_table.orders.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${local.prefix}-redis-memory-fragmentation"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryFragmentationRatio"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 1.5
  alarm_description   = "Redis memory fragmentation ratio"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "${local.prefix}-aurora-connection-saturation"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Aurora connection pool saturation"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "sqs_backlog" {
  for_each = {
    restaurant = aws_sqs_queue.restaurant_orders.name
    driver     = aws_sqs_queue.driver_assignments.name
    customer   = aws_sqs_queue.customer_notifications.name
  }

  alarm_name          = "${local.prefix}-sqs-${each.key}-backlog"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "SQS ${each.key} queue backlog"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = each.value
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "step_functions_failures" {
  alarm_name          = "${local.prefix}-step-functions-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Step Functions earnings calculation failures"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.earnings_workflow.arn
  }

  tags = local.tags
}

# ===================================================================
# Outputs
# ===================================================================

output "websocket_api_invoke_url" {
  description = "WebSocket API invoke URL"
  value       = "${aws_apigatewayv2_api.websocket.api_endpoint}/${aws_apigatewayv2_stage.websocket.name}"
}

output "rest_api_invoke_url" {
  description = "REST API invoke URL"
  value       = aws_api_gateway_stage.orders.invoke_url
}

output "kinesis_orders_stream_arn" {
  description = "Orders Kinesis stream ARN"
  value       = aws_kinesis_stream.orders.arn
}

output "kinesis_locations_stream_arn" {
  description = "Locations Kinesis stream ARN"
  value       = aws_kinesis_stream.locations.arn
}

output "dynamodb_tables" {
  description = "DynamoDB table names and ARNs"
  value = {
    connections = {
      name = aws_dynamodb_table.connections.name
      arn  = aws_dynamodb_table.connections.arn
    }
    orders = {
      name = aws_dynamodb_table.orders.name
      arn  = aws_dynamodb_table.orders.arn
    }
    driver_locations = {
      name = aws_dynamodb_table.driver_locations.name
      arn  = aws_dynamodb_table.driver_locations.arn
    }
    driver_orders = {
      name = aws_dynamodb_table.driver_orders.name
      arn  = aws_dynamodb_table.driver_orders.arn
    }
    driver_profiles = {
      name = aws_dynamodb_table.driver_profiles.name
      arn  = aws_dynamodb_table.driver_profiles.arn
    }
  }
}

output "sns_topic_arns" {
  description = "SNS topic ARNs"
  value = {
    order_events           = aws_sns_topic.order_events.arn
    external_notifications = aws_sns_topic.external_notifications.arn
    alarms                 = aws_sns_topic.alarms.arn
  }
}

output "sqs_queue_urls" {
  description = "SQS queue URLs"
  value = {
    restaurant_orders      = aws_sqs_queue.restaurant_orders.url
    driver_assignments     = aws_sqs_queue.driver_assignments.url
    customer_notifications = aws_sqs_queue.customer_notifications.url
  }
}

output "aurora_endpoints" {
  description = "Aurora cluster endpoints"
  value = {
    writer = aws_rds_cluster.aurora.endpoint
    reader = aws_rds_cluster.aurora.reader_endpoint
  }
}

output "redis_configuration_endpoint" {
  description = "Redis configuration endpoint"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.earnings_workflow.arn
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value = {
    connection_handler  = aws_lambda_function.connection_handler.arn
    disconnect_handler  = aws_lambda_function.disconnect_handler.arn
    order_validator     = aws_lambda_function.order_validator.arn
    order_consumer      = aws_lambda_function.order_consumer.arn
    matcher             = aws_lambda_function.matcher.arn
    restaurant_consumer = aws_lambda_function.restaurant_consumer.arn
    driver_consumer     = aws_lambda_function.driver_consumer.arn
    customer_consumer   = aws_lambda_function.customer_consumer.arn
    location_tracker    = aws_lambda_function.location_tracker.arn
    earnings_calculator = aws_lambda_function.earnings_calculator.arn
    analytics_processor = aws_lambda_function.analytics_processor.arn
    image_processor     = aws_lambda_function.image_processor.arn
  }
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value = {
    receipts        = aws_s3_bucket.receipts.id
    delivery_photos = aws_s3_bucket.delivery_photos.id
  }
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    lambda = aws_security_group.lambda.id
    redis  = aws_security_group.redis.id
    aurora = aws_security_group.aurora.id
  }
}

output "rest_api_id" {
  description = "REST API ID"
  value       = aws_api_gateway_rest_api.orders.id
}

output "websocket_api_id" {
  description = "WebSocket API ID"
  value       = aws_apigatewayv2_api.websocket.id
}

output "aurora_cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.aurora.port
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "kinesis_orders_stream_name" {
  description = "Orders Kinesis stream name"
  value       = aws_kinesis_stream.orders.name
}

output "kinesis_locations_stream_name" {
  description = "Locations Kinesis stream name"
  value       = aws_kinesis_stream.locations.name
}

output "lambda_function_names" {
  description = "Lambda function names"
  value = {
    connection_handler  = aws_lambda_function.connection_handler.function_name
    disconnect_handler  = aws_lambda_function.disconnect_handler.function_name
    order_validator     = aws_lambda_function.order_validator.function_name
    order_consumer      = aws_lambda_function.order_consumer.function_name
    matcher             = aws_lambda_function.matcher.function_name
    restaurant_consumer = aws_lambda_function.restaurant_consumer.function_name
    driver_consumer     = aws_lambda_function.driver_consumer.function_name
    customer_consumer   = aws_lambda_function.customer_consumer.function_name
    location_tracker    = aws_lambda_function.location_tracker.function_name
    earnings_calculator = aws_lambda_function.earnings_calculator.function_name
    analytics_processor = aws_lambda_function.analytics_processor.function_name
    image_processor     = aws_lambda_function.image_processor.function_name
  }
}

output "secrets_manager_secrets" {
  description = "Secrets Manager secret ARNs"
  value = {
    aurora_credentials = aws_secretsmanager_secret.aurora_master.arn
    redis_auth         = aws_secretsmanager_secret.redis_auth.arn
  }
}

output "kms_key_ids" {
  description = "KMS key IDs"
  value = {
    main = aws_kms_key.main.key_id
  }
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.api_gateway.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.api_gateway.arn
}

output "eventbridge_rule_name" {
  description = "EventBridge rule name for earnings schedule"
  value       = aws_cloudwatch_event_rule.earnings_schedule.name
}

output "api_gateway_rest_api_id" {
  description = "API Gateway REST API ID (alias for rest_api_id)"
  value       = aws_api_gateway_rest_api.orders.id
}

output "api_gateway_stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.orders.stage_name
}

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL (alias for rest_api_invoke_url)"
  value       = aws_api_gateway_stage.orders.invoke_url
}