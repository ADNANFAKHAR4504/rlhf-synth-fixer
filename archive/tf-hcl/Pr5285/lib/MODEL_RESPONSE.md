I'll create a comprehensive serverless event processing pipeline for your fintech startup. Here's the modular Terraform configuration that meets all your requirements:

## 1. `variables.tf` - Input Variables

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "fintech-event-processor"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "platform-engineering"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering-001"
}

variable "api_throttle_burst_limit" {
  description = "API Gateway burst limit"
  type        = number
  default     = 5000
}

variable "api_throttle_rate_limit" {
  description = "API Gateway rate limit per second"
  type        = number
  default     = 10000
}

variable "lambda_timeout_ingestion" {
  description = "Timeout for ingestion Lambda in seconds"
  type        = number
  default     = 30
}

variable "lambda_timeout_processing" {
  description = "Timeout for processing Lambda in seconds"
  type        = number
  default     = 300
}

variable "lambda_timeout_storage" {
  description = "Timeout for storage Lambda in seconds"
  type        = number
  default     = 60
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

locals {
  common_tags = {
    Environment = var.environment
    Team        = var.team
    CostCenter  = var.cost_center
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}
```

## 2. `api-gateway.tf` - REST API Configuration

```hcl
# REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api"
  description = "Event processing REST API for ${var.project_name}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# Request Validator
resource "aws_api_gateway_request_validator" "main" {
  name                        = "main-validator"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# Lambda Authorizer
resource "aws_api_gateway_authorizer" "main" {
  name                             = "${var.project_name}-authorizer"
  rest_api_id                      = aws_api_gateway_rest_api.main.id
  authorizer_uri                   = aws_lambda_function.authorizer.invoke_arn
  authorizer_credentials           = aws_iam_role.api_gateway_authorizer.arn
  type                             = "TOKEN"
  authorizer_result_ttl_in_seconds = 300
}

# Resources
resource "aws_api_gateway_resource" "events" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "events"
}

resource "aws_api_gateway_resource" "event_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.events.id
  path_part   = "{eventId}"
}

# Methods
resource "aws_api_gateway_method" "post_event" {
  rest_api_id          = aws_api_gateway_rest_api.main.id
  resource_id          = aws_api_gateway_resource.events.id
  http_method          = "POST"
  authorization        = "CUSTOM"
  authorizer_id        = aws_api_gateway_authorizer.main.id
  request_validator_id = aws_api_gateway_request_validator.main.id

  request_parameters = {
    "method.request.header.X-Trace-Id" = false
  }

  request_models = {
    "application/json" = aws_api_gateway_model.event_model.name
  }
}

# Model for request validation
resource "aws_api_gateway_model" "event_model" {
  rest_api_id  = aws_api_gateway_rest_api.main.id
  name         = "EventModel"
  content_type = "application/json"

  schema = jsonencode({
    type = "object"
    required = ["eventType", "payload", "timestamp"]
    properties = {
      eventType = {
        type = "string"
        enum = ["transaction", "payment", "transfer"]
      }
      payload = {
        type = "object"
      }
      timestamp = {
        type = "string"
      }
    }
  })
}

# Integration
resource "aws_api_gateway_integration" "post_event" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.events.id
  http_method = aws_api_gateway_method.post_event.http_method

  integration_http_method = "POST"
  type                    = "AWS"
  uri                     = aws_lambda_function.event_ingestion.invoke_arn

  request_templates = {
    "application/json" = <<EOF
#set($context.requestOverride.header.X-Amz-Invocation-Type = "Event")
{
  "body": $input.json('$'),
  "headers": {
    #foreach($header in $input.params().header.keySet())
    "$header": "$util.escapeJavaScript($input.params().header.get($header))"#if($foreach.hasNext),#end
    #end
  },
  "requestContext": {
    "requestId": "$context.requestId",
    "apiId": "$context.apiId",
    "stage": "$context.stage",
    "requestTime": "$context.requestTime",
    "identity": {
      "sourceIp": "$context.identity.sourceIp",
      "userAgent": "$context.identity.userAgent"
    }
  }
}
EOF
  }

  depends_on = [aws_lambda_function.event_ingestion]
}

# Method Response
resource "aws_api_gateway_method_response" "post_event" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.events.id
  http_method = aws_api_gateway_method.post_event.http_method
  status_code = "202"

  response_parameters = {
    "method.response.header.X-Request-Id" = true
  }
}

