resource "aws_lambda_function" "custom_rules_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "security-custom-rules-processor-${local.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      LOG_GROUP = aws_cloudwatch_log_group.security_events.name
      SNS_TOPIC = aws_sns_topic.security_alerts.arn
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "custom-rules-processor-${local.environment_suffix}"
    }
  )
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "/tmp/lambda_function.zip"

  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "index.py"
  }
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_rules_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_hub_findings.arn
}