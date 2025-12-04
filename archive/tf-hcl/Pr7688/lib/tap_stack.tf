# tap_stack.tf - Multi-Environment Weather Data Ingestion & Alerting Pipeline
# Enforces topology parity across dev, staging, and production environments

# ============================================================================
# TERRAFORM CONFIGURATION
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
      version = "~> 3.1"
    }
  }

  backend "s3" {}
}

# ============================================================================
# VARIABLES
# ============================================================================

# General Configuration
variable "env" {
  type        = string
  description = "Environment name (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "project_name" {
  type        = string
  description = "Project name for resource naming"
  default     = "weather-pipeline"
}

variable "owner" {
  type        = string
  description = "Owner of the resources"
  default     = "platform-team"
}

variable "cost_center" {
  type        = string
  description = "Cost center for billing"
  default     = "engineering"
}

variable "common_tags" {
  type        = map(string)
  description = "Common tags to apply to all resources"
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

variable "enable_dns_hostnames" {
  type        = bool
  description = "Enable DNS hostnames in VPC"
  default     = true
}

# Kinesis Configuration
variable "observations_stream_name" {
  type        = string
  description = "Name for weather observations Kinesis stream"
  default     = "weather-observations"
}

variable "radar_stream_name" {
  type        = string
  description = "Name for radar imagery Kinesis stream"
  default     = "radar-imagery"
}

variable "stream_mode" {
  type        = string
  description = "Kinesis stream mode (ON_DEMAND or PROVISIONED)"
  default     = "ON_DEMAND"
}

variable "obs_shard_count" {
  type        = number
  description = "Number of shards for observations stream"
  default     = 2
}

variable "radar_shard_count" {
  type        = number
  description = "Number of shards for radar stream"
  default     = 2
}

variable "retention_hours" {
  type        = number
  description = "Data retention period in hours"
  default     = 168
}

# DynamoDB Configuration
variable "observations_table" {
  type        = string
  description = "Name for observations DynamoDB table"
  default     = "weather-observations"
}

variable "thresholds_table" {
  type        = string
  description = "Name for alert thresholds DynamoDB table"
  default     = "alert-thresholds"
}

variable "alerts_table" {
  type        = string
  description = "Name for active alerts DynamoDB table"
  default     = "active-alerts"
}

variable "radar_table" {
  type        = string
  description = "Name for radar data DynamoDB table"
  default     = "radar-data"
}

variable "forecasts_table" {
  type        = string
  description = "Name for forecasts DynamoDB table"
  default     = "weather-forecasts"
}

variable "model_versions_table" {
  type        = string
  description = "Name for model versions DynamoDB table"
  default     = "model-versions"
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

variable "ttl_enabled" {
  type        = bool
  description = "Enable TTL on DynamoDB tables"
  default     = true
}

variable "ttl_attribute_name" {
  type        = string
  description = "TTL attribute name"
  default     = "expiry_time"
}

# Lambda Configuration
variable "validator_memory" {
  type        = number
  description = "Memory for validator Lambda (MB)"
  default     = 256
}

variable "analyzer_memory" {
  type        = number
  description = "Memory for analyzer Lambda (MB)"
  default     = 512
}

variable "alert_memory" {
  type        = number
  description = "Memory for alert evaluator Lambda (MB)"
  default     = 512
}

variable "image_processor_memory" {
  type        = number
  description = "Memory for image processor Lambda (MB)"
  default     = 1024
}

variable "training_memory" {
  type        = number
  description = "Memory for training orchestration Lambda (MB)"
  default     = 512
}

variable "forecast_memory" {
  type        = number
  description = "Memory for forecast generator Lambda (MB)"
  default     = 1024
}

variable "timeout_s" {
  type        = number
  description = "Lambda timeout in seconds"
  default     = 300
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

variable "snapshot_retention_limit" {
  type        = number
  description = "Number of days to retain Redis snapshots"
  default     = 7
}

variable "snapshot_window" {
  type        = string
  description = "Daily time range for Redis snapshots"
  default     = "03:00-05:00"
}

# Aurora Configuration
variable "cluster_id" {
  type        = string
  description = "Aurora cluster identifier"
  default     = "weather-aurora"
}

variable "master_username" {
  type        = string
  description = "Aurora master username"
  default     = "dbadmin"
}

variable "instance_class" {
  type        = string
  description = "Aurora instance class"
  default     = "db.t3.medium"
}

variable "min_capacity" {
  type        = number
  description = "Aurora Serverless v2 minimum capacity"
  default     = 0.5
}

variable "max_capacity" {
  type        = number
  description = "Aurora Serverless v2 maximum capacity"
  default     = 1
}

variable "backup_retention_days" {
  type        = number
  description = "Aurora backup retention period"
  default     = 7
}

variable "database_name" {
  type        = string
  description = "Aurora database name"
  default     = "weather_db"
}

# SageMaker Configuration
variable "training_job_name_prefix" {
  type        = string
  description = "Prefix for SageMaker training job names"
  default     = "weather-model"
}

variable "model_name" {
  type        = string
  description = "SageMaker model name for data source"
  default     = "weather-forecast-model"
}

variable "endpoint_name" {
  type        = string
  description = "SageMaker endpoint name for data source"
  default     = "weather-forecast-endpoint"
}

# SNS Configuration
variable "severe_weather_topic" {
  type        = string
  description = "Name for severe weather SNS topic"
  default     = "severe-weather-alerts"
}

variable "http_endpoint_urls" {
  type        = list(string)
  description = "HTTP endpoints for external emergency management systems"
  default     = []
}

# SQS Configuration
variable "tornado_queue" {
  type        = string
  description = "Name for tornado alerts queue"
  default     = "tornado-alerts"
}

variable "hurricane_queue" {
  type        = string
  description = "Name for hurricane alerts queue"
  default     = "hurricane-alerts"
}

variable "flood_queue" {
  type        = string
  description = "Name for flood alerts queue"
  default     = "flood-alerts"
}

variable "heat_queue" {
  type        = string
  description = "Name for heat alerts queue"
  default     = "heat-alerts"
}

variable "visibility_timeout" {
  type        = number
  description = "SQS visibility timeout in seconds"
  default     = 300
}

variable "retention_period" {
  type        = number
  description = "SQS message retention period in seconds"
  default     = 1209600
}

# EventBridge Configuration
variable "training_schedule_expression" {
  type        = string
  description = "Schedule expression for model training"
  default     = "rate(6 hours)"
}

variable "forecast_schedule_expression" {
  type        = string
  description = "Schedule expression for forecast generation"
  default     = "rate(1 hour)"
}

# S3 Configuration
variable "data_lake_bucket" {
  type        = string
  description = "S3 bucket for data lake"
  default     = "weather-data-lake"
}

variable "training_bucket" {
  type        = string
  description = "S3 bucket for training data"
  default     = "weather-training-data"
}

variable "archive_bucket" {
  type        = string
  description = "S3 bucket for historical archive"
  default     = "weather-archive"
}

variable "lifecycle_glacier_days" {
  type        = number
  description = "Days before transitioning to Glacier Deep Archive"
  default     = 90
}

# Firehose Configuration
variable "radar_delivery_stream_name" {
  type        = string
  description = "Name for radar data Firehose delivery stream"
  default     = "radar-delivery-stream"
}

variable "buffer_interval_s" {
  type        = number
  description = "Firehose buffer interval in seconds"
  default     = 300
}

variable "buffer_size_mb" {
  type        = number
  description = "Firehose buffer size in MB"
  default     = 5
}

# Glue Configuration
variable "crawler_name" {
  type        = string
  description = "Name for Glue crawler"
  default     = "weather-data-crawler"
}

variable "glue_database_name" {
  type        = string
  description = "Name for Glue database"
  default     = "weather_catalog"
}

variable "crawler_schedule" {
  type        = string
  description = "Schedule for Glue crawler"
  default     = "cron(0 2 * * ? *)"
}

# Athena Configuration
variable "workgroup_name" {
  type        = string
  description = "Name for Athena workgroup"
  default     = "weather-analytics"
}

variable "results_bucket" {
  type        = string
  description = "S3 bucket for Athena query results"
  default     = "weather-athena-results"
}

# CloudWatch Configuration
variable "log_retention_days" {
  type        = number
  description = "CloudWatch log retention in days"
  default     = 30
}

# ============================================================================
# LOCALS
# ============================================================================
locals {
  # Resource naming convention
  prefix = "${var.project_name}-${var.env}-${var.pr_number}"

  # Common tags for all resources
  tags = merge(var.common_tags, {
    Environment = var.env
    Project     = var.project_name
    Owner       = var.owner
    CostCenter  = var.cost_center
    ManagedBy   = "terraform"
  })

  # Environment-specific capacity configurations
  capacity_map = {
    dev = {
      kinesis_shards      = 1
      lambda_memory       = 256
      dynamodb_rcu        = 5
      dynamodb_wcu        = 5
      redis_nodes         = 1
      aurora_min_capacity = 0.5
      aurora_max_capacity = 1
    }
    staging = {
      kinesis_shards      = 2
      lambda_memory       = 512
      dynamodb_rcu        = 10
      dynamodb_wcu        = 10
      redis_nodes         = 2
      aurora_min_capacity = 1
      aurora_max_capacity = 2
    }
    prod = {
      kinesis_shards      = 4
      lambda_memory       = 1024
      dynamodb_rcu        = 25
      dynamodb_wcu        = 25
      redis_nodes         = 3
      aurora_min_capacity = 2
      aurora_max_capacity = 4
    }
  }

  # Alert queue names for iteration
  alert_queues = {
    tornado   = var.tornado_queue
    hurricane = var.hurricane_queue
    flood     = var.flood_queue
    heat      = var.heat_queue
  }
}

# ============================================================================
# DATA SOURCES
# ============================================================================
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}



# ============================================================================
# VPC AND NETWORKING
# ============================================================================
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.tags, {
    Name = "${local.prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${local.prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.tags, {
    Name = "${local.prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

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

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
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
    Name = "${local.prefix}-aurora-sg"
  })
}

