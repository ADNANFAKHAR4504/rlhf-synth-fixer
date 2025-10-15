# ========== KMS ENCRYPTION KEYS ==========

# KMS key for S3 bucket encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = var.kms_deletion_window_in_days
  enable_key_rotation     = true
  
  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-s3-kms-${var.environment}"
    Purpose = "S3Encryption"
  })
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${var.project_name}-s3-${var.environment}-${random_string.resource_suffix.result}"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# KMS key for DynamoDB encryption
resource "aws_kms_key" "dynamodb_encryption" {
  description             = "KMS key for DynamoDB table encryption"
  deletion_window_in_days = var.kms_deletion_window_in_days
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-dynamodb-kms-${var.environment}"
    Purpose = "DynamoDBEncryption"
  })
}

resource "aws_kms_alias" "dynamodb_encryption" {
  name          = "alias/${var.project_name}-dynamodb-${var.environment}-${random_string.resource_suffix.result}"
  target_key_id = aws_kms_key.dynamodb_encryption.key_id
}

# KMS key for SageMaker encryption
resource "aws_kms_key" "sagemaker_encryption" {
  description             = "KMS key for SageMaker encryption"
  deletion_window_in_days = var.kms_deletion_window_in_days
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-sagemaker-kms-${var.environment}"
    Purpose = "SageMakerEncryption"
  })
}

resource "aws_kms_alias" "sagemaker_encryption" {
  name          = "alias/${var.project_name}-sagemaker-${var.environment}-${random_string.resource_suffix.result}"
  target_key_id = aws_kms_key.sagemaker_encryption.key_id
}

# KMS key for Kinesis encryption
resource "aws_kms_key" "kinesis_encryption" {
  description             = "KMS key for Kinesis stream encryption"
  deletion_window_in_days = var.kms_deletion_window_in_days
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-kinesis-kms-${var.environment}"
    Purpose = "KinesisEncryption"
  })
}

resource "aws_kms_alias" "kinesis_encryption" {
  name          = "alias/${var.project_name}-kinesis-${var.environment}-${random_string.resource_suffix.result}"
  target_key_id = aws_kms_key.kinesis_encryption.key_id
}

# KMS key for Lambda environment variables encryption
resource "aws_kms_key" "lambda_encryption" {
  description             = "KMS key for Lambda environment variables encryption"
  deletion_window_in_days = var.kms_deletion_window_in_days
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.id}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-kms-${var.environment}"
    Purpose = "LambdaEncryption"
  })
}

resource "aws_kms_alias" "lambda_encryption" {
  name          = "alias/${var.project_name}-lambda-${var.environment}-${random_string.resource_suffix.result}"
  target_key_id = aws_kms_key.lambda_encryption.key_id
}

# ========== S3 BUCKETS ==========

# S3 bucket for raw image data
resource "aws_s3_bucket" "raw_data" {
  bucket = "${var.project_name}-raw-data-${var.environment}-${random_string.resource_suffix.result}-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-raw-data-${var.environment}"
    Purpose = "RawImageStorage"
  })
}

resource "aws_s3_bucket_versioning" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# S3 bucket for processed data
resource "aws_s3_bucket" "processed_data" {
  bucket = "${var.project_name}-processed-data-${var.environment}-${random_string.resource_suffix.result}-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-processed-data-${var.environment}"
    Purpose = "ProcessedDataStorage"
  })
}

resource "aws_s3_bucket_versioning" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "processed_data" {
  bucket = aws_s3_bucket.processed_data.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {}

    transition {
      days          = 60
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }
  }
}

# S3 bucket for model artifacts
resource "aws_s3_bucket" "model_artifacts" {
  bucket = "${var.project_name}-model-artifacts-${var.environment}-${random_string.resource_suffix.result}-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-model-artifacts-${var.environment}"
    Purpose = "ModelArtifactStorage"
  })
}

resource "aws_s3_bucket_versioning" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket for logs
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-logs-${var.environment}-${random_string.resource_suffix.result}-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-logs-${var.environment}"
    Purpose = "LogStorage"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }
  }
}

# ========== DYNAMODB TABLES ==========

# DynamoDB table for model metadata and versioning
resource "aws_dynamodb_table" "model_metadata" {
  name         = "${var.project_name}-model-metadata-${var.environment}-${random_string.resource_suffix.result}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ModelId"
  range_key    = "Version"

  attribute {
    name = "ModelId"
    type = "S"
  }

  attribute {
    name = "Version"
    type = "S"
  }

  attribute {
    name = "Status"
    type = "S"
  }

  attribute {
    name = "CreatedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "Status"
    range_key       = "CreatedAt"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-model-metadata-${var.environment}"
    Purpose = "ModelMetadata"
  })
}

# DynamoDB table for training metrics
resource "aws_dynamodb_table" "training_metrics" {
  name         = "${var.project_name}-training-metrics-${var.environment}-${random_string.resource_suffix.result}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "TrainingJobId"
  range_key    = "Timestamp"

  attribute {
    name = "TrainingJobId"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "S"
  }

  attribute {
    name = "ModelId"
    type = "S"
  }

  global_secondary_index {
    name            = "ModelIdIndex"
    hash_key        = "ModelId"
    range_key       = "Timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-training-metrics-${var.environment}"
    Purpose = "TrainingMetrics"
  })
}

