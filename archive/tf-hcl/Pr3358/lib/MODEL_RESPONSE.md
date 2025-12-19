# Variables
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "ingestion_bucket_name" {
  description = "Name for the ingestion S3 bucket"
  type        = string
  default     = "regulatory-reporting-ingestion-prod"
}

variable "archive_bucket_name" {
  description = "Name for the archive S3 bucket"
  type        = string
  default     = "regulatory-reporting-archive-prod"
}

variable "dynamo_table_name" {
  description = "Name for the DynamoDB metadata table"
  type        = string
  default     = "regulatory-reporting-metadata-prod"
}

variable "email_recipients" {
  description = "List of email addresses for report notifications"
  type        = list(string)
  default     = ["compliance@example.com"]
}

variable "owner_tag" {
  description = "Owner tag value"
  type        = string
  default     = "ComplianceTeam"
}

variable "cost_center" {
  description = "Cost center tag value"
  type        = string
  default     = "Finance-001"
}

# Provider Configuration
provider "aws" {
  region = var.region
}

# Common tags
locals {
  common_tags = {
    Environment = var.environment
    Compliance  = "Yes"
    Owner       = var.owner_tag
    CostCenter  = var.cost_center
  }
}

# KMS Keys for encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-s3-kms-key"
  })
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/${var.environment}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

resource "aws_kms_key" "glue_key" {
  description             = "KMS key for Glue encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-glue-kms-key"
  })
}

resource "aws_kms_alias" "glue_key_alias" {
  name          = "alias/${var.environment}-glue-key"
  target_key_id = aws_kms_key.glue_key.key_id
}

resource "aws_kms_key" "athena_key" {
  description             = "KMS key for Athena encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-athena-kms-key"
  })
}

resource "aws_kms_alias" "athena_key_alias" {
  name          = "alias/${var.environment}-athena-key"
  target_key_id = aws_kms_key.athena_key.key_id
}

resource "aws_kms_key" "dynamodb_key" {
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-dynamodb-kms-key"
  })
}

resource "aws_kms_alias" "dynamodb_key_alias" {
  name          = "alias/${var.environment}-dynamodb-key"
  target_key_id = aws_kms_key.dynamodb_key.key_id
}

resource "aws_kms_key" "lambda_key" {
  description             = "KMS key for Lambda environment variables"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-lambda-kms-key"
  })
}

resource "aws_kms_alias" "lambda_key_alias" {
  name          = "alias/${var.environment}-lambda-key"
  target_key_id = aws_kms_key.lambda_key.key_id
}

# S3 Buckets
# Ingestion Bucket with versioning and encryption
resource "aws_s3_bucket" "ingestion" {
  bucket = var.ingestion_bucket_name
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-ingestion-bucket"
    DataClassification = "Confidential"
  })
}

resource "aws_s3_bucket_versioning" "ingestion" {
  bucket = aws_s3_bucket.ingestion.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ingestion" {
  bucket = aws_s3_bucket.ingestion.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "ingestion" {
  bucket = aws_s3_bucket.ingestion.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Archive Bucket with Object Lock for compliance
resource "aws_s3_bucket" "archive" {
  bucket = var.archive_bucket_name
  
  object_lock_enabled = true
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-archive-bucket"
    DataClassification = "Confidential"
    Retention = "10Years"
  })
}

resource "aws_s3_bucket_object_lock_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 3650 # 10 years
    }
  }
}

resource "aws_s3_bucket_versioning" "archive" {
  bucket = aws_s3_bucket.archive.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "archive" {
  bucket = aws_s3_bucket.archive.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket for Athena results
resource "aws_s3_bucket" "athena_results" {
  bucket = "${var.environment}-athena-results-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-athena-results"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.athena_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket for Glue scripts
resource "aws_s3_bucket" "glue_scripts" {
  bucket = "${var.environment}-glue-scripts-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-glue-scripts"
  })
}

# CloudTrail S3 bucket for audit logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.environment}-cloudtrail-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-cloudtrail-logs"
    Retention = "10Years"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 3650 # 10 years
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# IAM Roles
# Glue service role
resource "aws_iam_role" "glue_service_role" {
  name = "${var.environment}-glue-service-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "glue_service_policy" {
  role       = aws_iam_role.glue_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

resource "aws_iam_role_policy" "glue_s3_access" {
  name = "${var.environment}-glue-s3-access"
  role = aws_iam_role.glue_service_role.id

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
          aws_s3_bucket.ingestion.arn,
          "${aws_s3_bucket.ingestion.arn}/*",
          aws_s3_bucket.archive.arn,
          "${aws_s3_bucket.archive.arn}/*",
          aws_s3_bucket.glue_scripts.arn,
          "${aws_s3_bucket.glue_scripts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_key.arn,
          aws_kms_key.glue_key.arn
        ]
      }
    ]
  })
}

