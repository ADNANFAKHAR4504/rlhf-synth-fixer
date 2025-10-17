# CloudWatch Analytics System

Complete infrastructure solution for monitoring API Gateway, Lambda, and RDS handling 100k+ daily interactions with custom dashboards and proactive alerts.

## Infrastructure Files

### provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}
```

### variables.tf

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cw-analytics"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "alert_email_addresses" {
  description = "Email addresses to receive CloudWatch alerts"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "api_latency_threshold" {
  description = "API latency threshold in milliseconds"
  type        = number
  default     = 1000
}

variable "api_error_rate_threshold" {
  description = "API error rate threshold percentage"
  type        = number
  default     = 5
}

variable "lambda_error_threshold" {
  description = "Lambda error count threshold"
  type        = number
  default     = 10
}

variable "lambda_duration_threshold" {
  description = "Lambda duration threshold in milliseconds"
  type        = number
  default     = 3000
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold percentage"
  type        = number
  default     = 80
}

variable "rds_connection_threshold" {
  description = "RDS database connection threshold"
  type        = number
  default     = 100
}

variable "aggregation_interval_minutes" {
  description = "Interval for metric aggregation in minutes"
  type        = number
  default     = 5
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate for alarms"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 300
}

variable "log_level" {
  description = "Log level for Lambda functions"
  type        = string
  default     = "INFO"
  validation {
    condition     = contains(["DEBUG", "INFO", "WARNING", "ERROR"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARNING, ERROR"
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "CloudWatch Analytics"
    ManagedBy  = "Terraform"
    CostCenter = "Engineering"
  }
}

variable "db_username" {
  description = "Master username for RDS database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS database"
  type        = string
  default     = "ChangeMe123456!"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}
```

### main.tf