# DynamoDB table for A/B test configuration
resource "aws_dynamodb_table" "ab_test_config" {
  name         = "${var.project_name}-ab-test-config-${var.environment}-${random_string.resource_suffix.result}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "TestId"

  attribute {
    name = "TestId"
    type = "S"
  }

  attribute {
    name = "Status"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "Status"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-ab-test-config-${var.environment}"
    Purpose = "ABTestConfig"
  })
}

# ========== KINESIS DATA STREAM ==========

resource "aws_kinesis_stream" "inference_requests" {
  name             = "${var.project_name}-inference-requests-${var.environment}-${random_string.resource_suffix.result}"
  shard_count      = var.kinesis_shard_count
  retention_period = var.kinesis_retention_hours

  shard_level_metrics = [
    "IncomingBytes",
    "IncomingRecords",
    "OutgoingBytes",
    "OutgoingRecords",
  ]

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  encryption_type = "KMS"
  kms_key_id      = aws_kms_key.kinesis_encryption.id

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-inference-requests-${var.environment}"
    Purpose = "InferenceStreaming"
  })
}

# ========== IAM ROLES AND POLICIES ==========

# IAM role for Lambda data preprocessing
resource "aws_iam_role" "lambda_preprocessing" {
  name = "${var.project_name}-lambda-preprocessing-${var.environment}-${random_string.resource_suffix.result}"

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

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-preprocessing-role-${var.environment}"
    Purpose = "LambdaExecution"
  })
}

resource "aws_iam_role_policy" "lambda_preprocessing" {
  name = "${var.project_name}-lambda-preprocessing-policy-${var.environment}"
  role = aws_iam_role.lambda_preprocessing.id

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
        Resource = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-preprocessing-*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.raw_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.processed_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.s3_encryption.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.lambda_encryption.arn
      }
    ]
  })
}

# IAM role for Lambda inference
resource "aws_iam_role" "lambda_inference" {
  name = "${var.project_name}-lambda-inference-${var.environment}-${random_string.resource_suffix.result}"

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

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-inference-role-${var.environment}"
    Purpose = "LambdaExecution"
  })
}

resource "aws_iam_role_policy" "lambda_inference" {
  name = "${var.project_name}-lambda-inference-policy-${var.environment}"
  role = aws_iam_role.lambda_inference.id

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
        Resource = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-inference-*"
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = aws_kinesis_stream.inference_requests.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.kinesis_encryption.arn,
          aws_kms_key.lambda_encryption.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.model_metadata.arn,
          "${aws_dynamodb_table.model_metadata.arn}/index/*",
          aws_dynamodb_table.ab_test_config.arn,
          "${aws_dynamodb_table.ab_test_config.arn}/index/*"
        ]
      }
    ]
  })
}

# IAM role for Lambda Kinesis consumer
resource "aws_iam_role" "lambda_kinesis_consumer" {
  name = "${var.project_name}-lambda-kinesis-consumer-${var.environment}-${random_string.resource_suffix.result}"

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

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-kinesis-consumer-role-${var.environment}"
    Purpose = "LambdaExecution"
  })
}

resource "aws_iam_role_policy" "lambda_kinesis_consumer" {
  name = "${var.project_name}-lambda-kinesis-consumer-policy-${var.environment}"
  role = aws_iam_role.lambda_kinesis_consumer.id

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
        Resource = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-kinesis-consumer-*"
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:ListShards",
          "kinesis:ListStreams"
        ]
        Resource = aws_kinesis_stream.inference_requests.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.kinesis_encryption.arn,
          aws_kms_key.lambda_encryption.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sagemaker:InvokeEndpoint"
        ]
        Resource = var.create_sagemaker_endpoints ? [
          aws_sagemaker_endpoint.model_a[0].arn,
          aws_sagemaker_endpoint.model_b[0].arn
        ] : ["arn:aws:sagemaker:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:endpoint/*"]
      }
    ]
  })
}

# IAM role for SageMaker
resource "aws_iam_role" "sagemaker" {
  name = "${var.project_name}-sagemaker-${var.environment}-${random_string.resource_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sagemaker.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-sagemaker-role-${var.environment}"
    Purpose = "SageMakerExecution"
  })
}

