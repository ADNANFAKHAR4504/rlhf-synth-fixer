## `tap_stack.tf`

```hcl
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

  backend "s3" {}
}

# =============================================================================
# VARIABLES
# =============================================================================

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stream"
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

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# VPC Configuration
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

variable "num_availability_zones" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

# API Gateway Configuration
variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "user-activity-api"
}

variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "v1"
}

variable "throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 1000
}

variable "throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 2000
}

# Kinesis Configuration
variable "activity_stream_name" {
  description = "Name of the Kinesis activity stream"
  type        = string
  default     = "user-activity-stream"
}

variable "stream_mode" {
  description = "Kinesis stream mode"
  type        = string
  default     = "PROVISIONED"
}

variable "shard_count" {
  description = "Number of Kinesis shards"
  type        = number
  default     = 2
}

variable "retention_hours" {
  description = "Kinesis data retention in hours"
  type        = number
  default     = 24
}

# DynamoDB Configuration
variable "activity_table" {
  description = "Name of the user activity table"
  type        = string
  default     = "user_activity"
}

variable "recommendations_table" {
  description = "Name of the recommendations table"
  type        = string
  default     = "user_recommendations"
}

variable "achievements_table" {
  description = "Name of the achievements table"
  type        = string
  default     = "user_achievements"
}

variable "catalog_table" {
  description = "Name of the content catalog table"
  type        = string
  default     = "content_catalog"
}

variable "billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PROVISIONED"
}

variable "rcu" {
  description = "DynamoDB read capacity units"
  type        = number
  default     = 10
}

variable "wcu" {
  description = "DynamoDB write capacity units"
  type        = number
  default     = 10
}

variable "ttl_attribute" {
  description = "TTL attribute name for DynamoDB"
  type        = string
  default     = "ttl"
}

# Lambda Configuration
variable "event_processor_memory" {
  description = "Memory for event processor Lambda"
  type        = number
  default     = 512
}

variable "recommendations_memory" {
  description = "Memory for recommendations Lambda"
  type        = number
  default     = 1024
}

variable "analytics_memory" {
  description = "Memory for analytics Lambda"
  type        = number
  default     = 512
}

variable "achievements_memory" {
  description = "Memory for achievements Lambda"
  type        = number
  default     = 512
}

variable "expiration_memory" {
  description = "Memory for expiration Lambda"
  type        = number
  default     = 512
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

# Redis Configuration
variable "node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_clusters" {
  description = "Number of Redis cache clusters"
  type        = number
  default     = 2
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "auth_token_enabled" {
  description = "Enable Redis auth token"
  type        = bool
  default     = true
}

# Aurora Configuration
variable "db_name" {
  description = "Aurora database name"
  type        = string
  default     = "contentdb"
}

variable "master_username" {
  description = "Aurora master username"
  type        = string
  default     = "dbadmin"
}

variable "instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "min_capacity" {
  description = "Aurora serverless min capacity"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Aurora serverless max capacity"
  type        = number
  default     = 1
}

variable "backup_retention_days" {
  description = "Aurora backup retention days"
  type        = number
  default     = 7
}

variable "preferred_maintenance_window" {
  description = "Aurora maintenance window"
  type        = string
  default     = "sun:03:00-sun:04:00"
}

# SageMaker Configuration
variable "recommendations_endpoint_name" {
  description = "SageMaker recommendations endpoint name"
  type        = string
  default     = "recommendations-model-endpoint"
}

# SNS Configuration
variable "complete_topic" {
  description = "SNS topic for watch complete events"
  type        = string
  default     = "watched-complete"
}

variable "notifications_topic" {
  description = "SNS topic for user notifications"
  type        = string
  default     = "user-notifications"
}

# SQS Configuration
variable "analytics_queue_name" {
  description = "SQS queue name for analytics"
  type        = string
  default     = "analytics-queue"
}

variable "achievements_queue_name" {
  description = "SQS queue name for achievements"
  type        = string
  default     = "achievements-queue"
}

variable "visibility_timeout_seconds" {
  description = "SQS visibility timeout"
  type        = number
  default     = 300
}

variable "message_retention_seconds" {
  description = "SQS message retention"
  type        = number
  default     = 345600
}

# EventBridge Configuration
variable "expiration_schedule_expression" {
  description = "Schedule expression for content expiration"
  type        = string
  default     = "cron(0 2 * * ? *)"
}

# S3 Configuration
variable "archive_bucket_name" {
  description = "S3 bucket for archived viewing data"
  type        = string
  default     = ""
}

variable "thumbnails_bucket_name" {
  description = "S3 bucket for video thumbnails"
  type        = string
  default     = ""
}

variable "lifecycle_glacier_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 90
}

# Athena Configuration
variable "workgroup_name" {
  description = "Athena workgroup name"
  type        = string
  default     = "viewing-analytics"
}

variable "output_bucket" {
  description = "S3 bucket for Athena query results"
  type        = string
  default     = ""
}

# CloudWatch Configuration
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alarm_latency_threshold" {
  description = "API Gateway latency alarm threshold in ms"
  type        = number
  default     = 1000
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Common naming prefix
  resource_prefix = "${var.project_name}-${var.env}-${var.pr_number}"

  # Common tags
  default_tags = merge(
    {
      Environment = var.env
      Project     = var.project_name
      Owner       = var.owner
      CostCenter  = var.cost_center
      PrNumber    = var.pr_number
      ManagedBy   = "terraform"
    },
    var.common_tags
  )

  # Per-environment capacity maps
  capacity_map = {
    dev = {
      api_throttle_rate  = 100
      api_throttle_burst = 200
      kinesis_shards     = 1
      dynamodb_rcu       = 5
      dynamodb_wcu       = 5
      lambda_memory      = 256
      redis_nodes        = 1
      aurora_min_acu     = 0.5
      aurora_max_acu     = 1
    }
    staging = {
      api_throttle_rate  = 500
      api_throttle_burst = 1000
      kinesis_shards     = 2
      dynamodb_rcu       = 10
      dynamodb_wcu       = 10
      lambda_memory      = 512
      redis_nodes        = 2
      aurora_min_acu     = 1
      aurora_max_acu     = 2
    }
    prod = {
      api_throttle_rate  = 1000
      api_throttle_burst = 2000
      kinesis_shards     = 4
      dynamodb_rcu       = 20
      dynamodb_wcu       = 20
      lambda_memory      = 1024
      redis_nodes        = 3
      aurora_min_acu     = 2
      aurora_max_acu     = 8
    }
  }

  # API stage variables
  api_stage_variables = {
    environment         = var.env
    kinesis_stream_name = aws_kinesis_stream.activity_stream.name
    event_lambda_arn    = aws_lambda_function.event_processor.arn
  }

  # Common Lambda environment variables
  lambda_env_vars = {
    ENVIRONMENT             = var.env
    ACTIVITY_TABLE          = aws_dynamodb_table.user_activity.name
    RECOMMENDATIONS_TABLE   = aws_dynamodb_table.user_recommendations.name
    ACHIEVEMENTS_TABLE      = aws_dynamodb_table.user_achievements.name
    CATALOG_TABLE           = aws_dynamodb_table.content_catalog.name
    KINESIS_STREAM_NAME     = aws_kinesis_stream.activity_stream.name
    REDIS_ENDPOINT          = aws_elasticache_replication_group.redis.primary_endpoint_address
    AURORA_ENDPOINT         = aws_rds_cluster.aurora.endpoint
    AURORA_SECRET_ARN       = aws_secretsmanager_secret.aurora_credentials.arn
    REDIS_SECRET_ARN        = aws_secretsmanager_secret.redis_auth.arn
    SAGEMAKER_ENDPOINT      = var.recommendations_endpoint_name
    COMPLETE_TOPIC_ARN      = aws_sns_topic.watched_complete.arn
    NOTIFICATIONS_TOPIC_ARN = aws_sns_topic.user_notifications.arn
    ANALYTICS_QUEUE_URL     = aws_sqs_queue.analytics_queue.url
    ACHIEVEMENTS_QUEUE_URL  = aws_sqs_queue.achievements_queue.url
    ARCHIVE_BUCKET          = aws_s3_bucket.archive.id
    THUMBNAILS_BUCKET       = aws_s3_bucket.thumbnails.id
    ATHENA_WORKGROUP        = aws_athena_workgroup.viewing_analytics.name
    ATHENA_OUTPUT_LOCATION  = "s3://${aws_s3_bucket.athena_results.id}/"
  }

  # S3 bucket names
  archive_bucket_name    = var.archive_bucket_name != "" ? var.archive_bucket_name : "${local.resource_prefix}-archive-${data.aws_caller_identity.current.account_id}"
  thumbnails_bucket_name = var.thumbnails_bucket_name != "" ? var.thumbnails_bucket_name : "${local.resource_prefix}-thumbnails-${data.aws_caller_identity.current.account_id}"
  athena_results_bucket  = var.output_bucket != "" ? var.output_bucket : "${local.resource_prefix}-athena-results-${data.aws_caller_identity.current.account_id}"
}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# VPC AND NETWORKING
# =============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.num_availability_zones
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = var.num_availability_zones
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = var.num_availability_zones
  domain = "vpc"

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  count         = var.num_availability_zones
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-public-rt"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = var.num_availability_zones
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = var.num_availability_zones
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = var.num_availability_zones
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpce-dynamodb"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpce-s3"
  })
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${local.resource_prefix}-vpce-sg"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpce-sg"
  })
}

# Interface VPC Endpoints
resource "aws_vpc_endpoint" "kinesis" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kinesis-streams"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpce-kinesis"
  })
}

resource "aws_vpc_endpoint" "sns" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpce-sns"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpce-sqs"
  })
}

resource "aws_vpc_endpoint" "sagemaker" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sagemaker.runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpce-sagemaker"
  })
}

resource "aws_vpc_endpoint" "states" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.states"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-vpce-states"
  })
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name_prefix = "${local.resource_prefix}-lambda-sg"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-lambda-sg"
  })
}

# Aurora Security Group
resource "aws_security_group" "aurora" {
  name_prefix = "${local.resource_prefix}-aurora-sg"
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

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-aurora-sg"
  })
}

# Redis Security Group
resource "aws_security_group" "redis" {
  name_prefix = "${local.resource_prefix}-redis-sg"
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

  tags = merge(local.default_tags, {
    Name = "${local.resource_prefix}-redis-sg"
  })
}

# =============================================================================
# SECRETS MANAGER
# =============================================================================

# Aurora DB Password
resource "random_password" "aurora" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "aurora_credentials" {
  name_prefix = "${local.resource_prefix}-aurora-"

  tags = local.default_tags
}

resource "aws_secretsmanager_secret_version" "aurora_credentials" {
  secret_id = aws_secretsmanager_secret.aurora_credentials.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.aurora.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

# Redis Auth Token
resource "random_password" "redis_auth" {
  length  = 32
  special = false # Redis auth tokens don't support special characters
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name_prefix = "${local.resource_prefix}-redis-auth-"

  tags = local.default_tags
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth.result
}

# =============================================================================
# S3 BUCKETS
# =============================================================================

# KMS Policy for S3 Key
data "aws_iam_policy_document" "s3_kms" {
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
    sid    = "Allow Services"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com", "rds.amazonaws.com", "lambda.amazonaws.com"]
    }
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = ["*"]
  }
}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "${local.resource_prefix} S3 encryption key"
  deletion_window_in_days = 10
  policy                  = data.aws_iam_policy_document.s3_kms.json

  tags = local.default_tags
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${local.resource_prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# Archive Bucket
resource "aws_s3_bucket" "archive" {
  bucket = local.archive_bucket_name

  tags = local.default_tags
}

resource "aws_s3_bucket_versioning" "archive" {
  bucket = aws_s3_bucket.archive.id

  versioning_configuration {
    status = "Enabled"
  }
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
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = var.lifecycle_glacier_days
      storage_class = "GLACIER"
    }

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "archive" {
  bucket = aws_s3_bucket.archive.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Thumbnails Bucket
resource "aws_s3_bucket" "thumbnails" {
  bucket = local.thumbnails_bucket_name

  tags = local.default_tags
}

resource "aws_s3_bucket_versioning" "thumbnails" {
  bucket = aws_s3_bucket.thumbnails.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "thumbnails" {
  bucket = aws_s3_bucket.thumbnails.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "thumbnails" {
  bucket = aws_s3_bucket.thumbnails.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Athena Results Bucket
resource "aws_s3_bucket" "athena_results" {
  bucket = local.athena_results_bucket

  tags = local.default_tags
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
    id     = "cleanup-old-results"
    status = "Enabled"

    filter {}

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

# =============================================================================
# KINESIS DATA STREAM
# =============================================================================

resource "aws_kinesis_stream" "activity_stream" {
  name = "${local.resource_prefix}-${var.activity_stream_name}"

  stream_mode_details {
    stream_mode = var.stream_mode
  }

  shard_count      = local.capacity_map[var.env].kinesis_shards
  retention_period = var.retention_hours

  encryption_type = "KMS"
  kms_key_id      = "alias/aws/kinesis"

  shard_level_metrics = [
    "IncomingBytes",
    "IncomingRecords",
    "OutgoingBytes",
    "OutgoingRecords",
  ]

  tags = local.default_tags
}

# =============================================================================
# DYNAMODB TABLES
# =============================================================================

# User Activity Table
resource "aws_dynamodb_table" "user_activity" {
  name           = "${local.resource_prefix}-${var.activity_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null
  hash_key       = "user_id"
  range_key      = "timestamp"

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "content_id"
    type = "S"
  }

  global_secondary_index {
    name            = "content-index"
    hash_key        = "content_id"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.default_tags
}

# User Recommendations Table
resource "aws_dynamodb_table" "user_recommendations" {
  name           = "${local.resource_prefix}-${var.recommendations_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  ttl {
    enabled        = true
    attribute_name = var.ttl_attribute
  }

  server_side_encryption {
    enabled = true
  }

  tags = local.default_tags
}

# User Achievements Table
resource "aws_dynamodb_table" "user_achievements" {
  name           = "${local.resource_prefix}-${var.achievements_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null
  hash_key       = "user_id"
  range_key      = "achievement_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "achievement_id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = local.default_tags
}

# Content Catalog Table
resource "aws_dynamodb_table" "content_catalog" {
  name           = "${local.resource_prefix}-${var.catalog_table}"
  billing_mode   = var.billing_mode
  read_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
  write_capacity = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null
  hash_key       = "content_id"

  attribute {
    name = "content_id"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  global_secondary_index {
    name            = "category-index"
    hash_key        = "category"
    projection_type = "ALL"
    read_capacity   = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_rcu : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? local.capacity_map[var.env].dynamodb_wcu : null
  }

  server_side_encryption {
    enabled = true
  }

  tags = local.default_tags
}

# =============================================================================
# AURORA POSTGRESQL
# =============================================================================

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name_prefix = "${local.resource_prefix}-aurora-"
  subnet_ids  = aws_subnet.private[*].id

  tags = local.default_tags
}

# Aurora Cluster Parameter Group
resource "aws_rds_cluster_parameter_group" "aurora" {
  name_prefix = "${local.resource_prefix}-aurora-pg-"
  family      = "aurora-postgresql15"
  description = "Aurora PostgreSQL 15 cluster parameter group"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "effective_cache_size"
    value = "393216"
  }

  tags = local.default_tags
}

# Aurora Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "${local.resource_prefix}-aurora"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = "15.14"
  database_name      = var.db_name
  master_username    = var.master_username
  master_password    = random_password.aurora.result

  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]

  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = "02:00-03:00"
  preferred_maintenance_window = var.preferred_maintenance_window

  storage_encrypted = true
  kms_key_id        = aws_kms_key.s3.arn

  enabled_cloudwatch_logs_exports = ["postgresql"]

  serverlessv2_scaling_configuration {
    max_capacity = local.capacity_map[var.env].aurora_max_acu
    min_capacity = local.capacity_map[var.env].aurora_min_acu
  }

  skip_final_snapshot       = var.env == "dev" ? true : false
  final_snapshot_identifier = var.env == "dev" ? null : "${local.resource_prefix}-aurora-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = local.default_tags
}

# Aurora Instance
resource "aws_rds_cluster_instance" "aurora" {
  count              = 1
  identifier_prefix  = "${local.resource_prefix}-aurora-"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled = var.env == "prod" ? true : false
  monitoring_interval          = var.env == "prod" ? 60 : 0
  monitoring_role_arn          = var.env == "prod" ? aws_iam_role.rds_monitoring[0].arn : null

  tags = local.default_tags
}

# RDS Monitoring Role (for prod)
resource "aws_iam_role" "rds_monitoring" {
  count       = var.env == "prod" ? 1 : 0
  name_prefix = "${local.resource_prefix}-rds-monitoring-"

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

  tags = local.default_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.env == "prod" ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =============================================================================
# ELASTICACHE REDIS
# =============================================================================

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.resource_prefix}-redis"
  subnet_ids = aws_subnet.private[*].id

  tags = local.default_tags
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "${local.resource_prefix}-redis"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = local.default_tags
}

# ElastiCache Replication Group
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.resource_prefix}-redis"
  description          = "${local.resource_prefix} Redis cluster"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_clusters   = local.capacity_map[var.env].redis_nodes
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.auth_token_enabled ? random_password.redis_auth.result : null

  automatic_failover_enabled = local.capacity_map[var.env].redis_nodes > 1
  multi_az_enabled           = local.capacity_map[var.env].redis_nodes > 1

  snapshot_retention_limit = var.env == "prod" ? 5 : 1
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"

  notification_topic_arn = aws_sns_topic.cloudwatch_alarms.arn

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = local.default_tags
}

# =============================================================================
# SNS TOPICS
# =============================================================================

# KMS Policy for SNS Key
data "aws_iam_policy_document" "sns_kms" {
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
    sid    = "Allow Services"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com", "events.amazonaws.com", "sns.amazonaws.com", "sqs.amazonaws.com", "lambda.amazonaws.com"]
    }
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = ["*"]
  }
}

# KMS Key for SNS
resource "aws_kms_key" "sns" {
  description             = "${local.resource_prefix} SNS encryption key"
  deletion_window_in_days = 10
  policy                  = data.aws_iam_policy_document.sns_kms.json

  tags = local.default_tags
}

resource "aws_kms_alias" "sns" {
  name          = "alias/${local.resource_prefix}-sns"
  target_key_id = aws_kms_key.sns.key_id
}

# Watch Complete Topic
resource "aws_sns_topic" "watched_complete" {
  name                        = "${local.resource_prefix}-${var.complete_topic}.fifo"
  kms_master_key_id           = aws_kms_key.sns.id
  fifo_topic                  = true
  content_based_deduplication = true

  tags = local.default_tags
}

# User Notifications Topic
resource "aws_sns_topic" "user_notifications" {
  name_prefix       = "${local.resource_prefix}-${var.notifications_topic}-"
  kms_master_key_id = aws_kms_key.sns.id

  tags = local.default_tags
}

# CloudWatch Alarms Topic
resource "aws_sns_topic" "cloudwatch_alarms" {
  name_prefix       = "${local.resource_prefix}-alarms-"
  kms_master_key_id = aws_kms_key.sns.id

  tags = local.default_tags
}

# =============================================================================
# SQS QUEUES
# =============================================================================

# Analytics Queue
resource "aws_sqs_queue" "analytics_queue" {
  name_prefix                = "${local.resource_prefix}-${var.analytics_queue_name}-"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  receive_wait_time_seconds  = 20 # Long polling

  kms_master_key_id                 = aws_kms_key.sns.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.analytics_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.default_tags
}

# Analytics DLQ
resource "aws_sqs_queue" "analytics_dlq" {
  name_prefix = "${local.resource_prefix}-${var.analytics_queue_name}-dlq-"

  message_retention_seconds = 1209600 # 14 days

  tags = local.default_tags
}

# Achievements Queue with Content-Based Deduplication
resource "aws_sqs_queue" "achievements_queue" {
  name_prefix                = "${local.resource_prefix}-${var.achievements_queue_name}-"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  receive_wait_time_seconds  = 20 # Long polling

  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit       = "perMessageGroupId"

  kms_master_key_id                 = aws_kms_key.sns.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.achievements_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.default_tags
}

# Achievements DLQ
resource "aws_sqs_queue" "achievements_dlq" {
  name_prefix = "${local.resource_prefix}-${var.achievements_queue_name}-dlq-"
  fifo_queue  = true

  message_retention_seconds = 1209600 # 14 days

  tags = local.default_tags
}

# SNS Subscriptions to SQS
resource "aws_sns_topic_subscription" "complete_to_analytics" {
  topic_arn = aws_sns_topic.watched_complete.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.analytics_queue.arn

  filter_policy = jsonencode({
    event_type = ["complete"]
  })

  raw_message_delivery = true
}

resource "aws_sns_topic_subscription" "complete_to_achievements" {
  topic_arn = aws_sns_topic.watched_complete.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.achievements_queue.arn

  filter_policy = jsonencode({
    event_type = ["complete"]
  })

  raw_message_delivery = true
}

# SQS Queue Policies
resource "aws_sqs_queue_policy" "analytics_queue" {
  queue_url = aws_sqs_queue.analytics_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.analytics_queue.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.watched_complete.arn
        }
      }
    }]
  })
}

resource "aws_sqs_queue_policy" "achievements_queue" {
  queue_url = aws_sqs_queue.achievements_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "sns.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.achievements_queue.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_sns_topic.watched_complete.arn
        }
      }
    }]
  })
}

# =============================================================================
# LAMBDA FUNCTIONS
# =============================================================================

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = {
    event_processor        = "/aws/lambda/${local.resource_prefix}-event-processor"
    recommendations_engine = "/aws/lambda/${local.resource_prefix}-recommendations-engine"
    analytics_consumer     = "/aws/lambda/${local.resource_prefix}-analytics-consumer"
    achievements_consumer  = "/aws/lambda/${local.resource_prefix}-achievements-consumer"
    expiration_check       = "/aws/lambda/${local.resource_prefix}-expiration-check"
    expiration_update      = "/aws/lambda/${local.resource_prefix}-expiration-update"
    expiration_cleanup     = "/aws/lambda/${local.resource_prefix}-expiration-cleanup"
    thumbnail_processor    = "/aws/lambda/${local.resource_prefix}-thumbnail-processor"
  }

  name              = each.value
  retention_in_days = var.log_retention_days

  tags = local.default_tags
}

resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/${local.resource_prefix}-redis"
  retention_in_days = var.log_retention_days

  tags = local.default_tags
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name_prefix = "${local.resource_prefix}-lambda-exec-"

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

  tags = local.default_tags
}

# Lambda IAM Policy
resource "aws_iam_policy" "lambda_policy" {
  name_prefix = "${local.resource_prefix}-lambda-policy-"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Sid    = "KinesisAccess"
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:ListShards",
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = aws_kinesis_stream.activity_stream.arn
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.user_activity.arn,
          "${aws_dynamodb_table.user_activity.arn}/*",
          aws_dynamodb_table.user_recommendations.arn,
          "${aws_dynamodb_table.user_recommendations.arn}/*",
          aws_dynamodb_table.user_achievements.arn,
          "${aws_dynamodb_table.user_achievements.arn}/*",
          aws_dynamodb_table.content_catalog.arn,
          "${aws_dynamodb_table.content_catalog.arn}/*"
        ]
      },
      {
        Sid    = "SNSPublish"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.watched_complete.arn,
          aws_sns_topic.user_notifications.arn
        ]
      },
      {
        Sid    = "SQSAccess"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility",
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.analytics_queue.arn,
          aws_sqs_queue.achievements_queue.arn,
          aws_sqs_queue.analytics_dlq.arn,
          aws_sqs_queue.achievements_dlq.arn
        ]
      },
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.archive.arn,
          "${aws_s3_bucket.archive.arn}/*",
          aws_s3_bucket.thumbnails.arn,
          "${aws_s3_bucket.thumbnails.arn}/*"
        ]
      },
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.aurora_credentials.arn,
          aws_secretsmanager_secret.redis_auth.arn
        ]
      },
      {
        Sid    = "SageMakerInvoke"
        Effect = "Allow"
        Action = [
          "sagemaker:InvokeEndpoint"
        ]
        Resource = "arn:aws:sagemaker:${var.aws_region}:${data.aws_caller_identity.current.account_id}:endpoint/${var.recommendations_endpoint_name}"
      },
      {
        Sid    = "AthenaAccess"
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults",
          "glue:GetDatabase",
          "glue:GetTable"
        ]
        Resource = "*"
      },
      {
        Sid    = "VPCNetworking"
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
        Sid    = "XRayTracing"
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSDecrypt"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3.arn,
          aws_kms_key.sns.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda Functions Code
data "archive_file" "lambda_code" {
  for_each = {
    event_processor        = "event_processor.py"
    recommendations_engine = "recommendations_engine.py"
    analytics_consumer     = "analytics_consumer.py"
    achievements_consumer  = "achievements_consumer.py"
    expiration_check       = "expiration_check.py"
    expiration_update      = "expiration_update.py"
    expiration_cleanup     = "expiration_cleanup.py"
    thumbnail_processor    = "thumbnail_processor.py"
  }

  type        = "zip"
  output_path = "/tmp/${each.key}.zip"

  source {
    content  = <<-EOT
import json
import os
import boto3
import logging
from datetime import datetime, timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    ${each.key} Lambda function
    Environment: ${var.env}
    
    This function handles ${replace(each.key, "_", " ")} operations.
    ${each.key == "recommendations_engine" ? "Implements collaborative filtering and content-based recommendations using viewing patterns and ML models." : ""}
    """
    
    # Environment variables
    env_vars = {k: v for k, v in os.environ.items() if not k.startswith('AWS_')}
    logger.info(f"Function: ${each.key}, Environment: {env_vars.get('ENVIRONMENT', 'unknown')}")
    
    try:
        # Function-specific logic would go here
        # This is a placeholder implementation
        
        if '${each.key}' == 'recommendations_engine':
            # Recommendation algorithm flow:
            # 1. Query user_activity table for user viewing patterns
            # 2. Get content metadata from Redis cache (cached from Aurora)
            # 3. Apply collaborative filtering using similar users' preferences
            # 4. Invoke SageMaker endpoint for ML-based recommendations
            # 5. Combine results and write top 10 to recommendations table with TTL
            logger.info("Processing recommendations using hybrid approach")
            
        elif '${each.key}' == 'event_processor':
            # Process incoming viewing events from Kinesis
            logger.info("Processing viewing events from Kinesis stream")
            
        elif '${each.key}' == 'analytics_consumer':
            # Aggregate completion metrics and update Aurora
            logger.info("Aggregating analytics data")
            
        elif '${each.key}' == 'achievements_consumer':
            # Check for user milestones and award badges
            logger.info("Checking user achievements")
            
        elif '${each.key}' == 'expiration_check':
            # Query Aurora for expired content
            logger.info("Checking for expired content licenses")
            
        elif '${each.key}' == 'expiration_update':
            # Update DynamoDB catalog with expiration flags
            logger.info("Updating content catalog with expiration status")
            
        elif '${each.key}' == 'expiration_cleanup':
            # Remove expired content from Redis cache
            logger.info("Cleaning up expired content from cache")
            
        elif '${each.key}' == 'thumbnail_processor':
            # Validate and process uploaded thumbnails
            logger.info("Processing thumbnail upload")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'${each.key} executed successfully',
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error in ${each.key}: {str(e)}")
        raise
EOT
    filename = "${each.key}.py"
  }
}

# Event Processor Lambda
resource "aws_lambda_function" "event_processor" {
  function_name = "${local.resource_prefix}-event-processor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "event_processor.lambda_handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = local.capacity_map[var.env].lambda_memory

  filename         = data.archive_file.lambda_code["event_processor"].output_path
  source_code_hash = data.archive_file.lambda_code["event_processor"].output_base64sha256

  environment {
    variables = local.lambda_env_vars
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tracing_config {
    mode = "Active"
  }

  tags = local.default_tags
}

# Recommendations Engine Lambda
resource "aws_lambda_function" "recommendations_engine" {
  function_name = "${local.resource_prefix}-recommendations-engine"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "recommendations_engine.lambda_handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.recommendations_memory

  filename         = data.archive_file.lambda_code["recommendations_engine"].output_path
  source_code_hash = data.archive_file.lambda_code["recommendations_engine"].output_base64sha256

  environment {
    variables = local.lambda_env_vars
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tracing_config {
    mode = "Active"
  }

  tags = local.default_tags
}

# Analytics Consumer Lambda
resource "aws_lambda_function" "analytics_consumer" {
  function_name = "${local.resource_prefix}-analytics-consumer"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "analytics_consumer.lambda_handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.analytics_memory

  filename         = data.archive_file.lambda_code["analytics_consumer"].output_path
  source_code_hash = data.archive_file.lambda_code["analytics_consumer"].output_base64sha256

  environment {
    variables = local.lambda_env_vars
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = local.default_tags
}

# Achievements Consumer Lambda
resource "aws_lambda_function" "achievements_consumer" {
  function_name = "${local.resource_prefix}-achievements-consumer"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "achievements_consumer.lambda_handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.achievements_memory

  filename         = data.archive_file.lambda_code["achievements_consumer"].output_path
  source_code_hash = data.archive_file.lambda_code["achievements_consumer"].output_base64sha256

  environment {
    variables = local.lambda_env_vars
  }

  tags = local.default_tags
}

# Expiration Check Lambda
resource "aws_lambda_function" "expiration_check" {
  function_name = "${local.resource_prefix}-expiration-check"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "expiration_check.lambda_handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.expiration_memory

  filename         = data.archive_file.lambda_code["expiration_check"].output_path
  source_code_hash = data.archive_file.lambda_code["expiration_check"].output_base64sha256

  environment {
    variables = local.lambda_env_vars
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = local.default_tags
}

# Expiration Update Lambda
resource "aws_lambda_function" "expiration_update" {
  function_name = "${local.resource_prefix}-expiration-update"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "expiration_update.lambda_handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.expiration_memory

  filename         = data.archive_file.lambda_code["expiration_update"].output_path
  source_code_hash = data.archive_file.lambda_code["expiration_update"].output_base64sha256

  environment {
    variables = local.lambda_env_vars
  }

  tags = local.default_tags
}

# Expiration Cleanup Lambda
resource "aws_lambda_function" "expiration_cleanup" {
  function_name = "${local.resource_prefix}-expiration-cleanup"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "expiration_cleanup.lambda_handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = var.expiration_memory

  filename         = data.archive_file.lambda_code["expiration_cleanup"].output_path
  source_code_hash = data.archive_file.lambda_code["expiration_cleanup"].output_base64sha256

  environment {
    variables = local.lambda_env_vars
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tags = local.default_tags
}

# Thumbnail Processor Lambda
resource "aws_lambda_function" "thumbnail_processor" {
  function_name = "${local.resource_prefix}-thumbnail-processor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "thumbnail_processor.lambda_handler"
  runtime       = var.runtime
  timeout       = var.timeout_s
  memory_size   = local.capacity_map[var.env].lambda_memory

  filename         = data.archive_file.lambda_code["thumbnail_processor"].output_path
  source_code_hash = data.archive_file.lambda_code["thumbnail_processor"].output_base64sha256

  environment {
    variables = local.lambda_env_vars
  }

  tags = local.default_tags
}

# Lambda Event Source Mappings
resource "aws_lambda_event_source_mapping" "kinesis_to_event_processor" {
  event_source_arn                   = aws_kinesis_stream.activity_stream.arn
  function_name                      = aws_lambda_function.event_processor.arn
  starting_position                  = "LATEST"
  parallelization_factor             = 1
  maximum_batching_window_in_seconds = 5

  tumbling_window_in_seconds = 60 # For aggregation

  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.analytics_dlq.arn
    }
  }
}

resource "aws_lambda_event_source_mapping" "dynamodb_to_recommendations" {
  event_source_arn                   = aws_dynamodb_table.user_activity.stream_arn
  function_name                      = aws_lambda_function.recommendations_engine.arn
  starting_position                  = "LATEST"
  batch_size                         = 100
  maximum_batching_window_in_seconds = 5
  bisect_batch_on_function_error     = true
}

resource "aws_lambda_event_source_mapping" "sqs_to_analytics" {
  event_source_arn = aws_sqs_queue.analytics_queue.arn
  function_name    = aws_lambda_function.analytics_consumer.arn
  batch_size       = 10
}

resource "aws_lambda_event_source_mapping" "sqs_to_achievements" {
  event_source_arn = aws_sqs_queue.achievements_queue.arn
  function_name    = aws_lambda_function.achievements_consumer.arn
  batch_size       = 10
}

# Lambda Permission for S3
resource "aws_lambda_permission" "thumbnail_s3_invoke" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.thumbnail_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.thumbnails.arn
}

# S3 Bucket Notification
resource "aws_s3_bucket_notification" "thumbnails" {
  bucket = aws_s3_bucket.thumbnails.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.thumbnail_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".jpg"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.thumbnail_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".png"
  }

  depends_on = [aws_lambda_permission.thumbnail_s3_invoke]
}

# =============================================================================
# API GATEWAY
# =============================================================================

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.resource_prefix}-${var.api_name}"
  description = "User Activity API for ${var.env} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.default_tags
}

# Request Validator
resource "aws_api_gateway_request_validator" "main" {
  name                        = "request-validator"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# API Gateway Resources
resource "aws_api_gateway_resource" "watch" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "watch"
}

resource "aws_api_gateway_resource" "pause" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "pause"
}

resource "aws_api_gateway_resource" "complete" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "complete"
}

# API Gateway Methods
resource "aws_api_gateway_method" "watch_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.watch.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.main.id
}

resource "aws_api_gateway_method" "pause_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.pause.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.main.id
}

resource "aws_api_gateway_method" "complete_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.complete.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.main.id
}

# Lambda Integration
resource "aws_api_gateway_integration" "watch" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.watch.id
  http_method = aws_api_gateway_method.watch_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.event_processor.invoke_arn
}

resource "aws_api_gateway_integration" "pause" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.pause.id
  http_method = aws_api_gateway_method.pause_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.event_processor.invoke_arn
}

resource "aws_api_gateway_integration" "complete" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.complete.id
  http_method = aws_api_gateway_method.complete_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.event_processor.invoke_arn
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.watch.id,
      aws_api_gateway_resource.pause.id,
      aws_api_gateway_resource.complete.id,
      aws_api_gateway_method.watch_post.id,
      aws_api_gateway_method.pause_post.id,
      aws_api_gateway_method.complete_post.id,
      aws_api_gateway_integration.watch.id,
      aws_api_gateway_integration.pause.id,
      aws_api_gateway_integration.complete.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.stage_name

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_access.arn
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

  depends_on = [aws_api_gateway_account.main]

  variables = local.api_stage_variables

  tags = local.default_tags
}

# API Gateway Method Settings
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    data_trace_enabled     = var.env != "prod"
    logging_level          = var.env != "prod" ? "INFO" : "ERROR"
    throttling_rate_limit  = local.capacity_map[var.env].api_throttle_rate
    throttling_burst_limit = local.capacity_map[var.env].api_throttle_burst
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_access" {
  name              = "/aws/api-gateway/${aws_api_gateway_rest_api.main.name}"
  retention_in_days = var.log_retention_days

  tags = local.default_tags
}

# API Gateway Account Settings (Global)
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name_prefix = "${local.resource_prefix}-apigw-cw-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })

  tags = local.default_tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# =============================================================================
# WAF (WEB APPLICATION FIREWALL)
# =============================================================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "api_gateway" {
  name        = "${local.resource_prefix}-apigw-waf"
  description = "WAF for API Gateway protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

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
      metric_name                = "${local.resource_prefix}-CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

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
      metric_name                = "${local.resource_prefix}-KnownBadInputsMetric"
      sampled_requests_enabled   = true
    }
  }

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
      metric_name                = "${local.resource_prefix}-SQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

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
      metric_name                = "${local.resource_prefix}-LinuxRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

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
      metric_name                = "${local.resource_prefix}-UnixRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 10

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
      metric_name                = "${local.resource_prefix}-RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.resource_prefix}-WebACLMetric"
    sampled_requests_enabled   = true
  }

  tags = local.default_tags
}

# WAF Log Group
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${local.resource_prefix}-apigw"
  retention_in_days = var.log_retention_days

  tags = local.default_tags
}

# CloudWatch Log Resource Policy for WAF Logging
resource "aws_cloudwatch_log_resource_policy" "waf_logging" {
  policy_name = "${local.resource_prefix}-waf-logging-policy"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "wafv2.amazonaws.com"
        }
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.waf.arn}:*"
        Condition = {
          ArnLike = {
            "aws:SourceArn" = "arn:aws:wafv2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*/webacl/*"
          }
        }
      }
    ]
  })
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "api_gateway" {
  resource_arn = aws_wafv2_web_acl.api_gateway.arn
  log_destination_configs = [
    "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.waf.name}:*"
  ]

  depends_on = [aws_cloudwatch_log_resource_policy.waf_logging]
}

# WAF Association with API Gateway
resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = aws_api_gateway_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway.arn
}

# =============================================================================
# STEP FUNCTIONS
# =============================================================================

# Step Functions Execution Role
resource "aws_iam_role" "step_functions" {
  name_prefix = "${local.resource_prefix}-sfn-exec-"

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

  tags = local.default_tags
}

# Step Functions IAM Policy
resource "aws_iam_policy" "step_functions" {
  name_prefix = "${local.resource_prefix}-sfn-policy-"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.expiration_check.arn,
          aws_lambda_function.expiration_update.arn,
          aws_lambda_function.expiration_cleanup.arn
        ]
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

resource "aws_iam_role_policy_attachment" "step_functions" {
  role       = aws_iam_role.step_functions.name
  policy_arn = aws_iam_policy.step_functions.arn
}

# Step Functions State Machine
resource "aws_sfn_state_machine" "content_expiration" {
  name     = "${local.resource_prefix}-content-expiration"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Content expiration workflow with parallel processing"
    StartAt = "CheckExpiredContent"
    States = {
      CheckExpiredContent = {
        Type     = "Task"
        Resource = aws_lambda_function.expiration_check.arn
        Next     = "ParallelExpiration"
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
      }
      ParallelExpiration = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "UpdateCatalog"
            States = {
              UpdateCatalog = {
                Type     = "Task"
                Resource = aws_lambda_function.expiration_update.arn
                End      = true
              }
            }
          },
          {
            StartAt = "CleanupCache"
            States = {
              CleanupCache = {
                Type     = "Task"
                Resource = aws_lambda_function.expiration_cleanup.arn
                End      = true
              }
            }
          }
        ]
        End = true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = var.env != "prod" ? "ALL" : "ERROR"
  }

  tags = local.default_tags
}

# CloudWatch Log Group for Step Functions
resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${local.resource_prefix}-content-expiration"
  retention_in_days = var.log_retention_days

  tags = local.default_tags
}

# =============================================================================
# EVENTBRIDGE
# =============================================================================

# EventBridge Rule for Nightly Content Expiration
resource "aws_cloudwatch_event_rule" "content_expiration" {
  name                = "${local.resource_prefix}-content-expiration"
  description         = "Trigger content expiration workflow nightly"
  schedule_expression = var.expiration_schedule_expression

  tags = local.default_tags
}

# EventBridge Target
resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.content_expiration.name
  target_id = "StepFunctionTarget"
  arn       = aws_sfn_state_machine.content_expiration.arn
  role_arn  = aws_iam_role.eventbridge.arn
}

# EventBridge Execution Role
resource "aws_iam_role" "eventbridge" {
  name_prefix = "${local.resource_prefix}-eventbridge-"

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

  tags = local.default_tags
}

resource "aws_iam_role_policy" "eventbridge" {
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["states:StartExecution"]
      Resource = aws_sfn_state_machine.content_expiration.arn
    }]
  })
}

# =============================================================================
# ATHENA
# =============================================================================

# Athena Workgroup
resource "aws_athena_workgroup" "viewing_analytics" {
  name = "${local.resource_prefix}-${var.workgroup_name}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }

  tags = local.default_tags
}

# =============================================================================
# CLOUDWATCH ALARMS
# =============================================================================

# API Gateway Latency Alarm
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${local.resource_prefix}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_latency_threshold
  alarm_description   = "API Gateway latency exceeds threshold"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }

  tags = local.default_tags
}

# Lambda Recommendations Duration Alarm (p95)
resource "aws_cloudwatch_metric_alarm" "lambda_recommendations_duration" {
  alarm_name          = "${local.resource_prefix}-lambda-recommendations-p95"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  extended_statistic  = "p95"
  threshold           = 30000 # 30 seconds
  alarm_description   = "Recommendations Lambda p95 duration exceeds threshold"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.recommendations_engine.function_name
  }

  tags = local.default_tags
}

# DynamoDB Hot Partitions Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_hot_partition" {
  alarm_name          = "${local.resource_prefix}-dynamodb-hot-partition"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = local.capacity_map[var.env].dynamodb_rcu * 300 * 0.8 # 80% of capacity
  alarm_description   = "DynamoDB table showing hot partition pattern"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    TableName = aws_dynamodb_table.user_activity.name
  }

  tags = local.default_tags
}

# Kinesis GetRecords Throttling Alarm
resource "aws_cloudwatch_metric_alarm" "kinesis_throttling" {
  alarm_name          = "${local.resource_prefix}-kinesis-throttling"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "GetRecords.UserRecordsReadRate"
  namespace           = "AWS/Kinesis"
  period              = "300"
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Kinesis GetRecords throttling detected"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    StreamName = aws_kinesis_stream.activity_stream.name
  }

  tags = local.default_tags
}

# Redis Memory Fragmentation Alarm
resource "aws_cloudwatch_metric_alarm" "redis_memory_fragmentation" {
  alarm_name          = "${local.resource_prefix}-redis-memory-fragmentation"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryFragmentationRatio"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = 1.5
  alarm_description   = "Redis memory fragmentation ratio too high"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = local.default_tags
}

# Aurora Active Transactions Alarm
resource "aws_cloudwatch_metric_alarm" "aurora_transactions" {
  alarm_name          = "${local.resource_prefix}-aurora-active-transactions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Aurora active transactions exceeds threshold"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = local.default_tags
}

# SQS Age of Oldest Message Alarm
resource "aws_cloudwatch_metric_alarm" "sqs_message_age" {
  alarm_name          = "${local.resource_prefix}-sqs-message-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = 3600 # 1 hour
  alarm_description   = "SQS message processing delayed"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.analytics_queue.name
  }

  tags = local.default_tags
}

# Step Functions Failed Executions Alarm
resource "aws_cloudwatch_metric_alarm" "step_functions_failed" {
  alarm_name          = "${local.resource_prefix}-sfn-failed-executions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Step Functions execution failed"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.content_expiration.arn
  }

  tags = local.default_tags
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "api_gateway_invoke_url" {
  description = "API Gateway invocation URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "kinesis_stream_arn" {
  description = "Kinesis stream ARN"
  value       = aws_kinesis_stream.activity_stream.arn
}

output "dynamodb_activity_table" {
  description = "DynamoDB user activity table name and ARN"
  value = {
    name = aws_dynamodb_table.user_activity.name
    arn  = aws_dynamodb_table.user_activity.arn
  }
}

output "dynamodb_recommendations_table" {
  description = "DynamoDB recommendations table name and ARN"
  value = {
    name = aws_dynamodb_table.user_recommendations.name
    arn  = aws_dynamodb_table.user_recommendations.arn
  }
}

output "dynamodb_achievements_table" {
  description = "DynamoDB achievements table name and ARN"
  value = {
    name = aws_dynamodb_table.user_achievements.name
    arn  = aws_dynamodb_table.user_achievements.arn
  }
}

output "dynamodb_catalog_table" {
  description = "DynamoDB content catalog table name and ARN"
  value = {
    name = aws_dynamodb_table.content_catalog.name
    arn  = aws_dynamodb_table.content_catalog.arn
  }
}

output "sns_topic_arns" {
  description = "SNS topic ARNs"
  value = {
    watched_complete   = aws_sns_topic.watched_complete.arn
    user_notifications = aws_sns_topic.user_notifications.arn
    cloudwatch_alarms  = aws_sns_topic.cloudwatch_alarms.arn
  }
}

output "sqs_queue_urls" {
  description = "SQS queue URLs"
  value = {
    analytics_queue    = aws_sqs_queue.analytics_queue.url
    achievements_queue = aws_sqs_queue.achievements_queue.url
  }
}

output "aurora_endpoints" {
  description = "Aurora cluster endpoints"
  value = {
    writer = aws_rds_cluster.aurora.endpoint
    reader = aws_rds_cluster.aurora.reader_endpoint
  }
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.content_expiration.arn
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value = {
    event_processor        = aws_lambda_function.event_processor.arn
    recommendations_engine = aws_lambda_function.recommendations_engine.arn
    analytics_consumer     = aws_lambda_function.analytics_consumer.arn
    achievements_consumer  = aws_lambda_function.achievements_consumer.arn
    thumbnail_processor    = aws_lambda_function.thumbnail_processor.arn
  }
}

output "s3_buckets" {
  description = "S3 bucket names"
  value = {
    archive        = aws_s3_bucket.archive.id
    thumbnails     = aws_s3_bucket.thumbnails.id
    athena_results = aws_s3_bucket.athena_results.id
  }
}

output "athena_workgroup" {
  description = "Athena workgroup name"
  value       = aws_athena_workgroup.viewing_analytics.name
}

output "vpc_info" {
  description = "VPC and networking information"
  value = {
    vpc_id             = aws_vpc.main.id
    public_subnet_ids  = aws_subnet.public[*].id
    private_subnet_ids = aws_subnet.private[*].id
    nat_gateway_ids    = aws_nat_gateway.main[*].id
  }
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    lambda = aws_security_group.lambda.id
    aurora = aws_security_group.aurora.id
    redis  = aws_security_group.redis.id
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

output "api_gateway_rest_api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.main.stage_name
}

output "aurora_cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_port" {
  description = "Aurora database port"
  value       = 5432
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}

output "redis_configuration_endpoint_address" {
  description = "Redis configuration endpoint address (for cluster mode)"
  value       = try(aws_elasticache_replication_group.redis.configuration_endpoint_address, null)
}

output "secrets_manager_secrets" {
  description = "Secrets Manager secret ARNs"
  value = {
    aurora_credentials = aws_secretsmanager_secret.aurora_credentials.arn
    redis_auth         = aws_secretsmanager_secret.redis_auth.arn
  }
}

output "kms_key_ids" {
  description = "KMS key IDs"
  value = {
    s3  = aws_kms_key.s3.id
    sns = aws_kms_key.sns.id
  }
}

output "kms_key_arns" {
  description = "KMS key ARNs"
  value = {
    s3  = aws_kms_key.s3.arn
    sns = aws_kms_key.sns.arn
  }
}

output "kinesis_stream_name" {
  description = "Kinesis stream name"
  value       = aws_kinesis_stream.activity_stream.name
}

output "lambda_function_names" {
  description = "Lambda function names"
  value = {
    event_processor        = aws_lambda_function.event_processor.function_name
    recommendations_engine = aws_lambda_function.recommendations_engine.function_name
    analytics_consumer     = aws_lambda_function.analytics_consumer.function_name
    achievements_consumer  = aws_lambda_function.achievements_consumer.function_name
    expiration_check       = aws_lambda_function.expiration_check.function_name
    expiration_update      = aws_lambda_function.expiration_update.function_name
    expiration_cleanup     = aws_lambda_function.expiration_cleanup.function_name
    thumbnail_processor    = aws_lambda_function.thumbnail_processor.function_name
  }
}

output "step_functions_state_machine_name" {
  description = "Step Functions state machine name"
  value       = aws_sfn_state_machine.content_expiration.name
}

output "eventbridge_rule_name" {
  description = "EventBridge rule name"
  value       = aws_cloudwatch_event_rule.content_expiration.name
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
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
env          = "dev"
aws_region   = "us-east-1"
project_name = "tap-stream"
owner        = "platform-team"
cost_center  = "engineering"
pr_number    = "pr7612"

# Reduced capacity for dev environment
throttle_rate_limit     = 100
throttle_burst_limit    = 200
shard_count             = 1
rcu                     = 5
wcu                     = 5
event_processor_memory  = 256
recommendations_memory  = 512
node_type               = "cache.t3.micro"
num_cache_clusters      = 1
instance_class          = "db.t4g.small"
min_capacity            = 0.5
max_capacity            = 1
backup_retention_days   = 1
log_retention_days      = 7
alarm_latency_threshold = 2000
```

