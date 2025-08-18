######################
# Networking Outputs
######################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

######################
# Storage Outputs
######################

output "s3_data_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = aws_s3_bucket.data.bucket
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = data.aws_kms_key.main.arn
}

######################
# IAM Outputs
######################

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = data.aws_iam_user.app_user.user_name
}
