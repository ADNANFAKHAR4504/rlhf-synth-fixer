output "validator_arn" {
  description = "Validator Lambda ARN"
  value       = aws_lambda_function.validator.arn
}

output "cache_updater_arns" {
  description = "Cache updater Lambda ARNs"
  value       = aws_lambda_function.cache_updater[*].arn
}

output "consistency_checker_arn" {
  description = "Consistency checker Lambda ARN"
  value       = aws_lambda_function.consistency_checker.arn
}

output "rollback_arn" {
  description = "Rollback Lambda ARN"
  value       = aws_lambda_function.rollback.arn
}

output "validator_function_name" {
  description = "Validator Lambda function name"
  value       = aws_lambda_function.validator.function_name
}

output "consistency_checker_function_name" {
  description = "Consistency checker Lambda function name"
  value       = aws_lambda_function.consistency_checker.function_name
}

output "rollback_function_name" {
  description = "Rollback Lambda function name"
  value       = aws_lambda_function.rollback.function_name
}