resource "aws_iam_role_policy" "sagemaker" {
  name = "${var.project_name}-sagemaker-policy-${var.environment}"
  role = aws_iam_role.sagemaker.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${aws_s3_bucket.processed_data.arn}/*",
          "${aws_s3_bucket.model_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.model_artifacts.arn}/*",
          "${aws_s3_bucket.logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.processed_data.arn,
          aws_s3_bucket.model_artifacts.arn,
          aws_s3_bucket.logs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/sagemaker/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "AWS/SageMaker"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = [
          aws_kms_key.s3_encryption.arn,
          aws_kms_key.sagemaker_encryption.arn
        ]
      }
    ]
  })
}

# IAM role for Step Functions
resource "aws_iam_role" "step_functions" {
  name = "${var.project_name}-step-functions-${var.environment}-${random_string.resource_suffix.result}"

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

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-step-functions-role-${var.environment}"
    Purpose = "StepFunctionsExecution"
  })
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${var.project_name}-step-functions-policy-${var.environment}"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.data_preprocessing.arn,
          aws_lambda_function.model_evaluation.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sagemaker:CreateTrainingJob",
          "sagemaker:DescribeTrainingJob",
          "sagemaker:StopTrainingJob"
        ]
        Resource = "arn:aws:sagemaker:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:training-job/${var.project_name}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "sagemaker:CreateModel",
          "sagemaker:CreateEndpointConfig",
          "sagemaker:CreateEndpoint",
          "sagemaker:UpdateEndpoint"
        ]
        Resource = [
          "arn:aws:sagemaker:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:model/${var.project_name}-*",
          "arn:aws:sagemaker:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:endpoint-config/${var.project_name}-*",
          "arn:aws:sagemaker:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:endpoint/${var.project_name}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = aws_iam_role.sagemaker.arn
        Condition = {
          StringEquals = {
            "iam:PassedToService" = "sagemaker.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.model_metadata.arn,
          aws_dynamodb_table.training_metrics.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutRule",
          "events:PutTargets",
          "events:DescribeRule"
        ]
        Resource = "arn:aws:events:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:rule/StepFunctionsGetEventsForStepFunctionsExecutionRule"
      }
    ]
  })
}

# IAM role for EventBridge
resource "aws_iam_role" "eventbridge" {
  name = "${var.project_name}-eventbridge-${var.environment}-${random_string.resource_suffix.result}"

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

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-eventbridge-role-${var.environment}"
    Purpose = "EventBridgeExecution"
  })
}

resource "aws_iam_role_policy" "eventbridge" {
  name = "${var.project_name}-eventbridge-policy-${var.environment}"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = var.create_step_functions ? aws_sfn_state_machine.ml_pipeline[0].arn : "arn:aws:states:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:stateMachine:*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.data_preprocessing.arn
      }
    ]
  })
}

# ========== CLOUDWATCH LOG GROUPS ==========

resource "aws_cloudwatch_log_group" "lambda_preprocessing" {
  name              = "/aws/lambda/${var.project_name}-preprocessing-${var.environment}-${random_string.resource_suffix.result}"
  retention_in_days = var.log_retention_days

  kms_key_id = aws_kms_key.lambda_encryption.arn

  depends_on = [aws_kms_key.lambda_encryption]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-preprocessing-logs-${var.environment}"
    Purpose = "LambdaLogs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_inference" {
  name              = "/aws/lambda/${var.project_name}-inference-${var.environment}-${random_string.resource_suffix.result}"
  retention_in_days = var.log_retention_days

  kms_key_id = aws_kms_key.lambda_encryption.arn

  depends_on = [aws_kms_key.lambda_encryption]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-inference-logs-${var.environment}"
    Purpose = "LambdaLogs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_kinesis_consumer" {
  name              = "/aws/lambda/${var.project_name}-kinesis-consumer-${var.environment}-${random_string.resource_suffix.result}"
  retention_in_days = var.log_retention_days

  kms_key_id = aws_kms_key.lambda_encryption.arn

  depends_on = [aws_kms_key.lambda_encryption]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-kinesis-consumer-logs-${var.environment}"
    Purpose = "LambdaLogs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_model_evaluation" {
  name              = "/aws/lambda/${var.project_name}-model-evaluation-${var.environment}-${random_string.resource_suffix.result}"
  retention_in_days = var.log_retention_days

  kms_key_id = aws_kms_key.lambda_encryption.arn

  depends_on = [aws_kms_key.lambda_encryption]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-model-evaluation-logs-${var.environment}"
    Purpose = "LambdaLogs"
  })
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${var.project_name}-ml-pipeline-${var.environment}-${random_string.resource_suffix.result}"
  retention_in_days = var.log_retention_days

  kms_key_id = aws_kms_key.lambda_encryption.arn

  depends_on = [aws_kms_key.lambda_encryption]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-step-functions-logs-${var.environment}"
    Purpose = "StepFunctionsLogs"
  })
}

# ========== LAMBDA FUNCTIONS ==========

# Lambda function for data preprocessing
resource "aws_lambda_function" "data_preprocessing" {
  filename         = "${path.module}/lambda/preprocessing.zip"
  function_name    = "${var.project_name}-preprocessing-${var.environment}-${random_string.resource_suffix.result}"
  role             = aws_iam_role.lambda_preprocessing.arn
  handler          = "preprocessing_handler.handler"
  runtime          = var.lambda_runtime
  timeout          = var.lambda_preprocessing_timeout
  memory_size      = var.lambda_preprocessing_memory
  source_code_hash = fileexists("${path.module}/lambda/preprocessing.zip") ? filebase64sha256("${path.module}/lambda/preprocessing.zip") : null

  environment {
    variables = {
      RAW_BUCKET       = aws_s3_bucket.raw_data.id
      PROCESSED_BUCKET = aws_s3_bucket.processed_data.id
      ENVIRONMENT      = var.environment
    }
  }

  kms_key_arn = aws_kms_key.lambda_encryption.arn

  depends_on = [
    aws_cloudwatch_log_group.lambda_preprocessing,
    aws_iam_role_policy.lambda_preprocessing
  ]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-preprocessing-${var.environment}"
    Purpose = "DataPreprocessing"
  })
}

# Lambda function for inference handling
resource "aws_lambda_function" "inference_handler" {
  filename         = "${path.module}/lambda/inference.zip"
  function_name    = "${var.project_name}-inference-${var.environment}-${random_string.resource_suffix.result}"
  role             = aws_iam_role.lambda_inference.arn
  handler          = "inference_handler.handler"
  runtime          = var.lambda_runtime
  timeout          = var.lambda_inference_timeout
  memory_size      = var.lambda_inference_memory
  source_code_hash = fileexists("${path.module}/lambda/inference.zip") ? filebase64sha256("${path.module}/lambda/inference.zip") : null

  environment {
    variables = {
      KINESIS_STREAM_NAME  = aws_kinesis_stream.inference_requests.name
      MODEL_METADATA_TABLE = aws_dynamodb_table.model_metadata.name
      AB_TEST_TABLE        = aws_dynamodb_table.ab_test_config.name
      ENVIRONMENT          = var.environment
    }
  }

  kms_key_arn = aws_kms_key.lambda_encryption.arn

  depends_on = [
    aws_cloudwatch_log_group.lambda_inference,
    aws_iam_role_policy.lambda_inference
  ]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-inference-${var.environment}"
    Purpose = "InferenceHandling"
  })
}

# Lambda function for Kinesis stream consumer
resource "aws_lambda_function" "kinesis_consumer" {
  filename         = "${path.module}/lambda/kinesis_consumer.zip"
  function_name    = "${var.project_name}-kinesis-consumer-${var.environment}-${random_string.resource_suffix.result}"
  role             = aws_iam_role.lambda_kinesis_consumer.arn
  handler          = "kinesis_consumer_handler.handler"
  runtime          = var.lambda_runtime
  timeout          = var.lambda_inference_timeout
  memory_size      = var.lambda_inference_memory
  source_code_hash = fileexists("${path.module}/lambda/kinesis_consumer.zip") ? filebase64sha256("${path.module}/lambda/kinesis_consumer.zip") : null

  environment {
    variables = {
      SAGEMAKER_ENDPOINT_A = var.create_sagemaker_endpoints ? aws_sagemaker_endpoint.model_a[0].name : ""
      SAGEMAKER_ENDPOINT_B = var.create_sagemaker_endpoints ? aws_sagemaker_endpoint.model_b[0].name : ""
      ENVIRONMENT          = var.environment
    }
  }

  kms_key_arn = aws_kms_key.lambda_encryption.arn

  depends_on = [
    aws_cloudwatch_log_group.lambda_kinesis_consumer,
    aws_iam_role_policy.lambda_kinesis_consumer
  ]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-kinesis-consumer-${var.environment}"
    Purpose = "KinesisConsumer"
  })
}

# Lambda event source mapping for Kinesis
resource "aws_lambda_event_source_mapping" "kinesis_to_lambda" {
  event_source_arn  = aws_kinesis_stream.inference_requests.arn
  function_name     = aws_lambda_function.kinesis_consumer.arn
  starting_position = "LATEST"
  batch_size        = 100

  depends_on = [
    aws_iam_role_policy.lambda_kinesis_consumer
  ]
}

# Lambda function for model evaluation
resource "aws_lambda_function" "model_evaluation" {
  filename         = "${path.module}/lambda/model_evaluation.zip"
  function_name    = "${var.project_name}-model-evaluation-${var.environment}-${random_string.resource_suffix.result}"
  role             = aws_iam_role.lambda_preprocessing.arn
  handler          = "model_evaluation_handler.handler"
  runtime          = var.lambda_runtime
  timeout          = 300
  memory_size      = 512
  source_code_hash = fileexists("${path.module}/lambda/model_evaluation.zip") ? filebase64sha256("${path.module}/lambda/model_evaluation.zip") : null

  environment {
    variables = {
      MODEL_ARTIFACTS_BUCKET = aws_s3_bucket.model_artifacts.id
      METRICS_TABLE          = aws_dynamodb_table.training_metrics.name
      ENVIRONMENT            = var.environment
    }
  }

  kms_key_arn = aws_kms_key.lambda_encryption.arn

  depends_on = [
    aws_cloudwatch_log_group.lambda_model_evaluation,
    aws_iam_role_policy.lambda_preprocessing
  ]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-model-evaluation-${var.environment}"
    Purpose = "ModelEvaluation"
  })
}

# ========== SAGEMAKER RESOURCES ==========

# Random string for unique resource naming (prevents conflicts on recreation)
resource "random_string" "sagemaker_suffix" {
  length  = 8
  special = false
  upper   = false
  keepers = {
    keeper = "6"
  }
}

# Additional random string for other resources to avoid conflicts
resource "random_string" "resource_suffix" {
  length  = 6
  special = false
  upper   = false
  keepers = {
    keeper = "6"
  }
}

# Null resource to create valid XGBoost model archive
resource "null_resource" "create_model_artifacts" {
  provisioner "local-exec" {
    command = <<-EOT
      python3 -c '
import sys
import os
import json

try:
    import xgboost as xgb
except ImportError:
    print("Installing xgboost...")
    os.system("pip3 install --quiet setuptools xgboost numpy scikit-learn")
    import xgboost as xgb

import numpy as np

print("Creating XGBoost model for SageMaker...")

# Create minimal but valid training data
np.random.seed(42)
X_train = np.random.randn(100, 4)  # Increased samples for stability
y_train = (X_train[:, 0] + X_train[:, 1] > 0).astype(int)  # Create logical pattern

# Train XGBoost model with SageMaker-compatible parameters
dtrain = xgb.DMatrix(X_train, label=y_train)
params = {
    "max_depth": 3,
    "eta": 0.1,
    "objective": "binary:logistic",
    "eval_metric": "logloss",
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "seed": 42
}

print("Training XGBoost model...")
model = xgb.train(params, dtrain, num_boost_round=50)

# Save in XGBoost binary format (default and most compatible)
model.save_model("/tmp/xgboost-model")

# Verify model file was created and is valid
if os.path.exists("/tmp/xgboost-model"):
    file_size = os.path.getsize("/tmp/xgboost-model")
    print(f"Model file created successfully: {file_size} bytes")
    
    # Test that model can be loaded back
    test_model = xgb.Booster()
    test_model.load_model("/tmp/xgboost-model")
    print("Model validation: Successfully loaded model")
    
    # Test prediction to ensure model is functional
    test_data = xgb.DMatrix(np.random.randn(1, 4))
    pred = test_model.predict(test_data)
    print(f"Model validation: Prediction test successful, output shape: {pred.shape}")
    
else:
    print("ERROR: Model file was not created")
    sys.exit(1)
'
      # Create tar.gz with the model file (SageMaker expects this exact structure)
      cd /tmp && tar -czf model.tar.gz xgboost-model
      if [ -f /tmp/model.tar.gz ]; then
        echo "Model archive created successfully at /tmp/model.tar.gz"
        echo "Archive contents:"
        tar -tzf /tmp/model.tar.gz
        echo "Archive size: $(ls -lh /tmp/model.tar.gz | awk '{print $5}')"
      else
        echo "ERROR: Failed to create model archive"
        exit 1
      fi
    EOT
  }

  triggers = {
    always_run = timestamp()
  }
}

# Upload model artifacts to S3 using Terraform S3 objects
resource "aws_s3_object" "model_artifact_a" {
  bucket = aws_s3_bucket.model_artifacts.id
  key    = "models/model-a/model.tar.gz"
  source = "/tmp/model.tar.gz"

  depends_on = [
    null_resource.create_model_artifacts
  ]

  lifecycle {
    ignore_changes = [etag]
  }
}

resource "aws_s3_object" "model_artifact_b" {
  bucket = aws_s3_bucket.model_artifacts.id
  key    = "models/model-b/model.tar.gz"
  source = "/tmp/model.tar.gz"

  depends_on = [
    null_resource.create_model_artifacts
  ]

  lifecycle {
    ignore_changes = [etag]
  }
}

# SageMaker Model A (for A/B testing)
resource "aws_sagemaker_model" "model_a" {
  name               = "${var.project_name}-model-a-${var.environment}-${random_string.sagemaker_suffix.result}"
  execution_role_arn = aws_iam_role.sagemaker.arn

  primary_container {
    image          = lookup(local.sagemaker_xgboost_images, data.aws_region.current.id, local.sagemaker_xgboost_images["us-east-1"])
    model_data_url = "s3://${aws_s3_bucket.model_artifacts.id}/models/model-a/model.tar.gz"
  }

  depends_on = [
    aws_s3_object.model_artifact_a
  ]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-model-a-${var.environment}"
    Purpose = "MLInference"
    Version = "A"
  })
}

# SageMaker Endpoint Configuration A
resource "aws_sagemaker_endpoint_configuration" "model_a" {
  name = "${var.project_name}-endpoint-config-a-${var.environment}-${random_string.sagemaker_suffix.result}"

  production_variants {
    variant_name           = "AllTraffic"
    model_name             = aws_sagemaker_model.model_a.name
    instance_type          = "ml.t2.medium"
    initial_instance_count = 1
    initial_variant_weight = 1
  }

  kms_key_arn = aws_kms_key.sagemaker_encryption.arn

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-endpoint-config-a-${var.environment}"
    Purpose = "MLInference"
    Version = "A"
  })
}

# SageMaker Endpoint A
resource "aws_sagemaker_endpoint" "model_a" {
  count                = var.create_sagemaker_endpoints ? 1 : 0
  name                 = "${var.project_name}-endpoint-a-${var.environment}-${random_string.sagemaker_suffix.result}"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.model_a.name

  lifecycle {
    create_before_destroy = false
    ignore_changes        = [endpoint_config_name]
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-endpoint-a-${var.environment}"
    Purpose = "MLInference"
    Version = "A"
  })
}

# SageMaker Model B (for A/B testing)
resource "aws_sagemaker_model" "model_b" {
  name               = "${var.project_name}-model-b-${var.environment}-${random_string.sagemaker_suffix.result}"
  execution_role_arn = aws_iam_role.sagemaker.arn

  primary_container {
    image          = lookup(local.sagemaker_xgboost_images, data.aws_region.current.id, local.sagemaker_xgboost_images["us-east-1"])
    model_data_url = "s3://${aws_s3_bucket.model_artifacts.id}/models/model-b/model.tar.gz"
  }

  depends_on = [
    aws_s3_object.model_artifact_b
  ]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-model-b-${var.environment}"
    Purpose = "MLInference"
    Version = "B"
  })
}

# SageMaker Endpoint Configuration B
resource "aws_sagemaker_endpoint_configuration" "model_b" {
  name = "${var.project_name}-endpoint-config-b-${var.environment}-${random_string.sagemaker_suffix.result}"

  production_variants {
    variant_name           = "AllTraffic"
    model_name             = aws_sagemaker_model.model_b.name
    instance_type          = "ml.t2.medium"
    initial_instance_count = 1
    initial_variant_weight = 1
  }

  kms_key_arn = aws_kms_key.sagemaker_encryption.arn

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-endpoint-config-b-${var.environment}"
    Purpose = "MLInference"
    Version = "B"
  })
}

# SageMaker Endpoint B
resource "aws_sagemaker_endpoint" "model_b" {
  count                = var.create_sagemaker_endpoints ? 1 : 0
  name                 = "${var.project_name}-endpoint-b-${var.environment}-${random_string.sagemaker_suffix.result}"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.model_b.name

  lifecycle {
    create_before_destroy = false
    ignore_changes        = [endpoint_config_name]
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-endpoint-b-${var.environment}"
    Purpose = "MLInference"
    Version = "B"
  })
}

# ========== STEP FUNCTIONS STATE MACHINE ==========

resource "aws_sfn_state_machine" "ml_pipeline" {
  count    = var.create_step_functions ? 1 : 0
  name     = "${var.project_name}-ml-pipeline-${var.environment}"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "ML Training Pipeline with Data Preprocessing, Training, Evaluation, and Deployment"
    StartAt = "DataValidation"
    States = {
      DataValidation = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.data_preprocessing.arn
          Payload = {
            "action" = "validate"
          }
        }
        Next = "DataPreprocessing"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "HandleError"
          }
        ]
      }
      DataPreprocessing = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.data_preprocessing.arn
          Payload = {
            "action" = "preprocess"
          }
        }
        Next = "TrainModel"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "HandleError"
          }
        ]
      }
      TrainModel = {
        Type     = "Task"
        Resource = "arn:aws:states:::sagemaker:createTrainingJob.sync"
        Parameters = {
          TrainingJobName = "${var.project_name}-training-job-${var.environment}"
          RoleArn         = aws_iam_role.sagemaker.arn
          AlgorithmSpecification = {
            TrainingImage     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.id}.amazonaws.com/${var.sagemaker_image_name}:latest"
            TrainingInputMode = "File"
          }
          InputDataConfig = [
            {
              ChannelName = "training"
              DataSource = {
                S3DataSource = {
                  S3DataType             = "S3Prefix"
                  S3Uri                  = "s3://${aws_s3_bucket.processed_data.id}/training/"
                  S3DataDistributionType = "FullyReplicated"
                }
              }
            }
          ]
          OutputDataConfig = {
            S3OutputPath = "s3://${aws_s3_bucket.model_artifacts.id}/output/"
          }
          ResourceConfig = {
            InstanceType   = var.sagemaker_training_instance_type
            InstanceCount  = 1
            VolumeSizeInGB = var.sagemaker_training_volume_size
          }
          StoppingCondition = {
            MaxRuntimeInSeconds = var.sagemaker_training_max_runtime
          }
        }
        Next = "EvaluateModel"
        Retry = [
          {
            ErrorEquals     = ["SageMaker.AmazonSageMakerException"]
            IntervalSeconds = 60
            MaxAttempts     = 2
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "HandleError"
          }
        ]
      }
      EvaluateModel = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.model_evaluation.arn
          Payload = {
            "action" = "evaluate"
          }
        }
        Next = "CheckMetrics"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "HandleError"
          }
        ]
      }
      CheckMetrics = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.Payload.meetsThreshold"
            BooleanEquals = true
            Next          = "DeployModel"
          }
        ]
        Default = "SkipDeployment"
      }
      DeployModel = {
        Type     = "Task"
        Resource = "arn:aws:states:::sagemaker:updateEndpoint"
        Parameters = {
          EndpointName       = var.create_sagemaker_endpoints ? aws_sagemaker_endpoint.model_a[0].name : "placeholder"
          EndpointConfigName = aws_sagemaker_endpoint_configuration.model_a.name
        }
        Next = "Success"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "HandleError"
          }
        ]
      }
      SkipDeployment = {
        Type   = "Pass"
        Result = "Model did not meet deployment criteria"
        Next   = "Success"
      }
      Success = {
        Type = "Succeed"
      }
      HandleError = {
        Type  = "Fail"
        Error = "PipelineExecutionFailed"
        Cause = "An error occurred during pipeline execution"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  depends_on = [
    aws_iam_role_policy.step_functions
  ]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-ml-pipeline-${var.environment}"
    Purpose = "MLOrchestration"
  })
}

# ========== API GATEWAY ==========

resource "aws_apigatewayv2_api" "ml_inference" {
  name          = "${var.project_name}-ml-api-${var.environment}"
  protocol_type = "HTTP"
  description   = "ML Inference API for ${var.project_name}"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 300
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-ml-api-${var.environment}"
    Purpose = "MLInferenceAPI"
  })
}

resource "aws_apigatewayv2_integration" "lambda_inference" {
  api_id                 = aws_apigatewayv2_api.ml_inference.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.inference_handler.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "inference" {
  api_id    = aws_apigatewayv2_api.ml_inference.id
  route_key = "POST /inference"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_inference.id}"
}

resource "aws_apigatewayv2_stage" "ml_inference" {
  api_id      = aws_apigatewayv2_api.ml_inference.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      ip                      = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      httpMethod              = "$context.httpMethod"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      protocol                = "$context.protocol"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }

  default_route_settings {
    throttling_burst_limit = 5000
    throttling_rate_limit  = 10000
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-ml-api-stage-${var.environment}"
    Purpose = "MLInferenceAPI"
  })
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-ml-api-${var.environment}-${random_string.resource_suffix.result}"
  retention_in_days = var.log_retention_days

  kms_key_id = aws_kms_key.lambda_encryption.arn

  depends_on = [aws_kms_key.lambda_encryption]

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-api-gateway-logs-${var.environment}"
    Purpose = "APIGatewayLogs"
  })
}

resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.inference_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ml_inference.execution_arn}/*/*"
}