# VPC Endpoints
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"

  tags = merge(local.tags, {
    Name = "${local.prefix}-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = merge(local.tags, {
    Name = "${local.prefix}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "kinesis" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.lambda.id]

  tags = merge(local.tags, {
    Name = "${local.prefix}-kinesis-endpoint"
  })
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.lambda.id]

  tags = merge(local.tags, {
    Name = "${local.prefix}-sns-endpoint"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.lambda.id]

  tags = merge(local.tags, {
    Name = "${local.prefix}-sqs-endpoint"
  })
}

resource "aws_vpc_endpoint" "sagemaker" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${var.aws_region}.sagemaker.runtime"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.lambda.id]

  tags = merge(local.tags, {
    Name = "${local.prefix}-sagemaker-endpoint"
  })
}

# ============================================================================
# S3 BUCKETS
# ============================================================================
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption"
  deletion_window_in_days = 10

  tags = merge(local.tags, {
    Name = "${local.prefix}-s3-kms"
  })
}

resource "aws_s3_bucket" "data_lake" {
  bucket = "${local.prefix}-${var.data_lake_bucket}"

  tags = merge(local.tags, {
    Name = "${local.prefix}-data-lake"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "training" {
  bucket = "${local.prefix}-${var.training_bucket}"

  tags = merge(local.tags, {
    Name = "${local.prefix}-training"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "training" {
  bucket = aws_s3_bucket.training.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "training" {
  bucket = aws_s3_bucket.training.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "archive" {
  bucket = "${local.prefix}-${var.archive_bucket}"

  tags = merge(local.tags, {
    Name = "${local.prefix}-archive"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id

  rule {
    id     = "archive-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.lifecycle_glacier_days
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

resource "aws_s3_bucket" "athena_results" {
  bucket = "${local.prefix}-${var.results_bucket}"

  tags = merge(local.tags, {
    Name = "${local.prefix}-athena-results"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# ============================================================================
# KINESIS DATA STREAMS
# ============================================================================
resource "aws_kinesis_stream" "observations" {
  name             = "${local.prefix}-${var.observations_stream_name}"
  shard_count      = var.stream_mode == "PROVISIONED" ? local.capacity_map[var.env].kinesis_shards : null
  retention_period = var.retention_hours

  stream_mode_details {
    stream_mode = var.stream_mode
  }

  encryption_type = "KMS"
  kms_key_id      = "alias/aws/kinesis"

  tags = merge(local.tags, {
    Name = "${local.prefix}-observations-stream"
  })
}

resource "aws_kinesis_stream" "radar" {
  name             = "${local.prefix}-${var.radar_stream_name}"
  shard_count      = var.stream_mode == "PROVISIONED" ? local.capacity_map[var.env].kinesis_shards : null
  retention_period = var.retention_hours

  stream_mode_details {
    stream_mode = var.stream_mode
  }

  encryption_type = "KMS"
  kms_key_id      = "alias/aws/kinesis"

  tags = merge(local.tags, {
    Name = "${local.prefix}-radar-stream"
  })
}

# ============================================================================
# DYNAMODB TABLES
# ============================================================================
resource "aws_dynamodb_table" "observations" {
  name           = "${local.prefix}-${var.observations_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null

  hash_key  = "station_id"
  range_key = "timestamp"

  attribute {
    name = "station_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_attribute_name
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-observations"
  })
}

resource "aws_dynamodb_table" "thresholds" {
  name           = "${local.prefix}-${var.thresholds_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null

  hash_key = "region"

  attribute {
    name = "region"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-thresholds"
  })
}

resource "aws_dynamodb_table" "alerts" {
  name           = "${local.prefix}-${var.alerts_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null

  hash_key  = "alert_id"
  range_key = "created_at"

  attribute {
    name = "alert_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "N"
  }

  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_attribute_name
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-alerts"
  })
}

resource "aws_dynamodb_table" "radar_data" {
  name           = "${local.prefix}-${var.radar_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null

  hash_key  = "region"
  range_key = "timestamp"

  attribute {
    name = "region"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_attribute_name
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-radar-data"
  })
}

resource "aws_dynamodb_table" "forecasts" {
  name           = "${local.prefix}-${var.forecasts_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null

  hash_key  = "region"
  range_key = "forecast_time"

  attribute {
    name = "region"
    type = "S"
  }

  attribute {
    name = "forecast_time"
    type = "N"
  }

  ttl {
    enabled        = true
    attribute_name = var.ttl_attribute_name
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-forecasts"
  })
}

resource "aws_dynamodb_table" "model_versions" {
  name           = "${local.prefix}-${var.model_versions_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null

  hash_key = "model_id"

  attribute {
    name = "model_id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-model-versions"
  })
}

# ============================================================================
# ELASTICACHE REDIS
# ============================================================================
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis-subnet-group"
  })
}

resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "${local.prefix}-redis-params"

  # Enable geospatial commands
  parameter {
    name  = "notify-keyspace-events"
    value = "AKE"
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis-params"
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.prefix}-redis"
  description                = "Redis cluster for weather data caching"
  node_type                  = local.capacity_map[var.env].redis_nodes > 1 ? "cache.t3.small" : var.node_type
  num_cache_clusters         = local.capacity_map[var.env].redis_nodes
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  auth_token     = random_password.redis_auth.result
  engine_version = var.engine_version
  port           = 6379

  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis"
  })
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name                    = "${local.prefix}-redis-auth"
  recovery_window_in_days = 7

  tags = merge(local.tags, {
    Name = "${local.prefix}-redis-auth"
  })
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth.result
}

# ============================================================================
# AURORA POSTGRESQL
# ============================================================================
resource "aws_db_subnet_group" "aurora" {
  name       = "${local.prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-subnet-group"
  })
}

