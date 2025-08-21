// Outputs for lambda module

output "lambda_function_name" {
  value = aws_lambda_function.sg_remediation.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.sg_remediation.arn
}
