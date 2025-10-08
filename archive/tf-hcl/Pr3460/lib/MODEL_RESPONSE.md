# ===================================================
# High-Performance Advertising Exchange Infrastructure
# ===================================================
# Processes 50M bid requests/min with <100ms p99 latency
# Real-time fraud detection and budget management

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# ===================================================
# Variables
# ===================================================

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "api_auth_settings" {
  description = "API Gateway authorization settings"
  type = object({
    jwt_issuer   = string
    jwt_audience = list(string)
  })
  default = {
    jwt_issuer   = "https://auth.adexchange.com"
    jwt_audience = ["api.adexchange.com"]
  }
}

variable "dynamodb_table_prefix" {
  description = "Prefix for DynamoDB table names"
  type        = string
  default     = "adex"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r7g.xlarge"
}

variable "kinesis_shard_count" {
  description = "Number of Kinesis shards"
  type        = number
  default     = 1000
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "adexchange"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "prod"
    Service     = "AdExchange"
    Owner       = "Platform"
    CostCenter  = "Engineering"
  }
}

# ===================================================
# Provider Configuration
# ===================================================

provider "aws" {
  region = var.region
}

# ===================================================
# Data Sources
# ===================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ===================================================
# KMS Keys for Encryption
# ===================================================

# Master KMS key for all encryption
resource "aws_kms_key" "master" {
  description             = "Master key for AdExchange encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = var.tags
}

resource "aws_kms_alias" "master" {
  name          = "alias/adexchange-${var.environment}"
  target_key_id = aws_kms_key.master.key_id
}

# ===================================================
# VPC and Networking
# ===================================================

# VPC for private resources
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(var.tags, { Name = "adexchange-${var.environment}" })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "adexchange-${var.environment}" })
}

# Private subnets for Lambda, ElastiCache, etc.
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = merge(var.tags, { Name = "adexchange-private-${count.index + 1}" })
}

# Public subnets for NAT Gateways
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 101}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = merge(var.tags, { Name = "adexchange-public-${count.index + 1}" })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"
  tags   = merge(var.tags, { Name = "adexchange-nat-${count.index + 1}" })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags          = merge(var.tags, { Name = "adexchange-nat-${count.index + 1}" })
}

# Route tables
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "adexchange-private-${count.index + 1}" })
}

resource "aws_route" "private_nat" {
  count                  = 3
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ===================================================
# S3 Buckets
# ===================================================

# Bucket for bid data and logs
resource "aws_s3_bucket" "bid_data" {
  bucket = "${var.s3_bucket_prefix}-bid-data-${data.aws_caller_identity.current.account_id}"
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "bid_data" {
  bucket = aws_s3_bucket.bid_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "bid_data" {
  bucket = aws_s3_bucket.bid_data.id
  name   = "EntireBucket"
  
  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }
  
  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bid_data" {
  bucket = aws_s3_bucket.bid_data.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.master.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# ===================================================
# IAM Roles and Policies
# ===================================================

# Lambda execution role for bid processing
resource "aws_iam_role" "lambda_bid_processor" {
  name = "adexchange-lambda-bid-processor-${var.environment}"
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
  tags = var.tags
}

# Policy for bid processor Lambda
resource "aws_iam_role_policy" "lambda_bid_processor" {
  name = "bid-processor-policy"
  role = aws_iam_role.lambda_bid_processor.id

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
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.budgets.arn,
          aws_dynamodb_table.campaigns.arn,
          "${aws_dynamodb_table.budgets.arn}/index/*",
          "${aws_dynamodb_table.campaigns.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dax:GetItem",
          "dax:BatchGetItem",
          "dax:Query"
        ]
        Resource = aws_dax_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = aws_kinesis_stream.bid_stream.arn
      },
      {
        Effect = "Allow"
        Action = [
          "frauddetector:GetEventPrediction"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
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
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"
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
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.dsp_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.master.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_insights" {
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy"
  role       = aws_iam_role.lambda_bid_processor.name
}

# Step Functions execution role
resource "aws_iam_role" "step_functions" {
  name = "adexchange-stepfunctions-${var.environment}"
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
  tags = var.tags
}

resource "aws_iam_role_policy" "step_functions" {
  name = "step-functions-policy"
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
          aws_lambda_function.bid_processor.arn,
          aws_lambda_function.bid_evaluator.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets"
        ]
        Resource = "*"
      }
    ]
  })
}