# Integration Response
resource "aws_api_gateway_integration_response" "post_event" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.events.id
  http_method = aws_api_gateway_method.post_event.http_method
  status_code = aws_api_gateway_method_response.post_event.status_code

  response_templates = {
    "application/json" = <<EOF
{
  "status": "accepted",
  "requestId": "$context.requestId"
}
EOF
  }

  response_parameters = {
    "method.response.header.X-Request-Id" = "context.requestId"
  }
}

# Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.events.id,
      aws_api_gateway_method.post_event.id,
      aws_api_gateway_integration.post_event.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Stage with throttling
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  throttle_settings {
    rate_limit  = var.api_throttle_rate_limit
    burst_limit = var.api_throttle_burst_limit
  }

  xray_tracing_enabled = true

  tags = local.common_tags
}

# Method settings for detailed CloudWatch metrics
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings = {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_rate_limit  = var.api_throttle_rate_limit
    throttling_burst_limit = var.api_throttle_burst_limit
  }
}
```

## 3. `lambda.tf` - Lambda Functions

```hcl
# Lambda Authorizer Function
resource "aws_lambda_function" "authorizer" {
  filename         = "authorizer.zip"
  function_name    = "${var.project_name}-authorizer"
  role            = aws_iam_role.lambda_authorizer.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("authorizer.zip")
  runtime         = "nodejs18.x"
  timeout         = 5
  memory_size     = 128
  architectures   = ["arm64"]

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      SSM_AUTH_TOKEN_PATH = aws_ssm_parameter.auth_token.name
    }
  }

  tags = local.common_tags
}

# Event Ingestion Lambda
resource "aws_lambda_function" "event_ingestion" {
  filename         = "event-ingestion.zip"
  function_name    = "${var.project_name}-event-ingestion"
  role            = aws_iam_role.lambda_ingestion.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("event-ingestion.zip")
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout_ingestion
  memory_size     = 512
  architectures   = ["arm64"]

  layers = [aws_lambda_layer_version.common_dependencies.arn]

  reserved_concurrent_executions = 100

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      SQS_QUEUE_URL    = aws_sqs_queue.event_queue.url
      EVENTBRIDGE_BUS  = aws_cloudwatch_event_bus.main.name
      DYNAMODB_TABLE   = aws_dynamodb_table.events.name
      ENVIRONMENT      = var.environment
    }
  }

  tags = local.common_tags
}

# Event Processing Lambda
resource "aws_lambda_function" "event_processing" {
  filename         = "event-processing.zip"
  function_name    = "${var.project_name}-event-processing"
  role            = aws_iam_role.lambda_processing.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("event-processing.zip")
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout_processing
  memory_size     = 2048
  architectures   = ["arm64"]

  layers = [aws_lambda_layer_version.common_dependencies.arn]

  reserved_concurrent_executions = 50

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE   = aws_dynamodb_table.events.name
      EVENTBRIDGE_BUS  = aws_cloudwatch_event_bus.main.name
      ENVIRONMENT      = var.environment
    }
  }

  tags = local.common_tags
}

# Event Storage Lambda
resource "aws_lambda_function" "event_storage" {
  filename         = "event-storage.zip"
  function_name    = "${var.project_name}-event-storage"
  role            = aws_iam_role.lambda_storage.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("event-storage.zip")
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout_storage
  memory_size     = 1024
  architectures   = ["arm64"]

  layers = [aws_lambda_layer_version.common_dependencies.arn]

  reserved_concurrent_executions = 75

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE   = aws_dynamodb_table.events.name
      ENVIRONMENT      = var.environment
    }
  }

  tags = local.common_tags
}

# Lambda Destinations
resource "aws_lambda_function_event_invoke_config" "event_ingestion" {
  function_name                = aws_lambda_function.event_ingestion.function_name
  maximum_event_age_in_seconds = 3600
  maximum_retry_attempts       = 2

  destination_config {
    on_success {
      destination = aws_sqs_queue.event_queue.arn
    }

    on_failure {
      destination = aws_sqs_queue.dlq.arn
    }
  }
}

resource "aws_lambda_function_event_invoke_config" "event_processing" {
  function_name                = aws_lambda_function.event_processing.function_name
  maximum_event_age_in_seconds = 7200
  maximum_retry_attempts       = 1

  destination_config {
    on_success {
      destination = aws_cloudwatch_event_bus.main.arn
    }

    on_failure {
      destination = aws_sqs_queue.dlq.arn
    }
  }
}

