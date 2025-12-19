output "ec2_instance_profile_name" {
  description = "EC2 instance profile name"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "lambda_role_arn" {
  description = "Lambda role ARN"
  value       = aws_iam_role.lambda_role.arn
}

output "backup_role_arn" {
  description = "Backup role ARN"
  value       = aws_iam_role.backup_role.arn
}

