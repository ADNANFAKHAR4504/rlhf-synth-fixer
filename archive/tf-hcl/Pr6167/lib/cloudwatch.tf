# CloudWatch Dashboard for Migration Monitoring
resource "aws_cloudwatch_dashboard" "migration" {
  dashboard_name = "migration-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "CDCLatencySource", { stat = "Average" }],
            [".", "CDCLatencyTarget", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "DMS Replication Lag"
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
            ["AWS/ECS", "CPUUtilization", { stat = "Average", dimensions = { ServiceName = aws_ecs_service.app.name, ClusterName = aws_ecs_cluster.main.name } }],
            [".", "MemoryUtilization", { stat = "Average", dimensions = { ServiceName = aws_ecs_service.app.name, ClusterName = aws_ecs_cluster.main.name } }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Resource Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", dimensions = { LoadBalancer = aws_lb.main.arn_suffix } }],
            [".", "RequestCount", { stat = "Sum", dimensions = { LoadBalancer = aws_lb.main.arn_suffix } }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Performance Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", dimensions = { DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier } }],
            [".", "CPUUtilization", { stat = "Average", dimensions = { DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier } }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Aurora Database Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Route53", "HealthCheckStatus", { stat = "Minimum", dimensions = { HealthCheckId = aws_route53_health_check.alb.id } }]
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
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "rollback_lambda" {
  name              = "/aws/lambda/rollback-${var.environment_suffix}"
  retention_in_days = 14

  tags = {
    Name = "rollback-lambda-logs-${var.environment_suffix}"
  }
}

# CloudWatch Alarms for Migration Status

# DMS Replication Lag Alarm
resource "aws_cloudwatch_metric_alarm" "dms_lag" {
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CDCLatencySource"
  namespace           = "AWS/DMS"
  period              = 300
  statistic           = "Average"
  threshold           = 60
  alarm_description   = "DMS replication lag exceeds 60 seconds"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main.replication_instance_id
  }

  tags = {
    Name = "dms-lag-alarm-${var.environment_suffix}"
  }
}

# ECS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "ecs-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS CPU utilization is high"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "ecs-cpu-alarm-${var.environment_suffix}"
  }
}

# ALB Target Unhealthy Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "alb-unhealthy-targets-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "ALB has unhealthy targets"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn, aws_lambda_function.rollback.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  tags = {
    Name = "alb-unhealthy-alarm-${var.environment_suffix}"
  }
}

# ALB 5XX Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High rate of 5XX errors from ALB targets"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn, aws_lambda_function.rollback.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "alb-5xx-alarm-${var.environment_suffix}"
  }
}

# RDS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is high"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = {
    Name = "rds-cpu-alarm-${var.environment_suffix}"
  }
}