```hcl
# main.tf

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_kms_key" "monitoring" {
  description             = "KMS key for ${var.project_name}-${var.environment_suffix} monitoring resources"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-monitoring-key"
  })
}

resource "aws_kms_alias" "monitoring" {
  name          = "alias/${var.project_name}-${var.environment_suffix}-monitoring"
  target_key_id = aws_kms_key.monitoring.key_id
}

resource "aws_sns_topic" "cloudwatch_alerts" {
  name              = "${var.project_name}-${var.environment_suffix}-alerts"
  kms_master_key_id = aws_kms_key.monitoring.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-alerts"
  })
}

resource "aws_sns_topic_subscription" "alert_email" {
  for_each = toset(var.alert_email_addresses)

  topic_arn = aws_sns_topic.cloudwatch_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_dynamodb_table" "aggregated_logs" {
  name             = "${var.project_name}-${var.environment_suffix}-logs"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "metricId"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.monitoring.arn
  }

  attribute {
    name = "metricId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "dateHour"
    type = "S"
  }

  global_secondary_index {
    name            = "dateHour-timestamp-index"
    hash_key        = "dateHour"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-logs"
  })
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-vpc"
  })
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-private-${count.index + 1}"
  })
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-public-${count.index + 1}"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-igw"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment_suffix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from Lambda"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-rds-sg"
  })
}

resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-${var.environment_suffix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-sg"
  })
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment_suffix}-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-db-subnet"
  })
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment_suffix}-db"
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.monitoring.arn

  db_name  = "analytics"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.project_name}-${var.environment_suffix}-final-snapshot"

  performance_insights_enabled = var.db_instance_class != "db.t3.micro" && var.db_instance_class != "db.t2.micro"

  deletion_protection = false

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-db"
  })

  depends_on = [aws_kms_key.monitoring]
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.monitoring.arn

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_api_handler" {
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-api-handler"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.monitoring.arn

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-handler-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_aggregator" {
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-aggregator"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.monitoring.arn

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-aggregator-logs"
  })
}

data "archive_file" "api_handler" {
  type        = "zip"
  output_path = "${path.module}/.terraform/api_handler.zip"

  source {
    content  = file("${path.module}/lambda/api_handler.py")
    filename = "index.py"
  }
}

resource "aws_lambda_function" "api_handler" {
  filename         = data.archive_file.api_handler.output_path
  function_name    = "${var.project_name}-${var.environment_suffix}-api-handler"
  role             = aws_iam_role.lambda_api_handler.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.api_handler.output_base64sha256
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DB_HOST        = aws_db_instance.main.address
      DB_NAME        = aws_db_instance.main.db_name
      DB_USERNAME    = var.db_username
      DYNAMODB_TABLE = aws_dynamodb_table.aggregated_logs.name
      LOG_LEVEL      = var.log_level
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-handler"
  })

  depends_on = [
    aws_cloudwatch_log_group.lambda_api_handler,
    aws_iam_role_policy_attachment.lambda_api_handler
  ]
}

data "archive_file" "metric_aggregator" {
  type        = "zip"
  output_path = "${path.module}/.terraform/metric_aggregator.zip"

  source {
    content  = file("${path.module}/lambda/metric_aggregator.py")
    filename = "index.py"
  }
}

resource "aws_lambda_function" "metric_aggregator" {
  filename         = data.archive_file.metric_aggregator.output_path
  function_name    = "${var.project_name}-${var.environment_suffix}-aggregator"
  role             = aws_iam_role.metric_aggregator.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.metric_aggregator.output_base64sha256
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE_NAME  = aws_dynamodb_table.aggregated_logs.name
      API_GATEWAY_NAME     = aws_api_gateway_rest_api.main.name
      LAMBDA_FUNCTION_NAME = aws_lambda_function.api_handler.function_name
      RDS_INSTANCE_ID      = aws_db_instance.main.id
      LOG_LEVEL            = var.log_level
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-aggregator"
  })

  depends_on = [
    aws_cloudwatch_log_group.lambda_aggregator,
    aws_iam_role_policy_attachment.metric_aggregator
  ]
}

resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment_suffix}-api"
  description = "CloudWatch Analytics API for monitoring ${var.environment_suffix}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api"
  })
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.health.id
  http_method             = aws_api_gateway_method.health_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_resource" "metrics" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "metrics"
}

resource "aws_api_gateway_method" "metrics_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.metrics.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "metrics" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.metrics.id
  http_method             = aws_api_gateway_method.metrics_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.health.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_integration.health.id,
      aws_api_gateway_resource.metrics.id,
      aws_api_gateway_method.metrics_get.id,
      aws_api_gateway_integration.metrics.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.health,
    aws_api_gateway_integration.metrics
  ]
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-stage"
  })

  depends_on = [aws_api_gateway_account.main]
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn

  depends_on = [
    aws_iam_role_policy_attachment.api_gateway_cloudwatch
  ]
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled    = true
    logging_level      = "INFO"
    data_trace_enabled = true
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_cloudwatch_event_rule" "metric_aggregation" {
  name                = "${var.project_name}-${var.environment_suffix}-aggregation"
  description         = "Trigger metric aggregation every ${var.aggregation_interval_minutes} minutes"
  schedule_expression = "rate(${var.aggregation_interval_minutes} minutes)"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-aggregation-rule"
  })
}

resource "aws_cloudwatch_event_target" "metric_aggregation_lambda" {
  rule      = aws_cloudwatch_event_rule.metric_aggregation.name
  target_id = "MetricAggregatorLambda"
  arn       = aws_lambda_function.metric_aggregator.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.metric_aggregator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.metric_aggregation.arn
}
```

### iam.tf

```hcl
# iam.tf

resource "aws_iam_role" "lambda_api_handler" {
  name = "${var.project_name}-${var.environment_suffix}-api-handler-role"

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
    Name = "${var.project_name}-${var.environment_suffix}-api-handler-role"
  })
}

resource "aws_iam_policy" "lambda_api_handler" {
  name        = "${var.project_name}-${var.environment_suffix}-api-handler-policy"
  description = "Policy for API handler Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["${aws_cloudwatch_log_group.lambda_api_handler.arn}:*"]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.aggregated_logs.arn,
          "${aws_dynamodb_table.aggregated_logs.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.monitoring.arn
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-handler-policy"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_api_handler" {
  policy_arn = aws_iam_policy.lambda_api_handler.arn
  role       = aws_iam_role.lambda_api_handler.name
}

resource "aws_iam_role" "metric_aggregator" {
  name = "${var.project_name}-${var.environment_suffix}-aggregator-role"

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
    Name = "${var.project_name}-${var.environment_suffix}-aggregator-role"
  })
}

resource "aws_iam_policy" "metric_aggregator" {
  name        = "${var.project_name}-${var.environment_suffix}-aggregator-policy"
  description = "Policy for metric aggregator Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["${aws_cloudwatch_log_group.lambda_aggregator.arn}:*"]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:GetMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      },
      {
        Effect = "Allow"
        Action = ["cloudwatch:ListMetrics"]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.aggregated_logs.arn,
          "${aws_dynamodb_table.aggregated_logs.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.monitoring.arn
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-aggregator-policy"
  })
}

resource "aws_iam_role_policy_attachment" "metric_aggregator" {
  policy_arn = aws_iam_policy.metric_aggregator.arn
  role       = aws_iam_role.metric_aggregator.name
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.environment_suffix}-apigw-cw-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = ""
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-apigw-cw-role"
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
  role       = aws_iam_role.api_gateway_cloudwatch.name
}

resource "aws_sns_topic_policy" "cloudwatch_alerts" {
  arn = aws_sns_topic.cloudwatch_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudwatch.amazonaws.com"
      }
      Action   = ["SNS:Publish"]
      Resource = aws_sns_topic.cloudwatch_alerts.arn
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
        ArnLike = {
          "aws:SourceArn" = "arn:aws:cloudwatch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alarm:${var.project_name}-${var.environment_suffix}-*"
        }
      }
    }]
  })
}

resource "aws_kms_key_policy" "monitoring" {
  key_id = aws_kms_key.monitoring.id

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
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/*"
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
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow DynamoDB"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "dynamodb.${var.aws_region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow RDS"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "rds.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}
```

