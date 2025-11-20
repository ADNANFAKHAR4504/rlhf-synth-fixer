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
