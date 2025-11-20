variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 10
    error_message = "environment_suffix must be between 1 and 10 characters"
  }
}

variable "source_region" {
  description = "Source AWS region (us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "target_region" {
  description = "Target AWS region (eu-west-1)"
  type        = string
  default     = "eu-west-1"
}

variable "migration_phase" {
  description = "Current migration phase (planning, sync, cutover, completed)"
  type        = string
  default     = "planning"

  validation {
    condition     = contains(["planning", "sync", "cutover", "completed"], var.migration_phase)
    error_message = "migration_phase must be one of: planning, sync, cutover, completed"
  }
}

variable "cutover_date" {
  description = "Planned cutover date in YYYY-MM-DD format"
  type        = string
  default     = "2025-12-31"
}

variable "enable_step_functions" {
  description = "Enable Step Functions for migration orchestration (optional enhancement)"
  type        = bool
  default     = true
}

variable "enable_eventbridge" {
  description = "Enable EventBridge for event tracking (optional enhancement)"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable AWS Backup for data protection (optional enhancement)"
  type        = bool
  default     = true
}

variable "document_retention_days" {
  description = "Number of days to retain documents in S3 lifecycle policy"
  type        = number
  default     = 90
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops@example.com"
}

variable "replication_lag_threshold_seconds" {
  description = "DynamoDB replication lag threshold for alarms (seconds)"
  type        = number
  default     = 1
}
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Terraform state stored in S3 with DynamoDB state locking (Constraint 4)
  # Note: Backend configuration cannot use variables. For production, use:
  # terraform init -backend-config="bucket=terraform-state-migration-${env}"
  # For testing/demo, using local state
  # backend "s3" {
  #   bucket         = "terraform-state-migration-dev"
  #   key            = "document-processing/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock-dev"
  # }
}

# Source region provider (us-east-1)
provider "aws" {
  alias  = "source"
  region = var.source_region

  default_tags {
    tags = {
      ManagedBy      = "Terraform"
      Project        = "DocumentProcessingMigration"
      Environment    = var.environment_suffix
      MigrationPhase = var.migration_phase
      CutoverDate    = var.cutover_date
    }
  }
}

# Target region provider (eu-west-1)
provider "aws" {
  alias  = "target"
  region = var.target_region

  default_tags {
    tags = {
      ManagedBy      = "Terraform"
      Project        = "DocumentProcessingMigration"
      Environment    = var.environment_suffix
      MigrationPhase = var.migration_phase
      CutoverDate    = var.cutover_date
    }
  }
}
# Data sources to import existing infrastructure state (Requirement 8)

data "aws_caller_identity" "current" {
  provider = aws.source
}

data "aws_region" "source" {
  provider = aws.source
}

data "aws_region" "target" {
  provider = aws.target
}

# Data source to check for existing S3 bucket in source region
data "aws_s3_bucket" "existing_source" {
  provider = aws.source
  bucket   = "doc-proc-${var.source_region}-s3-documents-${var.environment_suffix}"

  # This will fail if bucket doesn't exist, which is expected for new deployments
  depends_on = []
}

# Data source to check for existing DynamoDB table in source region
data "aws_dynamodb_table" "existing_metadata" {
  provider = aws.source
  name     = "doc-proc-${var.source_region}-dynamodb-metadata-${var.environment_suffix}"

  # This will fail if table doesn't exist, which is expected for new deployments
  depends_on = []
}
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
# S3 Buckets for Document Storage (Requirements 1, 4, 9)