# ===================================================
# Secrets Manager
# ===================================================

# DSP credentials storage
resource "aws_secretsmanager_secret" "dsp_credentials" {
  name                    = "adexchange/dsp-credentials/${var.environment}"
  description             = "DSP integration credentials"
  kms_key_id              = aws_kms_key.master.id
  recovery_window_in_days = 7
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "dsp_credentials" {
  secret_id = aws_secretsmanager_secret.dsp_credentials.id
  secret_string = jsonencode({
    dsp1 = {
      api_key = "placeholder"
      endpoint = "https://dsp1.example.com"
    }
  })
}

# ===================================================
# DynamoDB Tables
# ===================================================

# Advertiser budgets table
resource "aws_dynamodb_table" "budgets" {
  name             = "${var.dynamodb_table_prefix}_budgets_${var.environment}"
  billing_mode     = "ON_DEMAND"
  hash_key         = "advertiser_id"
  range_key        = "campaign_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "advertiser_id"
    type = "S"
  }
  
  attribute {
    name = "campaign_id"
    type = "S"
  }
  
  attribute {
    name = "budget_period"
    type = "S"
  }
  
  global_secondary_index {
    name            = "budget-period-index"
    hash_key        = "budget_period"
    range_key       = "campaign_id"
    projection_type = "ALL"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.master.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = var.tags
}

# Campaign metadata table
resource "aws_dynamodb_table" "campaigns" {
  name             = "${var.dynamodb_table_prefix}_campaigns_${var.environment}"
  billing_mode     = "ON_DEMAND"
  hash_key         = "campaign_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "campaign_id"
    type = "S"
  }
  
  attribute {
    name = "advertiser_id"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  global_secondary_index {
    name            = "advertiser-index"
    hash_key        = "advertiser_id"
    range_key       = "status"
    projection_type = "ALL"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.master.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = var.tags
}

# ===================================================
# DAX Cluster for Sub-millisecond Access
# ===================================================

# DAX subnet group
resource "aws_dax_subnet_group" "main" {
  name       = "adexchange-dax-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
}

# DAX cluster
resource "aws_dax_cluster" "main" {
  cluster_name       = "adexchange-${var.environment}"
  iam_role_arn       = aws_iam_role.dax.arn
  node_type          = "dax.r5.large"
  replication_factor = 3
  subnet_group_name  = aws_dax_subnet_group.main.name
  security_group_ids = [aws_security_group.dax.id]
  
  server_side_encryption {
    enabled = true
  }
  
  tags = var.tags
}

# IAM role for DAX
resource "aws_iam_role" "dax" {
  name = "adexchange-dax-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "dax.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "dax" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess"
  role       = aws_iam_role.dax.name
}

# Security group for DAX
resource "aws_security_group" "dax" {
  name_prefix = "adexchange-dax-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 8111
    to_port     = 8111
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = var.tags
}

# ===================================================
# ElastiCache Redis Cluster for Frequency Capping
# ===================================================

# Redis subnet group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "adexchange-redis-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
  tags       = var.tags
}

# Redis parameter group for cluster mode
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "adexchange-redis-${var.environment}"
  
  parameter {
    name  = "cluster-enabled"
    value = "yes"
  }
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  parameter {
    name  = "timeout"
    value = "300"
  }
  
  tags = var.tags
}

# Redis replication group (cluster mode enabled)
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "adexchange-${var.environment}"
  description                = "Redis cluster for frequency capping"
  node_type                  = var.redis_node_type
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  num_node_groups            = 3
  replicas_per_node_group    = 2
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  kms_key_id                 = aws_kms_key.master.arn
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }
  
  tags = var.tags
}

# CloudWatch log groups for Redis
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/adexchange-${var.environment}/slow"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.master.arn
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "redis_engine" {
  name              = "/aws/elasticache/adexchange-${var.environment}/engine"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.master.arn
  tags              = var.tags
}

# Security group for Redis
resource "aws_security_group" "redis" {
  name_prefix = "adexchange-redis-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = var.tags
}

# ===================================================
# Lambda Functions
# ===================================================

# Lambda layer for Rust runtime and dependencies
resource "aws_lambda_layer_version" "rust_runtime" {
  filename            = "rust-runtime.zip"  # Placeholder - would be built in CI/CD
  layer_name          = "adexchange-rust-runtime"
  compatible_runtimes = ["provided.al2"]
  
  lifecycle {
    ignore_changes = [filename]
  }
}

