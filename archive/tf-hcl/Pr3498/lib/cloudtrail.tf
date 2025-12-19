resource "aws_cloudtrail" "main" {
  name                          = "security-monitoring-trail-${local.environment_suffix}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  kms_key_id = aws_kms_key.security_key.arn

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]

  tags = merge(
    local.common_tags,
    {
      Name = "security-monitoring-trail-${local.environment_suffix}"
    }
  )
}