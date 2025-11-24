# main.tf

# DynamoDB Global Table v2 (2019.11.21)
# This version supports replicas configured directly in the table
resource "aws_dynamodb_table" "transactions" {
  provider = aws.primary

  name             = "${var.project_name}-${var.environment_suffix}-transactions"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "transactionId"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "transactionId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-timestamp-index"
    hash_key        = "userId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # Global Table v2 - Configure replica in secondary region
  replica {
    region_name = var.secondary_region
    
    point_in_time_recovery = true
  }

  server_side_encryption {
    enabled = true
    # Using AWS-managed encryption for simplicity
    # Can use customer-managed KMS keys with Global Table v2 if needed
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.common_tags
}

# KMS keys for encryption - Not used with Global Table v1
# Global Table v1 (2017.11.29) doesn't support customer-managed KMS keys
# Using AWS-managed encryption instead
# Uncomment and configure if migrating to Global Table v2 (2019.11.21)
# resource "aws_kms_key" "dynamodb" {
#   provider                = aws.primary
#   description             = "KMS key for DynamoDB encryption"
#   deletion_window_in_days = 30
#   enable_key_rotation     = true
#
#   tags = var.common_tags
# }
#
# resource "aws_kms_key" "dynamodb_secondary" {
#   provider                = aws.secondary
#   description             = "KMS key for DynamoDB encryption"
#   deletion_window_in_days = 30
#   enable_key_rotation     = true
#
#   tags = var.common_tags
# }

# Secrets Manager for API keys
resource "aws_secretsmanager_secret" "api_keys" {
  provider = aws.primary
  name     = "${var.project_name}-${var.environment_suffix}-api-keys"

  replica {
    region = var.secondary_region
  }

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    master_api_key = var.master_api_key
    jwt_secret     = var.jwt_secret
  })
}

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-${var.environment_suffix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_execution" {
  name = "${var.project_name}-${var.environment_suffix}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.lambda_authorizer_primary.arn}:*",
          "${aws_cloudwatch_log_group.lambda_authorizer_secondary.arn}:*",
          "${aws_cloudwatch_log_group.lambda_transaction_primary.arn}:*",
          "${aws_cloudwatch_log_group.lambda_transaction_secondary.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.api_keys.arn
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        # X-Ray does not support resource-level permissions
        Resource = "*"
      }
    ]
  })
}

# Lambda layer for common dependencies - Primary region
resource "aws_lambda_layer_version" "common_primary" {
  provider            = aws.primary
  filename            = "lambda_layer.zip"
  layer_name          = "${var.project_name}-${var.environment_suffix}-common-layer"
  compatible_runtimes = ["python3.10"]

  lifecycle {
    ignore_changes = [filename]
  }
}

# Lambda layer for common dependencies - Secondary region
resource "aws_lambda_layer_version" "common_secondary" {
  provider            = aws.secondary
  filename            = "lambda_layer.zip"
  layer_name          = "${var.project_name}-${var.environment_suffix}-common-layer"
  compatible_runtimes = ["python3.10"]

  lifecycle {
    ignore_changes = [filename]
  }
}

# Lambda authorizer function - Primary region
resource "aws_lambda_function" "authorizer_primary" {
  provider         = aws.primary
  filename         = "lambda_authorizer.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-authorizer-primary"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_authorizer.lambda_handler"
  source_code_hash = filebase64sha256("lambda_authorizer.zip")
  runtime          = "python3.10"
  timeout          = 10
  memory_size      = 256

  layers = [aws_lambda_layer_version.common_primary.arn]

  environment {
    variables = {
      SECRET_NAME = aws_secretsmanager_secret.api_keys.name
      REGION      = var.primary_region
    }
  }

  tracing_config {
    mode = "Active"
  }

  lifecycle {
    ignore_changes = [filename]
  }

  tags = var.common_tags
}

# Lambda authorizer function - Secondary region
resource "aws_lambda_function" "authorizer_secondary" {
  provider         = aws.secondary
  filename         = "lambda_authorizer.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-authorizer-secondary"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_authorizer.lambda_handler"
  source_code_hash = filebase64sha256("lambda_authorizer.zip")
  runtime          = "python3.10"
  timeout          = 10
  memory_size      = 256

  layers = [aws_lambda_layer_version.common_secondary.arn]

  environment {
    variables = {
      SECRET_NAME = aws_secretsmanager_secret.api_keys.name
      REGION      = var.secondary_region
    }
  }

  tracing_config {
    mode = "Active"
  }

  lifecycle {
    ignore_changes = [filename]
  }

  tags = var.common_tags
}

# Transaction processing Lambda - Primary region
resource "aws_lambda_function" "transaction_primary" {
  provider         = aws.primary
  filename         = "lambda_transaction.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-transaction-primary"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_transaction.lambda_handler"
  source_code_hash = filebase64sha256("lambda_transaction.zip")
  runtime          = "python3.10"
  timeout          = 30
  memory_size      = 512

  layers = [aws_lambda_layer_version.common_primary.arn]

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions.name
      REGION         = var.primary_region
    }
  }

  tracing_config {
    mode = "Active"
  }

  lifecycle {
    ignore_changes = [filename]
  }

  tags = var.common_tags
}

