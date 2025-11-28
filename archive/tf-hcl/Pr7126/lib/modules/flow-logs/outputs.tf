output "s3_bucket_id" {
  description = "S3 bucket ID for flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for flow logs"
  value       = aws_s3_bucket.flow_logs.arn
}

output "flow_log_ids" {
  description = "List of VPC Flow Log IDs"
  value       = aws_flow_log.vpc_flow_logs[*].id
}
