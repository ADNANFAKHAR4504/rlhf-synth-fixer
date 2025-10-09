# firehose.tf

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/kinesisfirehose/${local.name_prefix}"
  retention_in_days = 7

  tags = var.tags
}

resource "aws_cloudwatch_log_stream" "firehose_dest" {
  name           = "DestinationDelivery"
  log_group_name = aws_cloudwatch_log_group.firehose.name
}

resource "aws_cloudwatch_log_stream" "firehose_backup" {
  name           = "BackupDelivery"
  log_group_name = aws_cloudwatch_log_group.firehose.name
}

# Kinesis Firehose Delivery Stream
resource "aws_kinesis_firehose_delivery_stream" "logs" {
  name        = "${local.name_prefix}-delivery-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose.arn
    bucket_arn = aws_s3_bucket.log_storage.arn

    # Buffering configuration
    buffering_size     = var.firehose_buffer_size
    buffering_interval = var.firehose_buffer_interval

    # Compression
    compression_format = "GZIP"

    # Error output prefix
    error_output_prefix = "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    # Dynamic partitioning configuration
    dynamic_partitioning_configuration {
      enabled = true
    }

    # Prefix with dynamic partitioning using JQ processor
    prefix = "application=!{partitionKeyFromQuery:application}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    # Processing configuration for Lambda transformation
    processing_configuration {
      enabled = true

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = "${aws_lambda_function.log_transformer.arn}:$LATEST"
        }

        parameters {
          parameter_name  = "BufferSizeInMBs"
          parameter_value = "1"
        }

        parameters {
          parameter_name  = "BufferIntervalInSeconds"
          parameter_value = "60"
        }
      }

      # AppendDelimiterToRecord processor
      processors {
        type = "AppendDelimiterToRecord"

        parameters {
          parameter_name  = "Delimiter"
          parameter_value = "\\n"
        }
      }

      # MetadataExtraction for dynamic partitioning
      processors {
        type = "MetadataExtraction"

        parameters {
          parameter_name  = "JsonParsingEngine"
          parameter_value = "JQ-1.6"
        }

        parameters {
          parameter_name  = "MetadataExtractionQuery"
          parameter_value = "{application:.application}"
        }
      }
    }

    # CloudWatch logging
    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = aws_cloudwatch_log_stream.firehose_dest.name
    }

    # S3 backup configuration
    s3_backup_mode = "Enabled"

    s3_backup_configuration {
      role_arn   = aws_iam_role.firehose.arn
      bucket_arn = aws_s3_bucket.log_storage.arn
      prefix     = "backup/"

      buffering_size     = var.firehose_buffer_size
      buffering_interval = var.firehose_buffer_interval
      compression_format = "GZIP"

      cloudwatch_logging_options {
        enabled         = true
        log_group_name  = aws_cloudwatch_log_group.firehose.name
        log_stream_name = aws_cloudwatch_log_stream.firehose_backup.name
      }
    }
  }

  tags = var.tags
}
