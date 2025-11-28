# CloudWatch Metric Stream
resource "aws_cloudwatch_metric_stream" "main" {
  name          = "${local.name_prefix}-stream"
  role_arn      = aws_iam_role.metric_streams.arn
  firehose_arn  = aws_kinesis_firehose_delivery_stream.metric_streams.arn
  output_format = "opentelemetry0.7"

  include_filter {
    namespace = "AWS/Lambda"
  }

  include_filter {
    namespace = "AWS/ECS"
  }

  include_filter {
    namespace = "CustomMetrics/${local.name_prefix}"
  }

  include_filter {
    namespace = "AWS/ApplicationELB"
  }

  include_filter {
    namespace = "AWS/RDS"
  }

  statistics_configuration {
    additional_statistics = ["p50", "p90", "p95", "p99"]

    include_metric {
      metric_name = "Duration"
      namespace   = "AWS/Lambda"
    }
  }

  statistics_configuration {
    additional_statistics = ["p50", "p90", "p95", "p99"]

    include_metric {
      metric_name = "ResponseTime"
      namespace   = "CustomMetrics/${local.name_prefix}"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-metric-stream"
    }
  )
}
