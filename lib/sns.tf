# SNS topic for security alerts and notifications
# Provides centralized alerting for security events and system issues

resource "aws_sns_topic" "security_alerts" {
  name              = "${var.project_name}-${var.environment}-security-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-security-alerts"
  }
}

# SNS topic policy to allow CloudWatch to publish
resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = "sns:Publish"
        Resource = aws_sns_topic.security_alerts.arn
        Condition = {
          StringEquals = {
            "