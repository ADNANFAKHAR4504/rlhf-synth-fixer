# Lambda function: event-validator
resource "aws_lambda_function" "validator" {
  function_name = "${var.project_name}-validator-${var.environment_suffix}"
  role          = aws_iam_role.validator.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_images.repository_url}:validator-latest"

  architectures = ["arm64"]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.processed_events.name
      AWS_REGION_CUSTOM   = var.aws_region
      ENVIRONMENT         = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.validator_dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.validator,
    null_resource.build_and_push_lambda_images
  ]

  tags = {
    Name = "${var.project_name}-validator-${var.environment_suffix}"
  }
}

# Lambda function: event-processor
resource "aws_lambda_function" "processor" {
  function_name = "${var.project_name}-processor-${var.environment_suffix}"
  role          = aws_iam_role.processor.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_images.repository_url}:processor-latest"

  architectures = ["arm64"]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.processed_events.name
      AWS_REGION_CUSTOM   = var.aws_region
      ENVIRONMENT         = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.processor_dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.processor,
    null_resource.build_and_push_lambda_images
  ]

  tags = {
    Name = "${var.project_name}-processor-${var.environment_suffix}"
  }
}

# Lambda function: event-enricher
resource "aws_lambda_function" "enricher" {
  function_name = "${var.project_name}-enricher-${var.environment_suffix}"
  role          = aws_iam_role.enricher.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_images.repository_url}:enricher-latest"

  architectures = ["arm64"]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.processed_events.name
      AWS_REGION_CUSTOM   = var.aws_region
      ENVIRONMENT         = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.enricher_dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.enricher,
    null_resource.build_and_push_lambda_images
  ]

  tags = {
    Name = "${var.project_name}-enricher-${var.environment_suffix}"
  }
}

# Lambda function: event-trigger (triggered by SNS)
resource "aws_lambda_function" "event_trigger" {
  function_name = "${var.project_name}-trigger-${var.environment_suffix}"
  role          = aws_iam_role.event_trigger.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_images.repository_url}:trigger-latest"

  architectures = ["arm64"]
  memory_size   = 256
  timeout       = 30

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.event_processing.arn
      ENVIRONMENT       = var.environment_suffix
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.event_trigger,
    null_resource.build_and_push_lambda_images
  ]

  tags = {
    Name = "${var.project_name}-trigger-${var.environment_suffix}"
  }
}

# Lambda permission for SNS to invoke event-trigger
resource "aws_lambda_permission" "sns_invoke" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_trigger.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.payment_events.arn
}