# ========== EVENTBRIDGE RULES ==========

# EventBridge rule for scheduled retraining
resource "aws_cloudwatch_event_rule" "scheduled_training" {
  name                = "${var.project_name}-scheduled-training-${var.environment}"
  description         = "Trigger ML training pipeline on schedule"
  schedule_expression = var.training_schedule_expression

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-scheduled-training-${var.environment}"
    Purpose = "ScheduledTraining"
  })
}

resource "aws_cloudwatch_event_target" "scheduled_training_target" {
  count     = var.create_step_functions ? 1 : 0
  rule      = aws_cloudwatch_event_rule.scheduled_training.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.ml_pipeline[0].arn
  role_arn  = aws_iam_role.eventbridge.arn
}

# EventBridge rule for S3 data ingestion
resource "aws_cloudwatch_event_rule" "data_ingestion" {
  name        = "${var.project_name}-data-ingestion-${var.environment}"
  description = "Trigger preprocessing when new data arrives in S3"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.raw_data.id]
      }
    }
  })

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-data-ingestion-${var.environment}"
    Purpose = "DataIngestion"
  })
}

resource "aws_cloudwatch_event_target" "data_ingestion_target" {
  rule      = aws_cloudwatch_event_rule.data_ingestion.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.data_preprocessing.arn
}

