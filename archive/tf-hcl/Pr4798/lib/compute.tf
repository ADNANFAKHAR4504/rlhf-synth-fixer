# ============================================================================
# Lambda Functions
# ============================================================================

# CloudWatch Log Group for Compliance Lambda
resource "aws_cloudwatch_log_group" "compliance_lambda" {
  name              = local.compliance_lambda_log_group
  retention_in_days = 30
  kms_key_id        = local.audit_kms_key_arn

  tags = merge(
    local.common_tags,
    {
      Name = local.compliance_lambda_log_group
      Type = "Lambda Logs"
    }
  )
}

# CloudWatch Log Group for Reporting Lambda
resource "aws_cloudwatch_log_group" "reporting_lambda" {
  name              = local.reporting_lambda_log_group
  retention_in_days = 30
  kms_key_id        = local.audit_kms_key_arn

  tags = merge(
    local.common_tags,
    {
      Name = local.reporting_lambda_log_group
      Type = "Lambda Logs"
    }
  )
}

# Package Compliance Lambda Function
data "archive_file" "compliance_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda-compliance-check/index.py"
  output_path = "${path.module}/.terraform/lambda-compliance-check.zip"
}

# Compliance Lambda Function
resource "aws_lambda_function" "compliance_check" {
  filename         = data.archive_file.compliance_lambda.output_path
  function_name    = local.compliance_lambda_name
  role             = aws_iam_role.compliance_lambda.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.compliance_lambda.output_base64sha256
  runtime          = "python3.12"
  timeout          = var.compliance_lambda_timeout
  memory_size      = var.compliance_lambda_memory

  environment {
    variables = {
      PRIMARY_BUCKET_NAME = aws_s3_bucket.primary.id
      AUDIT_BUCKET_NAME   = aws_s3_bucket.audit.id
      SNS_TOPIC_ARN       = aws_sns_topic.alerts.arn
      CLOUDTRAIL_NAME     = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : ""
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = local.compliance_lambda_name
      Type = "Compliance Check Function"
    }
  )

  depends_on = [
    aws_cloudwatch_log_group.compliance_lambda,
    aws_iam_role_policy.compliance_lambda
  ]
}

# Package Reporting Lambda Function
data "archive_file" "reporting_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda-monthly-report/index.py"
  output_path = "${path.module}/.terraform/lambda-monthly-report.zip"
}

# Monthly Reporting Lambda Function
resource "aws_lambda_function" "monthly_report" {
  filename         = data.archive_file.reporting_lambda.output_path
  function_name    = local.reporting_lambda_name
  role             = aws_iam_role.reporting_lambda.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.reporting_lambda.output_base64sha256
  runtime          = "python3.12"
  timeout          = var.reporting_lambda_timeout
  memory_size      = var.reporting_lambda_memory

  environment {
    variables = {
      PRIMARY_BUCKET_NAME   = aws_s3_bucket.primary.id
      REPORTING_BUCKET_NAME = aws_s3_bucket.reporting.id
      ENABLE_SES            = tostring(var.enable_ses_reporting)
      SES_SENDER_EMAIL      = var.ses_sender_email
      SES_RECIPIENT_EMAILS  = join(",", var.ses_recipient_emails)
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = local.reporting_lambda_name
      Type = "Monthly Report Function"
    }
  )

  depends_on = [
    aws_cloudwatch_log_group.reporting_lambda,
    aws_iam_role_policy.reporting_lambda
  ]
}