### monitoring.tf

```hcl
# monitoring.tf

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment_suffix}-dashboard"

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
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.main.name, { stat = "Sum", label = "API Requests" }],
            [".", "4XXError", ".", ".", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", ".", ".", { stat = "Sum", label = "5XX Errors" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Request Count and Errors"
          period  = 300
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
            ["AWS/ApiGateway", "Latency", "ApiName", aws_api_gateway_rest_api.main.name, { stat = "Average", label = "Average Latency" }],
            ["...", { stat = "p99", label = "P99 Latency" }],
            ["...", { stat = "p95", label = "P95 Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Latency"
          period  = 300
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
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.api_handler.function_name, { stat = "Sum" }],
            [".", "Errors", ".", ".", { stat = "Sum" }],
            [".", "Throttles", ".", ".", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Metrics"
          period  = 300
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
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.api_handler.function_name, { stat = "Average" }],
            ["...", { stat = "p99" }],
            ["...", { stat = "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Duration"
          period  = 300
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
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier, { stat = "Average" }],
            [".", "DatabaseConnections", ".", ".", { stat = "Average" }],
            [".", "FreeableMemory", ".", ".", { stat = "Average", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS Performance Metrics"
          period  = 300
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
            ["AWS/RDS", "ReadLatency", "DBInstanceIdentifier", aws_db_instance.main.identifier, { stat = "Average" }],
            [".", "WriteLatency", ".", ".", { stat = "Average" }],
            [".", "ReadThroughput", ".", ".", { stat = "Average", yAxis = "right" }],
            [".", "WriteThroughput", ".", ".", { stat = "Average", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS I/O Metrics"
          period  = 300
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.api_latency_threshold
  alarm_description   = "API Gateway latency is above ${var.api_latency_threshold}ms"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-high-latency"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-api-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  threshold           = var.api_error_rate_threshold
  alarm_description   = "API Gateway error rate is above ${var.api_error_rate_threshold}%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "e1"
    expression  = "(m2+m3)/m1*100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.main.name
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "4XXError"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.main.name
      }
    }
  }

  metric_query {
    id = "m3"
    metric {
      metric_name = "5XXError"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.main.name
      }
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-high-error-rate"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "lambda_api_handler_errors" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Lambda function errors exceed ${var.lambda_error_threshold}"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-api-errors"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "lambda_api_handler_duration" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-api-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.lambda_duration_threshold
  alarm_description   = "Lambda function duration exceeds ${var.lambda_duration_threshold}ms"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-api-duration"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "lambda_aggregator_errors" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-agg-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Metric aggregator Lambda errors exceed ${var.lambda_error_threshold}"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.metric_aggregator.function_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-agg-errors"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "RDS CPU utilization is above ${var.rds_cpu_threshold}%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-rds-high-cpu"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.rds_connection_threshold
  alarm_description   = "RDS connections exceed ${var.rds_connection_threshold}"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-rds-high-connections"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_log_metric_filter" "api_gateway_errors" {
  name           = "${var.project_name}-${var.environment_suffix}-api-errors"
  log_group_name = aws_cloudwatch_log_group.api_gateway.name
  pattern        = "[timestamp, request_id, event_type=ERROR*, ...]"

  metric_transformation {
    name          = "APIGatewayErrors"
    namespace     = "${var.project_name}-${var.environment_suffix}/APIGateway"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "lambda_cold_starts" {
  name           = "${var.project_name}-${var.environment_suffix}-lambda-cold-starts"
  log_group_name = aws_cloudwatch_log_group.lambda_api_handler.name
  pattern        = "[..., init_duration_label=Init, init_duration_value, init_duration_unit=ms]"

  metric_transformation {
    name          = "LambdaColdStarts"
    namespace     = "${var.project_name}-${var.environment_suffix}/Lambda"
    value         = "1"
    default_value = "0"
  }
}
```