resource "aws_lambda_permission" "eventbridge_lambda" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_preprocessing.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.data_ingestion.arn
}

# ========== CLOUDWATCH DASHBOARDS AND ALARMS ==========

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "ml_pipeline" {
  dashboard_name = "${var.project_name}-ml-dashboard-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SageMaker", "ModelLatency", { stat = "Average" }],
            [".", "Invocations", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.id
          title  = "SageMaker Endpoint Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum" }],
            [".", "Duration", { stat = "Average" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.id
          title  = "Lambda Function Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Kinesis", "IncomingRecords", { stat = "Sum" }],
            [".", "IncomingBytes", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.id
          title  = "Kinesis Stream Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/States", "ExecutionsFailed", { stat = "Sum" }],
            [".", "ExecutionsSucceeded", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.id
          title  = "Step Functions Executions"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "sagemaker_model_a_latency" {
  alarm_name          = "${var.project_name}-model-a-high-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ModelLatency"
  namespace           = "AWS/SageMaker"
  period              = 300
  statistic           = "Average"
  threshold           = var.sagemaker_latency_threshold_ms
  alarm_description   = "Alert when SageMaker Model A latency is too high"
  alarm_actions       = [aws_sns_topic.ml_alerts.arn]

  dimensions = {
    EndpointName = var.create_sagemaker_endpoints ? aws_sagemaker_endpoint.model_a[0].name : "placeholder"
    VariantName  = "AllTraffic"
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-model-a-latency-alarm-${var.environment}"
    Purpose = "Monitoring"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-high-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when Lambda functions have too many errors"
  alarm_actions       = [aws_sns_topic.ml_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.inference_handler.function_name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-lambda-errors-alarm-${var.environment}"
    Purpose = "Monitoring"
  })
}

resource "aws_cloudwatch_metric_alarm" "kinesis_iterator_age" {
  alarm_name          = "${var.project_name}-kinesis-high-iterator-age-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "GetRecords.IteratorAgeMilliseconds"
  namespace           = "AWS/Kinesis"
  period              = 300
  statistic           = "Maximum"
  threshold           = 60000
  alarm_description   = "Alert when Kinesis iterator age is too high"
  alarm_actions       = [aws_sns_topic.ml_alerts.arn]

  dimensions = {
    StreamName = aws_kinesis_stream.inference_requests.name
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-kinesis-iterator-age-alarm-${var.environment}"
    Purpose = "Monitoring"
  })
}

resource "aws_cloudwatch_metric_alarm" "step_functions_failed" {
  alarm_name          = "${var.project_name}-step-functions-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert when Step Functions executions fail"
  alarm_actions       = [aws_sns_topic.ml_alerts.arn]

  dimensions = {
    StateMachineArn = var.create_step_functions ? aws_sfn_state_machine.ml_pipeline[0].arn : "placeholder"
  }

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-step-functions-failed-alarm-${var.environment}"
    Purpose = "Monitoring"
  })
}

