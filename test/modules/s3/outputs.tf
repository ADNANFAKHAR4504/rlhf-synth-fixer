// Outputs for s3 module

output "data_bucket_name" { value = aws_s3_bucket.data.bucket }
output "data_bucket_id" { value = aws_s3_bucket.data.id }
output "data_bucket_arn" { value = aws_s3_bucket.data.arn }

output "logging_bucket_name" { value = aws_s3_bucket.logging.bucket }
output "logging_bucket_id" { value = aws_s3_bucket.logging.id }
output "logging_bucket_arn" { value = aws_s3_bucket.logging.arn }
