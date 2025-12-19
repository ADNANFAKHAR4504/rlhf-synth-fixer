# Kinesis Firehose Delivery Stream for CloudWatch Metric Streams
resource "aws_kinesis_firehose_delivery_stream" "metric_streams" {
  name        = "${local.name_prefix}-metric-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn            = aws_iam_role.firehose.arn
    bucket_arn          = aws_s3_bucket.metric_streams.arn
    prefix              = "metrics/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    buffering_size     = 128
    buffering_interval = 60
    compression_format = "GZIP"

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = aws_cloudwatch_log_stream.firehose.name
    }

    data_format_conversion_configuration {
      input_format_configuration {
        deserializer {
          open_x_json_ser_de {}
        }
      }

      output_format_configuration {
        serializer {
          parquet_ser_de {}
        }
      }

      schema_configuration {
        database_name = aws_glue_catalog_database.metrics.name
        table_name    = aws_glue_catalog_table.metrics.name
        role_arn      = aws_iam_role.firehose.arn
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-metric-stream"
    }
  )
}

# Glue Catalog Database for metrics
resource "aws_glue_catalog_database" "metrics" {
  name = "${replace(local.name_prefix, "-", "_")}_metrics"

  description = "Database for CloudWatch metrics"
}

# Glue Catalog Table for metrics schema
resource "aws_glue_catalog_table" "metrics" {
  name          = "metric_data"
  database_name = aws_glue_catalog_database.metrics.name

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.metric_streams.id}/metrics/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns {
      name = "metric_name"
      type = "string"
    }

    columns {
      name = "namespace"
      type = "string"
    }

    columns {
      name = "value"
      type = "double"
    }

    columns {
      name = "timestamp"
      type = "bigint"
    }

    columns {
      name = "unit"
      type = "string"
    }
  }
}