# Transaction processing Lambda - Secondary region
resource "aws_lambda_function" "transaction_secondary" {
  provider         = aws.secondary
  filename         = "lambda_transaction.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-transaction-secondary"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_transaction.lambda_handler"
  source_code_hash = filebase64sha256("lambda_transaction.zip")
  runtime          = "python3.10"
  timeout          = 30
  memory_size      = 512

  layers = [aws_lambda_layer_version.common_secondary.arn]

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions.name
      REGION         = var.secondary_region
    }
  }

  tracing_config {
    mode = "Active"
  }

  lifecycle {
    ignore_changes = [filename]
  }

  tags = var.common_tags
}

# API Gateway - Primary region
resource "aws_api_gateway_rest_api" "main_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-${var.environment_suffix}-api-primary"
  description = "Transaction Processing API - Primary Region"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.common_tags
}

# API Gateway - Secondary region
resource "aws_api_gateway_rest_api" "main_secondary" {
  provider    = aws.secondary
  name        = "${var.project_name}-${var.environment_suffix}-api-secondary"
  description = "Transaction Processing API - Secondary Region"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.common_tags
}

# API Gateway Authorizer - Primary
resource "aws_api_gateway_authorizer" "custom_primary" {
  provider                         = aws.primary
  name                             = "${var.project_name}-custom-authorizer"
  rest_api_id                      = aws_api_gateway_rest_api.main_primary.id
  authorizer_uri                   = aws_lambda_function.authorizer_primary.invoke_arn
  authorizer_credentials           = aws_iam_role.api_gateway_authorizer.arn
  type                             = "TOKEN"
  authorizer_result_ttl_in_seconds = 300
  identity_source                  = "method.request.header.Authorization"
}

# API Gateway Authorizer - Secondary
resource "aws_api_gateway_authorizer" "custom_secondary" {
  provider                         = aws.secondary
  name                             = "${var.project_name}-custom-authorizer"
  rest_api_id                      = aws_api_gateway_rest_api.main_secondary.id
  authorizer_uri                   = aws_lambda_function.authorizer_secondary.invoke_arn
  authorizer_credentials           = aws_iam_role.api_gateway_authorizer.arn
  type                             = "TOKEN"
  authorizer_result_ttl_in_seconds = 300
  identity_source                  = "method.request.header.Authorization"
}

# API Gateway IAM role for invoking Lambda
resource "aws_iam_role" "api_gateway_authorizer" {
  name = "${var.project_name}-${var.environment_suffix}-api-gateway-authorizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy" "api_gateway_authorizer" {
  name = "${var.project_name}-${var.environment_suffix}-api-gateway-authorizer-policy"
  role = aws_iam_role.api_gateway_authorizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = [
          aws_lambda_function.authorizer_primary.arn,
          aws_lambda_function.authorizer_secondary.arn
        ]
      }
    ]
  })
}

# API Gateway resources and methods - Primary
resource "aws_api_gateway_resource" "transactions_primary" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.main_primary.id
  parent_id   = aws_api_gateway_rest_api.main_primary.root_resource_id
  path_part   = "transactions"
}

resource "aws_api_gateway_method" "post_transaction_primary" {
  provider      = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.main_primary.id
  resource_id   = aws_api_gateway_resource.transactions_primary.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.custom_primary.id
}

resource "aws_api_gateway_integration" "transaction_primary" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.main_primary.id
  resource_id = aws_api_gateway_resource.transactions_primary.id
  http_method = aws_api_gateway_method.post_transaction_primary.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_primary.invoke_arn
}

# API Gateway resources and methods - Secondary
resource "aws_api_gateway_resource" "transactions_secondary" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.main_secondary.id
  parent_id   = aws_api_gateway_rest_api.main_secondary.root_resource_id
  path_part   = "transactions"
}

resource "aws_api_gateway_method" "post_transaction_secondary" {
  provider      = aws.secondary
  rest_api_id   = aws_api_gateway_rest_api.main_secondary.id
  resource_id   = aws_api_gateway_resource.transactions_secondary.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.custom_secondary.id
}

resource "aws_api_gateway_integration" "transaction_secondary" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.main_secondary.id
  resource_id = aws_api_gateway_resource.transactions_secondary.id
  http_method = aws_api_gateway_method.post_transaction_secondary.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_secondary.invoke_arn
}

