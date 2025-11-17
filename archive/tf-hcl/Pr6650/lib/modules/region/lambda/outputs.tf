output "health_monitor_function_arn" {
  description = "Health monitor Lambda function ARN"
  value       = aws_lambda_function.health_monitor.arn
}

output "health_monitor_function_name" {
  description = "Health monitor Lambda function name"
  value       = aws_lambda_function.health_monitor.function_name
}

output "failover_function_arn" {
  description = "Failover Lambda function ARN"
  value       = aws_lambda_function.failover_trigger.arn
}

output "failover_function_name" {
  description = "Failover Lambda function name"
  value       = aws_lambda_function.failover_trigger.function_name
}

output "lambda_role_arn" {
  description = "Lambda IAM role ARN"
  value       = aws_iam_role.lambda.arn
}