resource "random_password" "aurora_master" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "aurora_master" {
  name                    = "${local.prefix}-aurora-master"
  recovery_window_in_days = 7

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-master"
  })
}

resource "aws_secretsmanager_secret_version" "aurora_master" {
  secret_id = aws_secretsmanager_secret.aurora_master.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.aurora_master.result
  })
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier     = "${local.prefix}-${var.cluster_id}"
  engine                 = "aurora-postgresql"
  engine_version         = "15.14"
  database_name          = var.database_name
  master_username        = var.master_username
  master_password        = random_password.aurora_master.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  serverlessv2_scaling_configuration {
    min_capacity = local.capacity_map[var.env].aurora_min_capacity
    max_capacity = local.capacity_map[var.env].aurora_max_capacity
  }

  backup_retention_period = var.backup_retention_days
  preferred_backup_window = "03:00-04:00"
  storage_encrypted       = true

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-cluster"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = 2
  identifier         = "${local.prefix}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  tags = merge(local.tags, {
    Name = "${local.prefix}-aurora-instance-${count.index}"
  })
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# Lambda execution role
resource "aws_iam_role" "lambda_exec" {
  name = "${local.prefix}-lambda-exec"

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

resource "aws_iam_role_policy" "lambda_exec" {
  name = "${local.prefix}-lambda-exec-policy"
  role = aws_iam_role.lambda_exec.id

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
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:ListShards",
          "kinesis:ListStreams",
          "kinesis:PutRecords"
        ]
        Resource = [
          aws_kinesis_stream.observations.arn,
          aws_kinesis_stream.radar.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.observations.arn,
          aws_dynamodb_table.thresholds.arn,
          aws_dynamodb_table.alerts.arn,
          aws_dynamodb_table.radar_data.arn,
          aws_dynamodb_table.forecasts.arn,
          aws_dynamodb_table.model_versions.arn,
          "${aws_dynamodb_table.observations.arn}/stream/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*",
          aws_s3_bucket.training.arn,
          "${aws_s3_bucket.training.arn}/*",
          aws_s3_bucket.archive.arn,
          "${aws_s3_bucket.archive.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.severe_weather.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [for q in aws_sqs_queue.alert_queues : q.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.redis_auth.arn,
          aws_secretsmanager_secret.aurora_master.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sagemaker:InvokeEndpoint"
        ]
        Resource = "arn:aws:sagemaker:${var.aws_region}:${data.aws_caller_identity.current.account_id}:endpoint/${var.endpoint_name}"
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
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.s3.arn,
          aws_kms_key.sns.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Firehose role
resource "aws_iam_role" "firehose" {
  name = "${local.prefix}-firehose"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "firehose" {
  name = "${local.prefix}-firehose-policy"
  role = aws_iam_role.firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords"
        ]
        Resource = aws_kinesis_stream.radar.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.image_processor.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:Encrypt"
        ]
        Resource = [
          aws_kms_key.s3.arn
        ]
      }
    ]
  })
}

