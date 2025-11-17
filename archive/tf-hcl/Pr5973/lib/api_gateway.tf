# API Gateway REST API
resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = "webhook-api-${var.environment_suffix}"
  description = "API Gateway for webhook ingestion"

  tags = {
    Name        = "webhook-api-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Resource
resource "aws_api_gateway_resource" "webhook_resource" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "webhook"
}

# POST Method
resource "aws_api_gateway_method" "webhook_post" {
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  resource_id   = aws_api_gateway_resource.webhook_resource.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.webhook_validator.id
}

# Request Validator
resource "aws_api_gateway_request_validator" "webhook_validator" {
  name                        = "webhook-validator-${var.environment_suffix}"
  rest_api_id                 = aws_api_gateway_rest_api.webhook_api.id
  validate_request_body       = true
  validate_request_parameters = false
}

# Integration with SQS
resource "aws_api_gateway_integration" "sqs_integration" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.webhook_resource.id
  http_method             = aws_api_gateway_method.webhook_post.http_method
  integration_http_method = "POST"
  type                    = "AWS"
  credentials             = aws_iam_role.api_gateway_role.arn
  uri                     = "arn:aws:apigateway:${var.region}:sqs:path/${data.aws_caller_identity.current.account_id}/${aws_sqs_queue.validation_queue.name}"

  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-www-form-urlencoded'"
  }

  request_templates = {
    "application/json" = "Action=SendMessage&MessageBody=$util.urlEncode($input.body)"
  }
}

# Integration Response
resource "aws_api_gateway_integration_response" "sqs_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  resource_id = aws_api_gateway_resource.webhook_resource.id
  http_method = aws_api_gateway_method.webhook_post.http_method
  status_code = aws_api_gateway_method_response.response_200.status_code

  depends_on = [aws_api_gateway_integration.sqs_integration]
}

# Method Response
resource "aws_api_gateway_method_response" "response_200" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  resource_id = aws_api_gateway_resource.webhook_resource.id
  http_method = aws_api_gateway_method.webhook_post.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

# Deployment
resource "aws_api_gateway_deployment" "webhook_deployment" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id

  depends_on = [
    aws_api_gateway_integration.sqs_integration,
    aws_api_gateway_integration_response.sqs_integration_response
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Stage
resource "aws_api_gateway_stage" "production" {
  deployment_id = aws_api_gateway_deployment.webhook_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  stage_name    = "production"

  xray_tracing_enabled = var.enable_xray

  tags = {
    Name        = "webhook-api-production-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
