# ============================================================================
# Serverless Recommendation System - Main Infrastructure
# ============================================================================

# Data Sources
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# Variables
# ============================================================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "recommendation-system"
}

variable "kinesis_stream_shard_count" {
  description = "Number of shards for Kinesis stream"
  type        = number
  default     = 2
}

variable "kinesis_retention_hours" {
  description = "Kinesis data retention in hours"
  type        = number
  default     = 24
}

variable "user_profile_table_read_capacity" {
  description = "Read capacity for user profile table"
  type        = number
  default     = 10
}

variable "user_profile_table_write_capacity" {
  description = "Write capacity for user profile table"
  type        = number
  default     = 10
}

variable "interactions_table_read_capacity" {
  description = "Read capacity for interactions table"
  type        = number
  default     = 10
}

variable "interactions_table_write_capacity" {
  description = "Write capacity for interactions table"
  type        = number
  default     = 10
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 5000
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 2000
}

variable "retraining_schedule" {
  description = "Schedule expression for model retraining"
  type        = string
  default     = "cron(0 2 * * ? *)"
}

variable "personalize_campaign_arn" {
  description = "Amazon Personalize Campaign ARN (set via setup-personalize.sh)"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    Project     = "RecommendationSystem"
    Environment = "Production"
  }
}

# ============================================================================
# Local Variables
# ============================================================================

locals {
  account_id      = data.aws_caller_identity.current.account_id
  resource_prefix = var.project_name
  lambda_runtime  = "python3.11"
  vpc_cidr        = "10.0.0.0/16"
}

# ============================================================================
# VPC and Networking
# ============================================================================

resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-vpc"
  })
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-private-${count.index + 1}"
  })
}

resource "aws_security_group" "lambda" {
  name_prefix = "${local.resource_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Lambda functions"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-lambda-sg"
  })
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.resource_prefix}-redis-"
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

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-redis-sg"
  })
}

# ============================================================================
# S3 Bucket for Training Data
# ============================================================================

resource "aws_s3_bucket" "training_data" {
  bucket = "${local.resource_prefix}-training-data-${local.account_id}"

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-training-data"
  })
}

resource "aws_s3_bucket_versioning" "training_data" {
  bucket = aws_s3_bucket.training_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  rule {
    id     = "delete-old-training-data"
    status = "Enabled"

    filter {
      prefix = "training-data/"
    }

    expiration {
      days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# ============================================================================
# DynamoDB Tables
# ============================================================================

resource "aws_dynamodb_table" "user_profiles" {
  name           = "${local.resource_prefix}-user-profiles"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.user_profile_table_read_capacity
  write_capacity = var.user_profile_table_write_capacity
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-user-profiles"
  })
}

resource "aws_dynamodb_table" "interactions" {
  name           = "${local.resource_prefix}-interactions"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.interactions_table_read_capacity
  write_capacity = var.interactions_table_write_capacity
  hash_key       = "user_id"
  range_key      = "timestamp"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "item_id"
    type = "S"
  }

  global_secondary_index {
    name            = "ItemIndex"
    hash_key        = "item_id"
    range_key       = "timestamp"
    write_capacity  = var.interactions_table_write_capacity
    read_capacity   = var.interactions_table_read_capacity
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-interactions"
  })
}

# ============================================================================
# Kinesis Data Stream
# ============================================================================

resource "aws_kinesis_stream" "user_interactions" {
  name             = "${local.resource_prefix}-user-interactions"
  shard_count      = var.kinesis_stream_shard_count
  retention_period = var.kinesis_retention_hours

  shard_level_metrics = [
    "IncomingRecords",
    "OutgoingRecords",
    "IncomingBytes",
    "OutgoingBytes"
  ]

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  encryption_type = "KMS"
  kms_key_id      = "alias/aws/kinesis"

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-user-interactions"
  })
}

# ============================================================================
# ElastiCache Redis
# ============================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.resource_prefix}-redis"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-redis-subnet-group"
  })
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${local.resource_prefix}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-redis-params"
  })
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.resource_prefix}-redis"
  description          = "Redis cache for recommendations"
  engine               = "redis"
  node_type                     = var.redis_node_type
  num_cache_clusters            = var.redis_num_cache_nodes
  parameter_group_name          = aws_elasticache_parameter_group.redis.name
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [aws_security_group.redis.id]

  port = 6379

  at_rest_encryption_enabled = true
  transit_encryption_enabled = false

  automatic_failover_enabled = var.redis_num_cache_nodes > 1

  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-redis"
  })
}

