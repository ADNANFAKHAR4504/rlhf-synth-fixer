# CloudWatch Log Group for IAM Activity
resource "aws_cloudwatch_log_group" "iam_activity" {
  name              = "/aws/iam/activity-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name = "iam-activity-logs-${var.environment_suffix}"
  }

  depends_on = [aws_kms_key.primary]
}

# CloudWatch Log Group for Organizations Activity - COMMENTED OUT
# This has been disabled because AWS Organizations resources are commented out
#
# resource "aws_cloudwatch_log_group" "organizations_activity" {
#   name              = "/aws/organizations/activity-${var.environment_suffix}"
#   retention_in_days = var.cloudwatch_log_retention_days
#   kms_key_id        = aws_kms_key.primary.arn
#
#   tags = {
#     Name = "organizations-activity-logs-${var.environment_suffix}"
#   }
#
#   depends_on = [aws_kms_key.primary]
# }

# CloudWatch Log Group for Config Activity
resource "aws_cloudwatch_log_group" "config_activity" {
  name              = "/aws/config/activity-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name = "config-activity-logs-${var.environment_suffix}"
  }

  depends_on = [aws_kms_key.primary]
}