# API Gateway Stage - Primary
resource "aws_api_gateway_deployment" "main_primary" {
  provider = aws.primary
  depends_on = [
    aws_api_gateway_integration.transaction_primary
  ]

  rest_api_id = aws_api_gateway_rest_api.main_primary.id

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage - Secondary
resource "aws_api_gateway_deployment" "main_secondary" {
  provider = aws.secondary
  depends_on = [
    aws_api_gateway_integration.transaction_secondary
  ]

  rest_api_id = aws_api_gateway_rest_api.main_secondary.id

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage Settings - Primary
resource "aws_api_gateway_stage" "main_primary" {
  provider             = aws.primary
  deployment_id        = aws_api_gateway_deployment.main_primary.id
  rest_api_id          = aws_api_gateway_rest_api.main_primary.id
  stage_name           = "${var.api_stage}-${var.environment_suffix}"
  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_primary.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = var.common_tags
}

# API Gateway Stage Settings - Secondary
resource "aws_api_gateway_stage" "main_secondary" {
  provider             = aws.secondary
  deployment_id        = aws_api_gateway_deployment.main_secondary.id
  rest_api_id          = aws_api_gateway_rest_api.main_secondary.id
  stage_name           = "${var.api_stage}-${var.environment_suffix}"
  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_secondary.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = var.common_tags
}

# API Gateway throttling settings - Primary
resource "aws_api_gateway_method_settings" "all_primary" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.main_primary.id
  stage_name  = aws_api_gateway_stage.main_primary.stage_name
  method_path = "*/*"

  settings {
    throttling_burst_limit = 10000
    throttling_rate_limit  = 5000
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = false
    caching_enabled        = false
  }
}

# API Gateway throttling settings - Secondary
resource "aws_api_gateway_method_settings" "all_secondary" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.main_secondary.id
  stage_name  = aws_api_gateway_stage.main_secondary.stage_name
  method_path = "*/*"

  settings {
    throttling_burst_limit = 10000
    throttling_rate_limit  = 5000
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = false
    caching_enabled        = false
  }
}

# Lambda permissions for API Gateway - Primary
resource "aws_lambda_permission" "api_gateway_transaction_primary" {
  provider      = aws.primary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_primary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main_primary.execution_arn}/*/*"
}

# Lambda permissions for API Gateway - Secondary
resource "aws_lambda_permission" "api_gateway_transaction_secondary" {
  provider      = aws.secondary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_secondary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main_secondary.execution_arn}/*/*"
}

# Route 53 Health Checks (optional)
resource "aws_route53_health_check" "primary" {
  count = var.enable_route53 ? 1 : 0

  fqdn              = "${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/${var.api_stage}-${var.environment_suffix}/health"
  failure_threshold = "5"
  request_interval  = "30"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-primary-health-check"
  })
}

resource "aws_route53_health_check" "secondary" {
  count = var.enable_route53 ? 1 : 0

  fqdn              = "${aws_api_gateway_rest_api.main_secondary.id}.execute-api.${var.secondary_region}.amazonaws.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/${var.api_stage}-${var.environment_suffix}/health"
  failure_threshold = "5"
  request_interval  = "30"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-secondary-health-check"
  })
}

# Route 53 Hosted Zone (optional - assuming it exists)
data "aws_route53_zone" "main" {
  provider = aws.global
  count    = var.enable_route53 ? 1 : 0
  name     = var.domain_name
}

# Route 53 Latency-based routing records (optional)
resource "aws_route53_record" "api_primary" {
  count = var.enable_route53 ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 50
  }

  set_identifier  = "primary"
  records         = ["${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com"]
  health_check_id = aws_route53_health_check.primary[0].id
}

resource "aws_route53_record" "api_secondary" {
  count = var.enable_route53 ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 50
  }

  set_identifier  = "secondary"
  records         = ["${aws_api_gateway_rest_api.main_secondary.id}.execute-api.${var.secondary_region}.amazonaws.com"]
  health_check_id = aws_route53_health_check.secondary[0].id
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "api" {
  provider = aws.global
  enabled  = true
  comment  = "${var.project_name}-${var.environment_suffix} API Distribution"

  origin {
    # Use Route 53 domain if enabled, otherwise use primary API Gateway URL
    domain_name = var.enable_route53 ? "api.${var.domain_name}" : "${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com"
    origin_id   = "api-origin"
    origin_path = var.enable_route53 ? "" : "/${var.api_stage}-${var.environment_suffix}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-origin"

    forwarded_values {
      query_string = true
      # Forward only necessary headers (AWS signature headers like X-Amz-Date not allowed)
      headers = ["Authorization", "Content-Type", "Accept"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  web_acl_id = aws_wafv2_web_acl.api_protection.arn

  tags = var.common_tags

  depends_on = [
    aws_wafv2_web_acl.api_protection,
    aws_api_gateway_rest_api.main_primary,
    aws_api_gateway_rest_api.main_secondary
  ]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_gateway_primary" {
  provider          = aws.primary
  name              = "/aws/apigateway/${var.project_name}-${var.environment_suffix}-primary"
  retention_in_days = 90

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway_secondary" {
  provider          = aws.secondary
  name              = "/aws/apigateway/${var.project_name}-${var.environment_suffix}-secondary"
  retention_in_days = 90

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_authorizer_primary" {
  provider          = aws.primary
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-authorizer-primary"
  retention_in_days = 90

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_authorizer_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-authorizer-secondary"
  retention_in_days = 90

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_transaction_primary" {
  provider          = aws.primary
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-transaction-primary"
  retention_in_days = 90

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_transaction_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-transaction-secondary"
  retention_in_days = 90

  tags = var.common_tags
}