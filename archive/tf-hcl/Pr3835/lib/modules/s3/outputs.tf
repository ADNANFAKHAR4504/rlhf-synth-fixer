# S3 Module Outputs

output "primary_bucket_id" {
  description = "ID of the primary data bucket"
  value       = aws_s3_bucket.primary_data.id
}

output "primary_bucket_arn" {
  description = "ARN of the primary data bucket"
  value       = aws_s3_bucket.primary_data.arn
}

output "cfn_bucket_id" {
  description = "ID of the CloudFormation templates bucket"
  value       = aws_s3_bucket.cloudformation_templates.id
}

output "cfn_bucket_arn" {
  description = "ARN of the CloudFormation templates bucket"
  value       = aws_s3_bucket.cloudformation_templates.arn
}

