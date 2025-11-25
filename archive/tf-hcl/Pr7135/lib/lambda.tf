# Lambda Function for Fraud Detection
resource "aws_lambda_function" "fraud_detector" {
  function_name = "fraud-detector-${var.environment_suffix}"
  role          = aws_iam_role.lambda_fraud_detector.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_fraud_detector.repository_url}:latest"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.fraud_patterns.name
      S3_AUDIT_BUCKET     = aws_s3_bucket.audit_trail.id
      KMS_KEY_ID          = aws_kms_key.fraud_detection.id
      ENVIRONMENT_SUFFIX  = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.fraud_detection_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_fraud_detector,
    aws_iam_role_policy.lambda_logs
  ]

  tags = {
    Name = "fraud-detector-${var.environment_suffix}"
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke-${var.environment_suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fraud_detector.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fraud_detection.execution_arn}/*/*"
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke-${var.environment_suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fraud_detector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.batch_processing.arn
}
