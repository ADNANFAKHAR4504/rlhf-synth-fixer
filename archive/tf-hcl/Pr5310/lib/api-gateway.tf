# api-gateway.tf

# REST API Gateway
resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = local.api_gateway_name
  description = "Payment webhook processing API for Stripe, PayPal, and Square"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# API Gateway CloudWatch Role
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_role.arn
}

# /api resource
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "api"
}

# /api/v1 resource
resource "aws_api_gateway_resource" "api_v1" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "v1"
}

# /api/v1/webhooks resource
resource "aws_api_gateway_resource" "webhooks" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.api_v1.id
  path_part   = "webhooks"
}

# /api/v1/webhooks/stripe resource
resource "aws_api_gateway_resource" "stripe" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.webhooks.id
  path_part   = "stripe"
}

# Stripe Webhook Request Validator
resource "aws_api_gateway_request_validator" "stripe_validator" {
  name                        = "stripe-request-validator"
  rest_api_id                 = aws_api_gateway_rest_api.webhook_api.id
  validate_request_body       = true
  validate_request_parameters = false
}

# Stripe Webhook Model
resource "aws_api_gateway_model" "stripe_webhook" {
  rest_api_id  = aws_api_gateway_rest_api.webhook_api.id
  name         = "StripeWebhook"
  description  = "Stripe webhook event schema"
  content_type = "application/json"
  schema       = file("${path.module}/schemas/stripe-webhook-schema.json")
}

# POST method for Stripe webhook
resource "aws_api_gateway_method" "stripe_post" {
  rest_api_id          = aws_api_gateway_rest_api.webhook_api.id
  resource_id          = aws_api_gateway_resource.stripe.id
  http_method          = "POST"
  authorization        = "NONE"
  api_key_required     = true
  request_validator_id = aws_api_gateway_request_validator.stripe_validator.id

  request_models = {
    "application/json" = aws_api_gateway_model.stripe_webhook.name
  }
}

# Integration with Stripe validator Lambda
resource "aws_api_gateway_integration" "stripe_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.stripe.id
  http_method             = aws_api_gateway_method.stripe_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.stripe_validator.invoke_arn
}

# /api/v1/webhooks/paypal resource
resource "aws_api_gateway_resource" "paypal" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.webhooks.id
  path_part   = "paypal"
}

# PayPal Webhook Request Validator
resource "aws_api_gateway_request_validator" "paypal_validator" {
  name                        = "paypal-request-validator"
  rest_api_id                 = aws_api_gateway_rest_api.webhook_api.id
  validate_request_body       = true
  validate_request_parameters = false
}

# PayPal Webhook Model
resource "aws_api_gateway_model" "paypal_webhook" {
  rest_api_id  = aws_api_gateway_rest_api.webhook_api.id
  name         = "PayPalWebhook"
  description  = "PayPal IPN webhook schema"
  content_type = "application/json"
  schema       = file("${path.module}/schemas/paypal-webhook-schema.json")
}

# POST method for PayPal webhook
resource "aws_api_gateway_method" "paypal_post" {
  rest_api_id          = aws_api_gateway_rest_api.webhook_api.id
  resource_id          = aws_api_gateway_resource.paypal.id
  http_method          = "POST"
  authorization        = "NONE"
  api_key_required     = true
  request_validator_id = aws_api_gateway_request_validator.paypal_validator.id

  request_models = {
    "application/json" = aws_api_gateway_model.paypal_webhook.name
  }
}

# Integration with PayPal validator Lambda
resource "aws_api_gateway_integration" "paypal_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.paypal.id
  http_method             = aws_api_gateway_method.paypal_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.paypal_validator.invoke_arn
}

# /api/v1/webhooks/square resource
resource "aws_api_gateway_resource" "square" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.webhooks.id
  path_part   = "square"
}

# Square Webhook Request Validator
resource "aws_api_gateway_request_validator" "square_validator" {
  name                        = "square-request-validator"
  rest_api_id                 = aws_api_gateway_rest_api.webhook_api.id
  validate_request_body       = true
  validate_request_parameters = false
}

# Square Webhook Model
resource "aws_api_gateway_model" "square_webhook" {
  rest_api_id  = aws_api_gateway_rest_api.webhook_api.id
  name         = "SquareWebhook"
  description  = "Square webhook event schema"
  content_type = "application/json"
  schema       = file("${path.module}/schemas/square-webhook-schema.json")
}

# POST method for Square webhook
resource "aws_api_gateway_method" "square_post" {
  rest_api_id          = aws_api_gateway_rest_api.webhook_api.id
  resource_id          = aws_api_gateway_resource.square.id
  http_method          = "POST"
  authorization        = "NONE"
  api_key_required     = true
  request_validator_id = aws_api_gateway_request_validator.square_validator.id

  request_models = {
    "application/json" = aws_api_gateway_model.square_webhook.name
  }
}

# Integration with Square validator Lambda
resource "aws_api_gateway_integration" "square_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.square.id
  http_method             = aws_api_gateway_method.square_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.square_validator.invoke_arn
}

# /api/v1/transactions resource
resource "aws_api_gateway_resource" "transactions" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.api_v1.id
  path_part   = "transactions"
}