# Step Functions role
resource "aws_iam_role" "step_functions" {
  name = "${local.prefix}-step-functions"

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
  name = "${local.prefix}-step-functions-policy"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.training_orchestrator.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sagemaker:CreateTrainingJob",
          "sagemaker:DescribeTrainingJob",
          "sagemaker:StopTrainingJob"
        ]
        Resource = "*"
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

# Glue Crawler role
resource "aws_iam_role" "glue_crawler" {
  name = "${local.prefix}-glue-crawler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "glue_service" {
  role       = aws_iam_role.glue_crawler.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

resource "aws_iam_role_policy" "glue_s3_access" {
  name = "${local.prefix}-glue-s3-policy"
  role = aws_iam_role.glue_crawler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.s3.arn
        ]
      }
    ]
  })
}

# EventBridge role
resource "aws_iam_role" "eventbridge" {
  name = "${local.prefix}-eventbridge"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "eventbridge" {
  name = "${local.prefix}-eventbridge-policy"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.training.arn
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.forecast_generator.arn
      }
    ]
  })
}

# ============================================================================
# LAMBDA FUNCTIONS
# ============================================================================

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_validator" {
  name              = "/aws/lambda/${local.prefix}-validator"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_analyzer" {
  name              = "/aws/lambda/${local.prefix}-analyzer"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_alert" {
  name              = "/aws/lambda/${local.prefix}-alert-evaluator"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_image" {
  name              = "/aws/lambda/${local.prefix}-image-processor"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_training" {
  name              = "/aws/lambda/${local.prefix}-training-orchestrator"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_forecast" {
  name              = "/aws/lambda/${local.prefix}-forecast-generator"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/${local.prefix}-redis"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

