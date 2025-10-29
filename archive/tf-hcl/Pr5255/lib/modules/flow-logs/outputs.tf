output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.flow_logs.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.flow_logs.arn
}

output "flow_log_ids" {
  description = "Map of Flow Log IDs"
  value       = { for k, v in aws_flow_log.this : k => v.id }
}