# Lambda execution role
resource "aws_iam_role" "lambda_role" {
  name = "${var.environment}-lambda-execution-role"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name = "${var.environment}-lambda-permissions"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.ingestion.arn,
          "${aws_s3_bucket.ingestion.arn}/*",
          aws_s3_bucket.archive.arn,
          "${aws_s3_bucket.archive.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.metadata.arn,
          "${aws_dynamodb_table.metadata.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_key.arn,
          aws_kms_key.lambda_key.arn,
          aws_kms_key.dynamodb_key.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.lambda_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:StartDataQualityRulesetRun",
          "glue:GetDataQualityRulesetRun"
        ]
        Resource = "*"
      }
    ]
  })
}

# Step Functions role
resource "aws_iam_role" "step_functions_role" {
  name = "${var.environment}-step-functions-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "step_functions_permissions" {
  name = "${var.environment}-step-functions-permissions"
  role = aws_iam_role.step_functions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction",
          "glue:StartJobRun",
          "glue:GetJobRun",
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults",
          "sns:Publish",
          "sqs:SendMessage",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# DynamoDB Table for metadata and lineage
resource "aws_dynamodb_table" "metadata" {
  name           = var.dynamo_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "reportId"
  
  attribute {
    name = "reportId"
    type = "S"
  }
  
  attribute {
    name = "source"
    type = "S"
  }
  
  attribute {
    name = "complianceType"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "S"
  }
  
  # Global Secondary Index for querying by source
  global_secondary_index {
    name            = "SourceIndex"
    hash_key        = "source"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  # Global Secondary Index for querying by compliance type
  global_secondary_index {
    name            = "ComplianceTypeIndex"
    hash_key        = "complianceType"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_key.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-metadata-table"
  })
}

# SQS Dead Letter Queue for Lambda
resource "aws_sqs_queue" "lambda_dlq" {
  name                      = "${var.environment}-lambda-dlq"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 1209600 # 14 days
  receive_wait_time_seconds = 0
  
  kms_master_key_id = aws_kms_key.lambda_key.id
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-lambda-dlq"
  })
}

# Lambda Functions
# Data validation Lambda
resource "aws_lambda_function" "data_validation" {
  filename      = "lambda_validation.zip"
  function_name = "${var.environment}-data-validation"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 1024
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
      METADATA_TABLE = aws_dynamodb_table.metadata.name
    }
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }
  
  kms_key_arn = aws_kms_key.lambda_key.arn
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-data-validation"
  })
}

# Data quality check Lambda
resource "aws_lambda_function" "data_quality" {
  filename      = "lambda_quality.zip"
  function_name = "${var.environment}-data-quality"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 1024
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
      METADATA_TABLE = aws_dynamodb_table.metadata.name
    }
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }
  
  kms_key_arn = aws_kms_key.lambda_key.arn
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-data-quality"
  })
}

# Lambda permission for S3
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_validation.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.ingestion.arn
}

# S3 Event notification
resource "aws_s3_bucket_notification" "ingestion_notification" {
  bucket = aws_s3_bucket.ingestion.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.data_validation.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "raw/"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# Create dummy Lambda deployment packages
resource "local_file" "lambda_validation_code" {
  content = <<-EOF
def handler(event, context):
    print("Data validation logic here")
    return {"statusCode": 200}
EOF
  filename = "index.py"
}

resource "null_resource" "lambda_validation_zip" {
  provisioner "local-exec" {
    command = "zip lambda_validation.zip index.py"
  }
  depends_on = [local_file.lambda_validation_code]
}

resource "null_resource" "lambda_quality_zip" {
  provisioner "local-exec" {
    command = "cp lambda_validation.zip lambda_quality.zip"
  }
  depends_on = [null_resource.lambda_validation_zip]
}

# Glue Catalog Database
resource "aws_glue_catalog_database" "compliance_db" {
  name        = "${var.environment}_compliance_database"
  description = "Compliance reporting database"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-compliance-database"
  })
}

