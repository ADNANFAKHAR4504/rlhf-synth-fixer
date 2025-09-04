output "key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "alias_name" {
  description = "Alias name of the KMS key"
  value       = aws_kms_alias.main.name
}

output "alias_arn" {
  description = "ARN of the KMS alias"
  value       = aws_kms_alias.main.arn
}
