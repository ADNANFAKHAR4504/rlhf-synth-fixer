### Reasoning Trace

---

The user wants me to deploy a scalable API system using Terraform with several AWS services. Let's break down what's needed:

1. API Gateway for REST endpoints
2. Lambda functions for search processing
3. ElastiCache Redis for caching
4. DynamoDB for search data storage
5. CloudWatch for performance metrics
6. X-Ray for tracing
7. EventBridge for provider notifications
8. IAM roles for secure access
9. All deployed in us-east-1 region

I'll create a Terraform configuration for this infrastructure. Here's how I'll structure it:

1. Provider configuration for AWS
2. IAM roles and policies
3. DynamoDB table for search data
4. ElastiCache Redis cluster for caching
5. Lambda functions for search processing
6. API Gateway REST API with endpoints
7. CloudWatch configurations for metrics and logging
8. X-Ray for tracing
9. EventBridge for notifications
10. Necessary connections between these components

Let me start writing the Terraform configuration:

```hcl
# provider.tf
provider "aws" {
  region = "us-east-1"
}

# variables.tf
variable "app_name" {
  description = "Name of the application"
  default     = "search-api"
}

variable "environment" {
  description = "Environment (e.g., dev, prod)"
  default     = "dev"
}

# IAM roles and policies
# iam.tf
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

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
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.app_name}-lambda-policy"
  description = "Policy for Lambda to access DynamoDB, ElastiCache, CloudWatch, X-Ray, and EventBridge"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:BatchGetItem"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.search_data.arn
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "events:PutEvents"
        ]
        Effect   = "Allow"
        Resource = aws_cloudwatch_event_bus.notification_bus.arn
      },
      {
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "elasticache:*"
        ]
        Effect   = "Allow"
        Resource = aws_elasticache_cluster.redis_cache.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# DynamoDB
# dynamodb.tf
resource "aws_dynamodb_table" "search_data" {
  name           = "${var.app_name}-search-data"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "query"
    type = "S"
  }

  global_secondary_index {
    name               = "QueryIndex"
    hash_key           = "query"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name        = "${var.app_name}-search-data"
    Environment = var.environment
  }
}

# ElastiCache Redis
# elasticache.tf
resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "${var.app_name}-redis-subnet-group"
  subnet_ids = aws_subnet.private_subnets[*].id
}

resource "aws_security_group" "redis_sg" {
  name        = "${var.app_name}-redis-sg"
  description = "Security group for Redis ElastiCache"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-redis-sg"
    Environment = var.environment
  }
}

resource "aws_elasticache_cluster" "redis_cache" {
  cluster_id           = "${var.app_name}-redis"
  engine               = "redis"
  node_type            = "cache.t3.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis6.x"
  engine_version       = "6.x"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids   = [aws_security_group.redis_sg.id]

  tags = {
    Name        = "${var.app_name}-redis"
    Environment = var.environment
  }
}

# VPC and Network Configuration
# network.tf
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.app_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_subnets" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = "us-east-1${count.index == 0 ? "a" : "b"}"
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-public-subnet-${count.index}"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_subnets" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 2}.0/24"
  availability_zone = "us-east-1${count.index == 0 ? "a" : "b"}"

  tags = {
    Name        = "${var.app_name}-private-subnet-${count.index}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.app_name}-igw"
    Environment = var.environment
  }
}

resource "aws_eip" "nat_eip" {
  count = 1
  vpc   = true

  tags = {
    Name        = "${var.app_name}-nat-eip"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "nat_gw" {
  count         = 1
  allocation_id = aws_eip.nat_eip[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = {
    Name        = "${var.app_name}-nat-gw"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name        = "${var.app_name}-public-route-table"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw[0].id
  }

  tags = {
    Name        = "${var.app_name}-private-route-table"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "lambda_sg" {
  name        = "${var.app_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-lambda-sg"
    Environment = var.environment
  }
}

# Lambda Functions
# lambda.tf
resource "aws_lambda_function" "search_function" {
  function_name    = "${var.app_name}-search"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = "lambda/search_function.zip"
  source_code_hash = filebase64sha256("lambda/search_function.zip")
  timeout          = 30
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private_subnets[*].id
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.search_data.name
      REDIS_ENDPOINT = aws_elasticache_cluster.redis_cache.cache_nodes[0].address
      REDIS_PORT     = aws_elasticache_cluster.redis_cache.cache_nodes[0].port
      EVENT_BUS      = aws_cloudwatch_event_bus.notification_bus.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.app_name}-search-function"
    Environment = var.environment
  }
}

# API Gateway
# api_gateway.tf
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.app_name}"
  description = "API for search functionality"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.app_name}"
    Environment = var.environment
  }
}

resource "aws_api_gateway_resource" "search" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "search"
}

resource "aws_api_gateway_method" "search_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.search.id
  http_method   = "GET"
  authorization_type = "NONE"
}

resource "aws_api_gateway_integration" "search_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.search.id
  http_method             = aws_api_gateway_method.search_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_function.invoke_arn
}

resource "aws_api_gateway_method" "search_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.search.id
  http_method   = "POST"
  authorization_type = "NONE"
}

resource "aws_api_gateway_integration" "search_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.search.id
  http_method             = aws_api_gateway_method.search_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_function.invoke_arn
}

resource "aws_lambda_permission" "api_gateway_invoke_search" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.search.id,
      aws_api_gateway_method.search_get.id,
      aws_api_gateway_integration.search_get_integration.id,
      aws_api_gateway_method.search_post.id,
      aws_api_gateway_integration.search_post_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  tags = {
    Name        = "${var.app_name}-stage"
    Environment = var.environment
  }
}

# CloudWatch
# cloudwatch.tf
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.api.name}"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-api-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.search_function.function_name}"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-lambda-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_dashboard" "main_dashboard" {
  dashboard_name = "${var.app_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.api.name]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "API Gateway Request Count"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", aws_api_gateway_rest_api.api.name]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "API Gateway Latency"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.search_function.function_name]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Lambda Invocations"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.search_function.function_name]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Lambda Duration"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.search_data.name],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.search_data.name]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "DynamoDB Consumed Capacity"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CacheMisses", "CacheClusterId", aws_elasticache_cluster.redis_cache.cluster_id],
            ["AWS/ElastiCache", "CacheHits", "CacheClusterId", aws_elasticache_cluster.redis_cache.cluster_id]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "ElastiCache Cache Hits/Misses"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.app_name}-api-latency-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 1000  # 1 second
  alarm_description   = "This metric monitors api gateway latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.api.name
  }

  tags = {
    Name        = "${var.app_name}-api-latency-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.app_name}-lambda-errors-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors lambda function errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.search_function.function_name
  }

  tags = {
    Name        = "${var.app_name}-lambda-errors-alarm"
    Environment = var.environment
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.app_name}-alerts"

  tags = {
    Name        = "${var.app_name}-alerts"
    Environment = var.environment
  }
}

# X-Ray
# xray.tf
resource "aws_xray_sampling_rule" "api_sampling" {
  rule_name      = "${var.app_name}-api-sampling"
  priority       = 1000
  reservoir_size = 5
  fixed_rate     = 0.05
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_name   = aws_api_gateway_rest_api.api.name
  service_type   = "AWS::ApiGateway::Stage"
  version        = 1
}

# EventBridge
# eventbridge.tf
resource "aws_cloudwatch_event_bus" "notification_bus" {
  name = "${var.app_name}-notifications"
}

resource "aws_cloudwatch_event_rule" "search_events" {
  name        = "${var.app_name}-search-events"
  description = "Capture search events"
  event_bus_name = aws_cloudwatch_event_bus.notification_bus.name

  event_pattern = jsonencode({
    source      = ["${var.app_name}"],
    detail-type = ["SearchPerformed"]
  })
}

resource "aws_cloudwatch_event_target" "search_events_log" {
  rule      = aws_cloudwatch_event_rule.search_events.name
  event_bus_name = aws_cloudwatch_event_bus.notification_bus.name
  target_id = "SendToCloudWatch"
  arn       = aws_cloudwatch_log_group.event_logs.arn
}

resource "aws_cloudwatch_log_group" "event_logs" {
  name              = "/aws/events/${var.app_name}"
  retention_in_days = 30

  tags = {
    Name        = "${var.app_name}-event-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_resource_policy" "eventbridge_log_policy" {
  policy_name = "${var.app_name}-eventbridge-log-policy"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EventBridgeToCloudWatchLogs"
        Effect    = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action    = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource  = aws_cloudwatch_log_group.event_logs.arn
      }
    ]
  })
}

# Outputs
# outputs.tf
output "api_url" {
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}"
  description = "API Gateway URL"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.search_data.name
  description = "DynamoDB table name"
}

output "redis_endpoint" {
  value       = aws_elasticache_cluster.redis_cache.cache_nodes[0].address
  description = "ElastiCache Redis endpoint"
}

output "dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${aws_cloudwatch_dashboard.main_dashboard.dashboard_name}"
  description = "CloudWatch Dashboard URL"
}

output "event_bus_name" {
  value       = aws_cloudwatch_event_bus.notification_bus.name
  description = "EventBridge Event Bus Name"
}
```

