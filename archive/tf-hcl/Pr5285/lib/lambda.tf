# Archive Lambda function code
data "archive_file" "authorizer" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src/authorizer"
  output_path = "${path.module}/.terraform/lambda-packages/authorizer.zip"
}

data "archive_file" "event_ingestion" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src/event-ingestion"
  output_path = "${path.module}/.terraform/lambda-packages/event-ingestion.zip"
}

data "archive_file" "event_processing" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src/event-processing"
  output_path = "${path.module}/.terraform/lambda-packages/event-processing.zip"
}

data "archive_file" "event_storage" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src/event-storage"
  output_path = "${path.module}/.terraform/lambda-packages/event-storage.zip"
}

# Lambda Authorizer Function
resource "aws_lambda_function" "authorizer" {
  filename         = data.archive_file.authorizer.output_path
  function_name    = "${local.name_prefix}-auth-v2"
  role             = aws_iam_role.lambda_authorizer.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.authorizer.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 128
  architectures    = ["arm64"]

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      SSM_AUTH_TOKEN_PATH = aws_ssm_parameter.auth_token.name
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.lambda_authorizer_basic,
    aws_iam_role_policy_attachment.lambda_authorizer_xray,
    aws_cloudwatch_log_group.lambda_authorizer
  ]
}

# Event Ingestion Lambda
resource "aws_lambda_function" "event_ingestion" {
  filename         = data.archive_file.event_ingestion.output_path
  function_name    = "${local.name_prefix}-ingest-v2"
  role             = aws_iam_role.lambda_ingestion.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.event_ingestion.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = var.lambda_timeout_ingestion
  memory_size      = 512
  architectures    = ["arm64"]

  layers = [aws_lambda_layer_version.common_dependencies.arn]

  reserved_concurrent_executions = 10

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      SQS_QUEUE_URL   = aws_sqs_queue.event_queue.url
      EVENTBRIDGE_BUS = aws_cloudwatch_event_bus.main.name
      DYNAMODB_TABLE  = aws_dynamodb_table.events.name
      ENVIRONMENT     = var.environment
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.lambda_ingestion_basic,
    aws_iam_role_policy_attachment.lambda_ingestion_xray,
    aws_cloudwatch_log_group.lambda_ingestion
  ]
}

# Event Processing Lambda
resource "aws_lambda_function" "event_processing" {
  filename         = data.archive_file.event_processing.output_path
  function_name    = "${local.name_prefix}-process-v2"
  role             = aws_iam_role.lambda_processing.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.event_processing.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = var.lambda_timeout_processing
  memory_size      = 2048
  architectures    = ["arm64"]

  layers = [aws_lambda_layer_version.common_dependencies.arn]

  reserved_concurrent_executions = 5

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE  = aws_dynamodb_table.events.name
      EVENTBRIDGE_BUS = aws_cloudwatch_event_bus.main.name
      ENVIRONMENT     = var.environment
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.lambda_processing_basic,
    aws_iam_role_policy_attachment.lambda_processing_sqs,
    aws_iam_role_policy_attachment.lambda_processing_xray,
    aws_cloudwatch_log_group.lambda_processing
  ]
}

# Event Storage Lambda
resource "aws_lambda_function" "event_storage" {
  filename         = data.archive_file.event_storage.output_path
  function_name    = "${local.name_prefix}-store-v2"
  role             = aws_iam_role.lambda_storage.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.event_storage.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = var.lambda_timeout_storage
  memory_size      = 1024
  architectures    = ["arm64"]

  layers = [aws_lambda_layer_version.common_dependencies.arn]

  reserved_concurrent_executions = 5

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.events.name
      ENVIRONMENT    = var.environment
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.lambda_storage_basic,
    aws_iam_role_policy_attachment.lambda_storage_xray,
    aws_cloudwatch_log_group.lambda_storage
  ]
}

# Lambda Destinations
resource "aws_lambda_function_event_invoke_config" "event_ingestion" {
  function_name                = aws_lambda_function.event_ingestion.function_name
  maximum_event_age_in_seconds = 3600
  maximum_retry_attempts       = 2

  destination_config {
    on_success {
      destination = aws_sqs_queue.event_queue.arn
    }

    on_failure {
      destination = aws_sqs_queue.dlq.arn
    }
  }
}

resource "aws_lambda_function_event_invoke_config" "event_processing" {
  function_name                = aws_lambda_function.event_processing.function_name
  maximum_event_age_in_seconds = 7200
  maximum_retry_attempts       = 1

  destination_config {
    on_success {
      destination = aws_cloudwatch_event_bus.main.arn
    }

    on_failure {
      destination = aws_sqs_queue.dlq.arn
    }
  }
}

# Lambda Permissions
resource "aws_lambda_permission" "api_gateway_authorizer" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_ingestion" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_ingestion.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "eventbridge_processing" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_processing.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.transaction_events.arn
}

resource "aws_lambda_permission" "eventbridge_storage" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_storage.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.processed_events.arn
}

resource "aws_lambda_permission" "sqs_processing" {
  statement_id  = "AllowSQSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_processing.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.event_queue.arn
}