# Lambda function archives
data "archive_file" "validator" {
  type        = "zip"
  output_path = "/tmp/validator.zip"

  source {
    content  = <<EOF
def handler(event, context):
    print("Validator Lambda")
    return {"statusCode": 200, "body": "OK"}
EOF
    filename = "index.py"
  }
}

data "archive_file" "analyzer" {
  type        = "zip"
  output_path = "/tmp/analyzer.zip"

  source {
    content  = <<EOF
def handler(event, context):
    print("Analyzer Lambda")
    return {"statusCode": 200, "body": "OK"}
EOF
    filename = "index.py"
  }
}

data "archive_file" "alert_evaluator" {
  type        = "zip"
  output_path = "/tmp/alert_evaluator.zip"

  source {
    content  = <<EOF
def handler(event, context):
    print("Alert Evaluator Lambda")
    return {"statusCode": 200, "body": "OK"}
EOF
    filename = "index.py"
  }
}

data "archive_file" "image_processor" {
  type        = "zip"
  output_path = "/tmp/image_processor.zip"

  source {
    content  = <<EOF
def handler(event, context):
    print("Image Processor Lambda")
    return {"statusCode": 200, "body": "OK"}
EOF
    filename = "index.py"
  }
}

data "archive_file" "training_orchestrator" {
  type        = "zip"
  output_path = "/tmp/training_orchestrator.zip"

  source {
    content  = <<EOF
def handler(event, context):
    print("Training Orchestrator Lambda")
    return {"statusCode": 200, "body": "OK"}
EOF
    filename = "index.py"
  }
}

data "archive_file" "forecast_generator" {
  type        = "zip"
  output_path = "/tmp/forecast_generator.zip"

  source {
    content  = <<EOF
def handler(event, context):
    print("Forecast Generator Lambda")
    return {"statusCode": 200, "body": "OK"}
EOF
    filename = "index.py"
  }
}

# Validator Lambda - validates incoming weather observations
resource "aws_lambda_function" "validator" {
  function_name    = "${local.prefix}-validator"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = var.runtime
  memory_size      = local.capacity_map[var.env].lambda_memory
  timeout          = var.timeout_s
  filename         = data.archive_file.validator.output_path
  source_code_hash = data.archive_file.validator.output_base64sha256

  environment {
    variables = {
      OBSERVATIONS_TABLE = aws_dynamodb_table.observations.name
      ENVIRONMENT        = var.env
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_validator]

  tags = merge(local.tags, {
    Name = "${local.prefix}-validator"
  })
}

# Analyzer Lambda - computes rolling statistics and checks for anomalies
resource "aws_lambda_function" "analyzer" {
  function_name    = "${local.prefix}-analyzer"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = var.runtime
  memory_size      = local.capacity_map[var.env].lambda_memory * 2
  timeout          = var.timeout_s
  filename         = data.archive_file.analyzer.output_path
  source_code_hash = data.archive_file.analyzer.output_base64sha256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      REDIS_ENDPOINT    = aws_elasticache_replication_group.redis.primary_endpoint_address
      REDIS_AUTH_SECRET = aws_secretsmanager_secret.redis_auth.name
      AURORA_SECRET     = aws_secretsmanager_secret.aurora_master.name
      AURORA_ENDPOINT   = aws_rds_cluster.aurora.endpoint
      ENVIRONMENT       = var.env
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_analyzer]

  tags = merge(local.tags, {
    Name = "${local.prefix}-analyzer"
  })
}

# Alert Evaluator Lambda - checks thresholds and publishes alerts
resource "aws_lambda_function" "alert_evaluator" {
  function_name    = "${local.prefix}-alert-evaluator"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = var.runtime
  memory_size      = local.capacity_map[var.env].lambda_memory * 2
  timeout          = var.timeout_s
  filename         = data.archive_file.alert_evaluator.output_path
  source_code_hash = data.archive_file.alert_evaluator.output_base64sha256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      REDIS_ENDPOINT    = aws_elasticache_replication_group.redis.primary_endpoint_address
      REDIS_AUTH_SECRET = aws_secretsmanager_secret.redis_auth.name
      THRESHOLDS_TABLE  = aws_dynamodb_table.thresholds.name
      SNS_TOPIC_ARN     = aws_sns_topic.severe_weather.arn
      ENVIRONMENT       = var.env
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_alert]

  tags = merge(local.tags, {
    Name = "${local.prefix}-alert-evaluator"
  })
}

