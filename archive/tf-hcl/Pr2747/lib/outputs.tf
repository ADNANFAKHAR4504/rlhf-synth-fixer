output "s3_bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.id
  sensitive   = false
}

output "s3_bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
  sensitive   = false
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.secure_function.function_name
  sensitive   = false
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.secure_function.arn
  sensitive   = false
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
  sensitive   = false
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
  sensitive   = false
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
  sensitive   = false
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.main.arn
  sensitive   = false
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
  sensitive   = false
}

output "kms_key_id" {
  description = "ID of the KMS key for CloudWatch logs"
  value       = aws_kms_key.cloudwatch_logs.key_id
  sensitive   = false
}

output "alarm_name" {
  description = "Name of the CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_error_alarm.alarm_name
  sensitive   = false
}