# Lambda Permissions
resource "aws_lambda_permission" "api_gateway_authorizer" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_ingestion" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_ingestion.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "eventbridge_processing" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_processing.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.transaction_events.arn
}

resource "aws_lambda_permission" "eventbridge_storage" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_storage.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.processed_events.arn
}

resource "aws_lambda_permission" "sqs_processing" {
  statement_id  = "AllowSQSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_processing.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.event_queue.arn
}
```

## 4. `layers.tf` - Lambda Layers

```hcl
# Common Dependencies Layer
resource "aws_lambda_layer_version" "common_dependencies" {
  filename            = "common-dependencies-layer.zip"
  layer_name          = "${var.project_name}-common-dependencies"
  source_code_hash    = filebase64sha256("common-dependencies-layer.zip")
  compatible_runtimes = ["nodejs18.x"]
  compatible_architectures = ["arm64"]
  description         = "Common dependencies including AWS SDK, lodash, and monitoring utilities"

  license_info = "MIT"
}

# Layer Permission Policy
resource "aws_lambda_layer_version_permission" "common_dependencies" {
  layer_name     = aws_lambda_layer_version.common_dependencies.layer_name
  version_number = aws_lambda_layer_version.common_dependencies.version
  principal      = "123456789012" # Replace with your AWS account ID
  action         = "lambda:GetLayerVersion"
  statement_id   = "allow-account-usage"
}
```

## 5. `dynamodb.tf` - DynamoDB Tables

```hcl
# Main Events Table
resource "aws_dynamodb_table" "events" {
  name         = "${var.project_name}-events"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "pk"
  range_key = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  attribute {
    name = "gsi2pk"
    type = "S"
  }

  attribute {
    name = "gsi2sk"
    type = "S"
  }

  # GSI for querying by event type and timestamp
  global_secondary_index {
    name            = "gsi1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
  }

  # GSI for querying by status and timestamp
  global_secondary_index {
    name            = "gsi2"
    hash_key        = "gsi2pk"
    range_key       = "gsi2sk"
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

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = local.common_tags
}

# Audit Trail Table
resource "aws_dynamodb_table" "audit_trail" {
  name         = "${var.project_name}-audit-trail"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "auditId"
  range_key = "timestamp"

  attribute {
    name = "auditId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "eventId"
    type = "S"
  }

  # GSI for querying by original event ID
  global_secondary_index {
    name            = "eventIdIndex"
    hash_key        = "eventId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = local.common_tags
}
```

## 6. `sqs.tf` - SQS Queues

```hcl
# Main Event Queue
resource "aws_sqs_queue" "event_queue" {
  name                       = "${var.project_name}-event-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600  # 4 days
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}

# Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project_name}-dlq"
  message_retention_seconds = 1209600  # 14 days

  tags = local.common_tags
}

# Event Source Mapping for Lambda
resource "aws_lambda_event_source_mapping" "sqs_to_processing" {
  event_source_arn = aws_sqs_queue.event_queue.arn
  function_name    = aws_lambda_function.event_processing.arn

  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 20
  }
}
```

## 7. `eventbridge.tf` - EventBridge Rules

```hcl
# Custom Event Bus
resource "aws_cloudwatch_event_bus" "main" {
  name = "${var.project_name}-event-bus"

  tags = local.common_tags
}

# Rule for Transaction Events
resource "aws_cloudwatch_event_rule" "transaction_events" {
  name           = "${var.project_name}-transaction-events"
  description    = "Route transaction events for processing"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["${var.project_name}.ingestion"]
    detail = {
      eventType = ["transaction"]
      payload = {
        amount = [{
          numeric = [">", 1000]
        }]
      }
    }
  })

  tags = local.common_tags
}

# Rule for Payment Events
resource "aws_cloudwatch_event_rule" "payment_events" {
  name           = "${var.project_name}-payment-events"
  description    = "Route payment events for processing"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["${var.project_name}.ingestion"]
    detail = {
      eventType = ["payment"]
      payload = {
        status = ["pending", "completed"]
      }
    }
  })

  tags = local.common_tags
}

# Rule for Processed Events
resource "aws_cloudwatch_event_rule" "processed_events" {
  name           = "${var.project_name}-processed-events"
  description    = "Route processed events for storage"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["${var.project_name}.processing"]
    detail = {
      status = ["processed"]
      metadata = {
        requiresStorage = [true]
      }
    }
  })

  tags = local.common_tags
}

