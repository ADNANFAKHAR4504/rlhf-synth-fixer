resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "Average", id = "m1", label = "Average CPU" }],
            [".", ".", { stat = "Maximum", id = "m2", label = "Max CPU" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EC2 CPU Utilization"
          period  = 300
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
            ["AWS/EC2", "NetworkIn", { stat = "Sum", id = "m1", label = "Network In" }],
            [".", "NetworkOut", { stat = "Sum", id = "m2", label = "Network Out" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Network Traffic"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "StatusCheckFailed", { stat = "Maximum", id = "m1", label = "Status Check Failed" }],
            [".", "StatusCheckFailed_Instance", { stat = "Maximum", id = "m2", label = "Instance Check Failed" }],
            [".", "StatusCheckFailed_System", { stat = "Maximum", id = "m3", label = "System Check Failed" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Instance Status Checks"
          period  = 60
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUCreditBalance", { stat = "Average", id = "m1", label = "CPU Credit Balance" }],
            [".", "CPUCreditUsage", { stat = "Average", id = "m2", label = "CPU Credit Usage" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "T3 Instance CPU Credits"
          period  = 300
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = []

  dimensions = {
    InstanceId = aws_instance.web_1.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-high-cpu-alarm"
  })
}

resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/aws/ec2/nginx-${local.name_prefix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nginx-logs"
  })
}