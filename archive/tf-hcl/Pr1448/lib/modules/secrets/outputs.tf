output "database_secret_arn" {
  description = "ARN of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.database.arn
}

output "database_secret_name" {
  description = "Name of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.database.name
}

output "secrets_access_policy_arn" {
  description = "ARN of the IAM policy for accessing secrets"
  value       = aws_iam_policy.secrets_access.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.secrets.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.secrets.key_id
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.arn
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.name
}

output "database_password" {
  description = "The generated database password (sensitive)"
  value       = random_password.database.result
  sensitive   = true
}
