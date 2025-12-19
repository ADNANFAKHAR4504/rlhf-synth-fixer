### Reasoning Trace
---

Let's break down this task and create a comprehensive Terraform script for a travel platform API that meets all the requirements:

1. We need to create a file named `tap_stack.tf` that includes all necessary resources.
2. We need to reference the `aws_region` variable that's passed from an existing `provider.tf` file.
3. The architecture needs to include API Gateway, Lambda, ElastiCache, DynamoDB, CloudWatch, X-Ray, QuickSight, IAM, and security components.
4. All resources need to be tagged appropriately.
5. We need to ensure security, scalability, and GDPR compliance.

Let's start with defining the variables, then create all the resources, and finally add the outputs.

Here's the structure I'll follow:
1. Variable declarations
2. VPC and Networking (necessary for ElastiCache and security)
3. KMS for encryption
4. IAM roles and policies
5. DynamoDB
6. ElastiCache
7. Lambda Functions
8. API Gateway
9. CloudWatch Metrics and Alarms
10. X-Ray
11. QuickSight
12. WAF
13. Outputs

Now, let's create the Terraform script:

```terraform
# tap_stack.tf

# Variable declarations
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "travel-platform-api"
}

variable "environment" {
  description = "Environment (e.g., dev, prod)"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "travel-team"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "redis_node_type" {
  description = "Node type for Redis"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 2
}

variable "dynamodb_read_capacity" {
  description = "Read capacity for DynamoDB"
  type        = number
  default     = 20
}

variable "dynamodb_write_capacity" {
  description = "Write capacity for DynamoDB"
  type        = number
  default     = 20
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 512
}

variable "api_gateway_log_level" {
  description = "API Gateway logging level"
  type        = string
  default     = "INFO"
}

# Data source to get AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get AWS region (already defined in provider.tf)
data "aws_region" "current" {}

# Local values
locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project_name
  }
  account_id  = data.aws_caller_identity.current.account_id
  region      = data.aws_region.current.name
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-vpc"
    }
  )
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = "${local.region}${count.index == 3 ? "c" : count.index == 2 ? "b" : "a"}"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-private-${count.index + 1}"
    }
  )
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = "${local.region}${count.index == 3 ? "c" : count.index == 2 ? "b" : "a"}"
  map_public_ip_on_launch = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-public-${count.index + 1}"
    }
  )
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-igw"
    }
  )
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-public-rt"
    }
  )
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  vpc = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-nat-eip"
    }
  )
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-nat"
    }
  )
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-private-rt"
    }
  )
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Groups
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-lambda-sg"
    }
  )
}

resource "aws_security_group" "elasticache" {
  name        = "${var.project_name}-elasticache-sg"
  description = "Security group for ElastiCache Redis"
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
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-elasticache-sg"
    }
  )
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions",
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        },
        Action   = "kms:*",
        Resource = "*"
      },
      {
        Sid    = "AllowUseOfKey",
        Effect = "Allow",
        Principal = {
          Service = [
            "dynamodb.amazonaws.com",
            "elasticache.amazonaws.com",
            "lambda.amazonaws.com"
          ]
        },
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        Resource = "*"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

# IAM Roles and Policies
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-lambda-policy"
  description = "Policy for Lambda functions"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Effect   = "Allow",
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ],
        Effect   = "Allow",
        Resource = "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${aws_dynamodb_table.travel_search.name}"
      },
      {
        Action = [
          "elasticache:*"
        ],
        Effect   = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs"
        ],
        Effect   = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ],
        Effect   = "Allow",
        Resource = aws_kms_key.main.arn
      },
      {
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
          "xray:GetSamplingStatisticSummaries"
        ],
        Effect   = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        Effect   = "Allow",
        Resource = "arn:aws:ssm:${local.region}:${local.account_id}:parameter/travel-platform-api/*"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# DynamoDB
resource "aws_dynamodb_table" "travel_search" {
  name         = "${var.project_name}-search-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "search_id"
  range_key    = "timestamp"
  
  attribute {
    name = "search_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  ttl {
    attribute_name = "expiration_time"
    enabled        = true
  }
  
  lifecycle {
    prevent_destroy = true
  }
  
  tags = local.common_tags
}

# SSM Parameters for secure environment variables
resource "aws_ssm_parameter" "api_config" {
  name        = "/travel-platform-api/config"
  description = "Configuration for travel platform API"
  type        = "SecureString"
  key_id      = aws_kms_key.main.key_id
  value       = jsonencode({
    database_name = aws_dynamodb_table.travel_search.name
    cache_host    = aws_elasticache_replication_group.redis.primary_endpoint_address
    cache_port    = 6379
  })
  
  tags = local.common_tags
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = aws_subnet.private.*.id
  
  tags = local.common_tags
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${var.project_name}-redis-params"
  family = "redis6.x"
  
  parameter {
    name  = "maxmemory-policy"
    value = "volatile-ttl"
  }
  
  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.project_name}-redis"
  description                   = "Redis cluster for travel platform API"
  node_type                     = var.redis_node_type
  num_cache_clusters            = var.redis_num_nodes
  parameter_group_name          = aws_elasticache_parameter_group.redis.name
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [aws_security_group.elasticache.id]
  port                          = 6379
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  automatic_failover_enabled    = true
  snapshot_retention_limit      = 7
  snapshot_window               = "03:00-05:00"
  maintenance_window            = "sun:05:00-sun:07:00"
  
  tags = local.common_tags
}

# Lambda Functions
resource "aws_lambda_function" "search_handler" {
  function_name    = "${var.project_name}-search-handler"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "python3.10"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size
  publish          = true
  
  # In a real scenario, you would use a proper deployment package
  filename         = "dummy_lambda_package.zip"
  source_code_hash = filebase64sha256("dummy_lambda_package.zip")
  
  vpc_config {
    subnet_ids         = aws_subnet.private.*.id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      SSM_CONFIG_PATH = "/travel-platform-api/config"
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
  
  depends_on = [
    aws_ssm_parameter.api_config,
    aws_elasticache_replication_group.redis,
    aws_dynamodb_table.travel_search
  ]
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*"
}

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api"
  description = "Travel platform API"
  
  endpoint_configuration {
    types = ["EDGE"]
  }
  
  tags = local.common_tags
}

resource "aws_api_gateway_resource" "search" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "search"
}

resource "aws_api_gateway_method" "search_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.search.id
  http_method   = "POST"
  authorization_type = "NONE"
  
  request_parameters = {
    "method.request.header.Content-Type" = true
  }
}

resource "aws_api_gateway_integration" "search_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.search.id
  http_method             = aws_api_gateway_method.search_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_handler.invoke_arn
}

resource "aws_api_gateway_method_response" "search_post_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.search.id
  http_method = aws_api_gateway_method.search_post.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Content-Type" = true
  }
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.search.id,
      aws_api_gateway_method.search_post.id,
      aws_api_gateway_integration.search_post.id
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
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = jsonencode({
      requestId      = "$context.requestId",
      ip             = "$context.identity.sourceIp",
      caller         = "$context.identity.caller",
      user           = "$context.identity.user",
      requestTime    = "$context.requestTime",
      httpMethod     = "$context.httpMethod",
      resourcePath   = "$context.resourcePath",
      status         = "$context.status",
      protocol       = "$context.protocol",
      responseLength = "$context.responseLength"
    })
  }
  
  tags = local.common_tags
}

resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"
  
  settings {
    metrics_enabled        = true
    logging_level          = var.api_gateway_log_level
    data_trace_enabled     = true
    throttling_rate_limit  = 1000
    throttling_burst_limit = 500
    caching_enabled        = true
    cache_ttl_in_seconds   = 300
  }
}

# WAF
resource "aws_wafv2_web_acl" "api" {
  name        = "${var.project_name}-waf"
  description = "WAF for Travel Platform API"
  scope       = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "rate-limit"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 3000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-rate-limit-rule"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "geo-restriction"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = ["RU", "CN", "IR"]
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-geo-restriction-rule"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "sql-injection"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      or_statement {
        statements {
          sqli_match_statement {
            field_to_match {
              body {}
            }
            text_transformations {
              priority = 1
              type     = "URL_DECODE"
            }
            text_transformations {
              priority = 2
              type     = "HTML_ENTITY_DECODE"
            }
          }
        }
        statements {
          sqli_match_statement {
            field_to_match {
              query_string {}
            }
            text_transformations {
              priority = 1
              type     = "URL_DECODE"
            }
            text_transformations {
              priority = 2
              type     = "HTML_ENTITY_DECODE"
            }
          }
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-sql-injection-rule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf"
    sampled_requests_enabled   = true
  }
  
  tags = local.common_tags
}

resource "aws_wafv2_web_acl_association" "api" {
  resource_arn = aws_api_gateway_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.api.arn
}

# CloudWatch
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.search_handler.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.common_tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "${var.project_name}-api-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "API 5XX errors exceeded threshold"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "API latency exceeded threshold"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 2
  alarm_description   = "Lambda errors exceeded threshold"
  
  dimensions = {
    FunctionName = aws_lambda_function.search_handler.function_name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled" {
  alarm_name          = "${var.project_name}-dynamodb-throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 2
  alarm_description   = "DynamoDB throttled requests exceeded threshold"
  
  dimensions = {
    TableName = aws_dynamodb_table.travel_search.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.project_name}-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis CPU utilization exceeded threshold"
  
  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.id
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  
  tags = local.common_tags
}

# SNS Topic for alarms
resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-alerts"
  kms_master_key_id = aws_kms_key.main.id
  
  tags = local.common_tags
}

# QuickSight setup
resource "aws_quicksight_data_source" "dynamodb" {
  name            = "${var.project_name}-dynamodb-source"
  data_source_id  = "${var.project_name}-dynamodb-source"
  aws_account_id  = local.account_id
  type            = "ATHENA"
  
  parameters {
    athena {
      work_group = "primary"
    }
  }
  
  tags = local.common_tags
}

# Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "${aws_api_gateway_stage.main.invoke_url}/search"
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.travel_search.name
}

output "redis_endpoint" {
  description = "Endpoint of the Redis cluster"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.search_handler.function_name
}

output "cloudwatch_log_group_api" {
  description = "CloudWatch log group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "cloudwatch_log_group_lambda" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}
```

