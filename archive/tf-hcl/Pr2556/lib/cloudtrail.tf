# CloudTrail for comprehensive API logging and security monitoring
# Captures all API calls for audit, compliance, and security analysis

# CloudWatch Log Group for CloudTrail logs
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudtrail-logs"
  }
}

# CloudTrail configuration with comprehensive logging
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-${var.environment}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.logging.id
  s3_key_prefix                 = "cloudtrail-logs"
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_logging                = true
  kms_key_id                    = aws_kms_key.main.arn

  # Send logs to CloudWatch for real-time monitoring
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  # Capture both read and write events
  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    # Log all S3 object-level events for security
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_data.arn}/*"]
    }

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.logging.arn}/*"]
    }
  }

  # Enable log file validation for integrity checking
  enable_log_file_validation = true

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudtrail"
  }

  depends_on = [aws_s3_bucket_policy.logging_cloudtrail]
}
