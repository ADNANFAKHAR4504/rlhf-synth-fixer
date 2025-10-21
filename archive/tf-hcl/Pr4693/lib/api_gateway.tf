# api_gateway.tf - API Gateway REST API configuration

# REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.environment_suffix}-api"
  description = "Secure API with Cognito authentication for user profiles"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-api"
    }
  )
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${var.environment_suffix}-cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.main.arn]
}

# /profiles resource
resource "aws_api_gateway_resource" "profiles" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "profiles"
}

# /profiles/{userId} resource
resource "aws_api_gateway_resource" "profile_by_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.profiles.id
  path_part   = "{userId}"
}

# OPTIONS /profiles (CORS preflight)
resource "aws_api_gateway_method" "profiles_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.profiles.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "profiles_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.profiles.id
  http_method = aws_api_gateway_method.profiles_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "profiles_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.profiles.id
  http_method = aws_api_gateway_method.profiles_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "profiles_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.profiles.id
  http_method = aws_api_gateway_method.profiles_options.http_method
  status_code = aws_api_gateway_method_response.profiles_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# POST /profiles (Create profile)
resource "aws_api_gateway_method" "profiles_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.profiles.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "profiles_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.profiles.id
  http_method             = aws_api_gateway_method.profiles_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

# GET /profiles (List profiles)
resource "aws_api_gateway_method" "profiles_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.profiles.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "profiles_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.profiles.id
  http_method             = aws_api_gateway_method.profiles_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

# OPTIONS /profiles/{userId} (CORS preflight)
resource "aws_api_gateway_method" "profile_by_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.profile_by_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "profile_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.profile_by_id.id
  http_method = aws_api_gateway_method.profile_by_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "profile_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.profile_by_id.id
  http_method = aws_api_gateway_method.profile_by_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "profile_by_id_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.profile_by_id.id
  http_method = aws_api_gateway_method.profile_by_id_options.http_method
  status_code = aws_api_gateway_method_response.profile_by_id_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# GET /profiles/{userId} (Get profile by ID)
resource "aws_api_gateway_method" "profile_by_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.profile_by_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "profile_by_id_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.profile_by_id.id
  http_method             = aws_api_gateway_method.profile_by_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

# PUT /profiles/{userId} (Update profile)
resource "aws_api_gateway_method" "profile_by_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.profile_by_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "profile_by_id_put" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.profile_by_id.id
  http_method             = aws_api_gateway_method.profile_by_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

# DELETE /profiles/{userId} (Delete profile)
resource "aws_api_gateway_method" "profile_by_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.profile_by_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "profile_by_id_delete" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.profile_by_id.id
  http_method             = aws_api_gateway_method.profile_by_id_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler.invoke_arn
}

# API Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  # Redeploy when any method or integration changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.profiles.id,
      aws_api_gateway_resource.profile_by_id.id,
      aws_api_gateway_method.profiles_post.id,
      aws_api_gateway_method.profiles_get.id,
      aws_api_gateway_method.profile_by_id_get.id,
      aws_api_gateway_method.profile_by_id_put.id,
      aws_api_gateway_method.profile_by_id_delete.id,
      aws_api_gateway_integration.profiles_post.id,
      aws_api_gateway_integration.profiles_get.id,
      aws_api_gateway_integration.profile_by_id_get.id,
      aws_api_gateway_integration.profile_by_id_put.id,
      aws_api_gateway_integration.profile_by_id_delete.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.profiles_post,
    aws_api_gateway_integration.profiles_get,
    aws_api_gateway_integration.profile_by_id_get,
    aws_api_gateway_integration.profile_by_id_put,
    aws_api_gateway_integration.profile_by_id_delete,
  ]
}

# API Stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"

  # X-Ray tracing
  xray_tracing_enabled = var.enable_xray_tracing

  # CloudWatch logging
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

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-api-prod-stage"
    }
  )

  depends_on = [
    aws_cloudwatch_log_group.api_gateway
  ]
}

# API Gateway Method Settings
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.environment_suffix}-api"
  retention_in_days = var.cloudwatch_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-api-gateway-logs"
    }
  )
}
