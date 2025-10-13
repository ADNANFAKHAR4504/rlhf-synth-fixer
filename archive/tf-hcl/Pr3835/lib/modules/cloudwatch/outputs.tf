# CloudWatch Module Outputs

output "lambda_log_group_name" {
  description = "Name of Lambda log group"
  value       = aws_cloudwatch_log_group.lambda_failover.name
}

output "lambda_log_group_arn" {
  description = "ARN of Lambda log group"
  value       = aws_cloudwatch_log_group.lambda_failover.arn
}

output "application_log_group_name" {
  description = "Name of application log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "application_log_group_arn" {
  description = "ARN of application log group"
  value       = aws_cloudwatch_log_group.application.arn
}

output "alarm_names" {
  description = "Map of CloudWatch alarm names"
  value = {
    lambda_errors         = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
    s3_errors             = aws_cloudwatch_metric_alarm.s3_bucket_errors.alarm_name
    lambda_duration       = aws_cloudwatch_metric_alarm.lambda_duration.alarm_name
    lambda_throttles      = aws_cloudwatch_metric_alarm.lambda_throttles.alarm_name
    alb_unhealthy_targets = aws_cloudwatch_metric_alarm.alb_unhealthy_targets.alarm_name
    alb_response_time     = aws_cloudwatch_metric_alarm.alb_response_time.alarm_name
  }
}