## `prod.tfvars`

```hcl
env          = "prod"
aws_region   = "us-east-1"
project_name = "tap-stream"
owner        = "platform-team"
cost_center  = "engineering"
pr_number    = "pr7612"

# Full capacity for production environment
throttle_rate_limit     = 1000
throttle_burst_limit    = 2000
shard_count             = 4
rcu                     = 20
wcu                     = 20
event_processor_memory  = 1024
recommendations_memory  = 2048
node_type               = "cache.r7g.large"
num_cache_clusters      = 3
instance_class          = "db.r6g.xlarge"
min_capacity            = 2
max_capacity            = 8
backup_retention_days   = 30
log_retention_days      = 90
alarm_latency_threshold = 1000

# Production-specific settings
common_tags = {
  Compliance = "SOC2"
  DataClass  = "Sensitive"
}
```

## `staging.tfvars`

```hcl
env          = "staging"
aws_region   = "us-east-1"
project_name = "tap-stream"
owner        = "platform-team"
cost_center  = "engineering"
pr_number    = "pr7612"

# Moderate capacity for staging environment
throttle_rate_limit     = 500
throttle_burst_limit    = 1000
shard_count             = 2
rcu                     = 10
wcu                     = 10
event_processor_memory  = 512
recommendations_memory  = 1024
node_type               = "cache.t3.small"
num_cache_clusters      = 2
instance_class          = "db.t4g.medium"
min_capacity            = 1
max_capacity            = 2
backup_retention_days   = 3
log_retention_days      = 14
alarm_latency_threshold = 1500
```