# ============================================================================
# IAM Roles and Policies
# ============================================================================

# Lambda Stream Processor Role
resource "aws_iam_role" "lambda_stream_processor" {
  name = "${local.resource_prefix}-lambda-stream-processor"

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

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-lambda-stream-processor"
  })
}

resource "aws_iam_role_policy" "lambda_stream_processor" {
  name = "${local.resource_prefix}-lambda-stream-processor"
  role = aws_iam_role.lambda_stream_processor.id

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
        Resource = aws_kinesis_stream.user_interactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.user_profiles.arn,
          aws_dynamodb_table.interactions.arn,
          "${aws_dynamodb_table.interactions.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.training_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${local.account_id}:*"
      }
    ]
  })
}

# Lambda Recommendation API Role
resource "aws_iam_role" "lambda_recommendation_api" {
  name = "${local.resource_prefix}-lambda-recommendation-api"

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

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-lambda-recommendation-api"
  })
}

resource "aws_iam_role_policy" "lambda_recommendation_api" {
  name = "${local.resource_prefix}-lambda-recommendation-api"
  role = aws_iam_role.lambda_recommendation_api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "personalize:GetRecommendations",
          "personalize:GetPersonalizedRanking"
        ]
        Resource = "arn:aws:personalize:${var.aws_region}:${local.account_id}:campaign/*"
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${local.account_id}:*"
      }
    ]
  })
}

# Glue Job Role
resource "aws_iam_role" "glue_job" {
  name = "${local.resource_prefix}-glue-job"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "glue.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-glue-job"
  })
}

resource "aws_iam_role_policy" "glue_job" {
  name = "${local.resource_prefix}-glue-job"
  role = aws_iam_role.glue_job.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.training_data.arn,
          "${aws_s3_bucket.training_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:GetItem"
        ]
        Resource = [
          aws_dynamodb_table.user_profiles.arn,
          aws_dynamodb_table.interactions.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${local.account_id}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_service_role" {
  role       = aws_iam_role.glue_job.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

# Step Functions Role
resource "aws_iam_role" "step_functions" {
  name = "${local.resource_prefix}-step-functions"

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

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-step-functions"
  })
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${local.resource_prefix}-step-functions"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "glue:StartJobRun",
          "glue:GetJobRun",
          "glue:BatchStopJobRun"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "personalize:CreateDatasetImportJob",
          "personalize:CreateSolution",
          "personalize:CreateSolutionVersion",
          "personalize:CreateCampaign",
          "personalize:UpdateCampaign",
          "personalize:Describe*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.notifications.arn
      }
    ]
  })
}

# Personalize Role
resource "aws_iam_role" "personalize" {
  name = "${local.resource_prefix}-personalize"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "personalize.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-personalize"
  })
}

resource "aws_iam_role_policy" "personalize" {
  name = "${local.resource_prefix}-personalize"
  role = aws_iam_role.personalize.id

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
          aws_s3_bucket.training_data.arn,
          "${aws_s3_bucket.training_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.training_data.arn}/personalize-output/*"
      }
    ]
  })
}

# EventBridge Role
resource "aws_iam_role" "eventbridge_step_functions" {
  name = "${local.resource_prefix}-eventbridge-sfn"

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

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-eventbridge-sfn"
  })
}

resource "aws_iam_role_policy" "eventbridge_step_functions" {
  name = "${local.resource_prefix}-eventbridge-sfn"
  role = aws_iam_role.eventbridge_step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "states:StartExecution"
      ]
      Resource = aws_sfn_state_machine.training_pipeline.arn
    }]
  })
}

# ============================================================================
# Lambda Functions
# ============================================================================

# Stream Processor Lambda
data "archive_file" "stream_processor" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/stream_processor"
  output_path = "${path.module}/.terraform/stream_processor.zip"
}

resource "aws_lambda_function" "stream_processor" {
  filename         = data.archive_file.stream_processor.output_path
  function_name    = "${local.resource_prefix}-stream-processor"
  role             = aws_iam_role.lambda_stream_processor.arn
  handler          = "handler.lambda_handler"
  source_code_hash = data.archive_file.stream_processor.output_base64sha256
  runtime          = local.lambda_runtime
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      USER_PROFILE_TABLE = aws_dynamodb_table.user_profiles.name
      INTERACTIONS_TABLE = aws_dynamodb_table.interactions.name
      TRAINING_BUCKET    = aws_s3_bucket.training_data.id
      REGION             = var.aws_region
    }
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-stream-processor"
  })
}

