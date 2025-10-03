# main.tf
# AWS Region Migration Infrastructure for Serverless Application
# Migration from us-west-1 to us-west-2

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ===================================================
# Provider Configuration - Dual Region Setup
# ===================================================

# Source region (us-west-1) - for reading existing resources during migration
provider "aws" {
  alias  = "source"
  region = var.source_region
}

# Target region (us-west-2) - for creating new resources
provider "aws" {
  alias  = "target"
  region = var.target_region
}

# Default provider (target region)
provider "aws" {
  region = var.target_region
}

# ===================================================
# Data Sources - Account Information
# ===================================================

data "aws_caller_identity" "current" {}
data "aws_region" "target" {}
data "aws_availability_zones" "target" {
  state = "available"
}

# ===================================================
# KMS Keys for Encryption
# ===================================================

resource "aws_kms_key" "master" {
  description             = "Master key for serverless app encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name = "serverless-app-master-key"
  })
}

resource "aws_kms_alias" "master" {
  name          = "alias/serverless-app-${var.environment}"
  target_key_id = aws_kms_key.master.key_id
}

# ===================================================
# VPC and Networking - Preserved from us-west-1
# ===================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "serverless-app-vpc-${var.environment}"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "serverless-app-igw-${var.environment}"
  })
}

# Private subnets for Lambda, ElastiCache, etc.
resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone = data.aws_availability_zones.target.names[count.index]

  tags = merge(var.common_tags, {
    Name = "serverless-app-private-${count.index + 1}"
  })
}

# Public subnets for NAT Gateways
resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 101)
  availability_zone       = data.aws_availability_zones.target.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "serverless-app-public-${count.index + 1}"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.az_count
  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "serverless-app-nat-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.az_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "serverless-app-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route tables for private subnets
resource "aws_route_table" "private" {
  count  = var.az_count
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "serverless-app-private-rt-${count.index + 1}"
  })
}

resource "aws_route" "private_nat" {
  count                  = var.az_count
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "serverless-app-public-rt"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ===================================================
# Security Groups
# ===================================================

# Lambda security group
resource "aws_security_group" "lambda" {
  name_prefix = "serverless-app-lambda-"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.common_tags, {
    Name = "serverless-app-lambda-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# DynamoDB VPC endpoint security group
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "serverless-app-vpce-"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "HTTPS from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.common_tags, {
    Name = "serverless-app-vpce-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ElastiCache Redis security group
resource "aws_security_group" "redis" {
  name_prefix = "serverless-app-redis-"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Redis from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.common_tags, {
    Name = "serverless-app-redis-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# DAX security group
resource "aws_security_group" "dax" {
  name_prefix = "serverless-app-dax-"
  description = "Security group for DAX cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8111
    to_port         = 8111
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "DAX from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.common_tags, {
    Name = "serverless-app-dax-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ===================================================
# VPC Endpoints
# ===================================================

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.target_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = merge(var.common_tags, {
    Name = "serverless-app-dynamodb-endpoint"
  })
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.target_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = merge(var.common_tags, {
    Name = "serverless-app-s3-endpoint"
  })
}

# ===================================================
# S3 Buckets
# ===================================================

resource "aws_s3_bucket" "data" {
  bucket = "${var.s3_bucket_prefix}-data-${data.aws_caller_identity.current.account_id}-${var.target_region}"

  tags = merge(var.common_tags, {
    Name = "serverless-app-data-bucket"
  })
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
      kms_master_key_id = aws_kms_key.master.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# ===================================================
# DynamoDB Tables
# ===================================================

resource "aws_dynamodb_table" "primary" {
  name             = "${var.dynamodb_table_prefix}_primary_${var.environment}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.master.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "serverless-app-primary-table"
  })
}

# ===================================================
# DAX Cluster
# ===================================================

resource "aws_dax_subnet_group" "main" {
  name       = "serverless-app-dax-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_dax_cluster" "main" {
  cluster_name       = "serverless-app-${var.environment}"
  iam_role_arn       = aws_iam_role.dax.arn
  node_type          = var.dax_node_type
  replication_factor = var.az_count
  subnet_group_name  = aws_dax_subnet_group.main.name
  security_group_ids = [aws_security_group.dax.id]

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "serverless-app-dax-cluster"
  })
}

resource "aws_iam_role" "dax" {
  name = "serverless-app-dax-${var.environment}"

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

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "dax" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
  role       = aws_iam_role.dax.name
}

# ===================================================
# ElastiCache Redis Cluster
# ===================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "serverless-app-redis-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = var.common_tags
}

resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "serverless-app-redis-${var.environment}"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = var.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "serverless-app-${var.environment}"
  description                = "Redis cluster for caching"
  node_type                  = var.redis_node_type
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  num_cache_clusters         = var.az_count
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
  kms_key_id                 = aws_kms_key.master.arn

  tags = merge(var.common_tags, {
    Name = "serverless-app-redis-cluster"
  })
}

# ===================================================
# Kinesis Data Stream
# ===================================================

resource "aws_kinesis_stream" "main" {
  name             = "serverless-app-stream-${var.environment}"
  retention_period = 168
  shard_count      = var.kinesis_shard_count

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

  tags = merge(var.common_tags, {
    Name = "serverless-app-kinesis-stream"
  })
}

# ===================================================
# Kinesis Firehose
# ===================================================

resource "aws_kinesis_firehose_delivery_stream" "s3" {
  name        = "serverless-app-firehose-${var.environment}"
  destination = "extended_s3"

  kinesis_source_configuration {
    kinesis_stream_arn = aws_kinesis_stream.main.arn
    role_arn           = aws_iam_role.firehose.arn
  }

  extended_s3_configuration {
    role_arn        = aws_iam_role.firehose.arn
    bucket_arn      = aws_s3_bucket.data.arn
    prefix          = "data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/"
    buffer_size     = 128
    buffer_interval = 300
    compression_format = "GZIP"
  }

  tags = merge(var.common_tags, {
    Name = "serverless-app-firehose"
  })
}

resource "aws_iam_role" "firehose" {
  name = "serverless-app-firehose-${var.environment}"

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

  tags = var.common_tags
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
        Resource = aws_kinesis_stream.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.master.arn
      }
    ]
  })
}