Let me fix some issues and refine the Terraform script to ensure it meets all requirements:

1. I need to include a dummy Lambda deployment package.
2. Add proper X-Ray configuration.
3. Ensure GDPR compliance aspects are included.
4. Fine-tune security settings.

Here's the refined script:
### Answer 
---

# Complete Terraform Script for Travel Platform API

I've created a comprehensive Terraform script that implements the required travel platform API infrastructure with best practices for AWS serverless architecture. This script creates all necessary components from scratch.

```terraform
# tap_stack.tf

# Variable declarations
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "travel-api-platform"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "travel-team"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to use for the subnets"
  type        = list(string)
  default     = ["a", "b", "c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_replicas" {
  description = "Number of Redis replicas"
  type        = number
  default     = 2
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions (MB)"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 29
}

variable "api_throttling_rate_limit" {
  description = "API Gateway throttling rate limit"
  type        = number
  default     = 10000
}

variable "api_throttling_burst_limit" {
  description = "API Gateway throttling burst limit"
  type        = number
  default     = 5000
}

variable "api_log_retention_days" {
  description = "Number of days to retain API logs"
  type        = number
  default     = 30
}

variable "waf_request_limit" {
  description = "WAF rate limit for requests per 5 minutes"
  type        = number
  default     = 10000
}

# Import the aws_region from provider.tf
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  aws_region = data.aws_region.current.name
  account_id = data.aws_caller_identity.current.account_id
  
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
  
  lambda_zip_path = "${path.module}/lambda_function.zip"
}

#########################
# NETWORKING RESOURCES
#########################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = "${local.aws_region}${var.availability_zones[count.index]}"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-${count.index + 1}"
    Tier = "Private"
  })
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = "${local.aws_region}${var.availability_zones[count.index]}"
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-${count.index + 1}"
    Tier = "Public"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

resource "aws_eip" "nat" {
  vpc = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip"
  })
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-natgw"
  })
  
  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rtb"
  })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rtb"
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
  route_table_id = aws_route_table.private.id
}

#########################
# SECURITY RESOURCES
#########################

resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "Enable IAM User Permissions",
        Effect    = "Allow",
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" },
        Action    = "kms:*",
        Resource  = "*"
      },
      {
        Sid       = "Allow service-specific use of the key",
        Effect    = "Allow",
        Principal = {
          Service = [
            "dynamodb.amazonaws.com",
            "lambda.amazonaws.com",
            "elasticache.amazonaws.com",
            "logs.${local.aws_region}.amazonaws.com"
          ]
        },
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        Resource = "*"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-lambda-sg"
  })
}

resource "aws_security_group" "elasticache" {
  name        = "${var.project_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow Redis access from Lambda functions"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-redis-sg"
  })
}

resource "aws_security_group_rule" "elasticache_egress" {
  security_group_id = aws_security_group.elasticache.id
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow outbound traffic"
}

#########################
# IAM RESOURCES
#########################

resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.project_name}-lambda-policy"
  description = "Policy for travel API Lambda functions"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeTable"
        ],
        Resource = [
          aws_dynamodb_table.travel_search.arn,
          "${aws_dynamodb_table.travel_search.arn}/index/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        Resource = "arn:aws:ssm:${local.aws_region}:${local.account_id}:parameter/${var.project_name}/*"
      },
      {
        Effect = "Allow",
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow",
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
          "xray:GetSamplingStatisticSummaries"
        ],
        Resource = "*"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_insights_attachment" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy"
}

#########################
# DYNAMODB RESOURCES
#########################

resource "aws_dynamodb_table" "travel_search" {
  name         = "${var.project_name}-search-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "search_id"
  range_key    = "timestamp"
  
  attribute {
    name = "search_id"
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
    name            = "UserSearchIndex"
    hash_key        = "user_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  ttl {
    attribute_name = "expiry_time"
    enabled        = true # Enable TTL for GDPR compliance
  }
  
  tags = local.common_tags
}

#########################
# ELASTICACHE RESOURCES
#########################

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-redis-subnet"
  subnet_ids = aws_subnet.private.*.id
  
  tags = local.common_tags
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${var.project_name}-redis-params"
  family = "redis6.x"
  
  parameter {
    name  = "maxmemory-policy"
    value = "volatile-ttl"
  }
  
  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.project_name}-redis"
  description                   = "Redis cluster for travel search API"
  node_type                     = var.redis_node_type
  num_cache_clusters            = var.redis_replicas + 1 # Primary + replicas
  parameter_group_name          = aws_elasticache_parameter_group.redis.name
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [aws_security_group.elasticache.id]
  port                          = 6379
  automatic_failover_enabled    = true
  multi_az_enabled              = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  maintenance_window            = "sun:05:00-sun:07:00"
  snapshot_window               = "03:00-05:00"
  snapshot_retention_limit      = 7
  
  tags = local.common_tags
}

#########################
# SSM PARAMETER STORE
#########################

resource "aws_ssm_parameter" "redis_endpoint" {
  name        = "/${var.project_name}/redis/endpoint"
  description = "Redis primary endpoint"
  type        = "SecureString"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  key_id      = aws_kms_key.main.id
  
  tags = local.common_tags
}

resource "aws_ssm_parameter" "dynamodb_table" {
  name        = "/${var.project_name}/dynamodb/table_name"
  description = "DynamoDB table name"
  type        = "SecureString"
  value       = aws_dynamodb_table.travel_search.name
  key_id      = aws_kms_key.main.id
  
  tags = local.common_tags
}

resource "aws_ssm_parameter" "gdpr_retention_days" {
  name        = "/${var.project_name}/gdpr/retention_days"
  description = "Data retention period in days for GDPR compliance"
  type        = "SecureString"
  value       = "90"  # 90 days retention for GDPR compliance
  key_id      = aws_kms_key.main.id
  
  tags = local.common_tags
}

#########################
# LAMBDA RESOURCES
#########################

# Note: In a real scenario, you'd create the zip file with actual Lambda code
resource "local_file" "dummy_lambda_code" {
  content  = <<EOF
def handler(event, context):
    # This is a placeholder for the actual Lambda function code
    print("Processing travel search request")
    return {
        'statusCode': 200,
        'body': '{"message": "Travel search processed successfully"}'
    }
EOF
  filename = "${path.module}/lambda_code/index.py"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_code"
  output_path = local.lambda_zip_path
  
  depends_on = [local_file.dummy_lambda_code]
}

resource "aws_lambda_function" "search_api" {
  function_name = "${var.project_name}-search-function"
  description   = "Travel search API handler"
  handler       = "index.handler"
  runtime       = "python3.10"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  role          = aws_iam_role.lambda_execution.arn
  
  filename         = local.lambda_zip_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  
  vpc_config {
    subnet_ids         = aws_subnet.private.*.id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      SSM_PARAMETER_PREFIX = "/${var.project_name}"
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  layers = ["arn:aws:lambda:${local.aws_region}:580247275435:layer:LambdaInsightsExtension:14"]
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.search_api.function_name}"
  retention_in_days = var.api_log_retention_days
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.common_tags
}

#########################
# API GATEWAY RESOURCES
#########################

resource "aws_api_gateway_rest_api" "travel_api" {
  name        = "${var.project_name}-api"
  description = "Travel Platform API"
  
  endpoint_configuration {
    types = ["EDGE"] # Edge-optimized for low latency
  }
  
  tags = local.common_tags
}

resource "aws_api_gateway_resource" "search" {
  rest_api_id = aws_api_gateway_rest_api.travel_api.id
  parent_id   = aws_api_gateway_rest_api.travel_api.root_resource_id
  path_part   = "search"
}

resource "aws_api_gateway_method" "search_post" {
  rest_api_id   = aws_api_gateway_rest_api.travel_api.id
  resource_id   = aws_api_gateway_resource.search.id
  http_method   = "POST"
  authorization_type = "NONE"
  
  request_parameters = {
    "method.request.header.Content-Type" = true
  }
}

resource "aws_api_gateway_integration" "search_post" {
  rest_api_id             = aws_api_gateway_rest_api.travel_api.id
  resource_id             = aws_api_gateway_resource.search.id
  http_method             = aws_api_gateway_method.search_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_api.invoke_arn
}

resource "aws_api_gateway_method_response" "search_post_200" {
  rest_api_id = aws_api_gateway_rest_api.travel_api.id
  resource_id = aws_api_gateway_resource.search.id
  http_method = aws_api_gateway_method.search_post.http_method
  status_code = "200"
  
  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.travel_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.travel_api.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.search.id,
      aws_api_gateway_method.search_post.id,
      aws_api_gateway_integration.search_post.id,
    ]))
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  depends_on = [
    aws_api_gateway_method.search_post,
    aws_api_gateway_integration.search_post
  ]
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.travel_api.name}"
  retention_in_days = var.api_log_retention_days
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.common_tags
}

resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.travel_api.id
  stage_name    = var.environment
  
  xray_tracing_enabled = true
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId            = "$context.requestId",
      sourceIp             = "$context.identity.sourceIp",
      requestTime          = "$context.requestTime",
      httpMethod           = "$context.httpMethod",
      resourcePath         = "$context.resourcePath",
      status               = "$context.status",
      protocol             = "$context.protocol",
      responseLength       = "$context.responseLength",
      integrationLatency   = "$context.integrationLatency",
      responseLatency      = "$context.responseLatency",
      xrayTraceId          = "$context.xrayTraceId"
    })
  }
  
  tags = local.common_tags
}

resource "aws_api_gateway_method_settings" "api_settings" {
  rest_api_id = aws_api_gateway_rest_api.travel_api.id
  stage_name  = aws_api_gateway_stage.api_stage.stage_name
  method_path = "*/*"
  
  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_rate_limit  = var.api_throttling_rate_limit
    throttling_burst_limit = var.api_throttling_burst_limit
    caching_enabled        = true
    cache_ttl_in_seconds   = 300
  }
}

#########################
# WAF RESOURCES
#########################

resource "aws_wafv2_web_acl" "api_waf" {
  name        = "${var.project_name}-waf"
  description = "WAF Web ACL for Travel API"
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
      metric_name                = "${var.project_name}-common-rule-set"
      sampled_requests_enabled   = true
    }
  }
  
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
      metric_name                = "${var.project_name}-sqli-rule-set"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "RateLimitRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = var.waf_request_limit
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-rate-limit-rule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf-acl"
    sampled_requests_enabled   = true
  }
  
  tags = local.common_tags
}

resource "aws_wafv2_web_acl_association" "api_waf_association" {
  resource_arn = aws_api_gateway_stage.api_stage.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf.arn
}

#########################
# CLOUDWATCH RESOURCES
#########################

resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.project_name}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors API Gateway 5XX errors"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.travel_api.name
    Stage   = aws_api_gateway_stage.api_stage.stage_name
  }
  
  alarm_actions = [aws_sns_topic.alarm_notifications.arn]
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1