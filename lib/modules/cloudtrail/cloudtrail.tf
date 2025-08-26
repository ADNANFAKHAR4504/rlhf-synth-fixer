# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = var.cloudtrail_bucket_name
  force_destroy = true

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-cloudtrail-logs"
    }
  )
}

# S3 Bucket Policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  policy = data.aws_iam_policy_document.cloudtrail_s3.json
}

data "aws_iam_policy_document" "cloudtrail_s3" {
  statement {
    sid = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail_logs.arn]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }

  statement {
    sid = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail_logs.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

# CloudTrail Log Group
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project}-${var.environment}"
  retention_in_days = var.cloudtrail_log_retention
  kms_key_id        = var.kms_key_id

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-cloudtrail-logs"
    }
  )
}

# CloudTrail
resource "aws_cloudtrail" "this" {
  name                          = "${var.project}-${var.environment}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                 = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_cw.arn
  kms_key_id                    = var.kms_key_id
}

# IAM Role for CloudTrail -> CloudWatch
resource "aws_iam_role" "cloudtrail_cw" {
  name               = "${var.project}-cloudtrail-cw-role"
  assume_role_policy = data.aws_iam_policy_document.cloudtrail_assume.json
}

data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy" "cloudtrail_cw_policy" {
  name   = "${var.project}-cloudtrail-cw-policy"
  role   = aws_iam_role.cloudtrail_cw.id
  policy = data.aws_iam_policy_document.cloudtrail_cw_policy.json
}

data "aws_iam_policy_document" "cloudtrail_cw_policy" {
  statement {
    actions   = ["logs:PutLogEvents", "logs:CreateLogStream"]
    resources = ["${aws_cloudwatch_log_group.cloudtrail.arn}:*"]
  }
}