# Bid processor Lambda (Rust)
resource "aws_lambda_function" "bid_processor" {
  filename         = "bid-processor.zip"  # Placeholder - would be built in CI/CD
  function_name    = "adexchange-bid-processor-${var.environment}"
  role             = aws_iam_role.lambda_bid_processor.arn
  handler          = "bootstrap"
  runtime          = "provided.al2"
  memory_size      = 3008
  timeout          = 100
  architectures    = ["arm64"]
  
  reserved_concurrent_executions = 10000
  
  environment {
    variables = {
      DYNAMODB_BUDGETS_TABLE = aws_dynamodb_table.budgets.name
      DYNAMODB_CAMPAIGNS_TABLE = aws_dynamodb_table.campaigns.name
      DAX_ENDPOINT = aws_dax_cluster.main.cluster_address
      REDIS_ENDPOINT = aws_elasticache_replication_group.redis.configuration_endpoint_address
      KINESIS_STREAM_NAME = aws_kinesis_stream.bid_stream.name
      FRAUD_DETECTOR_NAME = aws_frauddetector_detector.bid_fraud.id
      ENVIRONMENT = var.environment
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  layers = [
    aws_lambda_layer_version.rust_runtime.arn,
    "arn:aws:lambda:${var.region}:580247275435:layer:LambdaInsightsExtension-Arm64:2"
  ]
  
  tracing_config {
    mode = "Active"
  }
  
  lifecycle {
    ignore_changes = [filename]
  }
  
  tags = var.tags
}

# Provisioned concurrency for bid processor
resource "aws_lambda_provisioned_concurrency_config" "bid_processor" {
  function_name                     = aws_lambda_function.bid_processor.function_name
  provisioned_concurrent_executions = 1000
  qualifier                         = aws_lambda_function.bid_processor.version
  
  lifecycle {
    ignore_changes = [qualifier]
  }
}

# Bid evaluator Lambda
resource "aws_lambda_function" "bid_evaluator" {
  filename         = "bid-evaluator.zip"  # Placeholder
  function_name    = "adexchange-bid-evaluator-${var.environment}"
  role             = aws_iam_role.lambda_bid_processor.arn
  handler          = "bootstrap"
  runtime          = "provided.al2"
  memory_size      = 1024
  timeout          = 50
  architectures    = ["arm64"]
  
  environment {
    variables = {
      DSP_SECRETS_ARN = aws_secretsmanager_secret.dsp_credentials.arn
      ENVIRONMENT = var.environment
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  layers = [
    "arn:aws:lambda:${var.region}:580247275435:layer:LambdaInsightsExtension-Arm64:2"
  ]
  
  tracing_config {
    mode = "Active"
  }
  
  lifecycle {
    ignore_changes = [filename]
  }
  
  tags = var.tags
}

# Security group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "adexchange-lambda-"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = var.tags
}

# ===================================================
# API Gateway
# ===================================================

# REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "adexchange-${var.environment}"
  description = "Ad Exchange Bid API"
  
  endpoint_configuration {
    types = ["EDGE"]
  }
  
  tags = var.tags
}

# Custom authorizer Lambda
resource "aws_lambda_function" "api_authorizer" {
  filename         = "api-authorizer.zip"  # Placeholder
  function_name    = "adexchange-api-authorizer-${var.environment}"
  role             = aws_iam_role.api_authorizer.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 3
  
  environment {
    variables = {
      JWT_ISSUER   = var.api_auth_settings.jwt_issuer
      JWT_AUDIENCE = jsonencode(var.api_auth_settings.jwt_audience)
    }
  }
  
  lifecycle {
    ignore_changes = [filename]
  }
  
  tags = var.tags
}

resource "aws_iam_role" "api_authorizer" {
  name = "adexchange-api-authorizer-${var.environment}"
  
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
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "api_authorizer" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.api_authorizer.name
}

# API Gateway authorizer
resource "aws_api_gateway_authorizer" "main" {
  name                   = "jwt-authorizer"
  rest_api_id            = aws_api_gateway_rest_api.main.id
  authorizer_uri         = aws_lambda_function.api_authorizer.invoke_arn
  authorizer_credentials = aws_iam_role.api_gateway.arn
  type                   = "TOKEN"
  identity_source        = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 300
}

# IAM role for API Gateway
resource "aws_iam_role" "api_gateway" {
  name = "adexchange-api-gateway-${var.environment}"
  
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
  
  tags = var.tags
}

resource "aws_iam_role_policy" "api_gateway" {
  name = "api-gateway-policy"
  role = aws_iam_role.api_gateway.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = [
          aws_lambda_function.api_authorizer.arn,
          aws_lambda_function.bid_processor.arn
        ]
      },
      {
        Effect = "Allow"
        Action = "states:StartExecution"
        Resource = aws_sfn_state_machine.auction.arn
      }
    ]
  })
}