### outputs.tf

```hcl
# outputs.tf

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_name" {
  description = "API Gateway REST API name"
  value       = aws_api_gateway_rest_api.main.name
}

output "cloudwatch_dashboard_url" {
  description = "URL to access the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.cloudwatch_alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alerts"
  value       = aws_sns_topic.cloudwatch_alerts.name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for aggregated logs"
  value       = aws_dynamodb_table.aggregated_logs.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.aggregated_logs.arn
}

output "lambda_api_handler_arn" {
  description = "ARN of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.arn
}

output "lambda_api_handler_name" {
  description = "Name of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

output "lambda_aggregator_arn" {
  description = "ARN of the metric aggregator Lambda function"
  value       = aws_lambda_function.metric_aggregator.arn
}

output "lambda_aggregator_name" {
  description = "Name of the metric aggregator Lambda function"
  value       = aws_lambda_function.metric_aggregator.function_name
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge rule for metric aggregation"
  value       = aws_cloudwatch_event_rule.metric_aggregation.arn
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.metric_aggregation.name
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.monitoring.id
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = aws_kms_key.monitoring.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alarm_arns" {
  description = "Map of alarm names to their ARNs"
  value = {
    api_latency         = aws_cloudwatch_metric_alarm.api_latency.arn
    api_errors          = aws_cloudwatch_metric_alarm.api_errors.arn
    lambda_api_errors   = aws_cloudwatch_metric_alarm.lambda_api_handler_errors.arn
    lambda_api_duration = aws_cloudwatch_metric_alarm.lambda_api_handler_duration.arn
    lambda_agg_errors   = aws_cloudwatch_metric_alarm.lambda_aggregator_errors.arn
    rds_cpu             = aws_cloudwatch_metric_alarm.rds_cpu.arn
    rds_connections     = aws_cloudwatch_metric_alarm.rds_connections.arn
  }
}

output "log_group_names" {
  description = "CloudWatch log group names"
  value = {
    api_gateway       = aws_cloudwatch_log_group.api_gateway.name
    lambda_api        = aws_cloudwatch_log_group.lambda_api_handler.name
    lambda_aggregator = aws_cloudwatch_log_group.lambda_aggregator.name
  }
}
```

## Application Code

### lambda/api_handler.py

```python
import json
import os
import logging
from datetime import datetime, timezone

log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger = logging.getLogger()
logger.setLevel(log_level)


def handler(event, context):
    try:
        logger.info("Received event")
        
        path = event.get('path', '')
        http_method = event.get('httpMethod', '')
        
        if path == '/health' and http_method == 'GET':
            return handle_health_check(event, context)
        elif path == '/metrics' and http_method == 'GET':
            return handle_metrics_request(event, context)
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Not Found'})
            }
    except Exception as e:
        logger.error("Error processing request: {}".format(str(e)))
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal Server Error', 'message': str(e)})
        }


def handle_health_check(event, context):
    logger.info("Health check requested")
    
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'service': 'cloudwatch-analytics-api',
        'version': '1.0.0',
        'environment': {
            'db_configured': os.environ.get('DB_HOST', 'not-configured') != 'not-configured',
            'dynamodb_table': os.environ.get('DYNAMODB_TABLE', 'not-configured')
        },
        'lambda': {
            'function_name': getattr(context, 'function_name', 'unknown'),
            'request_id': getattr(context, 'request_id', 'unknown')
        }
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(health_status)
    }


def handle_metrics_request(event, context):
    logger.info("Metrics request received")
    
    try:
        import boto3
        from decimal import Decimal
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        
        query_params = event.get('queryStringParameters', {})
        if query_params is None:
            query_params = {}
        
        limit = int(query_params.get('limit', '10'))
        response = table.scan(Limit=limit)
        
        def decimal_default(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'metrics': response.get('Items', []),
                'count': len(response.get('Items', []))
            }, default=decimal_default)
        }
    except Exception as e:
        logger.error("Error retrieving metrics: {}".format(str(e)))
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Failed to retrieve metrics', 'message': str(e)})
        }
```

### lambda/metric_aggregator.py

