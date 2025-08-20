output "bucket_names" {
  description = "Names of the S3 buckets"
  value = {
    app_data = aws_s3_bucket.app_data.bucket
    logs     = aws_s3_bucket.logs.bucket
    backups  = aws_s3_bucket.backups.bucket
  }
}

output "bucket_arns" {
  description = "ARNs of the S3 buckets"
  value = [
    aws_s3_bucket.app_data.arn,
    aws_s3_bucket.logs.arn,
    aws_s3_bucket.backups.arn
  ]
}

output "app_data_bucket_name" {
  description = "Name of the app data bucket"
  value       = aws_s3_bucket.app_data.bucket
}

output "logs_bucket_name" {
  description = "Name of the logs bucket"
  value       = aws_s3_bucket.logs.bucket
}

output "backups_bucket_name" {
  description = "Name of the backups bucket"
  value       = aws_s3_bucket.backups.bucket
}