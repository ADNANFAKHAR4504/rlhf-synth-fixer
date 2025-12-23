# Lambda function for encryption compliance check
resource "aws_lambda_function" "encryption_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  filename         = data.archive_file.encryption_lambda.output_path
  function_name    = "config-encryption-check-${var.environment_suffix}-${each.value}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "encryption_check.lambda_handler"
  source_code_hash = data.archive_file.encryption_lambda.output_base64sha256
  runtime          = "python3.9"
  timeout          = var.lambda_timeout

  architectures = ["arm64"]

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      SNS_TOPIC_ARN      = aws_sns_topic.compliance_notifications.arn
      AWS_REGION_NAME    = each.value
    }
  }

  tags = {
    Name           = "encryption-check-${var.environment_suffix}-${each.value}"
    Environment    = var.environment_suffix
    ComplianceRule = "encryption"
  }
}

# Lambda function for tagging compliance check
resource "aws_lambda_function" "tagging_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  filename         = data.archive_file.tagging_lambda.output_path
  function_name    = "config-tagging-check-${var.environment_suffix}-${each.value}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "tagging_check.lambda_handler"
  source_code_hash = data.archive_file.tagging_lambda.output_base64sha256
  runtime          = "python3.9"
  timeout          = var.lambda_timeout

  architectures = ["arm64"]

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      SNS_TOPIC_ARN      = aws_sns_topic.compliance_notifications.arn
      AWS_REGION_NAME    = each.value
    }
  }

  tags = {
    Name           = "tagging-check-${var.environment_suffix}-${each.value}"
    Environment    = var.environment_suffix
    ComplianceRule = "tagging"
  }
}

# Lambda function for backup compliance check
resource "aws_lambda_function" "backup_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  filename         = data.archive_file.backup_lambda.output_path
  function_name    = "config-backup-check-${var.environment_suffix}-${each.value}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "backup_check.lambda_handler"
  source_code_hash = data.archive_file.backup_lambda.output_base64sha256
  runtime          = "python3.9"
  timeout          = var.lambda_timeout

  architectures = ["arm64"]

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      SNS_TOPIC_ARN      = aws_sns_topic.compliance_notifications.arn
      AWS_REGION_NAME    = each.value
    }
  }

  tags = {
    Name           = "backup-check-${var.environment_suffix}-${each.value}"
    Environment    = var.environment_suffix
    ComplianceRule = "backup"
  }
}

# Lambda permission for Config to invoke encryption check
resource "aws_lambda_permission" "encryption_check" {
  for_each = toset(var.aws_regions)

  statement_id   = "AllowConfigInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.encryption_check[each.value].function_name
  principal      = "config.amazonaws.com"
  source_account = local.account_id
}

# Lambda permission for Config to invoke tagging check
resource "aws_lambda_permission" "tagging_check" {
  for_each = toset(var.aws_regions)

  statement_id   = "AllowConfigInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.tagging_check[each.value].function_name
  principal      = "config.amazonaws.com"
  source_account = local.account_id
}

# Lambda permission for Config to invoke backup check
resource "aws_lambda_permission" "backup_check" {
  for_each = toset(var.aws_regions)

  statement_id   = "AllowConfigInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.backup_check[each.value].function_name
  principal      = "config.amazonaws.com"
  source_account = local.account_id
}

# EventBridge rule to trigger Lambda functions every 6 hours
resource "aws_cloudwatch_event_rule" "compliance_schedule" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  name                = "compliance-check-schedule-${var.environment_suffix}-${each.value}"
  description         = "Trigger compliance checks every 6 hours"
  schedule_expression = var.compliance_check_schedule

  tags = {
    Name        = "compliance-schedule-${var.environment_suffix}-${each.value}"
    Environment = var.environment_suffix
  }
}

# EventBridge targets for encryption check
resource "aws_cloudwatch_event_target" "encryption_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  rule      = aws_cloudwatch_event_rule.compliance_schedule[each.value].name
  target_id = "encryption-check-${each.value}"
  arn       = aws_lambda_function.encryption_check[each.value].arn
}

# Lambda permission for EventBridge to invoke encryption check
resource "aws_lambda_permission" "encryption_check_eventbridge" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.encryption_check[each.value].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_schedule[each.value].arn
}

# EventBridge targets for tagging check
resource "aws_cloudwatch_event_target" "tagging_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  rule      = aws_cloudwatch_event_rule.compliance_schedule[each.value].name
  target_id = "tagging-check-${each.value}"
  arn       = aws_lambda_function.tagging_check[each.value].arn
}

# Lambda permission for EventBridge to invoke tagging check
resource "aws_lambda_permission" "tagging_check_eventbridge" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tagging_check[each.value].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_schedule[each.value].arn
}

# EventBridge targets for backup check
resource "aws_cloudwatch_event_target" "backup_check" {
  for_each = toset(var.aws_regions)

  provider = aws.primary

  rule      = aws_cloudwatch_event_rule.compliance_schedule[each.value].name
  target_id = "backup-check-${each.value}"
  arn       = aws_lambda_function.backup_check[each.value].arn
}

# Lambda permission for EventBridge to invoke backup check
resource "aws_lambda_permission" "backup_check_eventbridge" {
  for_each = toset(var.aws_regions)

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backup_check[each.value].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_schedule[each.value].arn
}
