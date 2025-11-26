# iam.tf - IAM Roles and Policies for Cross-Account Access with Session Tags

# IAM Role for Cross-Account Access from Blue Environment
# Only create if blue_account_id is not the placeholder value
resource "aws_iam_role" "cross_account_blue" {
  count = var.blue_account_id != "123456789012" ? 1 : 0
  name  = "cross-account-blue-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.blue_account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "blue-${var.environment_suffix}"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "cross-account-blue-${var.environment_suffix}"
    Environment = "blue"
  }
}

# IAM Role for Cross-Account Access from Green Environment
# Only create if green_account_id is not the placeholder value
resource "aws_iam_role" "cross_account_green" {
  count = var.green_account_id != "123456789012" ? 1 : 0
  name  = "cross-account-green-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.green_account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "green-${var.environment_suffix}"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "cross-account-green-${var.environment_suffix}"
    Environment = "green"
  }
}

# IAM Policy for Cross-Account Blue Access
resource "aws_iam_role_policy" "cross_account_blue" {
  count = var.blue_account_id != "123456789012" ? 1 : 0
  name  = "cross-account-blue-policy-${var.environment_suffix}"
  role  = aws_iam_role.cross_account_blue[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:ListTagsForResource"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/Environment" = "blue"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable"
        ]
        Resource = [
          aws_dynamodb_table.session_state.arn,
          aws_dynamodb_table.migration_state.arn
        ]
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/Environment" = "blue"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.migration_logs.arn,
          "${aws_s3_bucket.migration_logs.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/Environment" = "blue"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/Environment" = "blue"
          }
        }
      }
    ]
  })
}

# IAM Policy for Cross-Account Green Access
resource "aws_iam_role_policy" "cross_account_green" {
  count = var.green_account_id != "123456789012" ? 1 : 0
  name  = "cross-account-green-policy-${var.environment_suffix}"
  role  = aws_iam_role.cross_account_green[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:ListTagsForResource"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/Environment" = "green"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable"
        ]
        Resource = [
          aws_dynamodb_table.session_state.arn,
          aws_dynamodb_table.migration_state.arn
        ]
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/Environment" = "green"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.migration_logs.arn,
          "${aws_s3_bucket.migration_logs.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/Environment" = "green"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/Environment" = "green"
          }
        }
      }
    ]
  })
}

# IAM Role for DMS Service
resource "aws_iam_role" "dms_service" {
  name = "dms-service-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "dms-service-role-${var.environment_suffix}"
  }
}

# IAM Policy for DMS Service
resource "aws_iam_role_policy" "dms_service" {
  name = "dms-service-policy-${var.environment_suffix}"
  role = aws_iam_role.dms_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.migration_logs.arn,
          "${aws_s3_bucket.migration_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.data_transformation.arn
      }
    ]
  })
}

# IAM Role for Aurora Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "rds-enhanced-monitoring-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "rds-enhanced-monitoring-${var.environment_suffix}"
  }
}

# Attach AWS Managed Policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM Policy Document for Session Tags (for documentation)
data "aws_iam_policy_document" "session_tags_example" {
  statement {
    sid    = "AssumeRoleWithSessionTags"
    effect = "Allow"

    actions = [
      "sts:AssumeRole",
      "sts:TagSession"
    ]

    principals {
      type = "AWS"
      identifiers = concat(
        var.blue_account_id != "123456789012" ? ["arn:aws:iam::${var.blue_account_id}:root"] : [],
        var.green_account_id != "123456789012" ? ["arn:aws:iam::${var.green_account_id}:root"] : []
      )
    }

    condition {
      test     = "StringEquals"
      variable = "sts:RequestedSessionTags/Environment"
      values   = ["blue", "green"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:RequestedSessionTags/Project"
      values   = [var.project_name]
    }
  }
}

# IAM Policy for Audit Trail Access
resource "aws_iam_policy" "audit_trail" {
  name        = "audit-trail-policy-${var.environment_suffix}"
  description = "Policy for accessing audit trail logs with session tags"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:LookupEvents",
          "cloudtrail:GetEventSelectors",
          "cloudtrail:DescribeTrails"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/AuditAccess" = "true"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "logs:FilterLogEvents",
          "logs:GetLogEvents"
        ]
        Resource = [
          aws_cloudwatch_log_group.dms.arn,
          aws_cloudwatch_log_group.lambda_transformation.arn
        ]
        Condition = {
          StringEquals = {
            "aws:PrincipalTag/AuditAccess" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "audit-trail-policy-${var.environment_suffix}"
  }
}

# Attach Audit Trail Policy to Cross-Account Roles
resource "aws_iam_role_policy_attachment" "blue_audit" {
  count      = var.blue_account_id != "123456789012" ? 1 : 0
  role       = aws_iam_role.cross_account_blue[0].name
  policy_arn = aws_iam_policy.audit_trail.arn
}

resource "aws_iam_role_policy_attachment" "green_audit" {
  count      = var.green_account_id != "123456789012" ? 1 : 0
  role       = aws_iam_role.cross_account_green[0].name
  policy_arn = aws_iam_policy.audit_trail.arn
}
