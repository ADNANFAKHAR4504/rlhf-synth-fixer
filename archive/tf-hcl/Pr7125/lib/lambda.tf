# Package Lambda functions
data "archive_file" "trigger_reconciliation_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/trigger_reconciliation.py"
  output_path = "${path.module}/lambda/trigger_reconciliation.zip"
}

data "archive_file" "file_parser_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/file_parser.py"
  output_path = "${path.module}/lambda/file_parser.zip"
}

data "archive_file" "transaction_validator_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/transaction_validator.py"
  output_path = "${path.module}/lambda/transaction_validator.zip"
}

data "archive_file" "report_generator_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/report_generator.py"
  output_path = "${path.module}/lambda/report_generator.zip"
}

# Trigger Lambda Function
resource "aws_lambda_function" "trigger_reconciliation" {
  filename         = data.archive_file.trigger_reconciliation_zip.output_path
  function_name    = "trigger-reconciliation-${var.environment_suffix}"
  role             = aws_iam_role.trigger_lambda_role.arn
  handler          = "trigger_reconciliation.lambda_handler"
  source_code_hash = data.archive_file.trigger_reconciliation_zip.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = 300

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.reconciliation_workflow.arn
    }
  }

  tags = {
    Name = "trigger-reconciliation-${var.environment_suffix}"
  }
}

resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.trigger_reconciliation.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.reconciliation_data.arn
}

# File Parser Lambda Function
resource "aws_lambda_function" "file_parser" {
  filename         = data.archive_file.file_parser_zip.output_path
  function_name    = "file-parser-${var.environment_suffix}"
  role             = aws_iam_role.processing_lambda_role.arn
  handler          = "file_parser.lambda_handler"
  source_code_hash = data.archive_file.file_parser_zip.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = 300

  environment {
    variables = {
      TRANSACTION_TABLE = aws_dynamodb_table.transaction_records.name
    }
  }

  tags = {
    Name = "file-parser-${var.environment_suffix}"
  }
}

# Transaction Validator Lambda Function
resource "aws_lambda_function" "transaction_validator" {
  filename         = data.archive_file.transaction_validator_zip.output_path
  function_name    = "transaction-validator-${var.environment_suffix}"
  role             = aws_iam_role.processing_lambda_role.arn
  handler          = "transaction_validator.lambda_handler"
  source_code_hash = data.archive_file.transaction_validator_zip.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = 300

  environment {
    variables = {
      TRANSACTION_TABLE = aws_dynamodb_table.transaction_records.name
      RESULTS_TABLE     = aws_dynamodb_table.reconciliation_results.name
    }
  }

  tags = {
    Name = "transaction-validator-${var.environment_suffix}"
  }
}

# Report Generator Lambda Function
resource "aws_lambda_function" "report_generator" {
  filename         = data.archive_file.report_generator_zip.output_path
  function_name    = "report-generator-${var.environment_suffix}"
  role             = aws_iam_role.processing_lambda_role.arn
  handler          = "report_generator.lambda_handler"
  source_code_hash = data.archive_file.report_generator_zip.output_base64sha256
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = 300

  environment {
    variables = {
      RESULTS_TABLE = aws_dynamodb_table.reconciliation_results.name
      SNS_TOPIC_ARN = aws_sns_topic.reconciliation_notifications.arn
    }
  }

  tags = {
    Name = "report-generator-${var.environment_suffix}"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "trigger_reconciliation" {
  name              = "/aws/lambda/trigger-reconciliation-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "trigger-reconciliation-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "file_parser" {
  name              = "/aws/lambda/file-parser-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "file-parser-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "transaction_validator" {
  name              = "/aws/lambda/transaction-validator-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "transaction-validator-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "report_generator" {
  name              = "/aws/lambda/report-generator-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "report-generator-logs-${var.environment_suffix}"
  }
}