# ===================================================
# Lambda Functions
# ===================================================

resource "aws_iam_role" "lambda" {
  name = "serverless-app-lambda-${var.environment}"

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

  tags = var.common_tags
}

resource "aws_iam_role_policy" "lambda" {
  name = "lambda-policy"
  role = aws_iam_role.lambda.id

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
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.primary.arn,
          "${aws_dynamodb_table.primary.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dax:GetItem",
          "dax:BatchGetItem",
          "dax:Query",
          "dax:Scan"
        ]
        Resource = aws_dax_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = aws_kinesis_stream.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.data.arn}/*"
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.target_region}:${data.aws_caller_identity.current.account_id}:*"
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
        Resource = "arn:aws:secretsmanager:${var.target_region}:${data.aws_caller_identity.current.account_id}:secret:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_insights" {
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy"
  role       = aws_iam_role.lambda.name
}

resource "aws_lambda_function" "processor" {
  filename         = "lambda-placeholder.zip"
  function_name    = "serverless-app-processor-${var.environment}"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  memory_size      = 512
  timeout          = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.primary.name
      DAX_ENDPOINT   = aws_dax_cluster.main.cluster_address
      REDIS_ENDPOINT = aws_elasticache_replication_group.redis.configuration_endpoint_address
      KINESIS_STREAM = aws_kinesis_stream.main.name
      ENVIRONMENT    = var.environment
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  tracing_config {
    mode = "Active"
  }

  lifecycle {
    ignore_changes = [filename]
  }

  tags = merge(var.common_tags, {
    Name = "serverless-app-processor"
  })
}

# ===================================================
# API Gateway
# ===================================================

resource "aws_apigatewayv2_api" "main" {
  name          = "serverless-app-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE"]
    allow_headers = ["*"]
  }

  tags = var.common_tags
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = var.common_tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.processor.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "main" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /process"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ===================================================
# CloudWatch Log Groups
# ===================================================

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/serverless-app-${var.environment}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.master.arn

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.processor.function_name}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.master.arn

  tags = var.common_tags
}

# ===================================================
# CloudWatch Alarms
# ===================================================

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "serverless-app-lambda-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda function error rate alarm"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "serverless-app-api-5xx-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway 5xx error rate alarm"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_apigatewayv2_api.main.name
  }

  tags = var.common_tags
}

# ===================================================
# SNS Topics
# ===================================================

resource "aws_sns_topic" "alerts" {
  name              = "serverless-app-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.master.id

  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ===================================================
# SQS Queues
# ===================================================

resource "aws_sqs_queue" "dlq" {
  name                       = "serverless-app-dlq-${var.environment}"
  message_retention_seconds  = 1209600  # 14 days
  kms_master_key_id          = aws_kms_key.master.id
  kms_data_key_reuse_period_seconds = 300

  tags = merge(var.common_tags, {
    Name = "serverless-app-dlq"
  })
}

resource "aws_sqs_queue" "main" {
  name                       = "serverless-app-queue-${var.environment}"
  message_retention_seconds  = 345600  # 4 days
  visibility_timeout_seconds = 300
  kms_master_key_id          = aws_kms_key.master.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(var.common_tags, {
    Name = "serverless-app-queue"
  })
}

# ===================================================
# Step Functions
# ===================================================

resource "aws_iam_role" "step_functions" {
  name = "serverless-app-stepfunctions-${var.environment}"

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

  tags = var.common_tags
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
        Resource = aws_lambda_function.processor.arn
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_sfn_state_machine" "main" {
  name     = "serverless-app-workflow-${var.environment}"
  role_arn = aws_iam_role.step_functions.arn
  type     = "EXPRESS"

  definition = jsonencode({
    Comment = "Serverless application workflow"
    StartAt = "ProcessTask"
    States = {
      ProcessTask = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.processor.arn
          Payload = {
            "Input.$" = "$"
          }
        }
        End = true
        Retry = [{
          ErrorEquals = ["States.TaskFailed"]
          IntervalSeconds = 2
          MaxAttempts = 3
          BackoffRate = 2
        }]
      }
    }
  })

  tracing_configuration {
    enabled = true
  }

  tags = var.common_tags
}

# ===================================================
# EventBridge Rules
# ===================================================

resource "aws_cloudwatch_event_rule" "scheduled" {
  name                = "serverless-app-scheduled-${var.environment}"
  description         = "Scheduled event for processing"
  schedule_expression = "rate(5 minutes)"

  tags = var.common_tags
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.scheduled.name
  target_id = "lambda"
  arn       = aws_lambda_function.processor.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.scheduled.arn
}

# ===================================================
# Secrets Manager
# ===================================================

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "serverless-app-secrets-${var.environment}"
  description             = "Application secrets"
  kms_key_id              = aws_kms_key.master.id
  recovery_window_in_days = 7

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    redis_auth_token = aws_elasticache_replication_group.redis.auth_token
  })
}

# ===================================================
# WAF Web ACL
# ===================================================

resource "aws_wafv2_web_acl" "main" {
  name  = "serverless-app-waf-${var.environment}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 10000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "serverless-app-waf"
    sampled_requests_enabled   = true
  }

  tags = var.common_tags
}

resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = aws_apigatewayv2_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
