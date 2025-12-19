resource "aws_cloudwatch_log_group" "security_events" {
  name              = "/aws/security/events-${local.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.security_key.arn

  tags = merge(
    local.common_tags,
    {
      Name = "security-events-log-group-${local.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/security-${local.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.security_key.arn

  tags = merge(
    local.common_tags,
    {
      Name = "cloudtrail-log-group-${local.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_log_stream" "guardduty" {
  name           = "guardduty-findings"
  log_group_name = aws_cloudwatch_log_group.security_events.name
}

resource "aws_cloudwatch_log_stream" "security_hub" {
  name           = "security-hub-findings"
  log_group_name = aws_cloudwatch_log_group.security_events.name
}

resource "aws_cloudwatch_log_stream" "custom_rules" {
  name           = "custom-rules-processor"
  log_group_name = aws_cloudwatch_log_group.security_events.name
}