This is a comprehensive Terraform configuration for deploying a scalable API using AWS services as specified. Let me briefly explain what each component does:

1. **Provider Configuration**: Sets up AWS provider for us-east-1.

2. **VPC and Network**: Creates a VPC with public and private subnets, internet gateway, NAT gateway, and route tables for network traffic flow.

3. **IAM Roles and Policies**: Defines roles and permissions for Lambda to access other AWS services.

4. **DynamoDB Table**: Creates a table for storing search data with a GSI for query access.

5. **ElastiCache Redis**: Sets up a Redis cluster for caching with appropriate subnet group and security group.

6. **Lambda Function**: Deploys a function for search processing with environment variables for accessing other resources.

7. **API Gateway**: Creates a REST API with GET and POST methods for the /search endpoint, integrated with the Lambda function.

8. **CloudWatch**: Sets up log groups, dashboards, and alarms for monitoring API performance and Lambda errors.

9. **X-Ray**: Configures sampling rules for tracing requests through the API and Lambda.

10. **EventBridge**: Creates an event bus for provider notifications with a rule for capturing search events.

11. **Outputs**: Provides useful information like API URL, DynamoDB table name, and Redis endpoint.

This infrastructure supports a scalable search API with caching, metrics, tracing, and notifications. It follows AWS best practices for security and scalability.

