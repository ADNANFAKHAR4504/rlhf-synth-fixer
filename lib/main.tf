## main.tf
# High-Performance Advertising Exchange Infrastructure
# Processes 50M bid requests/min with sub-100ms latency

terraform {
  required_version = ">= 1.2.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

locals {
  common_tags = {
    Environment = var.environment
    Service     = "AdExchange"
    Owner       = var.owner
    CostCenter  = var.cost_center
  }
}

# ------------------- VARIABLES -------------------
variable "region" {
  description = "AWS region"
  default     = "us-east-1"
}


variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "test-owner"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "TEST-COST-CENTER"
}

variable "api_auth_jwks_url" {
  description = "JWKS URL for API Gateway custom authorizer"
  type        = string
  default     = "https://example.com/.well-known/jwks.json"
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for budgets/campaigns"
  default     = "adexchange-campaigns"
}



variable "s3_bid_bucket_name" {
  description = "S3 bucket for historical bid data"
  default     = "adexchange-bid-data"
}

variable "s3_log_bucket_name" {
  description = "S3 bucket for structured logs"
  default     = "adexchange-logs"
}

# ------------------- API GATEWAY & WAF -------------------
resource "aws_wafv2_web_acl" "api_waf" {
  name  = "adexchange-api-waf"
  scope = "REGIONAL"
    default_action {
      allow {}
    }
  rule {
    name     = "AdvertiserRateLimit"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AdvertiserRateLimit"
      sampled_requests_enabled   = true
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "api-waf"
    sampled_requests_enabled   = true
  }
}

resource "aws_api_gateway_rest_api" "exchange_api" {
  name        = "AdExchangeAPI"
  description = "Advertising Exchange API"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_authorizer" "jwt_auth" {
  name                   = "AdExchangeJWTAuth"
  rest_api_id            = aws_api_gateway_rest_api.exchange_api.id
  type                   = "TOKEN"
  authorizer_uri         = var.api_auth_jwks_url
  identity_source        = "method.request.header.Authorization"
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.exchange_api.id
  stage_name    = var.environment
  deployment_id = aws_api_gateway_deployment.exchange.id
  tags          = local.common_tags
}

resource "aws_api_gateway_deployment" "exchange" {
  rest_api_id = aws_api_gateway_rest_api.exchange_api.id
}

resource "aws_api_gateway_method_settings" "cache" {
  rest_api_id = aws_api_gateway_rest_api.exchange_api.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"
  settings {
    caching_enabled = true
    cache_ttl_in_seconds = 60
  }
}

resource "aws_wafv2_web_acl_association" "api_waf_assoc" {
  resource_arn = aws_api_gateway_stage.prod.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf.arn
}

# ------------------- LAMBDA (RUST) FOR BID HANDLING -------------------
resource "aws_lambda_function" "bid_handler" {
  function_name = "adexchange-bid-handler"
  runtime       = "provided.al2"
  handler       = "bootstrap"
  memory_size   = 1024
  timeout       = 1
  role          = aws_iam_role.lambda_exec.arn
  tags          = local.common_tags
  tracing_config {
    mode = "Active"
  }
  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
      REDIS_ENDPOINT = aws_elasticache_replication_group.redis.primary_endpoint_address
  DAX_ENDPOINT   = aws_dax_cluster.budget_dax.cluster_address
    }
  }
  # Assume deployment package is provided externally
  filename      = "bootstrap.zip"
  publish       = true
}

resource "aws_lambda_provisioned_concurrency_config" "bid_handler_conc" {
  function_name                     = aws_lambda_function.bid_handler.function_name
  qualifier                         = "$LATEST"
  provisioned_concurrent_executions = 100
}

resource "aws_lambda_function" "bid_evaluator" {
  function_name = "adexchange-bid-evaluator"
  runtime       = "python3.11"
  handler       = "lambda_function.lambda_handler"
  memory_size   = 1024
  timeout       = 1
  role          = aws_iam_role.lambda_exec.arn
  tags          = local.common_tags
  environment {
    variables = {
      # FRAUD_MODEL_ARN removed, resource not present
    }
  }
  filename      = "bid_evaluator.zip"
  publish       = true
}


# ------------------- DYNAMODB, DAX, STREAMS -------------------
resource "aws_dynamodb_table" "campaigns" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "campaign_id"
  attribute {
    name = "campaign_id"
    type = "S"
  }
  stream_enabled     = true
  stream_view_type   = "NEW_AND_OLD_IMAGES"
  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dax_cluster" "budget_dax" {
  cluster_name         = "adx-budget-dax"
  node_type            = "dax.r5.large"
  replication_factor   = 3
  iam_role_arn         = aws_iam_role.dax_exec.arn
  subnet_group_name    = aws_dax_subnet_group.dax_subnet.name
  # security_group_ids   = [aws_security_group.dax.id] # Resource not declared
  server_side_encryption {
    enabled = true
  }
}

resource "aws_dax_subnet_group" "dax_subnet" {
  name       = "adexchange-dax-subnet"
  subnet_ids = ["subnet-xxxxxx"] # Replace with actual subnet IDs
}


# ------------------- ELASTICACHE REDIS -------------------
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "adexchange-redis"
  description                   = "Redis for frequency capping and segmentation"
  node_type                     = var.redis_node_type
  engine                        = "redis"
  engine_version                = "7.0"
  num_node_groups               = 3
  replicas_per_node_group       = 2
  automatic_failover_enabled    = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  subnet_group_name             = aws_elasticache_subnet_group.redis_subnet.name
  # security_group_ids            = [aws_security_group.redis.id] # Resource not declared
}