# Image Processor Lambda - processes radar imagery
resource "aws_lambda_function" "image_processor" {
  function_name    = "${local.prefix}-image-processor"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = var.runtime
  memory_size      = local.capacity_map[var.env].lambda_memory * 4
  timeout          = var.timeout_s
  filename         = data.archive_file.image_processor.output_path
  source_code_hash = data.archive_file.image_processor.output_base64sha256

  environment {
    variables = {
      RADAR_TABLE = aws_dynamodb_table.radar_data.name
      ENVIRONMENT = var.env
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_image]

  tags = merge(local.tags, {
    Name = "${local.prefix}-image-processor"
  })
}

# Training Orchestrator Lambda - manages model training workflow
resource "aws_lambda_function" "training_orchestrator" {
  function_name    = "${local.prefix}-training-orchestrator"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = var.runtime
  memory_size      = local.capacity_map[var.env].lambda_memory * 2
  timeout          = var.timeout_s
  filename         = data.archive_file.training_orchestrator.output_path
  source_code_hash = data.archive_file.training_orchestrator.output_base64sha256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      AURORA_SECRET        = aws_secretsmanager_secret.aurora_master.name
      AURORA_ENDPOINT      = aws_rds_cluster.aurora.endpoint
      TRAINING_BUCKET      = aws_s3_bucket.training.id
      MODEL_VERSIONS_TABLE = aws_dynamodb_table.model_versions.name
      ENVIRONMENT          = var.env
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_training]

  tags = merge(local.tags, {
    Name = "${local.prefix}-training-orchestrator"
  })
}

# Forecast Generator Lambda - generates weather forecasts
resource "aws_lambda_function" "forecast_generator" {
  function_name    = "${local.prefix}-forecast-generator"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = var.runtime
  memory_size      = local.capacity_map[var.env].lambda_memory * 4
  timeout          = var.timeout_s
  filename         = data.archive_file.forecast_generator.output_path
  source_code_hash = data.archive_file.forecast_generator.output_base64sha256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SAGEMAKER_ENDPOINT = var.endpoint_name
      FORECASTS_TABLE    = aws_dynamodb_table.forecasts.name
      REDIS_ENDPOINT     = aws_elasticache_replication_group.redis.primary_endpoint_address
      REDIS_AUTH_SECRET  = aws_secretsmanager_secret.redis_auth.name
      ENVIRONMENT        = var.env
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_forecast]

  tags = merge(local.tags, {
    Name = "${local.prefix}-forecast-generator"
  })
}

# Lambda Event Source Mappings
resource "aws_lambda_event_source_mapping" "observations_stream" {
  event_source_arn  = aws_kinesis_stream.observations.arn
  function_name     = aws_lambda_function.validator.arn
  starting_position = "LATEST"

  parallelization_factor             = 10
  maximum_batching_window_in_seconds = 5
}

resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn  = aws_dynamodb_table.observations.stream_arn
  function_name     = aws_lambda_function.analyzer.arn
  starting_position = "LATEST"

  tumbling_window_in_seconds = 60
}

# ============================================================================
# SNS TOPICS
# ============================================================================
resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS encryption"
  deletion_window_in_days = 10

  tags = merge(local.tags, {
    Name = "${local.prefix}-sns-kms"
  })
}

resource "aws_sns_topic" "severe_weather" {
  name              = "${local.prefix}-${var.severe_weather_topic}"
  kms_master_key_id = aws_kms_key.sns.id

  tags = merge(local.tags, {
    Name = "${local.prefix}-severe-weather"
  })
}

resource "aws_sns_topic_subscription" "http_endpoints" {
  count     = length(var.http_endpoint_urls)
  topic_arn = aws_sns_topic.severe_weather.arn
  protocol  = "https"
  endpoint  = var.http_endpoint_urls[count.index]
}

# ============================================================================
# SQS QUEUES
# ============================================================================
resource "aws_sqs_queue" "alert_queues" {
  for_each = local.alert_queues

  name                       = "${local.prefix}-${each.value}"
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = var.retention_period

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.alert_dlq[each.key].arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name      = "${local.prefix}-${each.value}"
    AlertType = each.key
  })
}

resource "aws_sqs_queue" "alert_dlq" {
  for_each = local.alert_queues

  name                      = "${local.prefix}-${each.value}-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = merge(local.tags, {
    Name      = "${local.prefix}-${each.value}-dlq"
    AlertType = each.key
  })
}

resource "aws_sns_topic_subscription" "sqs_subscriptions" {
  for_each = local.alert_queues

  topic_arn = aws_sns_topic.severe_weather.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.alert_queues[each.key].arn

  filter_policy = jsonencode({
    alert_type = [each.key]
  })
}

resource "aws_sqs_queue_policy" "alert_queues" {
  for_each = local.alert_queues

  queue_url = aws_sqs_queue.alert_queues[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.alert_queues[each.key].arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.severe_weather.arn
          }
        }
      }
    ]
  })
}

