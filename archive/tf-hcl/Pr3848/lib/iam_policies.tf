# IAM policy for read-only access to audit logs
resource "aws_iam_policy" "audit_log_reader" {
  name        = "${local.resource_prefix}-audit-log-reader-new"
  description = "Read-only access to audit logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          aws_cloudwatch_log_group.audit_events.arn,
          "${aws_cloudwatch_log_group.audit_events.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.audit_logs.arn
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for audit log administrators (can bypass Object Lock governance mode)
resource "aws_iam_policy" "audit_log_admin" {
  name        = "${local.resource_prefix}-audit-log-admin-new"
  description = "Administrative access to audit logs with Object Lock bypass"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:*"
        ]
        Resource = [
          aws_cloudwatch_log_group.audit_events.arn,
          "${aws_cloudwatch_log_group.audit_events.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:BypassGovernanceRetention"
        ]
        Resource = "${aws_s3_bucket.audit_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:*"
        ]
        Resource = aws_kms_key.audit_logs.arn
      }
    ]
  })

  tags = local.common_tags
}

# Deny policy to prevent log modification by unauthorized users
resource "aws_iam_policy" "deny_log_modification" {
  name        = "${local.resource_prefix}-deny-log-modification-new"
  description = "Explicitly deny log modification operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream",
          "logs:PutRetentionPolicy",
          "logs:DeleteRetentionPolicy"
        ]
        Resource = [
          aws_cloudwatch_log_group.audit_events.arn,
          "${aws_cloudwatch_log_group.audit_events.arn}:*"
        ]
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "s3:DeleteObject",
          "s3:DeleteObjectVersion",
          "s3:PutBucketObjectLockConfiguration",
          "s3:PutObjectLegalHold",
          "s3:PutObjectRetention"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
        Condition = {
          StringNotLike = {
            "aws:userid" = [
              "AIDA*", # Exclude specific admin user IDs if needed
            ]
          }
        }
      }
    ]
  })

  tags = local.common_tags
}