# Rule for Failed Events
resource "aws_cloudwatch_event_rule" "failed_events" {
  name           = "${var.project_name}-failed-events"
  description    = "Route failed events to DLQ"
  event_bus_name = aws_cloudwatch_event_bus.main.name

  event_pattern = jsonencode({
    source = ["${var.project_name}.processing", "${var.project_name}.storage"]
    detail = {
      status = ["failed"]
    }
  })

  tags = local.common_tags
}

# Event Targets
resource "aws_cloudwatch_event_target" "transaction_to_processing" {
  rule           = aws_cloudwatch_event_rule.transaction_events.name
  target_id      = "TransactionProcessingTarget"
  arn            = aws_lambda_function.event_processing.arn
  event_bus_name = aws_cloudwatch_event_bus.main.name
}

resource "aws_cloudwatch_event_target" "payment_to_processing" {
  rule           = aws_cloudwatch_event_rule.payment_events.name
  target_id      = "PaymentProcessingTarget"
  arn            = aws_lambda_function.event_processing.arn
  event_bus_name = aws_cloudwatch_event_bus.main.name
}

resource "aws_cloudwatch_event_target" "processed_to_storage" {
  rule           = aws_cloudwatch_event_rule.processed_events.name
  target_id      = "ProcessedStorageTarget"
  arn            = aws_lambda_function.event_storage.arn
  event_bus_name = aws_cloudwatch_event_bus.main.name
}

resource "aws_cloudwatch_event_target" "failed_to_dlq" {
  rule           = aws_cloudwatch_event_rule.failed_events.name
  target_id      = "FailedDLQTarget"
  arn            = aws_sqs_queue.dlq.arn
  event_bus_name = aws_cloudwatch_event_bus.main.name
}

# Event Bus Permissions
resource "aws_cloudwatch_event_permission" "organization_access" {
  principal    = aws_iam_role.lambda_ingestion.arn
  statement_id = "AllowAccountPutEvents"
  action       = "events:PutEvents"
  event_bus_name = aws_cloudwatch_event_bus.main.name
}
```

## 8. `ssm.tf` - Parameter Store

```hcl
# Auth Token Parameter
resource "aws_ssm_parameter" "auth_token" {
  name        = "/${var.project_name}/${var.environment}/auth-token"
  description = "Authentication token for API access"
  type        = "SecureString"
  value       = "REPLACE_WITH_ACTUAL_TOKEN"

  tags = local.common_tags
}

# Database Connection String
resource "aws_ssm_parameter" "db_connection" {
  name        = "/${var.project_name}/${var.environment}/db-connection"
  description = "Database connection parameters"
  type        = "SecureString"
  value = jsonencode({
    table_name = aws_dynamodb_table.events.name
    region     = "us-east-1"
  })

  tags = local.common_tags
}

# API Configuration
resource "aws_ssm_parameter" "api_config" {
  name        = "/${var.project_name}/${var.environment}/api-config"
  description = "API configuration parameters"
  type        = "String"
  value = jsonencode({
    throttle_limit = var.api_throttle_rate_limit
    burst_limit    = var.api_throttle_burst_limit
    timeout        = 30
  })

  tags = local.common_tags
}

# Event Processing Configuration
resource "aws_ssm_parameter" "processing_config" {
  name        = "/${var.project_name}/${var.environment}/processing-config"
  description = "Event processing configuration"
  type        = "String"
  value = jsonencode({
    batch_size     = 10
    retry_attempts = 3
    dlq_url        = aws_sqs_queue.dlq.url
  })

  tags = local.common_tags
}
```

## 9. `cloudwatch.tf` - Monitoring

```hcl
# Log Groups
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_authorizer" {
  name              = "/aws/lambda/${aws_lambda_function.authorizer.function_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_ingestion" {
  name              = "/aws/lambda/${aws_lambda_function.event_ingestion.function_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_processing" {
  name              = "/aws/lambda/${aws_lambda_function.event_processing.function_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_storage" {
  name              = "/aws/lambda/${aws_lambda_function.event_storage.function_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# Custom Metrics
resource "aws_cloudwatch_log_metric_filter" "event_processing_errors" {
  name           = "${var.project_name}-processing-errors"
  log_group_name = aws_cloudwatch_log_group.lambda_processing.name
  pattern        = "[ERROR]"

  metric_transformation {
    name      = "ProcessingErrors"
    namespace = "${var.project_name}/Events"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "event_processing_latency" {
  name           = "${var.project_name}-processing-latency"
  log_group_name = aws_cloudwatch_log_group.lambda_processing.name
  pattern        = "[LATENCY, latency_value]"

  metric_transformation {
    name      = "ProcessingLatency"
    namespace = "${var.project_name}/Events"
    value     = "$latency_value"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", period = 300 }],
            [".", "Errors", { stat = "Sum", period = 300 }],
            [".", "Duration", { stat = "Average", period = 300 }]
          ]
          region = "us-east-1"
          title  = "Lambda Metrics"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", aws_sqs_queue.event_queue.name],
            [".", "NumberOfMessagesDeleted", ".", "."],
            [".", "ApproximateNumberOfMessagesVisible", ".", "."]
          ]
          region = "us-east-1"
          title  = "SQS Metrics"
          view   = "timeSeries"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    FunctionName = aws_lambda_function.event_processing.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project_name}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Alert when messages appear in DLQ"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  tags = local.common_tags
}
```

## 10. `iam.tf` - IAM Roles and Policies

```hcl
# API Gateway Authorizer Role
resource "aws_iam_role" "api_gateway_authorizer" {
  name = "${var.project_name}-api-gateway-authorizer"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "api_gateway_authorizer" {
  name = "${var.project_name}-api-gateway-authorizer"
  role = aws_iam_role.api_gateway_authorizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = aws_lambda_function.authorizer.arn
      }
    ]
  })
}