# Glue Crawler for raw data
resource "aws_glue_crawler" "raw_data_crawler" {
  database_name = aws_glue_catalog_database.compliance_db.name
  name          = "${var.environment}-raw-data-crawler"
  role          = aws_iam_role.glue_service_role.arn

  s3_target {
    path = "s3://${aws_s3_bucket.ingestion.bucket}/raw/"
  }
  
  security_configuration = aws_glue_security_configuration.glue_security.name
  
  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-raw-data-crawler"
  })
}

# Glue Security Configuration
resource "aws_glue_security_configuration" "glue_security" {
  name = "${var.environment}-glue-security-config"

  encryption_configuration {
    cloudwatch_encryption {
      cloudwatch_encryption_mode = "SSE-KMS"
      kms_key_arn               = aws_kms_key.glue_key.arn
    }

    job_bookmarks_encryption {
      job_bookmarks_encryption_mode = "SSE-KMS"
      kms_key_arn                  = aws_kms_key.glue_key.arn
    }

    s3_encryption {
      s3_encryption_mode = "SSE-KMS"
      kms_key_arn        = aws_kms_key.s3_key.arn
    }
  }
}

# Glue ETL Job
resource "aws_glue_job" "compliance_etl" {
  name     = "${var.environment}-compliance-etl"
  role_arn = aws_iam_role.glue_service_role.arn

  command {
    script_location = "s3://${aws_s3_bucket.glue_scripts.bucket}/etl_script.py"
    python_version  = "3"
  }
  
  default_arguments = {
    "--enable-job-insights"     = "true"
    "--enable-metrics"          = "true"
    "--enable-continuous-cloudwatch-log" = "true"
    "--job-bookmark-option"     = "job-bookmark-enable"
    "--TempDir"                 = "s3://${aws_s3_bucket.glue_scripts.bucket}/temp/"
    "--enable-auto-scaling"     = "true"
  }
  
  glue_version = "4.0"
  max_capacity = 10
  
  security_configuration = aws_glue_security_configuration.glue_security.name
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-compliance-etl"
  })
}

# Glue DataBrew Dataset
resource "aws_glue_data_catalog_table" "raw_data" {
  name          = "raw_financial_data"
  database_name = aws_glue_catalog_database.compliance_db.name
  
  table_type = "EXTERNAL_TABLE"
  
  storage_descriptor {
    location      = "s3://${aws_s3_bucket.ingestion.bucket}/raw/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"
    
    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
    }
    
    columns {
      name = "transaction_id"
      type = "string"
    }
    
    columns {
      name = "amount"
      type = "double"
    }
    
    columns {
      name = "transaction_date"
      type = "timestamp"
    }
  }
}

# Lake Formation Data Lake Settings
resource "aws_lakeformation_data_lake_settings" "compliance" {
  admins = [data.aws_caller_identity.current.arn]
  
  create_database_default_permissions {
    permissions = ["ALL"]
    principal   = aws_iam_role.glue_service_role.arn
  }
  
  create_table_default_permissions {
    permissions = ["ALL"]
    principal   = aws_iam_role.glue_service_role.arn
  }
}

# Lake Formation Resource
resource "aws_lakeformation_resource" "ingestion_bucket" {
  arn = aws_s3_bucket.ingestion.arn
}

resource "aws_lakeformation_resource" "archive_bucket" {
  arn = aws_s3_bucket.archive.arn
}

# Lake Formation Permissions
resource "aws_lakeformation_permissions" "glue_database_permissions" {
  principal   = aws_iam_role.glue_service_role.arn
  permissions = ["CREATE_TABLE", "ALTER", "DROP", "DESCRIBE"]

  database {
    name = aws_glue_catalog_database.compliance_db.name
  }
}

# Athena Workgroup
resource "aws_athena_workgroup" "compliance" {
  name = "${var.environment}-compliance-workgroup"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn      = aws_kms_key.athena_key.arn
      }
    }
    
    engine_version {
      selected_engine_version = "Athena engine version 3"
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-compliance-workgroup"
  })
}

