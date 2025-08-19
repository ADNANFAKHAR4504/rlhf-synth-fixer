output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key"
  value       = aws_kms_key.main.arn
}


output "vpc_endpoint_s3_id" {
  description = "The ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}
