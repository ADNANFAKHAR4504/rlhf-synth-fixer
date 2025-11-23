# Lambda Function for Time-Based Access Expiration

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "access_expiration" {
  count = var.enable_time_based_access ? 1 : 0

  name              = local.access_expiration_log_group
  retention_in_days = var.log_retention_days
  kms_key_id        = var.s3_encryption_enabled ? aws_kms_key.s3[0].arn : null

  tags = local.common_tags

  depends_on = [aws_kms_key.s3]
}

# Lambda IAM Role
data "aws_iam_policy_document" "access_expiration_lambda_trust" {
  statement {
    sid     = "AllowLambdaAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  name                 = "${local.name_prefix}-access-expiration-lambda-${local.name_suffix}"
  description          = "Lambda role for time-based access expiration"
  assume_role_policy   = data.aws_iam_policy_document.access_expiration_lambda_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "Lambda-AccessExpiration"
  })
}

# Lambda Execution Policy
data "aws_iam_policy_document" "access_expiration_lambda_policy" {
  # CloudWatch Logs permissions
  statement {
    sid    = "WriteCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.access_expiration[0].arn}:*"
    ]
  }

  # IAM permissions to list and detach policies
  statement {
    sid    = "ManageIAMPolicies"
    effect = "Allow"
    actions = [
      "iam:ListPolicies",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:ListEntitiesForPolicy",
      "iam:DetachUserPolicy",
      "iam:DetachGroupPolicy",
      "iam:DetachRolePolicy"
    ]
    resources = ["*"]
  }

  # CloudWatch metrics permissions
  statement {
    sid    = "PublishMetrics"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData"
    ]
    resources = ["*"]
  }

  # SNS permissions for notifications
  statement {
    sid    = "PublishToSNS"
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = var.enable_iam_monitoring ? [aws_sns_topic.security_alerts[0].arn] : []
  }
}

resource "aws_iam_policy" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  name        = "${local.name_prefix}-access-expiration-lambda-policy-${local.name_suffix}"
  description = "Lambda policy for access expiration function"
  policy      = data.aws_iam_policy_document.access_expiration_lambda_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  role       = aws_iam_role.access_expiration_lambda[0].name
  policy_arn = aws_iam_policy.access_expiration_lambda[0].arn
}

# Archive Lambda function code
data "archive_file" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  type        = "zip"
  source_dir  = "${path.module}/lambda-access-expiration"
  output_path = "${path.module}/.terraform/lambda-access-expiration.zip"
}

# Lambda Function
resource "aws_lambda_function" "access_expiration" {
  count = var.enable_time_based_access ? 1 : 0

  filename         = data.archive_file.access_expiration_lambda[0].output_path
  function_name    = local.access_expiration_lambda
  role             = aws_iam_role.access_expiration_lambda[0].arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.access_expiration_lambda[0].output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 256

  environment {
    variables = {
      SNS_TOPIC_ARN = var.enable_iam_monitoring ? aws_sns_topic.security_alerts[0].arn : ""
      PROJECT_NAME  = var.project_name
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = local.common_tags

  depends_on = [
    aws_cloudwatch_log_group.access_expiration,
    aws_iam_role_policy_attachment.access_expiration_lambda
  ]
}

# EventBridge Rule to trigger Lambda on schedule
resource "aws_cloudwatch_event_rule" "access_expiration_schedule" {
  count = var.enable_time_based_access ? 1 : 0

  name                = "${local.name_prefix}-access-expiration-schedule-${local.name_suffix}"
  description         = "Trigger access expiration check every ${var.access_check_interval} minutes"
  schedule_expression = "rate(${var.access_check_interval} minutes)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  rule      = aws_cloudwatch_event_rule.access_expiration_schedule[0].name
  target_id = "AccessExpirationLambda"
  arn       = aws_lambda_function.access_expiration[0].arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "access_expiration_eventbridge" {
  count = var.enable_time_based_access ? 1 : 0

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.access_expiration[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.access_expiration_schedule[0].arn
}
