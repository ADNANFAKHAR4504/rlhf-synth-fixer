# CloudTrail
resource "aws_cloudtrail" "this" {
  name                          = "SecConfig-CloudTrail"
  s3_bucket_name                = var.s3_bucket_name
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                 = true
  cloud_watch_logs_group_arn    = "${var.cw_logs_group_arn}:*"
  cloud_watch_logs_role_arn     = var.cw_logs_role_arn
  kms_key_id                    = var.kms_key_id
}

