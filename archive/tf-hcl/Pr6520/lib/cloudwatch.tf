# CloudWatch Log Group for ECS Tasks
resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/ecs/payment-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "payment-ecs-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for Aurora PostgreSQL
resource "aws_cloudwatch_log_group" "aurora_postgresql" {
  name              = "/aws/rds/cluster/payment-aurora-${var.environment_suffix}/postgresql"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "payment-aurora-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - ALB Unhealthy Hosts (Blue)
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts_blue" {
  alarm_name          = "payment-alb-unhealthy-hosts-blue-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alert when blue environment has unhealthy hosts"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
  }

  tags = {
    Name        = "payment-alarm-unhealthy-blue-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - ALB Unhealthy Hosts (Green)
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts_green" {
  alarm_name          = "payment-alb-unhealthy-hosts-green-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alert when green environment has unhealthy hosts"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.green.arn_suffix
  }

  tags = {
    Name        = "payment-alarm-unhealthy-green-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - ECS CPU Utilization (Blue)
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_blue" {
  alarm_name          = "payment-ecs-cpu-high-blue-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when blue ECS service CPU is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.blue.name
  }

  tags = {
    Name        = "payment-alarm-cpu-blue-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - ECS Memory Utilization (Blue)
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_blue" {
  alarm_name          = "payment-ecs-memory-high-blue-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when blue ECS service memory is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.blue.name
  }

  tags = {
    Name        = "payment-alarm-memory-blue-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - Aurora CPU Utilization
resource "aws_cloudwatch_metric_alarm" "aurora_cpu_high" {
  alarm_name          = "payment-aurora-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when Aurora CPU utilization is high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_postgresql.cluster_identifier
  }

  tags = {
    Name        = "payment-alarm-aurora-cpu-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Alarm - Aurora Database Connections
resource "aws_cloudwatch_metric_alarm" "aurora_connections_high" {
  alarm_name          = "payment-aurora-connections-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when Aurora database connections are high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_postgresql.cluster_identifier
  }

  tags = {
    Name        = "payment-alarm-aurora-connections-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
