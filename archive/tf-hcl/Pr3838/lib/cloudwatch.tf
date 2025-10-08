resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", label = "Total Requests" }],
            [".", "TargetResponseTime", { stat = "Average", label = "Response Time" }],
            [".", "HTTPCode_Target_2XX_Count", { stat = "Sum", label = "2XX Responses" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum", label = "5XX Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "Average", label = "CPU Utilization" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EC2 CPU Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "Database CPU" }],
            [".", "DatabaseConnections", { stat = "Sum", label = "DB Connections" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Aurora Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average", label = "Redis CPU" }],
            [".", "CacheHits", { stat = "Sum", label = "Cache Hits" }],
            [".", "CacheMisses", { stat = "Sum", label = "Cache Misses" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Redis Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", { stat = "Sum", label = "CloudFront Requests" }],
            [".", "BytesDownloaded", { stat = "Sum", label = "Bytes Downloaded" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "CloudFront Metrics"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "${local.name_prefix}-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0

  dimensions = {
    TargetGroup  = aws_lb_target_group.web.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_description = "This metric monitors unhealthy hosts behind ALB"
}

resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${local.name_prefix}-database-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  alarm_description = "This metric monitors Aurora CPU utilization"
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${local.name_prefix}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 75

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.redis.id}-001"
  }

  alarm_description = "This metric monitors Redis CPU utilization"
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ec2/${local.name_prefix}"
  retention_in_days = 7

  tags = {
    Name        = "${local.name_prefix}-log-group"
    Environment = var.environment
  }
}
