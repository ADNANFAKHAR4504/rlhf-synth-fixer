# cloudwatch.tf - CloudWatch Dashboards and Alarms with SNS Integration

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "migration-alerts-${var.environment_suffix}"
  display_name      = "Migration Alerts for ${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.sns.id

  tags = {
    Name = "migration-alerts-${var.environment_suffix}"
  }
}

# SNS Topic Subscription (Email)
resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# KMS Key for SNS Encryption
resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "kms-sns-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "sns" {
  name          = "alias/sns-${var.environment_suffix}"
  target_key_id = aws_kms_key.sns.key_id
}

# CloudWatch Dashboard for Migration Monitoring
resource "aws_cloudwatch_dashboard" "migration" {
  dashboard_name = "migration-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "FullLoadThroughputRowsSource", { stat = "Average" }],
            [".", "FullLoadThroughputRowsTarget", { stat = "Average" }],
            [".", "CDCLatencySource", { stat = "Average" }],
            [".", "CDCLatencyTarget", { stat = "Average" }]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "DMS Replication Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", dimensions = { DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier } }],
            [".", "DatabaseConnections", { stat = "Average", dimensions = { DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier } }],
            [".", "FreeableMemory", { stat = "Average", dimensions = { DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier } }]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "Aurora PostgreSQL Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", dimensions = { LoadBalancer = aws_lb.main.arn_suffix } }],
            [".", "RequestCount", { stat = "Sum", dimensions = { LoadBalancer = aws_lb.main.arn_suffix } }],
            [".", "HTTPCode_Target_2XX_Count", { stat = "Sum", dimensions = { LoadBalancer = aws_lb.main.arn_suffix } }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum", dimensions = { LoadBalancer = aws_lb.main.arn_suffix } }]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Performance Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", dimensions = { FunctionName = aws_lambda_function.data_transformation.function_name } }],
            [".", "Errors", { stat = "Sum", dimensions = { FunctionName = aws_lambda_function.data_transformation.function_name } }],
            [".", "Duration", { stat = "Average", dimensions = { FunctionName = aws_lambda_function.data_transformation.function_name } }],
            [".", "ConcurrentExecutions", { stat = "Maximum", dimensions = { FunctionName = aws_lambda_function.data_transformation.function_name } }]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Function Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum", dimensions = { TableName = aws_dynamodb_table.session_state.name } }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum", dimensions = { TableName = aws_dynamodb_table.session_state.name } }],
            [".", "UserErrors", { stat = "Sum", dimensions = { TableName = aws_dynamodb_table.session_state.name } }]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Session State Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Route53", "HealthCheckStatus", { stat = "Minimum", dimensions = { HealthCheckId = aws_route53_health_check.blue.id } }],
            [".", "HealthCheckStatus", { stat = "Minimum", dimensions = { HealthCheckId = aws_route53_health_check.green.id } }]
          ]
          period = 60
          stat   = "Minimum"
          region = var.aws_region
          title  = "Route53 Health Check Status"
          yAxis = {
            left = {
              min = 0
              max = 1
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", { stat = "Average", dimensions = { TargetGroup = aws_lb_target_group.blue.arn_suffix } }],
            [".", "UnHealthyHostCount", { stat = "Average", dimensions = { TargetGroup = aws_lb_target_group.blue.arn_suffix } }],
            [".", "HealthyHostCount", { stat = "Average", dimensions = { TargetGroup = aws_lb_target_group.green.arn_suffix } }],
            [".", "UnHealthyHostCount", { stat = "Average", dimensions = { TargetGroup = aws_lb_target_group.green.arn_suffix } }]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "Target Group Health Status"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", { stat = "Average", dimensions = { BucketName = aws_s3_bucket.migration_logs.id, StorageType = "StandardStorage" } }],
            [".", "NumberOfObjects", { stat = "Average", dimensions = { BucketName = aws_s3_bucket.migration_logs.id, StorageType = "AllStorageTypes" } }]
          ]
          period = 86400
          stat   = "Average"
          region = var.aws_region
          title  = "S3 Migration Logs Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })
}

# CloudWatch Alarm for DMS Replication Lag
resource "aws_cloudwatch_metric_alarm" "dms_replication_lag" {
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CDCLatencySource"
  namespace           = "AWS/DMS"
  period              = 60
  statistic           = "Average"
  threshold           = 300000 # 5 minutes in milliseconds
  alarm_description   = "This metric monitors DMS replication lag"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "dms-replication-lag-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Aurora CPU Utilization
resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "aurora-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors Aurora CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-cpu-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Aurora Database Connections
resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "aurora-connections-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "This metric monitors Aurora database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-connections-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Log Metric Filter for Error Patterns
resource "aws_cloudwatch_log_metric_filter" "lambda_errors" {
  name           = "lambda-error-filter-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.lambda_transformation.name
  pattern        = "ERROR"

  metric_transformation {
    name      = "LambdaErrorCount"
    namespace = "CustomMetrics/${var.environment_suffix}"
    value     = "1"
  }
}

# Custom Metric Alarm for Lambda Error Patterns
resource "aws_cloudwatch_metric_alarm" "lambda_error_pattern" {
  alarm_name          = "lambda-error-pattern-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "LambdaErrorCount"
  namespace           = "CustomMetrics/${var.environment_suffix}"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors Lambda error patterns in logs"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "lambda-error-pattern-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Composite Alarm for Critical Migration Failure
resource "aws_cloudwatch_composite_alarm" "migration_critical" {
  alarm_name        = "migration-critical-${var.environment_suffix}"
  alarm_description = "Composite alarm for critical migration failures"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alerts.arn]

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.dms_replication_lag.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.aurora_cpu.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.high_error_rate.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.lambda_errors.alarm_name})"
  ])

  tags = {
    Name = "migration-critical-alarm-${var.environment_suffix}"
  }
}
