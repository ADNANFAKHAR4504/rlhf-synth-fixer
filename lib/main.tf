# main.tf
# Main infrastructure resources for CloudWatch analytics system

# Data sources
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Key for Encryption
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

# SNS Topic for Alerts
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

# DynamoDB Table for Aggregated Logs
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

# VPC for RDS and Lambda
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

# Security Group for RDS
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

# Security Group for Lambda
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

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment_suffix}-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-db-subnet"
  })
}

# RDS Instance
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

# CloudWatch Log Groups
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

# Lambda Function - API Handler
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

# Lambda Function - Metric Aggregator
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

# API Gateway
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

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# EventBridge Rule for Metric Aggregation
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
