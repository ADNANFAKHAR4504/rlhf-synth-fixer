resource "aws_cloudwatch_metric_alarm" "bastion_primary_cpu_high" {
  provider = aws.primary
  alarm_name          = "${var.name_prefix}-${var.environment}-bastion-primary-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm if CPU > 80% for 10 minutes"
  dimensions = {
    InstanceId = aws_instance.bastion_primary.id
  }
  tags = {
    Project = "secure-env"
  }
}

resource "aws_cloudwatch_metric_alarm" "bastion_secondary_cpu_high" {
  provider = aws.secondary
  alarm_name          = "${var.name_prefix}-${var.environment}-bastion-secondary-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alarm if CPU > 80% for 10 minutes"
  dimensions = {
    InstanceId = aws_instance.bastion_secondary.id
  }
  tags = {
    Project = "secure-env"
  }
}