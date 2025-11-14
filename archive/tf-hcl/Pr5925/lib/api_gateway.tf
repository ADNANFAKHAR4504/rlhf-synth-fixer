# API Gateway - Primary Region
resource "aws_api_gateway_rest_api" "primary" {
  name        = "payment-api-primary-${var.environment_suffix}"
  description = "Payment Processing API - Primary Region"

  tags = {
    Name = "payment-api-primary-${var.environment_suffix}"
  }
}

resource "aws_api_gateway_resource" "primary_payment" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  parent_id   = aws_api_gateway_rest_api.primary.root_resource_id
  path_part   = "payment"
}

resource "aws_api_gateway_method" "primary_payment_post" {
  rest_api_id   = aws_api_gateway_rest_api.primary.id
  resource_id   = aws_api_gateway_resource.primary_payment.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "primary_payment" {
  rest_api_id             = aws_api_gateway_rest_api.primary.id
  resource_id             = aws_api_gateway_resource.primary_payment.id
  http_method             = aws_api_gateway_method.primary_payment_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_processor_primary.invoke_arn
}

# Health check endpoint - Primary
resource "aws_api_gateway_resource" "primary_health" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  parent_id   = aws_api_gateway_rest_api.primary.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "primary_health_get" {
  rest_api_id   = aws_api_gateway_rest_api.primary.id
  resource_id   = aws_api_gateway_resource.primary_health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "primary_health" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  resource_id = aws_api_gateway_resource.primary_health.id
  http_method = aws_api_gateway_method.primary_health_get.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "primary_health_200" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  resource_id = aws_api_gateway_resource.primary_health.id
  http_method = aws_api_gateway_method.primary_health_get.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "primary_health" {
  rest_api_id = aws_api_gateway_rest_api.primary.id
  resource_id = aws_api_gateway_resource.primary_health.id
  http_method = aws_api_gateway_method.primary_health_get.http_method
  status_code = aws_api_gateway_method_response.primary_health_200.status_code

  response_templates = {
    "application/json" = "{\"status\": \"healthy\", \"region\": \"${var.primary_region}\"}"
  }
}

resource "aws_api_gateway_deployment" "primary" {
  depends_on = [
    aws_api_gateway_integration.primary_payment,
    aws_api_gateway_integration.primary_health
  ]

  rest_api_id = aws_api_gateway_rest_api.primary.id
  stage_name  = "prod"

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway - DR Region
resource "aws_api_gateway_rest_api" "dr" {
  provider    = aws.dr
  name        = "payment-api-dr-${var.environment_suffix}"
  description = "Payment Processing API - DR Region"

  tags = {
    Name = "payment-api-dr-${var.environment_suffix}"
  }
}

resource "aws_api_gateway_resource" "dr_payment" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  parent_id   = aws_api_gateway_rest_api.dr.root_resource_id
  path_part   = "payment"
}

resource "aws_api_gateway_method" "dr_payment_post" {
  provider      = aws.dr
  rest_api_id   = aws_api_gateway_rest_api.dr.id
  resource_id   = aws_api_gateway_resource.dr_payment.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "dr_payment" {
  provider                = aws.dr
  rest_api_id             = aws_api_gateway_rest_api.dr.id
  resource_id             = aws_api_gateway_resource.dr_payment.id
  http_method             = aws_api_gateway_method.dr_payment_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_processor_dr.invoke_arn
}

# Health check endpoint - DR
resource "aws_api_gateway_resource" "dr_health" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  parent_id   = aws_api_gateway_rest_api.dr.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "dr_health_get" {
  provider      = aws.dr
  rest_api_id   = aws_api_gateway_rest_api.dr.id
  resource_id   = aws_api_gateway_resource.dr_health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "dr_health" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  resource_id = aws_api_gateway_resource.dr_health.id
  http_method = aws_api_gateway_method.dr_health_get.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "dr_health_200" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  resource_id = aws_api_gateway_resource.dr_health.id
  http_method = aws_api_gateway_method.dr_health_get.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "dr_health" {
  provider    = aws.dr
  rest_api_id = aws_api_gateway_rest_api.dr.id
  resource_id = aws_api_gateway_resource.dr_health.id
  http_method = aws_api_gateway_method.dr_health_get.http_method
  status_code = aws_api_gateway_method_response.dr_health_200.status_code

  response_templates = {
    "application/json" = "{\"status\": \"healthy\", \"region\": \"${var.dr_region}\"}"
  }
}

resource "aws_api_gateway_deployment" "dr" {
  provider = aws.dr
  depends_on = [
    aws_api_gateway_integration.dr_payment,
    aws_api_gateway_integration.dr_health
  ]

  rest_api_id = aws_api_gateway_rest_api.dr.id
  stage_name  = "prod"

  lifecycle {
    create_before_destroy = true
  }
}