# ============================================================================
# KINESIS DATA FIREHOSE
# ============================================================================
resource "aws_kinesis_firehose_delivery_stream" "radar" {
  name        = "${local.prefix}-${var.radar_delivery_stream_name}"
  destination = "extended_s3"

  kinesis_source_configuration {
    kinesis_stream_arn = aws_kinesis_stream.radar.arn
    role_arn           = aws_iam_role.firehose.arn
  }

  extended_s3_configuration {
    role_arn            = aws_iam_role.firehose.arn
    bucket_arn          = aws_s3_bucket.data_lake.arn
    prefix              = "radar/region=!{partitionKeyFromQuery:region}/date=!{timestamp:yyyy-MM-dd}/"
    error_output_prefix = "errors/"
    kms_key_arn         = aws_kms_key.s3.arn

    buffering_size     = var.buffer_size_mb
    buffering_interval = var.buffer_interval_s

    compression_format = "GZIP"

    processing_configuration {
      enabled = true

      processors {
        type = "MetadataExtraction"
        parameters {
          parameter_name  = "MetadataExtractionQuery"
          parameter_value = "{region: .region}"
        }
        parameters {
          parameter_name  = "JsonParsingEngine"
          parameter_value = "JQ-1.6"
        }
      }

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = aws_lambda_function.image_processor.arn
        }
      }
    }



    dynamic_partitioning_configuration {
      enabled = true
    }
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-radar-firehose"
  })
}

# ============================================================================
# STEP FUNCTIONS
# ============================================================================
resource "aws_sfn_state_machine" "training" {
  name     = "${local.prefix}-model-training"
  role_arn = aws_iam_role.step_functions.arn

  definition = <<EOF
{
  "Comment": "Model Training State Machine",
  "StartAt": "TrainModel",
  "States": {
    "TrainModel": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.training_orchestrator.arn}",
      "End": true
    }
  }
}
EOF

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-model-training"
  })
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${local.prefix}-model-training"
  retention_in_days = var.log_retention_days

  tags = local.tags
}

# ============================================================================
# EVENTBRIDGE RULES
# ============================================================================
resource "aws_scheduler_schedule" "training" {
  name       = "${local.prefix}-training-schedule"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = var.training_schedule_expression

  target {
    arn      = aws_sfn_state_machine.training.arn
    role_arn = aws_iam_role.eventbridge.arn

    input = jsonencode({
      environment = var.env
    })
  }
}

resource "aws_scheduler_schedule" "forecast" {
  name       = "${local.prefix}-forecast-schedule"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = var.forecast_schedule_expression

  target {
    arn      = aws_lambda_function.forecast_generator.arn
    role_arn = aws_iam_role.eventbridge.arn
  }
}

# ============================================================================
# GLUE CRAWLER
# ============================================================================
resource "aws_glue_catalog_database" "weather" {
  name = "${local.prefix}-${var.glue_database_name}"

  tags = local.tags
}

resource "aws_glue_crawler" "data_lake" {
  database_name = aws_glue_catalog_database.weather.name
  name          = "${local.prefix}-${var.crawler_name}"
  role          = aws_iam_role.glue_crawler.arn
  schedule      = var.crawler_schedule

  s3_target {
    path = "s3://${aws_s3_bucket.data_lake.bucket}/radar/"
  }

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-crawler"
  })
}

