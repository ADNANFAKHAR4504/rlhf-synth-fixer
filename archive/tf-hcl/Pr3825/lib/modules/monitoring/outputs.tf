output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "alarm_arns" {
  description = "CloudWatch alarm ARNs"
  value = {
    primary_alb_unhealthy  = aws_cloudwatch_metric_alarm.primary_alb_unhealthy.arn
    primary_db_connections = aws_cloudwatch_metric_alarm.primary_db_connections.arn
    primary_region_failure = aws_cloudwatch_metric_alarm.primary_region_failure.arn
    lambda_errors          = aws_cloudwatch_metric_alarm.lambda_errors.arn
    alb_latency            = aws_cloudwatch_metric_alarm.primary_alb_latency.arn
    dynamodb_throttles     = aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
  }
}