# Bid endpoint
resource "aws_api_gateway_resource" "bid" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "bid"
}

resource "aws_api_gateway_method" "bid_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.bid.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.main.id
  
  request_parameters = {
    "method.request.header.X-Request-ID" = true
  }
}

# Lambda permission for authorizer
resource "aws_lambda_permission" "api_authorizer" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Integration with Step Functions
resource "aws_api_gateway_integration" "bid_stepfunctions" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.bid.id
  http_method = aws_api_gateway_method.bid_post.http_method
  
  integration_http_method = "POST"
  type                    = "AWS"
  uri                     = "arn:aws:apigateway:${var.region}:states:action/StartExecution"
  credentials             = aws_iam_role.api_gateway.arn
  
  request_templates = {
    "application/json" = jsonencode({
      stateMachineArn = aws_sfn_state_machine.auction.arn
      input = "$util.escapeJavaScript($input.body)"
    })
  }
}

# API deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.bid.id,
      aws_api_gateway_method.bid_post.id,
      aws_api_gateway_integration.bid_stepfunctions.id,
    ]))
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment
  
  xray_tracing_enabled = true
  
  cache_cluster_enabled = true
  cache_cluster_size    = "6.1"
  
  tags = var.tags
}

# ===================================================
# WAF for API Protection
# ===================================================