resource "aws_lambda_event_source_mapping" "kinesis_trigger" {
  event_source_arn                   = aws_kinesis_stream.user_interactions.arn
  function_name                      = aws_lambda_function.stream_processor.arn
  starting_position                  = "LATEST"
  parallelization_factor             = 10
  maximum_batching_window_in_seconds = 5
  maximum_record_age_in_seconds      = 3600
  bisect_batch_on_function_error     = true
  maximum_retry_attempts             = 3
}

# Recommendation API Lambda
data "archive_file" "recommendation_api" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/recommendation_api"
  output_path = "${path.module}/.terraform/recommendation_api.zip"
}

resource "aws_lambda_function" "recommendation_api" {
  filename         = data.archive_file.recommendation_api.output_path
  function_name    = "${local.resource_prefix}-recommendation-api"
  role             = aws_iam_role.lambda_recommendation_api.arn
  handler          = "handler.lambda_handler"
  source_code_hash = data.archive_file.recommendation_api.output_base64sha256
  runtime          = local.lambda_runtime
  timeout          = 30
  memory_size      = 1024

  vpc_config {
    security_group_ids = [aws_security_group.lambda.id]
    subnet_ids         = aws_subnet.private[*].id
  }

  environment {
    variables = {
      REDIS_ENDPOINT            = aws_elasticache_replication_group.redis.primary_endpoint_address
      PERSONALIZE_REGION        = var.aws_region
      PERSONALIZE_CAMPAIGN_ARN  = var.personalize_campaign_arn
    }
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-recommendation-api"
  })
}

# ============================================================================
# AWS Glue
# ============================================================================

resource "aws_glue_job" "data_preparation" {
  name         = "${local.resource_prefix}-data-preparation"
  role_arn     = aws_iam_role.glue_job.arn
  glue_version = "4.0"

  command {
    script_location = "s3://${aws_s3_bucket.training_data.id}/scripts/prepare_data.py"
    python_version  = "3"
  }

  default_arguments = {
    "--job-bookmark-option"              = "job-bookmark-enable"
    "--enable-continuous-cloudwatch-log" = "true"
    "--enable-continuous-log-filter"     = "true"
    "--enable-metrics"                   = "true"
    "--TempDir"                          = "s3://${aws_s3_bucket.training_data.id}/temp/"
    "--SOURCE_BUCKET"                    = aws_s3_bucket.training_data.id
    "--USER_PROFILE_TABLE"               = aws_dynamodb_table.user_profiles.name
    "--INTERACTIONS_TABLE"               = aws_dynamodb_table.interactions.name
  }

  max_retries  = 1
  timeout      = 60
  max_capacity = 2.0

  execution_property {
    max_concurrent_runs = 1
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-data-preparation"
  })
}

# ============================================================================
# Amazon Personalize
# ============================================================================
# Note: Personalize resources are not fully supported in Terraform AWS provider.
# Run the setup script to create these resources via AWS CLI:
#
#   chmod +x lib/scripts/setup-personalize.sh
#   export AWS_REGION=us-east-1
#   export PROJECT_NAME=recommendation-system
#   ./lib/scripts/setup-personalize.sh
#
# The script will create:
# - Dataset Group: recommendation-system-dataset-group
# - Schema: Interactions schema with USER_ID, ITEM_ID, TIMESTAMP, EVENT_TYPE
# - Dataset: recommendation-system-interactions
# - Dataset Import Job: Imports data from S3
# - Solution: Uses aws-user-personalization recipe
# - Solution Version: Trains the ML model (takes 1-2 hours)
# - Campaign: Serves recommendations via API
#
# After setup completes, set the campaign ARN as a Terraform variable:
#   export TF_VAR_personalize_campaign_arn='<campaign-arn-from-script-output>'
#   terraform apply
#
# This will update the Lambda environment variable to use the campaign.

# ============================================================================
# Step Functions
# ============================================================================

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${local.resource_prefix}-training-pipeline"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-step-functions-logs"
  })
}