I should note that this configuration assumes:

1. Lambda code is already packaged in a ZIP file at "lambda/search_function.zip"
2. The network design uses private subnets for Lambda functions and ElastiCache
3. The Lambda function is written to use Redis for caching and DynamoDB for data storage

This Terraform configuration provides a solid foundation for deploying a scalable search API on AWS.

### Answer

---

# Scalable API Deployment with Terraform on AWS

I'll create a comprehensive Terraform configuration to deploy your scalable API infrastructure in the us-east-1 region. This setup will include all the requested AWS services with proper integration.

## Project Structure

```
.
├── main.tf
├── variables.tf
├── outputs.tf
├── provider.tf
├── iam.tf
├── network.tf
├── dynamodb.tf
├── lambda.tf
├── api_gateway.tf
├── elasticache.tf
├── monitoring.tf
├── eventbridge.tf
```

## Provider Configuration

```hcl
# provider.tf
provider "aws" {
  region = "us-east-1"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}
```

## Variables

```hcl
# variables.tf
variable "app_name" {
  description = "Name of the application"
  default     = "search-api"
}

variable "environment" {
  description = "Deployment environment"
  default     = "dev"
}
```

## Network Configuration

```hcl
# network.tf
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.app_name}-vpc"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = "us-east-1${count.index == 0 ? "a" : "b"}"

  tags = {
    Name = "${var.app_name}-private-${count.index}"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = "us-east-1${count.index == 0 ? "a" : "b"}"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-${count.index}"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
  }
}

resource "aws_eip" "nat" {
  vpc = true

  tags = {
    Name = "${var.app_name}-nat-eip"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.app_name}-nat"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "${var.app_name}-private-rt"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "lambda_sg" {
  name        = "${var.app_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

## IAM Roles and Policies

```hcl
# iam.tf
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

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
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.app_name}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ]
      Resource = aws_dynamodb_table.search_data.arn
    }]
  })
}