# Step Functions State Machine
resource "aws_sfn_state_machine" "compliance_workflow" {
  name     = "${var.environment}-compliance-workflow"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = jsonencode({
    Comment = "Compliance report generation workflow"
    StartAt = "RunETL"
    States = {
      RunETL = {
        Type = "Task"
        Resource = "arn:aws:states:::glue:startJobRun.sync"
        Parameters = {
          JobName = aws_glue_job.compliance_etl.name
        }
        Retry = [
          {
            ErrorEquals = ["States.ALL"]
            IntervalSeconds = 30
            MaxAttempts = 3
            BackoffRate = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next = "NotifyError"
          }
        ]
        Next = "ValidateData"
      }
      ValidateData = {
        Type = "Task"
        Resource = aws_lambda_function.data_validation.arn
        Retry = [
          {
            ErrorEquals = ["States.ALL"]
            IntervalSeconds = 30
            MaxAttempts = 3
            BackoffRate = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next = "NotifyError"
          }
        ]
        Next = "QualityCheck"
      }
      QualityCheck = {
        Type = "Task"
        Resource = aws_lambda_function.data_quality.arn
        Retry = [
          {
            ErrorEquals = ["States.ALL"]
            IntervalSeconds = 30
            MaxAttempts = 3
            BackoffRate = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next = "NotifyError"
          }
        ]
        Next = "GenerateReport"
      }
      GenerateReport = {
        Type = "Task"
        Resource = "arn:aws:states:::athena:startQueryExecution.sync"
        Parameters = {
          QueryString = "SELECT * FROM raw_financial_data WHERE transaction_date >= current_date - interval '1' day"
          WorkGroup = aws_athena_workgroup.compliance.name
          ResultConfiguration = {
            OutputLocation = "s3://${aws_s3_bucket.athena_results.bucket}/reports/"
          }
        }
        Retry = [
          {
            ErrorEquals = ["States.ALL"]
            IntervalSeconds = 30
            MaxAttempts = 3
            BackoffRate = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next = "NotifyError"
          }
        ]
        Next = "ArchiveReport"
      }
      ArchiveReport = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.data_validation.arn
          Payload = {
            "action": "archive"
          }
        }
        Next = "NotifySuccess"
      }
      NotifySuccess = {
        Type = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.notifications.arn
          Message = "Compliance report generated successfully"
        }
        End = true
      }
      NotifyError = {
        Type = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.notifications.arn
          Message = "Error in compliance report generation"
        }
        Next = "FailState"
      }
      FailState = {
        Type = "Fail"
        Cause = "Workflow failed"
      }
    }
  })
  
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-compliance-workflow"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/stepfunctions/${var.environment}-compliance"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.lambda_key.arn
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-step-functions-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_validation" {
  name              = "/aws/lambda/${var.environment}-data-validation"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.lambda_key.arn
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-lambda-validation-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_quality" {
  name              = "/aws/lambda/${var.environment}-data-quality"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.lambda_key.arn
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-lambda-quality-logs"
  })
}

# SNS Topic for notifications
resource "aws_sns_topic" "notifications" {
  name              = "${var.environment}-compliance-notifications"
  kms_master_key_id = aws_kms_key.lambda_key.id
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-compliance-notifications"
  })
}

resource "aws_sns_topic_subscription" "email" {
  for_each = toset(var.email_recipients)
  
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = each.value
}

# SES Configuration for emailing reports
resource "aws_ses_email_identity" "compliance_sender" {
  email = var.email_recipients[0]
}

# EventBridge rule for scheduled report generation
resource "aws_cloudwatch_event_rule" "daily_reports" {
  name                = "${var.environment}-daily-compliance-reports"
  description         = "Trigger daily compliance report generation"
  schedule_expression = "cron(0 2 * * ? *)" # 2 AM UTC daily
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-daily-reports-rule"
  })
}

resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.daily_reports.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.compliance_workflow.arn
  role_arn  = aws_iam_role.events_role.arn
}

# EventBridge execution role
resource "aws_iam_role" "events_role" {
  name = "${var.environment}-events-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "events_policy" {
  name = "${var.environment}-events-policy"
  role = aws_iam_role.events_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "states:StartExecution"
        Resource = aws_sfn_state_machine.compliance_workflow.arn
      }
    ]
  })
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "audit" {
  name                          = "${var.environment}-compliance-audit-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.ingestion.arn}/",
        "${aws_s3_bucket.archive.arn}/"
      ]
    }
  }
  
  insight_selector {
    insight_type = "ApiCallRateInsight"
  }
  
  kms_key_id = aws_kms_key.s3_key.arn
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-audit-trail"
  })
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# Macie Configuration
resource "aws_macie2_account" "compliance" {}

