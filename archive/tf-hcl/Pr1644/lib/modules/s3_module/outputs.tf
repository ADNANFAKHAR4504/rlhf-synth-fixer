output "s3_audit_bucket_names" {
  description = "S3 bucket names for audit logs"
  value = {
    primary   = aws_s3_bucket.audit_logs_primary.id
    secondary = aws_s3_bucket.audit_logs_secondary.id
  }
}

output "s3_audit_bucket_arns" {
  description = "S3 bucket ARNs for audit logs"
  value = {
    primary   = aws_s3_bucket.audit_logs_primary.arn
    secondary = aws_s3_bucket.audit_logs_secondary.arn
  }
}