# iam.tf - IAM roles and policies for least privilege access

# IAM role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.project_name}-${var.environment_suffix}-rds-enhanced-monitoring"

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

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-rds-enhanced-monitoring"
    }
  )
}

# Attach AWS managed policy for RDS Enhanced Monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Attach Secrets Manager policy to RDS Enhanced Monitoring role (RDS uses this for secret access)
resource "aws_iam_role_policy_attachment" "rds_secrets_manager" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = aws_iam_policy.aurora_secrets_manager.arn
}

# IAM role for Aurora S3 backup access
resource "aws_iam_role" "aurora_s3_backup" {
  name = "${var.project_name}-${var.environment_suffix}-aurora-s3-backup"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-s3-backup"
    }
  )
}

# IAM policy for Aurora S3 backup access
resource "aws_iam_policy" "aurora_s3_backup" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-s3-backup"
  description = "Policy for Aurora to access S3 backup bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.aurora_backups.arn,
          "${aws_s3_bucket.aurora_backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.aurora.arn
      }
    ]
  })
}

# Attach S3 backup policy to role
resource "aws_iam_role_policy_attachment" "aurora_s3_backup" {
  role       = aws_iam_role.aurora_s3_backup.name
  policy_arn = aws_iam_policy.aurora_s3_backup.arn
}

# IAM role for Lambda event processor
resource "aws_iam_role" "aurora_event_lambda" {
  name = "${var.project_name}-${var.environment_suffix}-aurora-event-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-event-lambda"
    }
  )
}

# IAM policy for Lambda event processor
resource "aws_iam_policy" "aurora_event_lambda" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-event-lambda"
  description = "Policy for Aurora event processing Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-${var.environment_suffix}-aurora-events",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-${var.environment_suffix}-aurora-events:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.aurora_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:ListTagsForResource"
        ]
        Resource = [
          aws_rds_cluster.aurora_serverless.arn,
          "${aws_rds_cluster.aurora_serverless.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.aurora.arn
      }
    ]
  })
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "aurora_event_lambda" {
  role       = aws_iam_role.aurora_event_lambda.name
  policy_arn = aws_iam_policy.aurora_event_lambda.arn
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "aurora_event_lambda_basic" {
  role       = aws_iam_role.aurora_event_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM role for application access to Aurora
resource "aws_iam_role" "aurora_app_access" {
  name = "${var.project_name}-${var.environment_suffix}-aurora-app-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-app-access"
    }
  )
}

# IAM policy for application Aurora access
resource "aws_iam_policy" "aurora_app_access" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-app-access"
  description = "Policy for application servers to access Aurora"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances"
        ]
        Resource = [
          aws_rds_cluster.aurora_serverless.arn,
          "${aws_rds_cluster.aurora_serverless.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.aurora_serverless.cluster_resource_id}/admin"
      }
    ]
  })
}

# Attach policy to application role
resource "aws_iam_role_policy_attachment" "aurora_app_access" {
  role       = aws_iam_role.aurora_app_access.name
  policy_arn = aws_iam_policy.aurora_app_access.arn
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "aurora_app_access" {
  name = "${var.project_name}-${var.environment_suffix}-aurora-app-profile"
  role = aws_iam_role.aurora_app_access.name

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-app-profile"
    }
  )
}