# API Gateway REST API
resource "aws_api_gateway_rest_api" "fraud_detection" {
  name        = "fraud-detection-api-${var.environment_suffix}"
  description = "Fraud Detection Webhook API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "fraud-detection-api-${var.environment_suffix}"
  }
}

# API Gateway Resource - /webhook
resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection.id
  parent_id   = aws_api_gateway_rest_api.fraud_detection.root_resource_id
  path_part   = "webhook"
}

# API Gateway Method - POST /webhook
resource "aws_api_gateway_method" "webhook_post" {
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection.id
  resource_id   = aws_api_gateway_resource.webhook.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration - Lambda Proxy
resource "aws_api_gateway_integration" "webhook_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.fraud_detection.id
  resource_id             = aws_api_gateway_resource.webhook.id
  http_method             = aws_api_gateway_method.webhook_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.fraud_detector.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "fraud_detection" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.webhook.id,
      aws_api_gateway_method.webhook_post.id,
      aws_api_gateway_integration.webhook_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.webhook_lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "production" {
  deployment_id = aws_api_gateway_deployment.fraud_detection.id
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection.id
  stage_name    = "prod"

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

  tags = {
    Name = "fraud-detection-api-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/fraud-detection-${var.environment_suffix}"
  retention_in_days = 30
  # Note: KMS encryption temporarily disabled due to existing key policy issue
  # kms_key_id        = aws_kms_key.fraud_detection.arn

  tags = {
    Name = "fraud-detection-api-logs-${var.environment_suffix}"
  }
}

# API Gateway Account Settings
resource "aws_api_gateway_account" "fraud_detection" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}