resource "aws_wafv2_web_acl" "api" {
  name  = "adexchange-api-${var.environment}"
  scope = "CLOUDFRONT"
  
  provider = aws.us-east-1  # WAF for CloudFront must be in us-east-1
  
  default_action {
    allow {}
  }
  
  # Per-advertiser rate limiting rule
  rule {
    name     = "RateLimitPerAdvertiser"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 10000
        aggregate_key_type = "IP"
        
        scope_down_statement {
          byte_match_statement {
            search_string = "advertiser"
            field_to_match {
              single_header {
                name = "x-advertiser-id"
              }
            }
            text_transformation {
              priority = 0
              type     = "NONE"
            }
            positional_constraint = "CONTAINS"
          }
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitPerAdvertiser"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "adexchange-api"
    sampled_requests_enabled   = true
  }
  
  tags = var.tags
}

# Separate provider for us-east-1 (required for WAF with CloudFront)
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

# ===================================================
# Step Functions for Auction Workflow
# ===================================================

resource "aws_sfn_state_machine" "auction" {
  name     = "adexchange-auction-${var.environment}"
  role_arn = aws_iam_role.step_functions.arn
  type     = "EXPRESS"
  
  definition = jsonencode({
    Comment = "Parallel auction workflow for bid processing"
    StartAt = "ValidateBid"
    States = {
      ValidateBid = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.bid_processor.arn
          Payload = {
            "Input.$" = "$"
            "Action" = "VALIDATE"
          }
        }
        ResultPath = "$.validation"
        Next = "CheckValidation"
        Retry = [{
          ErrorEquals = ["States.TaskFailed"]
          IntervalSeconds = 1
          MaxAttempts = 2
          BackoffRate = 2
        }]
      }
      CheckValidation = {
        Type = "Choice"
        Choices = [{
          Variable = "$.validation.isValid"
          BooleanEquals = true
          Next = "ParallelAuction"
        }]
        Default = "BidRejected"
      }
      ParallelAuction = {
        Type = "Parallel"
        Next = "SelectWinner"
        Branches = [
          {
            StartAt = "DSP1Bid"
            States = {
              DSP1Bid = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.bid_evaluator.arn
                  Payload = {
                    "Input.$" = "$"
                    "DSP" = "DSP1"
                  }
                }
                End = true
                Catch = [{
                  ErrorEquals = ["States.ALL"]
                  Next = "DSP1Failed"
                }]
              }
              DSP1Failed = {
                Type = "Pass"
                Result = {
                  bid = 0
                  dsp = "DSP1"
                  error = true
                }
                End = true
              }
            }
          },
          {
            StartAt = "DSP2Bid"
            States = {
              DSP2Bid = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.bid_evaluator.arn
                  Payload = {
                    "Input.$" = "$"
                    "DSP" = "DSP2"
                  }
                }
                End = true
                Catch = [{
                  ErrorEquals = ["States.ALL"]
                  Next = "DSP2Failed"
                }]
              }
              DSP2Failed = {
                Type = "Pass"
                Result = {
                  bid = 0
                  dsp = "DSP2"
                  error = true
                }
                End = true
              }
            }
          }
        ]
      }
      SelectWinner = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.bid_processor.arn
          Payload = {
            "Bids.$" = "$"
            "Action" = "SELECT_WINNER"
          }
        }
        Next = "UpdateBudget"
      }
      UpdateBudget = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.bid_processor.arn
          Payload = {
            "Winner.$" = "$"
            "Action" = "UPDATE_BUDGET"
          }
        }
        End = true
      }
      BidRejected = {
        Type = "Fail"
        Cause = "Bid validation failed"
      }
    }
  })
  
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.stepfunctions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }
  
  tracing_configuration {
    enabled = true
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "stepfunctions" {
  name              = "/aws/stepfunctions/adexchange-auction-${var.environment}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.master.arn
  tags              = var.tags
}

# ===================================================
# Kinesis Data Streams
# ===================================================

# Main bid stream with enhanced fanout
resource "aws_kinesis_stream" "bid_stream" {
  name             = "adexchange-bids-${var.environment}"
  shard_count      = var.kinesis_shard_count
  retention_period = 168  # 7 days
  
  shard_level_metrics = [
    "IncomingBytes",
    "IncomingRecords",
    "OutgoingBytes",
    "OutgoingRecords",
  ]
  
  stream_mode_details {
    stream_mode = "PROVISIONED"
  }
  
  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.master.id
  
  tags = var.tags
}

# Enhanced fanout consumer for analytics
resource "aws_kinesis_stream_consumer" "analytics" {
  name       = "analytics-consumer"
  stream_arn = aws_kinesis_stream.bid_stream.arn
}

# Kinesis Analytics application
resource "aws_kinesisanalyticsv2_application" "bid_analytics" {
  name                   = "adexchange-bid-analytics-${var.environment}"
  runtime_environment    = "FLINK-1_15"
  service_execution_role = aws_iam_role.kinesis_analytics.arn
  
  application_configuration {
    application_code_configuration {
      code_content {
        text_content = file("flink-app.java")  # Placeholder
      }
      code_content_type = "PLAINTEXT"
    }
    
    environment_properties {
      property_group {
        property_group_id = "kinesis.analytics.flink.run.options"
        property_map = {
          "python"                = "python3"
          "jarfile"               = "bid-analytics.jar"
          "parallelism"           = "4"
          "parallelism.default"   = "4"
        }
      }
    }
    
    application_snapshot_configuration {
      snapshots_enabled = true
    }
    
    vpc_configuration {
      security_group_ids = [aws_security_group.kinesis_analytics.id]
      subnet_ids         = aws_subnet.private[*].id
    }
  }
  
  tags = var.tags
}

# IAM role for Kinesis Analytics
resource "aws_iam_role" "kinesis_analytics" {
  name = "adexchange-kinesis-analytics-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "kinesisanalytics.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy" "kinesis_analytics" {
  name = "kinesis-analytics-policy"
  role = aws_iam_role.kinesis_analytics.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:ListShards",
          "kinesis:SubscribeToShard",
          "kinesis:RegisterStreamConsumer"
        ]
        Resource = aws_kinesis_stream.bid_stream.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = "*"  # Output streams
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.master.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeDhcpOptions"
        ]
        Resource = "*"
      }
    ]
  })
}

# Security group for Kinesis Analytics
resource "aws_security_group" "kinesis_analytics" {
  name_prefix = "adexchange-kinesis-analytics-"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = var.tags
}

