output "logs_bucket_arn" {
  description = "ARN of the S3 logs bucket"
  value       = aws_s3_bucket.logs.arn
}

output "logs_bucket_id" {
  description = "ID of the S3 logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "db_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}
