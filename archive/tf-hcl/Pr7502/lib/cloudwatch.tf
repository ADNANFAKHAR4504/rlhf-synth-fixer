# CloudWatch Log Group for event-validator Lambda
resource "aws_cloudwatch_log_group" "validator" {
  name              = "/aws/lambda/${var.project_name}-validator-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-validator-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for event-processor Lambda
resource "aws_cloudwatch_log_group" "processor" {
  name              = "/aws/lambda/${var.project_name}-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-processor-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for event-enricher Lambda
resource "aws_cloudwatch_log_group" "enricher" {
  name              = "/aws/lambda/${var.project_name}-enricher-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-enricher-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for event-trigger Lambda
resource "aws_cloudwatch_log_group" "event_trigger" {
  name              = "/aws/lambda/${var.project_name}-trigger-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-trigger-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Step Functions
resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/${var.project_name}-workflow-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.project_name}-workflow-logs-${var.environment_suffix}"
  }
}
