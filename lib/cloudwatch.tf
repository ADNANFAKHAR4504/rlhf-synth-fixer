# CloudWatch Log Groups for Primary
resource "aws_cloudwatch_log_group" "primary_app" {
  provider          = aws.primary
  name              = "/aws/ec2/app-primary-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name    = "log-group-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Log Groups for Secondary
resource "aws_cloudwatch_log_group" "secondary_app" {
  provider          = aws.secondary
  name              = "/aws/ec2/app-secondary-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name    = "log-group-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# SNS Topic for Alarms (Primary)
resource "aws_sns_topic" "primary_alarms" {
  provider = aws.primary
  name     = "dr-alarms-primary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "sns-alarms-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# SNS Topic for Alarms (Secondary)
resource "aws_sns_topic" "secondary_alarms" {
  provider = aws.secondary
  name     = "dr-alarms-secondary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "sns-alarms-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# CloudWatch Alarm: Primary Aurora Database Lag
resource "aws_cloudwatch_metric_alarm" "primary_aurora_lag" {
  provider            = aws.primary
  alarm_name          = "aurora-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 60000 # 60 seconds in milliseconds
  alarm_description   = "Aurora Global Database replication lag exceeds threshold"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-aurora-lag-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Alarm: Primary ALB Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "primary_alb_unhealthy" {
  provider            = aws.primary
  alarm_name          = "alb-unhealthy-hosts-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Primary ALB has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-alb-unhealthy-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Alarm: Secondary ALB Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "secondary_alb_unhealthy" {
  provider            = aws.secondary
  alarm_name          = "alb-unhealthy-hosts-secondary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Secondary ALB has unhealthy hosts"
  alarm_actions       = [aws_sns_topic.secondary_alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
    TargetGroup  = aws_lb_target_group.secondary.arn_suffix
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-alb-unhealthy-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# CloudWatch Alarm: S3 Replication Status
resource "aws_cloudwatch_metric_alarm" "s3_replication" {
  provider            = aws.primary
  alarm_name          = "s3-replication-status-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/S3"
  period              = 900 # 15 minutes
  statistic           = "Average"
  threshold           = 900000 # 15 minutes in milliseconds
  alarm_description   = "S3 replication latency exceeds RTC SLA"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    SourceBucket      = aws_s3_bucket.primary.id
    DestinationBucket = aws_s3_bucket.secondary.id
    RuleId            = "replicate-all"
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-s3-replication-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Alarm: Primary Route53 Health Check
resource "aws_cloudwatch_metric_alarm" "route53_primary_health" {
  provider            = aws.primary
  alarm_name          = "route53-health-primary-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Primary endpoint health check failed"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  tags = merge(local.common_tags, {
    Name    = "alarm-route53-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# CloudWatch Dashboard (Primary Region)
resource "aws_cloudwatch_dashboard" "primary" {
  provider       = aws.primary
  dashboard_name = "dr-dashboard-primary-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", region = var.primary_region }],
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", region = var.primary_region }],
            ["AWS/RDS", "AuroraGlobalDBReplicationLag", { stat = "Average", region = var.primary_region }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "Aurora Primary Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", region = var.primary_region }],
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", region = var.primary_region }],
            ["AWS/ApplicationELB", "HealthyHostCount", { stat = "Average", region = var.primary_region }],
            ["AWS/ApplicationELB", "UnHealthyHostCount", { stat = "Average", region = var.primary_region }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "ALB Primary Metrics"
        }
      }
    ]
  })
}

# CloudWatch Dashboard (Secondary Region)
resource "aws_cloudwatch_dashboard" "secondary" {
  provider       = aws.secondary
  dashboard_name = "dr-dashboard-secondary-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", region = var.secondary_region }],
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", region = var.secondary_region }]
          ]
          period = 300
          stat   = "Average"
          region = var.secondary_region
          title  = "Aurora Secondary Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", region = var.secondary_region }],
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum", region = var.secondary_region }],
            ["AWS/ApplicationELB", "HealthyHostCount", { stat = "Average", region = var.secondary_region }],
            ["AWS/ApplicationELB", "UnHealthyHostCount", { stat = "Average", region = var.secondary_region }]
          ]
          period = 300
          stat   = "Average"
          region = var.secondary_region
          title  = "ALB Secondary Metrics"
        }
      }
    ]
  })
}
