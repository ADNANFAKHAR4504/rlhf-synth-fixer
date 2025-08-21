output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "s3_policy_arn" {
  description = "ARN of the S3 limited access policy"
  value       = aws_iam_policy.s3_limited_access.arn
}

output "kms_policy_arn" {
  description = "ARN of the KMS limited access policy"
  value       = aws_iam_policy.kms_limited_access.arn
}