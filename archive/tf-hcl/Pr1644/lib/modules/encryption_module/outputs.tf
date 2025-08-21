output "ebs_encryption_enabled_primary" {
  description = "Whether EBS encryption is enabled in primary region"
  value       = aws_ebs_encryption_by_default.primary.enabled
}

output "ebs_encryption_enabled_secondary" {
  description = "Whether EBS encryption is enabled in secondary region"
  value       = aws_ebs_encryption_by_default.secondary.enabled
}