resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = "${var.project}-${var.environment}-api-${local.suffix}"
  description = "Webhook processing API"

  endpoint_configuration { types = ["REGIONAL"] }

  tags = local.common_tags
}

resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "webhook"
}

resource "aws_api_gateway_request_validator" "webhook_validator" {
  rest_api_id                 = aws_api_gateway_rest_api.webhook_api.id
  name                        = "webhook-request-validator"
  validate_request_body       = true
  validate_request_parameters = true
}

resource "aws_api_gateway_method" "webhook_post" {
  rest_api_id          = aws_api_gateway_rest_api.webhook_api.id
  resource_id          = aws_api_gateway_resource.webhook.id
  http_method          = "POST"
  authorization        = "NONE"
  api_key_required     = true
  request_validator_id = aws_api_gateway_request_validator.webhook_validator.id
}

resource "aws_api_gateway_integration" "webhook_lambda" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  resource_id = aws_api_gateway_resource.webhook.id
  http_method = aws_api_gateway_method.webhook_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.webhook_receiver.invoke_arn
}

resource "aws_api_gateway_deployment" "webhook_deployment" {
  depends_on  = [aws_api_gateway_integration.webhook_lambda]
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id

  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "webhook_stage" {
  deployment_id        = aws_api_gateway_deployment.webhook_deployment.id
  rest_api_id          = aws_api_gateway_rest_api.webhook_api.id
  stage_name           = var.environment
  xray_tracing_enabled = true

  tags = local.common_tags
}

resource "aws_api_gateway_api_key" "webhook_key" {
  name    = "${var.project}-${var.environment}-api-key-${local.suffix}"
  enabled = true

  tags = local.common_tags
}

resource "aws_api_gateway_usage_plan" "webhook_plan" {
  name = "${var.project}-${var.environment}-usage-plan-${local.suffix}"

  api_stages {
    api_id = aws_api_gateway_rest_api.webhook_api.id
    stage  = aws_api_gateway_stage.webhook_stage.stage_name
  }

  quota_settings {
    limit  = 1000000
    period = "MONTH"
  }

  throttle_settings {
    rate_limit  = 1000
    burst_limit = 2000
  }

  tags = local.common_tags
}

resource "aws_api_gateway_usage_plan_key" "webhook_plan_key" {
  key_id        = aws_api_gateway_api_key.webhook_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.webhook_plan.id
}