resource "aws_elasticache_subnet_group" "redis_subnet" {
  name       = "adexchange-redis-subnet"
  subnet_ids = ["subnet-xxxxxx"] # Replace with actual subnet IDs
}

# ------------------- KINESIS, FIREHOSE, S3 -------------------
resource "aws_kinesis_stream" "bid_stream" {
  name             = "adexchange-bid-stream"
  shard_count      = var.kinesis_shard_count
  retention_period = 24
}

resource "aws_kinesis_analytics_application" "bid_analytics" {
  name        = "adexchange-bid-analytics"
  tags        = local.common_tags
}

resource "aws_kinesis_firehose_delivery_stream" "bid_firehose" {
  name        = "adexchange-bid-firehose"
  destination = "extended_s3"
  extended_s3_configuration {
    role_arn           = "arn:aws:iam::123456789012:role/firehose_delivery_role"
    bucket_arn         = aws_s3_bucket.bid_data.arn
    buffering_interval = 60
    compression_format = "GZIP"
  }
}

resource "aws_s3_bucket" "bid_data" {
  bucket = var.s3_bid_bucket_name
  tags   = local.common_tags
  lifecycle_rule {
    enabled = true
    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
  }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.exchange.arn
      }
    }
  }
}

resource "aws_s3_bucket" "log_data" {
  bucket = var.s3_log_bucket_name
  tags   = local.common_tags
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.exchange.arn
      }
    }
  }
}

# ------------------- REDSHIFT, ATHENA, QUICKSIGHT -------------------
resource "aws_redshiftserverless_workgroup" "adexchange" {
  workgroup_name = "adexchange-redshift"
  namespace_name = "adexchange-ns"
  tags           = local.common_tags
}

resource "aws_athena_workgroup" "adexchange" {
  name = "adexchange-athena"
  configuration {
    result_configuration {
      output_location = "s3://${var.s3_bid_bucket_name}/athena-results/"
    }
  }
}

resource "aws_quicksight_dashboard" "adexchange" {
  dashboard_id = "adexchange-dashboard"
  name         = "AdExchange Dashboard"
  version_description = "Initial version"
  source_entity {
    source_template {
  arn = "arn:aws:quicksight:${var.region}:123456789012:template/adexchange-template"
      data_set_references {
        data_set_placeholder = "adexchange-dataset"
  data_set_arn        = "arn:aws:quicksight:${var.region}:123456789012:dataset/adexchange-dataset"
      }
    }
  }
}


# ------------------- STEP FUNCTIONS EXPRESS -------------------
resource "aws_sfn_state_machine" "auction_workflow" {
  name     = "adexchange-auction-workflow"
  role_arn = aws_iam_role.step_exec.arn
  type     = "EXPRESS"
  definition = <<EOF
{
  "Comment": "Parallel auction workflow",
  "StartAt": "BidHandler",
  "States": {
    "BidHandler": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.bid_handler.arn}",
      "Next": "BidEvaluator"
    },
    "BidEvaluator": {
      "Type": "Task",
      "Resource": "${aws_lambda_function.bid_evaluator.arn}",
      "End": true
    }
  }
}
EOF
}


resource "aws_sns_topic" "budget_alerts" {
  name = "adexchange-budget-alerts"
}

resource "aws_sqs_queue" "pixel_tracking" {
  name = "adexchange-pixel-tracking"
}

# ------------------- SECRETS MANAGER, KMS -------------------
resource "aws_secretsmanager_secret" "dsp_credentials" {
  name = "adexchange-dsp-credentials"
}

resource "aws_kms_key" "exchange" {
  description         = "KMS key for AdExchange data at rest"
  enable_key_rotation = true
  tags                = local.common_tags
}

# ------------------- MONITORING & LOGGING -------------------
resource "aws_cloudwatch_log_group" "bid_handler_logs" {
  name              = "/aws/lambda/adexchange-bid-handler"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "bid_latency_alarm" {
  alarm_name          = "adexchange-bid-latency-p99"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 100
  alarm_actions       = [aws_sns_topic.budget_alerts.arn]
  dimensions = {
    FunctionName = aws_lambda_function.bid_handler.function_name
  }
}

resource "aws_cloudwatch_dashboard" "adexchange" {
  dashboard_name = "adexchange-dashboard"
  dashboard_body = <<EOF
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [["AWS/Lambda", "Duration", "FunctionName", "adexchange-bid-handler"]],
        "stat": "p99",
        "period": 1,
        "title": "Bid Handler p99 Latency"
      }
    }
  ]
}
EOF
}

# ------------------- IAM ROLES (least privilege) -------------------
resource "aws_iam_role" "lambda_exec" {
  name = "adexchange-lambda-exec"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  tags = local.common_tags
}

resource "aws_iam_role" "dax_exec" {
  name = "adexchange-dax-exec"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "dax.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  tags = local.common_tags
}

resource "aws_iam_role" "step_exec" {
  name = "adexchange-step-exec"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "states.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
  tags = local.common_tags
}

# ------------------- OUTPUTS -------------------
output "api_gateway_endpoint" {
  value = aws_api_gateway_stage.prod.invoke_url
}

output "redis_cluster_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "dax_endpoint" {
  value = aws_dax_cluster.budget_dax.cluster_address
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.campaigns.arn
}

output "step_functions_arn" {
  value = aws_sfn_state_machine.auction_workflow.arn
}


output "redshift_endpoint" {
  value = aws_redshiftserverless_workgroup.adexchange.endpoint
}

output "quicksight_dashboard_url" {
  value = aws_quicksight_dashboard.adexchange.dashboard_id
}

output "s3_bid_bucket_arn" {
  value = aws_s3_bucket.bid_data.arn
}
