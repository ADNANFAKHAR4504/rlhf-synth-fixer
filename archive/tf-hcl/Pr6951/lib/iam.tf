# IAM Roles and Policies (Requirement 6)

# IAM role for S3 replication
resource "aws_iam_role" "s3_replication" {
  provider = aws.source
  name     = "doc-proc-${var.source_region}-iam-s3-replication-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
      # Cross-account assume role permission (Requirement 6)
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_caller_identity.current.account_id
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "doc-proc-migration-${var.environment_suffix}"
          }
        }
      }
    ]
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-iam-s3-replication-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# IAM policy for S3 replication
resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.source
  name     = "s3-replication-policy"
  role     = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.source_documents.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = [
          "${aws_s3_bucket.source_documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          "${aws_s3_bucket.target_documents.arn}/*"
        ]
      }
    ]
  })
}

# IAM role for Lambda synchronization functions
resource "aws_iam_role" "lambda_sync" {
  provider = aws.source
  name     = "doc-proc-${var.source_region}-iam-lambda-sync-${var.environment_suffix}"

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

  tags = {
    Name           = "doc-proc-${var.source_region}-iam-lambda-sync-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# IAM policy for Lambda synchronization
resource "aws_iam_role_policy" "lambda_sync" {
  provider = aws.source
  name     = "lambda-sync-policy"
  role     = aws_iam_role.lambda_sync.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.source_documents.arn,
          "${aws_s3_bucket.source_documents.arn}/*",
          aws_s3_bucket.target_documents.arn,
          "${aws_s3_bucket.target_documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable"
        ]
        Resource = [
          aws_dynamodb_table.metadata.arn,
          "${aws_dynamodb_table.metadata.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM role for Step Functions (optional)
resource "aws_iam_role" "step_functions" {
  count    = var.enable_step_functions ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-iam-stepfunctions-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-iam-stepfunctions-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# IAM policy for Step Functions
resource "aws_iam_role_policy" "step_functions" {
  count    = var.enable_step_functions ? 1 : 0
  provider = aws.source
  name     = "stepfunctions-policy"
  role     = aws_iam_role.step_functions[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.data_sync.arn,
          aws_lambda_function.validation.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# IAM role for EventBridge (optional)
resource "aws_iam_role" "eventbridge" {
  count    = var.enable_eventbridge ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-iam-eventbridge-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-iam-eventbridge-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# IAM policy for EventBridge
resource "aws_iam_role_policy" "eventbridge" {
  count    = var.enable_eventbridge ? 1 : 0
  provider = aws.source
  name     = "eventbridge-policy"
  role     = aws_iam_role.eventbridge[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.data_sync.arn
        ]
      }
    ]
  })
}

# IAM role for AWS Backup (optional)
resource "aws_iam_role" "backup" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-iam-backup-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
  ]

  tags = {
    Name           = "doc-proc-${var.source_region}-iam-backup-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}
