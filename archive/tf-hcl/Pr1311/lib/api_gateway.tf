resource "aws_api_gateway_rest_api" "main" {
  name = "${var.project_name}-${var.environment_suffix}-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-api"
    Environment = var.environment
  }
}

# API Gateway resources and methods for each service
resource "aws_api_gateway_resource" "services" {
  for_each = toset(["user", "order", "notification"])

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = each.key
}

resource "aws_api_gateway_method" "services_get" {
  for_each = aws_api_gateway_resource.services

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "services_post" {
  for_each = aws_api_gateway_resource.services

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway integrations
resource "aws_api_gateway_integration" "services_get" {
  for_each = aws_api_gateway_method.services_get

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.services[each.key].id
  http_method = each.value.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.services[each.key].invoke_arn
}

resource "aws_api_gateway_integration" "services_post" {
  for_each = aws_api_gateway_method.services_post

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.services[each.key].id
  http_method = each.value.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.services[each.key].invoke_arn
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.services_get,
    aws_api_gateway_integration.services_post
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  lifecycle {
    create_before_destroy = true
  }
}

# Enable X-Ray tracing for API Gateway
resource "aws_api_gateway_stage" "main" {
  stage_name    = var.environment
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.main.id

  xray_tracing_enabled = true

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-${var.environment}-stage"
    Environment = var.environment
  }
}