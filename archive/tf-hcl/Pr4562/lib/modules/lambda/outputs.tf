# modules/lambda/outputs.tf - Lambda Module Outputs

output "function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.traffic_analyzer.arn
}

output "function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.traffic_analyzer.function_name
}

output "function_id" {
  description = "ID of the Lambda function"
  value       = aws_lambda_function.traffic_analyzer.id
}

output "iam_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_traffic_analyzer.arn
}

output "log_group_name" {
  description = "Name of the Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_traffic_analyzer.name
}

output "event_rule_arn" {
  description = "ARN of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.lambda_schedule.arn
}