# Lambda Authorizer Role
resource "aws_iam_role" "lambda_authorizer" {
  name = "${var.project_name}-lambda-authorizer"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_authorizer_basic" {
  role       = aws_iam_role.lambda_authorizer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_authorizer_xray" {
  role       = aws_iam_role.lambda_authorizer.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

resource "aws_iam_role_policy" "lambda_authorizer_ssm" {
  name = "${var.project_name}-lambda-authorizer-ssm"
  role = aws_iam_role.lambda_authorizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameterHistory"
        ]
        Resource = aws_ssm_parameter.auth_token.arn
      }
    ]
  })
}

# Lambda Ingestion Role
resource "aws_iam_role" "lambda_ingestion" {
  name = "${var.project_name}-lambda-ingestion"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_ingestion_basic" {
  role       = aws_iam_role.lambda_ingestion.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_ingestion_xray" {
  role       = aws_iam_role.lambda_ingestion.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

resource "aws_iam_role_policy" "lambda_ingestion_permissions" {
  name = "${var.project_name}-lambda-ingestion-permissions"
  role = aws_iam_role.lambda_ingestion.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.event_queue.arn,
          aws_sqs_queue.dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = aws_cloudwatch_event_bus.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.events.arn,
          "${aws_dynamodb_table.events.arn}/index/*"
        ]
      }
    ]
  })
}

