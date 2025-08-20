# API Gateway REST API
resource "aws_api_gateway_rest_api" "microservices_api" {
  name        = "${local.resource_prefix}-api"
  description = "Serverless microservices API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# API Gateway Account settings for CloudWatch logging
# Note: This is a global setting for the AWS account and may already be configured
# resource "aws_api_gateway_account" "main" {
#   cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
# }

# Health Check Resource
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  parent_id   = aws_api_gateway_rest_api.microservices_api.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_integration" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.microservice_functions["health"].invoke_arn
}

# Users Resource
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  parent_id   = aws_api_gateway_rest_api.microservices_api.root_resource_id
  path_part   = "users"
}

# Users methods
resource "aws_api_gateway_method" "users_get" {
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "users_post" {
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "POST"
  authorization = "NONE"
}

# Users integration
resource "aws_api_gateway_integration" "users_integration" {
  for_each = toset(["GET", "POST"])

  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = each.value

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.microservice_functions["user"].invoke_arn
}

# User by ID resource
resource "aws_api_gateway_resource" "user_by_id" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{id}"
}

# User by ID methods
resource "aws_api_gateway_method" "user_by_id_methods" {
  for_each = toset(["GET", "PUT", "DELETE"])

  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.user_by_id.id
  http_method   = each.value
  authorization = "NONE"
}

# User by ID integration
resource "aws_api_gateway_integration" "user_by_id_integration" {
  for_each = toset(["GET", "PUT", "DELETE"])

  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  resource_id = aws_api_gateway_resource.user_by_id.id
  http_method = each.value

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.microservice_functions["user"].invoke_arn
}

# Notifications Resource
resource "aws_api_gateway_resource" "notifications" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  parent_id   = aws_api_gateway_rest_api.microservices_api.root_resource_id
  path_part   = "notifications"
}

resource "aws_api_gateway_method" "notifications_post" {
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.notifications.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "notifications_integration" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  resource_id = aws_api_gateway_resource.notifications.id
  http_method = aws_api_gateway_method.notifications_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.microservice_functions["notification"].invoke_arn
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  for_each = local.lambda_functions

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.microservice_functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.microservices_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.health_integration,
    aws_api_gateway_integration.users_integration,
    aws_api_gateway_integration.user_by_id_integration,
    aws_api_gateway_integration.notifications_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.microservices_api.id

  # Triggers redeployment when configuration changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.health.id,
      aws_api_gateway_resource.users.id,
      aws_api_gateway_resource.user_by_id.id,
      aws_api_gateway_resource.notifications.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage with enhanced logging
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  stage_name    = var.environment

  # Note: CloudWatch logging requires API Gateway Account to be configured
  # Commenting out access_log_settings to avoid deployment failures
  # access_log_settings {
  #   destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
  #   format = jsonencode({
  #     requestId      = "$context.requestId"
  #     ip             = "$context.identity.sourceIp"
  #     caller         = "$context.identity.caller"
  #     user           = "$context.identity.user"
  #     requestTime    = "$context.requestTime"
  #     httpMethod     = "$context.httpMethod"
  #     resourcePath   = "$context.resourcePath"
  #     status         = "$context.status"
  #     protocol       = "$context.protocol"
  #     responseLength = "$context.responseLength"
  #     error_message  = "$context.error.message"
  #   })
  # }

  tags = local.common_tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${local.resource_prefix}-api"
  retention_in_days = 7
  log_group_class   = "STANDARD"

  tags = local.common_tags
}

# Custom Domain (optional) - for dynamic routing rules
resource "aws_api_gateway_domain_name" "main" {
  count                    = var.custom_domain_name != "" ? 1 : 0
  domain_name              = var.custom_domain_name
  regional_certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}