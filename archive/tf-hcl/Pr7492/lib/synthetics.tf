# CloudWatch Synthetics Canary - Primary Region
resource "aws_synthetics_canary" "api_health_primary" {
  name                 = "${local.name_prefix}-api-health-primary"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_artifacts.id}/"
  execution_role_arn   = aws_iam_role.synthetics.arn
  runtime_version      = "syn-python-selenium-2.0"
  handler              = "canary.handler"

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds = 60
    memory_in_mb       = 960
    active_tracing     = true

    environment_variables = {
      ENVIRONMENT = var.environment
    }
  }

  success_retention_period = 31
  failure_retention_period = 31

  artifact_config {
    s3_encryption {
      encryption_mode = "SSE_S3"
    }
  }

  zip_file = data.archive_file.canary_script.output_path

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-api-health-primary"
      Region = var.region
    }
  )

  depends_on = [aws_s3_object.canary_script]
}

# CloudWatch Synthetics Canary - Secondary Region
resource "aws_synthetics_canary" "api_health_secondary" {
  provider = aws.secondary

  name                 = "${local.name_prefix}-api-health-secondary"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_artifacts.id}/"
  execution_role_arn   = aws_iam_role.synthetics.arn
  runtime_version      = "syn-python-selenium-2.0"
  handler              = "canary.handler"

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds = 60
    memory_in_mb       = 960
    active_tracing     = true

    environment_variables = {
      ENVIRONMENT = var.environment
      REGION      = var.secondary_region
    }
  }

  success_retention_period = 31
  failure_retention_period = 31

  artifact_config {
    s3_encryption {
      encryption_mode = "SSE_S3"
    }
  }

  zip_file = data.archive_file.canary_script.output_path

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-api-health-secondary"
      Region = var.secondary_region
    }
  )

  depends_on = [aws_s3_object.canary_script]
}

# Upload canary script to S3
resource "aws_s3_object" "canary_script" {
  bucket = aws_s3_bucket.synthetics_artifacts.id
  key    = "canary/canary.zip"
  source = data.archive_file.canary_script.output_path
  etag   = filemd5(data.archive_file.canary_script.output_path)

  tags = local.common_tags
}

# Archive canary script
data "archive_file" "canary_script" {
  type        = "zip"
  output_path = "${path.module}/canary.zip"

  source {
    content  = file("${path.module}/synthetics/canary.py")
    filename = "python/canary.py"
  }
}

# Alarms for Synthetics
resource "aws_cloudwatch_metric_alarm" "canary_failed_primary" {
  alarm_name          = "${local.name_prefix}-canary-failed-primary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SuccessPercent"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Canary success rate below 90% in primary region"

  dimensions = {
    CanaryName = aws_synthetics_canary.api_health_primary.name
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-canary-alarm-primary"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "canary_failed_secondary" {
  provider = aws.secondary

  alarm_name          = "${local.name_prefix}-canary-failed-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SuccessPercent"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Canary success rate below 90% in secondary region"

  dimensions = {
    CanaryName = aws_synthetics_canary.api_health_secondary.name
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-canary-alarm-secondary"
    }
  )
}
