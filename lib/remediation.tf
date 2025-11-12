# Lambda function for automated remediation
resource "aws_lambda_function" "remediation" {
  filename         = "${path.module}/lambda/remediation.zip"
  function_name    = "compliance-remediation-${var.environment_suffix}"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 300
  source_code_hash = filebase64sha256("${path.module}/lambda/remediation.zip")

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      CONFIG_BUCKET      = aws_s3_bucket.config_bucket.id
      KMS_KEY_ID         = aws_kms_key.config_key.id
      SNS_TOPIC_ARN      = var.sns_email_endpoint != "" ? aws_sns_topic.compliance_notifications[0].arn : ""
    }
  }

  tags = {
    Name        = "compliance-remediation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  depends_on = [aws_cloudwatch_log_group.lambda_remediation]
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_remediation" {
  name = "compliance-lambda-remediation-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "compliance-lambda-remediation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "lambda_remediation_policy" {
  name = "compliance-lambda-remediation-policy"
  role = aws_iam_role.lambda_remediation.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutBucketPublicAccessBlock",
          "s3:PutEncryptionConfiguration",
          "s3:PutBucketVersioning"
        ]
        Resource = "arn:aws:s3:::*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:ModifyInstanceAttribute",
          "ec2:ModifyVolume",
          "ec2:CreateTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBInstance",
          "rds:AddTagsToResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:PutEvaluations",
          "config:GetComplianceDetailsByResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_email_endpoint != "" ? aws_sns_topic.compliance_notifications[0].arn : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.config_key.arn
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_remediation" {
  name              = "/aws/lambda/compliance-remediation-${var.environment_suffix}"
  retention_in_days = 14

  tags = {
    Name        = "compliance-remediation-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# EventBridge Rule for Config Compliance Changes
resource "aws_cloudwatch_event_rule" "config_compliance_change" {
  name        = "compliance-config-change-${var.environment_suffix}"
  description = "Trigger remediation on Config compliance changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
      newEvaluationResult = {
        complianceType = ["NON_COMPLIANT"]
      }
    }
  })

  tags = {
    Name        = "compliance-config-change-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "lambda_remediation" {
  count = var.enable_auto_remediation ? 1 : 0
  rule  = aws_cloudwatch_event_rule.config_compliance_change.name
  arn   = aws_lambda_function.remediation.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count         = var.enable_auto_remediation ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.config_compliance_change.arn
}
