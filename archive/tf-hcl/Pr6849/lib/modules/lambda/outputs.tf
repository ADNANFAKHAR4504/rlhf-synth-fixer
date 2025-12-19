output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.main.function_name
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "function_url" {
  description = "Lambda function URL"
  value       = aws_lambda_function_url.main.function_url
}

output "invoke_arn" {
  description = "Lambda invoke ARN"
  value       = aws_lambda_function.main.invoke_arn
}
