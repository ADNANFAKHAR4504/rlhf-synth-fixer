output "rds_primary_key_arn" {
  description = "ARN of primary RDS KMS key"
  value       = aws_kms_key.rds_primary.arn
}

output "rds_secondary_key_arn" {
  description = "ARN of secondary RDS KMS key"
  value       = aws_kms_key.rds_secondary.arn
}