resource "aws_iam_role_policy" "lambda_xray" {
  name = "${var.app_name}-lambda-xray-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_eventbridge" {
  name = "${var.app_name}-lambda-eventbridge-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "events:PutEvents"
      ]
      Resource = aws_cloudwatch_event_bus.notification_bus.arn
    }]
  })
}
```

## DynamoDB Configuration

```hcl
# dynamodb.tf
resource "aws_dynamodb_table" "search_data" {
  name           = "${var.app_name}-data"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "query"
    type = "S"
  }

  global_secondary_index {
    name               = "QueryIndex"
    hash_key           = "query"
    projection_type    = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.app_name}-data"
  }
}
```

## ElastiCache Redis Configuration

```hcl
# elasticache.tf
resource "aws_elasticache_subnet_group" "cache_subnet_group" {
  name       = "${var.app_name}-cache-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "cache_sg" {
  name        = "${var.app_name}-cache-sg"
  description = "Allow Redis traffic from Lambda"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_cluster" "redis_cache" {
  cluster_id           = "${var.app_name}-cache"
  engine               = "redis"
  node_type            = "cache.t3.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis6.x"
  engine_version       = "6.x"
  subnet_group_name    = aws_elasticache_subnet_group.cache_subnet_group.name
  security_group_ids   = [aws_security_group.cache_sg.id]
  port                 = 6379
}
```

## Lambda Function

```hcl
# lambda.tf
resource "aws_lambda_function" "search_function" {
  function_name    = "${var.app_name}-search"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = "search_function.zip"  # Create this ZIP file with your Lambda code
  source_code_hash = filebase64sha256("search_function.zip")

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.search_data.name
      REDIS_ENDPOINT = "${aws_elasticache_cluster.redis_cache.cache_nodes.0.address}:${aws_elasticache_cluster.redis_cache.cache_nodes.0.port}"
      EVENT_BUS_NAME = aws_cloudwatch_event_bus.notification_bus.name
    }
  }

  tracing_config {
    mode = "Active"  # Enable X-Ray tracing
  }

  timeout     = 30
  memory_size = 256
}
```

## API Gateway Configuration

```hcl
# api_gateway.tf
resource "aws_api_gateway_rest_api" "api" {
  name        = var.app_name
  description = "Search API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "search" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "search"
}

resource "aws_api_gateway_method" "search_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.search.id
  http_method   = "GET"
  authorization_type = "NONE"
}

resource "aws_api_gateway_integration" "search_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.search.id
  http_method             = aws_api_gateway_method.search_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_function.invoke_arn
}

resource "aws_api_gateway_method" "search_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.search.id
  http_method   = "POST"
  authorization_type = "NONE"
}

resource "aws_api_gateway_integration" "search_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.search.id
  http_method             = aws_api_gateway_method.search_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.search_function.invoke_arn
}

resource "aws_lambda_permission" "api_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*/*"
}

resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.search.id,
      aws_api_gateway_method.search_get.id,
      aws_api_gateway_integration.search_get_integration.id,
      aws_api_gateway_method.search_post.id,
      aws_api_gateway_integration.search_post_integration.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.environment

  xray_tracing_enabled = true
}
```

## Monitoring Configuration (CloudWatch, X-Ray)

```hcl
# monitoring.tf
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.search_function.function_name}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "API-Gateway-Execution-Logs_${aws_api_gateway_rest_api.api.id}/${var.environment}"
  retention_in_days = 30
}

resource "aws_cloudwatch_dashboard" "main_dashboard" {
  dashboard_name = "${var.app_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.api.name, "Stage", var.environment]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "API Request Count"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.search_function.function_name]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Lambda Duration"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.search_data.name]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "DynamoDB Read Capacity"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CacheHitRate", "CacheClusterId", aws_elasticache_cluster.redis_cache.cluster_id]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Redis Cache Hit Rate"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "api_latency_alarm" {
  alarm_name          = "${var.app_name}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 500
  alarm_description   = "API Latency is too high"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.api.name
    Stage   = var.environment
  }
}
```

## EventBridge Configuration

```hcl
# eventbridge.tf
resource "aws_cloudwatch_event_bus" "notification_bus" {
  name = "${var.app_name}-events"
}

