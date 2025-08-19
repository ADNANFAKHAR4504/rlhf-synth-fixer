resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/ec2/${var.environment}/${var.region}/messages"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-app-logs-${var.region}"
  })
}

resource "aws_cloudwatch_log_group" "rds_logs" {
  name              = "/aws/rds/instance/${var.environment}-postgres-${var.region}/postgresql"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-rds-logs-${var.region}"
  })
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-dashboard-${var.region}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "${var.environment}-asg-${var.region}"],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${var.environment}-alb-${var.region}"]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "EC2 and ALB Metrics"
        }
      }
    ]
  })
}