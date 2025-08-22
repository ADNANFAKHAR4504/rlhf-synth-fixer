// Module: logging
// Contains CloudTrail (toggled), CloudWatch log groups, and optional VPC flow logs

# Random suffix to prevent naming conflicts
resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment_suffix}-${random_id.suffix.hex}"
  retention_in_days = 90
  tags              = var.common_tags
}

resource "aws_cloudwatch_log_group" "vpc_flow" {
  count             = var.enable_vpc_flow_logs ? 1 : 0
  name              = "/aws/vpc/flowlogs/${var.project_name}-${var.environment_suffix}-${random_id.suffix.hex}"
  retention_in_days = 90
  tags              = var.common_tags
}

# Data sources needed for CloudTrail
data "aws_caller_identity" "current" {}

# CloudTrail Bucket Policy Data
data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid       = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = [var.logging_bucket_arn]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment_suffix}-trail"]
    }
  }
  statement {
    sid       = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["${var.logging_bucket_arn}/cloudtrail/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment_suffix}-trail"]
    }
  }
}

# CloudTrail Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail_bucket" {
  bucket = var.logging_bucket_id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json

  depends_on = [
    data.aws_iam_policy_document.cloudtrail_bucket_policy
  ]
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  count                         = var.enable_cloudtrail ? 1 : 0
  name                          = "${var.project_name}-${var.environment_suffix}-trail"
  s3_bucket_name                = var.logging_bucket_name
  s3_key_prefix                 = "cloudtrail/"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = var.cloudtrail_role_arn
  tags                          = var.common_tags
  depends_on                    = [aws_s3_bucket_policy.cloudtrail_bucket]
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  count           = var.enable_vpc_flow_logs ? 1 : 0
  iam_role_arn    = var.vpc_flow_role_arn
  log_destination = aws_cloudwatch_log_group.vpc_flow[0].arn
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id
  tags            = var.common_tags
}