# Source region S3 bucket (us-east-1)
resource "aws_s3_bucket" "source_documents" {
  provider      = aws.source
  bucket        = "doc-proc-${var.source_region}-s3-documents-${var.environment_suffix}"
  force_destroy = true # Allow bucket destruction for testing/demo

  tags = {
    Name           = "doc-proc-${var.source_region}-s3-documents-${var.environment_suffix}"
    Region         = var.source_region
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Enable versioning on source bucket (Requirement 1)
resource "aws_s3_bucket_versioning" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable SSE-S3 encryption with bucket keys (Constraint 1)
resource "aws_s3_bucket_server_side_encryption_configuration" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Target region S3 bucket (eu-west-1)
resource "aws_s3_bucket" "target_documents" {
  provider      = aws.target
  bucket        = "doc-proc-${var.target_region}-s3-documents-${var.environment_suffix}"
  force_destroy = true # Allow bucket destruction for testing/demo

  tags = {
    Name           = "doc-proc-${var.target_region}-s3-documents-${var.environment_suffix}"
    Region         = var.target_region
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Enable versioning on target bucket (Requirement 1)
resource "aws_s3_bucket_versioning" "target_documents" {
  provider = aws.target
  bucket   = aws_s3_bucket.target_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable SSE-S3 encryption with bucket keys on target (Constraint 1)
resource "aws_s3_bucket_server_side_encryption_configuration" "target_documents" {
  provider = aws.target
  bucket   = aws_s3_bucket.target_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 replication configuration (Requirement 4)
resource "aws_s3_bucket_replication_configuration" "source_to_target" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id
  role     = aws_iam_role.s3_replication.arn

  rule {
    id     = "replicate-all-documents"
    status = "Enabled"

    # Replicate existing objects (Requirement 4)
    filter {}

    delete_marker_replication {
      status = "Enabled"
    }

    destination {
      bucket        = aws_s3_bucket.target_documents.arn
      storage_class = "STANDARD"

      # Enable replication time control for predictable replication
      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }
  }

  depends_on = [
    aws_s3_bucket_versioning.source_documents,
    aws_s3_bucket_versioning.target_documents
  ]
}

# Lifecycle policy for gradual migration (Requirement 9)
resource "aws_s3_bucket_lifecycle_configuration" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  rule {
    id     = "migration-lifecycle"
    status = "Enabled"

    filter {}

    # Transition to Intelligent-Tiering after migration phase
    transition {
      days          = var.document_retention_days
      storage_class = "INTELLIGENT_TIERING"
    }

    # Non-current versions cleanup
    noncurrent_version_expiration {
      noncurrent_days = var.document_retention_days * 2
    }
  }
}

# Lifecycle policy for target bucket
resource "aws_s3_bucket_lifecycle_configuration" "target_documents" {
  provider = aws.target
  bucket   = aws_s3_bucket.target_documents.id

  rule {
    id     = "archive-lifecycle"
    status = "Enabled"

    filter {}

    # Transition to Glacier for long-term storage
    transition {
      days          = var.document_retention_days
      storage_class = "GLACIER"
    }
  }
}

# Block public access on source bucket
resource "aws_s3_bucket_public_access_block" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block public access on target bucket
resource "aws_s3_bucket_public_access_block" "target_documents" {
  provider = aws.target
  bucket   = aws_s3_bucket.target_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
# DynamoDB Global Tables for Metadata Tracking (Requirements 2, 5)

# DynamoDB table in source region (us-east-1)
resource "aws_dynamodb_table" "metadata" {
  provider         = aws.source
  name             = "doc-proc-${var.source_region}-dynamodb-metadata-${var.environment_suffix}"
  billing_mode     = "PAY_PER_REQUEST" # On-demand autoscaling (Requirement 5)
  hash_key         = "DocumentId"
  range_key        = "Timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Enable point-in-time recovery (Requirement 5)
  point_in_time_recovery {
    enabled = true
  }

  # Disable deletion protection for testing/demo
  deletion_protection_enabled = false

  attribute {
    name = "DocumentId"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "N"
  }

  attribute {
    name = "Status"
    type = "S"
  }

  # Global secondary index for status queries
  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "Status"
    range_key       = "Timestamp"
    projection_type = "ALL"
  }

  # Replica in target region (eu-west-1) for global table (Requirement 2)
  replica {
    region_name = var.target_region

    point_in_time_recovery = true
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-dynamodb-metadata-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# DynamoDB table for migration tracking
resource "aws_dynamodb_table" "migration_state" {
  provider         = aws.source
  name             = "doc-proc-${var.source_region}-dynamodb-migration-${var.environment_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "MigrationId"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  attribute {
    name = "MigrationId"
    type = "S"
  }

  attribute {
    name = "Phase"
    type = "S"
  }

  global_secondary_index {
    name            = "PhaseIndex"
    hash_key        = "Phase"
    projection_type = "ALL"
  }

  # Replica for global table
  replica {
    region_name = var.target_region

    point_in_time_recovery = true
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-dynamodb-migration-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# DynamoDB table for Terraform state locking (Constraint 4)
resource "aws_dynamodb_table" "terraform_state_lock" {
  provider     = aws.source
  name         = "terraform-state-lock-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  deletion_protection_enabled = false

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name           = "terraform-state-lock-${var.environment_suffix}"
    Purpose        = "TerraformStateLocking"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}
# Lambda Functions for Data Synchronization (Requirement 3)

# Archive Lambda function code
data "archive_file" "data_sync" {
  type        = "zip"
  source_file = "${path.module}/lambda/data_sync.py"
  output_path = "${path.module}/lambda/data_sync.zip"
}

data "archive_file" "validation" {
  type        = "zip"
  source_file = "${path.module}/lambda/validation.py"
  output_path = "${path.module}/lambda/validation.zip"
}

# Data Synchronization Lambda function (ARM64 - Constraint 3)
resource "aws_lambda_function" "data_sync" {
  provider         = aws.source
  filename         = data.archive_file.data_sync.output_path
  function_name    = "doc-proc-${var.source_region}-lambda-sync-${var.environment_suffix}"
  role             = aws_iam_role.lambda_sync.arn
  handler          = "data_sync.handler"
  source_code_hash = data.archive_file.data_sync.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  # ARM64 architecture for Graviton2 (Constraint 3)
  architectures = ["arm64"]

  environment {
    variables = {
      SOURCE_BUCKET   = aws_s3_bucket.source_documents.id
      TARGET_BUCKET   = aws_s3_bucket.target_documents.id
      METADATA_TABLE  = aws_dynamodb_table.metadata.name
      SOURCE_REGION   = var.source_region
      TARGET_REGION   = var.target_region
      MIGRATION_PHASE = var.migration_phase
    }
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-lambda-sync-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Validation Lambda function (ARM64 - Constraint 3)
resource "aws_lambda_function" "validation" {
  provider         = aws.source
  filename         = data.archive_file.validation.output_path
  function_name    = "doc-proc-${var.source_region}-lambda-validation-${var.environment_suffix}"
  role             = aws_iam_role.lambda_sync.arn
  handler          = "validation.handler"
  source_code_hash = data.archive_file.validation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  # ARM64 architecture for Graviton2 (Constraint 3)
  architectures = ["arm64"]

  environment {
    variables = {
      SOURCE_BUCKET   = aws_s3_bucket.source_documents.id
      TARGET_BUCKET   = aws_s3_bucket.target_documents.id
      METADATA_TABLE  = aws_dynamodb_table.metadata.name
      SOURCE_REGION   = var.source_region
      TARGET_REGION   = var.target_region
      MIGRATION_PHASE = var.migration_phase
    }
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-lambda-validation-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "data_sync" {
  provider          = aws.source
  name              = "/aws/lambda/${aws_lambda_function.data_sync.function_name}"
  retention_in_days = 7

  tags = {
    Name           = "doc-proc-${var.source_region}-logs-sync-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

resource "aws_cloudwatch_log_group" "validation" {
  provider          = aws.source
  name              = "/aws/lambda/${aws_lambda_function.validation.function_name}"
  retention_in_days = 7

  tags = {
    Name           = "doc-proc-${var.source_region}-logs-validation-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# S3 bucket notification to trigger Lambda on new objects
resource "aws_s3_bucket_notification" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.data_sync.arn
    events              = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}

# Lambda permission for S3 to invoke function
resource "aws_lambda_permission" "s3_invoke" {
  provider      = aws.source
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_sync.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.source_documents.arn
}

# DynamoDB stream trigger for Lambda
resource "aws_lambda_event_source_mapping" "dynamodb_metadata" {
  provider          = aws.source
  event_source_arn  = aws_dynamodb_table.metadata.stream_arn
  function_name     = aws_lambda_function.data_sync.arn
  starting_position = "LATEST"
  batch_size        = 10
}

# Scheduled validation using EventBridge
resource "aws_cloudwatch_event_rule" "validation_schedule" {
  provider            = aws.source
  name                = "doc-proc-${var.source_region}-schedule-validation-${var.environment_suffix}"
  description         = "Trigger validation Lambda every hour"
  schedule_expression = "rate(1 hour)"

  tags = {
    Name           = "doc-proc-${var.source_region}-schedule-validation-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

resource "aws_cloudwatch_event_target" "validation_lambda" {
  provider = aws.source
  rule     = aws_cloudwatch_event_rule.validation_schedule.name
  arn      = aws_lambda_function.validation.arn
}

resource "aws_lambda_permission" "eventbridge_invoke" {
  provider      = aws.source
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.validation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.validation_schedule.arn
}
# CloudWatch Monitoring and Alarms (Requirement 7)

# SNS topic for alarm notifications
resource "aws_sns_topic" "migration_alarms" {
  provider = aws.source
  name     = "doc-proc-${var.source_region}-sns-alarms-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.source_region}-sns-alarms-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

resource "aws_sns_topic_subscription" "migration_alarms_email" {
  provider  = aws.source
  topic_arn = aws_sns_topic.migration_alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch alarm for S3 replication lag
resource "aws_cloudwatch_metric_alarm" "s3_replication_lag" {
  provider            = aws.source
  alarm_name          = "doc-proc-${var.source_region}-alarm-s3-replication-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Average"
  threshold           = 900 # 15 minutes in seconds
  alarm_description   = "S3 replication lag exceeds threshold"
  alarm_actions       = [aws_sns_topic.migration_alarms.arn]

  dimensions = {
    SourceBucket      = aws_s3_bucket.source_documents.id
    DestinationBucket = aws_s3_bucket.target_documents.id
    RuleId            = "replicate-all-documents"
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-alarm-s3-replication-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch alarm for DynamoDB replication lag (Requirement 7, Constraint 2)
resource "aws_cloudwatch_metric_alarm" "dynamodb_replication_lag" {
  provider            = aws.source
  alarm_name          = "doc-proc-${var.source_region}-alarm-dynamodb-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Average"
  threshold           = var.replication_lag_threshold_seconds * 1000 # Convert to milliseconds
  alarm_description   = "DynamoDB replication lag exceeds 1 second threshold"
  alarm_actions       = [aws_sns_topic.migration_alarms.arn]

  dimensions = {
    TableName       = aws_dynamodb_table.metadata.name
    ReceivingRegion = var.target_region
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-alarm-dynamodb-lag-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  provider            = aws.source
  alarm_name          = "doc-proc-${var.source_region}-alarm-lambda-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda synchronization errors exceed threshold"
  alarm_actions       = [aws_sns_topic.migration_alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.data_sync.function_name
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-alarm-lambda-errors-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch alarm for Lambda throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  provider            = aws.source
  alarm_name          = "doc-proc-${var.source_region}-alarm-lambda-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda function throttling detected"
  alarm_actions       = [aws_sns_topic.migration_alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.data_sync.function_name
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-alarm-lambda-throttles-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch alarm for S3 replication failures
resource "aws_cloudwatch_metric_alarm" "s3_replication_failures" {
  provider            = aws.source
  alarm_name          = "doc-proc-${var.source_region}-alarm-s3-failures-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "OperationFailedReplication"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "S3 replication failures detected"
  alarm_actions       = [aws_sns_topic.migration_alarms.arn]

  dimensions = {
    SourceBucket      = aws_s3_bucket.source_documents.id
    DestinationBucket = aws_s3_bucket.target_documents.id
    RuleId            = "replicate-all-documents"
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-alarm-s3-failures-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch alarm for DynamoDB throttling
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  provider            = aws.source
  alarm_name          = "doc-proc-${var.source_region}-alarm-dynamodb-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB throttling detected"
  alarm_actions       = [aws_sns_topic.migration_alarms.arn]

  dimensions = {
    TableName = aws_dynamodb_table.metadata.name
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-alarm-dynamodb-throttles-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch dashboard for migration monitoring
resource "aws_cloudwatch_dashboard" "migration" {
  provider       = aws.source
  dashboard_name = "doc-proc-${var.source_region}-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "ReplicationLatency", {
              stat  = "Average"
              label = "S3 Replication Lag"
            }],
            ["AWS/DynamoDB", "ReplicationLatency", {
              stat  = "Average"
              label = "DynamoDB Replication Lag"
            }]
          ]
          period = 300
          stat   = "Average"
          region = var.source_region
          title  = "Replication Latency"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { FunctionName = aws_lambda_function.data_sync.function_name }],
            [".", "Errors", { FunctionName = aws_lambda_function.data_sync.function_name }],
            [".", "Throttles", { FunctionName = aws_lambda_function.data_sync.function_name }]
          ]
          period = 300
          stat   = "Sum"
          region = var.source_region
          title  = "Lambda Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["DocumentProcessingMigration", "DocumentsSynced"],
            [".", "MetadataSynced"],
            [".", "SyncErrors"]
          ]
          period = 300
          stat   = "Sum"
          region = var.source_region
          title  = "Migration Progress"
        }
      }
    ]
  })
}
# Step Functions for Migration Orchestration (Optional Enhancement)

# Step Functions state machine for migration workflow
resource "aws_sfn_state_machine" "migration_workflow" {
  count    = var.enable_step_functions ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-stepfunctions-migration-${var.environment_suffix}"
  role_arn = aws_iam_role.step_functions[0].arn

  definition = jsonencode({
    Comment = "Document Processing Migration Workflow"
    StartAt = "CheckMigrationPhase"
    States = {
      CheckMigrationPhase = {
        Type = "Choice"
        Choices = [
          {
            Variable     = "$.phase"
            StringEquals = "planning"
            Next         = "PlanningPhase"
          },
          {
            Variable     = "$.phase"
            StringEquals = "sync"
            Next         = "SyncPhase"
          },
          {
            Variable     = "$.phase"
            StringEquals = "cutover"
            Next         = "CutoverPhase"
          }
        ]
        Default = "MigrationComplete"
      }

      PlanningPhase = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.validation.arn
          Payload = {
            action = "validate_infrastructure"
          }
        }
        Next = "WaitForSync"
      }

      WaitForSync = {
        Type    = "Wait"
        Seconds = 60
        Next    = "SyncPhase"
      }

      SyncPhase = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "SyncDocuments"
            States = {
              SyncDocuments = {
                Type     = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.data_sync.arn
                  Payload = {
                    action = "sync_documents"
                  }
                }
                End = true
              }
            }
          },
          {
            StartAt = "ValidateReplication"
            States = {
              ValidateReplication = {
                Type     = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.validation.arn
                  Payload = {
                    action = "validate_replication"
                  }
                }
                End = true
              }
            }
          }
        ]
        Next = "CheckSyncComplete"
      }

      CheckSyncComplete = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.syncComplete"
            BooleanEquals = true
            Next          = "CutoverPhase"
          }
        ]
        Default = "WaitForSync"
      }

      CutoverPhase = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.validation.arn
          Payload = {
            action = "final_validation"
          }
        }
        Next = "MigrationComplete"
      }

      MigrationComplete = {
        Type = "Succeed"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions[0].arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-stepfunctions-migration-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# CloudWatch log group for Step Functions
resource "aws_cloudwatch_log_group" "step_functions" {
  count             = var.enable_step_functions ? 1 : 0
  provider          = aws.source
  name              = "/aws/states/doc-proc-${var.source_region}-stepfunctions-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name           = "doc-proc-${var.source_region}-logs-stepfunctions-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}
# EventBridge Rules for Migration Event Tracking (Optional Enhancement)

# EventBridge rule for S3 replication events
resource "aws_cloudwatch_event_rule" "s3_replication_events" {
  count       = var.enable_eventbridge ? 1 : 0
  provider    = aws.source
  name        = "doc-proc-${var.source_region}-eventbridge-s3-${var.environment_suffix}"
  description = "Track S3 replication events for migration"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName = [
        "PutObject",
        "DeleteObject",
        "CopyObject"
      ]
      requestParameters = {
        bucketName = [aws_s3_bucket.source_documents.id]
      }
    }
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-eventbridge-s3-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# EventBridge target for S3 events
resource "aws_cloudwatch_event_target" "s3_replication_lambda" {
  count    = var.enable_eventbridge ? 1 : 0
  provider = aws.source
  rule     = aws_cloudwatch_event_rule.s3_replication_events[0].name
  arn      = aws_lambda_function.data_sync.arn
}

# Lambda permission for EventBridge S3 events
resource "aws_lambda_permission" "eventbridge_s3_invoke" {
  count         = var.enable_eventbridge ? 1 : 0
  provider      = aws.source
  statement_id  = "AllowEventBridgeS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_sync.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_replication_events[0].arn
}

# EventBridge rule for DynamoDB stream events
resource "aws_cloudwatch_event_rule" "dynamodb_events" {
  count       = var.enable_eventbridge ? 1 : 0
  provider    = aws.source
  name        = "doc-proc-${var.source_region}-eventbridge-dynamodb-${var.environment_suffix}"
  description = "Track DynamoDB replication events for migration"

  event_pattern = jsonencode({
    source      = ["aws.dynamodb"]
    detail-type = ["DynamoDB Stream Record"]
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-eventbridge-dynamodb-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# EventBridge rule for migration phase changes
resource "aws_cloudwatch_event_rule" "migration_phase_change" {
  count       = var.enable_eventbridge ? 1 : 0
  provider    = aws.source
  name        = "doc-proc-${var.source_region}-eventbridge-phase-${var.environment_suffix}"
  description = "Track migration phase changes"

  event_pattern = jsonencode({
    source      = ["custom.migration"]
    detail-type = ["Migration Phase Change"]
  })

  tags = {
    Name           = "doc-proc-${var.source_region}-eventbridge-phase-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# EventBridge custom event bus for migration events
resource "aws_cloudwatch_event_bus" "migration" {
  count    = var.enable_eventbridge ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-eventbus-migration-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.source_region}-eventbus-migration-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# EventBridge archive for compliance
resource "aws_cloudwatch_event_archive" "migration_events" {
  count            = var.enable_eventbridge ? 1 : 0
  provider         = aws.source
  name             = "doc-proc-${var.source_region}-archive-events-${var.environment_suffix}"
  event_source_arn = aws_cloudwatch_event_bus.migration[0].arn
  retention_days   = 90

  description = "Archive migration events for compliance and audit"
}
# AWS Backup for Data Protection (Optional Enhancement)

# AWS Backup vault
resource "aws_backup_vault" "migration" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-backup-vault-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.source_region}-backup-vault-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Backup vault in target region
resource "aws_backup_vault" "migration_target" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.target
  name     = "doc-proc-${var.target_region}-backup-vault-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.target_region}-backup-vault-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Backup plan for DynamoDB tables
resource "aws_backup_plan" "dynamodb" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-backup-plan-dynamodb-${var.environment_suffix}"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.migration[0].name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

    lifecycle {
      delete_after = 30
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.migration_target[0].arn

      lifecycle {
        delete_after = 30
      }
    }
  }

  rule {
    rule_name         = "weekly_backup"
    target_vault_name = aws_backup_vault.migration[0].name
    schedule          = "cron(0 3 ? * SUN *)" # Weekly on Sunday at 3 AM UTC

    lifecycle {
      delete_after = 90
    }
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-backup-plan-dynamodb-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Backup selection for DynamoDB tables
resource "aws_backup_selection" "dynamodb" {
  count        = var.enable_backup ? 1 : 0
  provider     = aws.source
  name         = "doc-proc-${var.source_region}-backup-selection-dynamodb-${var.environment_suffix}"
  plan_id      = aws_backup_plan.dynamodb[0].id
  iam_role_arn = aws_iam_role.backup[0].arn

  resources = [
    aws_dynamodb_table.metadata.arn,
    aws_dynamodb_table.migration_state.arn
  ]

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "MigrationPhase"
    value = var.migration_phase
  }
}

# Backup notification topic
resource "aws_sns_topic" "backup_notifications" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-sns-backup-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.source_region}-sns-backup-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

resource "aws_sns_topic_subscription" "backup_notifications_email" {
  count     = var.enable_backup ? 1 : 0
  provider  = aws.source
  topic_arn = aws_sns_topic.backup_notifications[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Backup vault notifications
resource "aws_backup_vault_notifications" "migration" {
  count             = var.enable_backup ? 1 : 0
  provider          = aws.source
  backup_vault_name = aws_backup_vault.migration[0].name
  sns_topic_arn     = aws_sns_topic.backup_notifications[0].arn
  backup_vault_events = [
    "BACKUP_JOB_STARTED",
    "BACKUP_JOB_COMPLETED",
    "BACKUP_JOB_FAILED",
    "RESTORE_JOB_COMPLETED",
    "RESTORE_JOB_FAILED"
  ]
}
# Terraform Outputs

output "source_bucket_name" {
  description = "Name of the source S3 bucket"
  value       = aws_s3_bucket.source_documents.id
}

output "source_bucket_arn" {
  description = "ARN of the source S3 bucket"
  value       = aws_s3_bucket.source_documents.arn
}

output "target_bucket_name" {
  description = "Name of the target S3 bucket"
  value       = aws_s3_bucket.target_documents.id
}

output "target_bucket_arn" {
  description = "ARN of the target S3 bucket"
  value       = aws_s3_bucket.target_documents.arn
}

output "metadata_table_name" {
  description = "Name of the DynamoDB metadata table"
  value       = aws_dynamodb_table.metadata.name
}

output "metadata_table_arn" {
  description = "ARN of the DynamoDB metadata table"
  value       = aws_dynamodb_table.metadata.arn
}

output "migration_state_table_name" {
  description = "Name of the DynamoDB migration state table"
  value       = aws_dynamodb_table.migration_state.name
}

output "data_sync_lambda_arn" {
  description = "ARN of the data synchronization Lambda function"
  value       = aws_lambda_function.data_sync.arn
}

output "validation_lambda_arn" {
  description = "ARN of the validation Lambda function"
  value       = aws_lambda_function.validation.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.source_region}#dashboards:name=${aws_cloudwatch_dashboard.migration.dashboard_name}"
}

output "step_functions_arn" {
  description = "ARN of the Step Functions state machine (if enabled)"
  value       = var.enable_step_functions ? aws_sfn_state_machine.migration_workflow[0].arn : null
}

output "eventbridge_bus_name" {
  description = "Name of the EventBridge custom event bus (if enabled)"
  value       = var.enable_eventbridge ? aws_cloudwatch_event_bus.migration[0].name : null
}

output "backup_vault_name" {
  description = "Name of the AWS Backup vault (if enabled)"
  value       = var.enable_backup ? aws_backup_vault.migration[0].name : null
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.migration_alarms.arn
}

output "replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.arn
}

output "migration_phase" {
  description = "Current migration phase"
  value       = var.migration_phase
}

output "cutover_date" {
  description = "Planned cutover date"
  value       = var.cutover_date
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}