# Lambda Processing Role
resource "aws_iam_role" "lambda_processing" {
  name = "${var.project_name}-lambda-processing"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_processing_basic" {
  role       = aws_iam_role.lambda_processing.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_processing_sqs" {
  role       = aws_iam_role.lambda_processing.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_processing_xray" {
  role       = aws_iam_role.lambda_processing.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

resource "aws_iam_role_policy" "lambda_processing_permissions" {
  name = "${var.project_name}-lambda-processing-permissions"
  role = aws_iam_role.lambda_processing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = aws_cloudwatch_event_bus.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.events.arn,
          "${aws_dynamodb_table.events.arn}/index/*",
          aws_dynamodb_table.audit_trail.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}

# Lambda Storage Role
resource "aws_iam_role" "lambda_storage" {
  name = "${var.project_name}-lambda-storage"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_storage_basic" {
  role       = aws_iam_role.lambda_storage.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_storage_xray" {
  role       = aws_iam_role.lambda_storage.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

resource "aws_iam_role_policy" "lambda_storage_permissions" {
  name = "${var.project_name}-lambda-storage-permissions"
  role = aws_iam_role.lambda_storage.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.events.arn,
          aws_dynamodb_table.audit_trail.arn,
          "${aws_dynamodb_table.audit_trail.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}

# EventBridge Role
resource "aws_iam_role" "eventbridge" {
  name = "${var.project_name}-eventbridge"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "eventbridge_targets" {
  name = "${var.project_name}-eventbridge-targets"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}
```

## 11. `outputs.tf` - Outputs for CI/CD

```hcl
# API Gateway Outputs
output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_deployment.main.invoke_url}/${aws_api_gateway_stage.main.stage_name}"
}

output "api_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.main.stage_name
}

# Lambda Function ARNs
output "lambda_authorizer_arn" {
  description = "Lambda Authorizer function ARN"
  value       = aws_lambda_function.authorizer.arn
}

output "lambda_ingestion_arn" {
  description = "Lambda Ingestion function ARN"
  value       = aws_lambda_function.event_ingestion.arn
}

output "lambda_processing_arn" {
  description = "Lambda Processing function ARN"
  value       = aws_lambda_function.event_processing.arn
}

output "lambda_storage_arn" {
  description = "Lambda Storage function ARN"
  value       = aws_lambda_function.event_storage.arn
}

# Lambda Function Names
output "lambda_function_names" {
  description = "Map of Lambda function names"
  value = {
    authorizer = aws_lambda_function.authorizer.function_name
    ingestion  = aws_lambda_function.event_ingestion.function_name
    processing = aws_lambda_function.event_processing.function_name
    storage    = aws_lambda_function.event_storage.function_name
  }
}

# SQS Queue URLs
output "sqs_queue_url" {
  description = "Main SQS queue URL"
  value       = aws_sqs_queue.event_queue.url
}

output "sqs_dlq_url" {
  description = "Dead letter queue URL"
  value       = aws_sqs_queue.dlq.url
}

# DynamoDB Table Names
output "dynamodb_events_table" {
  description = "DynamoDB events table name"
  value       = aws_dynamodb_table.events.name
}

output "dynamodb_audit_table" {
  description = "DynamoDB audit trail table name"
  value       = aws_dynamodb_table.audit_trail.name
}

# EventBridge Bus Name
output "eventbridge_bus_name" {
  description = "EventBridge custom bus name"
  value       = aws_cloudwatch_event_bus.main.name
}

# EventBridge Rule ARNs
output "eventbridge_rules" {
  description = "Map of EventBridge rule ARNs"
  value = {
    transaction_events = aws_cloudwatch_event_rule.transaction_events.arn
    payment_events     = aws_cloudwatch_event_rule.payment_events.arn
    processed_events   = aws_cloudwatch_event_rule.processed_events.arn
    failed_events      = aws_cloudwatch_event_rule.failed_events.arn
  }
}

# CloudWatch Log Groups
output "cloudwatch_log_groups" {
  description = "Map of CloudWatch log group names"
  value = {
    api_gateway = aws_cloudwatch_log_group.api_gateway.name
    authorizer  = aws_cloudwatch_log_group.lambda_authorizer.name
    ingestion   = aws_cloudwatch_log_group.lambda_ingestion.name
    processing  = aws_cloudwatch_log_group.lambda_processing.name
    storage     = aws_cloudwatch_log_group.lambda_storage.name
  }
}

# SSM Parameter Names
output "ssm_parameters" {
  description = "Map of SSM parameter names"
  value = {
    auth_token        = aws_ssm_parameter.auth_token.name
    db_connection     = aws_ssm_parameter.db_connection.name
    api_config        = aws_ssm_parameter.api_config.name
    processing_config = aws_ssm_parameter.processing_config.name
  }
}

# Lambda Layer Version ARN
output "lambda_layer_arn" {
  description = "Common dependencies Lambda layer ARN"
  value       = aws_lambda_layer_version.common_dependencies.arn
}

# Integration Testing Endpoints
output "integration_test_config" {
  description = "Configuration for integration testing"
  value = {
    api_endpoint      = "${aws_api_gateway_deployment.main.invoke_url}/${aws_api_gateway_stage.main.stage_name}"
    event_post_url    = "${aws_api_gateway_deployment.main.invoke_url}/${aws_api_gateway_stage.main.stage_name}/events"
    region            = "us-east-1"
    x_ray_enabled     = true
  }
}
```

## Deployment Instructions

1. **Prerequisites**:
   - Create Lambda deployment packages (zip files) for each function
   - Create the Lambda layer zip file with common dependencies
   - Ensure AWS credentials are configured

2. **Initialize Terraform**:
   ```bash
   terraform init
   ```

3. **Plan the deployment**:
   ```bash
   terraform plan -out=tfplan
   ```

4. **Apply the configuration**:
   ```bash
   terraform apply tfplan
   ```

5. **Post-deployment**:
   - Update the SSM parameter for auth token with actual value
   - Configure CloudWatch Alarm actions with SNS topics for notifications
   - Test the API endpoints using the outputs

This configuration provides a production-ready serverless event processing pipeline with comprehensive monitoring, error handling, and scalability features suitable for a fintech application.