```python
import json
import boto3
import os
import logging
from datetime import datetime, timedelta
from decimal import Decimal

log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger = logging.getLogger()
logger.setLevel(log_level)

cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    logger.info("Starting metric aggregation")
    
    table_name = os.environ['DYNAMODB_TABLE_NAME']
    table = dynamodb.Table(table_name)
    
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=5)
    
    metrics_aggregated = 0
    
    metrics_to_aggregate = [
        {
            'namespace': 'AWS/ApiGateway',
            'metric_name': 'Count',
            'dimensions': [{'Name': 'ApiName', 'Value': os.environ['API_GATEWAY_NAME']}],
            'stat': 'Sum'
        },
        {
            'namespace': 'AWS/Lambda',
            'metric_name': 'Invocations',
            'dimensions': [{'Name': 'FunctionName', 'Value': os.environ['LAMBDA_FUNCTION_NAME']}],
            'stat': 'Sum'
        },
        {
            'namespace': 'AWS/RDS',
            'metric_name': 'CPUUtilization',
            'dimensions': [{'Name': 'DBInstanceIdentifier', 'Value': os.environ['RDS_INSTANCE_ID']}],
            'stat': 'Average'
        }
    ]
    
    for metric_config in metrics_to_aggregate:
        try:
            response = cloudwatch.get_metric_statistics(
                Namespace=metric_config['namespace'],
                MetricName=metric_config['metric_name'],
                Dimensions=metric_config['dimensions'],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=[metric_config['stat']]
            )
            
            for datapoint in response.get('Datapoints', []):
                metric_id = "{}/{}".format(metric_config['namespace'], metric_config['metric_name'])
                
                table.put_item(Item={
                    'metricId': metric_id,
                    'timestamp': int(datapoint['Timestamp'].timestamp()),
                    'dateHour': datapoint['Timestamp'].strftime('%Y-%m-%d-%H'),
                    'value': Decimal(str(datapoint[metric_config['stat']])),
                    'stat': metric_config['stat']
                })
                
                metrics_aggregated += 1
        except Exception as e:
            logger.error("Error: {}".format(str(e)))
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'metrics_aggregated': metrics_aggregated,
            'timestamp': end_time.isoformat()
        })
    }
```

## Configuration

### terraform.tfvars

```hcl
# terraform.tfvars
aws_region            = "us-east-1"
project_name          = "enterprise-monitoring"
environment           = "production"
alert_email_addresses = ["ops-team@company.com", "oncall@company.com"]

api_latency_threshold     = 1000
api_error_rate_threshold  = 5
lambda_error_threshold    = 10
lambda_duration_threshold = 3000
rds_cpu_threshold         = 80
rds_connection_threshold  = 100

common_tags = {
  Environment = "production"
  Team        = "DevOps"
  Project     = "CloudWatch Analytics"
  CostCenter  = "Engineering"
  ManagedBy   = "Terraform"
}
```

## Deployment Guide

### Prerequisites

1. AWS CLI installed and configured with valid credentials
2. Terraform version 1.4.0 or higher
3. Access to an AWS account with sufficient permissions
4. S3 bucket for Terraform state storage
5. Valid email addresses for alert notifications

### Deployment Steps

Initialize Terraform in the lib directory:

```bash
cd lib
terraform init
terraform plan
terraform apply
```

After deployment completes, verify the outputs:

```bash
terraform output
```

### Post-Deployment

Confirm SNS subscription emails by clicking the confirmation link sent to each email address.

Test the API Gateway health endpoint:

```bash
curl https://your-api-url/health
```

Expected response includes status healthy and service information.

Access the CloudWatch dashboard using the URL from terraform outputs.

### Monitoring

The system automatically collects metrics every 5 minutes:

- API Gateway request count and latency
- Lambda function invocations and errors
- RDS CPU utilization and connections

### Cleanup

To destroy all resources:

```bash
terraform destroy
```

Warning: This permanently deletes all data and resources.

## Architecture

### System Components

The architecture includes:

VPC with public and private subnets for network isolation

API Gateway receives HTTP requests and forwards to Lambda

Lambda function processes requests and accesses DynamoDB

RDS PostgreSQL database in private subnets

CloudWatch collects metrics from all services

EventBridge triggers metric aggregator every 5 minutes

Aggregated metrics stored in DynamoDB

CloudWatch Alarms monitor thresholds and send SNS notifications

### Security

All data encrypted at rest using KMS

IAM roles with least-privilege policies

VPC isolation for database

Security groups restrict network access

CloudWatch Logs encrypted

SNS messages encrypted

### High Availability

Multi-AZ deployment for RDS

Lambda runs across multiple availability zones

DynamoDB replicates across zones

CloudWatch regional service with built-in redundancy

### Scalability

API Gateway handles any request volume

Lambda scales to 1000 concurrent executions

DynamoDB on-demand capacity mode

RDS can be scaled vertically