# ============================================================================
# ATHENA
# ============================================================================
resource "aws_athena_workgroup" "analytics" {
  name = "${local.prefix}-${var.workgroup_name}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.s3.arn
      }
    }
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-workgroup"
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================
resource "aws_cloudwatch_metric_alarm" "kinesis_incoming_records" {
  alarm_name          = "${local.prefix}-kinesis-incoming-records-anomaly"
  comparison_operator = "LessThanLowerThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "e1"
  alarm_description   = "Alarm when incoming record rate is too low"
  treat_missing_data  = "breaching"

  metric_query {
    id          = "e1"
    expression  = "ANOMALY_DETECTION_BAND(m1, 2)"
    return_data = true
  }

  metric_query {
    id = "m1"

    metric {
      metric_name = "IncomingRecords"
      namespace   = "AWS/Kinesis"
      period      = 300
      stat        = "Sum"

      dimensions = {
        StreamName = aws_kinesis_stream.observations.name
      }
    }
    return_data = true
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_analyzer_duration" {
  alarm_name          = "${local.prefix}-lambda-analyzer-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 200000
  alarm_description   = "Alarm when analyzer Lambda duration is too high"

  dimensions = {
    FunctionName = aws_lambda_function.analyzer.function_name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled" {
  alarm_name          = "${local.prefix}-dynamodb-throttled-reads"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alarm when DynamoDB has throttled reads"

  dimensions = {
    TableName = aws_dynamodb_table.observations.name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "${local.prefix}-aurora-connection-exhaustion"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Alarm when Aurora connection pool is nearly exhausted"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "sqs_message_age" {
  for_each = local.alert_queues

  alarm_name          = "${local.prefix}-sqs-${each.key}-message-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 600
  alarm_description   = "Alarm when SQS messages are too old"

  dimensions = {
    QueueName = aws_sqs_queue.alert_queues[each.key].name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "step_functions_failures" {
  alarm_name          = "${local.prefix}-step-functions-training-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 3600
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alarm when Step Functions training execution fails"

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.training.id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "firehose_errors" {
  alarm_name          = "${local.prefix}-firehose-delivery-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DeliveryToS3.Records"
  namespace           = "AWS/Kinesis/Firehose"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Alarm when Firehose has delivery errors"

  dimensions = {
    DeliveryStreamName = aws_kinesis_firehose_delivery_stream.radar.name
  }

  tags = local.tags
}

# ============================================================================
# WAF CONFIGURATION
# ============================================================================
resource "aws_wafv2_web_acl" "main" {
  name        = "${local.prefix}-waf"
  description = "WAF for weather pipeline infrastructure"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 1

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
      metric_name                = "SQLiRule"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 2

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
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

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
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(local.tags, {
    Name = "${local.prefix}-waf"
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================
output "kinesis_observations_arn" {
  description = "ARN of the observations Kinesis stream"
  value       = aws_kinesis_stream.observations.arn
}

output "kinesis_radar_arn" {
  description = "ARN of the radar Kinesis stream"
  value       = aws_kinesis_stream.radar.arn
}

output "dynamodb_tables" {
  description = "Names of all DynamoDB tables"
  value = {
    observations   = aws_dynamodb_table.observations.name
    thresholds     = aws_dynamodb_table.thresholds.name
    alerts         = aws_dynamodb_table.alerts.name
    radar_data     = aws_dynamodb_table.radar_data.name
    forecasts      = aws_dynamodb_table.forecasts.name
    model_versions = aws_dynamodb_table.model_versions.name
  }
}

output "sns_topic_arn" {
  description = "ARN of the severe weather SNS topic"
  value       = aws_sns_topic.severe_weather.arn
}

output "sqs_queue_urls" {
  description = "URLs of the alert SQS queues"
  value       = { for k, v in aws_sqs_queue.alert_queues : k => v.url }
}

output "aurora_endpoints" {
  description = "Aurora cluster endpoints"
  value = {
    writer = aws_rds_cluster.aurora.endpoint
    reader = aws_rds_cluster.aurora.reader_endpoint
  }
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "step_functions_arn" {
  description = "ARN of the model training Step Functions state machine"
  value       = aws_sfn_state_machine.training.arn
}

output "lambda_functions" {
  description = "ARNs of all Lambda functions"
  value = {
    validator             = aws_lambda_function.validator.arn
    analyzer              = aws_lambda_function.analyzer.arn
    alert_evaluator       = aws_lambda_function.alert_evaluator.arn
    image_processor       = aws_lambda_function.image_processor.arn
    training_orchestrator = aws_lambda_function.training_orchestrator.arn
    forecast_generator    = aws_lambda_function.forecast_generator.arn
  }
}

output "s3_buckets" {
  description = "Names of all S3 buckets"
  value = {
    data_lake      = aws_s3_bucket.data_lake.id
    training       = aws_s3_bucket.training.id
    archive        = aws_s3_bucket.archive.id
    athena_results = aws_s3_bucket.athena_results.id
  }
}

output "firehose_arn" {
  description = "ARN of the Kinesis Data Firehose delivery stream"
  value       = aws_kinesis_firehose_delivery_stream.radar.arn
}

output "glue_resources" {
  description = "Names of Glue resources"
  value = {
    database = aws_glue_catalog_database.weather.name
    crawler  = aws_glue_crawler.data_lake.name
  }
}

output "athena_workgroup" {
  description = "Name of the Athena workgroup"
  value       = aws_athena_workgroup.analytics.name
}

output "vpc_resources" {
  description = "VPC resource IDs"
  value = {
    vpc_id             = aws_vpc.main.id
    public_subnet_ids  = aws_subnet.public[*].id
    private_subnet_ids = aws_subnet.private[*].id
    lambda_sg_id       = aws_security_group.lambda.id
    redis_sg_id        = aws_security_group.redis.id
    aurora_sg_id       = aws_security_group.aurora.id
  }
}

output "kinesis_observations_name" {
  description = "Name of the observations Kinesis stream"
  value       = aws_kinesis_stream.observations.name
}

output "kinesis_radar_name" {
  description = "Name of the radar Kinesis stream"
  value       = aws_kinesis_stream.radar.name
}

output "aurora_cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_port" {
  description = "Aurora PostgreSQL port"
  value       = aws_rds_cluster.aurora.port
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}

output "kms_key_ids" {
  description = "KMS key IDs"
  value = {
    s3  = aws_kms_key.s3.id
    sns = aws_kms_key.sns.id
  }
}

output "secrets_manager_secrets" {
  description = "Secrets Manager secret ARNs"
  value = {
    redis_auth    = aws_secretsmanager_secret.redis_auth.arn
    aurora_master = aws_secretsmanager_secret.aurora_master.arn
  }
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    lambda = aws_security_group.lambda.id
    redis  = aws_security_group.redis.id
    aurora = aws_security_group.aurora.id
  }
}

output "lambda_function_names" {
  description = "Names of all Lambda functions"
  value = {
    validator             = aws_lambda_function.validator.function_name
    analyzer              = aws_lambda_function.analyzer.function_name
    alert_evaluator       = aws_lambda_function.alert_evaluator.function_name
    image_processor       = aws_lambda_function.image_processor.function_name
    training_orchestrator = aws_lambda_function.training_orchestrator.function_name
    forecast_generator    = aws_lambda_function.forecast_generator.function_name
  }
}

output "waf_web_acl_id" {
  description = "WAF WebACL ID"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "WAF WebACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "eventbridge_rule_name" {
  description = "EventBridge rule name for training schedule"
  value       = aws_scheduler_schedule.training.name
}