# SNS Topic for alerts
resource "aws_sns_topic" "ml_alerts" {
  name              = "${var.project_name}-ml-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.lambda_encryption.id

  tags = merge(var.common_tags, {
    Name    = "${var.project_name}-ml-alerts-${var.environment}"
    Purpose = "Alerting"
  })
}

# ========== DATA SOURCES ==========

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# ========== LOCALS ==========

locals {
  # Regional SageMaker XGBoost container images
  sagemaker_xgboost_images = {
    "us-east-1"      = "683313688378.dkr.ecr.us-east-1.amazonaws.com/sagemaker-xgboost:1.5-1"
    "us-east-2"      = "257758044811.dkr.ecr.us-east-2.amazonaws.com/sagemaker-xgboost:1.5-1"
    "us-west-1"      = "746614075791.dkr.ecr.us-west-1.amazonaws.com/sagemaker-xgboost:1.5-1"
    "us-west-2"      = "246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-xgboost:1.5-1"
    "ap-south-1"     = "720646828776.dkr.ecr.ap-south-1.amazonaws.com/sagemaker-xgboost:1.5-1"
    "ap-northeast-1" = "354813040037.dkr.ecr.ap-northeast-1.amazonaws.com/sagemaker-xgboost:1.5-1"
    "ap-northeast-2" = "366743142698.dkr.ecr.ap-northeast-2.amazonaws.com/sagemaker-xgboost:1.5-1"
    "ap-southeast-1" = "121021644041.dkr.ecr.ap-southeast-1.amazonaws.com/sagemaker-xgboost:1.5-1"
    "ap-southeast-2" = "783357654285.dkr.ecr.ap-southeast-2.amazonaws.com/sagemaker-xgboost:1.5-1"
    "eu-central-1"   = "492215442770.dkr.ecr.eu-central-1.amazonaws.com/sagemaker-xgboost:1.5-1"
    "eu-west-1"      = "141502667606.dkr.ecr.eu-west-1.amazonaws.com/sagemaker-xgboost:1.5-1"
    "eu-west-2"      = "764974769150.dkr.ecr.eu-west-2.amazonaws.com/sagemaker-xgboost:1.5-1"
    "eu-west-3"      = "659782779980.dkr.ecr.eu-west-3.amazonaws.com/sagemaker-xgboost:1.5-1"
  }
}

