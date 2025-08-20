output "primary_key_id" {
  value       = aws_kms_key.primary.key_id
  description = "Primary KMS key id"
}

output "primary_key_arn" {
  value       = aws_kms_key.primary.arn
  description = "Primary KMS key arn"
}

output "secondary_key_id" {
  value       = aws_kms_key.secondary.key_id
  description = "Secondary KMS key id"
}

output "secondary_key_arn" {
  value       = aws_kms_key.secondary.arn
  description = "Secondary KMS key arn"
}