# Kinesis Firehose for archival
resource "aws_kinesis_firehose_delivery_stream" "bid_archive" {
  name        = "adexchange-bid-archive-${var.environment}"
  destination = "extended_s3"
  
  kinesis_source_configuration {
    kinesis_stream_arn = aws_kinesis_stream.bid_stream.arn
    role_arn           = aws_iam_role.firehose.arn
  }
  
  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose.arn
    bucket_arn = aws_s3_bucket.bid_data.arn
    prefix     = "bids/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/"
    
    buffer_size         = 128
    buffer_interval     = 60
    compression_format  = "GZIP"
    
    dynamic_partitioning_configuration {
      enabled = true
    }
    
    processing_configuration {
      enabled = true
      processors {
        type = "Lambda"
        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = aws_lambda_function.firehose_processor.arn
        }
      }
    }
    
    data_format_conversion_configuration {
      enabled = true
      output_format_configuration {
        serializer {
          parquet_ser_de {}
        }
      }
      schema_configuration {
        database_name = aws_glue_catalog_database.bid_data.name
        table_name    = aws_glue_catalog_table.bids.name
      }
    }
  }
  
  tags = var.tags
}

# Lambda for Firehose processing
resource "aws_lambda_function" "firehose_processor" {
  filename      = "firehose-processor.zip"  # Placeholder
  function_name = "adexchange-firehose-processor-${var.environment}"
  role          = aws_iam_role.firehose_processor.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 60
  
  lifecycle {
    ignore_changes = [filename]
  }
  
  tags = var.tags
}

# IAM roles for Firehose
resource "aws_iam_role" "firehose" {
  name = "adexchange-firehose-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "firehose.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy" "firehose" {
  name = "firehose-policy"
  role = aws_iam_role.firehose.id
  
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
        Resource = aws_kinesis_stream.bid_stream.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.bid_data.arn,
          "${aws_s3_bucket.bid_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.master.arn
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.firehose_processor.arn
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetTable",
          "glue:GetTableVersion",
          "glue:GetTableVersions"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "firehose_processor" {
  name = "adexchange-firehose-processor-${var.environment}"
  
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
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "firehose_processor" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.firehose_processor.name
}

# ===================================================
# Glue Catalog for Data Lake
# ===================================================

resource "aws_glue_catalog_database" "bid_data" {
  name = "adexchange_${var.environment}"
  
  description = "Ad Exchange bid data catalog"
}

resource "aws_glue_catalog_table" "bids" {
  name          = "bids"
  database_name = aws_glue_catalog_database.bid_data.name
  
  table_type = "EXTERNAL_TABLE"
  
  parameters = {
    "classification"      = "parquet"
    "compressionType"     = "gzip"
    "projection.enabled"  = "true"
    "projection.year.type"   = "integer"
    "projection.year.range"  = "2023,2030"
    "projection.month.type"  = "integer"
    "projection.month.range" = "1,12"
    "projection.day.type"    = "integer"
    "projection.day.range"   = "1,31"
  }
  
  storage_descriptor {
    location      = "s3://${aws_s3_bucket.bid_data.id}/bids/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"
    
    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }
    
    columns {
      name = "bid_id"
      type = "string"
    }
    columns {
      name = "timestamp"
      type = "timestamp"
    }
    columns {
      name = "advertiser_id"
      type = "string"
    }
    columns {
      name = "campaign_id"
      type = "string"
    }
    columns {
      name = "bid_amount"
      type = "double"
    }
    columns {
      name = "win"
      type = "boolean"
    }
    columns {
      name = "fraud_score"
      type = "double"
    }
  }
}

# ===================================================
# Redshift Serverless for Analytics
# ===================================================

# Redshift subnet group
resource "aws_redshift_subnet_group" "main" {
  name       = "adexchange-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
  
  tags = var.tags
}

# Redshift namespace
resource "aws_redshiftserverless_namespace" "main" {
  namespace_name      = "adexchange-${var.environment}"
  db_name             = "adexchange"
  admin_username      = "admin"
  admin_user_password = random_password.redshift.result
  kms_key_id          = aws_kms_key.master.id
  
  tags = var.tags
}

