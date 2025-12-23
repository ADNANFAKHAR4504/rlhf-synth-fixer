# Secrets Manager Module Outputs

output "frontend_secret_arn" {
  description = "ARN of the frontend secrets"
  value       = aws_secretsmanager_secret.frontend.arn
}

output "frontend_secret_name" {
  description = "Name of the frontend secrets"
  value       = aws_secretsmanager_secret.frontend.name
}

output "backend_secret_arn" {
  description = "ARN of the backend secrets"
  value       = aws_secretsmanager_secret.backend.arn
}

output "backend_secret_name" {
  description = "Name of the backend secrets"
  value       = aws_secretsmanager_secret.backend.name
}

output "data_processing_secret_arn" {
  description = "ARN of the data processing secrets"
  value       = aws_secretsmanager_secret.data_processing.arn
}

output "data_processing_secret_name" {
  description = "Name of the data processing secrets"
  value       = aws_secretsmanager_secret.data_processing.name
}

output "secrets_access_policy_arn" {
  description = "ARN of the secrets access policy"
  value       = aws_iam_policy.secrets_access.arn
}
