# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "payment-api-${var.environment}-${var.environment_suffix}"
  description = "Payment Processing API for ${var.environment} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-api-${var.environment}-${var.environment_suffix}"
    }
  )
}

# API Gateway Request Validator
resource "aws_api_gateway_request_validator" "main" {
  name                        = "request-validator-${var.environment}"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# API Gateway Resource - /validate
resource "aws_api_gateway_resource" "validate" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "validate"
}

# API Gateway Method - POST /validate
resource "aws_api_gateway_method" "validate_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.validate.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.main.id
}

# API Gateway Integration - Payment Validation Lambda
resource "aws_api_gateway_integration" "validate_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.validate.id
  http_method             = aws_api_gateway_method.validate_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validation.invoke_arn
}

# API Gateway Resource - /process
resource "aws_api_gateway_resource" "process" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "process"
}

# API Gateway Method - POST /process
resource "aws_api_gateway_method" "process_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.process.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.main.id
}

# API Gateway Integration - Transaction Processing Lambda
resource "aws_api_gateway_integration" "process_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.process.id
  http_method             = aws_api_gateway_method.process_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_processing.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.validate.id,
      aws_api_gateway_method.validate_post.id,
      aws_api_gateway_integration.validate_lambda.id,
      aws_api_gateway_resource.process.id,
      aws_api_gateway_method.process_post.id,
      aws_api_gateway_integration.process_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.validate_lambda,
    aws_api_gateway_integration.process_lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  xray_tracing_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "payment-api-stage-${var.environment}-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/payment-api-${var.environment}-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "api-gateway-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# API Gateway Method Settings for Throttling
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_rate_limit  = local.api_throttle_rate_limit
    throttling_burst_limit = local.api_throttle_burst_limit
  }
}