resource "aws_cloudwatch_event_rule" "search_events" {
  name           = "${var.app_name}-search-events"
  event_bus_name = aws_cloudwatch_event_bus.notification_bus.name

  event_pattern = jsonencode({
    "source": ["${var.app_name}"],
    "detail-type": ["SearchPerformed"]
  })
}

resource "aws_cloudwatch_log_group" "event_logs" {
  name              = "/aws/events/${var.app_name}"
  retention_in_days = 30
}

resource "aws_cloudwatch_event_target" "search_events_logs" {
  rule           = aws_cloudwatch_event_rule.search_events.name
  event_bus_name = aws_cloudwatch_event_bus.notification_bus.name
  target_id      = "LogEvents"
  arn            = aws_cloudwatch_log_group.event_logs.arn
}
```

## Outputs

```hcl
# outputs.tf
output "api_invoke_url" {
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}/search"
  description = "URL to invoke the search API"
}

output "redis_endpoint" {
  value       = "${aws_elasticache_cluster.redis_cache.cache_nodes.0.address}:${aws_elasticache_cluster.redis_cache.cache_nodes.0.port}"
  description = "Redis endpoint for caching"
}

output "dynamodb_table" {
  value       = aws_dynamodb_table.search_data.name
  description = "DynamoDB table name"
}

output "event_bus" {
  value       = aws_cloudwatch_event_bus.notification_bus.name
  description = "EventBridge bus for notifications"
}
```

## Lambda Code Example (search_function.zip)

Here's a simple Node.js Lambda function example to include in your search_function.zip:

```javascript
// index.js
const AWS = require('aws-sdk');
const Redis = require('ioredis');

// Initialize AWS clients
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge();

// Initialize Redis client
let redis;
function getRedisClient() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_ENDPOINT);
  }
  return redis;
}

exports.handler = async event => {
  console.log('Search request received:', JSON.stringify(event));

  // Enable X-Ray tracing
  const AWSXRay = require('aws-xray-sdk');
  const tracedAWS = AWSXRay.captureAWS(AWS);

  try {
    let query;
    if (event.httpMethod === 'GET') {
      query = event.queryStringParameters?.query || '';
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      query = body.query || '';
    }

    if (!query) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing query parameter' }),
      };
    }

    // Check cache first
    const redisClient = getRedisClient();
    const cacheKey = `search:${query}`;
    const cachedResult = await redisClient.get(cacheKey);

    if (cachedResult) {
      console.log('Cache hit for query:', query);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: cachedResult,
      };
    }

    console.log('Cache miss for query:', query);

    // Query DynamoDB
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      IndexName: 'QueryIndex',
      KeyConditionExpression: '#q = :queryVal',
      ExpressionAttributeNames: {
        '#q': 'query',
      },
      ExpressionAttributeValues: {
        ':queryVal': query,
      },
    };

    const result = await dynamoDB.query(params).promise();

    // Cache the result
    await redisClient.set(cacheKey, JSON.stringify(result.Items), 'EX', 3600); // 1 hour TTL

    // Send event to EventBridge
    await eventBridge
      .putEvents({
        Entries: [
          {
            Source: process.env.APP_NAME || 'search-api',
            DetailType: 'SearchPerformed',
            Detail: JSON.stringify({
              query: query,
              resultCount: result.Items.length,
              timestamp: new Date().toISOString(),
            }),
            EventBusName: process.env.EVENT_BUS_NAME,
          },
        ],
      })
      .promise();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error('Error processing search:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

## Deployment Instructions

1. Create the Lambda function ZIP file:

   ```bash
   npm init -y
   npm install aws-sdk ioredis aws-xray-sdk
   zip -r search_function.zip index.js node_modules
   ```

2. Initialize and apply Terraform:

   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

3. Access your API via the output URL:
   ```bash
   terraform output api_invoke_url
   ```

This infrastructure creates a fully scalable search API with all the components you requested - API Gateway for REST endpoints, Lambda for processing, ElastiCache for caching, DynamoDB for data storage, CloudWatch for metrics, X-Ray for tracing, EventBridge for notifications, and proper IAM roles for security.
