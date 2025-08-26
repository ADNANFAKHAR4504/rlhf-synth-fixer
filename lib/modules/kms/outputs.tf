output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.secure_key.arn
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.secure_key.key_id
}
