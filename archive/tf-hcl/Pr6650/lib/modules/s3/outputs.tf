output "primary_bucket_name" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.id
}

output "primary_bucket_arn" {
  description = "Primary S3 bucket ARN"
  value       = aws_s3_bucket.primary.arn
}

output "secondary_bucket_name" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary.id
}

output "secondary_bucket_arn" {
  description = "Secondary S3 bucket ARN"
  value       = aws_s3_bucket.secondary.arn
}

output "replication_role_arn" {
  description = "S3 replication IAM role ARN"
  value       = aws_iam_role.replication.arn
}