resource "aws_macie2_classification_job" "pii_detection" {
  job_type = "ONE_TIME"
  name     = "${var.environment}-pii-detection"
  
  s3_job_definition {
    bucket_definitions {
      account_id = data.aws_caller_identity.current.account_id
      buckets    = [aws_s3_bucket.ingestion.id]
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-pii-detection"
  })
}

# Config Rules for compliance
resource "aws_config_configuration_recorder" "compliance" {
  name     = "${var.environment}-compliance-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "compliance" {
  name           = "${var.environment}-compliance-channel"
  s3_bucket_name = aws_s3_bucket.config.id
}

resource "aws_s3_bucket" "config" {
  bucket = "${var.environment}-config-bucket-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-config-bucket"
  })
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role" "config_role" {
  name = "${var.environment}-config-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "${var.environment}-config-s3-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.config.arn}/*"
      }
    ]
  })
}

resource "aws_config_configuration_recorder_status" "compliance" {
  name       = aws_config_configuration_recorder.compliance.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.compliance]
}

# Config Rules
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "${var.environment}-s3-bucket-encryption"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-s3-encryption-rule"
  })
  
  depends_on = [aws_config_configuration_recorder.compliance]
}

resource "aws_config_config_rule" "s3_versioning" {
  name = "${var.environment}-s3-versioning"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_VERSIONING_ENABLED"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-s3-versioning-rule"
  })
  
  depends_on = [aws_config_configuration_recorder.compliance]
}

# Secrets Manager for data source credentials
resource "aws_secretsmanager_secret" "data_source_creds" {
  name                    = "${var.environment}-data-source-credentials"
  description             = "Credentials for data source connections"
  kms_key_id              = aws_kms_key.lambda_key.id
  recovery_window_in_days = 30
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-data-source-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "data_source_creds" {
  secret_id = aws_secretsmanager_secret.data_source_creds.id
  secret_string = jsonencode({
    username = "datauser"
    password = "changeme"
    host     = "example.com"
    port     = "5432"
  })
}

# QuickSight Resources
resource "aws_quicksight_group" "compliance_viewers" {
  group_name = "${var.environment}-compliance-viewers"
  namespace  = "default"
}

resource "aws_quicksight_data_source" "athena" {
  data_source_id = "${var.environment}-athena-datasource"
  name          = "${var.environment}-athena-datasource"
  type          = "ATHENA"

  parameters {
    athena {
      work_group = aws_athena_workgroup.compliance.name
    }
  }

  permission {
    principal = aws_quicksight_group.compliance_viewers.arn
    actions = [
      "quicksight:DescribeDataSource",
      "quicksight:DescribeDataSourcePermissions",
      "quicksight:PassDataSource",
      "quicksight:UpdateDataSource",
      "quicksight:UpdateDataSourcePermissions"
    ]
  }
  
  ssl_properties {
    disable_ssl = false
  }
}

# Data source
data "aws_caller_identity" "current" {}

# Outputs
output "ingestion_bucket_arn" {
  description = "ARN of the ingestion S3 bucket"
  value       = aws_s3_bucket.ingestion.arn
}

output "archive_bucket_arn" {
  description = "ARN of the archive S3 bucket"
  value       = aws_s3_bucket.archive.arn
}

output "glue_catalog_id" {
  description = "ID of the Glue Catalog Database"
  value       = aws_glue_catalog_database.compliance_db.id
}

output "lake_formation_data_lake_arn" {
  description = "ARN of the Lake Formation data lake"
  value       = "arn:aws:lakeformation:${var.region}:${data.aws_caller_identity.current.account_id}:catalog:${data.aws_caller_identity.current.account_id}"
}

output "athena_workgroup" {
  description = "Name of the Athena workgroup"
  value       = aws_athena_workgroup.compliance.name
}

output "quicksight_dashboard_url" {
  description = "URL for accessing QuickSight dashboards"
  value       = "https://${var.region}.quicksight.aws.amazon.com/sn/dashboards"
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB metadata table"
  value       = aws_dynamodb_table.metadata.arn
}

output "step_functions_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.compliance_workflow.arn
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.audit.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS notification topic"
  value       = aws_sns_topic.notifications.arn
}