output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "access_logs_bucket_name" {
  description = "Access logs bucket name"
  value       = aws_s3_bucket.access_logs.bucket
}

output "log_bucket_arn" {
    description = "ARN of access logs bucket"
    value = aws_s3_bucket.access_logs.arn
}

output "log_bucket_domain" {
    description = "Log bucket domain"
    value = aws_s3_bucket.access_logs.bucket_domain_name
}

output "cloudfront_access_identity_path" {
    value = aws_cloudfront_origin_access_identity.turingblacree_oai.cloudfront_access_identity_path
}

output "cloudfront_distribution_arn" {
    value = aws_cloudfront_origin_access_identity.turingblacree_oai.arn
}