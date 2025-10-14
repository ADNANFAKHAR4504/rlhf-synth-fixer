# Generate a unique suffix for resource names
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  # Use ENVIRONMENT_SUFFIX from environment variable, fallback to random suffix for local development
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : random_id.suffix.hex
  name_suffix        = local.environment_suffix # Alias for unit tests
  name_prefix        = "${var.project}-${var.environment}"
  full_prefix        = "${local.name_prefix}-${local.environment_suffix}"
}

#---------------------------
# S3 Bucket for Log Storage
#---------------------------
resource "aws_s3_bucket" "log_storage" {
  bucket = "${var.log_bucket_name}-${local.name_suffix}"
}

resource "aws_s3_bucket_lifecycle_configuration" "log_lifecycle" {
  bucket = aws_s3_bucket.log_storage.id

  rule {
    id     = "log_retention"
    status = "Enabled"

    expiration {
      days = var.retention_days
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_encryption" {
  bucket = aws_s3_bucket.log_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "log_access_block" {
  bucket = aws_s3_bucket.log_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

#---------------------------
# IAM Roles and Policies
#---------------------------
# IAM Role for Firehose
resource "aws_iam_role" "firehose_role" {
  name = "${local.full_prefix}-firehose-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "firehose.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "firehose_policy" {
  name = "${local.full_prefix}-firehose-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ],
        Resource = [
          aws_s3_bucket.log_storage.arn,
          "${aws_s3_bucket.log_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = [
          aws_lambda_function.log_processor.arn,
          "${aws_lambda_function.log_processor.arn}:*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "glue:GetTableVersions"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "firehose_policy_attachment" {
  role       = aws_iam_role.firehose_role.name
  policy_arn = aws_iam_policy.firehose_policy.arn
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${local.full_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name = "${local.full_prefix}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ],
        Resource = "${aws_s3_bucket.log_storage.arn}/*"
      },
      {
        Effect = "Allow",
        Action = [
          "cloudwatch:PutMetricData"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "kinesis:DescribeStream",
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# IAM Role for Glue
resource "aws_iam_role" "glue_role" {
  name = "${local.full_prefix}-glue-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = [
          "glue.amazonaws.com",
          "firehose.amazonaws.com"
        ]
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "glue_service_policy" {
  role       = aws_iam_role.glue_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

resource "aws_iam_policy" "glue_s3_policy" {
  name = "${local.full_prefix}-glue-s3-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        Resource = [
          aws_s3_bucket.log_storage.arn,
          "${aws_s3_bucket.log_storage.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_s3_policy_attachment" {
  role       = aws_iam_role.glue_role.name
  policy_arn = aws_iam_policy.glue_s3_policy.arn
}

# IAM Role for Athena
resource "aws_iam_role" "athena_role" {
  name = "${local.full_prefix}-athena-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "athena.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "athena_policy" {
  name = "${local.full_prefix}-athena-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload",
          "s3:PutObject"
        ],
        Resource = [
          aws_s3_bucket.log_storage.arn,
          "${aws_s3_bucket.log_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "glue:GetDatabase",
          "glue:GetTable",
          "glue:GetPartition",
          "glue:GetPartitions",
          "glue:BatchGetPartition"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "athena_policy_attachment" {
  role       = aws_iam_role.athena_role.name
  policy_arn = aws_iam_policy.athena_policy.arn
}

#---------------------------
# Kinesis Firehose Delivery Streams
#---------------------------
resource "aws_kinesis_firehose_delivery_stream" "log_delivery_stream" {
  for_each = toset(var.log_types)

  name        = "${local.full_prefix}-${each.value}-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn            = aws_iam_role.firehose_role.arn
    bucket_arn          = aws_s3_bucket.log_storage.arn
    prefix              = "logs/${each.value}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"
    error_output_prefix = "errors/${each.value}/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"
    buffer_size         = var.firehose_buffer_size
    buffer_interval     = var.firehose_buffer_interval

    # Processing with Lambda
    processing_configuration {
      enabled = true

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = aws_lambda_function.log_processor.arn
        }

        parameters {
          parameter_name  = "BufferIntervalInSeconds"
          parameter_value = "60"
        }

        parameters {
          parameter_name  = "BufferSizeInMBs"
          parameter_value = "3"
        }
      }
    }

    # Data format conversion
    data_format_conversion_configuration {
      input_format_configuration {
        deserializer {
          hive_json_ser_de {}
        }
      }

      output_format_configuration {
        serializer {
          parquet_ser_de {}
        }
      }

      schema_configuration {
        database_name = aws_glue_catalog_database.logs_database.name
        role_arn      = aws_iam_role.glue_role.arn
        table_name    = aws_glue_catalog_table.logs_table[each.value].name
      }
    }

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose_log_group.name
      log_stream_name = "firehose-${each.value}"
    }
  }

  tags = {
    LogType = each.value
  }
}

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose_log_group" {
  name              = "/aws/firehose/${local.full_prefix}-logs"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_stream" "firehose_log_streams" {
  for_each = toset(var.log_types)

  name           = "firehose-${each.value}"
  log_group_name = aws_cloudwatch_log_group.firehose_log_group.name
}

#---------------------------
# Lambda Function for Log Processing
#---------------------------
resource "aws_lambda_function" "log_processor" {
  function_name    = "${local.full_prefix}-log-processor"
  filename         = "lambda_function.zip"
  source_code_hash = filebase64sha256("lambda_function.zip")
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = {
      LOG_BUCKET       = aws_s3_bucket.log_storage.id
      METRIC_NAMESPACE = "${local.name_prefix}-logs"
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.log_processor.function_name}"
  retention_in_days = 30
}

#---------------------------
# Glue Resources for Schema Management
#---------------------------
resource "aws_glue_catalog_database" "logs_database" {
  name = var.glue_database_name
}

resource "aws_glue_catalog_table" "logs_table" {
  for_each = toset(var.log_types)

  name          = "${each.value}_logs"
  database_name = aws_glue_catalog_database.logs_database.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "classification"      = "parquet"
    "parquet.compression" = "SNAPPY"
    EXTERNAL              = "TRUE"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.log_storage.id}/logs/${each.value}/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      name                  = "ParquetHiveSerDe"
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns {
      name = "timestamp"
      type = "string"
    }

    columns {
      name = "log_level"
      type = "string"
    }

    columns {
      name = "message"
      type = "string"
    }

    columns {
      name = "server_id"
      type = "string"
    }

    columns {
      name = "source"
      type = "string"
    }

    columns {
      name = "component"
      type = "string"
    }
  }
}

resource "aws_glue_crawler" "logs_crawler" {
  name          = "${local.full_prefix}-logs-crawler"
  role          = aws_iam_role.glue_role.name
  database_name = aws_glue_catalog_database.logs_database.name

  s3_target {
    path = "s3://${aws_s3_bucket.log_storage.id}/logs/"
  }

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }

  schedule = "cron(0 0 * * ? *)" # Run daily at midnight
}

#---------------------------
# Athena Workgroup
#---------------------------
resource "aws_athena_workgroup" "logs_analytics" {
  name = "${local.full_prefix}-logs-analytics"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.log_storage.id}/athena-results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }
}

#---------------------------
# CloudWatch Metrics and Alarms
#---------------------------
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.full_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ErrorCount"
  namespace           = "${local.name_prefix}-logs"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors for high error rates in logs"
  alarm_actions       = [aws_sns_topic.alarm_notifications.arn]
  ok_actions          = [aws_sns_topic.alarm_notifications.arn]
}

resource "aws_sns_topic" "alarm_notifications" {
  name = "${local.full_prefix}-alarm-notifications"
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.alarm_notifications.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Dashboard for monitoring log metrics
resource "aws_cloudwatch_dashboard" "logs_dashboard" {
  dashboard_name = "${local.full_prefix}-logs-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["${local.name_prefix}-logs", "ProcessedLogCount", { "stat" : "Sum" }],
            ["${local.name_prefix}-logs", "ErrorCount", { "stat" : "Sum" }]
          ],
          view   = "timeSeries",
          region = var.aws_region,
          title  = "Log Processing Metrics",
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["application"].name, { "stat" : "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["system"].name, { "stat" : "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["security"].name, { "stat" : "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["performance"].name, { "stat" : "Sum" }]
          ],
          view   = "timeSeries",
          region = var.aws_region,
          title  = "Firehose Delivery Success",
          period = 300
        }
      }
    ]
  })
}

