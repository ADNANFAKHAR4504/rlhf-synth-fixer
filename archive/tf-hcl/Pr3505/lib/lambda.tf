# Create Lambda layers for dependencies
resource "aws_lambda_layer_version" "powertools" {
  filename            = data.archive_file.powertools_layer.output_path
  layer_name          = "${local.resource_prefix}-powertools-layer"
  compatible_runtimes = ["nodejs20.x"]
  source_code_hash    = data.archive_file.powertools_layer.output_base64sha256

  description = "Lambda Powertools for Node.js"
}

data "archive_file" "powertools_layer" {
  type        = "zip"
  output_path = "${path.module}/layers/powertools.zip"

  source {
    content  = file("${path.module}/lambda/layers/package.json")
    filename = "nodejs/package.json"
  }
}

# Webhook Validation Lambda
resource "aws_lambda_function" "webhook_validation" {
  filename         = data.archive_file.validation_lambda.output_path
  function_name    = "${local.resource_prefix}-webhook-validation"
  role             = aws_iam_role.webhook_validation_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory
  source_code_hash = data.archive_file.validation_lambda.output_base64sha256

  reserved_concurrent_executions = 10

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      SQS_QUEUE_URL                = aws_sqs_queue.webhook_processing.url
      DYNAMODB_TABLE               = aws_dynamodb_table.webhook_logs.name
      SECRET_ARN                   = aws_secretsmanager_secret.webhook_secrets.arn
      POWERTOOLS_SERVICE_NAME      = "webhook-validation"
      POWERTOOLS_METRICS_NAMESPACE = "WebhookProcessor"
      LOG_LEVEL                    = "INFO"
    }
  }

  layers = [aws_lambda_layer_version.powertools.arn]

  dead_letter_config {
    target_arn = aws_sqs_queue.webhook_dlq.arn
  }

  tags = local.common_tags
}

data "archive_file" "validation_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda/validation.zip"

  source {
    content  = file("${path.module}/lambda/validation/index.js")
    filename = "index.js"
  }
}

# Webhook Routing Lambda
resource "aws_lambda_function" "webhook_routing" {
  filename         = data.archive_file.routing_lambda.output_path
  function_name    = "${local.resource_prefix}-webhook-routing"
  role             = aws_iam_role.webhook_routing_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory
  source_code_hash = data.archive_file.routing_lambda.output_base64sha256

  reserved_concurrent_executions = 20

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE               = aws_dynamodb_table.webhook_logs.name
      EVENT_BUS_NAME               = aws_cloudwatch_event_bus.webhook_events.name
      DLQ_URL                      = aws_sqs_queue.webhook_dlq.url
      POWERTOOLS_SERVICE_NAME      = "webhook-routing"
      POWERTOOLS_METRICS_NAMESPACE = "WebhookProcessor"
      LOG_LEVEL                    = "INFO"
    }
  }

  layers = [aws_lambda_layer_version.powertools.arn]

  dead_letter_config {
    target_arn = aws_sqs_queue.webhook_dlq.arn
  }

  tags = local.common_tags
}

data "archive_file" "routing_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda/routing.zip"

  source {
    content  = file("${path.module}/lambda/routing/index.js")
    filename = "index.js"
  }
}

# Lambda Event Source Mapping for SQS
resource "aws_lambda_event_source_mapping" "sqs_to_routing" {
  event_source_arn                   = aws_sqs_queue.webhook_processing.arn
  function_name                      = aws_lambda_function.webhook_routing.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 10
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_validation" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_validation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}