resource "random_password" "redshift" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "redshift_password" {
  name                    = "adexchange/redshift-password/${var.environment}"
  description             = "Redshift admin password"
  kms_key_id              = aws_kms_key.master.id
  recovery_window_in_days = 7
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "redshift_password" {
  secret_id     = aws_secretsmanager_secret.redshift_password.id
  secret_string = random_password.redshift.result
}

# Redshift workgroup
resource "aws_redshiftserverless_workgroup" "main" {
  namespace_name = aws_redshiftserverless_namespace.main.namespace_name
  workgroup_name = "adexchange-${var.environment}"
  base_capacity  = 128
  
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.redshift.id]
  
  config_parameter {
    parameter_key   = "enable_user_activity_logging"
    parameter_value = "true"
  }
  
  config_parameter {
    parameter_key   = "require_ssl"
    parameter_value = "true"
  }
  
  tags = var.tags
}

# Security group for Redshift
resource "aws_security_group" "redshift" {
  name_prefix = "adexchange-redshift-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 5439
    to_port     = 5439
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = var.tags
}

# ===================================================
# QuickSight
# ===================================================

resource "aws_quicksight_data_source" "redshift" {
  data_source_id = "adexchange-redshift-${var.environment}"
  name           = "AdExchange Redshift"
  type           = "REDSHIFT"
  
  parameters {
    redshift {
      host       = aws_redshiftserverless_workgroup.main.endpoint[0].address
      port       = 5439
      database   = "adexchange"
      cluster_id = aws_redshiftserverless_workgroup.main.workgroup_name
    }
  }
  
  credentials {
    credential_pair {
      username = "admin"
      password = random_password.redshift.result
    }
  }
  
  vpc_connection_properties {
    vpc_connection_arn = aws_quicksight_vpc_connection.main.arn
  }
  
  ssl_properties {
    disable_ssl = false
  }
}

resource "aws_quicksight_vpc_connection" {
  vpc_connection_id = "adexchange-${var.environment}"
  name              = "AdExchange VPC"
  subnet_ids        = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.quicksight.id]
  role_arn          = aws_iam_role.quicksight.arn
  
  tags = var.tags
}

# Security group for QuickSight
resource "aws_security_group" "quicksight" {
  name_prefix = "adexchange-quicksight-"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = var.tags
}

# IAM role for QuickSight
resource "aws_iam_role" "quicksight" {
  name = "adexchange-quicksight-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "quicksight.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

# ===================================================
# Fraud Detector
# ===================================================

resource "aws_frauddetector_detector" "bid_fraud" {
  detector_id = "adexchange_bid_fraud_${var.environment}"
  description = "Fraud detection for bid requests"
  
  event_type_name = "bid_request"
  
  rule {
    detector_id = "adexchange_bid_fraud_${var.environment}"
    rule_id     = "high_risk_rule"
    expression  = "$fraud_score > 0.7"
    language    = "DETECTORPL"
    
    outcome {
      name = "block"
    }
  }
  
  rule {
    detector_id = "adexchange_bid_fraud_${var.environment}"
    rule_id     = "medium_risk_rule"
    expression  = "$fraud_score > 0.5 and $fraud_score <= 0.7"
    language    = "DETECTORPL"
    
    outcome {
      name = "review"
    }
  }
  
  rule {
    detector_id = "adexchange_bid_fraud_${var.environment}"
    rule_id     = "low_risk_rule"
    expression  = "$fraud_score <= 0.5"
    language    = "DETECTORPL"
    
    outcome {
      name = "approve"
    }
  }
  
  tags = var.tags
}

# ===================================================
# EventBridge for Campaign Events
# ===================================================

resource "aws_cloudwatch_event_bus" "campaigns" {
  name = "adexchange-campaigns-${var.environment}"
  tags = var.tags
}

resource "aws_cloudwatch_event_rule" "campaign_lifecycle" {
  name           = "campaign-lifecycle-${var.environment}"
  description    = "Campaign lifecycle events"
  event_bus_name = aws_cloudwatch_event_bus.campaigns.name
  
  event_pattern = jsonencode({
    source = ["adexchange.campaigns"]
    detail-type = [
      "Campaign Created",
      "Campaign Updated",
      "Campaign Paused",
      "Campaign Resumed",
      "Campaign Completed"
    ]
  })
  
  tags = var.tags
}

# ===================================================
# SNS Topics and SQS Queues
# ===================================================

# SNS topic for budget alerts
resource "aws_sns_topic" "budget_alerts" {
  name              = "adexchange-budget-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.master.id
  
  tags = var.tags
}

resource "aws_sns_topic_subscription" "budget_alerts_email" {
  topic_arn = aws_sns_topic.budget_alerts.arn
  protocol  = "email"
  endpoint  = "alerts@adexchange.com"  