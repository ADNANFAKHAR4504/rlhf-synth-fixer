# Lambda Functions for Data Synchronization (Requirement 3)

# Archive Lambda function code
data "archive_file" "data_sync" {
  type        = "zip"
  source_file = "${path.module}/lambda/data_sync.py"
  output_path = "${path.module}/lambda/data_sync.zip"
}

data "archive_file" "validation" {
  type        = "zip"
  source_file = "${path.module}/lambda/validation.py"
  output_path = "${path.module}/lambda/validation.zip"
}

# Data Synchronization Lambda function (ARM64 - Constraint 3)
resource "aws_lambda_function" "data_sync" {
  provider         = aws.source
  filename         = data.archive_file.data_sync.output_path
  function_name    = "doc-proc-${var.source_region}-lambda-sync-${var.environment_suffix}"
  role             = aws_iam_role.lambda_sync.arn
  handler          = "data_sync.handler"
  source_code_hash = data.archive_file.data_sync.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  # ARM64 architecture for Graviton2 (Constraint 3)
  architectures = ["arm64"]

  environment {
    variables = {
      SOURCE_BUCKET   = aws_s3_bucket.source_documents.id
      TARGET_BUCKET   = aws_s3_bucket.target_documents.id
      METADATA_TABLE  = aws_dynamodb_table.metadata.name
      SOURCE_REGION   = var.source_region
      TARGET_REGION   = var.target_region
      MIGRATION_PHASE = var.migration_phase
    }
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-lambda-sync-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Validation Lambda function (ARM64 - Constraint 3)
resource "aws_lambda_function" "validation" {
  provider         = aws.source
  filename         = data.archive_file.validation.output_path
  function_name    = "doc-proc-${var.source_region}-lambda-validation-${var.environment_suffix}"
  role             = aws_iam_role.lambda_sync.arn
  handler          = "validation.handler"
  source_code_hash = data.archive_file.validation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  # ARM64 architecture for Graviton2 (Constraint 3)
  architectures = ["arm64"]

  environment {
    variables = {
      SOURCE_BUCKET   = aws_s3_bucket.source_documents.id
      TARGET_BUCKET   = aws_s3_bucket.target_documents.id
      METADATA_TABLE  = aws_dynamodb_table.metadata.name
      SOURCE_REGION   = var.source_region
      TARGET_REGION   = var.target_region
      MIGRATION_PHASE = var.migration_phase
    }
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-lambda-validation-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "data_sync" {
  provider          = aws.source
  name              = "/aws/lambda/${aws_lambda_function.data_sync.function_name}"
  retention_in_days = 7

  tags = {
    Name           = "doc-proc-${var.source_region}-logs-sync-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

resource "aws_cloudwatch_log_group" "validation" {
  provider          = aws.source
  name              = "/aws/lambda/${aws_lambda_function.validation.function_name}"
  retention_in_days = 7

  tags = {
    Name           = "doc-proc-${var.source_region}-logs-validation-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# S3 bucket notification to trigger Lambda on new objects
resource "aws_s3_bucket_notification" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.data_sync.arn
    events              = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}

# Lambda permission for S3 to invoke function
resource "aws_lambda_permission" "s3_invoke" {
  provider      = aws.source
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_sync.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.source_documents.arn
}

# DynamoDB stream trigger for Lambda
resource "aws_lambda_event_source_mapping" "dynamodb_metadata" {
  provider          = aws.source
  event_source_arn  = aws_dynamodb_table.metadata.stream_arn
  function_name     = aws_lambda_function.data_sync.arn
  starting_position = "LATEST"
  batch_size        = 10
}

# Scheduled validation using EventBridge
resource "aws_cloudwatch_event_rule" "validation_schedule" {
  provider            = aws.source
  name                = "doc-proc-${var.source_region}-schedule-validation-${var.environment_suffix}"
  description         = "Trigger validation Lambda every hour"
  schedule_expression = "rate(1 hour)"

  tags = {
    Name           = "doc-proc-${var.source_region}-schedule-validation-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

resource "aws_cloudwatch_event_target" "validation_lambda" {
  provider = aws.source
  rule     = aws_cloudwatch_event_rule.validation_schedule.name
  arn      = aws_lambda_function.validation.arn
}

resource "aws_lambda_permission" "eventbridge_invoke" {
  provider      = aws.source
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.validation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.validation_schedule.arn
}
