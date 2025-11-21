resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/${var.name_prefix}/${var.environment_suffix}"
  retention_in_days = var.retention_days

  tags = {
    Name        = "${var.name_prefix}-logs-${var.environment_suffix}"
    Environment = var.environment
  }
}
