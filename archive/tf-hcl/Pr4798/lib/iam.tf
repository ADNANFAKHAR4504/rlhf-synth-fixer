# ============================================================================
# IAM Roles for S3 Access
# ============================================================================

# Uploader Role - Can only add documents, no delete permissions
resource "aws_iam_role" "uploader" {
  name = local.uploader_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "uploader-role"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = local.uploader_role_name
      Type = "Uploader Access Role"
    }
  )
}

resource "aws_iam_role_policy" "uploader" {
  name = "${local.uploader_role_name}-policy"
  role = aws_iam_role.uploader.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPutObject"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "AllowListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Sid    = "AllowKMSEncryption"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.primary.arn
      }
    ]
  })
}

# Auditor Role - Read-only access to documents and logs
resource "aws_iam_role" "auditor" {
  name = local.auditor_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "auditor-role"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = local.auditor_role_name
      Type = "Auditor Access Role"
    }
  )
}

resource "aws_iam_role_policy" "auditor" {
  name = "${local.auditor_role_name}-policy"
  role = aws_iam_role.auditor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadDocuments"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucketVersions"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
      },
      {
        Sid    = "AllowReadAuditLogs"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.audit.arn,
          "${aws_s3_bucket.audit.arn}/*"
        ]
      },
      {
        Sid    = "AllowReadReports"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.reporting.arn,
          "${aws_s3_bucket.reporting.arn}/*"
        ]
      },
      {
        Sid    = "AllowKMSDecryption"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.primary.arn,
          local.audit_kms_key_arn
        ]
      },
      {
        Sid    = "AllowCloudTrailRead"
        Effect = "Allow"
        Action = [
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus"
        ]
        Resource = "*"
      }
    ]
  })
}

# Admin Role - Full access but requires MFA for deleting versions
resource "aws_iam_role" "admin" {
  name = local.admin_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = local.admin_role_name
      Type = "Admin Access Role"
    }
  )
}

resource "aws_iam_role_policy" "admin" {
  name = "${local.admin_role_name}-policy"
  role = aws_iam_role.admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowFullS3Access"
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*",
          aws_s3_bucket.audit.arn,
          "${aws_s3_bucket.audit.arn}/*",
          aws_s3_bucket.reporting.arn,
          "${aws_s3_bucket.reporting.arn}/*"
        ]
      },
      {
        Sid    = "RequireMFAForDelete"
        Effect = "Deny"
        Action = [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
      {
        Sid    = "AllowKMSOperations"
        Effect = "Allow"
        Action = [
          "kms:*"
        ]
        Resource = [
          aws_kms_key.primary.arn,
          local.audit_kms_key_arn
        ]
      }
    ]
  })
}

# ============================================================================
# IAM Roles for Lambda Functions
# ============================================================================

# Compliance Lambda Execution Role
resource "aws_iam_role" "compliance_lambda" {
  name = local.compliance_lambda_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = local.compliance_lambda_role_name
      Type = "Lambda Execution Role"
    }
  )
}

resource "aws_iam_role_policy" "compliance_lambda" {
  name = "${local.compliance_lambda_role_name}-policy"
  role = aws_iam_role.compliance_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3BucketRead"
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:GetBucketObjectLockConfiguration",
          "s3:GetBucketEncryption",
          "s3:GetBucketLifecycleConfiguration",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketLogging"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          aws_s3_bucket.audit.arn
        ]
      },
      {
        Sid    = "AllowCloudTrailCheck"
        Effect = "Allow"
        Action = [
          "cloudtrail:GetTrailStatus",
          "cloudtrail:DescribeTrails"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchMetrics"
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "LegalDocStorage/Compliance"
          }
        }
      },
      {
        Sid    = "AllowSNSPublish"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowLogging"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${local.compliance_lambda_log_group}:*"
      }
    ]
  })
}

# Reporting Lambda Execution Role
resource "aws_iam_role" "reporting_lambda" {
  name = local.reporting_lambda_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = local.reporting_lambda_role_name
      Type = "Lambda Execution Role"
    }
  )
}

resource "aws_iam_role_policy" "reporting_lambda" {
  name = "${local.reporting_lambda_role_name}-policy"
  role = aws_iam_role.reporting_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3Read"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:ListBucketVersions",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
      },
      {
        Sid    = "AllowReportingBucketWrite"
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.reporting.arn}/monthly-reports/*"
      },
      {
        Sid    = "AllowCloudWatchMetricsRead"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowKMSDecryption"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.primary.arn
      },
      {
        Sid    = "AllowLogging"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${local.reporting_lambda_log_group}:*"
      },
      {
        Sid    = "AllowSESEmail"
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = var.ses_sender_email
          }
        }
      }
    ]
  })
}

# ============================================================================
# IAM Role for CloudTrail CloudWatch Logs
# ============================================================================

resource "aws_iam_role" "cloudtrail_cloudwatch" {
  count = var.cloudtrail_cloudwatch_logs_enabled ? 1 : 0

  name = local.cloudtrail_cloudwatch_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = local.cloudtrail_cloudwatch_role_name
      Type = "CloudTrail CloudWatch Logs Role"
    }
  )
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  count = var.cloudtrail_cloudwatch_logs_enabled ? 1 : 0

  name = "${local.cloudtrail_cloudwatch_role_name}-policy"
  role = aws_iam_role.cloudtrail_cloudwatch[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailCreateLogStream"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${local.cloudtrail_log_group_name}:log-stream:*"
      },
      {
        Sid    = "AWSCloudTrailPutLogEvents"
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${local.cloudtrail_log_group_name}:log-stream:*"
      }
    ]
  })
}

# ============================================================================
# IAM Role for S3 Cross-Region Replication
# ============================================================================

resource "aws_iam_role" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0

  name = "${local.name_prefix}-replication-role-${local.name_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-replication-role"
      Type = "S3 Replication Role"
    }
  )
}

resource "aws_iam_role_policy" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0

  name = "${local.name_prefix}-replication-policy"
  role = aws_iam_role.replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSourceBucketRead"
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Sid    = "AllowSourceObjectRead"
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Sid    = "AllowDestinationBucketWrite"
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replication[0].arn}/*"
      }
    ]
  })
}
