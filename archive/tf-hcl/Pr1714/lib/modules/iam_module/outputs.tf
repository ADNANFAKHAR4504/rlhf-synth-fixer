output "role_arn" {
  description = "IAM role ARN"
  value       = aws_iam_role.app_role.arn
}

output "role_name" {
  description = "IAM role name"
  value       = aws_iam_role.app_role.name
}

output "instance_profile_name" {
  description = "IAM instance profile name"
  value       = aws_iam_instance_profile.app_profile.name
}

output "iam_user_name" {
  description = "IAM user name"
  value       = aws_iam_user.app_user.name
}