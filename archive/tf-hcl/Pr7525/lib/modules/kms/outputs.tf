output "key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.id
}

output "key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "key_alias_arn" {
  description = "KMS key alias ARN"
  value       = aws_kms_alias.main.arn
}