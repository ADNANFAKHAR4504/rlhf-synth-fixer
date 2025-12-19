output "secret_arns" {
  description = "ARNs of the created secrets"
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.arn }
}

output "secret_names" {
  description = "Names of the created secrets"
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.name }
}

output "secrets_access_policy_arn" {
  description = "ARN of the secrets access policy"
  value       = aws_iam_policy.secrets_access.arn
}

output "secret_ids" {
  description = "IDs of the created secrets"
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.id }
}