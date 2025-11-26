# Health check for primary database using CloudWatch alarm
resource "aws_route53_health_check" "primary_db" {
  type                            = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.primary_replication_lag.alarm_name
  cloudwatch_alarm_region         = var.primary_region
  insufficient_data_health_status = "Unhealthy"

  tags = merge(
    var.common_tags,
    {
      Name   = "health-check-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# Health check for secondary database using CloudWatch alarm
resource "aws_route53_health_check" "secondary_db" {
  type                            = "CLOUDWATCH_METRIC"
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.secondary_replication_lag.alarm_name
  cloudwatch_alarm_region         = var.secondary_region
  insufficient_data_health_status = "Unhealthy"

  tags = merge(
    var.common_tags,
    {
      Name   = "health-check-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

# IAM role for Route 53 to access CloudWatch
resource "aws_iam_role" "route53_health_check" {
  name = "route53-health-check-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "route53.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "route53-health-check-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy" "route53_health_check" {
  name = "route53-cloudwatch-access-${var.environment_suffix}"
  role = aws_iam_role.route53_health_check.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:DescribeAlarms",
          "cloudwatch:GetMetricStatistics"
        ]
        Resource = "*"
      }
    ]
  })
}
