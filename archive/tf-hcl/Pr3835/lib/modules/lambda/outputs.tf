# Lambda Module Outputs

output "function_name" {
  description = "Name of Lambda function"
  value       = aws_lambda_function.failover.function_name
}

output "function_arn" {
  description = "ARN of Lambda function"
  value       = aws_lambda_function.failover.arn
}

output "function_invoke_arn" {
  description = "Invoke ARN of Lambda function"
  value       = aws_lambda_function.failover.invoke_arn
}

output "function_version" {
  description = "Version of Lambda function"
  value       = aws_lambda_function.failover.version
}