resource "aws_sfn_state_machine" "training_pipeline" {
  name     = "${local.resource_prefix}-training-pipeline"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Recommendation system training pipeline"
    StartAt = "PrepareData"
    States = {
      PrepareData = {
        Type     = "Task"
        Resource = "arn:aws:states:::glue:startJobRun.sync"
        Parameters = {
          JobName = aws_glue_job.data_preparation.name
        }
        Next = "NotifySuccess"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "NotifyFailure"
        }]
      }
      NotifySuccess = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.notifications.arn
          Message  = "Training pipeline completed successfully"
          Subject  = "Recommendation System - Training Complete"
        }
        End = true
      }
      NotifyFailure = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.notifications.arn
          Message  = "Training pipeline failed"
          Subject  = "Recommendation System - Training Failed"
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

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-training-pipeline"
  })
}

# ============================================================================
# API Gateway
# ============================================================================

resource "aws_api_gateway_rest_api" "recommendation_api" {
  name        = "${local.resource_prefix}-api"
  description = "Recommendation System API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-api"
  })
}

resource "aws_api_gateway_resource" "recommendations" {
  rest_api_id = aws_api_gateway_rest_api.recommendation_api.id
  parent_id   = aws_api_gateway_rest_api.recommendation_api.root_resource_id
  path_part   = "recommendations"
}

resource "aws_api_gateway_method" "get_recommendations" {
  rest_api_id   = aws_api_gateway_rest_api.recommendation_api.id
  resource_id   = aws_api_gateway_resource.recommendations.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.recommendation_api.id
  resource_id = aws_api_gateway_resource.recommendations.id
  http_method = aws_api_gateway_method.get_recommendations.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.recommendation_api.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.recommendation_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.recommendation_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.recommendation_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.recommendations.id,
      aws_api_gateway_method.get_recommendations.id,
      aws_api_gateway_integration.lambda_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.recommendation_api.id
  stage_name    = var.api_stage_name

  xray_tracing_enabled = true

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-${var.api_stage_name}"
  })
}

resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.recommendation_api.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
  }
}

# ============================================================================
# EventBridge Scheduling
# ============================================================================

resource "aws_cloudwatch_event_rule" "retraining_schedule" {
  name                = "${local.resource_prefix}-retraining-schedule"
  description         = "Trigger model retraining pipeline"
  schedule_expression = var.retraining_schedule

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-retraining-schedule"
  })
}

resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.retraining_schedule.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.training_pipeline.arn
  role_arn  = aws_iam_role.eventbridge_step_functions.arn
}

# ============================================================================
# SNS Notifications
# ============================================================================

resource "aws_sns_topic" "notifications" {
  name = "${local.resource_prefix}-notifications"

  kms_master_key_id = "alias/aws/sns"

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-notifications"
  })
}

# ============================================================================
# CloudWatch Monitoring
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "kinesis_incoming_records" {
  alarm_name          = "${local.resource_prefix}-kinesis-incoming-records"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "IncomingRecords"
  namespace           = "AWS/Kinesis"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Alert when incoming records drop below threshold"
  alarm_actions       = [aws_sns_topic.notifications.arn]

  dimensions = {
    StreamName = aws_kinesis_stream.user_interactions.name
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-kinesis-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.resource_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert on Lambda function errors"
  alarm_actions       = [aws_sns_topic.notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.stream_processor.function_name
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-lambda-errors-alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${local.resource_prefix}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Alert on high API latency"
  alarm_actions       = [aws_sns_topic.notifications.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.recommendation_api.name
    Stage   = var.api_stage_name
  }

  tags = merge(var.common_tags, {
    Name = "${local.resource_prefix}-api-latency-alarm"
  })
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.resource_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Kinesis", "IncomingRecords", { stat = "Sum", label = "Incoming Records" }],
            [".", "IncomingBytes", { stat = "Sum", label = "Incoming Bytes", yAxis = "right" }]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "Kinesis Stream Metrics"
          period  = 300
          stacked = false
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum", color = "#d62728" }],
            [".", "Duration", { stat = "Average", yAxis = "right" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "Lambda Function Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "API Calls" }],
            [".", "Latency", { stat = "Average", yAxis = "right" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "API Gateway Metrics"
          period = 300
        }
      }
    ]
  })
}

# ============================================================================
# Outputs
# ============================================================================

output "api_gateway_url" {
  description = "API Gateway URL for recommendations"
  value       = "${aws_api_gateway_stage.main.invoke_url}/recommendations"
}

output "kinesis_stream_arn" {
  description = "Kinesis stream ARN for data ingestion"
  value       = aws_kinesis_stream.user_interactions.arn
}

output "s3_training_bucket" {
  description = "S3 bucket for training data"
  value       = aws_s3_bucket.training_data.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = aws_sns_topic.notifications.arn
}

output "dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.training_pipeline.arn
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}
