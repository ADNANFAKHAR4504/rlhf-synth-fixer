# API Gateway REST API
resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = "webhook-api-${var.environment_suffix}"
  description = "API Gateway for webhook processing - ${var.environment_suffix}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "webhook-api-${var.environment_suffix}"
  }
}

# API Gateway CloudWatch log group
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/webhook-api-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "webhook-api-logs-${var.environment_suffix}"
  }
}

# API Gateway account settings for CloudWatch logging
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# /webhook resource
resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "webhook"
}

# /{provider} resource
resource "aws_api_gateway_resource" "provider" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.webhook.id
  path_part   = "{provider}"
}

# Request validator for JSON schema validation
resource "aws_api_gateway_request_validator" "webhook" {
  name                        = "webhook-validator-${var.environment_suffix}"
  rest_api_id                 = aws_api_gateway_rest_api.webhook_api.id
  validate_request_body       = true
  validate_request_parameters = true
}

# POST method with request validation
resource "aws_api_gateway_method" "post_webhook" {
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  resource_id   = aws_api_gateway_resource.provider.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.webhook.id

  request_parameters = {
    "method.request.path.provider" = true
  }

  request_models = {
    "application/json" = aws_api_gateway_model.webhook_request.name
  }
}

# Request model for JSON schema validation
resource "aws_api_gateway_model" "webhook_request" {
  rest_api_id  = aws_api_gateway_rest_api.webhook_api.id
  name         = "WebhookRequest"
  description  = "Webhook request validation model"
  content_type = "application/json"

  schema = jsonencode({
    "$schema" = "http://json-schema.org/draft-04/schema#"
    title     = "WebhookRequest"
    type      = "object"
    properties = {
      id = {
        type = "string"
      }
      type = {
        type = "string"
      }
    }
  })
}

# Lambda integration
resource "aws_api_gateway_integration" "lambda" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.provider.id
  http_method             = aws_api_gateway_method.post_webhook.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.webhook_processor.invoke_arn
}

# Deployment
resource "aws_api_gateway_deployment" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.webhook.id,
      aws_api_gateway_resource.provider.id,
      aws_api_gateway_method.post_webhook.id,
      aws_api_gateway_integration.lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.lambda
  ]
}

# Stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.webhook.id
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  stage_name    = "prod"

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

  tags = {
    Name = "webhook-api-${var.environment_suffix}"
  }

  depends_on = [aws_api_gateway_account.main]
}

# Method settings for throttling
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = var.api_throttle_rate_limit / 60 # Convert to requests per second
    throttling_burst_limit = var.api_throttle_burst_limit
    logging_level          = "INFO"
    data_trace_enabled     = true
    metrics_enabled        = true
  }
}
