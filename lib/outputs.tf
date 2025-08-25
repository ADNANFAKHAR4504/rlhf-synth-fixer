output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "security_group_ssh_id" {
  description = "ID of the SSH security group"
  value       = aws_security_group.ssh_access.id
}

output "security_group_web_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web_access.id
}

output "s3_bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.bucket
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.security_key.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.security_key.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main[0].id
}

output "config_recorder_name" {
  description = "Name of the Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "terraform_user_name" {
  description = "Name of the Terraform IAM user"
  value       = aws_iam_user.terraform_user.name
}

output "mfa_role_arn" {
  description = "ARN of the MFA-required role"
  value       = aws_iam_role.mfa_required_role.arn
}