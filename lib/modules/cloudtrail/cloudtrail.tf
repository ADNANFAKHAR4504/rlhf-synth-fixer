# CloudTrail
resource "aws_cloudtrail" "this" {
  name                          = "SecConfig-CloudTrail"
  s3_bucket_name                = var.s3_bucket_name
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                 = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_cw.arn
  kms_key_id                    = var.kms_key_id
}

