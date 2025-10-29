# API Gateway CloudWatch Role
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "Event processing REST API for ${var.project_name}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# Request Validator
resource "aws_api_gateway_request_validator" "main" {
  name                        = "main-validator"
  rest_api_id                 = aws_api_gateway_rest_api.main.id
  validate_request_body       = true
  validate_request_parameters = true
}

# Lambda Authorizer
resource "aws_api_gateway_authorizer" "main" {
  name                             = "${local.name_prefix}-authorizer"
  rest_api_id                      = aws_api_gateway_rest_api.main.id
  authorizer_uri                   = aws_lambda_function.authorizer.invoke_arn
  authorizer_credentials           = aws_iam_role.api_gateway_authorizer.arn
  type                             = "TOKEN"
  authorizer_result_ttl_in_seconds = 300

  depends_on = [aws_lambda_function.authorizer]
}

# Resources
resource "aws_api_gateway_resource" "events" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "events"
}

resource "aws_api_gateway_resource" "event_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.events.id
  path_part   = "{eventId}"
}

# Methods
resource "aws_api_gateway_method" "post_event" {
  rest_api_id          = aws_api_gateway_rest_api.main.id
  resource_id          = aws_api_gateway_resource.events.id
  http_method          = "POST"
  authorization        = "CUSTOM"
  authorizer_id        = aws_api_gateway_authorizer.main.id
  request_validator_id = aws_api_gateway_request_validator.main.id

  request_parameters = {
    "method.request.header.X-Trace-Id" = false
  }

  request_models = {
    "application/json" = aws_api_gateway_model.event_model.name
  }
}

# Model for request validation
resource "aws_api_gateway_model" "event_model" {
  rest_api_id  = aws_api_gateway_rest_api.main.id
  name         = "EventModel"
  content_type = "application/json"

  schema = jsonencode({
    type     = "object"
    required = ["eventType", "payload", "timestamp"]
    properties = {
      eventType = {
        type = "string"
        enum = ["transaction", "payment", "transfer"]
      }
      payload = {
        type = "object"
      }
      timestamp = {
        type = "string"
      }
    }
  })
}

# Integration
resource "aws_api_gateway_integration" "post_event" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.events.id
  http_method = aws_api_gateway_method.post_event.http_method

  integration_http_method = "POST"
  type                    = "AWS"
  uri                     = aws_lambda_function.event_ingestion.invoke_arn

  request_templates = {
    "application/json" = <<EOF
#set($context.requestOverride.header.X-Amz-Invocation-Type = "Event")
{
  "body": $input.json('$'),
  "headers": {
    #foreach($header in $input.params().header.keySet())
    "$header": "$util.escapeJavaScript($input.params().header.get($header))"#if($foreach.hasNext),#end
    #end
  },
  "requestContext": {
    "requestId": "$context.requestId",
    "apiId": "$context.apiId",
    "stage": "$context.stage",
    "requestTime": "$context.requestTime",
    "identity": {
      "sourceIp": "$context.identity.sourceIp",
      "userAgent": "$context.identity.userAgent"
    }
  }
}
EOF
  }

  depends_on = [aws_lambda_function.event_ingestion]
}

# Method Response
resource "aws_api_gateway_method_response" "post_event" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.events.id
  http_method = aws_api_gateway_method.post_event.http_method
  status_code = "202"

  response_parameters = {
    "method.response.header.X-Request-Id" = true
  }
}

# Integration Response
resource "aws_api_gateway_integration_response" "post_event" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.events.id
  http_method = aws_api_gateway_method.post_event.http_method
  status_code = aws_api_gateway_method_response.post_event.status_code

  response_templates = {
    "application/json" = <<EOF
{
  "status": "accepted",
  "requestId": "$context.requestId"
}
EOF
  }

  response_parameters = {
    "method.response.header.X-Request-Id" = "context.requestId"
  }

  depends_on = [
    aws_api_gateway_integration.post_event,
    aws_api_gateway_method_response.post_event
  ]
}

# Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.events.id,
      aws_api_gateway_method.post_event.id,
      aws_api_gateway_integration.post_event.id,
      aws_api_gateway_integration_response.post_event.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.post_event,
    aws_api_gateway_integration_response.post_event,
    aws_api_gateway_method_response.post_event
  ]
}

# Stage with X-Ray tracing
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment_suffix

  xray_tracing_enabled = true

  tags = local.common_tags
}

# Method settings for detailed CloudWatch metrics
resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_rate_limit  = var.api_throttle_rate_limit
    throttling_burst_limit = var.api_throttle_burst_limit
  }
}