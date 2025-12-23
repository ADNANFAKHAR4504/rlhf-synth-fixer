resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/ecs/${var.environment}-${var.environment_suffix}"
  retention_in_days = var.retention_days
  kms_key_id        = var.kms_key_arn

  tags = {
    Name        = "${var.environment}-log-group-${var.environment_suffix}"
    Environment = var.environment
  }
}
