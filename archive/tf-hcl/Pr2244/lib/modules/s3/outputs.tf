output "app_data_bucket_us_east_1" {
  description = "Name of the application data bucket in us-east-1"
  value       = aws_s3_bucket.app_data_us_east_1.bucket
}

output "app_data_bucket_us_west_2" {
  description = "Name of the application data bucket in us-west-2"
  value       = aws_s3_bucket.app_data_us_west_2.bucket
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "config_bucket_us_east_1" {
  description = "Name of the Config S3 bucket in us-east-1"
  value       = aws_s3_bucket.config_us_east_1.bucket
}

output "config_bucket_us_west_2" {
  description = "Name of the Config S3 bucket in us-west-2"
  value       = aws_s3_bucket.config_us_west_2.bucket
}