# ========== OUTPUTS ==========

output "raw_data_bucket" {
  description = "S3 bucket for raw image data"
  value       = aws_s3_bucket.raw_data.id
}

output "processed_data_bucket" {
  description = "S3 bucket for processed data"
  value       = aws_s3_bucket.processed_data.id
}

output "model_artifacts_bucket" {
  description = "S3 bucket for model artifacts"
  value       = aws_s3_bucket.model_artifacts.id
}

output "logs_bucket" {
  description = "S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

output "model_metadata_table" {
  description = "DynamoDB table for model metadata"
  value       = aws_dynamodb_table.model_metadata.name
}

output "training_metrics_table" {
  description = "DynamoDB table for training metrics"
  value       = aws_dynamodb_table.training_metrics.name
}

output "ab_test_config_table" {
  description = "DynamoDB table for A/B test configuration"
  value       = aws_dynamodb_table.ab_test_config.name
}

output "kinesis_stream_name" {
  description = "Kinesis stream for inference requests"
  value       = aws_kinesis_stream.inference_requests.name
}

output "kinesis_stream_arn" {
  description = "Kinesis stream ARN"
  value       = aws_kinesis_stream.inference_requests.arn
}

output "sagemaker_endpoint_a" {
  description = "SageMaker endpoint A for inference"
  value       = var.create_sagemaker_endpoints ? aws_sagemaker_endpoint.model_a[0].name : "not_created"
}

output "sagemaker_endpoint_b" {
  description = "SageMaker endpoint B for A/B testing"
  value       = var.create_sagemaker_endpoints ? aws_sagemaker_endpoint.model_b[0].name : "not_created"
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = var.create_step_functions ? aws_sfn_state_machine.ml_pipeline[0].arn : "not_created"
}

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = "${aws_apigatewayv2_api.ml_inference.api_endpoint}/${var.environment}"
}

output "inference_api_url" {
  description = "Full inference API URL"
  value       = "${aws_apigatewayv2_api.ml_inference.api_endpoint}/${var.environment}/inference"
}

output "lambda_preprocessing_function" {
  description = "Lambda function for data preprocessing"
  value       = aws_lambda_function.data_preprocessing.function_name
}

output "lambda_inference_function" {
  description = "Lambda function for inference handling"
  value       = aws_lambda_function.inference_handler.function_name
}

output "lambda_kinesis_consumer_function" {
  description = "Lambda function for Kinesis consumer"
  value       = aws_lambda_function.kinesis_consumer.function_name
}

output "sns_alerts_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.ml_alerts.arn
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.ml_pipeline.dashboard_name
}
