terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary, aws.secondary]
    }
  }
}

# SNS Topic for Alerts (Primary Region)
resource "aws_sns_topic" "alerts" {
  provider = aws.primary

  name = "dr-alerts-${var.environment_suffix}"

  tags = {
    Name = "sns-dr-alerts-${var.environment_suffix}"
  }
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "alerts_email" {
  provider = aws.primary

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.sns_email
}

# CloudWatch Alarm - Primary RDS Replication Lag
resource "aws_cloudwatch_metric_alarm" "primary_replication_lag" {
  provider = aws.primary

  alarm_name          = "rds-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "RDS replication lag exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = var.primary_cluster_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name    = "alarm-rds-lag-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

# CloudWatch Alarm - Primary RDS CPU
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider = aws.primary

  alarm_name          = "rds-cpu-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization high"

  dimensions = {
    DBClusterIdentifier = var.primary_cluster_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name    = "alarm-rds-cpu-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

# CloudWatch Alarm - Primary RDS Connections
resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  provider = aws.primary

  alarm_name          = "rds-connections-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "RDS database connections high"

  dimensions = {
    DBClusterIdentifier = var.primary_cluster_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name    = "alarm-rds-connections-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "dr_monitoring" {
  provider = aws.primary

  dashboard_name = "dr-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      # Multi-region RDS Replication Lag
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "AuroraGlobalDBReplicationLag", {
              stat   = "Average",
              label  = "Primary → Secondary Lag",
              region = "us-east-1"
            }],
            ["...", {
              stat   = "Maximum",
              label  = "Max Lag",
              region = "us-east-1"
            }]
          ]
          period = 60
          stat   = "Average"
          region = "us-east-1"
          title  = "Global Database Replication Lag"
          yAxis = {
            left = {
              min   = 0
              label = "Milliseconds"
            }
          }
          annotations = {
            horizontal = [{
              value = var.replication_lag_threshold * 1000
              label = "Threshold"
              fill  = "above"
            }]
          }
        }
      },
      # Multi-region RDS CPU Utilization
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", {
              stat   = "Average",
              label  = "Primary (us-east-1)",
              region = "us-east-1",
              dimensions = {
                DBClusterIdentifier = var.primary_cluster_id
              }
            }],
            ["...", {
              stat   = "Average",
              label  = "Secondary (us-west-2)",
              region = "us-west-2",
              dimensions = {
                DBClusterIdentifier = var.secondary_cluster_id
              }
            }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS CPU Utilization - Multi-Region"
          yAxis = {
            left = {
              min   = 0
              max   = 100
              label = "Percent"
            }
          }
        }
      },
      # Multi-region Database Connections
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", {
              stat   = "Sum",
              label  = "Primary Connections",
              region = "us-east-1",
              dimensions = {
                DBClusterIdentifier = var.primary_cluster_id
              }
            }],
            ["...", {
              stat   = "Sum",
              label  = "Secondary Connections",
              region = "us-west-2",
              dimensions = {
                DBClusterIdentifier = var.secondary_cluster_id
              }
            }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Database Connections - Multi-Region"
        }
      },
      # Health Check Status
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Route53", "HealthCheckStatus", {
              stat   = "Minimum",
              label  = "Primary Health",
              region = "us-east-1"
            }],
            ["...", {
              stat   = "Minimum",
              label  = "Secondary Health",
              region = "us-west-2"
            }]
          ]
          period = 60
          stat   = "Minimum"
          region = "us-east-1"
          title  = "Route53 Health Check Status"
          yAxis = {
            left = {
              min = 0
              max = 1
            }
          }
        }
      },
      # Lambda Invocations
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", {
              stat   = "Sum",
              label  = "Primary Health Monitor",
              region = "us-east-1"
            }],
            ["...", {
              stat   = "Sum",
              label  = "Secondary Health Monitor",
              region = "us-west-2"
            }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Lambda Health Monitor Invocations"
        }
      },
      # RDS Proxy Connections (if enabled)
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnectionsCurrent", {
              stat   = "Average",
              label  = "Primary Proxy",
              region = "us-east-1"
            }],
            ["...", {
              stat   = "Average",
              label  = "Secondary Proxy",
              region = "us-west-2"
            }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS Proxy Connection Pool"
        }
      },
      # Network Traffic
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "NetworkIn", {
              stat   = "Sum",
              label  = "Primary Network In",
              region = "us-east-1"
            }],
            ["...", {
              stat   = "Sum",
              label  = "Secondary Network In",
              region = "us-west-2"
            }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Network Traffic - Multi-Region"
          yAxis = {
            left = {
              label = "Bytes"
            }
          }
        }
      },
      # S3 Replication Metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "ReplicationLatency", {
              stat   = "Average",
              label  = "Replication Latency",
              region = "us-east-1"
            }],
            [".", "PendingReplicationBytes", {
              stat   = "Average",
              label  = "Pending Bytes",
              region = "us-east-1",
              yAxis  = "right"
            }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "S3 Cross-Region Replication"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
            right = {
              label = "Bytes"
            }
          }
        }
      }
    ]
  })
}
