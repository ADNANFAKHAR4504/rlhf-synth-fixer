resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/ec2/${var.environment}/${var.region}/messages-${var.common_tags.UniqueSuffix}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-app-logs-${var.region}-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_cloudwatch_log_group" "rds_logs" {
  name              = "/aws/rds/instance/${var.environment}-postgres-${var.region}-${var.common_tags.UniqueSuffix}/postgresql"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-rds-logs-${var.region}-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-dashboard-${var.region}-${var.common_tags.UniqueSuffix}"

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
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "${var.environment}-asg-${var.region}-${var.common_tags.UniqueSuffix}"],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${var.environment}-alb-${var.region}-${var.common_tags.UniqueSuffix}"]
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
