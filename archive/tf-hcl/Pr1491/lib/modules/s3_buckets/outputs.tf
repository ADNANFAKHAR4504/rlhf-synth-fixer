output "primary_bucket_id" {
  value = aws_s3_bucket.primary.id
}

output "primary_bucket_arn" {
  value = aws_s3_bucket.primary.arn
}

output "secondary_bucket_id" {
  value = aws_s3_bucket.secondary.id
}

output "secondary_bucket_arn" {
  value = aws_s3_bucket.secondary.arn
}

output "logging_bucket_id" {
  value = aws_s3_bucket.logging.id
}

output "logging_bucket_arn" {
  value = aws_s3_bucket.logging.arn
}

output "primary_bucket_name" {
  value = aws_s3_bucket.primary.bucket
}

output "secondary_bucket_name" {
  value = aws_s3_bucket.secondary.bucket
}

output "logging_bucket_name" {
  value = aws_s3_bucket.logging.bucket
}
