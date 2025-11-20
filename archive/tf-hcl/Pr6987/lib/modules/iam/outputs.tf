# modules/iam/outputs.tf

output "lambda_validation_role_arn" {
  description = "ARN of the Lambda validation role"
  value       = aws_iam_role.lambda_validation_role.arn
}

output "lambda_validation_role_name" {
  description = "Name of the Lambda validation role"
  value       = aws_iam_role.lambda_validation_role.name
}

output "lambda_fraud_role_arn" {
  description = "ARN of the Lambda fraud detection role"
  value       = aws_iam_role.lambda_fraud_role.arn
}

output "lambda_fraud_role_name" {
  description = "Name of the Lambda fraud detection role"
  value       = aws_iam_role.lambda_fraud_role.name
}

output "lambda_notification_role_arn" {
  description = "ARN of the Lambda notification role"
  value       = aws_iam_role.lambda_notification_role.arn
}

output "lambda_notification_role_name" {
  description = "Name of the Lambda notification role"
  value       = aws_iam_role.lambda_notification_role.name
}

output "eventbridge_role_arn" {
  description = "ARN of the EventBridge role"
  value       = aws_iam_role.eventbridge_role.arn
}

output "eventbridge_role_name" {
  description = "Name of the EventBridge role"
  value       = aws_iam_role.eventbridge_role.name
}

output "vpc_endpoint_security_group_id" {
  description = "ID of the VPC endpoint security group"
  value       = var.vpc_id != null ? aws_security_group.vpc_endpoint[0].id : null
}