# GET method for listing transactions
resource "aws_api_gateway_method" "transactions_get" {
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  resource_id   = aws_api_gateway_resource.transactions.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.querystring.provider" = false
    "method.request.querystring.start"    = false
    "method.request.querystring.end"      = false
  }
}

# Integration for GET transactions
resource "aws_api_gateway_integration" "transactions_get_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.transactions.id
  http_method             = aws_api_gateway_method.transactions_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.query.invoke_arn
}

# /api/v1/transactions/{id} resource
resource "aws_api_gateway_resource" "transaction_by_id" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.transactions.id
  path_part   = "{id}"
}

# GET method for transaction by ID
resource "aws_api_gateway_method" "transaction_by_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  resource_id   = aws_api_gateway_resource.transaction_by_id.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.id" = true
  }
}

# Integration for GET transaction by ID
resource "aws_api_gateway_integration" "transaction_by_id_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.transaction_by_id.id
  http_method             = aws_api_gateway_method.transaction_by_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.query.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.webhook_api.body,
      aws_api_gateway_resource.stripe.id,
      aws_api_gateway_method.stripe_post.id,
      aws_api_gateway_integration.stripe_lambda.id,
      aws_api_gateway_resource.paypal.id,
      aws_api_gateway_method.paypal_post.id,
      aws_api_gateway_integration.paypal_lambda.id,
      aws_api_gateway_resource.square.id,
      aws_api_gateway_method.square_post.id,
      aws_api_gateway_integration.square_lambda.id,
      aws_api_gateway_resource.transactions.id,
      aws_api_gateway_method.transactions_get.id,
      aws_api_gateway_integration.transactions_get_lambda.id,
      aws_api_gateway_resource.transaction_by_id.id,
      aws_api_gateway_method.transaction_by_id_get.id,
      aws_api_gateway_integration.transaction_by_id_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  stage_name    = var.environment

  xray_tracing_enabled = var.xray_tracing_enabled

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

  tags = local.common_tags
}

# API Gateway Method Settings for logging and tracing
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
  }
}

# Usage Plans for Provider-specific Rate Limiting

# Stripe Usage Plan
resource "aws_api_gateway_usage_plan" "stripe" {
  name        = "${local.name_prefix}-stripe-plan-${local.env_suffix}"
  description = "Usage plan for Stripe webhooks"

  api_stages {
    api_id = aws_api_gateway_rest_api.webhook_api.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  quota_settings {
    limit  = 1000000
    period = "DAY"
  }

  throttle_settings {
    burst_limit = var.api_throttle_burst_limit
    rate_limit  = var.stripe_throttle_limit
  }

  tags = local.common_tags
}

# API Key for Stripe
resource "aws_api_gateway_api_key" "stripe" {
  name    = "${local.name_prefix}-stripe-key-${local.env_suffix}"
  enabled = true

  tags = merge(
    local.common_tags,
    {
      Provider = "stripe"
    }
  )
}

# Associate Stripe API key with usage plan
resource "aws_api_gateway_usage_plan_key" "stripe" {
  key_id        = aws_api_gateway_api_key.stripe.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.stripe.id
}

# PayPal Usage Plan
resource "aws_api_gateway_usage_plan" "paypal" {
  name        = "${local.name_prefix}-paypal-plan-${local.env_suffix}"
  description = "Usage plan for PayPal webhooks"

  api_stages {
    api_id = aws_api_gateway_rest_api.webhook_api.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  quota_settings {
    limit  = 1000000
    period = "DAY"
  }

  throttle_settings {
    burst_limit = var.api_throttle_burst_limit
    rate_limit  = var.paypal_throttle_limit
  }

  tags = local.common_tags
}

# API Key for PayPal
resource "aws_api_gateway_api_key" "paypal" {
  name    = "${local.name_prefix}-paypal-key-${local.env_suffix}"
  enabled = true

  tags = merge(
    local.common_tags,
    {
      Provider = "paypal"
    }
  )
}

# Associate PayPal API key with usage plan
resource "aws_api_gateway_usage_plan_key" "paypal" {
  key_id        = aws_api_gateway_api_key.paypal.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.paypal.id
}

# Square Usage Plan
resource "aws_api_gateway_usage_plan" "square" {
  name        = "${local.name_prefix}-square-plan-${local.env_suffix}"
  description = "Usage plan for Square webhooks"

  api_stages {
    api_id = aws_api_gateway_rest_api.webhook_api.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  quota_settings {
    limit  = 1000000
    period = "DAY"
  }

  throttle_settings {
    burst_limit = var.api_throttle_burst_limit
    rate_limit  = var.square_throttle_limit
  }

  tags = local.common_tags
}

# API Key for Square
resource "aws_api_gateway_api_key" "square" {
  name    = "${local.name_prefix}-square-key-${local.env_suffix}"
  enabled = true

  tags = merge(
    local.common_tags,
    {
      Provider = "square"
    }
  )
}

# Associate Square API key with usage plan
resource "aws_api_gateway_usage_plan_key" "square" {
  key_id        = aws_api_gateway_api_key.square.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.square.id
}