#---------------------------
# QuickSight Resources for Dashboards
#---------------------------
# QuickSight Data Source
resource "aws_quicksight_data_source" "logs_data_source" {
  aws_account_id = data.aws_caller_identity.current.account_id
  data_source_id = "${local.full_prefix}-logs-data-source"
  name           = "${local.full_prefix}-logs-data-source"
  type           = "ATHENA"

  parameters {
    athena {
      work_group = aws_athena_workgroup.logs_analytics.name
    }
  }

  permission {
    principal = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
    actions = [
      "quicksight:DescribeDataSource",
      "quicksight:DescribeDataSourcePermissions",
      "quicksight:PassDataSource",
      "quicksight:UpdateDataSource",
      "quicksight:DeleteDataSource"
    ]
  }

  tags = {
    Name = "Logging Analytics Data Source"
  }
}

# QuickSight Data Set for log analysis
resource "aws_quicksight_data_set" "logs_dataset" {
  aws_account_id = data.aws_caller_identity.current.account_id
  data_set_id    = "${local.full_prefix}-logs-dataset"
  name           = "${local.full_prefix}-logs-dataset"
  import_mode    = "DIRECT_QUERY"

  physical_table_map {
    physical_table_map_id = "logs_table"
    
    relational_table {
      data_source_arn = aws_quicksight_data_source.logs_data_source.arn
      name            = "application_logs" # Start with application logs as primary
      input_columns {
        name = "timestamp"
        type = "DATETIME"
      }
      input_columns {
        name = "log_level"
        type = "STRING"
      }
      input_columns {
        name = "message"
        type = "STRING"
      }
      input_columns {
        name = "server_id"
        type = "STRING"
      }
      input_columns {
        name = "source"
        type = "STRING"
      }
      input_columns {
        name = "component"
        type = "STRING"
      }
    }
  }

  permissions {
    principal = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
    actions = [
      "quicksight:DescribeDataSet",
      "quicksight:DescribeDataSetPermissions",
      "quicksight:PassDataSet",
      "quicksight:DescribeIngestion",
      "quicksight:ListIngestions",
      "quicksight:UpdateDataSet",
      "quicksight:DeleteDataSet",
      "quicksight:CreateIngestion",
      "quicksight:CancelIngestion"
    ]
  }

  tags = {
    Name = "Logging Analytics Dataset"
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}
